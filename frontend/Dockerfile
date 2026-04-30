# Frontend Dockerfile para React
FROM node:18-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Copiar package files
COPY package.json yarn.lock ./

# Instalar dependencias
RUN yarn install --frozen-lockfile

# Copiar el resto del código
COPY . .

# Exponer puerto
EXPOSE 3000

# Comando de inicio
CMD ["yarn", "start"]
