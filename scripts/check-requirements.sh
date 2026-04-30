#!/bin/bash

# Script para verificar requisitos del sistema antes de ejecutar EvalPro
set -e

echo "========================================="
echo "  Verificación de Requisitos - EvalPro"
echo "========================================="
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Contador de errores
ERRORS=0
WARNINGS=0

# Función para verificar comando
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✓${NC} $1 está instalado"
        if [ ! -z "$2" ]; then
            VERSION=$($1 $2 2>&1)
            echo "  Versión: $VERSION"
        fi
        return 0
    else
        echo -e "${RED}✗${NC} $1 NO está instalado"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

# Función para verificar puerto
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠${NC}  Puerto $1 está en uso"
        WARNINGS=$((WARNINGS + 1))
        echo "  Proceso: $(lsof -Pi :$1 -sTCP:LISTEN | tail -n 1)"
        return 1
    else
        echo -e "${GREEN}✓${NC} Puerto $1 está disponible"
        return 0
    fi
}

echo "Verificando comandos necesarios..."
echo ""

# Verificar Docker
check_command "docker" "--version"
echo ""

# Verificar Docker Compose
check_command "docker-compose" "--version"
echo ""

# Verificar permisos de Docker
echo "Verificando permisos de Docker..."
if groups $USER | grep -q '\bdocker\b'; then
    echo -e "${GREEN}✓${NC} Usuario $USER está en el grupo docker"
else
    echo -e "${YELLOW}⚠${NC}  Usuario $USER NO está en el grupo docker"
    echo "  Ejecuta: sudo usermod -aG docker $USER"
    echo "  Luego cierra sesión e inicia sesión nuevamente"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Verificar servicio Docker
echo "Verificando servicio Docker..."
if systemctl is-active --quiet docker; then
    echo -e "${GREEN}✓${NC} Servicio Docker está activo"
else
    echo -e "${RED}✗${NC} Servicio Docker NO está activo"
    echo "  Ejecuta: sudo systemctl start docker"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Verificar puertos
echo "Verificando disponibilidad de puertos..."
check_port 3000
check_port 8001
check_port 27017
echo ""

# Verificar archivos de configuración
echo "Verificando archivos de configuración..."
if [ -f "./backend/.env" ]; then
    echo -e "${GREEN}✓${NC} backend/.env existe"
else
    echo -e "${YELLOW}⚠${NC}  backend/.env NO existe"
    echo "  Se creará desde .env.example al ejecutar start.sh"
    WARNINGS=$((WARNINGS + 1))
fi

if [ -f "./frontend/.env" ]; then
    echo -e "${GREEN}✓${NC} frontend/.env existe"
else
    echo -e "${YELLOW}⚠${NC}  frontend/.env NO existe"
    echo "  Se creará desde .env.example al ejecutar start.sh"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Verificar recursos del sistema
echo "Verificando recursos del sistema..."

# RAM disponible
RAM_TOTAL=$(free -g | awk '/^Mem:/{print $2}')
RAM_AVAILABLE=$(free -g | awk '/^Mem:/{print $7}')

echo "RAM Total: ${RAM_TOTAL}GB"
echo "RAM Disponible: ${RAM_AVAILABLE}GB"

if [ "$RAM_AVAILABLE" -lt 2 ]; then
    echo -e "${YELLOW}⚠${NC}  RAM disponible es baja (< 2GB)"
    echo "  Recomendado: al menos 4GB de RAM"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✓${NC} RAM disponible es suficiente"
fi
echo ""

# Espacio en disco
DISK_AVAILABLE=$(df -h . | awk 'NR==2 {print $4}' | sed 's/G//')
echo "Espacio disponible en disco: ${DISK_AVAILABLE}GB"

if [ "${DISK_AVAILABLE%.*}" -lt 5 ]; then
    echo -e "${YELLOW}⚠${NC}  Espacio en disco es bajo (< 5GB)"
    echo "  Recomendado: al menos 10GB libres"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✓${NC} Espacio en disco es suficiente"
fi
echo ""

# Resumen
echo "========================================="
echo "  Resumen de Verificación"
echo "========================================="
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ Sistema listo para ejecutar EvalPro${NC}"
    echo ""
    echo "Siguiente paso: ./scripts/start.sh"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠  $WARNINGS advertencia(s) encontrada(s)${NC}"
    echo ""
    echo "El sistema debería funcionar, pero revisa las advertencias."
    echo "Siguiente paso: ./scripts/start.sh"
    exit 0
else
    echo -e "${RED}✗ $ERRORS error(es) encontrado(s)${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠  $WARNINGS advertencia(s) encontrada(s)${NC}"
    fi
    echo ""
    echo "Por favor, corrige los errores antes de continuar."
    exit 1
fi
