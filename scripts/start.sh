#!/bin/bash

# Script de inicio rápido para EvalPro en Docker
# Ubuntu 20.04 compatible

set -e

echo "========================================="
echo "  EvalPro - Inicio Rápido con Docker"
echo "========================================="
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar si Docker está instalado
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker no está instalado${NC}"
    echo "Por favor, instala Docker primero:"
    echo "  sudo ./scripts/install-docker-ubuntu.sh"
    exit 1
fi

# Verificar si Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose no está instalado${NC}"
    echo "Por favor, instala Docker Compose primero:"
    echo "  sudo ./scripts/install-docker-ubuntu.sh"
    exit 1
fi

# Verificar archivos .env
echo -e "${YELLOW}🔍 Verificando archivos de configuración...${NC}"

if [ ! -f "./backend/.env" ]; then
    echo -e "${YELLOW}⚠️  Creando backend/.env desde .env.example${NC}"
    cp ./backend/.env.example ./backend/.env
fi

if [ ! -f "./frontend/.env" ]; then
    echo -e "${YELLOW}⚠️  Creando frontend/.env desde .env.example${NC}"
    cp ./frontend/.env.example ./frontend/.env
fi

echo -e "${GREEN}✓ Archivos de configuración listos${NC}"
echo ""

# Detener contenedores existentes
echo -e "${YELLOW}🛑 Deteniendo contenedores existentes (si los hay)...${NC}"
docker-compose down 2>/dev/null || true
echo ""

# Construir imágenes
echo -e "${YELLOW}🔨 Construyendo imágenes Docker...${NC}"
echo "Esto puede tomar varios minutos la primera vez..."
docker-compose build
echo -e "${GREEN}✓ Imágenes construidas exitosamente${NC}"
echo ""

# Iniciar servicios
echo -e "${YELLOW}🚀 Iniciando servicios...${NC}"
docker-compose up -d
echo -e "${GREEN}✓ Servicios iniciados${NC}"
echo ""

# Esperar a que los servicios estén listos
echo -e "${YELLOW}⏳ Esperando a que los servicios estén listos...${NC}"
sleep 5

# Verificar estado de los servicios
echo ""
echo -e "${YELLOW}📊 Estado de los servicios:${NC}"
docker-compose ps
echo ""

# Ejecutar seed (datos iniciales)
echo -e "${YELLOW}🌱 Cargando datos iniciales (seed)...${NC}"
docker-compose exec -T backend python seed.py || echo -e "${YELLOW}⚠️  Advertencia: No se pudieron cargar datos iniciales${NC}"
echo ""

# Mostrar información de acceso
echo -e "${GREEN}========================================="
echo "  ✓ EvalPro está listo!"
echo "=========================================${NC}"
echo ""
echo "📱 Accede a la aplicación:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8001"
echo "   API Docs: http://localhost:8001/docs"
echo ""
echo "👤 Credenciales de prueba:"
echo "   Admin: maria@empresa.com / maria123"
echo "   Empleado: juan@empresa.com / juan123"
echo ""
echo "📝 Comandos útiles:"
echo "   Ver logs: docker-compose logs -f"
echo "   Detener: docker-compose down"
echo "   Reiniciar: docker-compose restart"
echo ""
echo -e "${GREEN}¡Disfruta de EvalPro! 🎉${NC}"
