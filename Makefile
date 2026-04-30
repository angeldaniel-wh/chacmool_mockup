# Makefile para EvalPro - Simplifica comandos Docker

.PHONY: help install start stop restart logs build clean seed shell-backend shell-frontend db-shell

# Comando por defecto
.DEFAULT_GOAL := help

# Colores para output
GREEN  := $(shell tput -Txterm setaf 2)
YELLOW := $(shell tput -Txterm setaf 3)
WHITE  := $(shell tput -Txterm setaf 7)
RESET  := $(shell tput -Txterm sgr0)

help: ## Mostrar esta ayuda
	@echo '$(GREEN)EvalPro - Comandos Disponibles:$(RESET)'
	@echo ''
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(YELLOW)%-15s$(RESET) %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ''

install: ## Instalar Docker (requiere sudo)
	@echo '$(GREEN)Instalando Docker...$(RESET)'
	sudo ./scripts/install-docker-ubuntu.sh

start: ## Iniciar todos los servicios
	@echo '$(GREEN)Iniciando EvalPro...$(RESET)'
	./scripts/start.sh

stop: ## Detener todos los servicios
	@echo '$(YELLOW)Deteniendo EvalPro...$(RESET)'
	./scripts/stop.sh

restart: ## Reiniciar todos los servicios
	@echo '$(YELLOW)Reiniciando servicios...$(RESET)'
	docker-compose restart

logs: ## Ver logs de todos los servicios
	docker-compose logs -f

logs-backend: ## Ver logs del backend
	docker-compose logs -f backend

logs-frontend: ## Ver logs del frontend
	docker-compose logs -f frontend

logs-db: ## Ver logs de MongoDB
	docker-compose logs -f mongodb

build: ## Reconstruir imágenes Docker
	@echo '$(GREEN)Reconstruyendo imágenes...$(RESET)'
	docker-compose build

rebuild: ## Reconstruir y reiniciar servicios
	@echo '$(GREEN)Reconstruyendo servicios...$(RESET)'
	docker-compose up -d --build

clean: ## Detener y eliminar contenedores (preserva volúmenes)
	@echo '$(YELLOW)Limpiando contenedores...$(RESET)'
	docker-compose down

clean-all: ## Detener y eliminar TODO (incluye volúmenes/datos)
	@echo '$(RED)⚠️  ADVERTENCIA: Esto eliminará TODOS los datos$(RESET)'
	@echo '$(YELLOW)Presiona Ctrl+C para cancelar, o Enter para continuar...$(RESET)'
	@read
	docker-compose down -v
	docker system prune -f

seed: ## Cargar datos iniciales en la base de datos
	@echo '$(GREEN)Cargando datos iniciales...$(RESET)'
	docker-compose exec backend python seed.py

shell-backend: ## Abrir shell en el contenedor backend
	docker-compose exec backend bash

shell-frontend: ## Abrir shell en el contenedor frontend
	docker-compose exec frontend sh

db-shell: ## Abrir MongoDB shell
	docker-compose exec mongodb mongosh evalpro_db

ps: ## Ver estado de los servicios
	docker-compose ps

up: ## Iniciar servicios (sin logs)
	docker-compose up -d

down: stop ## Alias para 'stop'

status: ps ## Alias para 'ps'
