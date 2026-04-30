#!/bin/bash

# Script de detención para EvalPro
set -e

echo "========================================="
echo "  Deteniendo EvalPro"
echo "========================================="
echo ""

# Detener servicios
echo "🛑 Deteniendo contenedores..."
docker-compose down

echo ""
echo "✓ Servicios detenidos exitosamente"
echo ""
echo "Nota: Los datos en MongoDB se han preservado."
echo "Para eliminar también los datos: docker-compose down -v"
