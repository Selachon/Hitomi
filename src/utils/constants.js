// Colores kawaii para embeds
export const Colors = {
  PRIMARY: 0xFFB6C1,    // Rosa pastel
  SUCCESS: 0x98FB98,    // Verde menta
  ERROR: 0xFFB7B7,      // Rosa error
  INFO: 0xE6E6FA,       // Lavanda
  WARNING: 0xFFE4B5,    // Melocoton
  PLAYING: 0xFFC0CB,    // Rosa brillante
  QUEUE: 0xDDA0DD,      // Ciruela
};

// Emojis kawaii
export const Emoji = {
  MUSIC: '🎵',
  NOTES: '🎶',
  HEART: '💕',
  SPARKLE: '✨',
  FLOWER: '🌸',
  STAR: '⭐',
  PLAY: '▶️',
  PAUSE: '⏸️',
  STOP: '⏹️',
  SKIP: '⏭️',
  QUEUE: '📜',
  VOLUME: '🔊',
  VOLUME_LOW: '🔉',
  VOLUME_MUTE: '🔇',
  SAD: '😢',
  HAPPY: '(◕‿◕)',
  LOVE: '(♡´▽`♡)',
  WAVE: '(｡◕‿◕｡)/',
  SLEEPY: '(´-ω-`)',
  CONFUSED: '(・・?)',
  EXCITED: '(ﾉ◕ヮ◕)ﾉ*:・ﾟ✧',
  LOADING: '⏳',
  CHECK: '✅',
  CROSS: '❌',
  WARN: '⚠️',
  CLOCK: '🕐',
  USER: '👤',
  PLAYLIST: '📑',
};

// Mensajes kawaii
export const Messages = {
  // Saludos y despedidas
  HELLO: [
    `${Emoji.WAVE} ¡Hola~! Hitomi esta aqui para poner musiquita`,
    `${Emoji.FLOWER} Nyaa~ ¿Que quieres escuchar hoy?`,
    `${Emoji.SPARKLE} ¡Hitomi al rescate musical~!`,
  ],
  GOODBYE: [
    `${Emoji.SLEEPY} Me voy a dormir... ¡Hasta pronto~!`,
    `${Emoji.WAVE} Nadie me escucha... Bye bye~`,
    `${Emoji.HEART} ¡Fue divertido! Llamame cuando quieras musica~`,
  ],
  
  // Reproduccion
  NOW_PLAYING: `${Emoji.MUSIC} ¡Ahora suena~!`,
  ADDED_TO_QUEUE: `${Emoji.CHECK} ¡Agregado a la cola~!`,
  QUEUE_EMPTY: `${Emoji.SAD} La cola esta vacia... Pon algo con /play`,
  
  // Errores
  NOT_IN_VOICE: `${Emoji.CONFUSED} ¡Tienes que estar en un canal de voz, tontito~!`,
  NO_RESULTS: `${Emoji.SAD} No encontre nada... ¿Seguro que existe?`,
  ALREADY_PLAYING: `${Emoji.NOTES} ¡Ya hay musica sonando~!`,
  NOTHING_PLAYING: `${Emoji.CONFUSED} No hay nada sonando ahora mismo...`,
  
  // Acciones
  PAUSED: `${Emoji.PAUSE} Musica pausada~ `,
  RESUMED: `${Emoji.PLAY} ¡Seguimos con la musica~!`,
  SKIPPED: `${Emoji.SKIP} ¡Siguiente cancion~!`,
  STOPPED: `${Emoji.STOP} ¡Musica detenida! Bye bye~`,
  VOLUME_CHANGED: `${Emoji.VOLUME} Volumen cambiado~`,
  SHUFFLED: `${Emoji.SPARKLE} ¡Cola mezclada aleatoriamente~!`,
  
  // Busqueda
  SEARCH_PROMPT: `${Emoji.SPARKLE} ¡Encontre estas opciones! Elige una~`,
  SEARCH_TIMEOUT: `${Emoji.SLEEPY} Se acabo el tiempo para elegir...`,
  SEARCH_CANCELLED: `${Emoji.SAD} Busqueda cancelada~`,
  
  // Spotify
  SPOTIFY_DETECTED: `${Emoji.SPARKLE} ¡Detecte un enlace de Spotify~!`,
  SPOTIFY_PLAYLIST: `${Emoji.PLAYLIST} ¡Es una playlist de Spotify~!`,
  SPOTIFY_CONVERTING: `${Emoji.LOADING} Buscando en YouTube...`,
};

// Configuracion
export const Config = {
  INACTIVITY_TIMEOUT: 3 * 60 * 1000, // 3 minutos
  MAX_QUEUE_SIZE: 50,
  SEARCH_RESULTS: 4, // 4 resultados + boton cancelar = 5 (max Discord)
  SEARCH_TIMEOUT: 30 * 1000, // 30 segundos
  DEFAULT_VOLUME: 50,
  MAX_PLAYLIST_SONGS: 100,
};
