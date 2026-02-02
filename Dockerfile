FROM node:20-alpine

# Instalar solo lo esencial
RUN apk add --no-cache python3 ffmpeg

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY . .

# Primero registra los comandos en Discord, luego inicia el bot
CMD ["sh", "-c", "npm run deploy && npm start"]
