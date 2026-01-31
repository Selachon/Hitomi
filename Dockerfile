FROM node:20-slim

# Instalar dependencias del sistema necesarias para:
# - @discordjs/opus (compilacion nativa)
# - ffmpeg (procesamiento de audio)
# - python3 (requerido por youtube-dl-exec)
RUN apt-get update && apt-get install -y \
    python3 \
    ffmpeg \
    build-essential \
    libtool \
    autoconf \
    automake \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar package files primero para mejor cache de Docker
COPY package*.json ./

# Instalar dependencias
RUN npm ci --omit=dev

# Copiar el resto del codigo
COPY . .

# Usuario no-root por seguridad
RUN useradd -m hitomi && chown -R hitomi:hitomi /app
USER hitomi

CMD ["npm", "start"]
