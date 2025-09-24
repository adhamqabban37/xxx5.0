#!/bin/bash
# Production deployment script for XenlixAI AEO Platform
# This script sets up the complete semantic analysis system

set -e  # Exit on any error

echo "🚀 Starting XenlixAI AEO Platform Deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're on Windows (Git Bash/WSL)
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    echo -e "${YELLOW}⚠️  Detected Windows environment${NC}"
    PYTHON_CMD="python"
    PIP_CMD="pip"
else
    PYTHON_CMD="python3"
    PIP_CMD="pip3"
fi

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ required. Current version: $(node --version)"
    exit 1
fi
print_status "Node.js $(node --version) ✓"

# Check Python
if ! command -v $PYTHON_CMD &> /dev/null; then
    print_error "Python is not installed. Please install Python 3.8+ and try again."
    exit 1
fi

PYTHON_VERSION=$($PYTHON_CMD --version 2>&1 | cut -d' ' -f2 | cut -d'.' -f1-2)
if ! $PYTHON_CMD -c "import sys; exit(0 if sys.version_info >= (3,8) else 1)"; then
    print_error "Python 3.8+ required. Current version: $PYTHON_VERSION"
    exit 1
fi
print_status "Python $PYTHON_VERSION ✓"

# Check if pnpm is installed, if not use npm
if command -v pnpm &> /dev/null; then
    PKG_MANAGER="pnpm"
else
    PKG_MANAGER="npm"
    print_warning "pnpm not found, using npm instead"
fi

print_status "Using package manager: $PKG_MANAGER"

# Step 1: Install Next.js dependencies
echo "📦 Installing Next.js dependencies..."
cd "$(dirname "$0")"
$PKG_MANAGER install

if [ $? -eq 0 ]; then
    print_status "Next.js dependencies installed"
else
    print_error "Failed to install Next.js dependencies"
    exit 1
fi

# Step 2: Set up Python virtual environment for Crawl4AI service
echo "🐍 Setting up Python virtual environment..."
cd crawl4ai-service

# Create virtual environment
if [ ! -d "venv" ]; then
    $PYTHON_CMD -m venv venv
    print_status "Virtual environment created"
else
    print_status "Virtual environment already exists"
fi

# Activate virtual environment
source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null

# Upgrade pip
$PYTHON_CMD -m pip install --upgrade pip

# Install Python dependencies
echo "📦 Installing Python dependencies..."
if [ -f requirements.txt ]; then
    $PIP_CMD install -r requirements.txt
    if [ $? -eq 0 ]; then
        print_status "Python dependencies installed"
    else
        print_error "Failed to install some Python dependencies"
        print_warning "This is common with machine learning packages. Continuing..."
    fi
else
    print_error "requirements.txt not found in crawl4ai-service directory"
    exit 1
fi

# Step 3: Download sentence-transformers model
echo "🤖 Pre-downloading sentence-transformers model..."
$PYTHON_CMD -c "
try:
    from sentence_transformers import SentenceTransformer
    print('Loading sentence-transformers/all-MiniLM-L6-v2 model...')
    model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
    print('✅ Model downloaded and cached successfully')
except Exception as e:
    print(f'⚠️  Model download failed: {e}')
    print('Model will be downloaded on first use')
"

# Step 4: Create environment file if it doesn't exist
echo "⚙️  Setting up environment configuration..."
if [ ! -f .env ]; then
    cp .env.production .env
    print_status "Environment file created from production template"
    print_warning "Please review and update .env file with your specific configuration"
else
    print_status "Environment file already exists"
fi

cd ..

# Step 5: Set up Next.js environment
if [ ! -f .env.local ]; then
    cat > .env.local << EOF
# Next.js Environment Configuration
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Crawl4AI Service
CRAWL4AI_SERVICE_URL=http://localhost:8001

# Firebase Configuration (update with your values)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
FIREBASE_ADMIN_PRIVATE_KEY=your-private-key

# Rate Limiting
RATE_LIMIT_ENABLED=true
EOF
    print_status "Next.js environment file created"
    print_warning "Please update .env.local with your actual configuration values"
else
    print_status "Next.js environment file already exists"
fi

# Step 6: Build the Next.js application
echo "🔨 Building Next.js application..."
$PKG_MANAGER run build

if [ $? -eq 0 ]; then
    print_status "Next.js application built successfully"
else
    print_error "Next.js build failed"
    exit 1
fi

# Step 7: Create startup scripts
echo "📝 Creating startup scripts..."

# Create start-all script
cat > start-all.sh << 'EOF'
#!/bin/bash
# Start both services

set -e

echo "🚀 Starting XenlixAI AEO Platform..."

# Start Crawl4AI service in background
echo "📡 Starting Crawl4AI Semantic Analysis Service..."
cd crawl4ai-service
source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null
python start_server.py &
CRAWL4AI_PID=$!
echo "Crawl4AI service started with PID: $CRAWL4AI_PID"
cd ..

# Wait a moment for the service to start
sleep 5

# Start Next.js application
echo "🌐 Starting Next.js Application..."
npm start &
NEXTJS_PID=$!
echo "Next.js started with PID: $NEXTJS_PID"

# Function to cleanup processes on exit
cleanup() {
    echo "🛑 Shutting down services..."
    kill $CRAWL4AI_PID 2>/dev/null || true
    kill $NEXTJS_PID 2>/dev/null || true
    exit
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

echo "✅ All services started successfully!"
echo "📊 Next.js Dashboard: http://localhost:3000"
echo "🔧 Crawl4AI Service: http://localhost:8001"
echo "❤️  Health Check: http://localhost:8001/health"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for processes
wait
EOF

chmod +x start-all.sh

# Create Windows batch file
cat > start-all.bat << 'EOF'
@echo off
echo Starting XenlixAI AEO Platform...

echo Starting Crawl4AI Semantic Analysis Service...
cd crawl4ai-service
call venv\Scripts\activate
start "Crawl4AI Service" python start_server.py
cd ..

timeout /t 5

echo Starting Next.js Application...
start "Next.js App" npm start

echo All services started successfully!
echo Next.js Dashboard: http://localhost:3000
echo Crawl4AI Service: http://localhost:8001
echo Health Check: http://localhost:8001/health
pause
EOF

print_status "Startup scripts created"

# Final steps
echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Update .env.local with your Firebase and authentication configuration"
echo "2. Update crawl4ai-service/.env with your service configuration"
echo "3. Start all services with: ./start-all.sh (Linux/Mac) or start-all.bat (Windows)"
echo ""
echo "📊 Service URLs:"
echo "   • Next.js Dashboard: http://localhost:3000"
echo "   • Crawl4AI API: http://localhost:8001"
echo "   • Health Check: http://localhost:8001/health"
echo "   • API Metrics: http://localhost:8001/metrics"
echo ""
echo "🔧 To start services individually:"
echo "   • Next.js: npm run dev"
echo "   • Crawl4AI: cd crawl4ai-service && python start_server.py"
echo ""
print_status "Ready for semantic AEO analysis! 🚀"