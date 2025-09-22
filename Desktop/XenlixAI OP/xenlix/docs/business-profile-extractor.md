# Business Profile Extractor

## Overview

The `getBusinessProfileFromUrl` function is a comprehensive server-side utility that extracts publicly available business information from any website URL. It combines direct website scraping with Google search to provide accurate business profile data for AEO audit tools.

## Function Signature

```typescript
async function getBusinessProfileFromUrl(url: string): Promise<BusinessProfile>
```

## Return Type

```typescript
interface BusinessProfile {
  businessName: string | null;
  address: string | null;
  phone: string | null;
  googleReviewCount: number | null;
  googleRating: number | null;
  logoUrl: string | null;
  socialProfiles: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    youtube?: string;
  };
}
```

## How It Works

### 1. Website Scraping
- **JSON-LD Schema**: Extracts structured data from `<script type="application/ld+json">` tags
- **HTML Elements**: Fallback extraction from H1 tags, title tags, and footer content
- **Logo Detection**: Searches for logo images using multiple selectors
- **Social Links**: Finds social media profile links throughout the page

### 2. Google Business Profile Search
- **Domain Extraction**: Cleanly extracts domain from provided URL
- **Google Search**: Performs targeted search to find Google Business Profile
- **Review Data**: Extracts Google review count and average rating
- **Business Info**: Gets official business name, address, and phone from Google

### 3. Data Synthesis
- **Prioritization**: Google Business Profile data takes precedence for accuracy
- **Fallbacks**: Website data fills gaps where Google data is unavailable
- **Null Handling**: Returns `null` for any fields that cannot be found

## Usage Examples

### Basic Usage

```typescript
import { getBusinessProfileFromUrl } from '@/lib/business-profile-extractor';

// Extract business profile
const profile = await getBusinessProfileFromUrl('https://example.com');

console.log(profile.businessName); // "Example Business Inc."
console.log(profile.googleRating); // 4.5
console.log(profile.googleReviewCount); // 127
```

### In API Route (Next.js)

```typescript
// /api/aeo-scan/route.ts
import { getBusinessProfileFromUrl } from '@/lib/business-profile-extractor';

export async function POST(request: NextRequest) {
  const { websiteUrl } = await request.json();
  
  // Extract business profile automatically
  const businessProfile = await getBusinessProfileFromUrl(websiteUrl);
  
  // Use extracted data for audit
  const auditData = {
    businessName: businessProfile.businessName || 'Unknown Business',
    phone: businessProfile.phone,
    address: businessProfile.address,
    // ... rest of audit logic
  };
  
  return NextResponse.json({ businessProfile, auditData });
}
```

### Error Handling

```typescript
try {
  const profile = await getBusinessProfileFromUrl(invalidUrl);
  // Handle successful extraction
} catch (error) {
  console.error('Extraction failed:', error);
  // Function returns null values on error, doesn't throw
}
```

## Data Sources

### Website Scraping Targets
- **JSON-LD Schema**: Organization, LocalBusiness, Corporation schemas
- **HTML Elements**: H1 tags, title tags, footer content
- **Logo Images**: `img[alt*="logo"]`, `.logo img`, `#logo img`
- **Social Links**: Facebook, Twitter/X, LinkedIn, Instagram, YouTube

### Google Search Extraction
- **Business Name**: Official business name from Google Business Profile
- **Address**: Complete business address
- **Phone**: Business phone number
- **Reviews**: Total review count and average rating
- **Verification**: Cross-references with website domain

## Technical Requirements

### Dependencies
```bash
pnpm add cheerio puppeteer
```

### Environment
- **Runtime**: Node.js (server-side only)
- **Browser**: Puppeteer for Google search automation
- **Memory**: ~50MB per extraction (browser overhead)
- **Time**: 3-8 seconds average extraction time

## Performance Considerations

### Speed Optimization
- **Parallel Processing**: Website scraping and Google search run concurrently
- **Browser Reuse**: Consider implementing browser pooling for high volume
- **Caching**: Cache results by domain to avoid repeated extractions
- **Timeouts**: Built-in 10-second timeout for unresponsive sites

### Rate Limiting
- **Google Search**: Implement delays between searches to avoid blocking
- **Website Requests**: Respect robots.txt and implement proper user agents
- **Concurrent Limits**: Limit concurrent extractions to prevent resource exhaustion

## Example Output

```json
{
  "businessName": "Acme Digital Marketing Agency",
  "address": "123 Main Street, Suite 100, San Francisco, CA 94102",
  "phone": "(415) 555-0123",
  "googleReviewCount": 127,
  "googleRating": 4.8,
  "logoUrl": "https://example.com/logo.png",
  "socialProfiles": {
    "facebook": "https://facebook.com/acmedigital",
    "linkedin": "https://linkedin.com/company/acme-digital",
    "twitter": "https://twitter.com/acmedigital",
    "instagram": "https://instagram.com/acmedigital"
  }
}
```

## Error Scenarios

The function gracefully handles various error conditions:

- **Invalid URLs**: Returns null values for all fields
- **Network Timeouts**: Returns partial data where available
- **Protected Sites**: Falls back to basic HTML scraping
- **No Google Presence**: Returns website data only
- **Rate Limiting**: Implements retry logic with exponential backoff

## Security Notes

- **User Agent**: Uses legitimate browser user agent strings
- **Respect Robots**: Should be enhanced to respect robots.txt files
- **No Authentication**: Only accesses publicly available information
- **Data Privacy**: Does not extract personal or sensitive information

## Future Enhancements

- **Yelp Integration**: Add Yelp review data extraction
- **Social Media APIs**: Use official APIs for social profile verification
- **Caching Layer**: Implement Redis caching for repeated requests
- **Batch Processing**: Support multiple URL extractions in parallel
- **Webhook Support**: Real-time updates when business information changes