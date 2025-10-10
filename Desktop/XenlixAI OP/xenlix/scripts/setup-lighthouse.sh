#!/usr/bin/env bash
set -euo pipefail

# Lighthouse Setup Script for XenlixAI
# Automates Chrome/Chromium installation and verification

echo "🚀 XenlixAI Lighthouse Setup"
echo "============================"
echo ""

# Detect OS
OS=""
case "$(uname -s)" in
    Darwin*)    OS="macOS" ;;
    Linux*)     OS="Linux" ;;
    CYGWIN*|MINGW*) OS="Windows" ;;
    *)          OS="Unknown" ;;
esac

echo "📋 Detected OS: $OS"

# Function to check if Chrome is already installed
check_existing_chrome() {
    echo "🔍 Checking for existing Chrome installation..."
    
    if scripts/check-chrome.sh 2>/dev/null; then
        echo "✅ Chrome/Chromium already installed and working!"
        return 0
    else
        echo "❌ Chrome/Chromium not found or not working"
        return 1
    fi
}

# Function to install Chrome based on OS
install_chrome() {
    echo ""
    echo "🔧 Installing Chrome/Chromium for $OS..."
    
    case "$OS" in
        "macOS")
            if command -v brew >/dev/null 2>&1; then
                echo "📦 Installing Chrome via Homebrew..."
                brew install --cask google-chrome
            else
                echo "❌ Homebrew not found!"
                echo "📋 Please install Homebrew first: https://brew.sh/"
                echo "📋 Or download Chrome manually: https://www.google.com/chrome/"
                return 1
            fi
            ;;
        "Linux")
            # Detect Linux distribution
            if command -v apt-get >/dev/null 2>&1; then
                echo "📦 Installing Chromium via apt-get..."
                sudo apt-get update
                sudo apt-get install -y chromium-browser chromium
            elif command -v yum >/dev/null 2>&1; then
                echo "📦 Installing Chromium via yum..."
                sudo yum install -y chromium
            elif command -v dnf >/dev/null 2>&1; then
                echo "📦 Installing Chromium via dnf..."
                sudo dnf install -y chromium
            else
                echo "❌ Unsupported Linux distribution!"
                echo "📋 Please install chromium manually using your package manager"
                return 1
            fi
            ;;
        "Windows")
            echo "❌ Automated installation not available for Windows"
            echo "📋 Please download Chrome from: https://www.google.com/chrome/"
            echo "📋 Then set CHROME_PATH if needed:"
            echo "   set CHROME_PATH=\"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe\""
            return 1
            ;;
        *)
            echo "❌ Unknown operating system: $OS"
            echo "📋 Please install Chrome/Chromium manually"
            return 1
            ;;
    esac
}

# Function to verify installation
verify_installation() {
    echo ""
    echo "✅ Verifying Chrome installation..."
    
    if scripts/check-chrome.sh; then
        echo ""
        echo "🎉 Chrome/Chromium installation successful!"
        return 0
    else
        echo ""
        echo "❌ Installation verification failed"
        return 1
    fi
}

# Function to test Lighthouse
test_lighthouse() {
    echo ""
    echo "🔍 Testing Lighthouse..."
    
    echo "📋 Lighthouse version:"
    npm run lighthouse:version
    
    echo ""
    echo "📋 Testing basic Lighthouse functionality..."
    
    # Test with a simple URL
    if command -v curl >/dev/null 2>&1; then
        echo "🌐 Testing with example.com..."
        npx lighthouse https://example.com \
            --chrome-flags="--headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage" \
            --output=json \
            --output-path=./lighthouse-test.json \
            --quiet \
            --only-categories=performance || {
            echo "❌ Lighthouse test failed"
            return 1
        }
        
        if [ -f "./lighthouse-test.json" ]; then
            echo "✅ Lighthouse test successful! Report saved to lighthouse-test.json"
            # Clean up test file
            rm -f ./lighthouse-test.json
        else
            echo "❌ Lighthouse test failed - no report generated"
            return 1
        fi
    else
        echo "⚠️  curl not available, skipping full Lighthouse test"
    fi
}

# Function to show next steps
show_next_steps() {
    echo ""
    echo "🎉 Setup Complete!"
    echo "================"
    echo ""
    echo "💡 Next steps:"
    echo ""
    echo "1. 🔍 Verify Chrome anytime:"
    echo "   npm run lighthouse:check"
    echo ""
    echo "2. 🚀 Run performance audit:"
    echo "   npm run audit:lighthouse"
    echo ""
    echo "3. 🎯 Audit custom URL:"
    echo "   TARGET_URL=https://your-site.com npm run audit:lighthouse"
    echo ""
    echo "4. 🐳 Use Docker for isolated testing:"
    echo "   npm run audit:docker"
    echo ""
    echo "5. 📊 Configure thresholds:"
    echo "   PERFORMANCE_THRESHOLD=85 npm run audit:lighthouse"
    echo ""
    echo "📚 Full documentation: docs/lighthouse-setup.md"
    echo ""
}

# Main execution
main() {
    # Check if we're in the right directory
    if [ ! -f "package.json" ] || [ ! -d "scripts" ]; then
        echo "❌ Please run this script from the XenlixAI project root directory"
        exit 1
    fi
    
    # Make sure scripts are executable
    chmod +x scripts/check-chrome.sh 2>/dev/null || true
    
    # Check if Chrome is already installed
    if check_existing_chrome; then
        echo ""
        echo "🎯 Chrome is ready! Testing Lighthouse..."
        test_lighthouse
        show_next_steps
        exit 0
    fi
    
    # Install Chrome if not found
    if install_chrome; then
        verify_installation
        test_lighthouse
        show_next_steps
    else
        echo ""
        echo "❌ Chrome installation failed or not completed"
        echo "📋 Please install Chrome/Chromium manually and run:"
        echo "   npm run lighthouse:check"
        exit 1
    fi
}

# Handle interruption
trap 'echo ""; echo "⚠️ Setup interrupted"; exit 1' INT TERM

# Run main function
main "$@"