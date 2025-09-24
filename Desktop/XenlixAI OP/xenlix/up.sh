#!/bin/bash

# ===================================
# XENLIX AEO PLATFORM - BASH DEPLOYMENT SCRIPT
# One-command Docker deployment for Unix/Linux/WSL
# ===================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_colored() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to check prerequisites
check_prerequisites() {
    print_colored $BLUE "🔍 Checking prerequisites..."
    
    # Check .env file
    if [ ! -f ".env" ]; then
        print_colored $RED "❌ .env file not found. Creating from template..."
        cp .env.example .env
        print_colored $YELLOW "⚠️  Please edit .env file with your actual values"
        print_colored $YELLOW "   Required: HUGGINGFACE_API_TOKEN, FIREBASE_*, NEXTAUTH_SECRET"
    else
        print_colored $GREEN "✅ .env file found"
    fi
    
    # Check Docker
    print_colored $BLUE "🐳 Checking Docker..."
    if ! command -v docker &> /dev/null; then
        print_colored $RED "❌ Docker not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_colored $RED "❌ Docker Compose not installed"
        exit 1
    fi
    
    print_colored $GREEN "✅ Docker is available"
}

# Function to start services
start_services() {
    print_colored $GREEN "🚀 Starting Xenlix AEO Platform..."
    check_prerequisites
    
    print_colored $BLUE "🏗️  Building and starting services..."
    docker-compose up --build -d
    
    print_colored $GREEN "✅ Services started! Waiting for health checks..."
    sleep 10
    
    check_health
    show_status
    
    print_colored $GREEN "🎉 Xenlix AEO Platform is running!"
    print_colored $CYAN "📊 Access URLs:"
    echo "   🌐 Main App:     http://localhost:3000"
    echo "   🕸️  Crawl4AI:    http://localhost:8001"
    echo "   🗄️  Redis:       localhost:6379"
    echo "   📊 Health Check: http://localhost:3000/api/health"
}

# Function to stop services
stop_services() {
    print_colored $RED "🛑 Stopping Xenlix AEO Platform..."
    docker-compose down
    print_colored $GREEN "✅ All services stopped"
}

# Function to show logs
show_logs() {
    local service=${1:-""}
    if [ -n "$service" ]; then
        print_colored $BLUE "📝 Showing logs for $service..."
        docker-compose logs -f --tail=100 "$service"
    else
        print_colored $BLUE "📋 Showing service logs..."
        docker-compose logs -f --tail=100
    fi
}

# Function to check health
check_health() {
    print_colored $BLUE "🏥 Checking service health..."
    
    # Check Redis
    print_colored $YELLOW "Redis:"
    if docker exec xenlix-redis redis-cli ping >/dev/null 2>&1; then
        print_colored $GREEN "✅ Redis healthy"
    else
        print_colored $RED "❌ Redis unhealthy"
    fi
    
    # Check Crawl4AI
    print_colored $YELLOW "Crawl4AI:"
    if curl -sf http://localhost:8001/health >/dev/null 2>&1; then
        print_colored $GREEN "✅ Crawl4AI healthy"
    else
        print_colored $RED "❌ Crawl4AI unhealthy"
    fi
    
    # Check Main App
    print_colored $YELLOW "Main App:"
    if curl -sf http://localhost:3000/api/health >/dev/null 2>&1; then
        print_colored $GREEN "✅ App healthy"
    else
        print_colored $RED "❌ App unhealthy"
    fi
}

# Function to build services
build_services() {
    print_colored $BLUE "🏗️  Building Docker images..."
    docker-compose build
}

# Function to clean services
clean_services() {
    print_colored $RED "🧹 Cleaning up Docker resources..."
    docker-compose down -v --rmi all --remove-orphans
    docker system prune -f
    print_colored $GREEN "✅ Cleanup complete"
}

# Function to restart services
restart_services() {
    print_colored $YELLOW "🔄 Restarting services..."
    stop_services
    sleep 5
    start_services
}

# Function to show status
show_status() {
    print_colored $BLUE "📊 Service Status:"
    docker-compose ps
}

# Function to test end-to-end
test_services() {
    print_colored $BLUE "🧪 Running end-to-end tests..."
    
    print_colored $YELLOW "Testing health endpoints..."
    check_health
    
    print_colored $YELLOW "Testing AEO analysis..."
    response=$(curl -s -X POST http://localhost:3000/api/aeo-score \
        -H "Content-Type: application/json" \
        -d '{"url":"https://example.com","queries":["What services do you offer?"]}' \
        -w "%{http_code}")
    
    if [[ $response == *"200"* ]] || [[ $response == *"201"* ]]; then
        print_colored $GREEN "✅ AEO test successful"
    else
        print_colored $RED "❌ AEO test failed"
    fi
    
    print_colored $GREEN "✅ End-to-end test complete"
}

# Function to show stats
show_stats() {
    print_colored $BLUE "📊 Container resource usage:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
}

# Function to show help
show_help() {
    print_colored $CYAN "╔══════════════════════════════════════════════════════════╗"
    print_colored $CYAN "║                    XENLIX AEO PLATFORM                  ║"
    print_colored $CYAN "║                   Docker Deployment                     ║"
    print_colored $CYAN "╚══════════════════════════════════════════════════════════╝"
    echo ""
    print_colored $GREEN "🚀 QUICK START:"
    print_colored $YELLOW "   ./up.sh up        - Start all services (main command)"
    echo ""
    print_colored $BLUE "📋 MAIN COMMANDS:"
    print_colored $YELLOW "   ./up.sh up        - Start all services"
    print_colored $YELLOW "   ./up.sh down      - Stop all services"
    print_colored $YELLOW "   ./up.sh logs      - Show service logs"
    print_colored $YELLOW "   ./up.sh health    - Check health status"
    print_colored $YELLOW "   ./up.sh build     - Build services without starting"
    print_colored $YELLOW "   ./up.sh clean     - Clean up containers and volumes"
    print_colored $YELLOW "   ./up.sh restart   - Restart all services"
    print_colored $YELLOW "   ./up.sh status    - Show service status"
    print_colored $YELLOW "   ./up.sh test      - Run end-to-end test"
    print_colored $YELLOW "   ./up.sh stats     - Show resource usage"
    echo ""
    print_colored $BLUE "🔧 SERVICE-SPECIFIC:"
    print_colored $YELLOW "   ./up.sh logs app      - Show app logs"
    print_colored $YELLOW "   ./up.sh logs crawl4ai - Show crawl4ai logs"
    echo ""
    print_colored $GREEN "🎯 EXAMPLE WORKFLOW:"
    print_colored $YELLOW "   1. cp .env.example .env"
    print_colored $YELLOW "   2. # Edit .env with your API keys"
    print_colored $YELLOW "   3. ./up.sh up"
    print_colored $YELLOW "   4. ./up.sh test"
    print_colored $YELLOW "   5. # Visit http://localhost:3000"
}

# Main script logic
case "${1:-help}" in
    "up")
        start_services
        ;;
    "down")
        stop_services
        ;;
    "logs")
        show_logs "$2"
        ;;
    "health")
        check_health
        ;;
    "build")
        build_services
        ;;
    "clean")
        clean_services
        ;;
    "restart")
        restart_services
        ;;
    "status")
        show_status
        ;;
    "test")
        test_services
        ;;
    "stats")
        show_stats
        ;;
    "help"|*)
        show_help
        ;;
esac