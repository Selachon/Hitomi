FROM node:20-alpine

# Instalar solo lo esencial
RUN apk add --no-cache python3 ffmpeg

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY . .

CMD ["npm", "run", "deploy", "&", "npm", "start"]
