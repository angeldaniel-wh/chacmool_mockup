#!/bin/bash

# Script de instalación de Docker y Docker Compose para Ubuntu 20.04
set -e

echo "========================================="
echo "  Instalación de Docker en Ubuntu 20.04"
echo "========================================="
echo ""

# Verificar si se ejecuta como root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Este script debe ejecutarse con sudo"
    echo "Ejemplo: sudo ./scripts/install-docker-ubuntu.sh"
    exit 1
fi

# Actualizar repositorios
echo "📦 Actualizando repositorios..."
apt-get update

# Instalar dependencias
echo "📦 Instalando dependencias..."
apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Agregar clave GPG de Docker
echo "🔑 Agregando clave GPG de Docker..."
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Agregar repositorio de Docker
echo "📝 Agregando repositorio de Docker..."
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Actualizar repositorios nuevamente
apt-get update

# Instalar Docker Engine
echo "🐳 Instalando Docker Engine..."
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Verificar instalación de Docker
docker --version

# Instalar Docker Compose (standalone)
echo "🔧 Instalando Docker Compose..."
curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Verificar instalación de Docker Compose
docker-compose --version

# Agregar usuario actual al grupo docker
echo "👤 Configurando permisos de usuario..."
if [ -n "$SUDO_USER" ]; then
    usermod -aG docker $SUDO_USER
    echo "✓ Usuario $SUDO_USER agregado al grupo docker"
    echo ""
    echo "⚠️  IMPORTANTE: Debes cerrar sesión e iniciar sesión nuevamente"
    echo "   para que los cambios de grupo surtan efecto."
else
    echo "⚠️  Ejecuta manualmente: sudo usermod -aG docker \$USER"
fi

# Iniciar servicio de Docker
echo "🚀 Iniciando servicio Docker..."
systemctl start docker
systemctl enable docker

echo ""
echo "========================================="
echo "  ✓ Docker instalado exitosamente"
echo "========================================="
echo ""
echo "Versiones instaladas:"
docker --version
docker-compose --version
echo ""
echo "Próximos pasos:"
echo "1. Cerrar sesión e iniciar sesión nuevamente"
echo "2. Ejecutar: ./scripts/start.sh"
