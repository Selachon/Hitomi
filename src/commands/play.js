import { SlashCommandBuilder, ComponentType } from 'discord.js';
import { isYouTubeUrl, searchYouTube, getYouTubeInfo } from '../services/youtube.js';
import { isSpotifyUrl, isSpotifyTrack, isSpotifyPlaylist, getSpotifyTrack, getSpotifyPlaylist, convertSpotifyToYouTube } from '../services/spotify.js';
import { getQueue, createQueue, addToQueue, playNext, connectToChannel } from '../services/player.js';
import { Config, Messages, Emoji } from '../utils/constants.js';
import { 
  searchResultsEmbed, 
  searchButtons, 
  addedToQueueEmbed, 
  errorEmbed,
  infoEmbed,
  playlistAddedEmbed 
} from '../utils/embeds.js';

export const data = new SlashCommandBuilder()
  .setName('play')
  .setDescription('Reproduce una cancion o agrega a la cola')
  .addStringOption(option =>
    option
      .setName('cancion')
      .setDescription('Nombre de la cancion o URL (YouTube/Spotify)')
      .setRequired(true)
  );

export async function execute(interaction) {
  const query = interaction.options.getString('cancion');
  const member = interaction.member;
  const voiceChannel = member.voice.channel;
  
  // Verificar que esta en un canal de voz
  if (!voiceChannel) {
    return interaction.reply({ 
      embeds: [errorEmbed(Messages.NOT_IN_VOICE)], 
      ephemeral: true 
    });
  }
  
  await interaction.deferReply();
  
  try {
    // Obtener o crear cola
    let queue = getQueue(interaction.guildId);
    if (!queue) {
      queue = createQueue(interaction.guildId, interaction.channel);
      await connectToChannel(voiceChannel, queue);
    }
    
    // Detectar tipo de URL
    if (isSpotifyUrl(query)) {
      await handleSpotify(interaction, queue, query);
    } else if (isYouTubeUrl(query)) {
      await handleYouTubeUrl(interaction, queue, query);
    } else {
      await handleSearch(interaction, queue, query);
    }
  } catch (error) {
    console.error('Error en comando play:', error);
    await interaction.editReply({ 
      embeds: [errorEmbed('Ocurrio un error al procesar tu solicitud...')] 
    });
  }
}

/**
 * Maneja URLs de Spotify
 */
async function handleSpotify(interaction, queue, url) {
  await interaction.editReply({ 
    embeds: [infoEmbed(Messages.SPOTIFY_DETECTED, `${Emoji.LOADING} Procesando...`)] 
  });
  
  if (isSpotifyPlaylist(url)) {
    // Es una playlist o album
    const playlistData = await getSpotifyPlaylist(url);
    
    if (playlistData.tracks.length === 0) {
      return interaction.editReply({ 
        embeds: [errorEmbed('No pude obtener las canciones de la playlist...')] 
      });
    }
    
    await interaction.editReply({ 
      embeds: [infoEmbed(
        `${Emoji.PLAYLIST} ${playlistData.name}`,
        `${Emoji.LOADING} Convirtiendo ${playlistData.tracks.length} canciones a YouTube...\nEsto puede tomar un momento~`
      )] 
    });
    
    // Convertir a YouTube
    const songs = await convertSpotifyToYouTube(playlistData.tracks);
    
    if (songs.length === 0) {
      return interaction.editReply({ 
        embeds: [errorEmbed('No pude encontrar ninguna cancion en YouTube...')] 
      });
    }
    
    // Agregar todas a la cola
    let added = 0;
    for (const song of songs) {
      song.requestedBy = interaction.user.id;
      if (addToQueue(queue, song)) {
        added++;
      }
    }
    
    // Si no hay nada reproduciendose, empezar
    if (!queue.currentSong) {
      await playNext(queue);
    }
    
    await interaction.editReply({ 
      embeds: [playlistAddedEmbed(playlistData.name, playlistData.totalTracks, added)] 
    });
    
  } else if (isSpotifyTrack(url)) {
    // Es un track individual
    const song = await getSpotifyTrack(url);
    
    if (!song) {
      return interaction.editReply({ 
        embeds: [errorEmbed('No pude encontrar esa cancion en YouTube...')] 
      });
    }
    
    song.requestedBy = interaction.user.id;
    await addSongToQueue(interaction, queue, song);
  } else {
    return interaction.editReply({ 
      embeds: [errorEmbed('URL de Spotify no reconocida...')] 
    });
  }
}

/**
 * Maneja URLs directas de YouTube
 */
async function handleYouTubeUrl(interaction, queue, url) {
  const song = await getYouTubeInfo(url);
  
  if (!song) {
    return interaction.editReply({ 
      embeds: [errorEmbed('No pude obtener informacion de ese video...')] 
    });
  }
  
  song.requestedBy = interaction.user.id;
  await addSongToQueue(interaction, queue, song);
}

/**
 * Maneja busqueda de texto
 */
async function handleSearch(interaction, queue, query) {
  const results = await searchYouTube(query, Config.SEARCH_RESULTS);
  
  if (results.length === 0) {
    return interaction.editReply({ 
      embeds: [errorEmbed(Messages.NO_RESULTS)] 
    });
  }
  
  // Generar ID unico para esta busqueda
  const searchId = `${interaction.user.id}_${Date.now()}`;
  
  const embed = searchResultsEmbed(results, query);
  const buttons = searchButtons(results, searchId);
  
  const response = await interaction.editReply({ 
    embeds: [embed], 
    components: [buttons] 
  });
  
  // Esperar seleccion
  try {
    const buttonInteraction = await response.awaitMessageComponent({
      componentType: ComponentType.Button,
      filter: i => i.user.id === interaction.user.id && i.customId.startsWith(`search_${searchId}`),
      time: Config.SEARCH_TIMEOUT,
    });
    
    const parts = buttonInteraction.customId.split('_');
    const selection = parts[parts.length - 1];
    
    if (selection === 'cancel') {
      await buttonInteraction.update({ 
        embeds: [infoEmbed('Busqueda cancelada', Messages.SEARCH_CANCELLED)], 
        components: [] 
      });
      return;
    }
    
    const index = parseInt(selection);
    const song = results[index];
    song.requestedBy = interaction.user.id;
    
    // Deshabilitar botones
    await buttonInteraction.deferUpdate();
    
    await addSongToQueue(interaction, queue, song, true);
    
  } catch (error) {
    if (error.code === 'InteractionCollectorError') {
      await interaction.editReply({ 
        embeds: [infoEmbed('Tiempo agotado', Messages.SEARCH_TIMEOUT)], 
        components: [] 
      });
    } else {
      throw error;
    }
  }
}

/**
 * Agrega una cancion a la cola y responde
 */
async function addSongToQueue(interaction, queue, song, editComponents = false) {
  const wasEmpty = !queue.currentSong && queue.songs.length === 0;
  
  if (!addToQueue(queue, song)) {
    const options = { 
      embeds: [errorEmbed(`La cola esta llena (max ${Config.MAX_QUEUE_SIZE} canciones)`)],
      components: editComponents ? [] : undefined
    };
    return interaction.editReply(options);
  }
  
  if (wasEmpty) {
    await playNext(queue);
    // El embed de "ahora suena" se envia desde playNext
    await interaction.editReply({ 
      embeds: [infoEmbed(`${Emoji.PLAY} Reproduciendo~`, `**${song.title}**`)],
      components: [] 
    });
  } else {
    const position = queue.songs.length;
    await interaction.editReply({ 
      embeds: [addedToQueueEmbed(song, position)],
      components: [] 
    });
  }
}
