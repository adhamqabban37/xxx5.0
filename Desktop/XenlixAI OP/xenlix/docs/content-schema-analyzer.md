# Content Schema Analyzer

The `generateSchema` function automatically analyzes crawled HTML content and generates appropriate JSON-LD schema markup for either FAQPage or Article types.

## Overview

This function is designed to be used as part of the `/api/analyze-content` Next.js API route. It accepts a Cheerio object (loaded with HTML) and a Compromise.js NLP object, then intelligently determines whether the content is best suited for FAQPage or Article schema.

## Priority Logic

1. **FAQPage Detection (Priority 1)**: Scans for question-answer patterns
2. **Article Schema (Fallback)**: If insufficient Q&A pairs are found

## Function Signature

```typescript
async function generateSchema(
  $: CheerioAPI,
  nlp: any
): Promise<FAQPageSchema | ArticleSchema | null>
```

### Parameters

- `$` (CheerioAPI): Cheerio object loaded with the target page's HTML
- `nlp` (any): Compromise NLP object for text analysis

### Return Value

- Returns a complete JSON-LD schema object (FAQPage or Article)
- Returns `null` if neither schema type can be confidently determined

## FAQPage Detection Algorithm

### 1. Heading Analysis
- Iterates through all `<h2>` and `<h3>` tags
- Checks if heading text looks like a question using:
  - Direct question marks (`?`)
  - Question word starters (`what`, `how`, `why`, etc.)
  - NLP-based interrogative sentence detection

### 2. Answer Detection
- For each question heading, looks for the immediately following element
- Accepts `<p>`, `<div>`, `<ul>`, or `<ol>` as answer containers
- Validates answer length (20-1000 characters)

### 3. FAQ Section Detection
- Searches for explicit FAQ sections using selectors:
  - `[class*="faq"]`
  - `[id*="faq"]`
  - `.questions`
  - `.q-a`

### 4. Quality Thresholds
- Requires minimum 2 valid question-answer pairs
- Removes duplicate questions using 80% similarity threshold
- Cleans text content for consistency

## Article Schema Fallback

### Required Elements
- **Headline**: Extracted from `<h1>` tag (minimum 10 characters)

### Optional Elements
- **Author**: Searches for:
  - Elements with classes: `.author-name`, `.author`, `.byline`, `[rel="author"]`
  - Text patterns: "By [Author Name]"
  
- **Date Published**: Searches for:
  - `<time datetime="">` elements
  - Meta tags: `article:published_time`, `date`, `publish-date`
  - Date patterns in text (YYYY-MM-DD, MM/DD/YYYY, Month DD, YYYY)

- **Description**: Uses:
  - Meta description (priority)
  - First paragraph (50-300 characters)

## Example Output

### FAQPage Schema

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is AEO?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "AEO stands for AI Engine Optimization. It is the process of optimizing web content to be found and favored by AI-powered search engines."
      }
    },
    {
      "@type": "Question",
      "name": "How is AEO different from SEO?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "While related, AEO focuses more on conversational queries, structured data, and demonstrating expertise for AI summarization."
      }
    }
  ]
}
```

### Article Schema

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "The Future of AI in Content Marketing",
  "author": {
    "@type": "Person",
    "name": "Sarah Johnson"
  },
  "datePublished": "2025-09-20",
  "description": "Explore how AI is transforming content marketing strategies and tools."
}
```

## Integration with API Route

The function is integrated into the existing `/api/analyze-content` route and adds a `schema` property to the response:

```typescript
// Response includes:
{
  // ... existing analysis properties
  schema: {
    type: 'FAQPage' | 'Article' | null,
    data: {
      "@context": "https://schema.org",
      "@type": "FAQPage" | "Article",
      // ... schema properties
    }
  }
}
```

## Usage Examples

### Basic Usage

```typescript
import * as cheerio from 'cheerio';
import nlp from 'compromise';
import { generateSchema } from '@/lib/content-schema-analyzer';

const html = '<html>...</html>';
const $ = cheerio.load(html);
const schema = await generateSchema($, nlp);

if (schema) {
  console.log('Generated schema:', schema);
  // Use schema for SEO injection, validation, etc.
}
```

### API Route Integration

```typescript
// In /api/analyze-content/route.ts
const schema = await generateSchema($, nlp);
const result = {
  // ... other analysis results
  schema: schema ? {
    type: schema['@type'],
    data: schema
  } : null
};
```

## Performance Considerations

- **Async Operation**: Function is asynchronous for potential future enhancements
- **Error Handling**: Wrapped in try-catch with graceful fallbacks
- **Memory Efficient**: Processes content in chunks, removes duplicates
- **NLP Fallbacks**: Uses simple heuristics if NLP processing fails

## Quality Assurance

### FAQ Detection Quality Checks
- Question length validation (minimum 10 characters)
- Answer length validation (20-1000 characters)
- Similarity-based duplicate removal
- Text cleaning and normalization

### Article Detection Quality Checks
- Headline requirement (minimum 10 characters)
- Author name validation (maximum 100 characters)
- Date format standardization
- Description length validation (20+ characters)

## Error Handling

- Returns `null` for invalid or insufficient content
- Logs errors for debugging while maintaining API stability
- Graceful degradation when NLP processing fails
- Fallback text processing methods

## Future Enhancements

- Support for additional schema types (Recipe, HowTo, Product)
- Machine learning-based content classification
- Multi-language support
- Custom schema template system
- Enhanced entity extraction for richer schemas

## Dependencies

- **cheerio**: HTML parsing and DOM manipulation
- **compromise**: Natural language processing
- **TypeScript**: Type safety and better development experience

## Testing

Use the provided examples in `/lib/schema-examples.ts` to test various scenarios:

```typescript
import { examples } from '@/lib/schema-examples';

// Test FAQ detection
await examples.faq();

// Test Article detection  
await examples.article();

// Test edge cases
await examples.edgeCases();
```