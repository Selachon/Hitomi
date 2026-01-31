import ytdl from '@distube/ytdl-core';
import ytsr from 'ytsr';
import { Config } from '../utils/constants.js';
import { config } from 'dotenv';

config();

import fs from 'fs';
import path from 'path';

/**
 * Verifica si es una URL de YouTube
 */
export function isYouTubeUrl(query) {
  return ytdl.validateURL(query);
}

/**
 * Busca canciones en YouTube
 * @returns {Promise<Array>} Array de resultados
 */
export async function searchYouTube(query, limit = Config.SEARCH_RESULTS) {
  try {
    const filters = await ytsr.getFilters(query);
    const filter = filters.get('Type').get('Videos');
    
    if (!filter) {
      console.error('No se pudo obtener filtro de videos');
      return [];
    }
    
    const searchResults = await ytsr(filter.url, { limit: limit * 2 });
    
    return searchResults.items
      .filter(item => item.type === 'video' && item.url)
      .slice(0, limit)
      .map(video => ({
        title: video.title,
        url: video.url,
        duration: video.duration ? parseDuration(video.duration) : 0,
        thumbnail: video.thumbnails?.[0]?.url || video.bestThumbnail?.url || null,
        author: video.author?.name || 'Desconocido',
      }));
  } catch (error) {
    console.error('Error buscando en YouTube:', error);
    return [];
  }
}

/**
 * Convierte duracion "HH:MM:SS" o "MM:SS" a segundos
 */
function parseDuration(duration) {
  if (!duration) return 0;
  const parts = duration.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return parts[0] || 0;
}

/**
 * Obtiene informacion de un video de YouTube por URL
 */
export async function getYouTubeInfo(url) {
  try {
    if (!ytdl.validateURL(url)) {
      console.error('URL de YouTube invalida:', url);
      return null;
    }
    
    const info = await ytdl.getInfo(url);
    
    return {
      title: info.videoDetails.title,
      url: info.videoDetails.video_url,
      duration: parseInt(info.videoDetails.lengthSeconds),
      thumbnail: info.videoDetails.thumbnails?.[0]?.url || null,
      author: info.videoDetails.author?.name || 'Desconocido',
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
  
  if (!ytdl.validateURL(url)) {
    throw new Error(`URL de YouTube invalida: ${url}`);
  }
  
  try {
    const cookies = loadYouTubeCookies();
    
    const stream = ytdl(url, {
      filter: 'audioonly',
      quality: 'highestaudio',
      highWaterMark: 1 << 25, // 32MB buffer
      requestOptions: {
        headers: {
          Cookie: cookies,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      },
    });
    
    return {
      stream,
      type: 'arbitrary', // Para @discordjs/voice
    };
  } catch (error) {
    console.error('Error obteniendo stream de YouTube:', error);
    console.error('URL que causo error:', url);
    throw error;
  }
}

/**
 * Carga cookies de YouTube desde archivo
 */
function loadYouTubeCookies() {
  try {
    const cookiesPath = process.env.YOUTUBE_COOKIES_FILE || './youtube_cookies.json';
    const cookiesFile = path.resolve(cookiesPath);
    
    if (fs.existsSync(cookiesFile)) {
      const cookies = JSON.parse(fs.readFileSync(cookiesFile, 'utf8'));
      return cookies.map(c => `${c.name}=${c.value}`).join('; ');
    }
  } catch (error) {
    console.error('Error cargando cookies de YouTube:', error);
  }
  
  return '';
}

/**
 * Busca un video por titulo de cancion (para convertir Spotify a YouTube)
 */
export async function searchSongOnYouTube(title, artist) {
  const query = artist ? `${title} ${artist}` : title;
  const results = await searchYouTube(query, 1);
  return results[0] || null;
}