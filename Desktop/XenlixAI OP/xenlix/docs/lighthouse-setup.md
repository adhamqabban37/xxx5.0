# Lighthouse Chrome/Chromium Setup Guide

This guide ensures reliable Lighthouse performance audits across all environments (local, CI, Docker) by eliminating Chrome/Chromium detection issues.

## 🎯 Overview

The XenlixAI platform includes comprehensive Lighthouse integration with:

- **Preflight Chrome detection** that fails fast with actionable guidance
- **Cross-platform compatibility** (macOS, Windows, Linux)  
- **CI/CD integration** with GitHub Actions
- **Dockerized audits** for consistent, isolated testing
- **Programmatic usage** with Node.js automation

## 🔧 Installation by Platform

### macOS

```bash
# Install Chrome via Homebrew
brew install --cask google-chrome

# Verify installation
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --version

# Set path if needed (add to ~/.zshrc)
export CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

### Linux (Ubuntu/Debian)

```bash
# Install Chromium (recommended for servers)
sudo apt-get update
sudo apt-get install -y chromium-browser

# Or install Google Chrome
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list
sudo apt-get update
sudo apt-get install -y google-chrome-stable

# Verify installation  
chromium --version
# or
google-chrome --version
```

### Linux (CentOS/RHEL)

```bash
# Install Chromium
sudo yum install -y chromium

# Or install Google Chrome
sudo yum install -y wget
wget https://dl.google.com/linux/direct/google-chrome-stable_current_x86_64.rpm
sudo yum localinstall -y google-chrome-stable_current_x86_64.rpm
```

### Windows

```powershell
# Download and install Chrome normally from google.com/chrome

# If Chrome is in non-standard location, set environment variable:
$env:CHROME_PATH = "C:\Program Files\Google\Chrome\Application\chrome.exe"

# Or add to Windows PATH permanently via System Properties
```

## 🚀 Usage Examples

### Basic Audit

```bash
# Check Chrome installation first
npm run lighthouse:check

# Run full performance audit
npm run audit:lighthouse
```

### Custom Configuration

```bash
# Audit external URL
TARGET_URL=https://xenlix.ai npm run audit:lighthouse

# Set performance threshold
PERFORMANCE_THRESHOLD=90 npm run audit:lighthouse

# Multiple output formats
LH_OUTPUT=json,html,csv npm run audit:lighthouse

# Custom output directory
LH_OUTPUT_DIR=./custom-reports npm run audit:lighthouse
```

### CI/Automated Usage

```bash
# CI-optimized with threshold checking
PERFORMANCE_THRESHOLD=75 npm run audit:ci

# Headless with all required flags
npx lighthouse https://xenlix.ai \
  --chrome-flags="--headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage" \
  --output=json \
  --output-path=./report.json
```

## 🐳 Docker Usage

### Lighthouse-Only Container

```bash
# Build Lighthouse audit container
docker build -f Dockerfile.lighthouse --target lighthouse -t xenlix-lighthouse .

# Run audit with volume mount for reports
docker run --rm \
  -v $(pwd)/reports:/app/reports \
  -e TARGET_URL=https://xenlix.ai \
  xenlix-lighthouse

# Run with custom configuration
docker run --rm \
  -v $(pwd)/reports:/app/reports \
  -e TARGET_URL=https://xenlix.ai \
  -e PERFORMANCE_THRESHOLD=85 \
  -e LH_OUTPUT=json,html \
  xenlix-lighthouse
```

### Full Application + Lighthouse

```bash
# Start app and run audit
docker-compose -f docker-compose.lighthouse.yml --profile audit up --build

# Start app only (for manual testing)
docker-compose -f docker-compose.lighthouse.yml --profile app up --build

# Full stack with Redis
docker-compose -f docker-compose.lighthouse.yml --profile full up --build
```

## 🤖 CI Integration

### GitHub Actions

The included workflow (`.github/workflows/lighthouse.yml`) provides:

- **Automated Chromium installation** with system dependencies
- **Chrome verification** using preflight checks
- **Application building and startup** with health checks
- **Lighthouse audit execution** with CI-optimized flags
- **Artifact upload** for JSON/HTML reports
- **PR commenting** with performance scores
- **Threshold enforcement** (configurable via workflow inputs)

#### Workflow Triggers

```yaml
# Automatic on push/PR
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

# Manual with custom parameters
workflow_dispatch:
  inputs:
    target_url:
      description: 'URL to audit'
      default: 'https://xenlix.ai'
    performance_threshold:
      description: 'Minimum performance score'
      default: '75'
```

#### Using in Your CI

```bash
# Set repository variables for production audits
PRODUCTION_URL=https://your-production-site.com

# Customize performance thresholds per environment
# Development: 60, Staging: 75, Production: 85
```

### Other CI Platforms

#### GitLab CI

```yaml
lighthouse:
  image: node:20-bullseye
  stage: test
  before_script:
    - apt-get update -y
    - apt-get install -y chromium
    - npm ci
  script:
    - chmod +x scripts/check-chrome.sh
    - ./scripts/check-chrome.sh
    - npm run build
    - npm run start &
    - sleep 10
    - CHROME_PATH=/usr/bin/chromium npm run audit:ci
  artifacts:
    paths:
      - lighthouse-ci.json
    reports:
      performance: lighthouse-ci.json
```

#### Azure DevOps

```yaml
- task: NodeTool@0
  inputs:
    versionSpec: '20.x'
    
- script: |
    sudo apt-get update -y
    sudo apt-get install -y chromium
    npm ci
    chmod +x scripts/check-chrome.sh
    ./scripts/check-chrome.sh
  displayName: 'Setup and verify Chrome'
  
- script: |
    npm run build
    npm run start &
    sleep 10
    CHROME_PATH=/usr/bin/chromium npm run audit:ci
  displayName: 'Run Lighthouse audit'
  env:
    PERFORMANCE_THRESHOLD: 75
```

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `CHROME_PATH` | Path to Chrome/Chromium binary | auto-detected | `/usr/bin/chromium` |
| `TARGET_URL` | URL to audit | `http://localhost:3000` | `https://xenlix.ai` |
| `PERFORMANCE_THRESHOLD` | Min performance score (CI) | `75` | `85` |
| `LH_OUTPUT` | Output formats (comma-separated) | `json,html` | `json,html,csv` |
| `LH_OUTPUT_DIR` | Output directory | `./reports` | `./lighthouse-reports` |
| `SKIP_PWA` | Skip PWA audits | `true` | `false` |
| `CI` | CI mode (affects output format) | `false` | `true` |

### Lighthouse Configuration

The programmatic script (`scripts/run-lighthouse.js`) uses optimized settings:

```javascript
const lighthouseConfig = {
  logLevel: 'error',
  output: ['json', 'html'],
  onlyCategories: ['performance', 'accessibility', 'seo', 'best-practices'],
  chromeFlags: [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding'
  ],
  throttling: {
    rttMs: 40,
    throughputKbps: 10240,
    cpuSlowdownMultiplier: 1
  }
};
```

## 🔍 Troubleshooting

### Common Issues

#### 1. "Chrome not found" Error

**Problem**: Lighthouse can't find Chrome/Chromium binary

**Solution**:
```bash
# Check what's available
scripts/check-chrome.sh

# Install missing browser
# macOS: brew install --cask google-chrome  
# Linux: sudo apt-get install -y chromium
# Windows: Download from google.com/chrome

# Or set path manually
export CHROME_PATH="/path/to/chrome"
```

#### 2. CI Pipeline Crashes

**Problem**: Chrome crashes in CI environment

**Solution**:
```bash
# Ensure required flags for sandboxing
--no-sandbox --disable-dev-shm-usage

# Install all required system libraries
sudo apt-get install -y chromium libnss3 libatk-bridge2.0-0 libdrm2 libxkbcommon0 libgbm1

# Use headless new mode
--headless=new
```

#### 3. Permission Denied

**Problem**: Chrome binary not executable

**Solution**:
```bash
# Make binary executable
chmod +x /usr/bin/chromium

# Check user permissions (Docker)
USER lighthouse
RUN usermod -a -G audio,video lighthouse
```

#### 4. Works Locally, Fails in CI

**Problem**: Different environments, missing dependencies

**Solution**:
```bash
# Check binary location differences
which chromium chromium-browser google-chrome

# Ensure consistent CHROME_PATH
export CHROME_PATH=/usr/bin/chromium

# Install same dependencies
apt-get install -y chromium --no-install-recommends
```

#### 5. Alpine Docker Issues

**Problem**: Alpine Linux has limited Chrome support

**Solution**:
```dockerfile
# Use Debian instead (recommended)
FROM node:20-bullseye-slim

# Or install Alpine dependencies
RUN apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont
```

### Debug Commands

```bash
# Check Chrome installation and version
scripts/check-chrome.sh

# Verify Lighthouse CLI
npx lighthouse --version

# Test Chrome flags manually  
/usr/bin/chromium --headless --no-sandbox --version

# Check system dependencies (Linux)
ldd /usr/bin/chromium | grep "not found"

# Test minimal audit
npx lighthouse --chrome-flags="--headless --no-sandbox" https://example.com --quiet --output=json
```

### Performance Optimization

#### Chrome Flags for Speed

```bash
--disable-background-timer-throttling
--disable-backgrounding-occluded-windows  
--disable-renderer-backgrounding
--disable-features=TranslateUI
--disable-component-extensions-with-background-pages
--no-default-browser-check
--no-first-run
```

#### Lighthouse Optimization

```javascript
// Skip audits you don't need
skipAudits: ['installable-manifest', 'splash-screen'],

// Adjust throttling for your network
throttling: {
  rttMs: 40,           // RTT latency
  throughputKbps: 10240, // Bandwidth
  cpuSlowdownMultiplier: 1  // CPU throttling
}
```

## 📊 Report Analysis

### Performance Scores

- **90-100**: Excellent performance
- **50-89**: Needs improvement  
- **0-49**: Poor performance

### Core Web Vitals

- **First Contentful Paint (FCP)**: < 1.8s (good)
- **Largest Contentful Paint (LCP)**: < 2.5s (good)
- **Cumulative Layout Shift (CLS)**: < 0.1 (good)

### CI Integration Tips

```bash
# Set different thresholds per environment
PERFORMANCE_THRESHOLD=60  # Development
PERFORMANCE_THRESHOLD=75  # Staging  
PERFORMANCE_THRESHOLD=85  # Production

# Use lighthouse-ci for advanced CI features
npm install -g @lhci/cli
lhci autorun --config=.lighthouserc.js
```

This setup ensures reliable Lighthouse performance audits across all environments, eliminating the "Chrome not found" errors that commonly plague CI/CD pipelines.