#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting XenlixAI AEO Platform with Crawl4AI Integration${NC}\n"

# Function to check if port is in use
check_port() {
    local port=$1
    if netstat -an | grep -q ":$port "; then
        echo -e "${YELLOW}⚠️  Port $port is already in use${NC}"
        return 1
    fi
    return 0
}

# Function to start Crawl4AI service
start_crawl4ai() {
    echo -e "${BLUE}📡 Starting Crawl4AI Service...${NC}"
    
    cd crawl4ai-service
    
    # Install dependencies if requirements.txt changed
    if [ requirements.txt -nt .requirements_installed ] || [ ! -f .requirements_installed ]; then
        echo -e "${YELLOW}📦 Installing Python dependencies...${NC}"
        pip install -r requirements.txt
        touch .requirements_installed
    fi
    
    # Start the service
    echo -e "${GREEN}🎯 Crawl4AI Service starting on port 8000...${NC}"
    python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
    CRAWL4AI_PID=$!
    echo $CRAWL4AI_PID > .crawl4ai.pid
    
    # Wait for service to start
    echo -e "${YELLOW}⏳ Waiting for Crawl4AI service to start...${NC}"
    sleep 5
    
    # Health check
    if curl -s http://localhost:8000/health > /dev/null; then
        echo -e "${GREEN}✅ Crawl4AI Service is running on http://localhost:8000${NC}"
    else
        echo -e "${RED}❌ Failed to start Crawl4AI Service${NC}"
        return 1
    fi
    
    cd ..
}

# Function to start Next.js app
start_nextjs() {
    echo -e "${BLUE}⚛️  Starting Next.js Application...${NC}"
    
    # Install dependencies if package.json changed
    if [ package.json -nt node_modules/.installed ] || [ ! -d node_modules ]; then
        echo -e "${YELLOW}📦 Installing Node.js dependencies...${NC}"
        pnpm install
        touch node_modules/.installed
    fi
    
    # Start Next.js
    echo -e "${GREEN}🎯 Next.js Application starting on port 3000...${NC}"
    pnpm run dev &
    NEXTJS_PID=$!
    echo $NEXTJS_PID > .nextjs.pid
    
    # Wait for Next.js to start
    echo -e "${YELLOW}⏳ Waiting for Next.js application to start...${NC}"
    sleep 10
    
    # Health check
    if curl -s http://localhost:3000 > /dev/null; then
        echo -e "${GREEN}✅ Next.js Application is running on http://localhost:3000${NC}"
    else
        echo -e "${YELLOW}⚠️  Next.js Application may still be starting...${NC}"
    fi
}

# Cleanup function
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down services...${NC}"
    
    if [ -f .crawl4ai.pid ]; then
        CRAWL4AI_PID=$(cat .crawl4ai.pid)
        if kill -0 $CRAWL4AI_PID 2>/dev/null; then
            echo -e "${BLUE}📡 Stopping Crawl4AI Service...${NC}"
            kill $CRAWL4AI_PID
        fi
        rm .crawl4ai.pid
    fi
    
    if [ -f .nextjs.pid ]; then
        NEXTJS_PID=$(cat .nextjs.pid)
        if kill -0 $NEXTJS_PID 2>/dev/null; then
            echo -e "${BLUE}⚛️  Stopping Next.js Application...${NC}"
            kill $NEXTJS_PID
        fi
        rm .nextjs.pid
    fi
    
    echo -e "${GREEN}✅ All services stopped${NC}"
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Main execution
main() {
    # Check prerequisites
    if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
        echo -e "${RED}❌ Python is required but not installed${NC}"
        exit 1
    fi
    
    if ! command -v pnpm &> /dev/null; then
        echo -e "${RED}❌ pnpm is required but not installed${NC}"
        echo -e "${YELLOW}💡 Install with: npm install -g pnpm${NC}"
        exit 1
    fi
    
    # Check ports
    if ! check_port 8000; then
        echo -e "${RED}❌ Port 8000 is required for Crawl4AI service${NC}"
        exit 1
    fi
    
    if ! check_port 3000; then
        echo -e "${RED}❌ Port 3000 is required for Next.js application${NC}"
        exit 1
    fi
    
    # Start services
    start_crawl4ai
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to start Crawl4AI service${NC}"
        exit 1
    fi
    
    start_nextjs
    
    echo -e "\n${GREEN}🎉 All services started successfully!${NC}"
    echo -e "${BLUE}📊 Application: http://localhost:3000${NC}"
    echo -e "${BLUE}📡 Crawl4AI API: http://localhost:8000${NC}"
    echo -e "${BLUE}📋 API Docs: http://localhost:8000/docs${NC}"
    echo -e "\n${YELLOW}Press Ctrl+C to stop all services${NC}\n"
    
    # Wait for user interrupt
    wait
}

# Check if script should run in Docker
if [ "$1" = "--docker" ]; then
    echo -e "${BLUE}🐳 Starting services with Docker Compose...${NC}"
    docker-compose up --build
else
    main
fi