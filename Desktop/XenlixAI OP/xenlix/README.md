# XenlixAI AEO Platform

Advanced AEO (Answer Engine Optimization) platform built with Next.js 15, featuring intelligent web crawling, semantic analysis, and performance optimization tools.

## 🚀 Features

- **Smart Web Crawling**: Powered by Crawl4AI for intelligent content extraction
- **Performance Analytics**: Lighthouse integration for comprehensive site audits  
- **Semantic Analysis**: HuggingFace embeddings for content similarity matching
- **Redis Caching**: High-performance caching layer with automatic fallback
- **Firebase Persistence**: Real-time data storage with Firestore
- **Health Monitoring**: Comprehensive system health tracking and metrics
- **PDF Reporting**: Automated report generation and export
- **Lighthouse Audits**: Reliable Chrome/Chromium setup for performance testing across all environments

## 🛠️ Tech Stack

- **Framework**: Next.js 15.5.3 (App Router)
- **Database**: SQLite (Prisma) + Firebase Firestore
- **Caching**: Redis (Docker) with enhanced fallback
- **Authentication**: NextAuth.js
- **UI**: Tailwind CSS + Shadcn/UI
- **Analytics**: Crawl4AI + Lighthouse + HuggingFace
- **Infrastructure**: Docker, Firebase Admin SDK

## 📋 Prerequisites

- Node.js 18+ and pnpm
- Docker Desktop (for Redis)
- Firebase project with Firestore enabled
- Firebase service account with admin permissions
- Chrome/Chromium browser (for Lighthouse audits)

## ⚡ Quick Start

### 1. Environment Setup

Copy the environment template and configure your settings:

```bash
cp .env.example .env.local
```

Configure these essential variables in `.env.local`:

```bash
# Redis Configuration
REDIS_URL="redis://localhost:6379"
REDIS_CACHE_TTL="3600"

# Firebase Configuration  
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk@your-project.iam.gserviceaccount.com"

# Crawl4AI Configuration
CRAWL4AI_URL="http://localhost:8000"
```

### 2. Start Redis

```bash
docker run -d --name xenlix-redis -p 6379:6379 redis:7-alpine redis-server --appendonly yes --appendfsync everysec
```

### 3. Install Dependencies & Setup

```bash
pnpm install
pnpm db:generate
pnpm dev
```

### 4. Test Your Setup

```bash
# Test Redis connectivity
node test-redis-direct.js

# Test Firebase integration  
node test-firebase.js

# Check system health
curl http://localhost:3000/api/health
```

Visit [http://localhost:3000](http://localhost:3000) to access the platform.

## 🔥 Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create new project: "xenlix-aeo-platform" 
3. Enable Firestore Database in production mode
4. Set up authentication (optional)

### 2. Create Service Account

1. Go to Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Extract the following values for `.env.local`:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `private_key` → `FIREBASE_PRIVATE_KEY` 
   - `client_email` → `FIREBASE_CLIENT_EMAIL`

### 3. Configure Firestore

Set up the following collections in Firestore:

- `crawl_results` - Web crawling data and metadata
- `embedding_scores` - Semantic analysis and similarity scores  
- `lighthouse_audits` - Performance audit results
- `pdf_exports` - Report generation metadata

### 4. Deploy Security Rules

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and deploy rules
firebase login
firebase init firestore
firebase deploy --only firestore:rules
```

See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for detailed setup instructions.

## 📊 System Architecture

### Caching Layer
- **Primary**: Redis (Docker) - Sub-5ms response times
- **Fallback**: In-memory cache - Automatic failover
- **TTL**: Configurable cache expiration (default 1 hour)

### Data Persistence
- **Local**: SQLite with Prisma ORM
- **Cloud**: Firebase Firestore for real-time data
- **Caching**: Enhanced Redis layer with metrics

### Monitoring & Health
- **Endpoints**: `/api/health` - Comprehensive system status
- **Metrics**: Redis, Firebase, Crawl4AI connectivity
- **Recommendations**: Actionable system insights

## 🧪 Testing

### Test Redis Integration
```bash
node test-redis-direct.js
```

### Test Firebase Integration  
```bash
node test-firebase.js
```

### Test Cache Performance
```bash
node test-cache-performance.js
```

### Manual Testing Checklist
See [MANUAL_TESTING_CHECKLIST.md](./MANUAL_TESTING_CHECKLIST.md)

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── crawl/          # Web crawling endpoint
│   │   ├── full-analysis/  # Comprehensive analysis
│   │   └── health/         # System monitoring
│   └── (components)/       # UI components
├── lib/
│   ├── firebase-client.ts      # Firebase Admin client
│   ├── firestore-services.ts  # Data persistence services  
│   ├── enhanced-redis-cache.ts # Redis caching layer
│   └── env-config.ts          # Environment configuration
└── types/                     # TypeScript definitions
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `REDIS_CACHE_TTL` | Cache TTL in seconds | `3600` |
| `FIREBASE_PROJECT_ID` | Firebase project ID | Required |
| `FIREBASE_PRIVATE_KEY` | Service account private key | Required |
| `FIREBASE_CLIENT_EMAIL` | Service account email | Required |
| `CRAWL4AI_URL` | Crawl4AI service URL | `http://localhost:8000` |

### Redis Configuration
- **Persistence**: AOF (Append Only File) enabled
- **Sync**: `everysec` for balanced performance/durability
- **Memory**: Configurable maxmemory policy
- **Health**: Automatic health checks every 30 seconds

## � Lighthouse Performance Auditing

### Dependencies

- **Chrome/Chromium**: Required for headless performance auditing
- **Node.js 18+**: For Lighthouse CLI and programmatic usage

### Local Installation

#### macOS
```bash
brew install --cask google-chrome
# Optional if non-standard path:
echo 'export CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"' >> ~/.zshrc
```

#### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install -y chromium
# Binary auto-detected as chromium or chromium-browser
```

#### Windows (PowerShell)
```bash
# Install Chrome normally, then if needed:
$env:CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe"
```

### Usage

#### Quick Chrome Check
```bash
# Verify Chrome installation
npm run lighthouse:check

# Check Lighthouse version
npm run lighthouse:version
```

#### Performance Audits
```bash
# Run comprehensive audit (local app)
npm run audit:lighthouse

# CI-optimized audit with threshold checking
npm run audit:ci

# Docker-based audit (isolated environment)
npm run audit:docker
```

#### Programmatic Usage
```bash
# Custom URL audit
TARGET_URL=https://xenlix.ai npm run audit:lighthouse

# Set performance threshold for CI
PERFORMANCE_THRESHOLD=85 npm run audit:ci

# Custom output formats
LH_OUTPUT=json,html,csv npm run audit:lighthouse
```

### Environment Variables

Create `.env.lighthouse` or add to `.env.local`:

```bash
# Chrome Configuration
CHROME_PATH=/usr/bin/chromium                    # Linux
# CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"  # macOS
# CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe"         # Windows

# Lighthouse Settings
TARGET_URL=http://localhost:3000
PERFORMANCE_THRESHOLD=75
LH_OUTPUT=json,html
LH_OUTPUT_DIR=./reports
SKIP_PWA=true
```

### Docker Usage

#### Lighthouse-Only Container
```bash
# Build and run Lighthouse audit
docker build -f Dockerfile.lighthouse --target lighthouse -t xenlix-lighthouse .
docker run --rm -v $(pwd)/reports:/app/reports xenlix-lighthouse

# With custom URL
docker run --rm -e TARGET_URL=https://xenlix.ai -v $(pwd)/reports:/app/reports xenlix-lighthouse
```

#### Full Stack with Lighthouse
```bash
# Run app + audit
docker-compose -f docker-compose.lighthouse.yml --profile audit up --build

# App only
docker-compose -f docker-compose.lighthouse.yml --profile app up --build
```

### CI Integration

The GitHub Actions workflow (`.github/workflows/lighthouse.yml`) automatically:

1. **Installs Chromium** and required system libraries
2. **Verifies Chrome** installation with preflight checks  
3. **Builds and starts** the application
4. **Runs Lighthouse audit** with CI-optimized flags
5. **Uploads artifacts** (JSON/HTML reports)
6. **Comments on PRs** with performance scores
7. **Fails CI** if performance drops below threshold

## 🔍 Lighthouse CI Integration

### Automated Performance Testing

This project includes comprehensive Lighthouse CI setup for continuous performance monitoring:

#### 📊 Performance Standards
- **Performance**: ≥90% (Build fails if below)
- **SEO**: ≥90% (Build fails if below)
- **Accessibility**: ≥90% (Warning if below)
- **Best Practices**: ≥90% (Warning if below)

#### 🚀 Available Commands
```bash
# Complete Lighthouse CI audit
pnpm lhci

# Individual steps
pnpm lhci:collect    # Collect performance data
pnpm lhci:assert     # Check against thresholds  
pnpm lhci:upload     # Save reports to filesystem
```

#### 🤖 CI/CD Workflow
- **Triggers**: Push/PR to main/develop branches
- **Workflow**: `.github/workflows/lighthouse-ci.yml`
- **Reports**: Uploaded as GitHub Actions artifacts
- **PR Comments**: Automatic performance score summaries

#### 📁 Configuration Files
- `lighthouserc.json` - Main CI configuration
- `.lighthouserc.js` - Flexible environment-based config

#### 📈 Before Pushing Code
```bash
# Test performance locally
pnpm dev                    # Start development server
pnpm audit:lighthouse       # Run performance audit
# Check ./reports/ for results before committing
```

> 📖 **Full Documentation**: See [LIGHTHOUSE_CI_GUIDE.md](./LIGHTHOUSE_CI_GUIDE.md) for complete setup details and troubleshooting.

### Common Chrome Flags for Headless

```bash
--headless=new              # Use new headless mode
--no-sandbox               # Required in most CI/container environments
--disable-gpu              # Disable GPU hardware acceleration
--disable-dev-shm-usage    # Overcome limited resource problems
--disable-background-timer-throttling  # Prevent throttling
--no-first-run            # Skip first run experience
```

## �🚨 Troubleshooting

### Lighthouse Issues

#### "Chrome not found" Error
```bash
# Check Chrome installation
npm run lighthouse:check

# Install Chrome/Chromium
# macOS: brew install --cask google-chrome
# Ubuntu: sudo apt-get install -y chromium
# Windows: Download from google.com/chrome

# Or set CHROME_PATH manually
export CHROME_PATH="/path/to/chrome"
```

#### CI Crashes
```bash
# Ensure required flags in CI
--no-sandbox --disable-dev-shm-usage

# Check which chromium binary is available
which chromium chromium-browser google-chrome

# Verify installation in CI
apt-get install -y chromium libnss3 libatk-bridge2.0-0
```

#### Permission Denied
```bash
# Ensure binary is executable
chmod +x /usr/bin/chromium

# Check user permissions in Docker
USER lighthouse  # non-root user with audio,video groups
```

#### Works Locally, Fails in CI
```bash
# Missing Chromium install step
sudo apt-get install -y chromium

# Wrong binary path (check with which chromium)
export CHROME_PATH=/usr/bin/chromium

# Missing system libraries
apt-get install -y libnss3 libatk-bridge2.0-0 libdrm2 libxkbcommon0 libgbm1
```

#### Alpine Docker Issues
```bash
# Alpine Chromium can be fragile - use Debian instead
FROM node:20-bullseye-slim

# Or install Alpine dependencies
apk add --no-cache chromium nss freetype freetype-dev harfbuzz ca-certificates ttf-freefont
```

### Redis Issues
```bash
# Check Redis container
docker ps | grep redis

# View Redis logs  
docker logs xenlix-redis

# Restart Redis
docker restart xenlix-redis
```

### Firebase Issues
```bash
# Test Firebase connectivity
node test-firebase.js

# Check service account permissions
# Ensure Firestore Admin role is assigned
```

### Performance Issues
- Check `/api/health` endpoint for system status
- Monitor Redis hit rates (target: >80%)
- Review Firestore quota usage in Firebase Console
- Run Lighthouse audits to identify bottlenecks

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
