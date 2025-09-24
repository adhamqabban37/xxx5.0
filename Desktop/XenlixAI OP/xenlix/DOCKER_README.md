# 🚀 Xenlix AEO Platform - Docker Deployment

Production-ready Docker deployment for the Xenlix Answer Engine Optimization platform with real HuggingFace embeddings.

## 🎯 Quick Start

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) 20.10+
- [Docker Compose](https://docs.docker.com/compose/install/) 2.0+
- 4GB+ RAM available
- Required API keys (see Environment Setup)

### One-Command Deployment

```bash
# Copy environment template
cp .env.example .env

# Edit with your API keys (see Environment Setup below)
# nano .env  # or use your preferred editor

# Start all services
make up
# OR for Windows: .\up.ps1 up
# OR for Unix/Linux: ./up.sh up
```

That's it! 🎉 Your AEO platform will be running at:
- **Main App**: http://localhost:3000
- **Health Check**: http://localhost:3000/api/health
- **Crawl4AI Service**: http://localhost:8001
- **Redis Cache**: localhost:6379

## 📋 Services Overview

| Service | Port | Purpose | Health Check |
|---------|------|---------|--------------|
| **xenlix-app** | 3000 | Next.js AEO Platform | `/api/health` |
| **crawl4ai** | 8001 | Web Crawling & Content Extraction | `/health` |
| **redis** | 6379 | Cache & Session Storage | `redis-cli ping` |
| **postgres** | 5432 | Database (optional) | `pg_isready` |

## 🔧 Environment Setup

### Required Variables
Edit `.env` with these **required** values:

```bash
# HuggingFace (Required for embeddings)
HUGGINGFACE_API_TOKEN=hf_your_token_here

# Firebase (Required for database)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour\nKey\n-----END PRIVATE KEY-----\n"

# Security (Required)
NEXTAUTH_SECRET=your-super-secure-secret-key-32-chars-minimum
```

### Get API Keys
1. **HuggingFace**: Visit [HuggingFace Tokens](https://huggingface.co/settings/tokens)
2. **Firebase**: Go to [Firebase Console](https://console.firebase.google.com/) → Project Settings → Service Accounts
3. **NextAuth Secret**: Generate with `openssl rand -base64 32`

### Optional Services
```bash
# Stripe (for payments)
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_key

# Google Services
GOOGLE_CLIENT_ID=your-oauth-client-id
GOOGLE_MAPS_API_KEY=your-maps-key

# Email (Resend)
RESEND_API_KEY=re_your_api_key
```

## 🚀 Deployment Commands

### Core Commands
```bash
# Start all services
make up

# Stop all services
make down

# View logs
make logs

# Check health
make health

# Run tests
make test
```

### Windows PowerShell
```powershell
# Start services
.\up.ps1 up

# Check health
.\up.ps1 health

# View logs
.\up.ps1 logs

# Test deployment
.\up.ps1 test
```

### Development
```bash
# Start with hot reload
make dev

# Start with monitoring
make monitor

# Start with PostgreSQL
make postgres

# View specific service logs
make logs-app
make logs-crawl4ai
```

## 🏥 Health Monitoring

### Built-in Health Checks
All services include comprehensive health monitoring:

```bash
# Check all services
curl http://localhost:3000/api/health

# Individual service checks
curl http://localhost:8001/health  # Crawl4AI
docker exec xenlix-redis redis-cli ping  # Redis
```

### Health Check Response
```json
{
  "ok": true,
  "status": "healthy",
  "services": {
    "huggingface": {
      "status": "healthy",
      "model": "sentence-transformers/all-MiniLM-L6-v2"
    },
    "redis": {
      "status": "healthy",
      "connected": true
    },
    "crawl4ai": {
      "status": "healthy",
      "url": "http://crawl4ai:8000"
    }
  }
}
```

## 🧪 Testing the Deployment

### Automated Tests
```bash
# Run full test suite
make test

# Test AEO analysis
curl -X POST http://localhost:3000/api/aeo-score \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","queries":["What services do you offer?"]}'
```

### Expected Response
```json
{
  "overallAeoScore": 85.5,
  "similarityMatrices": {
    "What services do you offer?": [[0.8234, 0.6521, ...]]
  },
  "topMatchingContent": [
    {
      "query": "What services do you offer?",
      "content": "We provide comprehensive...",
      "score": 0.8234
    }
  ],
  "embeddingMetadata": {
    "modelUsed": "sentence-transformers/all-MiniLM-L6-v2",
    "embeddingDimensions": 384
  }
}
```

## 🔍 Troubleshooting

### Common Issues

#### Services Won't Start
```bash
# Check Docker is running
docker --version
docker-compose --version

# Check logs for errors
make logs

# Clean and rebuild
make clean
make up
```

#### Health Checks Failing
```bash
# Check individual services
docker-compose ps
docker-compose logs crawl4ai
docker-compose logs xenlix-app

# Restart specific service
docker-compose restart crawl4ai
```

#### Environment Issues
```bash
# Validate environment
make check-env

# Check required variables
grep -E "(HUGGINGFACE|FIREBASE|NEXTAUTH)" .env
```

### Performance Issues
```bash
# Monitor resource usage
make stats

# Check container logs
make logs-app

# Restart services
make restart
```

## 📊 Production Deployment

### Resource Requirements
- **CPU**: 4 cores minimum, 8+ recommended
- **RAM**: 4GB minimum, 8GB+ recommended
- **Storage**: 10GB+ available space
- **Network**: Stable internet for API calls

### Production Checklist
- [ ] Update `NEXTAUTH_URL` to your domain
- [ ] Use production Firebase project
- [ ] Set strong `NEXTAUTH_SECRET`
- [ ] Configure proper SSL certificates
- [ ] Enable monitoring stack (`make monitor`)
- [ ] Set up log aggregation
- [ ] Configure automated backups

### Security Considerations
- All containers run as non-root users
- Security options enabled (`no-new-privileges`)
- Resource limits enforced
- Health checks configured
- Secrets managed via environment variables

## 🎛️ Advanced Configuration

### Custom Networks
```yaml
# docker-compose.override.yml
services:
  xenlix-app:
    environment:
      - CUSTOM_VAR=value
```

### Monitoring Stack
```bash
# Start with Prometheus + Grafana
make monitor

# Access monitoring
open http://localhost:9090  # Prometheus
open http://localhost:3001  # Grafana
```

### Database Options
```bash
# Use PostgreSQL instead of Firebase
make postgres

# Update DATABASE_URL in .env
DATABASE_URL="postgresql://postgres:password@localhost:5432/xenlix"
```

## 📚 API Documentation

### Health Endpoint
- **URL**: `GET /api/health`
- **Response**: Service status and metrics

### AEO Analysis
- **URL**: `POST /api/aeo-score`
- **Body**: `{"url": "string", "queries": ["string"]}`
- **Response**: AEO analysis with similarity matrices

### Crawl4AI Service  
- **URL**: `POST http://localhost:8001/crawl`
- **Body**: `{"url": "string"}`
- **Response**: Extracted content and metadata

## 🤝 Support

### Getting Help
1. Check this README for common solutions
2. Review service logs: `make logs`
3. Check health status: `make health`
4. Validate environment: `make check-env`

### Debugging
```bash
# Enter container for debugging
docker exec -it xenlix-app sh
docker exec -it xenlix-crawl4ai sh

# Check container resources
make stats

# View detailed logs
make logs-app
```

---

## 🏆 Success Criteria

✅ **Services Up**: All containers running and healthy  
✅ **Health Checks Green**: All endpoints responding  
✅ **AEO Analysis Working**: Real embeddings and similarity matrices  
✅ **Performance Optimized**: Resource limits and caching enabled  
✅ **Security Hardened**: Non-root users and security policies  

**Ready to optimize your Answer Engine presence! 🚀**