# PowerShell script to start XenlixAI AEO Platform with Crawl4AI Integration

# Colors for output
$Colors = @{
    Red = 'Red'
    Green = 'Green'
    Blue = 'Cyan'
    Yellow = 'Yellow'
    White = 'White'
}

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = 'White'
    )
    Write-Host $Message -ForegroundColor $Colors[$Color]
}

Write-ColorOutput "🚀 Starting XenlixAI AEO Platform with Crawl4AI Integration`n" "Blue"

# Function to check if port is in use
function Test-Port {
    param([int]$Port)
    
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("127.0.0.1", $Port)
        $connection.Close()
        return $true
    }
    catch {
        return $false
    }
}

# Function to start Crawl4AI service
function Start-Crawl4AI {
    Write-ColorOutput "📡 Starting Crawl4AI Service..." "Blue"
    
    Set-Location "crawl4ai-service"
    
    # Install dependencies if requirements.txt changed
    if (!(Test-Path ".requirements_installed") -or ((Get-Item "requirements.txt").LastWriteTime -gt (Get-Item ".requirements_installed").LastWriteTime)) {
        Write-ColorOutput "📦 Installing Python dependencies..." "Yellow"
        pip install -r requirements.txt
        New-Item -ItemType File -Name ".requirements_installed" -Force | Out-Null
    }
    
    # Start the service
    Write-ColorOutput "🎯 Crawl4AI Service starting on port 8000..." "Green"
    
    $crawl4aiJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
    }
    
    # Store job ID
    $crawl4aiJob.Id | Out-File ".crawl4ai.pid" -Encoding utf8
    
    # Wait for service to start
    Write-ColorOutput "⏳ Waiting for Crawl4AI service to start..." "Yellow"
    Start-Sleep -Seconds 8
    
    # Health check
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-ColorOutput "✅ Crawl4AI Service is running on http://localhost:8000" "Green"
        }
    }
    catch {
        Write-ColorOutput "❌ Failed to start Crawl4AI Service" "Red"
        Set-Location ".."
        return $false
    }
    
    Set-Location ".."
    return $true
}

# Function to start Next.js app
function Start-NextJS {
    Write-ColorOutput "⚛️  Starting Next.js Application..." "Blue"
    
    # Install dependencies if package.json changed
    if (!(Test-Path "node_modules/.installed") -or !(Test-Path "node_modules") -or ((Get-Item "package.json").LastWriteTime -gt (Get-Item "node_modules/.installed").LastWriteTime)) {
        Write-ColorOutput "📦 Installing Node.js dependencies..." "Yellow"
        pnpm install
        New-Item -ItemType File -Path "node_modules/.installed" -Force | Out-Null
    }
    
    # Start Next.js
    Write-ColorOutput "🎯 Next.js Application starting on port 3000..." "Green"
    
    $nextjsJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD
        pnpm run dev
    }
    
    # Store job ID
    $nextjsJob.Id | Out-File ".nextjs.pid" -Encoding utf8
    
    # Wait for Next.js to start
    Write-ColorOutput "⏳ Waiting for Next.js application to start..." "Yellow"
    Start-Sleep -Seconds 12
    
    # Health check
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 10 -UseBasicParsing
        Write-ColorOutput "✅ Next.js Application is running on http://localhost:3000" "Green"
    }
    catch {
        Write-ColorOutput "⚠️  Next.js Application may still be starting..." "Yellow"
    }
    
    return $true
}

# Cleanup function
function Stop-Services {
    Write-ColorOutput "`n🛑 Shutting down services..." "Yellow"
    
    if (Test-Path ".crawl4ai.pid") {
        $crawl4aiJobId = Get-Content ".crawl4ai.pid" -Raw
        if ($crawl4aiJobId) {
            try {
                $job = Get-Job -Id $crawl4aiJobId.Trim() -ErrorAction SilentlyContinue
                if ($job) {
                    Write-ColorOutput "📡 Stopping Crawl4AI Service..." "Blue"
                    Stop-Job -Job $job
                    Remove-Job -Job $job
                }
            }
            catch { }
        }
        Remove-Item ".crawl4ai.pid" -Force -ErrorAction SilentlyContinue
    }
    
    if (Test-Path ".nextjs.pid") {
        $nextjsJobId = Get-Content ".nextjs.pid" -Raw
        if ($nextjsJobId) {
            try {
                $job = Get-Job -Id $nextjsJobId.Trim() -ErrorAction SilentlyContinue
                if ($job) {
                    Write-ColorOutput "⚛️  Stopping Next.js Application..." "Blue"
                    Stop-Job -Job $job
                    Remove-Job -Job $job
                }
            }
            catch { }
        }
        Remove-Item ".nextjs.pid" -Force -ErrorAction SilentlyContinue
    }
    
    # Kill any remaining processes on the ports
    try {
        $processes = Get-NetTCPConnection -LocalPort 8000,3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | Sort-Object | Get-Unique
        foreach ($processId in $processes) {
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        }
    }
    catch { }
    
    Write-ColorOutput "✅ All services stopped" "Green"
}

# Set up signal handlers
$null = Register-ObjectEvent -InputObject ([System.Console]) -EventName "CancelKeyPress" -Action {
    Stop-Services
    exit
}

# Main execution
function Main {
    # Check prerequisites
    if (!(Get-Command python -ErrorAction SilentlyContinue) -and !(Get-Command python3 -ErrorAction SilentlyContinue)) {
        Write-ColorOutput "❌ Python is required but not installed" "Red"
        exit 1
    }
    
    if (!(Get-Command pnpm -ErrorAction SilentlyContinue)) {
        Write-ColorOutput "❌ pnpm is required but not installed" "Red"
        Write-ColorOutput "💡 Install with: npm install -g pnpm" "Yellow"
        exit 1
    }
    
    # Check ports
    if (Test-Port -Port 8000) {
        Write-ColorOutput "❌ Port 8000 is already in use (required for Crawl4AI service)" "Red"
        exit 1
    }
    
    if (Test-Port -Port 3000) {
        Write-ColorOutput "❌ Port 3000 is already in use (required for Next.js application)" "Red"
        exit 1
    }
    
    # Start services
    $crawl4aiStarted = Start-Crawl4AI
    if (!$crawl4aiStarted) {
        Write-ColorOutput "❌ Failed to start Crawl4AI service" "Red"
        exit 1
    }
    
    $nextjsStarted = Start-NextJS
    
    Write-ColorOutput "`n🎉 All services started successfully!" "Green"
    Write-ColorOutput "📊 Application: http://localhost:3000" "Blue"
    Write-ColorOutput "📡 Crawl4AI API: http://localhost:8000" "Blue"
    Write-ColorOutput "📋 API Docs: http://localhost:8000/docs" "Blue"
    Write-ColorOutput "`n⚠️  Keep this PowerShell window open to keep services running" "Yellow"
    Write-ColorOutput "Press Ctrl+C to stop all services`n" "Yellow"
    
    # Keep script running
    try {
        while ($true) {
            Start-Sleep -Seconds 5
            
            # Check if services are still running
            if (!(Test-Port -Port 8000)) {
                Write-ColorOutput "⚠️  Crawl4AI service appears to have stopped" "Yellow"
            }
            
            if (!(Test-Port -Port 3000)) {
                Write-ColorOutput "⚠️  Next.js application appears to have stopped" "Yellow"
            }
        }
    }
    catch {
        Stop-Services
        exit
    }
}

# Check if script should run in Docker
if ($args[0] -eq "--docker") {
    Write-ColorOutput "🐳 Starting services with Docker Compose..." "Blue"
    docker-compose up --build
}
else {
    Main
}