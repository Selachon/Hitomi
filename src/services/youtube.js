import { spawn } from 'child_process';
import ytsr from 'ytsr';
import { Config } from '../utils/constants.js';

// Path a yt-dlp (ajustar si es necesario)
const YT_DLP_PATH = process.env.YT_DLP_PATH || 'yt-dlp';

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
 * Obtiene informacion de un video de YouTube usando yt-dlp
 */
export async function getYouTubeInfo(url) {
  return new Promise((resolve, reject) => {
    const args = [
      '--dump-json',
      '--no-playlist',
      '--no-warnings',
      url
    ];
    
    const process = spawn(YT_DLP_PATH, args);
    let stdout = '';
    let stderr = '';
    
    process.stdout.on('data', data => {
      stdout += data.toString();
    });
    
    process.stderr.on('data', data => {
      stderr += data.toString();
    });
    
    process.on('close', code => {
      if (code !== 0) {
        console.error('yt-dlp error:', stderr);
        resolve(null);
        return;
      }
      
      try {
        const info = JSON.parse(stdout);
        resolve({
          title: info.title,
          url: info.webpage_url || url,
          duration: info.duration || 0,
          thumbnail: info.thumbnail || null,
          author: info.uploader || info.channel || 'Desconocido',
        });
      } catch (error) {
        console.error('Error parsing yt-dlp output:', error);
        resolve(null);
      }
    });
    
    process.on('error', error => {
      console.error('Error spawning yt-dlp:', error);
      resolve(null);
    });
  });
}

/**
 * Obtiene el stream de audio de un video usando yt-dlp
 */
export async function getYouTubeStream(url) {
  if (!url) {
    throw new Error('URL no proporcionada para streaming');
  }
  
  // yt-dlp descarga el audio y lo envia a stdout
  const args = [
    '-f', 'bestaudio',
    '-o', '-',  // Output a stdout
    '--no-playlist',
    '--no-warnings',
    '--quiet',
    url
  ];
  
  const ytdlpProcess = spawn(YT_DLP_PATH, args, {
    stdio: ['ignore', 'pipe', 'pipe']
  });
  
  ytdlpProcess.stderr.on('data', data => {
    const msg = data.toString();
    if (!msg.includes('WARNING')) {
      console.error('yt-dlp stderr:', msg);
    }
  });
  
  ytdlpProcess.on('error', error => {
    console.error('Error spawning yt-dlp:', error);
  });
  
  return {
    stream: ytdlpProcess.stdout,
    type: 'arbitrary',
    process: ytdlpProcess, // Para poder matarlo si es necesario
  };
}

/**
 * Busca un video por titulo de cancion (para convertir Spotify a YouTube)
 */
export async function searchSongOnYouTube(title, artist) {
  const query = artist ? `${title} ${artist}` : title;
  const results = await searchYouTube(query, 1);
  return results[0] || null;
}
