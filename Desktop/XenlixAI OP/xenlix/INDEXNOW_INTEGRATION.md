# IndexNow Integration Documentation

## Overview

This IndexNow implementation provides automatic search engine notifications when content or schema changes occur on your website. It includes comprehensive rate limiting, error handling, logging, and dashboard integration.

## Key Features

- ✅ **Secure API Key System**: Generated and verified via public key file
- ✅ **Rate Limiting**: 10/minute, 100/hour, 1000/day limits with retry logic
- ✅ **Comprehensive Logging**: Track all submissions with detailed metrics
- ✅ **Dashboard Integration**: Visual interface for manual submissions and monitoring
- ✅ **Automatic Triggers**: Smart triggers for content/schema changes
- ✅ **Batch Processing**: Efficient URL grouping to avoid rate limits
- ✅ **Error Handling**: Exponential backoff retry logic

## Configuration

### Environment Variables

```env
# Required: IndexNow API Key (32-byte hex string)
INDEXNOW_API_KEY=7442febbe7c99d1ec6a14e3cc943a762

# Required: Your site's base URL
NEXT_PUBLIC_SITE_URL=https://www.xenlixai.com
```

### Verification File

The system automatically creates a verification file at:
```
/public/{INDEXNOW_API_KEY}.txt
```

This file contains only the API key and must be accessible at:
```
https://yoursite.com/{INDEXNOW_API_KEY}.txt
```

## API Endpoints

### POST /api/indexnow

Submit URLs for immediate indexing.

**Request:**
```json
{
  "urls": ["https://example.com/page1", "https://example.com/page2"],
  "reason": "updated" // "created" | "updated" | "deleted"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully submitted 2 URL(s) to search engines",
  "urlCount": 2,
  "reason": "updated",
  "rateLimits": {
    "minute": { "remaining": 8 },
    "hour": { "remaining": 98 },
    "day": { "remaining": 998 }
  }
}
```

### GET /api/indexnow

Get IndexNow status and rate limit information.

**Response:**
```json
{
  "configured": true,
  "keyLocation": "https://yoursite.com/7442febbe7c99d1ec6a14e3cc943a762.txt",
  "rateLimits": {
    "minute": { "used": 2, "limit": 10, "remaining": 8 },
    "hour": { "used": 2, "limit": 100, "remaining": 98 },
    "day": { "used": 2, "limit": 1000, "remaining": 998 }
  }
}
```

### GET /api/indexnow/logs

Get submission history and statistics.

**Response:**
```json
{
  "logs": [
    {
      "id": "indexnow_1704147600000_abc123",
      "timestamp": "2024-01-01T12:00:00.000Z",
      "urls": ["https://example.com/page1"],
      "urlCount": 1,
      "success": true,
      "reason": "updated",
      "responseCode": 200,
      "duration": 1500
    }
  ],
  "stats": {
    "totalSubmissions": 10,
    "successfulSubmissions": 9,
    "failedSubmissions": 1,
    "totalUrls": 25,
    "lastSubmission": "2024-01-01T12:00:00.000Z"
  }
}
```

## Automatic Triggers

### Client-Side Usage

```tsx
import { useIndexNowTrigger } from '@/lib/indexnow-triggers';

function ContentEditor() {
  const { onContentCreated, onContentUpdated, onContentDeleted } = useIndexNowTrigger();

  const handleSave = async (url: string, isNew: boolean) => {
    // Save content...
    
    if (isNew) {
      await onContentCreated(url); // High priority, immediate
    } else {
      await onContentUpdated(url); // Normal priority, batched
    }
  };

  const handleDelete = async (url: string) => {
    // Delete content...
    await onContentDeleted(url); // Normal priority, immediate
  };
}
```

### Server-Side Usage

```tsx
import { triggerServerSideIndexNow } from '@/lib/indexnow-triggers';

export async function POST(request: Request) {
  // Handle content creation...
  
  // Trigger IndexNow submission
  await triggerServerSideIndexNow('/new-page', {
    immediate: true,
    priority: 'high',
    reason: 'created'
  });
  
  return NextResponse.json({ success: true });
}
```

### Trigger Functions

| Function | Priority | Timing | Use Case |
|----------|----------|--------|----------|
| `onContentCreated` | High | Immediate | New pages, posts, products |
| `onContentUpdated` | Normal | Batched (5s delay) | Content edits, updates |
| `onContentDeleted` | Normal | Immediate | Removed pages, discontinued products |
| `onSchemaChange` | High | Immediate | Structured data changes |
| `triggerOnSitemapUpdate` | High | Immediate | Sitemap modifications |

## Rate Limiting

The system implements comprehensive rate limiting:

- **Per Minute**: 10 requests (matches IndexNow recommendations)
- **Per Hour**: 100 requests
- **Per Day**: 1,000 requests

### Rate Limit Handling

- Automatic retry with exponential backoff
- Queue management for batch submissions
- Rate limit status visible in dashboard
- Graceful degradation when limits exceeded

## Batch Processing

To optimize rate limit usage:

1. **Immediate Submission**: High-priority changes (created content, schema updates)
2. **Batched Submission**: Normal updates grouped over 5 seconds
3. **Smart Filtering**: Only submits URLs that should trigger indexing

```tsx
// URLs that trigger auto-submission
const includedPaths = ['/contact', '/plans', '/case-studies', '/'];

// URLs that DON'T trigger auto-submission
const excludedPaths = ['/api/', '/dashboard', '/admin', '/_next/'];
```

## Dashboard Integration

Access the IndexNow dashboard at `/dashboard` in the "Search Engine Indexing" section:

### Features

- **Status Overview**: Configuration, success rate, total URLs
- **Rate Limits**: Visual progress bars for minute/hour/day limits
- **Manual Submission**: Submit individual URLs or use quick-submit buttons
- **Submission History**: Recent attempts with success/failure status
- **Real-time Updates**: Auto-refresh every 30 seconds

### Quick Submit Options

- Homepage (`/`)
- Contact page (`/contact`)
- Pricing (`/plans`)
- Case studies (`/case-studies`)
- Dallas location (`/dallas`)
- Sitemap (`/sitemap.xml`)

## Monitoring and Logging

### Log Data Tracked

- Submission timestamp
- URLs submitted
- Success/failure status
- Response codes
- Submission duration
- Rate limit status
- Error messages

### Statistics Available

- Total submissions
- Success rate percentage
- URLs processed
- Last submission time
- Rate limit usage

## Best Practices

### When to Trigger IndexNow

✅ **DO Trigger For:**
- New page creation
- Content updates that change meaning
- Schema.org structured data changes
- Navigation/menu updates
- Sitemap modifications
- Product launches
- Important announcements

❌ **DON'T Trigger For:**
- Minor typo fixes
- Style/CSS changes
- Administrative pages
- User-generated content (comments, reviews)
- Frequent data updates (prices, inventory)

### Optimization Tips

1. **Use Batching**: Let normal updates batch automatically
2. **High Priority Sparingly**: Only for truly important changes
3. **Monitor Rate Limits**: Check dashboard regularly
4. **Filter URLs**: Ensure only public pages are submitted
5. **Test in Staging**: Verify triggers work before production

## Troubleshooting

### Common Issues

**Rate Limit Exceeded**
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 60,
  "limit": "minute"
}
```
- Solution: Wait for the retry period or reduce submission frequency

**Invalid URL**
```json
{
  "error": "Invalid request",
  "details": [{"code": "invalid_string", "path": ["urls", 0]}]
}
```
- Solution: Ensure URLs are properly formatted and absolute

**Authentication Required**
```json
{
  "error": "Authentication required"}
```
- Solution: Ensure user is signed in before making requests

**Configuration Missing**
```json
{
  "error": "IndexNow API key not configured"}
```
- Solution: Check environment variables and key file

### Debug Mode

Enable detailed logging by setting:
```env
NODE_ENV=development
```

This will show additional console output for debugging triggers and submissions.

## Search Engine Support

IndexNow is supported by:
- ✅ **Microsoft Bing**: Primary supporter
- ✅ **Yandex**: Full support
- ✅ **Seznam**: Czech search engine
- ⏳ **Google**: Evaluating (may use signals)

## Security Considerations

- API key is public (required by IndexNow protocol)
- Authentication required for submissions
- Rate limiting prevents abuse
- Server-side validation of all inputs
- HTTPS enforcement for production

## Performance Impact

- Minimal: Async submissions don't block user operations
- Batching reduces API calls
- Client-side triggers are non-blocking
- Server-side triggers use background processing

## Integration Examples

See example files:
- `/src/app/api/content/example/route.ts` - Server-side API integration
- `/src/components/examples/ContentManagerExample.tsx` - Client-side React integration
- `/src/lib/indexnow-triggers.ts` - Trigger system implementation