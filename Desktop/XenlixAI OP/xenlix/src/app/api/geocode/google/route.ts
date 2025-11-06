/**
 * Google Geocoding Proxy for Premium Dashboard
 * Server-side proxy with API key protection and caching
 */

import { NextRequest, NextResponse } from 'next/server';
import NodeCache from 'node-cache';

export const runtime = 'nodejs';

// Environment configuration
const GOOGLE_GEOCODING_API_KEY = process.env.GOOGLE_GEOCODING_API_KEY;
const PREMIUM_GEO_CACHE_TTL_HOURS = parseInt(process.env.PREMIUM_GEO_CACHE_TTL_HOURS || '168'); // 7 days
const PREMIUM_GEO_RATE_LIMIT_PER_MIN = parseInt(process.env.PREMIUM_GEO_RATE_LIMIT_PER_MIN || '1');

// Cache for geocoding results
const geocodeCache = new NodeCache({
  stdTTL: PREMIUM_GEO_CACHE_TTL_HOURS * 3600, // Convert hours to seconds
  checkperiod: 600, // Check for expired keys every 10 minutes
  useClones: false,
});

// Rate limiting storage
const rateLimits = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

interface GoogleResult {
  lat: number;
  lng: number;
  address?: string;
  source: 'google';
}

function getClientId(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
  return ip;
}

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const limit = rateLimits.get(clientId);

  if (!limit || now > limit.resetTime) {
    rateLimits.set(clientId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (limit.count >= PREMIUM_GEO_RATE_LIMIT_PER_MIN) {
    return false;
  }

  limit.count++;
  return true;
}

function getCacheKey(query: string): string {
  return `google_${Buffer.from(query.toLowerCase().trim()).toString('base64')}`;
}

async function geocodeWithGoogle(query: string): Promise<GoogleResult | null> {
  if (!GOOGLE_GEOCODING_API_KEY) {
    throw new Error('GOOGLE_API_NOT_CONFIGURED');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${GOOGLE_GEOCODING_API_KEY}`;

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('RATE_LIMITED');
      }
      throw new Error(`Google API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      if (data.status === 'OVER_QUERY_LIMIT') {
        throw new Error('RATE_LIMITED');
      }
      return null;
    }

    const result = data.results[0];
    const location = result.geometry.location;

    return {
      lat: location.lat,
      lng: location.lng,
      address: result.formatted_address,
      source: 'google',
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('ETIMEDOUT');
      }
      if (error.message === 'RATE_LIMITED' || error.message === 'GOOGLE_API_NOT_CONFIGURED') {
        throw error;
      }
      // Handle network errors
      if (
        error.message.includes('ENOTFOUND') ||
        error.message.includes('EAI_AGAIN') ||
        error.message.includes('ECONNREFUSED')
      ) {
        throw new Error('UNREACHABLE');
      }
    }

    throw error;
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query?.trim()) {
      return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
    }

    const clientId = getClientId(request);

    // Check rate limiting
    if (!checkRateLimit(clientId)) {
      return NextResponse.json(
        {
          error: 'Geocoding rate-limited/unreachable',
          message: `Too many requests. Limit: ${PREMIUM_GEO_RATE_LIMIT_PER_MIN} per minute.`,
        },
        { status: 429 }
      );
    }

    const normalizedQuery = query.trim();
    const cacheKey = getCacheKey(normalizedQuery);

    // Check cache first
    let result: GoogleResult | null = geocodeCache.get(cacheKey) || null;
    if (result) {
      console.log(`Google geocoding cache hit for: ${normalizedQuery}`);
      return NextResponse.json({
        ...result,
        cached: true,
        processing_time_ms: Date.now() - startTime,
      });
    }

    // Perform geocoding with timeout and error handling
    console.log(`Google geocoding request for: ${normalizedQuery}`);
    result = await geocodeWithGoogle(normalizedQuery);

    if (result) {
      // Cache successful result
      geocodeCache.set(cacheKey, result);
      console.log(`Google geocoding successful: ${result.lat}, ${result.lng}`);

      return NextResponse.json({
        ...result,
        cached: false,
        processing_time_ms: Date.now() - startTime,
      });
    } else {
      console.log(`Google geocoding no results for: ${normalizedQuery}`);
      return NextResponse.json({ error: 'No result' }, { status: 404 });
    }
  } catch (error) {
    console.error('Google geocoding proxy error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage === 'GOOGLE_API_NOT_CONFIGURED') {
      return NextResponse.json(
        {
          error: 'Google Geocoding API not configured',
          message: 'GOOGLE_GEOCODING_API_KEY environment variable not set',
        },
        { status: 503 }
      );
    }

    if (
      errorMessage === 'RATE_LIMITED' ||
      errorMessage === 'UNREACHABLE' ||
      errorMessage === 'ETIMEDOUT'
    ) {
      return NextResponse.json(
        {
          error: 'Geocoding rate-limited/unreachable',
          details: errorMessage,
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal geocoding error',
        processing_time_ms: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
