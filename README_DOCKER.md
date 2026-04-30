# 🚀 EvalPro - Sistema de Evaluación de Empleados

Sistema completo de evaluación de empleados con KPIs y Evaluaciones 360, clasificación en matriz 9-box personalizada.

## 📋 Tabla de Contenidos

- [Requisitos del Sistema](#requisitos-del-sistema)
- [Instalación Rápida](#instalación-rápida)
- [Instalación Manual](#instalación-manual)
- [Configuración](#configuración)
- [Uso](#uso)
- [Comandos Útiles](#comandos-útiles)
- [Arquitectura](#arquitectura)
- [Troubleshooting](#troubleshooting)

---

## 💻 Requisitos del Sistema

### Sistema Operativo
- Ubuntu 20.04 LTS (recomendado)
- Ubuntu 22.04 LTS
- Debian 10+
- Otras distribuciones Linux compatibles con Docker

### Hardware Mínimo
- **CPU:** 2 cores
- **RAM:** 4 GB
- **Disco:** 10 GB libres
- **Red:** Conexión a Internet para descargar imágenes Docker

### Software Necesario
- Docker Engine 20.10+
- Docker Compose 2.0+
- Git (opcional, para clonar el repositorio)

---

## 🚀 Instalación Rápida

### Paso 1: Instalar Docker (si no está instalado)

```bash
# Ejecutar el script de instalación
sudo ./scripts/install-docker-ubuntu.sh

# Cerrar sesión e iniciar sesión nuevamente para aplicar cambios de grupo
exit
```

### Paso 2: Iniciar la Aplicación

```bash
# Ejecutar el script de inicio
./scripts/start.sh
```

¡Eso es todo! La aplicación estará disponible en:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8001
- **API Docs:** http://localhost:8001/docs

### Credenciales de Prueba

**Administrador:**
- Email: `maria@empresa.com`
- Password: `maria123`

**Empleado:**
- Email: `juan@empresa.com`
- Password: `juan123`

---

## 🔧 Instalación Manual

### 1. Instalar Docker y Docker Compose

#### En Ubuntu 20.04/22.04:

```bash
# Actualizar repositorios
sudo apt-get update

# Instalar dependencias
sudo apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Agregar clave GPG de Docker
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Agregar repositorio de Docker
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Instalar Docker Compose standalone
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Agregar usuario al grupo docker
sudo usermod -aG docker $USER

# Verificar instalación
docker --version
docker-compose --version
```

**⚠️ IMPORTANTE:** Después de agregar tu usuario al grupo docker, debes cerrar sesión e iniciar sesión nuevamente.

### 2. Preparar el Proyecto

```bash
# Navegar al directorio del proyecto
cd /ruta/al/proyecto/evalpro

# Crear archivos .env desde los ejemplos
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# (Opcional) Editar variables de entorno
nano backend/.env
nano frontend/.env
```

### 3. Construir e Iniciar los Contenedores

```bash
# Construir imágenes Docker
docker-compose build

# Iniciar servicios en segundo plano
docker-compose up -d

# Ver logs en tiempo real
docker-compose logs -f
```

### 4. Cargar Datos Iniciales

```bash
# Ejecutar script de seed
docker-compose exec backend python seed.py
```

---

## ⚙️ Configuración

### Variables de Entorno

#### Backend (`backend/.env`)

```env
# MongoDB
MONGO_URL=mongodb://mongodb:27017
DB_NAME=evalpro_db

# Seguridad (¡CAMBIAR EN PRODUCCIÓN!)
JWT_SECRET=your-super-secret-jwt-key-change-in-production-please

# Entorno
ENVIRONMENT=development
```

**🔒 Generar JWT_SECRET seguro:**
```bash
openssl rand -hex 32
```

#### Frontend (`frontend/.env`)

```env
# URL del Backend (para el navegador)
REACT_APP_BACKEND_URL=http://localhost:8001
```

**⚠️ Nota:** La URL debe apuntar a `localhost:8001`, no a `backend:8001`, ya que el navegador necesita acceso directo desde la máquina host.

### Puertos Utilizados

| Servicio  | Puerto | Descripción                    |
|-----------|--------|--------------------------------|
| Frontend  | 3000   | Interfaz web React             |
| Backend   | 8001   | API FastAPI                    |
| MongoDB   | 27017  | Base de datos                  |

**Cambiar puertos:**

Edita `docker-compose.yml`:

```yaml
services:
  frontend:
    ports:
      - "8080:3000"  # Cambia 8080 por el puerto deseado
```

---

## 📱 Uso

### Acceder a la Aplicación

1. Abre tu navegador en: http://localhost:3000
2. Inicia sesión con las credenciales de prueba
3. Explora las diferentes secciones:
   - **Dashboard:** Vista general del sistema
   - **Mi Perfil:** Información personal del usuario
   - **Empleado A:** Clasificación en matriz 9-box
   - **Evaluaciones 360:** Crear y gestionar evaluaciones
   - **PDI:** Plan de Desarrollo Individual
   - **KPIs:** Indicadores clave de rendimiento
   - **Aciertos y Desaciertos:** Evaluación bilateral

### API Documentation

Accede a la documentación interactiva de la API en:
- **Swagger UI:** http://localhost:8001/docs
- **ReDoc:** http://localhost:8001/redoc

---

## 🛠️ Comandos Útiles

### Gestión de Servicios

```bash
# Iniciar todos los servicios
docker-compose up -d

# Detener todos los servicios
docker-compose down

# Detener y eliminar volúmenes (⚠️ borra la base de datos)
docker-compose down -v

# Reiniciar un servicio específico
docker-compose restart backend
docker-compose restart frontend
docker-compose restart mongodb

# Ver estado de los servicios
docker-compose ps
```

### Logs y Debugging

```bash
# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb

# Ver últimas 100 líneas
docker-compose logs --tail=100 backend
```

### Ejecutar Comandos en Contenedores

```bash
# Backend: Shell Python
docker-compose exec backend python

# Backend: Ejecutar seed
docker-compose exec backend python seed.py

# Frontend: Shell del contenedor
docker-compose exec frontend sh

# MongoDB: Cliente mongo
docker-compose exec mongodb mongosh evalpro_db
```

### Reconstruir Contenedores

```bash
# Reconstruir después de cambios en código
docker-compose up -d --build

# Reconstruir un servicio específico
docker-compose build backend
docker-compose up -d backend
```

### Limpiar Docker

```bash
# Eliminar contenedores detenidos
docker container prune -f

# Eliminar imágenes sin usar
docker image prune -a -f

# Eliminar volúmenes sin usar
docker volume prune -f

# Limpieza completa del sistema
docker system prune -a --volumes -f
```

---

## 🏗️ Arquitectura

### Estructura del Proyecto

```
evalpro/
├── backend/                    # API FastAPI
│   ├── server.py              # Punto de entrada
│   ├── seed.py                # Datos iniciales
│   ├── models/                # Modelos Pydantic
│   ├── routes/                # Endpoints de la API
│   ├── requirements.txt       # Dependencias Python
│   ├── Dockerfile             # Imagen Docker backend
│   └── .env                   # Variables de entorno
│
├── frontend/                   # Aplicación React
│   ├── src/
│   │   ├── pages/             # Componentes de página
│   │   ├── contexts/          # Context API
│   │   ├── services/          # API calls
│   │   └── components/        # Componentes UI
│   ├── public/                # Assets estáticos
│   ├── package.json           # Dependencias Node
│   ├── Dockerfile             # Imagen Docker frontend
│   └── .env                   # Variables de entorno
│
├── scripts/                    # Scripts de utilidad
│   ├── start.sh               # Inicio rápido
│   ├── stop.sh                # Detener servicios
│   └── install-docker-ubuntu.sh  # Instalar Docker
│
├── docker-compose.yml         # Orquestación de servicios
└── README.md                  # Esta documentación
```

### Stack Tecnológico

**Frontend:**
- React 19
- Tailwind CSS
- Lucide React (iconos)
- React Router DOM
- Axios

**Backend:**
- FastAPI
- Python 3.11
- Motor (async MongoDB driver)
- Pydantic
- JWT Authentication

**Base de Datos:**
- MongoDB 7.0

**DevOps:**
- Docker
- Docker Compose

### Flujo de Datos

```
Navegador → Frontend (React:3000)
              ↓ HTTP
           Backend (FastAPI:8001)
              ↓ Motor
           MongoDB (mongo:27017)
```

---

## 🐛 Troubleshooting

### El frontend no carga

**Problema:** Navegador muestra error de conexión

**Solución:**
```bash
# Verificar que el servicio esté corriendo
docker-compose ps

# Reiniciar frontend
docker-compose restart frontend

# Ver logs
docker-compose logs -f frontend
```

### Error "Cannot connect to MongoDB"

**Problema:** Backend no puede conectarse a la base de datos

**Solución:**
```bash
# Verificar que MongoDB esté corriendo
docker-compose ps mongodb

# Verificar logs de MongoDB
docker-compose logs mongodb

# Reiniciar servicios
docker-compose restart mongodb backend
```

### Error "Port already in use"

**Problema:** Puerto 3000, 8001 o 27017 ya está en uso

**Solución:**
```bash
# Encontrar el proceso usando el puerto
sudo lsof -i :3000
sudo lsof -i :8001
sudo lsof -i :27017

# Detener el proceso o cambiar el puerto en docker-compose.yml
```

### Cambios en el código no se reflejan

**Problema:** Hot reload no funciona

**Solución:**
```bash
# Backend: Verificar volúmenes en docker-compose.yml
# Frontend: Asegurar que WATCHPACK_POLLING=true esté en .env

# Reconstruir contenedores
docker-compose up -d --build
```

### Permisos de Docker

**Problema:** "Permission denied" al ejecutar comandos docker

**Solución:**
```bash
# Agregar usuario al grupo docker
sudo usermod -aG docker $USER

# Cerrar sesión e iniciar sesión nuevamente
exit
```

### Limpiar y empezar de nuevo

```bash
# Detener y eliminar todo
docker-compose down -v

# Eliminar imágenes
docker rmi evalpro-backend evalpro-frontend

# Volver a construir e iniciar
./scripts/start.sh
```

### Verificar logs completos

```bash
# Logs de todos los servicios
docker-compose logs -f

# Entrar al contenedor para debugging
docker-compose exec backend bash
docker-compose exec frontend sh
```

---

## 📚 Documentación Adicional

- **Diseño Tailwind:** `/DESIGN_SYSTEM_EXPORT.md`
- **Diseño Bootstrap:** `/DESIGN_BOOTSTRAP_DJANGO.md`
- **Credenciales de Prueba:** `/memory/test_credentials.md`

---

## 🔐 Seguridad

### Recomendaciones para Producción

1. **Cambiar JWT_SECRET:**
   ```bash
   openssl rand -hex 32
   ```

2. **Usar HTTPS:**
   - Configurar reverse proxy (Nginx)
   - Obtener certificado SSL (Let's Encrypt)

3. **Configurar Firewall:**
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

4. **Variables de Entorno Seguras:**
   - No subir `.env` a Git
   - Usar secrets managers en producción

5. **Actualizar Dependencias:**
   ```bash
   # Backend
   pip list --outdated
   
   # Frontend
   yarn outdated
   ```

---

## 📞 Soporte

Si encuentras problemas:

1. Revisa la sección de [Troubleshooting](#troubleshooting)
2. Verifica los logs: `docker-compose logs -f`
3. Asegúrate de tener las versiones correctas de Docker

---

## 📄 Licencia

Este proyecto es privado y confidencial.

---

## 🎉 ¡Listo!

Tu aplicación EvalPro está corriendo en Docker. Accede a http://localhost:3000 y comienza a usar el sistema.

**¿Necesitas ayuda?** Revisa la documentación o los logs de los servicios.
