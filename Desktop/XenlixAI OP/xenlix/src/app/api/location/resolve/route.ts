/**
 * Free Tier Location Resolution API
 * Bounded, cached, throttled geocoding for free tier users
 * Max 2-3s timeout, rate limited, non-blocking
 */

import { NextRequest, NextResponse } from 'next/server';
import NodeCache from 'node-cache';

// Environment configuration
const FREE_GEO_ENABLED = process.env.FREE_GEO_ENABLED === '1';
const FREE_GEO_PROVIDER = process.env.FREE_GEO_PROVIDER || 'osm';
const FREE_GEO_CACHE_TTL_HOURS = parseInt(process.env.FREE_GEO_CACHE_TTL_HOURS || '168'); // 7 days
const FREE_GEO_RATE_LIMIT_PER_MIN = parseInt(process.env.FREE_GEO_RATE_LIMIT_PER_MIN || '1');
const GOOGLE_GEOCODE_ENABLED = process.env.GOOGLE_GEOCODE_ENABLED === '1';

// Cache with configurable TTL
const geoCache = new NodeCache({
  stdTTL: FREE_GEO_CACHE_TTL_HOURS * 3600, // Convert hours to seconds
  checkperiod: 600, // Check for expired keys every 10 minutes
  useClones: false, // Better performance
});

// Rate limiting storage
const rateLimits = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

interface LocationResult {
  lat: number;
  lng: number;
  address: string;
  provider: 'osm' | 'google' | 'jsonld';
  cached: boolean;
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

  if (limit.count >= FREE_GEO_RATE_LIMIT_PER_MIN) {
    return false;
  }

  limit.count++;
  return true;
}

function getCacheKey(address: string): string {
  return `geo_${Buffer.from(address.toLowerCase().trim()).toString('base64')}`;
}

async function geocodeWithTimeout(
  address: string,
  timeoutMs: number = 2500
): Promise<LocationResult | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let result: LocationResult | null = null;

    if (FREE_GEO_PROVIDER === 'google' && GOOGLE_GEOCODE_ENABLED) {
      result = await geocodeWithGoogle(address, controller.signal);
    } else {
      result = await geocodeWithOSM(address, controller.signal);
    }

    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      console.log(`Geocoding timeout for: ${address}`);
      return null;
    }
    console.error('Geocoding error:', error);
    return null;
  }
}

async function geocodeWithOSM(
  address: string,
  signal: AbortSignal
): Promise<LocationResult | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=1`;

  const response = await fetch(url, {
    signal,
    headers: {
      'User-Agent': 'XenlixAI-FreeGeo/1.0 (https://xenlix.com/contact)',
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
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
    provider: 'osm',
    cached: false,
  };
}

async function geocodeWithGoogle(
  address: string,
  signal: AbortSignal
): Promise<LocationResult | null> {
  const apiKey =
    process.env.GOOGLE_GEOCODING_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey || apiKey === 'YOUR_KEY_HERE' || apiKey.includes('your-')) {
    console.log('Google Geocoding API key not configured, falling back to OSM');
    return geocodeWithOSM(address, signal);
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;

  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(`Google Geocoding API error: ${response.status}`);
  }

  const data = await response.json();
  if (data.status !== 'OK' || !data.results || data.results.length === 0) {
    return null;
  }

  const result = data.results[0];
  return {
    lat: result.geometry.location.lat,
    lng: result.geometry.location.lng,
    address: result.formatted_address,
    provider: 'google',
    cached: false,
  };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Check if geocoding is enabled
    if (!FREE_GEO_ENABLED) {
      return NextResponse.json({ error: 'Geocoding disabled', success: false }, { status: 503 });
    }

    const clientId = getClientId(request);

    // Check rate limiting
    if (!checkRateLimit(clientId)) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Free geocoding allows ${FREE_GEO_RATE_LIMIT_PER_MIN} request per minute.`,
          success: false,
          retry_after: 60,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { address } = body;

    if (!address?.trim()) {
      return NextResponse.json({ error: 'Address is required', success: false }, { status: 400 });
    }

    const normalizedAddress = address.trim();
    const cacheKey = getCacheKey(normalizedAddress);

    // Check cache first
    let result: LocationResult | null = geoCache.get(cacheKey) || null;
    if (result) {
      result.cached = true;
      console.log(`Geocoding cache hit for: ${normalizedAddress}`);
      return NextResponse.json({
        success: true,
        result,
        processing_time_ms: Date.now() - startTime,
      });
    }

    // Perform bounded geocoding with timeout
    console.log(`Geocoding with ${FREE_GEO_PROVIDER}: ${normalizedAddress}`);
    result = await geocodeWithTimeout(normalizedAddress, 2500);

    if (result) {
      // Cache the successful result
      geoCache.set(cacheKey, result);
      console.log(`Geocoding successful: ${result.lat}, ${result.lng} via ${result.provider}`);
    } else {
      console.log(`Geocoding failed for: ${normalizedAddress}`);
    }

    return NextResponse.json({
      success: !!result,
      result,
      processing_time_ms: Date.now() - startTime,
    });
  } catch (error) {
    console.error('Location resolve API error:', error);
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
  const address = request.nextUrl.searchParams.get('address');

  if (!address) {
    return NextResponse.json(
      { error: 'Address parameter is required', success: false },
      { status: 400 }
    );
  }

  // Convert GET to POST format
  const mockRequest = new Request(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify({ address, url }),
  });

  return POST(mockRequest as NextRequest);
}
