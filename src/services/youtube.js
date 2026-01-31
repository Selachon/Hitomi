import play from 'play-dl';
import { Config } from '../utils/constants.js';

/**
 * Verifica si es una URL de YouTube
 */
export function isYouTubeUrl(query) {
  return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(query);
}

/**
 * Busca canciones en YouTube
 * @returns {Promise<Array>} Array de resultados
 */
export async function searchYouTube(query, limit = Config.SEARCH_RESULTS) {
  try {
    const results = await play.search(query, { 
      limit,
      source: { youtube: 'video' }
    });
    
    return results.map(video => {
      if (!video.url) {
        console.error('Video sin URL:', { title: video.title, id: video.id });
      }
      return {
        title: video.title,
        url: video.url,
        duration: video.durationInSec,
        thumbnail: video.thumbnail?.url || video.thumbnails?.[0]?.url || null,
        author: video.channel?.name || 'Desconocido',
      };
    }).filter(song => song.url); // Filtrar canciones sin URL
  } catch (error) {
    console.error('Error buscando en YouTube:', error);
    return [];
  }
}

/**
 * Obtiene informacion de un video de YouTube por URL
 */
export async function getYouTubeInfo(url) {
  try {
    const info = await play.video_info(url);
    const details = info.video_details;
    
    if (!details.url && !url) {
      console.error('Video info sin URL:', details);
      return null;
    }
    
    return {
      title: details.title,
      url: details.url || url, // Fallback a la URL original
      duration: details.durationInSec,
      thumbnail: details.thumbnails?.[0]?.url || null,
      author: details.channel?.name || 'Desconocido',
    };
  } catch (error) {
    console.error('Error obteniendo info de YouTube:', error);
    return null;
  }
}

/**
 * Obtiene el stream de audio de un video
 */
export async function getYouTubeStream(url) {
  if (!url) {
    throw new Error('URL no proporcionada para streaming');
  }
  
  try {
    const stream = await play.stream(url, { 
      quality: 2, // 0 = best, 1 = high, 2 = medium
      discordPlayerCompatibility: false
    });
    
    return {
      stream: stream.stream,
      type: stream.type,
    };
  } catch (error) {
    console.error('Error obteniendo stream de YouTube:', error);
    console.error('URL que causo error:', url);
    throw error;
  }
}

/**
 * Busca un video por titulo de cancion (para convertir Spotify a YouTube)
 */
export async function searchSongOnYouTube(title, artist) {
  const query = artist ? `${title} ${artist}` : title;
  const results = await searchYouTube(query, 1);
  return results[0] || null;
}
