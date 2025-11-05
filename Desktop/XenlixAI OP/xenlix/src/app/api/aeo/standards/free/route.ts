/**
 * FREE AEO Standards API
 * Returns only 4 keys + partial scores (no evidence)
 * Optimized for <10KB payload size with <50ms evaluation
 */

import { NextRequest, NextResponse } from 'next/server';
import { evaluateRules, validatePageData } from '@/lib/evaluateRules';
import NodeCache from 'node-cache';

// Performance cache: 5 minutes TTL for evaluation results
const evaluationCache = new NodeCache({
  stdTTL: 300, // 5 minutes
  checkperiod: 60, // check expired keys every 60 seconds
  useClones: false, // better performance
});

// Rate limiting for free tier
const freeRequestLimits = new Map<string, { count: number; resetTime: number }>();
const FREE_RATE_LIMIT = 10; // requests per hour
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const clientLimit = freeRequestLimits.get(clientId);

  if (!clientLimit || now > clientLimit.resetTime) {
    // Reset or create new limit
    freeRequestLimits.set(clientId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (clientLimit.count >= FREE_RATE_LIMIT) {
    return false;
  }

  clientLimit.count++;
  return true;
}

function getClientId(request: NextRequest): string {
  // Use IP address as client identifier for free tier
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
  return ip;
}

function generateCacheKey(url: string): string {
  // Create deterministic cache key for URL
  return `aeo_free_${Buffer.from(url.toLowerCase().trim()).toString('base64')}`;
}

async function performOptimizedEvaluation(url: string) {
  const startTime = performance.now();

  try {
    // Generate mock data (in production this would fetch real data)
    const pageData = generateMockPageData(url);

    // Validate the data
    const validatedData = validatePageData(pageData);

    // Evaluate rules with performance monitoring
    const results = evaluateRules(validatedData, 'free');

    const evaluationTime = performance.now() - startTime;

    // Log performance warning if evaluation exceeds target
    if (evaluationTime > 50) {
      console.warn(`⚠️ AEO evaluation took ${evaluationTime.toFixed(2)}ms, exceeding 50ms target`);
    }

    return {
      ...results,
      evaluation_time_ms: evaluationTime,
      performance_target_met: evaluationTime <= 50,
    };
  } catch (error) {
    const evaluationTime = performance.now() - startTime;
    console.error(`❌ AEO evaluation failed after ${evaluationTime.toFixed(2)}ms:`, error);
    throw error;
  }
}

// Mock data generator for demo purposes
function generateMockPageData(url: string) {
  return {
    url,
    core_web_vitals: {
      lcp: Math.random() * 4 + 1, // 1-5 seconds
      fid: Math.random() * 200 + 50, // 50-250ms
      cls: Math.random() * 0.3, // 0-0.3
    },
    mobile: {
      friendly: Math.random() > 0.3,
    },
    security: {
      https: url.startsWith('https'),
    },
    structured_data: {
      types: Math.random() > 0.5 ? ['Organization', 'WebSite'] : ['WebSite'],
    },
    headings: {
      h1: Math.random() > 0.8 ? 0 : 1,
      hierarchy: Math.random() > 0.7 ? 'logical' : 'mixed',
    },
    meta: {
      description:
        Math.random() > 0.2
          ? 'A sample meta description that is around 130 characters long and describes the page content effectively.'
          : '',
    },
    content: {
      word_count: Math.floor(Math.random() * 1000) + 200,
      readability_score: Math.floor(Math.random() * 40) + 50,
      question_answers: Math.floor(Math.random() * 8),
      conversational_score: Math.floor(Math.random() * 50) + 40,
      long_tail_coverage: Math.floor(Math.random() * 60) + 30,
      intent_match_score: Math.floor(Math.random() * 50) + 50,
      published_date: new Date(
        Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
      ).toISOString(),
    },
    author: {
      info: Math.random() > 0.4,
    },
    links: {
      external_citations: Math.floor(Math.random() * 8),
    },
    site: {
      contact_page: Math.random() > 0.3,
      privacy_policy: Math.random() > 0.4,
    },
  };
}

export async function POST(request: NextRequest) {
  const requestStartTime = performance.now();

  try {
    const clientId = getClientId(request);

    // Check rate limiting
    if (!checkRateLimit(clientId)) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message:
            'Free tier allows 10 requests per hour. Upgrade to premium for unlimited access.',
          retry_after: 3600,
        },
        { status: 429 }
      );
    }

    const body = await request.json();

    if (!body.url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const { url } = body;
    const cacheKey = generateCacheKey(url);

    // Check cache first for performance
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let results: any = evaluationCache.get(cacheKey);
    let fromCache = false;

    if (!results) {
      // Perform fresh evaluation with performance monitoring
      results = await performOptimizedEvaluation(url);

      // Cache the results for future requests
      evaluationCache.set(cacheKey, results);
    } else {
      fromCache = true;
    }

    // Build optimized free response (ensure <10KB payload)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const freeResponse: any = {
      // Core scores (only 4 keys as per requirement)
      technical: Math.round(results.category_scores?.technical?.score || 75),
      content: Math.round(results.category_scores?.content?.score || 82),
      authority: Math.round(results.category_scores?.authority?.score || 68),
      user_intent: Math.round(results.category_scores?.user_intent?.score || 71),

      // Minimal metadata to stay under 10KB
      _metadata: {
        tier: 'free',
        cached: fromCache,
        evaluation_time_ms: fromCache ? 0 : results.evaluation_time_ms,
        total_request_time_ms: performance.now() - requestStartTime,
        performance_target_met: !fromCache ? results.performance_target_met : true,
        upgrade_available: true,
      },
    };

    // Check payload size to ensure <10KB requirement
    const responseSize = Buffer.from(JSON.stringify(freeResponse)).length;

    if (responseSize > 10240) {
      // 10KB = 10240 bytes
      console.warn(`⚠️ Free API response size: ${responseSize} bytes exceeds 10KB limit`);

      // Remove metadata if payload is too large
      delete freeResponse._metadata;
    } else {
      // Add payload size to metadata if there's room
      freeResponse._metadata.payload_size_bytes = responseSize;
    }

    // Optimized cache headers
    const response = NextResponse.json(freeResponse);
    response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    response.headers.set('X-Tier', 'free');
    response.headers.set(
      'X-Performance-Target',
      results.performance_target_met ? 'met' : 'exceeded'
    );
    response.headers.set('X-From-Cache', fromCache ? 'true' : 'false');

    return response;
  } catch (error) {
    console.error('Free AEO API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Unable to evaluate AEO standards. Please try again.',
        _metadata: {
          total_request_time_ms: performance.now() - requestStartTime,
        },
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  // Convert GET to POST format
  const mockRequest = new Request(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify({ url }),
  });

  return POST(mockRequest as NextRequest);
}
