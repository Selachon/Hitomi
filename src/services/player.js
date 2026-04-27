import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  getVoiceConnection,
} from '@discordjs/voice';
import { getYouTubeStream } from './youtube.js';
import { Config, Emoji } from '../utils/constants.js';
import { nowPlayingEmbed, goodbyeEmbed } from '../utils/embeds.js';

// Map de colas por servidor
const queues = new Map();
const VOICE_READY_TIMEOUT = 60_000;
const VOICE_CONNECT_RETRIES = 2;

/**
 * Obtiene o crea una cola para un servidor
 */
export function getQueue(guildId) {
  return queues.get(guildId);
}

/**
 * Crea una nueva cola para un servidor
 */
export function createQueue(guildId, textChannel) {
  const queue = {
    guildId,
    textChannel,
    songs: [],
    currentSong: null,
    player: createAudioPlayer(),
    connection: null,
    volume: Config.DEFAULT_VOLUME / 100,
    playing: false,
    inactivityTimer: null,
  };
  
  queues.set(guildId, queue);
  setupPlayerEvents(queue);
  
  return queue;
}

/**
 * Elimina la cola de un servidor
 */
export function deleteQueue(guildId) {
  const queue = queues.get(guildId);
  if (queue) {
    clearInactivityTimer(queue);
    if (queue.connection) {
      queue.connection.destroy();
    }
    queues.delete(guildId);
  }
}

/**
 * Configura eventos del reproductor
 */
function setupPlayerEvents(queue) {
  queue.player.on(AudioPlayerStatus.Idle, async () => {
    queue.currentSong = null;
    queue.playing = false;
    
    if (queue.songs.length > 0) {
      await playNext(queue);
    } else {
      startInactivityTimer(queue);
    }
  });
  
  queue.player.on('error', error => {
    console.error('Error en reproductor:', error);
    queue.currentSong = null;
    queue.playing = false;
    
    if (queue.songs.length > 0) {
      playNext(queue);
    } else {
      startInactivityTimer(queue);
    }
  });
}

/**
 * Conecta al canal de voz
 */
export async function connectToChannel(channel, queue) {
  let lastError;

  for (let attempt = 1; attempt <= VOICE_CONNECT_RETRIES; attempt++) {
    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
      selfDeaf: true,
    });

    try {
      await entersState(connection, VoiceConnectionStatus.Ready, VOICE_READY_TIMEOUT);
      connection.subscribe(queue.player);
      queue.connection = connection;

      // Manejar desconexion
      connection.on(VoiceConnectionStatus.Disconnected, async () => {
        try {
          await Promise.race([
            entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
            entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
          ]);
        } catch {
          try {
            await entersState(connection, VoiceConnectionStatus.Connecting, 10_000);
          } catch {
            deleteQueue(queue.guildId);
          }
        }
      });

      return connection;
    } catch (error) {
      lastError = error;
      connection.destroy();

      if (attempt < VOICE_CONNECT_RETRIES) {
        console.warn(`Conexion de voz fallida (intento ${attempt}/${VOICE_CONNECT_RETRIES}), reintentando...`);
      }
    }
  }

  throw lastError;
}

/**
 * Agrega una cancion a la cola
 */
export function addToQueue(queue, song) {
  if (queue.songs.length >= Config.MAX_QUEUE_SIZE) {
    return false;
  }
  
  queue.songs.push(song);
  clearInactivityTimer(queue);
  
  return true;
}

/**
 * Reproduce la siguiente cancion
 */
export async function playNext(queue) {
  if (queue.songs.length === 0) {
    queue.currentSong = null;
    queue.playing = false;
    startInactivityTimer(queue);
    return false;
  }
  
  const song = queue.songs.shift();
  queue.currentSong = song;
  
  // Validar que la cancion tenga URL
  if (!song.url) {
    console.error('Cancion sin URL:', song);
    queue.currentSong = null;
    // Intentar con la siguiente
    if (queue.songs.length > 0) {
      return playNext(queue);
    }
    startInactivityTimer(queue);
    return false;
  }
  
  try {
    const { stream, type, process: ytdlpProcess } = await getYouTubeStream(song.url);
    
    // Guardar proceso para poder matarlo despues
    queue.currentProcess = ytdlpProcess;
    
    const resource = createAudioResource(stream, {
      inputType: type,
      inlineVolume: true,
    });
    
    resource.volume?.setVolume(queue.volume);
    queue.player.play(resource);
    queue.playing = true;
    queue.resource = resource;
    
    clearInactivityTimer(queue);
    
    // Enviar embed de "ahora suena"
    if (queue.textChannel) {
      try {
        await queue.textChannel.send({ embeds: [nowPlayingEmbed(song)] });
      } catch (error) {
        console.error('Error enviando mensaje:', error);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error reproduciendo:', error);
    queue.currentSong = null;
    
    // Matar proceso si existe
    if (queue.currentProcess) {
      try {
        queue.currentProcess.kill();
      } catch (e) {}
      queue.currentProcess = null;
    }
    
    // Intentar con la siguiente
    if (queue.songs.length > 0) {
      return playNext(queue);
    }
    
    startInactivityTimer(queue);
    return false;
  }
}

/**
 * Pausa la reproduccion
 */
export function pause(queue) {
  if (queue.player && queue.playing) {
    queue.player.pause();
    queue.playing = false;
    return true;
  }
  return false;
}

/**
 * Reanuda la reproduccion
 */
export function resume(queue) {
  if (queue.player && !queue.playing && queue.currentSong) {
    queue.player.unpause();
    queue.playing = true;
    return true;
  }
  return false;
}

/**
 * Mezcla aleatoriamente la cola (Fisher-Yates shuffle)
 */
export function shuffleQueue(queue) {
  if (queue.songs.length <= 1) {
    return false;
  }

  for (let i = queue.songs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [queue.songs[i], queue.songs[j]] = [queue.songs[j], queue.songs[i]];
  }

  return true;
}

/**
 * Salta la cancion actual
 */
export function skip(queue) {
  // Matar proceso de yt-dlp si existe
  if (queue.currentProcess) {
    try {
      queue.currentProcess.kill();
    } catch (e) {}
    queue.currentProcess = null;
  }
  
  if (queue.player) {
    queue.player.stop();
    return true;
  }
  return false;
}

/**
 * Detiene la reproduccion y limpia la cola
 */
export function stop(queue) {
  queue.songs = [];
  queue.currentSong = null;
  
  // Matar proceso de yt-dlp si existe
  if (queue.currentProcess) {
    try {
      queue.currentProcess.kill();
    } catch (e) {}
    queue.currentProcess = null;
  }
  
  if (queue.player) {
    queue.player.stop();
  }
  
  deleteQueue(queue.guildId);
  return true;
}

/**
 * Cambia el volumen
 */
export function setVolume(queue, volume) {
  queue.volume = volume / 100;
  
  if (queue.resource?.volume) {
    queue.resource.volume.setVolume(queue.volume);
  }
  
  return true;
}

/**
 * Inicia el timer de inactividad
 */
function startInactivityTimer(queue) {
  clearInactivityTimer(queue);
  
  queue.inactivityTimer = setTimeout(async () => {
    // Enviar mensaje de despedida
    if (queue.textChannel) {
      try {
        await queue.textChannel.send({ embeds: [goodbyeEmbed()] });
      } catch (error) {
        console.error('Error enviando mensaje de despedida:', error);
      }
    }
    
    deleteQueue(queue.guildId);
  }, Config.INACTIVITY_TIMEOUT);
}

/**
 * Limpia el timer de inactividad
 */
function clearInactivityTimer(queue) {
  if (queue.inactivityTimer) {
    clearTimeout(queue.inactivityTimer);
    queue.inactivityTimer = null;
  }
}

/**
 * Verifica si hay conexion activa
 */
export function hasConnection(guildId) {
  return getVoiceConnection(guildId) !== undefined;
}
