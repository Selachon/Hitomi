import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { Colors, Emoji, Messages, Config } from './constants.js';

/**
 * Formatea duracion en segundos a MM:SS o HH:MM:SS
 */
export function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '??:??';
  
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Embed para "Ahora suena"
 */
export function nowPlayingEmbed(song) {
  return new EmbedBuilder()
    .setColor(Colors.PLAYING)
    .setTitle(`${Emoji.MUSIC} Ahora suena~`)
    .setDescription(`**[${song.title}](${song.url})**`)
    .setThumbnail(song.thumbnail)
    .addFields(
      { name: `${Emoji.CLOCK} Duracion`, value: formatDuration(song.duration), inline: true },
      { name: `${Emoji.USER} Pedido por`, value: `<@${song.requestedBy}>`, inline: true }
    )
    .setFooter({ text: `${Emoji.HEART} Hitomi Music Bot ${Emoji.HEART}` })
    .setTimestamp();
}

/**
 * Embed para cancion agregada a la cola
 */
export function addedToQueueEmbed(song, position) {
  return new EmbedBuilder()
    .setColor(Colors.SUCCESS)
    .setTitle(`${Emoji.CHECK} Agregado a la cola~`)
    .setDescription(`**[${song.title}](${song.url})**`)
    .setThumbnail(song.thumbnail)
    .addFields(
      { name: `${Emoji.CLOCK} Duracion`, value: formatDuration(song.duration), inline: true },
      { name: `${Emoji.QUEUE} Posicion`, value: `#${position}`, inline: true },
      { name: `${Emoji.USER} Pedido por`, value: `<@${song.requestedBy}>`, inline: true }
    )
    .setFooter({ text: `${Emoji.SPARKLE} ¡Espera tu turno~!` });
}

/**
 * Embed para la cola de reproduccion
 */
export function queueEmbed(queue, currentSong, page = 0) {
  const songsPerPage = 10;
  const totalPages = Math.ceil(queue.length / songsPerPage);
  const start = page * songsPerPage;
  const end = start + songsPerPage;
  const currentQueue = queue.slice(start, end);
  
  const embed = new EmbedBuilder()
    .setColor(Colors.QUEUE)
    .setTitle(`${Emoji.QUEUE} Cola de reproduccion~`)
    .setFooter({ 
      text: `Pagina ${page + 1}/${totalPages || 1} | ${queue.length} canciones en cola ${Emoji.HEART}` 
    });
  
  if (currentSong) {
    embed.addFields({
      name: `${Emoji.PLAY} Sonando ahora`,
      value: `**[${currentSong.title}](${currentSong.url})** - <@${currentSong.requestedBy}>`
    });
  }
  
  if (currentQueue.length > 0) {
    const queueList = currentQueue
      .map((song, i) => `**${start + i + 1}.** [${song.title}](${song.url}) - <@${song.requestedBy}>`)
      .join('\n');
    
    embed.addFields({
      name: `${Emoji.NOTES} Proximas canciones`,
      value: queueList
    });
  } else if (!currentSong) {
    embed.setDescription(Messages.QUEUE_EMPTY);
  }
  
  return embed;
}

/**
 * Embed para resultados de busqueda con botones
 */
export function searchResultsEmbed(results, query) {
  const embed = new EmbedBuilder()
    .setColor(Colors.INFO)
    .setTitle(`${Emoji.SPARKLE} Resultados para: "${query}"`)
    .setDescription(Messages.SEARCH_PROMPT)
    .setFooter({ text: `${Emoji.CLOCK} Tienes 30 segundos para elegir~` });
  
  results.forEach((result, i) => {
    embed.addFields({
      name: `${i + 1}. ${result.title}`,
      value: `${Emoji.CLOCK} ${formatDuration(result.duration)} | ${Emoji.USER} ${result.author || 'Desconocido'}`,
      inline: false
    });
  });
  
  return embed;
}

/**
 * Botones para seleccion de canciones
 */
export function searchButtons(results, searchId) {
  const row = new ActionRowBuilder();
  
  results.forEach((_, i) => {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`search_${searchId}_${i}`)
        .setLabel(`${i + 1}`)
        .setStyle(ButtonStyle.Primary)
    );
  });
  
  row.addComponents(
    new ButtonBuilder()
      .setCustomId(`search_${searchId}_cancel`)
      .setLabel('Cancelar')
      .setStyle(ButtonStyle.Danger)
      .setEmoji(Emoji.CROSS)
  );
  
  return row;
}

/**
 * Embed de error kawaii
 */
export function errorEmbed(message) {
  return new EmbedBuilder()
    .setColor(Colors.ERROR)
    .setDescription(`${Emoji.SAD} ${message}`)
    .setFooter({ text: `${Emoji.HEART} No te preocupes, intentalo de nuevo~` });
}

/**
 * Embed de exito kawaii
 */
export function successEmbed(message) {
  return new EmbedBuilder()
    .setColor(Colors.SUCCESS)
    .setDescription(`${Emoji.CHECK} ${message}`);
}

/**
 * Embed de informacion kawaii
 */
export function infoEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(Colors.INFO)
    .setTitle(`${Emoji.SPARKLE} ${title}`)
    .setDescription(description);
}

/**
 * Embed de ayuda
 */
export function helpEmbed() {
  return new EmbedBuilder()
    .setColor(Colors.PRIMARY)
    .setTitle(`${Emoji.FLOWER} Ayuda de Hitomi ${Emoji.FLOWER}`)
    .setDescription(`${Emoji.WAVE} ¡Hola~! Soy Hitomi, tu bot de musica kawaii.\nAqui tienes todos mis comandos:`)
    .addFields(
      { 
        name: `${Emoji.MUSIC} Reproduccion`, 
        value: [
          '`/play <cancion>` - Reproduce una cancion o URL',
          '`/pause` - Pausa la musica',
          '`/resume` - Reanuda la musica',
          '`/skip` - Salta a la siguiente cancion',
          '`/stop` - Detiene la musica y limpia la cola',
        ].join('\n'),
        inline: false
      },
      {
        name: `${Emoji.QUEUE} Cola`,
        value: [
          '`/queue` - Muestra la cola de reproduccion',
          '`/nowplaying` - Muestra la cancion actual',
          '`/shuffle` - Mezcla la cola aleatoriamente',
        ].join('\n'),
        inline: false
      },
      {
        name: `${Emoji.VOLUME} Control`,
        value: [
          '`/volume <1-100>` - Cambia el volumen',
        ].join('\n'),
        inline: false
      },
      {
        name: `${Emoji.SPARKLE} Caracteristicas`,
        value: [
          `${Emoji.CHECK} Soporta URLs de YouTube y Spotify`,
          `${Emoji.CHECK} Busqueda con 4 resultados para elegir`,
          `${Emoji.CHECK} Playlists de Spotify (max ${Config.MAX_PLAYLIST_SONGS} canciones)`,
          `${Emoji.CHECK} Auto-desconexion por inactividad (3 min)`,
        ].join('\n'),
        inline: false
      }
    )
    .setFooter({ text: `${Emoji.HEART} Hecho con amor por Hitomi ${Emoji.HEART}` })
    .setTimestamp();
}

/**
 * Embed para playlist agregada
 */
export function playlistAddedEmbed(playlistName, songCount, totalAdded) {
  return new EmbedBuilder()
    .setColor(Colors.SUCCESS)
    .setTitle(`${Emoji.PLAYLIST} Playlist agregada~`)
    .setDescription(`**${playlistName}**`)
    .addFields(
      { name: `${Emoji.MUSIC} Canciones agregadas`, value: `${totalAdded}`, inline: true },
      { name: `${Emoji.NOTES} Total en playlist`, value: `${songCount}`, inline: true }
    )
    .setFooter({ text: `${Emoji.SPARKLE} ¡A disfrutar la musica~!` });
}

/**
 * Embed de despedida (auto-desconexion)
 */
export function goodbyeEmbed() {
  const message = Messages.GOODBYE[Math.floor(Math.random() * Messages.GOODBYE.length)];
  return new EmbedBuilder()
    .setColor(Colors.INFO)
    .setDescription(message)
    .setFooter({ text: `${Emoji.HEART} Usa /play para llamarme de nuevo~` });
}
