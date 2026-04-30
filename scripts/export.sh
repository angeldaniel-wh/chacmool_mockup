#!/bin/bash

# Script para exportar el proyecto EvalPro
set -e

echo "========================================="
echo "  Exportación de EvalPro"
echo "========================================="
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Nombre del archivo de exportación
EXPORT_NAME="evalpro-export-$(date +%Y%m%d-%H%M%S).tar.gz"
BACKUP_DIR="backups"

# Crear directorio de backups si no existe
mkdir -p $BACKUP_DIR

echo -e "${YELLOW}📦 Preparando exportación...${NC}"
echo ""

# Archivos y directorios a incluir
FILES_TO_EXPORT=(
    "backend"
    "frontend"
    "scripts"
    "docker-compose.yml"
    "Makefile"
    "README_DOCKER.md"
    "DESIGN_SYSTEM_EXPORT.md"
    "DESIGN_PROMPT_QUICK.md"
    "DESIGN_BOOTSTRAP_DJANGO.md"
    "DESIGN_BOOTSTRAP_QUICK.md"
)

# Archivos a excluir
EXCLUDE_PATTERNS=(
    "node_modules"
    "__pycache__"
    "*.pyc"
    ".git"
    "build"
    "dist"
    "*.log"
    ".env"
)

# Construir parámetros de exclusión
EXCLUDE_ARGS=""
for pattern in "${EXCLUDE_PATTERNS[@]}"; do
    EXCLUDE_ARGS="$EXCLUDE_ARGS --exclude=$pattern"
done

echo "Archivos incluidos:"
for file in "${FILES_TO_EXPORT[@]}"; do
    if [ -e "$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ⚠ $file (no existe)"
    fi
done
echo ""

echo "Patrones excluidos:"
for pattern in "${EXCLUDE_PATTERNS[@]}"; do
    echo "  - $pattern"
done
echo ""

# Crear archivo tar.gz
echo -e "${YELLOW}🗜️  Comprimiendo archivos...${NC}"
tar -czf "$BACKUP_DIR/$EXPORT_NAME" $EXCLUDE_ARGS "${FILES_TO_EXPORT[@]}" 2>/dev/null || true

# Verificar si la exportación fue exitosa
if [ -f "$BACKUP_DIR/$EXPORT_NAME" ]; then
    FILE_SIZE=$(du -h "$BACKUP_DIR/$EXPORT_NAME" | cut -f1)
    echo -e "${GREEN}✓ Exportación completada exitosamente${NC}"
    echo ""
    echo "Archivo: $BACKUP_DIR/$EXPORT_NAME"
    echo "Tamaño: $FILE_SIZE"
    echo ""
    echo "========================================="
    echo "  Instrucciones de Importación"
    echo "========================================="
    echo ""
    echo "1. Copia el archivo a la nueva máquina:"
    echo "   scp $BACKUP_DIR/$EXPORT_NAME user@host:/ruta/destino/"
    echo ""
    echo "2. En la nueva máquina, extrae el archivo:"
    echo "   tar -xzf $EXPORT_NAME"
    echo ""
    echo "3. Navega al directorio extraído:"
    echo "   cd evalpro"
    echo ""
    echo "4. Verifica requisitos:"
    echo "   ./scripts/check-requirements.sh"
    echo ""
    echo "5. Inicia la aplicación:"
    echo "   ./scripts/start.sh"
    echo ""
else
    echo -e "${RED}✗ Error al crear la exportación${NC}"
    exit 1
fi
