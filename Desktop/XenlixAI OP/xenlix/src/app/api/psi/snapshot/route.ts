/**
 * PSI Snapshot API with timeout for free tier
 * Bounded 2.5-3s timeout, cached results
 */

import { NextRequest, NextResponse } from 'next/server';
import NodeCache from 'node-cache';

// Environment configuration
const FREE_PSI_SNAPSHOT_ENABLED = process.env.FREE_PSI_SNAPSHOT_ENABLED === '1';
const PSI_API_KEY = process.env.PSI_API_KEY || process.env.GOOGLE_PAGESPEED_API_KEY;
const PSI_CACHE_TTL_HOURS = 24; // Cache PSI results for 24 hours

// Cache for PSI results
const psiCache = new NodeCache({
  stdTTL: PSI_CACHE_TTL_HOURS * 3600,
  checkperiod: 600,
  useClones: false,
});

// Rate limiting for PSI calls
const psiRateLimits = new Map<string, { count: number; resetTime: number }>();
const PSI_RATE_LIMIT_PER_HOUR = 5; // Conservative limit for free tier
const PSI_RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

interface PSISnapshot {
  performance?: number;
  accessibility?: number;
  bestPractices?: number;
  seo?: number;
  lcp?: number;
  fid?: number;
  cls?: number;
  cached: boolean;
  timestamp: number;
}

function getClientId(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
  return ip;
}

function checkPSIRateLimit(clientId: string): boolean {
  const now = Date.now();
  const limit = psiRateLimits.get(clientId);

  if (!limit || now > limit.resetTime) {
    psiRateLimits.set(clientId, {
      count: 1,
      resetTime: now + PSI_RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (limit.count >= PSI_RATE_LIMIT_PER_HOUR) {
    return false;
  }

  limit.count++;
  return true;
}

function getCacheKey(url: string): string {
  return `psi_${Buffer.from(url.toLowerCase().trim()).toString('base64')}`;
}

async function fetchPSIWithTimeout(
  url: string,
  timeoutMs: number = 2500
): Promise<PSISnapshot | null> {
  if (!PSI_API_KEY || PSI_API_KEY === 'YOUR_KEY_HERE' || PSI_API_KEY.includes('your-')) {
    console.log('PSI API key not configured, skipping PSI snapshot');
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Use mobile strategy and only essential fields for speed
    const psiUrl = new URL('https://www.googleapis.com/pagespeed/v5/runPagespeed');
    psiUrl.searchParams.set('url', url);
    psiUrl.searchParams.set('key', PSI_API_KEY);
    psiUrl.searchParams.set('strategy', 'mobile');
    psiUrl.searchParams.set('category', 'PERFORMANCE');
    psiUrl.searchParams.set('category', 'ACCESSIBILITY');
    psiUrl.searchParams.set('category', 'BEST_PRACTICES');
    psiUrl.searchParams.set('category', 'SEO');

    const response = await fetch(psiUrl.toString(), {
      signal: controller.signal,
      headers: {
        'User-Agent': 'XenlixAI-PSI/1.0',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`PSI API error: ${response.status}`);
    }

    const data = await response.json();
    const categories = data.lighthouseResult?.categories || {};
    const audits = data.lighthouseResult?.audits || {};

    return {
      performance: categories.performance
        ? Math.round(categories.performance.score * 100)
        : undefined,
      accessibility: categories.accessibility
        ? Math.round(categories.accessibility.score * 100)
        : undefined,
      bestPractices: categories['best-practices']
        ? Math.round(categories['best-practices'].score * 100)
        : undefined,
      seo: categories.seo ? Math.round(categories.seo.score * 100) : undefined,
      lcp: audits['largest-contentful-paint']?.numericValue
        ? Math.round((audits['largest-contentful-paint'].numericValue / 1000) * 100) / 100
        : undefined,
      fid: audits['max-potential-fid']?.numericValue
        ? Math.round(audits['max-potential-fid'].numericValue)
        : undefined,
      cls: audits['cumulative-layout-shift']?.numericValue
        ? Math.round(audits['cumulative-layout-shift'].numericValue * 1000) / 1000
        : undefined,
      cached: false,
      timestamp: Date.now(),
    };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      console.log(`PSI snapshot timeout for: ${url}`);
      return null;
    }
    console.error('PSI snapshot error:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Check if PSI snapshots are enabled
    if (!FREE_PSI_SNAPSHOT_ENABLED) {
      return NextResponse.json(
        {
          error: 'PSI snapshots disabled',
          success: false,
          enabled: false,
        },
        { status: 503 }
      );
    }

    const clientId = getClientId(request);

    // Check rate limiting
    if (!checkPSIRateLimit(clientId)) {
      return NextResponse.json(
        {
          error: 'PSI rate limit exceeded',
          message: `Free PSI snapshots allow ${PSI_RATE_LIMIT_PER_HOUR} requests per hour.`,
          success: false,
          retry_after: 3600,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { url } = body;

    if (!url?.trim()) {
      return NextResponse.json({ error: 'URL is required', success: false }, { status: 400 });
    }

    const normalizedUrl = url.trim();
    const cacheKey = getCacheKey(normalizedUrl);

    // Check cache first
    let result: PSISnapshot | null = psiCache.get(cacheKey) || null;
    if (result) {
      result.cached = true;
      console.log(`PSI cache hit for: ${normalizedUrl}`);
      return NextResponse.json({
        success: true,
        result,
        processing_time_ms: Date.now() - startTime,
      });
    }

    // Perform bounded PSI snapshot with timeout
    console.log(`Fetching PSI snapshot for: ${normalizedUrl}`);
    result = await fetchPSIWithTimeout(normalizedUrl, 2500);

    if (result) {
      // Cache the successful result
      psiCache.set(cacheKey, result);
      console.log(`PSI snapshot successful for: ${normalizedUrl}`);
    } else {
      console.log(`PSI snapshot failed/timeout for: ${normalizedUrl}`);
    }

    return NextResponse.json({
      success: !!result,
      result,
      processing_time_ms: Date.now() - startTime,
    });
  } catch (error) {
    console.error('PSI snapshot API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        success: false,
        processing_time_ms: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json(
      { error: 'URL parameter is required', success: false },
      { status: 400 }
    );
  }

  // Convert GET to POST format
  const mockRequest = new Request(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify({ url }),
  });

  return POST(mockRequest as NextRequest);
}
