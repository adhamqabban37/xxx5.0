'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

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

// Default configuration
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
 * Hook to generate normalized canonical URL for current page
 */
export function useCanonicalUrl(config: CanonicalConfig = {}): string {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  return useMemo(() => {
    return normalizeCanonicalUrl(pathname, searchParams, mergedConfig);
  }, [pathname, searchParams, mergedConfig]);
}

/**
 * Normalize a URL to create proper canonical URL
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

  // Add normalized path
  canonicalUrl += normalizedPath;

  // Handle search parameters
  if (searchParams && preserveParams && preserveParams.length > 0) {
    const preservedParams = new URLSearchParams();
    
    // Only preserve specified parameters, skip tracking parameters
    for (const [key, value] of searchParams.entries()) {
      if (preserveParams.includes(key) && !TRACKING_PARAMETERS.includes(key)) {
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
 * Client-side canonical URL generation for components
 */
export function generateCanonicalUrlClient(
  pathname: string,
  searchParams?: { [key: string]: string | string[] | undefined },
  config: CanonicalConfig = DEFAULT_CONFIG
): string {
  // Convert searchParams object to URLSearchParams
  const urlSearchParams = new URLSearchParams();
  
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
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
 * Component to inject canonical link tag
 */
interface CanonicalLinkProps {
  href?: string;
  config?: CanonicalConfig;
}

export function CanonicalLink({ href, config }: CanonicalLinkProps) {
  const automaticCanonical = useCanonicalUrl(config);
  const canonicalUrl = href || automaticCanonical;

  return (
    <link 
      rel="canonical" 
      href={canonicalUrl}
      key="canonical"
    />
  );
}

/**
 * Utility to check if current URL has tracking parameters
 */
export function hasTrackingParameters(searchParams: URLSearchParams | null): boolean {
  if (!searchParams) return false;
  
  for (const param of TRACKING_PARAMETERS) {
    if (searchParams.has(param)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get clean URL without tracking parameters (for display purposes)
 */
export function getCleanUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    
    // Remove tracking parameters
    for (const param of TRACKING_PARAMETERS) {
      urlObj.searchParams.delete(param);
    }
    
    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * Determine if current page should be noindexed based on path and parameters
 */
export function shouldNoindex(pathname: string, searchParams: URLSearchParams | null): boolean {
  // Always noindex patterns - updated for new path-based result URLs
  const alwaysNoindexPatterns = [
    '/dashboard',
    '/analytics',
    '/aeo/results/', // Path-based results pages (dynamic IDs)
    '/seo/results/', // Path-based results pages (dynamic IDs)
    '/checkout',
    '/signin',
    '/signup',
    '/onboarding'
  ];

  // Check if path matches noindex patterns
  for (const pattern of alwaysNoindexPatterns) {
    if (pattern.endsWith('/**')) {
      const basePath = pattern.slice(0, -3);
      if (pathname.startsWith(basePath)) return true;
    } else if (pattern.endsWith('/')) {
      // For path-based patterns, check if pathname starts with pattern
      if (pathname.startsWith(pattern)) return true;
    } else if (pathname === pattern || pathname.startsWith(pattern + '/')) {
      return true;
    }
  }

  // For homepage and tool pages, allow indexing even with tracking parameters
  if (pathname === '/' || pathname.startsWith('/tools/') || pathname.startsWith('/calculators/')) {
    return false;
  }

  // Check for tracking parameters
  if (searchParams && hasTrackingParameters(searchParams)) {
    // Allow indexing of city pages even with tracking params
    if (pathname.match(/^\/[a-z-]+$/) && pathname !== '/signin' && pathname !== '/signup') {
      return false;
    }
    return true;
  }

  return false;
}