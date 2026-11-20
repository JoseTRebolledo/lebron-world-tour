.PHONY: help start lebron-world-tour build lint install

.DEFAULT_GOAL := help

help:
	@echo "LeBron World Tour — comandos"
	@echo ""
	@echo "  make / make help              Lista comandos"
	@echo "  make start                    Dev server (PORT 3011)"
	@echo "  make lebron-world-tour        Alias de start"
	@echo "  make build                    Build de producción"
	@echo "  make lint                     ESLint sobre ./src"
	@echo "  make install                  yarn install"
	@echo ""
	@echo "Deploy: ver DEPLOY.md (Supabase + Vercel)"

start lebron lebron-world-tour:
	@echo "→ yarn start (PORT 3011)"
	yarn start

build:
	@echo "→ yarn build"
	yarn build

lint:
	@echo "→ yarn lint"
	yarn lint

install:
	@echo "→ yarn install"
	yarn install
