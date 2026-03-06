#!/bin/bash
# ==========================================
# 🛑 Detener Desarrollo Local
# Limpia el proxy local sin tocar producción
# ==========================================

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_DIR="/home/reductoasistencia"
cd "$PROJECT_DIR"

echo -e "${YELLOW}🛑 Deteniendo servicios de desarrollo local...${NC}"

# Solo detener el proxy local
docker compose -f docker-compose.yml -f docker-compose.local.yml stop relojreducto-backend-local 2>/dev/null || true
docker compose -f docker-compose.yml -f docker-compose.local.yml rm -f relojreducto-backend-local 2>/dev/null || true

echo -e "${GREEN}✅ Servicios locales detenidos${NC}"

# Verificar que producción sigue corriendo
echo -e "\n${CYAN}📊 Estado de producción:${NC}"
docker ps --filter "name=relojreducto" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -v "local"

echo -e "\n${GREEN}🎉 Producción sigue intacta${NC}"
