FROM node:20

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias de Node
RUN npm ci --omit=dev

# Copiar codigo fuente
COPY . .

# Comando de inicio
CMD ["npm", "start"]
