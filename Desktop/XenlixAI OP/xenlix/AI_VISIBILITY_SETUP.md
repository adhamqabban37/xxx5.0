# AI Visibility Configuration Guide

## Environment Variables

Add these variables to your `.env.local` file for development and production:

### Core Configuration
```bash
# AI Visibility Feature Toggle
AI_VIS_ENABLED=true

# Scoring Integration Weight (0.0 to 1.0, default: 0.2)
AI_VIS_WEIGHT=0.2

# Collection Schedule (cron format, default: daily at 2 AM)
AI_VIS_SCHEDULE="0 2 * * *"

# Rate Limiting
AI_VIS_RATE_LIMIT_REQUESTS=10
AI_VIS_RATE_LIMIT_WINDOW_MS=60000

# Collection Timeout (seconds)
AI_VIS_COLLECTION_TIMEOUT=300
```

### Redis Configuration (for BullMQ job queue)
```bash
# Redis Connection
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Production Redis (if using external service)
# REDIS_URL=redis://username:password@host:port/database
```

### AI Engine Configuration
```bash
# Perplexity Collector
PERPLEXITY_BASE_URL=https://www.perplexity.ai
PERPLEXITY_TIMEOUT=30000
PERPLEXITY_MAX_RETRIES=3

# ChatGPT Collector  
CHATGPT_BASE_URL=https://chat.openai.com
CHATGPT_TIMEOUT=45000
CHATGPT_MAX_RETRIES=3
```

### Database Configuration
```bash
# Prisma Database (already configured in your existing .env)
# DATABASE_URL="file:./dev.db" # SQLite for development
# DATABASE_URL="postgresql://..." # PostgreSQL for production
```

## Feature Flags

The system includes several feature flags for gradual rollout:

### Backend Flags
- `AI_VIS_ENABLED`: Master switch for AI visibility features
- `AI_VIS_SCORING_ENABLED`: Enable/disable scoring integration
- `AI_VIS_COLLECTION_ENABLED`: Enable/disable automated collection
- `AI_VIS_UI_ENABLED`: Show/hide UI components

### Usage in Code
```typescript
// Check if AI visibility is enabled
const isAIVisEnabled = process.env.AI_VIS_ENABLED === 'true';

// Get scoring weight with fallback
const aiVisWeight = parseFloat(process.env.AI_VIS_WEIGHT || '0.2');
```

## Database Migration

Run the following commands to set up the AI Visibility schema:

```bash
# Generate Prisma client with new models
npx prisma generate

# Create and apply database migration
npx prisma migrate dev --name "add_ai_visibility_models"

# For production deployment
npx prisma migrate deploy
```

## Job Queue Setup

### Development (Local Redis)
```bash
# Install and start Redis (Windows with Chocolatey)
choco install redis-64
redis-server

# Or use Docker
docker run -d -p 6379:6379 redis:alpine
```

### Production Redis Options
1. **Redis Cloud**: https://redis.com/redis-enterprise-cloud/
2. **AWS ElastiCache**: Redis-compatible managed service
3. **Azure Cache for Redis**: Microsoft managed Redis
4. **Self-hosted**: Redis server on your infrastructure

## Initial Data Setup

Create your first brand and prompts:

```bash
# Use the management script (will be created)
npm run ai-vis:setup

# Or manually via Prisma Studio
npx prisma studio
```

## Testing the Integration

### Manual Collection Test
```bash
# Trigger manual collection
curl -X POST http://localhost:3000/api/ai-visibility/collect \
  -H "Content-Type: application/json" \
  -d '{"type": "full"}'
```

### Check Job Status
```bash
# Monitor job progress
curl http://localhost:3000/api/ai-visibility/jobs/{job-id}
```

### View Dashboard
Navigate to: `http://localhost:3000/ai-visibility`

## Deployment Checklist

### Before Deployment
- [ ] Set all required environment variables
- [ ] Configure Redis connection
- [ ] Run database migrations
- [ ] Test AI engine collectors
- [ ] Verify scoring integration
- [ ] Check API endpoints
- [ ] Test UI components

### After Deployment
- [ ] Monitor initial collection jobs
- [ ] Verify data is being stored correctly
- [ ] Check dashboard displays properly
- [ ] Monitor system performance
- [ ] Set up alerting for failed collections

## Monitoring and Alerting

### Key Metrics to Monitor
- Collection job success rate
- AI engine response times
- Database query performance
- Redis queue health
- API endpoint latency

### Recommended Alerts
- Failed collection jobs (>10% failure rate)
- AI engine timeouts (>30s response time)
- Redis connection failures
- Database connection issues
- High memory usage during collections

## Troubleshooting

### Common Issues

1. **Collections Failing**
   - Check AI engine availability
   - Verify network connectivity
   - Review rate limiting settings
   - Check browser automation setup

2. **No Data in Dashboard**
   - Verify database migrations ran
   - Check if collections are scheduled
   - Ensure AI_VIS_ENABLED=true
   - Review API endpoint responses

3. **Scoring Not Integrating**
   - Verify AI_VIS_WEIGHT is set correctly
   - Check existing scoring components
   - Ensure backward compatibility

4. **Performance Issues**
   - Monitor Redis memory usage
   - Check database query performance
   - Review collection frequency
   - Optimize Playwright operations

### Debug Commands
```bash
# Check Redis connection
redis-cli ping

# View database schema
npx prisma studio

# Test API endpoints
npm run test:api

# Check job queue
npm run ai-vis:queue-status
```

## Security Considerations

### Data Protection
- All AI engine interactions are logged
- PII is not stored in brand mentions
- Rate limiting prevents abuse
- API endpoints include validation

### Access Control
- Dashboard requires authentication (integrate with your auth system)
- API endpoints should be protected
- Environment variables contain sensitive data

### Privacy Compliance
- Brand mention data may contain business-sensitive information
- Consider data retention policies
- Implement data anonymization if required
- Regular data cleanup procedures

## Performance Optimization

### Collection Optimization
- Adjust collection frequency based on needs
- Implement smart retry logic
- Use parallel processing where possible
- Cache frequently accessed data

### Database Optimization
- Index frequently queried columns
- Archive old data periodically
- Monitor query performance
- Use database connection pooling

### UI Optimization
- Implement data caching in components
- Use pagination for large datasets
- Lazy load analytics data
- Optimize re-render cycles

## Scaling Considerations

### Horizontal Scaling
- BullMQ supports multiple worker processes
- Database can be scaled with read replicas
- Redis can use clustering for high availability
- API endpoints are stateless

### Vertical Scaling
- Monitor memory usage during collections
- CPU utilization during parsing operations
- Network bandwidth for AI engine requests
- Storage growth for historical data

## Maintenance Tasks

### Daily
- Monitor collection job success rates
- Check dashboard for anomalies
- Review error logs

### Weekly  
- Analyze AI visibility trends
- Review top performing brands
- Check system performance metrics

### Monthly
- Archive old data (>90 days)
- Review and update brand configurations
- Performance optimization review
- Security audit of access patterns