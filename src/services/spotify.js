import { getTracks, getPreview, getDetails } from 'spotify-url-info';
import { searchSongOnYouTube } from './youtube.js';
import { Config } from '../utils/constants.js';

// Crear fetch para spotify-url-info
const fetch = (await import('node-fetch')).default;

/**
 * Verifica si es una URL de Spotify
 */
export function isSpotifyUrl(query) {
  return /^(https?:\/\/)?(open\.)?spotify\.com\/.+/.test(query);
}

/**
 * Verifica si es una URL de track de Spotify
 */
export function isSpotifyTrack(url) {
  return /spotify\.com\/track\//.test(url);
}

/**
 * Verifica si es una URL de playlist de Spotify
 */
export function isSpotifyPlaylist(url) {
  return /spotify\.com\/(playlist|album)\//.test(url);
}

/**
 * Obtiene info de un track de Spotify y lo busca en YouTube
 */
export async function getSpotifyTrack(url) {
  try {
    const data = await getPreview(url, { fetch });
    
    if (!data || !data.title) {
      return null;
    }
    
    // Buscar en YouTube
    const youtubeResult = await searchSongOnYouTube(data.title, data.artist);
    
    if (!youtubeResult) {
      return null;
    }
    
    return {
      ...youtubeResult,
      spotifyTitle: data.title,
      spotifyArtist: data.artist,
      spotifyImage: data.image,
    };
  } catch (error) {
    console.error('Error obteniendo track de Spotify:', error);
    return null;
  }
}

/**
 * Obtiene tracks de una playlist/album de Spotify
 */
export async function getSpotifyPlaylist(url) {
  try {
    const tracks = await getTracks(url, { fetch });
    
    if (!tracks || tracks.length === 0) {
      return { name: 'Playlist', tracks: [] };
    }
    
    // Limitar cantidad de canciones
    const limitedTracks = tracks.slice(0, Config.MAX_PLAYLIST_SONGS);
    
    // Obtener nombre de la playlist
    let playlistName = 'Playlist de Spotify';
    try {
      const details = await getDetails(url, { fetch });
      playlistName = details.title || details.name || playlistName;
    } catch {
      // Ignorar error, usar nombre por defecto
    }
    
    return {
      name: playlistName,
      totalTracks: tracks.length,
      tracks: limitedTracks.map(track => ({
        title: track.name,
        artist: track.artist,
        duration: Math.floor((track.duration || 0) / 1000),
        spotifyUrl: track.external_urls?.spotify,
      })),
    };
  } catch (error) {
    console.error('Error obteniendo playlist de Spotify:', error);
    return { name: 'Playlist', tracks: [] };
  }
}

/**
 * Convierte tracks de Spotify a resultados de YouTube
 * @param {Array} spotifyTracks - Array de tracks de Spotify
 * @param {Function} onProgress - Callback para progreso (index, total, track)
 * @returns {Promise<Array>} Array de canciones con info de YouTube
 */
export async function convertSpotifyToYouTube(spotifyTracks, onProgress) {
  const results = [];
  
  for (let i = 0; i < spotifyTracks.length; i++) {
    const track = spotifyTracks[i];
    
    if (onProgress) {
      onProgress(i, spotifyTracks.length, track);
    }
    
    try {
      const youtubeResult = await searchSongOnYouTube(track.title, track.artist);
      
      if (youtubeResult) {
        results.push({
          ...youtubeResult,
          spotifyTitle: track.title,
          spotifyArtist: track.artist,
        });
      }
    } catch (error) {
      console.error(`Error convirtiendo "${track.title}":`, error.message);
      // Continuar con la siguiente cancion
    }
    
    // Pequeno delay para evitar rate limiting
    if (i < spotifyTracks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return results;
}
