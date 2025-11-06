/**
 * OpenPageRank API Integration
 * Provides domain authority scoring with 24h caching and rate limiting
 */

import { Request } from 'undici';
import { z } from 'zod';

// Types
export interface OPRResult {
  domain: string;
  rank: number; // 0-10 (raw OPR score)
  rank100: number; // 0-100 (normalized for UI)
}

export interface OPRResponse {
  status_code: number;
  error?: string;
  response?: Array<{
    domain: string;
    page_rank_integer?: number;
    page_rank_decimal?: number;
  }>;
}

// Validation schema
const OPRResponseSchema = z.object({
  status_code: z.number(),
  error: z.string().optional(),
  response: z
    .array(
      z.object({
        domain: z.string(),
        page_rank_integer: z.number().optional(),
        page_rank_decimal: z.number().optional(),
      })
    )
    .optional(),
});

// In-memory cache and rate limiting (fallback when Redis not available)
const memoryCache = new Map<string, { data: OPRResult; timestamp: number }>();
const rateLimitMap = new Map<string, { tokens: number; lastRefill: number }>();

// Cache settings
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in ms
const RATE_LIMIT = {
  tokens: 60, // requests per window
  windowMs: 10 * 60 * 1000, // 10 minutes
  refillRate: 60 / (10 * 60), // tokens per second
};

// Redis client (optional)
let redis: any = null;
// Skip Redis initialization during build phase
if (typeof process !== 'undefined' && process.env.NODE_ENV && typeof window === 'undefined') {
  try {
    if (process.env.REDIS_URL) {
      const Redis = require('ioredis');
      redis = new Redis(process.env.REDIS_URL);
    }
  } catch (error) {
    console.log('Redis not available, using in-memory cache');
  }
}

/**
 * Extract base domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
  }
}

/**
 * Generate cache key
 */
function getCacheKey(domain: string): string {
  const today = new Date().toISOString().split('T')[0];
  return `opr:${domain}:${today}`;
}

/**
 * Check rate limit for IP
 */
async function checkRateLimit(ip: string): Promise<boolean> {
  const key = `rate_limit:opr:${ip}`;

  if (redis) {
    try {
      const current = await redis.incr(key);
      if (current === 1) {
        await redis.expire(key, Math.ceil(RATE_LIMIT.windowMs / 1000));
      }
      return current <= RATE_LIMIT.tokens;
    } catch (error) {
      console.error('Redis rate limit error:', error);
      // Fall through to memory-based rate limiting
    }
  }

  // Memory-based rate limiting
  const now = Date.now();
  const bucket = rateLimitMap.get(ip) || { tokens: RATE_LIMIT.tokens, lastRefill: now };

  // Refill tokens based on time passed
  const timePassed = now - bucket.lastRefill;
  const tokensToAdd = Math.floor((timePassed / 1000) * RATE_LIMIT.refillRate);

  bucket.tokens = Math.min(RATE_LIMIT.tokens, bucket.tokens + tokensToAdd);
  bucket.lastRefill = now;

  if (bucket.tokens > 0) {
    bucket.tokens--;
    rateLimitMap.set(ip, bucket);
    return true;
  }

  return false;
}

/**
 * Get cached OPR result
 */
async function getFromCache(domain: string): Promise<OPRResult | null> {
  const cacheKey = getCacheKey(domain);

  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.error('Redis cache get error:', error);
    }
  }

  // Memory cache fallback
  const cached = memoryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  return null;
}

/**
 * Set cache with OPR result
 */
async function setCache(domain: string, result: OPRResult): Promise<void> {
  const cacheKey = getCacheKey(domain);

  if (redis) {
    try {
      await redis.setex(cacheKey, Math.ceil(CACHE_TTL / 1000), JSON.stringify(result));
    } catch (error) {
      console.error('Redis cache set error:', error);
    }
  }

  // Always set in memory cache as backup
  memoryCache.set(cacheKey, { data: result, timestamp: Date.now() });

  // Clean up old entries in memory cache
  if (memoryCache.size > 1000) {
    const cutoff = Date.now() - CACHE_TTL;
    for (const [key, value] of memoryCache.entries()) {
      if (value.timestamp < cutoff) {
        memoryCache.delete(key);
      }
    }
  }
}

/**
 * Fetch OPR data from API
 */
async function fetchOPR(domain: string): Promise<OPRResult> {
  const apiKey = process.env.OPENPAGERANK_API_KEY;
  if (!apiKey) {
    throw new Error('OPENPAGERANK_API_KEY environment variable not set');
  }

  const url = `https://openpagerank.com/api/v1.0/getPageRank?domains[]=${encodeURIComponent(domain)}`;

  try {
    const response = await fetch(url, {
      headers: {
        'API-OPR': apiKey,
        'User-Agent': 'XenlixAI-AEO-Validator/1.0',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`OPR API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const validation = OPRResponseSchema.safeParse(data);

    if (!validation.success) {
      console.warn('OPR response validation failed:', validation.error);
      throw new Error('Invalid OPR API response format');
    }

    const validatedData = validation.data;

    if (validatedData.status_code !== 200) {
      throw new Error(`OPR API error: ${validatedData.error || 'Unknown error'}`);
    }

    if (!validatedData.response || validatedData.response.length === 0) {
      console.warn(`No OPR data found for domain: ${domain}`);
      return {
        domain,
        rank: 0,
        rank100: 0,
      };
    }

    const domainData = validatedData.response[0];
    const rank = domainData.page_rank_decimal || domainData.page_rank_integer || 0;

    return {
      domain,
      rank: Math.max(0, Math.min(10, rank)), // Clamp to 0-10
      rank100: Math.max(0, Math.min(100, rank * 10)), // Convert to 0-100 scale
    };
  } catch (error) {
    console.error(`Failed to fetch OPR for ${domain}:`, error);

    // Return zero score on error (graceful degradation)
    return {
      domain,
      rank: 0,
      rank100: 0,
    };
  }
}

/**
 * Get OpenPageRank score for a domain (with caching and rate limiting)
 */
export async function getOPR(domain: string, clientIP?: string): Promise<OPRResult> {
  const cleanDomain = extractDomain(domain);

  // Check rate limit if IP provided
  if (clientIP) {
    const withinLimit = await checkRateLimit(clientIP);
    if (!withinLimit) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}`);
      return {
        domain: cleanDomain,
        rank: 0,
        rank100: 0,
      };
    }
  }

  // Check cache first
  const cached = await getFromCache(cleanDomain);
  if (cached) {
    console.log(`OPR cache hit for ${cleanDomain}`);
    return cached;
  }

  // Fetch from API
  console.log(`Fetching OPR for ${cleanDomain}`);
  const result = await fetchOPR(cleanDomain);

  // Cache the result (even if it's zero/error)
  await setCache(cleanDomain, result);

  return result;
}

/**
 * Get OPR scores for multiple domains
 */
export async function getMultipleOPR(domains: string[], clientIP?: string): Promise<OPRResult[]> {
  const results: OPRResult[] = [];

  // Process domains one by one to avoid overwhelming the API
  for (const domain of domains) {
    try {
      const result = await getOPR(domain, clientIP);
      results.push(result);

      // Small delay between requests to be respectful to the API
      if (domains.length > 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error(`Error processing domain ${domain}:`, error);
      results.push({
        domain: extractDomain(domain),
        rank: 0,
        rank100: 0,
      });
    }
  }

  return results;
}

/**
 * Health check for OPR service
 */
export async function healthCheck(): Promise<{ status: 'ok' | 'error'; message: string }> {
  try {
    if (!process.env.OPENPAGERANK_API_KEY) {
      return { status: 'error', message: 'API key not configured' };
    }

    // Test with a known domain
    const result = await fetchOPR('google.com');

    return {
      status: 'ok',
      message: `OPR service healthy. Test result: ${result.rank}/10`,
    };
  } catch (error) {
    return {
      status: 'error',
      message: `OPR service error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export default { getOPR, getMultipleOPR, healthCheck };
