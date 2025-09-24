# ===================================
# XENLIX AEO PLATFORM - POWERSHELL DEPLOYMENT SCRIPT
# One-command Docker deployment for Windows
# ===================================

param(
    [Parameter(Position=0)]
    [string]$Command = "help",
    [string]$Service = ""
)

# Colors for output
$Red = [System.ConsoleColor]::Red
$Green = [System.ConsoleColor]::Green  
$Yellow = [System.ConsoleColor]::Yellow
$Blue = [System.ConsoleColor]::Blue
$Cyan = [System.ConsoleColor]::Cyan
$White = [System.ConsoleColor]::White

function Write-ColoredOutput {
    param($Text, $Color = $White)
    Write-Host $Text -ForegroundColor $Color
}

function Check-Prerequisites {
    Write-ColoredOutput "🔍 Checking prerequisites..." $Blue
    
    # Check .env file
    if (-not (Test-Path ".env")) {
        Write-ColoredOutput "❌ .env file not found. Creating from template..." $Red
        Copy-Item ".env.example" ".env"
        Write-ColoredOutput "⚠️  Please edit .env file with your actual values" $Yellow
        Write-ColoredOutput "   Required: HUGGINGFACE_API_TOKEN, FIREBASE_*, NEXTAUTH_SECRET" $Yellow
    } else {
        Write-ColoredOutput "✅ .env file found" $Green
    }
    
    # Check Docker
    Write-ColoredOutput "🐳 Checking Docker..." $Blue
    try {
        $null = docker --version
        $null = docker-compose --version
        Write-ColoredOutput "✅ Docker is available" $Green
    }
    catch {
        Write-ColoredOutput "❌ Docker not installed or not running" $Red
        exit 1
    }
}

function Start-XenlixServices {
    Write-ColoredOutput "🚀 Starting Xenlix AEO Platform..." $Green
    Check-Prerequisites
    
    Write-ColoredOutput "🏗️  Building and starting services..." $Blue
    docker-compose up --build -d
    
    Write-ColoredOutput "✅ Services started! Waiting for health checks..." $Green
    Start-Sleep 10
    
    Check-Health
    Show-Status
    
    Write-ColoredOutput "🎉 Xenlix AEO Platform is running!" $Green
    Write-ColoredOutput "📊 Access URLs:" $Cyan
    Write-ColoredOutput "   🌐 Main App:     http://localhost:3000" $White
    Write-ColoredOutput "   🕸️  Crawl4AI:    http://localhost:8001" $White
    Write-ColoredOutput "   🗄️  Redis:       localhost:6379" $White
    Write-ColoredOutput "   📊 Health Check: http://localhost:3000/api/health" $White
}

function Stop-XenlixServices {
    Write-ColoredOutput "🛑 Stopping Xenlix AEO Platform..." $Red
    docker-compose down
    Write-ColoredOutput "✅ All services stopped" $Green
}

function Show-Logs {
    if ($Service) {
        Write-ColoredOutput "📝 Showing logs for $Service..." $Blue
        docker-compose logs -f --tail=100 $Service
    } else {
        Write-ColoredOutput "📋 Showing service logs..." $Blue
        docker-compose logs -f --tail=100
    }
}

function Check-Health {
    Write-ColoredOutput "🏥 Checking service health..." $Blue
    
    # Check Redis
    Write-ColoredOutput "Redis:" $Yellow
    try {
        $null = docker exec xenlix-redis redis-cli ping 2>$null
        Write-ColoredOutput "✅ Redis healthy" $Green
    }
    catch {
        Write-ColoredOutput "❌ Redis unhealthy" $Red
    }
    
    # Check Crawl4AI
    Write-ColoredOutput "Crawl4AI:" $Yellow
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8001/health" -UseBasicParsing -TimeoutSec 5
        Write-ColoredOutput "✅ Crawl4AI healthy" $Green
    }
    catch {
        Write-ColoredOutput "❌ Crawl4AI unhealthy" $Red
    }
    
    # Check Main App
    Write-ColoredOutput "Main App:" $Yellow
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -TimeoutSec 5
        Write-ColoredOutput "✅ App healthy" $Green
    }
    catch {
        Write-ColoredOutput "❌ App unhealthy" $Red
    }
}

function Build-XenlixServices {
    Write-ColoredOutput "🏗️  Building Docker images..." $Blue
    docker-compose build
}

function Remove-XenlixServices {
    Write-ColoredOutput "🧹 Cleaning up Docker resources..." $Red
    docker-compose down -v --rmi all --remove-orphans
    docker system prune -f
    Write-ColoredOutput "✅ Cleanup complete" $Green
}

function Restart-XenlixServices {
    Write-ColoredOutput "🔄 Restarting services..." $Yellow
    Stop-XenlixServices
    Start-Sleep 5
    Start-XenlixServices
}

function Show-Status {
    Write-ColoredOutput "📊 Service Status:" $Blue
    docker-compose ps
}

function Test-EndToEnd {
    Write-ColoredOutput "🧪 Running end-to-end tests..." $Blue
    
    Write-ColoredOutput "Testing health endpoints..." $Yellow
    Check-Health
    
    Write-ColoredOutput "Testing AEO analysis..." $Yellow
    try {
        $body = @{
            url = "https://example.com"
            queries = @("What services do you offer?")
        } | ConvertTo-Json
        
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/aeo-score" `
            -Method POST `
            -ContentType "application/json" `
            -Body $body `
            -UseBasicParsing
            
        Write-ColoredOutput "✅ AEO test successful (Status: $($response.StatusCode))" $Green
    }
    catch {
        Write-ColoredOutput "❌ AEO test failed: $($_.Exception.Message)" $Red
    }
    
    Write-ColoredOutput "✅ End-to-end test complete" $Green
}

function Show-Stats {
    Write-ColoredOutput "📊 Container resource usage:" $Blue
    docker stats --no-stream --format "table {{.Container}}`t{{.CPUPerc}}`t{{.MemUsage}}"
}

function Show-Help {
    Write-ColoredOutput "╔══════════════════════════════════════════════════════════╗" $Cyan
    Write-ColoredOutput "║                    XENLIX AEO PLATFORM                  ║" $Cyan
    Write-ColoredOutput "║                   Docker Deployment                     ║" $Cyan
    Write-ColoredOutput "╚══════════════════════════════════════════════════════════╝" $Cyan
    Write-Host ""
    Write-ColoredOutput "🚀 QUICK START:" $Green
    Write-ColoredOutput "   .\up.ps1 up        - Start all services (main command)" $Yellow
    Write-Host ""
    Write-ColoredOutput "📋 MAIN COMMANDS:" $Blue
    Write-ColoredOutput "   .\up.ps1 up        - Start all services" $Yellow
    Write-ColoredOutput "   .\up.ps1 down      - Stop all services" $Yellow
    Write-ColoredOutput "   .\up.ps1 logs      - Show service logs" $Yellow
    Write-ColoredOutput "   .\up.ps1 health    - Check health status" $Yellow
    Write-ColoredOutput "   .\up.ps1 build     - Build services without starting" $Yellow
    Write-ColoredOutput "   .\up.ps1 clean     - Clean up containers and volumes" $Yellow
    Write-ColoredOutput "   .\up.ps1 restart   - Restart all services" $Yellow
    Write-ColoredOutput "   .\up.ps1 status    - Show service status" $Yellow
    Write-ColoredOutput "   .\up.ps1 test      - Run end-to-end test" $Yellow
    Write-ColoredOutput "   .\up.ps1 stats     - Show resource usage" $Yellow
    Write-Host ""
    Write-ColoredOutput "🔧 SERVICE-SPECIFIC:" $Blue
    Write-ColoredOutput "   .\up.ps1 logs -Service app      - Show app logs" $Yellow
    Write-ColoredOutput "   .\up.ps1 logs -Service crawl4ai - Show crawl4ai logs" $Yellow
    Write-Host ""
    Write-ColoredOutput "🎯 EXAMPLE WORKFLOW:" $Green
    Write-ColoredOutput "   1. Copy-Item .env.example .env" $Yellow
    Write-ColoredOutput "   2. # Edit .env with your API keys" $Yellow
    Write-ColoredOutput "   3. .\up.ps1 up" $Yellow
    Write-ColoredOutput "   4. .\up.ps1 test" $Yellow
    Write-ColoredOutput "   5. # Visit http://localhost:3000" $Yellow
}

# Main switch
switch ($Command.ToLower()) {
    "up" { Start-XenlixServices }
    "down" { Stop-XenlixServices }
    "logs" { Show-Logs }
    "health" { Check-Health }
    "build" { Build-XenlixServices }
    "clean" { Remove-XenlixServices }
    "restart" { Restart-XenlixServices }
    "status" { Show-Status }
    "test" { Test-EndToEnd }
    "stats" { Show-Stats }
    "help" { Show-Help }
    default { 
        Write-ColoredOutput "❌ Unknown command: $Command" $Red
        Show-Help
    }
}