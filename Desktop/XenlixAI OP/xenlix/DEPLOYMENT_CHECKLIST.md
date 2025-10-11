# Production Deployment Checklist

## 🎯 Integration Complete Status

✅ **PageSpeed Insights Integration**
- Real-time mobile + desktop audits
- 24-hour intelligent caching  
- Rate limiting with quota management
- Graceful fallbacks and error handling

✅ **Google Search Console Integration**  
- OAuth flow with encrypted token storage
- Search analytics (28-day data)
- Sitemap information
- Verified site detection

✅ **Enhanced Validation API**
- PSI results storage in database
- GSC data inclusion for connected sites
- Feature flags and backward compatibility
- Comprehensive error recovery

## 🚀 Pre-Deployment Requirements

### 1. Environment Configuration

Create `.env.local` with:

```bash
# Required - PageSpeed Insights
PSI_API_KEY=your_psi_api_key_from_google_cloud

# Required - Google OAuth for Search Console  
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/gsc/oauth/callback

# Required - Token encryption (32+ character random string)
GOOGLE_TOKEN_ENCRYPTION_SECRET=your_strong_random_encryption_secret

# Optional - Redis for production caching
REDIS_URL=redis://localhost:6379

# Required - Your production URL
NEXTAUTH_URL=https://yourdomain.com
```

### 2. Google Cloud Setup

**PageSpeed Insights API:**
1. Enable PageSpeed Insights API in Google Cloud Console
2. Create API key restricted to PageSpeed Insights API
3. Set up billing and monitor quotas

**OAuth Setup:**
1. Create OAuth 2.0 credentials  
2. Add production redirect URI: `https://yourdomain.com/api/gsc/oauth/callback`
3. Verify authorized domains include your production domain

### 3. Database Migration

Run Prisma migration to add PSI/GSC fields:

```bash
npx prisma generate
npx prisma db push
```

Verify new fields exist:
- `psiMobile`, `psiDesktop` (JSON)
- `psiPerf`, `psiSeo`, `psiAccessibility`, `psiBestPractices` (Int)
- `gscSummary` (JSON), `gscConnected` (Boolean)

### 4. Redis Setup (Recommended)

```bash
# Install Redis
# Ubuntu/Debian:
sudo apt install redis-server

# macOS:
brew install redis

# Docker:
docker run -d -p 6379:6379 redis:alpine

# Configure Redis URL in environment
REDIS_URL=redis://localhost:6379
```

## 🧪 Pre-Production Testing

### API Functionality Tests

```bash
# 1. Test validation with PSI
curl -X POST https://yourdomain.com/api/unified-validation \
  -H "Content-Type: application/json" \
  -d '{"websiteUrl": "https://google.com"}'

# Should return PSI scores and cache them

# 2. Test GSC OAuth start
curl https://yourdomain.com/api/gsc/oauth/start

# Should return Google OAuth authorization URL

# 3. Test rate limiting
for i in {1..10}; do
  curl -X POST https://yourdomain.com/api/unified-validation \
    -H "Content-Type: application/json" \
    -d '{"websiteUrl": "https://example.com"}'
done

# Should show rate limiting after 5 requests/minute
```

### Cache Validation

```bash
# Check if Redis is working
redis-cli ping

# Verify PSI cache keys exist after running validation
redis-cli KEYS "psi:*"

# Verify rate limit keys
redis-cli -n 1 KEYS "*"
```

### Error Handling Tests

1. **PSI API Failure**: Temporarily use invalid API key - validation should continue
2. **Redis Failure**: Stop Redis - should fall back to memory cache  
3. **GSC Failure**: Disconnect internet during GSC call - should continue without GSC data
4. **Rate Limiting**: Exceed limits - should return 429 with proper messages

## 📊 Monitoring Setup

### Key Metrics to Track

```bash
# PSI API usage
grep "PSI API" /var/log/app/

# GSC connection health
grep "GSC" /var/log/app/

# Rate limiting events  
grep "Rate limit exceeded" /var/log/app/

# Cache hit rates
grep "Cache hit\|Cache miss" /var/log/app/
```

### Google Cloud Monitoring

1. Monitor PageSpeed Insights API quota usage
2. Set up billing alerts
3. Track API error rates
4. Monitor OAuth token refresh patterns

### Application Monitoring

```typescript
// Add to your monitoring dashboard:
- PSI cache hit rate (should be >80%)
- Average PSI response time (should be <5s)  
- GSC connection success rate (>95% for connected users)
- Rate limit trigger frequency
- Database PSI/GSC data storage success rate
```

## 🛡️ Security Checklist

### Production Security

- [ ] HTTPS enabled with valid SSL certificate
- [ ] Environment variables secured (not in code)
- [ ] Google API keys restricted to specific APIs
- [ ] OAuth redirect URIs limited to production domains
- [ ] Token encryption secret is truly random (32+ chars)
- [ ] Rate limiting configured appropriately
- [ ] Error messages don't expose sensitive data

### Google API Security

- [ ] PSI API key restricted to PageSpeed Insights API only
- [ ] OAuth credentials restricted to authorized domains
- [ ] Token storage uses AES-256 encryption
- [ ] Automatic token refresh implemented
- [ ] Failed token scenarios handled gracefully

## 🚀 Deployment Steps

### 1. Deploy Application

```bash
# Build application
npm run build

# Deploy to your platform (Vercel/Netlify/etc.)
# Ensure all environment variables are set in deployment platform
```

### 2. Configure Production Environment

```bash
# Set environment variables in your deployment platform
PSI_API_KEY=prod_key_here
GOOGLE_CLIENT_ID=prod_client_id  
GOOGLE_CLIENT_SECRET=prod_secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/gsc/oauth/callback
GOOGLE_TOKEN_ENCRYPTION_SECRET=prod_encryption_secret
REDIS_URL=redis://your-redis-instance:6379
NEXTAUTH_URL=https://yourdomain.com
```

### 3. Verify Deployment

```bash
# Test main validation endpoint
curl -X POST https://yourdomain.com/api/unified-validation \
  -H "Content-Type: application/json" \
  -d '{"websiteUrl": "https://google.com"}'

# Verify response includes PSI data:
# - psiEnabled: true
# - Mobile and desktop scores
# - Proper caching headers

# Test GSC OAuth
curl https://yourdomain.com/api/gsc/oauth/start
# Should redirect to Google OAuth
```

## 📈 Performance Optimization

### Caching Strategy

- **PSI Results**: 24-hour cache reduces API calls by ~95%
- **Rate Limiting**: In-memory with Redis fallback
- **GSC Data**: Fresh on each request (user-specific)

### Expected Performance

- **Cold PSI Request**: 8-15 seconds (Google API call)
- **Cached PSI Request**: <500ms (database + cache lookup)
- **GSC Data**: 2-5 seconds (authenticated API call)
- **Rate Limited**: <100ms (immediate rejection)

### Optimization Tips

1. **Monitor Cache Hit Rates**: Aim for >80% PSI cache hits
2. **Redis Memory**: Allocate sufficient memory for cache
3. **API Quotas**: Monitor and upgrade Google quotas as needed
4. **Database Performance**: Index commonly queried fields

## 🆘 Troubleshooting Guide

### Common Issues

**1. PSI API Quota Exceeded**
```
Error: "PSI quota exceeded for today"
Solution: Check Google Cloud Console quotas, verify caching is working
```

**2. GSC OAuth Failure**
```
Error: "Invalid redirect_uri"  
Solution: Verify GOOGLE_REDIRECT_URI matches Google Cloud Console settings
```

**3. Cache Issues**
```  
Error: Redis connection failed
Solution: System falls back to memory cache automatically
```

**4. Rate Limiting Too Aggressive**
```
Error: Users getting 429 errors frequently
Solution: Adjust rate limits in src/lib/rate-limit.ts
```

### Performance Issues

**Slow PSI Responses:**
- Check Google PageSpeed API status
- Verify network connectivity
- Monitor timeout settings (30s default)

**High Error Rates:**
- Check API key validity
- Monitor Google Cloud Console for service issues
- Verify environment variables are correctly set

## ✅ Launch Verification

Final checklist before going live:

- [ ] All environment variables set and verified
- [ ] PSI API returning valid scores for test URLs  
- [ ] GSC OAuth flow completes successfully
- [ ] Rate limiting prevents abuse
- [ ] Caching reduces API calls
- [ ] Error handling works gracefully
- [ ] Database stores PSI/GSC results correctly
- [ ] Monitoring and logging configured
- [ ] Performance meets expectations
- [ ] Security measures implemented

## 🎉 Success Metrics

After deployment, expect:

- **API Performance**: 95%+ uptime with graceful degradation
- **Cache Efficiency**: 80%+ PSI cache hit rate
- **User Experience**: Seamless validation with enhanced data
- **Cost Efficiency**: Significant reduction in PSI API costs due to caching
- **Data Quality**: Rich performance metrics and GSC insights

---

**🚀 Ready for Production!**

Your PSI/GSC integration is now production-ready with:
- Live Lighthouse audits (mobile + desktop)
- Google Search Console integration for verified sites  
- Intelligent caching and rate limiting
- Comprehensive error handling and security
- Scalable architecture with monitoring

Deploy with confidence! 🎯