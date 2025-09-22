import { NextRequest, NextResponse } from 'next/server';

// Cache responses for 6 hours
export const revalidate = 60 * 60 * 6;

// Simple in-memory cache for fallback data
const cache = new Map<string, { data: PSIResponse; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Clean up old cache entries
function cleanupCache() {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }
}

// Get cached data if available
function getCachedData(url: string): PSIResponse | null {
  cleanupCache();
  const cached = cache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { ...cached.data, updatedAt: cached.data.updatedAt + ' (cached)' };
  }
  return null;
}

// Store data in cache
function setCachedData(url: string, data: PSIResponse) {
  cache.set(url, { data, timestamp: Date.now() });
}

// Request validation
interface PSIRequest {
  url: string;
}

// Response types
interface PSIMetrics {
  score: number;
  lcpMs: number | null;
  inpMs: number | null;
  cls: number | null;
  tbtMs: number | null;
  fcpMs: number | null;
  speedIndexMs: number | null;
  opportunities: Array<{
    id: string;
    title: string;
    savingsMs: number;
  }>;
}

interface PSIResponse {
  url: string;
  updatedAt: string;
  mobile: PSIMetrics;
  desktop: PSIMetrics;
}

// Validate URL format
function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

// Extract metrics from PSI audit data
function extractMetrics(data: any): PSIMetrics {
  const audits = data?.lighthouseResult?.audits || {};
  const categories = data?.lighthouseResult?.categories || {};
  const performanceCategory = categories.performance || {};

  // Core Web Vitals and performance metrics
  const score = Math.round((performanceCategory.score || 0) * 100);
  
  // LCP (Largest Contentful Paint)
  const lcpAudit = audits['largest-contentful-paint'];
  const lcpMs = lcpAudit?.numericValue ? Math.round(lcpAudit.numericValue) : null;

  // INP (Interaction to Next Paint) - try multiple audit keys
  const inpAudit = audits['interaction-to-next-paint'] || audits['experimental-interaction-to-next-paint'];
  const inpMs = inpAudit?.numericValue ? Math.round(inpAudit.numericValue) : null;

  // CLS (Cumulative Layout Shift)
  const clsAudit = audits['cumulative-layout-shift'];
  const cls = clsAudit?.numericValue !== undefined ? Math.round(clsAudit.numericValue * 1000) / 1000 : null;

  // TBT (Total Blocking Time)
  const tbtAudit = audits['total-blocking-time'];
  const tbtMs = tbtAudit?.numericValue ? Math.round(tbtAudit.numericValue) : null;

  // FCP (First Contentful Paint)
  const fcpAudit = audits['first-contentful-paint'];
  const fcpMs = fcpAudit?.numericValue ? Math.round(fcpAudit.numericValue) : null;

  // Speed Index
  const speedIndexAudit = audits['speed-index'];
  const speedIndexMs = speedIndexAudit?.numericValue ? Math.round(speedIndexAudit.numericValue) : null;

  // Extract opportunities (load-opportunities group)
  const opportunities: Array<{ id: string; title: string; savingsMs: number }> = [];
  
  if (performanceCategory.auditRefs) {
    performanceCategory.auditRefs
      .filter((ref: any) => ref.group === 'load-opportunities')
      .forEach((ref: any) => {
        const audit = audits[ref.id];
        if (audit && audit.details?.overallSavingsMs) {
          opportunities.push({
            id: ref.id,
            title: audit.title || ref.id,
            savingsMs: Math.round(audit.details.overallSavingsMs),
          });
        }
      });
  }

  // Sort opportunities by savings (highest first) and take top results
  opportunities.sort((a, b) => b.savingsMs - a.savingsMs);

  return {
    score,
    lcpMs,
    inpMs,
    cls,
    tbtMs,
    fcpMs,
    speedIndexMs,
    opportunities: opportunities.slice(0, 5), // Top 5 opportunities
  };
}

export async function POST(request: NextRequest) {
  try {
    // Check API key
    const apiKey = process.env.PSI_API_KEY;
    if (!apiKey) {
      console.error('PSI_API_KEY not configured');
      return NextResponse.json(
        { error: 'PageSpeed Insights API not configured' },
        { status: 500 }
      );
    }

    // Parse and validate request
    const body: PSIRequest = await request.json();
    
    if (!body.url || typeof body.url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required and must be a string' },
        { status: 400 }
      );
    }

    // Ensure URL has protocol
    const testUrl = body.url.startsWith('http') ? body.url : `https://${body.url}`;
    
    if (!isValidUrl(testUrl)) {
      return NextResponse.json(
        { error: 'Invalid URL format. Must be a valid http/https URL.' },
        { status: 400 }
      );
    }

    const encodedUrl = encodeURIComponent(testUrl);

    console.log(`Fetching PSI data for: ${testUrl}`);

    // Build API URLs for mobile and desktop
    const baseUrl = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
    const mobileUrl = `${baseUrl}?url=${encodedUrl}&strategy=mobile&category=performance&key=${apiKey}`;
    const desktopUrl = `${baseUrl}?url=${encodedUrl}&strategy=desktop&category=performance&key=${apiKey}`;

    // Try to get data from cache first (for fallback)
    const cachedData = getCachedData(testUrl);

    // Fetch both mobile and desktop data in parallel with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const [mobileResponse, desktopResponse] = await Promise.all([
        fetch(mobileUrl, {
          signal: controller.signal,
          next: { revalidate: 60 * 60 * 6 }, // 6h cache
        }),
        fetch(desktopUrl, {
          signal: controller.signal,
          next: { revalidate: 60 * 60 * 6 }, // 6h cache
        }),
      ]);

      clearTimeout(timeoutId);

      // Handle mobile response
      if (!mobileResponse.ok) {
        const errorBody = await mobileResponse.text().catch(() => 'Unknown error');
        console.error(`PSI Mobile API error ${mobileResponse.status}:`, errorBody.slice(0, 400));
        
        // Try to serve cached data if available
        if (cachedData) {
          console.log('Serving cached data due to API error');
          return NextResponse.json(cachedData, {
            headers: {
              'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800', // 1h cache for fallback
              'X-Data-Source': 'cache-fallback',
            },
          });
        }
        
        // Provide specific error messages based on status
        let errorMessage = 'Google PageSpeed Insights service error';
        if (mobileResponse.status === 429) {
          errorMessage = 'API rate limit exceeded. Please try again in a few minutes.';
        } else if (mobileResponse.status === 403) {
          errorMessage = 'API key invalid or quota exceeded.';
        } else if (mobileResponse.status >= 500) {
          errorMessage = 'Google PageSpeed Insights service is temporarily unavailable.';
        }
        
        return NextResponse.json(
          {
            error: errorMessage,
            code: 'upstream_error',
            status: mobileResponse.status,
            details: errorBody.slice(0, 200),
          },
          { status: 502 }
        );
      }

      // Handle desktop response
      if (!desktopResponse.ok) {
        const errorBody = await desktopResponse.text().catch(() => 'Unknown error');
        console.error(`PSI Desktop API error ${desktopResponse.status}:`, errorBody.slice(0, 400));
        
        // Try to serve cached data if available
        if (cachedData) {
          console.log('Serving cached data due to API error');
          return NextResponse.json(cachedData, {
            headers: {
              'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800', // 1h cache for fallback
              'X-Data-Source': 'cache-fallback',
            },
          });
        }
        
        // Provide specific error messages based on status
        let errorMessage = 'Google PageSpeed Insights service error';
        if (desktopResponse.status === 429) {
          errorMessage = 'API rate limit exceeded. Please try again in a few minutes.';
        } else if (desktopResponse.status === 403) {
          errorMessage = 'API key invalid or quota exceeded.';
        } else if (desktopResponse.status >= 500) {
          errorMessage = 'Google PageSpeed Insights service is temporarily unavailable.';
        }
        
        return NextResponse.json(
          {
            error: errorMessage,
            code: 'upstream_error',
            status: desktopResponse.status,
            details: errorBody.slice(0, 200),
          },
          { status: 502 }
        );
      }

      // Parse responses
      const mobileData = await mobileResponse.json();
      const desktopData = await desktopResponse.json();

      // Extract metrics
      const mobileMetrics = extractMetrics(mobileData);
      const desktopMetrics = extractMetrics(desktopData);

      const response: PSIResponse = {
        url: testUrl,
        updatedAt: new Date().toISOString(),
        mobile: mobileMetrics,
        desktop: desktopMetrics,
      };

      // Store successful response in cache for future fallback
      setCachedData(testUrl, response);

      console.log(`PSI data fetched successfully: Mobile ${mobileMetrics.score}/100, Desktop ${desktopMetrics.score}/100`);

      return NextResponse.json(response, {
        headers: {
          'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=10800', // 6h cache, 3h stale
          'X-Data-Source': 'live',
        },
      });

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('PSI API request timeout');
        
        // Try to serve cached data if available
        const cachedFallback = getCachedData(testUrl);
        if (cachedFallback) {
          console.log('Serving cached data due to timeout');
          return NextResponse.json(cachedFallback, {
            headers: {
              'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=900', // 30min cache for fallback
              'X-Data-Source': 'cache-timeout-fallback',
            },
          });
        }
        
        return NextResponse.json(
          { error: 'PageSpeed analysis timed out. The URL may be slow to respond. Please try again.' },
          { status: 408 }
        );
      }
      
      throw fetchError; // Re-throw to be caught by outer catch
    }

  } catch (error) {
    console.error('PSI API error:', error);
    
    // Try to serve cached data as last resort
    try {
      const body: PSIRequest = await request.json();
      const testUrl = body.url?.startsWith('http') ? body.url : `https://${body.url}`;
      const cachedFallback = getCachedData(testUrl);
      
      if (cachedFallback) {
        console.log('Serving cached data due to internal error');
        return NextResponse.json(cachedFallback, {
          headers: {
            'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=900',
            'X-Data-Source': 'cache-error-fallback',
          },
        });
      }
    } catch (fallbackError) {
      console.error('Failed to serve cached fallback:', fallbackError);
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Reject other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405 }
  );
}