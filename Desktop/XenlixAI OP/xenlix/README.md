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

## 🚨 Troubleshooting

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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
