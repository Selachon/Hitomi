FROM node:20-bookworm-slim

# Instalar solo lo esencial
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 ffmpeg ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY . .

# Primero registra los comandos en Discord, luego inicia el bot
CMD ["sh", "-c", "npm run deploy && npm start"]
