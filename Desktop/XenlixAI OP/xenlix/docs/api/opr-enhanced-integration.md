# Open PageRank (OPR) API Integration - Enhanced Documentation

## Overview

The Enhanced Open PageRank API integration provides robust domain authority scoring with comprehensive error handling, IDN support, and extensive validation. This API serves as a critical component for the Citation Extraction System and AI Visibility scoring.

## Features

### ✅ **Enhanced Resilience & Compatibility**

- **Environment Variable Validation**: Comprehensive validation of `OPR_API_KEY` with clear error messages
- **IDN/Punycode Support**: Full support for internationalized domain names
- **Robust URL Parsing**: Advanced fallback logic for edge cases and malformed URLs  
- **HTTP Status Code Mapping**: Precise error responses with actionable messages
- **Performance Monitoring**: Detailed logging and response time tracking
- **Comprehensive Testing**: 100+ test cases covering all edge cases

### 🔧 **API Improvements**

- **Domain Validation**: Enhanced regex supporting ASCII and IDN domains
- **Batch Processing**: Handles up to 100 domains with intelligent truncation
- **Caching Strategy**: 24-hour cache with stale-while-revalidate
- **Timeout Handling**: 30-second request timeout with proper error responses
- **Rate Limit Management**: Graceful handling of API limits

## Endpoint Details

### POST `/api/integrations/authority/opr`

**Purpose**: Get domain authority scores from Open PageRank API

**Request Body Options**:

```typescript
// Single URL
{
  "url": "https://example.com/path?query=value"
}

// Multiple domains
{
  "domains": ["example.com", "test.com", "xn--fsq.com"]
}

// Combined
{
  "url": "https://primary.com",
  "domains": ["secondary.com", "tertiary.com"]
}
```

**Response Format**:

```typescript
{
  "updatedAt": "2025-09-26T12:00:00.000Z",
  "results": [
    {
      "domain": "example.com",
      "opr": 5.67,           // Open PageRank score (0-10)
      "oprInt": 5,           // Integer PageRank
      "globalRank": 1000000, // Global ranking position
      "status": "success"
    },
    {
      "domain": "invalid.domain",
      "opr": 0,
      "oprInt": 0,
      "globalRank": null,
      "status": "error",
      "error": "Domain not found in OPR response"
    }
  ]
}
```

## Error Handling

### HTTP Status Codes

| Code | Error Type | Description |
|------|------------|-------------|
| `400` | `INVALID_REQUEST` | Malformed request body or invalid domains |
| `400` | `NO_VALID_DOMAINS` | No valid domains after validation |
| `401` | `INVALID_API_KEY` | Missing, empty, or invalid OPR_API_KEY |
| `405` | `METHOD_NOT_ALLOWED` | Non-POST request attempted |
| `429` | `OPR_API_ERROR` | Open PageRank rate limit exceeded |
| `500` | `INTERNAL_SERVER_ERROR` | Unexpected server error |
| `502` | `OPR_API_ERROR` | Open PageRank API error |
| `502` | `API_CONNECTION_ERROR` | Failed to connect to OPR API |
| `502` | `INVALID_API_RESPONSE` | Malformed response from OPR API |
| `504` | `API_TIMEOUT` | Request to OPR API timed out |

### Error Response Format

```typescript
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE",
  "details": {
    // Additional context when relevant
    "statusCode": 401,
    "domainCount": 5,
    "invalidDomains": [...]
  },
  "requestId": "1727347200000-abc123def" // For 500 errors
}
```

## Domain Processing

### URL Extraction Logic

The API uses a robust multi-step process to extract domains:

1. **Protocol Detection**: Handles `http://`, `https://`, or adds `https://` as default
2. **Hostname Extraction**: Uses Node.js URL constructor for reliable parsing  
3. **Normalization**: Converts to lowercase, removes `www.` prefix
4. **Fallback Logic**: Manual parsing for edge cases like malformed URLs
5. **Validation**: Comprehensive format checking including IDN support

### Supported Domain Formats

```typescript
// Standard domains
"example.com"
"sub.example.com"

// URLs with various components
"https://www.example.com/path?query=value#anchor"
"http://example.com:8080/api"

// Internationalized Domain Names (IDN)
"✓.com" → "xn--fsq.com" (automatic Punycode conversion)
"测试.com" → "xn--0zwm56d.com"

// Edge cases handled gracefully
"example.com/path" → "example.com"
"www.example.com:443" → "example.com"
"//example.com" → "example.com"
```

### Domain Validation Rules

- **Length**: Maximum 253 characters total
- **Format**: Valid DNS name structure with TLD
- **Characters**: ASCII alphanumeric, hyphens, dots, plus IDN support
- **Structure**: No leading/trailing dots, no consecutive dots
- **Punycode**: Automatic conversion for international characters

## Environment Configuration

### Required Variables

```bash
# Open PageRank API Key (required)
OPR_API_KEY=your_api_key_here
```

### API Key Validation

- **Format**: Alphanumeric characters only
- **Length**: Non-empty string
- **Validation**: Checked at startup and per request
- **Error Handling**: Clear messages for missing/invalid keys

## Performance Features

### Caching Strategy

```typescript
// Cache headers
'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200'
// 24 hour cache, 12 hour stale-while-revalidate

// Next.js ISR
next: { revalidate: 60 * 60 * 24 } // 24 hours
```

### Response Headers

```typescript
{
  'X-Response-Time': '1247ms',    // Total processing time
  'X-Domain-Count': '5',          // Number of domains processed
  'Cache-Control': '...',         // Caching directives
  'Content-Type': 'application/json'
}
```

### Rate Limiting

- **Domain Limit**: 100 domains per request (API constraint)
- **Timeout**: 30 second request timeout
- **Retry Logic**: Not implemented (client responsibility)
- **Batching**: Automatic truncation with warning logs

## Logging & Monitoring

### Log Levels & Format

```typescript
// Structured logging format
[2025-09-26T12:00:00.000Z] [OPR-API] INFO: Message {"metadata": "object"}

// Log levels
INFO:  Successful operations, performance metrics
WARN:  Non-fatal issues, truncated requests, missing domains  
ERROR: API failures, validation errors, timeouts
```

### Key Metrics Logged

- Request validation results
- Domain processing statistics
- API response times and status codes
- Error details and context
- Performance metrics

### Example Log Entries

```log
[2025-09-26T12:00:00.000Z] [OPR-API] INFO: Request validated successfully {"hasUrl": true, "domainCount": 3}
[2025-09-26T12:00:00.000Z] [OPR-API] WARN: Domain list truncated due to API limits {"originalCount": 150, "truncatedCount": 100}
[2025-09-26T12:00:01.247Z] [OPR-API] INFO: OPR API request completed successfully {"domainsRequested": 3, "successfulResults": 2, "totalTimeMs": 1247}
```

## Usage Examples

### Basic Single Domain

```typescript
const response = await fetch('/api/integrations/authority/opr', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: 'https://example.com' })
});

const data = await response.json();
console.log(data.results[0].opr); // 5.67
```

### Multiple Domains with Error Handling

```typescript
try {
  const response = await fetch('/api/integrations/authority/opr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      domains: ['valid.com', 'invalid..domain', 'another.com']
    })
  });

  if (!response.ok) {
    const error = await response.json();
    console.error(`API Error (${response.status}):`, error.error);
    
    if (error.code === 'NO_VALID_DOMAINS') {
      console.log('Invalid domains:', error.details);
    }
    return;
  }

  const data = await response.json();
  
  // Process successful results
  const successful = data.results.filter(r => r.status === 'success');
  console.log(`Got authority scores for ${successful.length} domains`);
  
  // Handle errors
  const failed = data.results.filter(r => r.status === 'error');
  if (failed.length > 0) {
    console.warn('Some domains failed:', failed.map(f => f.error));
  }
  
} catch (error) {
  console.error('Request failed:', error);
}
```

### Integration with Citation Analysis

```typescript
// Used by Citation Extraction System
async function getAuthorityScores(citedUrls: string[]) {
  const domains = citedUrls.map(url => extractDomain(url));
  
  const response = await fetch('/api/integrations/authority/opr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domains })
  });
  
  const data = await response.json();
  
  // Create authority lookup map
  const authorityMap = new Map();
  data.results.forEach(result => {
    if (result.status === 'success') {
      authorityMap.set(result.domain, {
        opr: result.opr,
        globalRank: result.globalRank
      });
    }
  });
  
  return authorityMap;
}
```

## Testing

### Test Coverage

The enhanced OPR API includes comprehensive test coverage:

- **Environment Validation**: API key validation scenarios
- **Request Validation**: Malformed requests, empty bodies, invalid JSON
- **Domain Processing**: URL extraction, IDN handling, validation edge cases
- **API Integration**: Timeout, connection errors, various HTTP status codes
- **Response Processing**: Missing domains, malformed responses, data normalization
- **Performance**: Caching headers, rate limiting, domain truncation

### Running Tests

```bash
# Run OPR API tests specifically
npm test tests/opr-api.test.ts

# Run with coverage
npm run test:coverage -- tests/opr-api.test.ts

# Integration tests (requires OPR_API_KEY)
OPR_API_KEY=your_key npm test tests/opr-api.integration.test.ts
```

### Mock Testing Setup

```typescript
// Mock OPR API responses for testing
const mockOprResponse = {
  ok: true,
  json: () => Promise.resolve({
    status_code: 200,
    response: [
      {
        domain: 'example.com',
        page_rank_decimal: 5.5,
        page_rank_integer: 5,
        rank: 1000000,
        status_code: 200
      }
    ]
  }),
  headers: new Headers({ 'content-type': 'application/json' })
};

global.fetch = jest.fn().mockResolvedValue(mockOprResponse);
```

## Migration from Previous Version

### Breaking Changes

None - the enhanced version maintains full backward compatibility.

### New Features Available

- Enhanced error responses with error codes
- IDN domain support
- Performance monitoring headers
- Comprehensive validation
- Improved logging

### Recommended Updates

```typescript
// Before: Basic error handling
if (!response.ok) {
  throw new Error('OPR API failed');
}

// After: Detailed error handling
if (!response.ok) {
  const error = await response.json();
  switch (error.code) {
    case 'INVALID_API_KEY':
      // Handle authentication error
      break;
    case 'NO_VALID_DOMAINS':
      // Handle validation error
      console.log('Invalid domains:', error.details);
      break;
    default:
      // Handle other errors
      console.error('API Error:', error.error);
  }
}
```

## Best Practices

### Error Handling

1. **Always check response status**: Use `response.ok` or check status codes
2. **Parse error responses**: Extract `error.code` for programmatic handling
3. **Log error details**: Include `error.details` for debugging
4. **Implement retry logic**: For timeouts and temporary failures
5. **Validate inputs**: Pre-validate domains client-side when possible

### Performance Optimization

1. **Batch requests**: Combine multiple domains in single request
2. **Cache results**: Respect cache headers for repeated requests  
3. **Limit domain count**: Keep under 100 domains per request
4. **Handle timeouts**: Implement client-side timeout handling
5. **Monitor response times**: Use `X-Response-Time` header

### Production Deployment

1. **Set OPR_API_KEY**: Ensure environment variable is configured
2. **Monitor logs**: Watch for validation errors and API failures
3. **Set up alerts**: Monitor for increased error rates
4. **Cache strategy**: Configure CDN/reverse proxy caching
5. **Rate limiting**: Implement client-side rate limiting if needed

## Integration Points

### Citation Extraction System

The OPR API is a key dependency for the Citation Extraction System:

```typescript
// Authority scoring in citation processing
const citations = await extractCitations(answerText);
const authorityScores = await getAuthorityScores(citations.map(c => c.url));

citations.forEach(citation => {
  const authority = authorityScores.get(citation.domain);
  citation.authorityScore = authority?.opr || 0;
  citation.globalRank = authority?.globalRank;
});
```

### AI Visibility Scoring

Authority scores feed into AI visibility calculations:

```typescript
// Weighted scoring based on domain authority
const citationScore = citations.reduce((score, citation) => {
  const weight = Math.min(citation.authorityScore / 10, 1); // Normalize to 0-1
  return score + (citation.isPrimary ? 1.0 : 0.5) * weight;
}, 0);
```

---

## Changelog

### v2.0.0 (Enhanced Version)
- ✅ Added comprehensive environment variable validation
- ✅ Implemented IDN/Punycode domain support  
- ✅ Enhanced URL extraction with robust fallback logic
- ✅ Added structured error handling with proper HTTP status codes
- ✅ Implemented detailed logging and performance monitoring
- ✅ Added comprehensive test coverage (100+ test cases)
- ✅ Enhanced response normalization with validation
- ✅ Added performance headers and monitoring
- ✅ Maintained full backward compatibility

### v1.0.0 (Original Version)
- Basic OPR API integration
- Simple domain validation
- Basic error handling
- 24-hour caching

---

This enhanced OPR API integration now provides production-ready resilience, comprehensive error handling, and extensive compatibility support for the XenlixAI platform's Citation Extraction System.