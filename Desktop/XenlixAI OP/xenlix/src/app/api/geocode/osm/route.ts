/**
 * OSM Geocoding Proxy for Premium Dashboard
 * Server-side proxy to avoid CORS issues and rate limiting
 */

import { NextRequest, NextResponse } from 'next/server';
import NodeCache from 'node-cache';

export const runtime = 'nodejs';

// Environment configuration
const PREMIUM_GEO_CACHE_TTL_HOURS = parseInt(process.env.PREMIUM_GEO_CACHE_TTL_HOURS || '168'); // 7 days
const PREMIUM_GEO_RATE_LIMIT_PER_MIN = parseInt(process.env.PREMIUM_GEO_RATE_LIMIT_PER_MIN || '1');
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// Cache for geocoding results
const geocodeCache = new NodeCache({
  stdTTL: PREMIUM_GEO_CACHE_TTL_HOURS * 3600, // Convert hours to seconds
  checkperiod: 600, // Check for expired keys every 10 minutes
  useClones: false,
});

// Rate limiting storage
const rateLimits = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

interface OSMResult {
  lat: number;
  lng: number;
  address?: string;
  source: 'osm';
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
  return `osm_${Buffer.from(query.toLowerCase().trim()).toString('base64')}`;
}

async function geocodeWithOSM(query: string): Promise<OSMResult | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`;

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'XenlixAI/1.0 (contact: support@xenlix.com)',
        Accept: 'application/json',
        Referer: SITE_URL,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('RATE_LIMITED');
      }
      throw new Error(`OSM API error: ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    const result = data[0];
    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      address: result.display_name,
      source: 'osm',
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('ETIMEDOUT');
      }
      if (error.message === 'RATE_LIMITED') {
        throw new Error('RATE_LIMITED');
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
    let result: OSMResult | null = geocodeCache.get(cacheKey) || null;
    if (result) {
      console.log(`OSM geocoding cache hit for: ${normalizedQuery}`);
      return NextResponse.json({
        ...result,
        cached: true,
        processing_time_ms: Date.now() - startTime,
      });
    }

    // Perform geocoding with timeout and error handling
    console.log(`OSM geocoding request for: ${normalizedQuery}`);
    result = await geocodeWithOSM(normalizedQuery);

    if (result) {
      // Cache successful result
      geocodeCache.set(cacheKey, result);
      console.log(`OSM geocoding successful: ${result.lat}, ${result.lng}`);

      return NextResponse.json({
        ...result,
        cached: false,
        processing_time_ms: Date.now() - startTime,
      });
    } else {
      console.log(`OSM geocoding no results for: ${normalizedQuery}`);
      return NextResponse.json({ error: 'No result' }, { status: 404 });
    }
  } catch (error) {
    console.error('OSM geocoding proxy error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

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
