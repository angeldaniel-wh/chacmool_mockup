# 🚀 Configuración para Producción - EvalPro

Esta guía cubre la configuración recomendada para desplegar EvalPro en producción.

## 🔒 Seguridad

### 1. Variables de Entorno Seguras

#### Backend (`backend/.env`)

```env
# MongoDB - Usar credenciales seguras
MONGO_URL=mongodb://usuario_seguro:password_seguro@mongodb:27017
DB_NAME=evalpro_prod

# JWT Secret - GENERAR UNO NUEVO
JWT_SECRET=USAR_COMANDO_ABAJO_PARA_GENERAR

# Entorno
ENVIRONMENT=production
```

**Generar JWT_SECRET seguro:**
```bash
openssl rand -hex 32
```

#### Frontend (`frontend/.env`)

```env
# Usar dominio real en producción
REACT_APP_BACKEND_URL=https://api.tudominio.com
```

### 2. MongoDB con Autenticación

Modificar `docker-compose.yml`:

```yaml
mongodb:
  image: mongo:7.0
  environment:
    MONGO_INITDB_ROOT_USERNAME: admin
    MONGO_INITDB_ROOT_PASSWORD: password_super_seguro
    MONGO_INITDB_DATABASE: evalpro_prod
```

### 3. HTTPS con Reverse Proxy

#### Opción A: Nginx como Reverse Proxy

**Instalar Nginx:**
```bash
sudo apt-get install nginx certbot python3-certbot-nginx
```

**Configurar Nginx (`/etc/nginx/sites-available/evalpro`):**

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name tudominio.com www.tudominio.com;

    # SSL Certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tudominio.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    location /api/auth/login {
        limit_req zone=api_limit burst=5;
        proxy_pass http://localhost:8001;
    }
}
```

**Habilitar configuración:**
```bash
sudo ln -s /etc/nginx/sites-available/evalpro /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**Obtener certificado SSL:**
```bash
sudo certbot --nginx -d tudominio.com -d www.tudominio.com
```

---

## 🔧 Optimizaciones de Producción

### 1. Frontend - Build Optimizado

Modificar `frontend/Dockerfile` para producción:

```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

# Stage 2: Production
FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Crear `frontend/nginx.conf`:**

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # React Router - redirect to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 2. Backend - Producción

Modificar `backend/Dockerfile` para producción:

```dockerfile
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/ -r requirements.txt

COPY . .

EXPOSE 8001

# Usar Gunicorn para producción
CMD ["gunicorn", "server:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "-b", "0.0.0.0:8001"]
```

**Agregar Gunicorn a `requirements.txt`:**
```
gunicorn>=21.2.0
```

### 3. Docker Compose - Producción

Crear `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USER}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
      MONGO_INITDB_DATABASE: ${DB_NAME}
    volumes:
      - mongodb_data:/data/db
      - mongodb_config:/data/configdb
    networks:
      - evalpro-network
    # No exponer puerto 27017 públicamente
    expose:
      - "27017"

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: always
    expose:
      - "8001"
    environment:
      - MONGO_URL=mongodb://${MONGO_ROOT_USER}:${MONGO_ROOT_PASSWORD}@mongodb:27017
      - DB_NAME=${DB_NAME}
      - JWT_SECRET=${JWT_SECRET}
      - ENVIRONMENT=production
    depends_on:
      - mongodb
    networks:
      - evalpro-network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    restart: always
    expose:
      - "80"
    depends_on:
      - backend
    networks:
      - evalpro-network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

networks:
  evalpro-network:
    driver: bridge

volumes:
  mongodb_data:
    driver: local
  mongodb_config:
    driver: local
```

**Usar en producción:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🔄 Backups Automáticos

### Script de Backup de MongoDB

Crear `scripts/backup-mongodb.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="evalpro_backup_$DATE"

mkdir -p $BACKUP_DIR

# Backup de MongoDB
docker-compose exec -T mongodb mongodump \
    --db evalpro_prod \
    --archive=/backup/$BACKUP_NAME.archive \
    --gzip

# Copiar backup del contenedor al host
docker cp evalpro-mongodb:/backup/$BACKUP_NAME.archive $BACKUP_DIR/

# Eliminar backups antiguos (más de 7 días)
find $BACKUP_DIR -name "*.archive" -mtime +7 -delete

echo "✓ Backup completado: $BACKUP_DIR/$BACKUP_NAME.archive"
```

### Configurar Cron para Backups Diarios

```bash
# Editar crontab
crontab -e

# Agregar línea para backup diario a las 2 AM
0 2 * * * /ruta/al/proyecto/scripts/backup-mongodb.sh >> /var/log/evalpro-backup.log 2>&1
```

---

## 📊 Monitoreo

### Logs Centralizados

**Ver logs de producción:**
```bash
# Todos los servicios
docker-compose -f docker-compose.prod.yml logs -f

# Solo backend
docker-compose -f docker-compose.prod.yml logs -f backend

# Últimas 100 líneas
docker-compose -f docker-compose.prod.yml logs --tail=100 backend
```

### Health Checks

Agregar health checks a `docker-compose.prod.yml`:

```yaml
backend:
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8001/health"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 40s
```

Implementar endpoint `/health` en backend:

```python
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc)}
```

---

## 🛡️ Firewall

### Configurar UFW (Ubuntu Firewall)

```bash
# Habilitar firewall
sudo ufw enable

# Permitir SSH
sudo ufw allow 22/tcp

# Permitir HTTP y HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Bloquear acceso directo a puertos de servicios
# (solo accesibles vía Nginx)
sudo ufw deny 3000/tcp
sudo ufw deny 8001/tcp
sudo ufw deny 27017/tcp

# Ver estado
sudo ufw status
```

---

## 📈 Performance

### 1. Redis para Caché (Opcional)

Agregar Redis a `docker-compose.prod.yml`:

```yaml
redis:
  image: redis:7-alpine
  restart: always
  command: redis-server --requirepass tu_password_redis
  volumes:
    - redis_data:/data
  networks:
    - evalpro-network
  expose:
    - "6379"

volumes:
  redis_data:
    driver: local
```

### 2. CDN para Assets Estáticos

Usar un CDN (Cloudflare, AWS CloudFront) para servir assets estáticos del frontend.

### 3. Database Indexing

Conectarse a MongoDB y crear índices:

```javascript
// Conectar a MongoDB
db = db.getSiblingDB('evalpro_prod');

// Crear índices
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "employee_id": 1 });
db.empleado_a_evaluation.createIndex({ "empleado_id": 1 });
db.empleado_a_evaluation.createIndex({ "evaluador_id": 1 });
```

---

## 🔄 CI/CD (Opcional)

### GitHub Actions

Crear `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /ruta/al/proyecto
            git pull origin main
            docker-compose -f docker-compose.prod.yml up -d --build
```

---

## ✅ Checklist de Producción

- [ ] JWT_SECRET generado con `openssl rand -hex 32`
- [ ] MongoDB con autenticación habilitada
- [ ] HTTPS configurado con Let's Encrypt
- [ ] Nginx configurado como reverse proxy
- [ ] Firewall (UFW) configurado
- [ ] Backups automáticos configurados
- [ ] Health checks implementados
- [ ] Logs configurados con rotación
- [ ] Variables de entorno seguras
- [ ] Puertos internos no expuestos públicamente
- [ ] Rate limiting configurado
- [ ] Índices de MongoDB creados
- [ ] Frontend compilado para producción
- [ ] Gunicorn configurado en backend

---

## 📞 Mantenimiento

### Actualizar Aplicación

```bash
# Detener servicios
docker-compose -f docker-compose.prod.yml down

# Hacer backup
./scripts/backup-mongodb.sh

# Actualizar código
git pull origin main

# Reconstruir e iniciar
docker-compose -f docker-compose.prod.yml up -d --build
```

### Restaurar Backup

```bash
# Restaurar desde archivo
docker cp /backups/mongodb/evalpro_backup_FECHA.archive evalpro-mongodb:/backup/
docker-compose exec mongodb mongorestore --archive=/backup/evalpro_backup_FECHA.archive --gzip
```

---

**¡Listo para producción!** 🚀
