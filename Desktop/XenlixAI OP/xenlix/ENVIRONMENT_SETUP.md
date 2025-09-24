# 🚀 Production Environment Setup Guide

This guide covers setting up all environment variables for your AEO SaaS platform in production.

## 📋 Environment Files Overview

Your platform uses multiple environment files:

- **`.env.local`** - Next.js application environment variables (main platform)
- **`.env`** - Python services environment variables (Crawl4AI service)
- **`.env.example`** - Template for Next.js environment variables
- **`.env.python.example`** - Template for Python services

## 🔧 Required Services Setup

### 1. Redis (Required for Caching & Job Queues)

**Option A: Local Redis Installation**
```bash
# Windows (using Chocolatey)
choco install redis-64

# macOS (using Homebrew)
brew install redis

# Ubuntu/Debian
sudo apt update && sudo apt install redis-server

# Start Redis
redis-server
```

**Option B: Upstash Redis (Recommended for Production)**
1. Sign up at [upstash.com](https://upstash.com)
2. Create a new Redis database
3. Get your REST URL and token
4. Set environment variables:
```bash
UPSTASH_REDIS_REST_URL="https://your-database.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token"
```

### 2. Firebase (Required for Data Persistence)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or use existing
3. Enable Firestore Database
4. Generate service account:
   - Go to Project Settings > Service Accounts
   - Click "Generate new private key"
   - Download the JSON file
5. Extract values for environment variables:
```bash
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk@your-project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 3. Google APIs (Required for SEO Features)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project or select existing
3. Enable APIs:
   - PageSpeed Insights API
   - Google Search Console API
   - Safe Browsing API (optional)
   - Maps JavaScript API (optional)
4. Create credentials:
   - API Key for PageSpeed Insights
   - OAuth 2.0 credentials for Search Console
5. Set environment variables:
```bash
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_PAGESPEED_API_KEY="your-api-key"
```

## 🤖 AI/ML Services Setup (Optional)

### OpenAI (Recommended for Advanced AI Features)
1. Sign up at [OpenAI](https://platform.openai.com)
2. Generate API key
3. Set environment variable:
```bash
OPENAI_API_KEY="sk-your-openai-api-key"
```

### HuggingFace (Required for Local Embeddings)
1. Sign up at [HuggingFace](https://huggingface.co)
2. Generate access token
3. Set environment variable:
```bash
HUGGINGFACE_API_TOKEN="hf_your-token"
```

### Anthropic (Optional for Claude AI)
1. Sign up at [Anthropic](https://console.anthropic.com)
2. Generate API key
3. Set environment variable:
```bash
ANTHROPIC_API_KEY="sk-ant-your-key"
```

## 🔐 Security Configuration

### 1. Generate Secure Keys
```bash
# NextAuth Secret (minimum 32 characters)
openssl rand -base64 32

# Cron Secret
openssl rand -base64 24

# Redis Password
openssl rand -base64 16
```

### 2. Environment Variables Security
- **Never commit `.env.local` to version control**
- Use strong, unique passwords for all services
- Rotate API keys regularly
- Use different keys for development/staging/production

## 🏗️ Deployment Steps

### 1. Copy Environment Templates
```bash
# Copy Next.js template
cp .env.example .env.local

# Copy Python services template  
cp .env.python.example .env
```

### 2. Fill in Required Values
Edit `.env.local` and `.env` with your actual API keys and service URLs.

### 3. Validate Configuration
```bash
# Test Next.js environment
npm run build

# Test Python service
python -c "import os; print('CRAWL4AI_URL:', os.getenv('CRAWL4AI_URL'))"
```

### 4. Start Services
```bash
# Start Redis (if local)
redis-server

# Start Python services
python crawl4ai-service.py

# Start Next.js application
npm run start
```

## ✅ Environment Validation Checklist

### Core Services (Required)
- [ ] `NEXTAUTH_SECRET` - Set to secure 32+ character string
- [ ] `NEXT_PUBLIC_SITE_URL` - Set to your production domain
- [ ] `REDIS_URL` - Redis connection configured and working
- [ ] `FIREBASE_PROJECT_ID` - Firebase project configured
- [ ] `FIREBASE_PRIVATE_KEY` - Service account key properly formatted
- [ ] `CRAWL4AI_URL` - Python service accessible

### Google Services (Required for SEO)
- [ ] `GOOGLE_CLIENT_ID` - OAuth configured
- [ ] `GOOGLE_CLIENT_SECRET` - OAuth configured  
- [ ] `GOOGLE_PAGESPEED_API_KEY` - PageSpeed API enabled

### AI Services (Optional but Recommended)
- [ ] `OPENAI_API_KEY` - For enhanced AI features
- [ ] `HUGGINGFACE_API_TOKEN` - For embeddings
- [ ] `ANTHROPIC_API_KEY` - For Claude AI (optional)

### Production Settings
- [ ] `NODE_ENV=production`
- [ ] `APP_ENV=production`
- [ ] `BILLING_MODE=live` (for Stripe)

## 🚨 Common Issues & Solutions

### Redis Connection Issues
```bash
# Check Redis status
redis-cli ping

# Check environment variables
echo $REDIS_URL
```

### Firebase Authentication Issues
- Ensure private key is properly formatted with `\n` newlines
- Verify service account has Firestore permissions
- Check project ID matches exactly

### Crawl4AI Service Issues
- Verify Python service is running on specified port
- Check firewall settings for inter-service communication
- Ensure all required Python packages are installed

### Build/Runtime Issues
```bash
# Check for missing environment variables
npm run build 2>&1 | grep -i "env\|environment"

# Validate environment configuration
node -e "console.log('Config loaded:', process.env.NEXT_PUBLIC_SITE_URL ? 'OK' : 'Missing')"
```

## 📞 Support

If you encounter issues:
1. Check the console for specific error messages
2. Verify all required environment variables are set
3. Test each service independently
4. Check service logs for detailed error information

## 🔄 Environment Updates

When updating environment variables:
1. Update the appropriate `.env` file
2. Restart the affected services
3. Verify the changes in the application logs
4. Test functionality to ensure changes are working

## 🏷️ Environment Variable Reference

See `.env.example` and `.env.python.example` for complete lists of all available environment variables with descriptions and example values.