# Premium AEO Intelligence Dashboard & Plugin

## Overview

The Premium AEO Intelligence Dashboard provides comprehensive AI visibility tracking and optimization insights for paying customers. This system includes:

- **Company Visibility Snapshot**: AI Visibility Score with industry benchmarking
- **Competitor Analysis**: Head-to-head comparison with gap identification  
- **Citation Tracking**: Authority-weighted source analysis with OPR integration
- **Answer Engine Coverage**: Presence across ChatGPT, Gemini, Claude, Perplexity
- **AI-Generated Recommendations**: Prioritized action items for optimization

## Architecture

### Database Schema (Prisma)
```
Company → QueryResult, CompanyCitation, CompanyCompetitor, CompanyScore, CompanyRecommendation
User → Company (premium users only)
```

### Plugin Integration Pipeline
```
URL Input → Content Fetch → Parse & Extract → Authority Scoring → AI Visibility → Store Results → Dashboard Display
```

### Job Queue System (Redis + BullMQ)
- **Company Analysis**: Full website scan with citation extraction
- **Visibility Sweep**: Daily AI engine query checks  
- **Competitor Analysis**: Benchmark tracking and gap identification

## Setup Instructions

### 1. Environment Variables

Add these to your `.env` file:

```bash
# Premium AEO Dashboard
OPR_API_KEY=your_openpagerank_api_key_here
REDIS_URL=redis://localhost:6379

# Optional: Lighthouse auditing
CHROME_PATH=/usr/bin/google-chrome

# Existing variables
DATABASE_URL=file:./prisma/dev.db
NEXTAUTH_SECRET=your_secret_here
```

### 2. Database Migration

```bash
npx prisma db push
```

This creates the premium AEO tables:
- `Company` - Company profiles and scan status
- `QueryResult` - AI engine query results 
- `CompanyCitation` - Citation tracking with authority scores
- `CompanyCompetitor` - Competitor benchmarking data
- `CompanyScore` - Daily visibility metrics
- `CompanyRecommendation` - AI-generated action items

### 3. Redis Setup

Install and start Redis:

**Windows (using Chocolatey):**
```powershell
choco install redis-64
redis-server
```

**macOS (using Homebrew):**
```bash
brew install redis
brew services start redis
```

**Linux (Ubuntu):**
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
```

### 4. Start Background Workers

The job queue workers process company analysis tasks:

```bash
# In a separate terminal
npm run workers:start
```

Or add to your main application startup.

### 5. Open PageRank API Key

Get your free API key from [OpenPageRank.com](https://openpagerank.com):

1. Sign up for free account
2. Generate API key  
3. Add to `OPR_API_KEY` environment variable
4. Free tier: 1,000 requests/month

## How to Use

### 1. Access Premium Dashboard

Navigate to `/dashboard/premium-aeo` (requires premium subscription).

### 2. Add Your First Company

1. Click "Add Company" 
2. Enter website URL and company name
3. Optionally add competitors for benchmarking
4. Choose "Full Scan" for complete analysis

### 3. Monitor Scan Progress

- Real-time progress updates in dashboard
- Email notifications when scan completes
- Typical scan time: 2-5 minutes per company

### 4. View Results

**Overview Tab:**
- AI Visibility Score (0-100)
- Trend charts and competitor comparison
- Citation source breakdown

**Competitors Tab:**  
- Head-to-head visibility comparison
- Gap analysis with specific recommendations
- Market share and positioning insights

**Citations Tab:**
- Authority-weighted source analysis  
- Top citing domains with PageRank scores
- Missing citation opportunities

**Recommendations Tab:**
- AI-generated action items by priority
- Implementation roadmap (immediate, short-term, long-term)
- Progress tracking and completion rates

## Testing with Mock Data

### 1. Create Test Company

Use the built-in demo mode for testing:

```javascript
// In your browser console on /dashboard/premium-aeo
localStorage.setItem('demo-mode', 'true');
location.reload();
```

This populates the dashboard with realistic sample data.

### 2. API Testing

Test endpoints directly:

```bash
# Get company visibility data
curl -H "Authorization: Bearer <session-token>" \
  "http://localhost:3000/api/visibility/[companyId]"

# Get competitor analysis  
curl -H "Authorization: Bearer <session-token>" \
  "http://localhost:3000/api/competitors/[companyId]"
```

### 3. Job Queue Testing

Manually trigger analysis jobs:

```bash
# Add to Redis queue for testing
redis-cli LPUSH bull:company-analysis:wait '{"companyId":"test-123","url":"https://example.com"}'
```

## Free vs Premium Differences

### Free Users
- Basic AI visibility score only
- Limited to 1 company  
- No competitor analysis
- No citation tracking
- No recommendations
- Weekly data refresh only

### Premium Users ($97/month)
- ✅ Unlimited companies
- ✅ Full competitor benchmarking
- ✅ Citation authority analysis
- ✅ AI-generated recommendations  
- ✅ Daily data refresh
- ✅ Historical trend analysis
- ✅ Export capabilities
- ✅ Priority support

## Technical Implementation Details

### Company Info Schema

All data follows the standardized `company-info.schema.json` format:

```json
{
  "source": { "requestedUrl": "...", "collectedAt": "..." },
  "company": { "name": "...", "industry": "..." },
  "web": { "domain": "...", "technologies": [...] },
  "content": { "title": "...", "schemaOrg": [...] },
  "extractions": { "brandMentions": [...], "citations": [...] },
  "metrics": { "opr": {...}, "lighthouse": {...}, "aeo": {...} },
  "provenance": { "hash": "...", "pipelineVersion": "..." }
}
```

### Plugin Workflow

1. **Fetch & Snapshot**: Retrieve URL content with proper headers
2. **Parse Content**: Extract title, meta tags, structured data, social links
3. **Citation Extraction**: Find outbound links and normalize domains  
4. **Authority Scoring**: Query OPR API for PageRank data
5. **Lighthouse Audit**: Technical SEO scoring
6. **AI Visibility**: Query engines for brand mentions (optional)
7. **Store Results**: Validate against schema and persist to database

### Caching Strategy

- **ISR (Incremental Static Regeneration)**: 24-hour revalidation
- **Redis Cache**: Hot data with 1-hour TTL
- **Database Optimization**: Indexed queries on high-traffic fields

### Error Handling

- Graceful degradation when external APIs fail
- Retry logic with exponential backoff  
- User-friendly error messages in dashboard
- Background job failure recovery

## Troubleshooting

### Common Issues

**"Premium subscription required" error:**
- Verify user has active Stripe subscription with `status: 'active'`
- Check subscription table relationships in database

**Company scan stuck at 0%:**
- Check Redis connection and worker processes
- Verify OPR API key is valid and has quota
- Check Chrome installation for Lighthouse audits

**Empty dashboard with no data:**
- Ensure scan has completed (status: 'completed')  
- Check API endpoints return data (not 404/500 errors)
- Verify company ownership (userId matches session)

**Charts not rendering:**
- Install recharts dependency: `npm install recharts`
- Check browser console for JavaScript errors
- Verify chart data structure matches expected format

### Debug Commands

```bash
# Check Redis connection
redis-cli ping

# View job queue status  
redis-cli KEYS "bull:*"

# Check database content
npx prisma studio

# View API logs
tail -f logs/api.log
```

### Performance Optimization

**For high-volume usage:**

1. **Database Scaling**: Consider PostgreSQL for production
2. **Redis Clustering**: Distribute job processing  
3. **CDN Integration**: Cache static dashboard assets
4. **API Rate Limiting**: Implement per-user quotas
5. **Background Processing**: Queue intensive tasks

## API Reference

### Core Endpoints

- `GET /api/companies` - List user's companies
- `POST /api/companies` - Create new company analysis
- `GET /api/visibility/[companyId]` - Visibility metrics and trends
- `GET /api/citations/[companyId]` - Citation analysis and authority scores  
- `GET /api/competitors/[companyId]` - Competitor benchmarking
- `GET /api/recommendations/[companyId]` - AI-generated action items

### Query Parameters

**Visibility endpoint:**
- `?days=30` - Historical period (7, 30, 90 days)
- `?engines=chatgpt,gemini` - Filter by AI engines

**Citations endpoint:**  
- `?sortBy=authority` - Sort by authority, recent, or domain
- `?source=ai-answer` - Filter by page or ai-answer citations
- `?limit=100` - Maximum results returned

### Response Format

All endpoints return JSON with consistent structure:

```json
{
  "companyId": "...",
  "summary": { "totalCitations": 42, "trustScore": 85 },
  "data": [...],
  "metadata": { "lastUpdated": "...", "dataFreshness": "..." }
}
```

## Production Deployment

### Environment Setup

```bash
# Production environment variables
NODE_ENV=production
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
OPR_API_KEY=prod_key_here
```

### Scaling Considerations  

- **Database**: Use PostgreSQL with read replicas
- **Job Processing**: Multiple worker processes across servers  
- **Monitoring**: Set up alerts for failed scans and API errors
- **Backup**: Daily database backups with point-in-time recovery

### Security

- Rate limiting on API endpoints (100 req/min per user)
- Input validation and sanitization
- Premium user verification on all endpoints  
- Secure API key storage and rotation

This completes the Premium AEO Intelligence Dashboard implementation with comprehensive documentation, testing guidance, and production deployment notes.