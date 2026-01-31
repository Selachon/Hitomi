# Hitomi - Bot de Musica Kawaii

Bot de Discord para reproducir musica con personalidad kawaii (en espanol).

## Caracteristicas

- Reproduccion de musica desde YouTube y Spotify
- Busqueda con 4 resultados para elegir
- Soporte de playlists de Spotify (max 50 canciones)
- Sistema de cola con info de quien agrego cada cancion
- Auto-desconexion por inactividad (3 minutos)
- Embeds bonitos con personalidad kawaii
- Control de volumen

## Comandos

| Comando | Descripcion |
|---------|-------------|
| `/play <cancion>` | Reproduce una cancion o URL |
| `/pause` | Pausa la musica |
| `/resume` | Reanuda la musica |
| `/skip` | Salta a la siguiente cancion |
| `/stop` | Detiene y limpia la cola |
| `/queue` | Muestra la cola de reproduccion |
| `/nowplaying` | Muestra la cancion actual |
| `/volume <1-100>` | Cambia el volumen |
| `/help` | Muestra la ayuda |

## Instalacion

1. Clona el repositorio:
```bash
git clone https://github.com/Selachon/Hitomi.git
cd Hitomi
```

2. Instala las dependencias:
```bash
npm install
```

3. Crea el archivo `.env` basandote en `.env.example`:
```bash
cp .env.example .env
```

4. Agrega tu token de Discord y Client ID al archivo `.env`

5. Registra los comandos slash:
```bash
npm run deploy
```

6. Inicia el bot:
```bash
npm start
```

## Requisitos

- Node.js 18+
- FFmpeg (instalado en el sistema)

## Dependencias

- discord.js
- @discordjs/voice
- @discordjs/opus
- play-dl
- spotify-url-info
- ffmpeg-static
- dotenv

## Licencia

MIT
