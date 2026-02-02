import { spawn } from 'child_process';
import youtubeDlExec from 'youtube-dl-exec';
import { Config } from '../utils/constants.js';

// Usar el binario incluido en youtube-dl-exec
const YT_DLP_PATH = youtubeDlExec.constants.YOUTUBE_DL_PATH;

/**
 * Verifica si es una URL de YouTube
 */
export function isYouTubeUrl(query) {
  return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(query);
}

/**
 * Busca canciones en YouTube usando yt-dlp
 * @returns {Promise<Array>} Array de resultados
 */
export async function searchYouTube(query, limit = Config.SEARCH_RESULTS) {
  return new Promise((resolve) => {
    const args = [
      `ytsearch${limit}:${query}`,
      '--dump-json',
      '--flat-playlist',
      '--no-warnings',
      '--default-search', 'ytsearch',
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
        console.error('yt-dlp search error:', stderr);
        resolve([]);
        return;
      }

      try {
        // yt-dlp devuelve un JSON por linea
        const results = stdout
          .trim()
          .split('\n')
          .filter(line => line)
          .map(line => {
            const video = JSON.parse(line);
            return {
              title: video.title,
              url: video.url || `https://www.youtube.com/watch?v=${video.id}`,
              duration: video.duration || 0,
              thumbnail: video.thumbnail || video.thumbnails?.[0]?.url || null,
              author: video.uploader || video.channel || 'Desconocido',
            };
          })
          .slice(0, limit);

        resolve(results);
      } catch (error) {
        console.error('Error parsing yt-dlp search output:', error);
        resolve([]);
      }
    });

    process.on('error', error => {
      console.error('Error spawning yt-dlp for search:', error);
      resolve([]);
    });
  });
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
