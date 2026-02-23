# ==========================================
# Stage 1: Cache de dependencias npm
# ==========================================
FROM node:20-alpine AS deps

WORKDIR /app

# Solo copiar archivos de dependencias para cachear
COPY package.json package-lock.json ./
RUN npm ci --prefer-offline

# ==========================================
# Stage 2: Build (usa cache de deps)
# ==========================================
FROM node:20-alpine AS build

WORKDIR /app

# Copiar node_modules cacheados
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./

# Copiar código fuente
COPY . .

# Build de producción
RUN npm run build

# ==========================================
# Stage 3: Nginx producción (HTTP - Traefik maneja SSL)
# ==========================================
FROM nginx:alpine

# Copiar la configuración de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los archivos compilados
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

RUN apk add --no-cache curl

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
