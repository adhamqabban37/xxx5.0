// IndexNow utilities for automatic URL submission
// Used for triggering IndexNow submissions when content or schema changes

export interface IndexNowSubmissionResult {
  success: boolean;
  urlCount: number;
  error?: string;
  rateLimits?: {
    minute: { remaining: number };
    hour: { remaining: number };
    day: { remaining: number };
  };
}

export interface AutoSubmissionOptions {
  reason?: 'created' | 'updated' | 'deleted';
  priority?: 'high' | 'normal' | 'low';
  delay?: number; // Delay in milliseconds before submission
}

// Helper function to submit URLs to IndexNow API
export async function submitToIndexNow(
  urls: string | string[],
  options: AutoSubmissionOptions = {}
): Promise<IndexNowSubmissionResult> {
  const urlArray = Array.isArray(urls) ? urls : [urls];
  const { reason = 'updated', delay = 0 } = options;

  // Add delay if specified (useful for batch operations)
  if (delay > 0) {
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  try {
    const response = await fetch('/api/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        urls: urlArray,
        reason,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        urlCount: urlArray.length,
        rateLimits: data.rateLimits,
      };
    } else {
      return {
        success: false,
        urlCount: urlArray.length,
        error: data.error || 'Submission failed',
      };
    }
  } catch (error) {
    return {
      success: false,
      urlCount: urlArray.length,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// Auto-submit when content is created
export async function submitNewContent(url: string): Promise<IndexNowSubmissionResult> {
  return submitToIndexNow(url, { reason: 'created', priority: 'high' });
}

// Auto-submit when content is updated
export async function submitUpdatedContent(url: string): Promise<IndexNowSubmissionResult> {
  return submitToIndexNow(url, { reason: 'updated', priority: 'normal' });
}

// Auto-submit when content is deleted
export async function submitDeletedContent(url: string): Promise<IndexNowSubmissionResult> {
  return submitToIndexNow(url, { reason: 'deleted', priority: 'normal' });
}

// Batch submit multiple URLs with staggered timing to avoid rate limits
export async function submitBatchUrls(
  urls: string[],
  options: AutoSubmissionOptions = {}
): Promise<IndexNowSubmissionResult[]> {
  const { reason = 'updated', priority = 'normal' } = options;
  const results: IndexNowSubmissionResult[] = [];
  
  // Process in chunks of 100 URLs to respect IndexNow limits
  const chunkSize = 100;
  const chunks = [];
  
  for (let i = 0; i < urls.length; i += chunkSize) {
    chunks.push(urls.slice(i, i + chunkSize));
  }

  // Submit chunks with delays based on priority
  const delayMs = priority === 'high' ? 1000 : priority === 'normal' ? 2000 : 5000;
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const delay = i > 0 ? delayMs : 0; // No delay for first chunk
    
    const result = await submitToIndexNow(chunk, { reason, delay });
    results.push(result);
  }

  return results;
}

// Generate commonly updated URLs for quick submission
export function getCommonUrls(baseUrl: string = ''): string[] {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://www.xenlixai.com');
  
  return [
    `${base}/`, // Homepage
    `${base}/contact`, // Contact page
    `${base}/plans`, // Pricing page
    `${base}/case-studies`, // Case studies
    `${base}/dallas`, // Dallas location page
    `${base}/sitemap.xml`, // Sitemap
  ];
}

// Generate all important pages for full site submission
export function getAllSiteUrls(baseUrl: string = ''): string[] {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://www.xenlixai.com');
  
  return [
    // Core pages
    `${base}/`,
    `${base}/contact`,
    `${base}/plans`,
    `${base}/case-studies`,
    `${base}/dallas`,
    
    // Tool pages
    `${base}/calculators/roi`,
    `${base}/calculators/pricing`,
    `${base}/aeo`,
    `${base}/ai-website-builder`,
    `${base}/ai-seo-automation`,
    
    // Case studies
    `${base}/case-studies/auto-detailing-dallas`,
    `${base}/case-studies/consulting-firm-lead-generation`,
    `${base}/case-studies/dental-practice-ai-optimization`,
    `${base}/case-studies/restaurant-chain-expansion`,
    `${base}/case-studies/saas-blended-cac-reduction`,
    
    // SEO pages
    `${base}/vs-competitors`,
    `${base}/sitemap.xml`,
    `${base}/robots.txt`,
  ];
}

// Check if URL should trigger automatic submission
export function shouldAutoSubmit(url: string): boolean {
  // Don't auto-submit for admin, API, or private pages
  const excludePatterns = [
    '/api/',
    '/dashboard',
    '/signin',
    '/signup',
    '/onboarding',
    '/admin',
    '/private',
    '/_next/',
    '/.well-known/',
  ];

  return !excludePatterns.some(pattern => url.includes(pattern));
}

// Format URLs to absolute URLs for IndexNow
export function normalizeUrls(urls: string | string[], baseUrl?: string): string[] {
  const urlArray = Array.isArray(urls) ? urls : [urls];
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://www.xenlixai.com');
  
  return urlArray.map(url => {
    if (url.startsWith('http')) {
      return url; // Already absolute
    }
    if (url.startsWith('/')) {
      return `${base}${url}`; // Relative to root
    }
    return `${base}/${url}`; // Relative path
  });
}

// Log submission results for monitoring
export function logSubmissionResult(result: IndexNowSubmissionResult, urls: string[]): void {
  const logLevel = result.success ? 'info' : 'error';
  const message = result.success 
    ? `IndexNow: Successfully submitted ${result.urlCount} URLs`
    : `IndexNow: Failed to submit ${result.urlCount} URLs - ${result.error}`;
  
  console[logLevel](message, {
    urls: urls.slice(0, 3), // Log first 3 URLs
    urlCount: result.urlCount,
    rateLimits: result.rateLimits,
    timestamp: new Date().toISOString(),
  });
}