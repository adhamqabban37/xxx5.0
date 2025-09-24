# ===================================
# XENLIX AEO PLATFORM - MAKEFILE
# One-command Docker deployment for production
# ===================================

.PHONY: help up down logs health build clean restart status test

# Default target
.DEFAULT_GOAL := help

# Colors for output
RED=\033[0;31m
GREEN=\033[0;32m
YELLOW=\033[0;33m
BLUE=\033[0;34m
MAGENTA=\033[0;35m
CYAN=\033[0;36m
NC=\033[0m # No Color

# Docker Compose command
DOCKER_COMPOSE=docker-compose

# ===================================
# MAIN COMMANDS
# ===================================

## 🚀 Start all services (main command)
up:
	@echo "${GREEN}🚀 Starting Xenlix AEO Platform...${NC}"
	@echo "${YELLOW}📋 Checking prerequisites...${NC}"
	@$(MAKE) check-env
	@$(MAKE) check-docker
	@echo "${BLUE}🏗️  Building and starting services...${NC}"
	$(DOCKER_COMPOSE) up --build -d
	@echo "${GREEN}✅ Services started! Waiting for health checks...${NC}"
	@sleep 10
	@$(MAKE) health
	@$(MAKE) status
	@echo "${GREEN}🎉 Xenlix AEO Platform is running!${NC}"
	@echo "${CYAN}📊 Access URLs:${NC}"
	@echo "   🌐 Main App:     http://localhost:3000"
	@echo "   🕸️  Crawl4AI:    http://localhost:8001"
	@echo "   🗄️  Redis:       localhost:6379"
	@echo "   📊 Health Check: http://localhost:3000/api/health"

## 🛑 Stop all services
down:
	@echo "${RED}🛑 Stopping Xenlix AEO Platform...${NC}"
	$(DOCKER_COMPOSE) down
	@echo "${GREEN}✅ All services stopped${NC}"

## 📋 Show service logs
logs:
	@echo "${BLUE}📋 Showing service logs...${NC}"
	$(DOCKER_COMPOSE) logs -f --tail=100

## 🏥 Check health status
health:
	@echo "${BLUE}🏥 Checking service health...${NC}"
	@echo "${YELLOW}Redis:${NC}"
	@docker exec xenlix-redis redis-cli ping 2>/dev/null || echo "${RED}❌ Redis unhealthy${NC}"
	@echo "${YELLOW}Crawl4AI:${NC}"
	@curl -sf http://localhost:8001/health >/dev/null && echo "${GREEN}✅ Crawl4AI healthy${NC}" || echo "${RED}❌ Crawl4AI unhealthy${NC}"
	@echo "${YELLOW}Main App:${NC}"
	@curl -sf http://localhost:3000/api/health >/dev/null && echo "${GREEN}✅ App healthy${NC}" || echo "${RED}❌ App unhealthy${NC}"

## 🏗️ Build services without starting
build:
	@echo "${BLUE}🏗️  Building Docker images...${NC}"
	$(DOCKER_COMPOSE) build

## 🧹 Clean up containers, images, and volumes
clean:
	@echo "${RED}🧹 Cleaning up Docker resources...${NC}"
	$(DOCKER_COMPOSE) down -v --rmi all --remove-orphans
	@docker system prune -f
	@echo "${GREEN}✅ Cleanup complete${NC}"

## 🔄 Restart all services
restart:
	@echo "${YELLOW}🔄 Restarting services...${NC}"
	@$(MAKE) down
	@sleep 5
	@$(MAKE) up

## 📊 Show service status
status:
	@echo "${BLUE}📊 Service Status:${NC}"
	@$(DOCKER_COMPOSE) ps

## 🧪 Run end-to-end test
test:
	@echo "${BLUE}🧪 Running end-to-end tests...${NC}"
	@echo "${YELLOW}Testing health endpoints...${NC}"
	@$(MAKE) health
	@echo "${YELLOW}Testing AEO analysis...${NC}"
	@curl -X POST http://localhost:3000/api/aeo-score \
		-H "Content-Type: application/json" \
		-d '{"url":"https://example.com","queries":["What services do you offer?"]}' \
		-w "\nResponse Code: %{http_code}\n" || echo "${RED}❌ AEO test failed${NC}"
	@echo "${GREEN}✅ End-to-end test complete${NC}"

# ===================================
# DEVELOPMENT COMMANDS
# ===================================

## 🔧 Start in development mode
dev:
	@echo "${GREEN}🔧 Starting development environment...${NC}"
	$(DOCKER_COMPOSE) -f docker-compose.yml -f docker-compose.dev.yml up --build

## 🐛 Debug - attach to running containers
debug:
	@echo "${MAGENTA}🐛 Available containers for debugging:${NC}"
	@$(DOCKER_COMPOSE) ps
	@echo "${YELLOW}To attach to a container:${NC}"
	@echo "  docker exec -it xenlix-app sh"
	@echo "  docker exec -it xenlix-crawl4ai sh"
	@echo "  docker exec -it xenlix-redis sh"

## 📊 Start with monitoring stack
monitor:
	@echo "${GREEN}📊 Starting with monitoring...${NC}"
	$(DOCKER_COMPOSE) --profile monitoring up -d
	@echo "${CYAN}Monitoring URLs:${NC}"
	@echo "   📊 Prometheus: http://localhost:9090"
	@echo "   📈 Grafana:    http://localhost:3001"

## 🗄️ Start with PostgreSQL
postgres:
	@echo "${GREEN}🗄️  Starting with PostgreSQL...${NC}"
	$(DOCKER_COMPOSE) --profile postgres up -d

# ===================================
# UTILITY COMMANDS
# ===================================

## 🔍 Check prerequisites
check-env:
	@echo "${BLUE}🔍 Checking environment file...${NC}"
	@if [ ! -f .env ]; then \
		echo "${RED}❌ .env file not found. Creating from template...${NC}"; \
		cp .env.example .env; \
		echo "${YELLOW}⚠️  Please edit .env file with your actual values${NC}"; \
		echo "${YELLOW}   Required: HUGGINGFACE_API_TOKEN, FIREBASE_*, NEXTAUTH_SECRET${NC}"; \
	else \
		echo "${GREEN}✅ .env file found${NC}"; \
	fi

## 🐳 Check Docker availability
check-docker:
	@echo "${BLUE}🐳 Checking Docker...${NC}"
	@docker --version >/dev/null 2>&1 || (echo "${RED}❌ Docker not installed${NC}" && exit 1)
	@docker-compose --version >/dev/null 2>&1 || (echo "${RED}❌ Docker Compose not installed${NC}" && exit 1)
	@echo "${GREEN}✅ Docker is available${NC}"

## 📊 Show resource usage
stats:
	@echo "${BLUE}📊 Container resource usage:${NC}"
	@docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

## 📝 Show logs for specific service
logs-%:
	@echo "${BLUE}📝 Showing logs for $*...${NC}"
	@$(DOCKER_COMPOSE) logs -f --tail=100 $*

## 🔄 Restart specific service  
restart-%:
	@echo "${YELLOW}🔄 Restarting $*...${NC}"
	@$(DOCKER_COMPOSE) restart $*

# ===================================
# HELP
# ===================================

## 📚 Show this help message
help:
	@echo "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
	@echo "${CYAN}║                    XENLIX AEO PLATFORM                  ║${NC}"
	@echo "${CYAN}║                   Docker Deployment                     ║${NC}"
	@echo "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
	@echo ""
	@echo "${GREEN}🚀 QUICK START:${NC}"
	@echo "   ${YELLOW}make up${NC}     - Start all services (main command)"
	@echo ""
	@echo "${BLUE}📋 MAIN COMMANDS:${NC}"
	@awk 'BEGIN {FS = ":.*?## "}; /^[a-zA-Z_-]+:.*?## / {printf "   ${YELLOW}make %-12s${NC} - %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo ""
	@echo "${MAGENTA}🔧 DEVELOPMENT:${NC}"
	@echo "   ${YELLOW}make dev${NC}      - Start in development mode"
	@echo "   ${YELLOW}make debug${NC}    - Show debug information"
	@echo "   ${YELLOW}make monitor${NC}  - Start with monitoring stack"
	@echo "   ${YELLOW}make postgres${NC} - Start with PostgreSQL"
	@echo ""
	@echo "${CYAN}📊 MONITORING:${NC}"
	@echo "   ${YELLOW}make stats${NC}    - Show resource usage"
	@echo "   ${YELLOW}make logs-app${NC} - Show app logs"
	@echo "   ${YELLOW}make logs-crawl4ai${NC} - Show crawl4ai logs"
	@echo ""
	@echo "${GREEN}🎯 EXAMPLE WORKFLOW:${NC}"
	@echo "   1. ${YELLOW}cp .env.example .env${NC}"
	@echo "   2. ${YELLOW}# Edit .env with your API keys${NC}"
	@echo "   3. ${YELLOW}make up${NC}"
	@echo "   4. ${YELLOW}make test${NC}"
	@echo "   5. ${YELLOW}# Visit http://localhost:3000${NC}"