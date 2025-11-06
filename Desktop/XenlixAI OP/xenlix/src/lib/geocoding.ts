/**
 * Geocoding utility for XenlixAI
 * Uses OpenStreetMap (Nominatim) as primary geocoding service with Google Geocoding as fallback
 * Implements 24-hour domain-based caching and rate limiting
 */

import { z } from 'zod';

// Geocoding result interface
export interface GeocodingResult {
  latitude: number;
  longitude: number;
  formatted_address: string;
  provider: 'nominatim' | 'google';
  accuracy: 'high' | 'medium' | 'low';
}

// Nominatim response schema
const NominatimResponseSchema = z.array(
  z.object({
    lat: z.string(),
    lon: z.string(),
    display_name: z.string(),
    importance: z.number().optional(),
    place_rank: z.number().optional(),
  })
);

// Google Geocoding response schema
const GoogleGeocodingResponseSchema = z.object({
  results: z.array(
    z.object({
      geometry: z.object({
        location: z.object({
          lat: z.number(),
          lng: z.number(),
        }),
      }),
      formatted_address: z.string(),
    })
  ),
  status: z.string(),
});

// Cache interface
interface CacheEntry {
  result: GeocodingResult;
  timestamp: number;
  domain: string;
}

// In-memory cache for server-side geocoding (24-hour TTL)
const geocodingCache = new Map<string, CacheEntry>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Rate limiting for Nominatim (1 request per second per domain)
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_DELAY = 1000; // 1 second

/**
 * Clean expired cache entries
 */
function cleanExpiredCache(): void {
  const now = Date.now();
  for (const [key, entry] of geocodingCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      geocodingCache.delete(key);
    }
  }
}

/**
 * Generate cache key from address and domain
 */
function getCacheKey(address: string, domain: string): string {
  return `${domain}:${address.toLowerCase().trim()}`;
}

/**
 * Wait for rate limit if needed
 */
async function waitForRateLimit(domain: string): Promise<void> {
  const lastRequest = rateLimitMap.get(domain) || 0;
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequest;

  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    const waitTime = RATE_LIMIT_DELAY - timeSinceLastRequest;
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }

  rateLimitMap.set(domain, Date.now());
}

/**
 * Geocode address using Nominatim (OpenStreetMap)
 */
async function geocodeWithNominatim(
  address: string,
  domain: string
): Promise<GeocodingResult | null> {
  try {
    // Apply rate limiting
    await waitForRateLimit(domain);

    const url =
      `https://nominatim.openstreetmap.org/search?` +
      `format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=1`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': `XenlixAI-Bot/1.0 (${domain}; +https://xenlix.com/bot)`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data = await response.json();
    const parsed = NominatimResponseSchema.parse(data);

    if (parsed.length === 0) {
      return null;
    }

    const result = parsed[0];

    // Determine accuracy based on importance and place_rank
    let accuracy: 'high' | 'medium' | 'low' = 'medium';
    if (result.importance && result.importance > 0.7) {
      accuracy = 'high';
    } else if (result.importance && result.importance < 0.3) {
      accuracy = 'low';
    }

    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      formatted_address: result.display_name,
      provider: 'nominatim',
      accuracy,
    };
  } catch (error) {
    console.error('Nominatim geocoding failed:', error);
    return null;
  }
}

/**
 * Geocode address using Google Geocoding API (fallback)
 */
async function geocodeWithGoogle(address: string): Promise<GeocodingResult | null> {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey || apiKey === 'YOUR_KEY_HERE' || apiKey.includes('your-')) {
      console.log('Google Geocoding API key not available, skipping Google fallback');
      return null;
    }

    const url =
      `https://maps.googleapis.com/maps/api/geocode/json?` +
      `address=${encodeURIComponent(address)}&key=${apiKey}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Google Geocoding API error: ${response.status}`);
    }

    const data = await response.json();
    const parsed = GoogleGeocodingResponseSchema.parse(data);

    if (parsed.status !== 'OK' || parsed.results.length === 0) {
      return null;
    }

    const result = parsed.results[0];

    return {
      latitude: result.geometry.location.lat,
      longitude: result.geometry.location.lng,
      formatted_address: result.formatted_address,
      provider: 'google',
      accuracy: 'high', // Google generally has high accuracy
    };
  } catch (error) {
    console.error('Google geocoding failed:', error);
    return null;
  }
}

/**
 * Main geocoding function with caching and fallback strategy
 *
 * @param address - Address to geocode
 * @param domain - Domain making the request (for rate limiting and caching)
 * @returns Geocoding result or null if no results found
 */
export async function geocodeAddress(
  address: string,
  domain: string
): Promise<GeocodingResult | null> {
  if (!address?.trim()) {
    return null;
  }

  const normalizedAddress = address.trim();
  const cacheKey = getCacheKey(normalizedAddress, domain);

  // Clean expired cache entries periodically
  if (Math.random() < 0.01) {
    // 1% chance to clean cache
    cleanExpiredCache();
  }

  // Check cache first
  const cached = geocodingCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`Geocoding cache hit for: ${normalizedAddress} (${cached.result.provider})`);
    return cached.result;
  }

  console.log(`Geocoding address: ${normalizedAddress} for domain: ${domain}`);

  // Try Nominatim first (free, no API key required)
  let result = await geocodeWithNominatim(normalizedAddress, domain);

  // Fallback to Google if Nominatim fails
  if (!result) {
    console.log('Nominatim failed, trying Google Geocoding fallback...');
    result = await geocodeWithGoogle(normalizedAddress);
  }

  // Cache the result if successful
  if (result) {
    geocodingCache.set(cacheKey, {
      result,
      timestamp: Date.now(),
      domain,
    });

    console.log(
      `Geocoding successful: ${result.latitude}, ${result.longitude} via ${result.provider}`
    );
  } else {
    console.log(`Geocoding failed for address: ${normalizedAddress}`);
  }

  return result;
}

/**
 * Extract domain from URL for rate limiting and caching
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname.toLowerCase();
  } catch {
    return 'unknown';
  }
}

/**
 * Get cache statistics (for debugging)
 */
export function getCacheStats(): {
  totalEntries: number;
  cacheHitRate?: number;
  oldestEntry?: number;
  newestEntry?: number;
} {
  const entries = Array.from(geocodingCache.values());
  const now = Date.now();

  return {
    totalEntries: entries.length,
    oldestEntry:
      entries.length > 0 ? Math.min(...entries.map((e) => now - e.timestamp)) : undefined,
    newestEntry:
      entries.length > 0 ? Math.max(...entries.map((e) => now - e.timestamp)) : undefined,
  };
}
