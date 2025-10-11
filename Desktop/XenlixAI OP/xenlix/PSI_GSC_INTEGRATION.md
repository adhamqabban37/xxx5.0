# Google PageSpeed Insights & Search Console Integration

This document outlines the complete setup and usage of the integrated Google PageSpeed Insights (PSI) and Google Search Console (GSC) features in our AEO validation platform.

## 🔧 Environment Setup

### Required Environment Variables

Add these to your `.env.local` file:

```bash
# PageSpeed Insights API
PSI_API_KEY=your_psi_api_key_here

# Google OAuth for Search Console
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/gsc/oauth/callback

# Token encryption (generate a strong random string)
GOOGLE_TOKEN_ENCRYPTION_SECRET=your_32_character_encryption_secret

# Redis (optional - falls back to memory cache)
REDIS_URL=redis://localhost:6379

# Your app URL (for internal API calls)
NEXTAUTH_URL=https://yourdomain.com
```

### Getting API Keys

#### 1. PageSpeed Insights API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **PageSpeed Insights API**
4. Go to **Credentials** → **Create Credentials** → **API Key**
5. Restrict the key to PageSpeed Insights API for security
6. Copy the API key to `PSI_API_KEY`

#### 2. Google OAuth Setup

1. In Google Cloud Console, go to **Credentials**
2. Create **OAuth 2.0 Client IDs**
3. Set application type to "Web application"
4. Add authorized redirect URIs:
   - `https://yourdomain.com/api/gsc/oauth/callback`
   - `http://localhost:3000/api/gsc/oauth/callback` (for development)
5. Copy Client ID and Client Secret to environment variables

## 🚀 Features Overview

### PageSpeed Insights Integration

- **Live Lighthouse Audits**: Real-time performance, SEO, accessibility, and best practices scores
- **Mobile + Desktop**: Runs audits for both mobile and desktop strategies
- **Smart Caching**: 24-hour cache to preserve API quota
- **Rate Limiting**: Intelligent quota management with fallbacks
- **Mobile-First Scoring**: Prioritizes mobile scores with desktop as fallback

### Google Search Console Integration

- **OAuth Authentication**: Secure token storage with AES encryption
- **Verified Sites Only**: Automatically detects and works with verified properties
- **Search Analytics**: 28-day performance data (clicks, impressions, CTR, position)
- **Sitemap Information**: Submitted and indexed page counts
- **Graceful Degradation**: Never blocks validation if GSC is unavailable

## 📊 API Usage

### Enhanced Validation Request

```typescript
POST /api/unified-validation

{
  "websiteUrl": "https://example.com",
  "businessData": {
    "name": "Example Business",
    "industry": "Technology"
  },
  "enableAuthorityScoring": true,
  "competitors": [
    "https://competitor1.com",
    "https://competitor2.com"
  ]
}
```

### Response Structure

```typescript
{
  "success": true,
  "validationId": "abc123",
  "results": {
    "overallScore": 85,
    "categories": {
      "performance": {
        "score": 78,
        "status": "good",
        "badge": "✅",
        "details": {
          "mobile": { "perf": 75, "seo": 82, "accessibility": 90, "bestPractices": 85 },
          "desktop": { "perf": 82, "seo": 88, "accessibility": 92, "bestPractices": 90 },
          "strategy": "mobile-first"
        }
      }
      // ... other categories
    }
  },
  "gscData": {
    "verified": true,
    "searchAnalytics": {
      "clicks": 1250,
      "impressions": 15800,
      "ctr": 7.91,
      "position": 12.5,
      "period": "28 days"
    },
    "sitemaps": [
      { "path": "/sitemap.xml", "submitted": 150, "indexed": 145 }
    ]
  },
  "features": {
    "psiEnabled": true,
    "gscConnected": true,
    "authorityScoring": true
  }
}
```

### Google Search Console API

#### Connect Account

```typescript
GET /api/gsc/oauth/start

Response:
{
  "success": true,
  "authUrl": "https://accounts.google.com/oauth/authorize?..."
}
```

#### Get Site Summary

```typescript
GET /api/gsc/summary?siteUrl=https://example.com

Response:
{
  "success": true,
  "summary": {
    "verified": true,
    "siteUrl": "https://example.com",
    "searchAnalytics": { /* 28-day data */ },
    "sitemaps": [ /* sitemap info */ ],
    "lastUpdated": "2025-09-26T10:30:00Z"
  }
}
```

## 🛡️ Security & Rate Limiting

### Rate Limits

- **Validation API**: 5 requests per minute per IP
- **PSI Quota**: 20 requests per hour, 80 per day per IP
- **GSC API**: 20 requests per minute per authenticated user

### Security Features

- **Token Encryption**: OAuth tokens stored with AES-256 encryption
- **IP-based Rate Limiting**: Protects against quota exhaustion
- **Graceful Fallbacks**: Continues operation even with API failures
- **Error Handling**: Comprehensive error recovery and logging

## 🔄 Caching Strategy

### PageSpeed Insights

- **Cache Duration**: 24 hours per URL+strategy combination
- **Cache Key**: `psi:mobile:https://example.com` or `psi:desktop:https://example.com`
- **Storage**: Redis primary, memory fallback
- **Force Refresh**: Use `?force=true` query parameter

### Rate Limit Storage

- **Redis Database**: Uses Redis DB 1 for rate limiting data
- **Memory Fallback**: In-memory storage if Redis unavailable
- **Cleanup**: Automatic cleanup of expired entries

## 🧪 Testing

### API Testing

```bash
# Test PSI integration
curl -X POST http://localhost:3000/api/unified-validation \
  -H "Content-Type: application/json" \
  -d '{"websiteUrl": "https://google.com"}'

# Test GSC OAuth start
curl http://localhost:3000/api/gsc/oauth/start

# Test rate limiting
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/unified-validation \
    -H "Content-Type: application/json" \
    -d '{"websiteUrl": "https://example.com"}'
done
```

### Error Scenarios

1. **PSI API Quota Exceeded**: Validation continues with fallback performance data
2. **GSC Not Connected**: Validation completes without GSC data
3. **Network Timeouts**: 30-second timeout with graceful handling
4. **Invalid URLs**: Proper validation and error messages

## 📈 Monitoring & Troubleshooting

### Logs to Monitor

```bash
# PSI quota usage
grep "PSI quota" logs/

# GSC connection issues  
grep "GSC" logs/

# Rate limiting events
grep "Rate limit" logs/
```

### Common Issues

1. **PSI Quota Exceeded**
   - Check daily usage in Google Cloud Console
   - Verify caching is working (check Redis/memory)
   - Consider upgrading PSI API plan

2. **GSC Not Working**
   - Verify OAuth setup in Google Cloud Console
   - Check redirect URI configuration
   - Ensure user has verified the site in GSC

3. **Rate Limits Triggering**
   - Check if legitimate traffic or abuse
   - Adjust limits in `rate-limit.ts` if needed
   - Monitor Redis connection

## 🔧 Configuration Options

### PSI Configuration (`src/lib/psi.ts`)

```typescript
const PSI_CONFIG = {
  baseUrl: 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed',
  timeout: 30000, // 30 seconds
  cacheTimeout: 24 * 60 * 60 * 1000, // 24 hours
  retryAttempts: 2,
  retryDelay: 1000
};
```

### Rate Limit Configuration (`src/lib/rate-limit.ts`)

```typescript
export const PSI_RATE_LIMITS = {
  daily: { interval: 24 * 60 * 60 * 1000, maxRequests: 80 },
  hourly: { interval: 60 * 60 * 1000, maxRequests: 20 },
  validation: { interval: 60 * 1000, maxRequests: 5 }
};
```

## 🚀 Deployment Checklist

- [ ] Set all environment variables in production
- [ ] Configure Redis for production caching
- [ ] Set up Google Cloud project with proper quotas
- [ ] Configure OAuth redirect URIs for production domain
- [ ] Test PSI API key permissions
- [ ] Verify GSC OAuth flow works end-to-end
- [ ] Monitor rate limiting and adjust as needed
- [ ] Set up logging and monitoring for API usage

## 📚 Additional Resources

- [PageSpeed Insights API Documentation](https://developers.google.com/speed/docs/insights/v5/about)
- [Google Search Console API](https://developers.google.com/webmaster-tools/search-console-api-original)
- [Google OAuth 2.0 Setup](https://developers.google.com/identity/protocols/oauth2)
- [Redis Caching Best Practices](https://redis.io/docs/manual/config/)

---

## 🆘 Support

For issues with this integration:

1. Check the logs for specific error messages
2. Verify all environment variables are set correctly
3. Test API keys independently
4. Check Google Cloud Console for quota usage
5. Ensure Redis is running (or disable for memory fallback)

The system is designed to be resilient - validation will continue even if PSI or GSC services are unavailable.