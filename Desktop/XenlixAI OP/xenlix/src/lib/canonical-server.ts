/**
 * Server-side canonical URL utilities for metadata generation
 * These functions can be used in server components and generateMetadata
 */

interface CanonicalConfig {
  // Base domain for absolute URLs
  baseUrl?: string;
  // Parameters to preserve in canonical URL
  preserveParams?: string[];
  // Force HTTPS in canonical URLs
  forceHttps?: boolean;
  // Force lowercase paths
  forceLowercase?: boolean;
  // Remove trailing slash
  removeTrailingSlash?: boolean;
}

// Default configuration for server-side generation
const DEFAULT_CONFIG: CanonicalConfig = {
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://xenlix.ai',
  preserveParams: ['id', 'slug', 'category', 'type', 'template', 'page'],
  forceHttps: true,
  forceLowercase: true,
  removeTrailingSlash: true
};

// Tracking parameters to always strip from canonical URLs
const TRACKING_PARAMETERS = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'ref', 'source', 'campaign', 'gclid', 'fbclid', 'msclkid', 
  'referrer', 'affiliate', 'partner', 'from', 'via'
];

/**
 * Normalize a URL to create proper canonical URL (server-side)
 */
export function normalizeCanonicalUrl(
  pathname: string, 
  searchParams: URLSearchParams | null, 
  config: CanonicalConfig = DEFAULT_CONFIG
): string {
  const { baseUrl, preserveParams, forceHttps, forceLowercase, removeTrailingSlash } = config;

  // Start with base URL
  let canonicalUrl = baseUrl || 'https://xenlix.ai';
  
  // Ensure HTTPS if configured
  if (forceHttps && canonicalUrl.startsWith('http://')) {
    canonicalUrl = canonicalUrl.replace('http://', 'https://');
  }

  // Normalize pathname
  let normalizedPath = pathname;
  
  // Force lowercase if configured
  if (forceLowercase) {
    normalizedPath = normalizedPath.toLowerCase();
  }
  
  // Remove trailing slash if configured (except for root)
  if (removeTrailingSlash && normalizedPath !== '/' && normalizedPath.endsWith('/')) {
    normalizedPath = normalizedPath.slice(0, -1);
  }

  // Ensure path starts with /
  if (!normalizedPath.startsWith('/')) {
    normalizedPath = '/' + normalizedPath;
  }

  // Append normalized path
  canonicalUrl += normalizedPath;

  // Handle query parameters
  if (searchParams && preserveParams && preserveParams.length > 0) {
    const preservedParams = new URLSearchParams();
    
    // Only preserve specified parameters and exclude tracking parameters
    for (const [key, value] of searchParams.entries()) {
      if (
        preserveParams.includes(key) && 
        !TRACKING_PARAMETERS.includes(key.toLowerCase()) &&
        value.trim() !== ''
      ) {
        preservedParams.set(key, value);
      }
    }

    // Add preserved parameters to canonical URL
    const paramString = preservedParams.toString();
    if (paramString) {
      canonicalUrl += '?' + paramString;
    }
  }

  return canonicalUrl;
}

/**
 * Server-side canonical URL generation for metadata
 */
export async function generateCanonicalUrl(
  pathname: string,
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined },
  config: CanonicalConfig = DEFAULT_CONFIG
): Promise<string> {
  // Await searchParams if it's a Promise (Next.js 15+)
  const resolvedSearchParams = searchParams instanceof Promise ? await searchParams : searchParams;
  
  // Convert searchParams object to URLSearchParams
  const urlSearchParams = new URLSearchParams();
  
  if (resolvedSearchParams) {
    for (const [key, value] of Object.entries(resolvedSearchParams)) {
      if (typeof value === 'string') {
        urlSearchParams.set(key, value);
      } else if (Array.isArray(value)) {
        urlSearchParams.set(key, value[0] || '');
      }
    }
  }

  return normalizeCanonicalUrl(pathname, urlSearchParams, config);
}

/**
 * Check if URL has tracking parameters (server-side)
 */
export function hasTrackingParameters(searchParams: URLSearchParams | null): boolean {
  if (!searchParams) return false;
  
  for (const [key] of searchParams.entries()) {
    if (TRACKING_PARAMETERS.includes(key.toLowerCase())) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get clean URL without tracking parameters (server-side)
 */
export function getCleanUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const cleanParams = new URLSearchParams();
    
    // Remove tracking parameters
    for (const [key, value] of urlObj.searchParams.entries()) {
      if (!TRACKING_PARAMETERS.includes(key.toLowerCase())) {
        cleanParams.set(key, value);
      }
    }
    
    // Rebuild URL
    urlObj.search = cleanParams.toString();
    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * Determine if a page should be noindexed based on URL patterns (server-side)
 */
export async function shouldNoindex(
  pathname: string,
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined }
): Promise<boolean> {
  // Await searchParams if it's a Promise (Next.js 15+)
  const resolvedSearchParams = searchParams instanceof Promise ? await searchParams : searchParams;
  
  // Convert searchParams to URLSearchParams for consistency
  const urlSearchParams = new URLSearchParams();
  if (resolvedSearchParams) {
    for (const [key, value] of Object.entries(resolvedSearchParams)) {
      if (typeof value === 'string') {
        urlSearchParams.set(key, value);
      } else if (Array.isArray(value)) {
        urlSearchParams.set(key, value[0] || '');
      }
    }
  }

  // Noindex patterns
  const noindexPatterns = [
    '/admin',
    '/api',
    '/auth',
    '/dashboard',
    '/private',
    '/internal',
    '/test',
    '/dev',
    '/staging'
  ];

  // Check if pathname matches any noindex pattern
  const shouldNoindexPath = noindexPatterns.some(pattern => 
    pathname.startsWith(pattern)
  );

  // Check for problematic query parameters
  const hasProblematicParams = urlSearchParams && (
    hasTrackingParameters(urlSearchParams) ||
    urlSearchParams.has('debug') ||
    urlSearchParams.has('test') ||
    urlSearchParams.has('preview') ||
    urlSearchParams.has('draft')
  );

  return shouldNoindexPath || hasProblematicParams;
}

export default {
  normalizeCanonicalUrl,
  generateCanonicalUrl,
  hasTrackingParameters,
  getCleanUrl,
  shouldNoindex
};