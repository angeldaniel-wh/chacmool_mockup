# 🚀 Guía Rápida de Inicio - EvalPro

Esta es la guía más rápida para poner en marcha EvalPro en Ubuntu 20.04.

## ⚡ Inicio Ultra Rápido (2 comandos)

```bash
# 1. Instalar Docker (solo primera vez)
sudo ./scripts/install-docker-ubuntu.sh

# Cerrar sesión e iniciar sesión nuevamente, luego:

# 2. Iniciar EvalPro
./scripts/start.sh
```

**¡Listo!** Accede a http://localhost:3000

---

## 🎯 Comandos Más Usados

```bash
# Ver ayuda de comandos disponibles
make help

# Verificar requisitos del sistema
./scripts/check-requirements.sh

# Iniciar la aplicación
make start
# o
./scripts/start.sh

# Detener la aplicación
make stop
# o
./scripts/stop.sh

# Ver logs en tiempo real
make logs

# Ver logs de un servicio específico
make logs-backend
make logs-frontend
make logs-db

# Reiniciar servicios
make restart

# Reconstruir después de cambios
make rebuild
```

---

## 🔑 Credenciales de Prueba

**Administrador:**
```
Email: maria@empresa.com
Password: maria123
```

**Empleado:**
```
Email: juan@empresa.com
Password: juan123
```

---

## 📍 URLs Importantes

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8001 |
| API Docs (Swagger) | http://localhost:8001/docs |
| API Docs (ReDoc) | http://localhost:8001/redoc |

---

## 🛠️ Troubleshooting Rápido

### No arranca la aplicación

```bash
# Ver logs de todos los servicios
make logs

# Verificar estado
make status

# Reiniciar todo
make restart
```

### Puerto ya en uso

```bash
# Ver qué proceso usa el puerto
sudo lsof -i :3000
sudo lsof -i :8001

# Detener el proceso o cambiar puerto en docker-compose.yml
```

### Permisos de Docker

```bash
# Agregar usuario al grupo docker
sudo usermod -aG docker $USER

# Cerrar sesión e iniciar sesión nuevamente
exit
```

### Limpiar y empezar de nuevo

```bash
# Detener y limpiar todo (BORRA DATOS)
make clean-all

# Volver a iniciar
make start
```

---

## 📦 Exportar el Proyecto

Para mover EvalPro a otra máquina:

```bash
# Crear archivo de exportación
./scripts/export.sh

# Esto crea: backups/evalpro-export-YYYYMMDD-HHMMSS.tar.gz
```

En la nueva máquina:

```bash
# Extraer
tar -xzf evalpro-export-*.tar.gz
cd evalpro

# Verificar requisitos
./scripts/check-requirements.sh

# Iniciar
./scripts/start.sh
```

---

## 🎓 Estructura del Proyecto

```
evalpro/
├── backend/              # API FastAPI + Python
├── frontend/             # React + Tailwind
├── scripts/              # Scripts de utilidad
├── docker-compose.yml    # Configuración Docker
├── Makefile             # Comandos simplificados
└── README_DOCKER.md     # Documentación completa
```

---

## 💡 Tips

1. **Usa el Makefile:** `make help` para ver todos los comandos
2. **Logs son tu amigo:** `make logs` para ver qué está pasando
3. **Guarda tus cambios:** Modifica `.env` files según necesites
4. **Backup regular:** Usa `./scripts/export.sh` para backups

---

## 📚 Documentación Completa

Lee `README_DOCKER.md` para información detallada sobre:
- Configuración avanzada
- Arquitectura del sistema
- Comandos Docker completos
- Troubleshooting extendido
- Configuración de producción

---

## ✅ Checklist de Instalación

- [ ] Docker instalado
- [ ] Docker Compose instalado
- [ ] Usuario agregado al grupo docker
- [ ] Sesión reiniciada
- [ ] `./scripts/start.sh` ejecutado
- [ ] http://localhost:3000 accesible
- [ ] Login con credenciales de prueba

---

**¿Todo listo?** ¡Disfruta de EvalPro! 🎉
