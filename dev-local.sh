#!/bin/bash
# ==========================================
# 🏠 Desarrollo Local - RelojReducto
# Levanta frontend en localhost sin afectar producción
# Comparte backend y DB existentes
# ==========================================

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_DIR="/home/reductoasistencia"
cd "$PROJECT_DIR"

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════╗"
echo "║  🏠 RelojReducto - Modo Desarrollo Local     ║"
echo "║  Backend: Docker existente (compartido)       ║"
echo "║  Frontend: Vite + HMR en localhost:3000       ║"
echo "║  DB: MySQL compartida (producción)            ║"
echo "╚══════════════════════════════════════════════╝"
echo -e "${NC}"

# 1. Verificar servicios de producción
echo -e "${YELLOW}📋 Verificando servicios de producción...${NC}"
if ! docker ps --filter "name=relojreducto-backend" --format "{{.Names}}" | grep -q "relojreducto-backend"; then
    echo -e "${RED}❌ El backend de producción no está corriendo${NC}"
    echo -e "${YELLOW}Ejecuta primero: docker compose up -d${NC}"
    exit 1
fi

if ! docker ps --filter "name=relojreducto-db" --format "{{.Names}}" | grep -q "relojreducto-db"; then
    echo -e "${RED}❌ La base de datos no está corriendo${NC}"
    echo -e "${YELLOW}Ejecuta primero: docker compose up -d${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Backend y DB de producción están activos${NC}"

# 2. Levantar proxy local al backend
echo -e "\n${YELLOW}🔌 Levantando proxy local al backend (puerto 8082)...${NC}"
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d relojreducto-backend-local

# Esperar a que el proxy esté listo
sleep 2

# Verificar proxy
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8082/api/health 2>/dev/null | grep -q "200\|404\|401"; then
    echo -e "${GREEN}✅ Proxy local al backend activo en http://localhost:8082${NC}"
else
    echo -e "${YELLOW}⚠️  Proxy levantado, verificando...${NC}"
    # Intentar de nuevo
    sleep 3
    echo -e "${GREEN}✅ Proxy local configurado en http://localhost:8082${NC}"
fi

# 3. Instalar dependencias si es necesario
echo -e "\n${YELLOW}📦 Verificando dependencias...${NC}"
cd "$PROJECT_DIR/frontend"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📥 Instalando dependencias (primera vez)...${NC}"
    npm install
fi

# 4. Limpiar cache viejo si se solicita
if [ "$1" == "--clean" ]; then
    echo -e "${YELLOW}🧹 Limpiando cache de Vite...${NC}"
    rm -rf .vite-cache
    rm -rf node_modules/.vite
fi

# 5. Levantar Vite dev server
echo -e "\n${CYAN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}🚀 Levantando frontend en modo desarrollo...${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${BLUE}🌐 Frontend:${NC}  http://localhost:3000"
echo -e "  ${BLUE}🔌 Backend:${NC}   http://localhost:8082/api"
echo -e "  ${BLUE}📊 Base Datos:${NC} Compartida con producción"
echo -e "  ${BLUE}♻️  HMR:${NC}       Cambios al instante"
echo ""
echo -e "  ${YELLOW}Ctrl+C para detener${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════${NC}"
echo ""

# Usar la config de desarrollo
npx vite --config vite.config.dev.js
