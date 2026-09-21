# ---- Etapa 1: build ----
# Node 24 para alinearse con el motor definido en src/cloudFunctions/functions/package.json
FROM node:24-alpine AS build
WORKDIR /app

# Instala dependencias primero (aprovecha la cache de capas de Docker)
COPY package.json package-lock.json ./
RUN npm ci

# Copia el resto del código y compila
COPY . .

# Variables de entorno de Firebase inyectadas en tiempo de build
# (Vite las incrusta en el bundle estático al compilar)
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID

# Solo el entorno de desarrollo lo define ("true"): apunta la app al Firebase Emulator
# Suite en vez de a la nube. En producción queda vacío y no tiene ningún efecto.
ARG VITE_USE_EMULATORS
ARG VITE_EMULATOR_HOST

RUN npm run build

# ---- Etapa 2: runtime ----
FROM nginx:1.27-alpine AS runtime

# Config de nginx con fallback de SPA (react-router-dom)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia solo el resultado del build, no el código fuente ni node_modules
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
