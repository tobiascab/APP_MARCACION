#!/bin/bash
# ==========================================
# 🚀 Deploy Rápido - RelojReducto
# Usa cache de Docker para deploys instantáneos
# ==========================================

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_DIR="/home/reductoasistencia"
cd "$PROJECT_DIR"

echo -e "${CYAN}🚀 Deploy RelojReducto - asistoreducto.arizar-ia.cloud${NC}"
echo "=================================================="

# Opción: deploy completo o solo frontend o solo backend
DEPLOY_TARGET="${1:-all}"

deploy_frontend() {
    echo -e "\n${YELLOW}📦 Building frontend (con cache)...${NC}"
    docker compose build relojreducto-frontend
    echo -e "${GREEN}✅ Frontend compilado${NC}"

    echo -e "${YELLOW}🔄 Recreando frontend (sin downtime del backend)...${NC}"
    docker compose up -d --no-deps --force-recreate relojreducto-frontend
    echo -e "${GREEN}✅ Frontend desplegado${NC}"
}

deploy_backend() {
    echo -e "\n${YELLOW}📦 Building backend (con cache de Maven)...${NC}"
    docker compose build relojreducto-backend
    echo -e "${GREEN}✅ Backend compilado${NC}"

    echo -e "${YELLOW}🔄 Recreando backend (sin downtime de DB)...${NC}"
    docker compose up -d --no-deps --force-recreate relojreducto-backend
    echo -e "${GREEN}✅ Backend desplegado${NC}"
}

case "$DEPLOY_TARGET" in
    frontend|front|f)
        deploy_frontend
        ;;
    backend|back|b)
        deploy_backend
        ;;
    all|a)
        deploy_frontend
        deploy_backend
        ;;
    *)
        echo -e "${RED}Uso: ./deploy.sh [all|frontend|backend]${NC}"
        echo "  all      - Despliega todo (default)"
        echo "  frontend - Solo frontend (cambios CSS/JS/React)"
        echo "  backend  - Solo backend (cambios Java/API)"
        exit 1
        ;;
esac

echo -e "\n${CYAN}📊 Estado de los servicios:${NC}"
docker ps --filter "name=relojreducto" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo -e "\n${GREEN}🎉 Deploy completado!${NC}"
echo -e "🌐 https://asistoreducto.arizar-ia.cloud"
