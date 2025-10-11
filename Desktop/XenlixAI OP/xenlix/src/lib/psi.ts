/**
 * Google PageSpeed Insights (PSI) Integration
 *
 * Provides on-demand Lighthouse audits for mobile and desktop
 * with intelligent caching and quota management.
 */

import { request } from 'undici';
import { z } from 'zod';
import Redis from 'ioredis';

// Types and interfaces
export interface PSIResult {
  perf: number;
  seo: number;
  accessibility: number;
  bestPractices: number;
  raw: any;
  strategy: 'mobile' | 'desktop';
  timestamp: number;
}

export interface PSIError {
  error: true;
  message: string;
  code?: string;
}

export interface PSICacheEntry {
  result: PSIResult;
  cachedAt: number;
  expiresAt: number;
}

// Validation schemas
const PSIResponseSchema = z.object({
  lighthouseResult: z
    .object({
      categories: z
        .object({
          performance: z.object({
            score: z.number().nullable(),
          }),
          seo: z.object({
            score: z.number().nullable(),
          }),
          accessibility: z.object({
            score: z.number().nullable(),
          }),
          'best-practices': z.object({
            score: z.number().nullable(),
          }),
        })
        .optional(),
      audits: z.record(z.any()).optional(),
      configSettings: z.any().optional(),
      finalUrl: z.string().optional(),
      fetchTime: z.string().optional(),
    })
    .optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
    })
    .optional(),
});

// Configuration
const PSI_CONFIG = {
  baseUrl: 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed',
  timeout: 30000, // 30 seconds
  cacheTimeout: 24 * 60 * 60 * 1000, // 24 hours
  retryAttempts: 2,
  retryDelay: 1000,
};

// Cache management
let redisClient: Redis | null = null;
const memoryCache = new Map<string, PSICacheEntry>();

/**
 * Initialize Redis client with fallback to memory cache
 */
function initializeCache(): Redis | null {
  if (redisClient) return redisClient;

  // Skip Redis initialization during build phase
  if (typeof process === 'undefined' || !process.env.NODE_ENV || typeof window !== 'undefined') {
    return null;
  }

  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    redisClient = new Redis(redisUrl, {
      enableReadyCheck: false,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    redisClient.on('error', (error) => {
      console.warn('Redis PSI cache error, falling back to memory:', error.message);
      redisClient = null;
    });

    return redisClient;
  } catch (error) {
    console.warn('Failed to initialize Redis for PSI cache:', error);
    return null;
  }
}

/**
 * Generate cache key for PSI results
 */
function getCacheKey(url: string, strategy: 'mobile' | 'desktop'): string {
  // Normalize URL to ensure consistent caching
  const normalizedUrl = new URL(url).toString();
  return `psi:${strategy}:${normalizedUrl}`;
}

/**
 * Get cached PSI result
 */
async function getCachedResult(
  url: string,
  strategy: 'mobile' | 'desktop'
): Promise<PSIResult | null> {
  const cacheKey = getCacheKey(url, strategy);

  try {
    // Try Redis first
    const redis = initializeCache();
    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const entry: PSICacheEntry = JSON.parse(cached);
        if (entry.expiresAt > Date.now()) {
          console.log(`✅ PSI cache hit (Redis): ${strategy} - ${url}`);
          return entry.result;
        } else {
          // Expired, remove from cache
          await redis.del(cacheKey);
        }
      }
    }

    // Fallback to memory cache
    const memCached = memoryCache.get(cacheKey);
    if (memCached && memCached.expiresAt > Date.now()) {
      console.log(`✅ PSI cache hit (memory): ${strategy} - ${url}`);
      return memCached.result;
    } else if (memCached) {
      // Expired, remove from memory cache
      memoryCache.delete(cacheKey);
    }
  } catch (error) {
    console.warn('PSI cache read error:', error);
  }

  return null;
}

/**
 * Cache PSI result
 */
async function cacheResult(
  url: string,
  strategy: 'mobile' | 'desktop',
  result: PSIResult
): Promise<void> {
  const cacheKey = getCacheKey(url, strategy);
  const cacheEntry: PSICacheEntry = {
    result,
    cachedAt: Date.now(),
    expiresAt: Date.now() + PSI_CONFIG.cacheTimeout,
  };

  try {
    // Cache in Redis
    const redis = initializeCache();
    if (redis) {
      await redis.setex(
        cacheKey,
        Math.floor(PSI_CONFIG.cacheTimeout / 1000),
        JSON.stringify(cacheEntry)
      );
    }

    // Always cache in memory as fallback
    memoryCache.set(cacheKey, cacheEntry);

    // Cleanup old memory cache entries (keep only last 100)
    if (memoryCache.size > 100) {
      const entries = Array.from(memoryCache.entries());
      entries.sort((a, b) => b[1].cachedAt - a[1].cachedAt);
      entries.slice(50).forEach(([key]) => memoryCache.delete(key));
    }
  } catch (error) {
    console.warn('PSI cache write error:', error);
  }
}

/**
 * Make PSI API request with retries
 */
async function makePSIRequest(
  url: string,
  strategy: 'mobile' | 'desktop',
  attempt: number = 1
): Promise<any> {
  const apiKey = process.env.PSI_API_KEY;
  if (!apiKey) {
    throw new Error('PSI_API_KEY environment variable is required');
  }

  const params = new URLSearchParams({
    url: url,
    key: apiKey,
    strategy: strategy,
    category: ['performance', 'seo', 'accessibility', 'best-practices'].join('&category='),
    locale: 'en',
  });

  const requestUrl = `${PSI_CONFIG.baseUrl}?${params.toString()}`;

  try {
    console.log(`🔍 PSI API request (${strategy}, attempt ${attempt}): ${url}`);

    const response = await request(requestUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'XenlixAI-AEO-Platform/1.0',
      },
      headersTimeout: PSI_CONFIG.timeout,
      bodyTimeout: PSI_CONFIG.timeout,
    });

    if (response.statusCode === 429) {
      throw new Error('PSI_QUOTA_EXCEEDED');
    }

    if (response.statusCode !== 200) {
      throw new Error(`PSI API error: ${response.statusCode}`);
    }

    const data = await response.body.json();

    // Validate response structure
    const validatedData = PSIResponseSchema.parse(data);

    if (validatedData.error) {
      throw new Error(`PSI API error: ${validatedData.error.message}`);
    }

    return validatedData;
  } catch (error) {
    console.error(`PSI API request failed (attempt ${attempt}):`, error);

    // Retry logic
    if (attempt < PSI_CONFIG.retryAttempts && !error.message.includes('PSI_QUOTA_EXCEEDED')) {
      await new Promise((resolve) => setTimeout(resolve, PSI_CONFIG.retryDelay * attempt));
      return makePSIRequest(url, strategy, attempt + 1);
    }

    throw error;
  }
}

/**
 * Convert PSI scores to 0-100 scale
 */
function normalizeScore(score: number | null): number {
  if (score === null || score === undefined) return 0;
  return Math.round(score * 100);
}

/**
 * Run PageSpeed Insights audit
 *
 * @param url - Website URL to audit
 * @param strategy - 'mobile' or 'desktop' (default: 'mobile')
 * @param forceRefresh - Skip cache and force new audit
 * @returns Promise<PSIResult | PSIError>
 */
export async function runPSI(
  url: string,
  strategy: 'mobile' | 'desktop' = 'mobile',
  forceRefresh: boolean = false
): Promise<PSIResult | PSIError> {
  try {
    // Validate and normalize URL
    const validUrl = new URL(url).toString();

    // Check cache first (unless forced refresh)
    if (!forceRefresh) {
      const cached = await getCachedResult(validUrl, strategy);
      if (cached) {
        return cached;
      }
    }

    // Make API request
    const response = await makePSIRequest(validUrl, strategy);

    if (!response.lighthouseResult) {
      return {
        error: true,
        message: 'No Lighthouse results in PSI response',
        code: 'NO_LIGHTHOUSE_RESULTS',
      };
    }

    const categories = response.lighthouseResult.categories;

    if (!categories) {
      return {
        error: true,
        message: 'No categories in Lighthouse results',
        code: 'NO_CATEGORIES',
      };
    }

    // Extract and normalize scores
    const result: PSIResult = {
      perf: normalizeScore(categories.performance?.score),
      seo: normalizeScore(categories.seo?.score),
      accessibility: normalizeScore(categories.accessibility?.score),
      bestPractices: normalizeScore(categories['best-practices']?.score),
      raw: response.lighthouseResult,
      strategy,
      timestamp: Date.now(),
    };

    // Cache the result
    await cacheResult(validUrl, strategy, result);

    console.log(
      `✅ PSI audit completed (${strategy}): ${url} - Perf: ${result.perf}, SEO: ${result.seo}`
    );

    return result;
  } catch (error) {
    console.error('PSI audit failed:', error);

    const errorMessage = error.message || 'Unknown PSI error';
    let errorCode = 'PSI_ERROR';

    if (errorMessage.includes('PSI_QUOTA_EXCEEDED')) {
      errorCode = 'QUOTA_EXCEEDED';
    } else if (errorMessage.includes('timeout')) {
      errorCode = 'TIMEOUT';
    } else if (errorMessage.includes('network')) {
      errorCode = 'NETWORK_ERROR';
    }

    return {
      error: true,
      message: errorMessage,
      code: errorCode,
    };
  }
}

/**
 * Run PSI audits for both mobile and desktop
 *
 * @param url - Website URL to audit
 * @param forceRefresh - Skip cache and force new audits
 * @returns Promise with mobile and desktop results
 */
export async function runPSIBoth(
  url: string,
  forceRefresh: boolean = false
): Promise<{
  mobile: PSIResult | PSIError;
  desktop: PSIResult | PSIError;
}> {
  console.log(`🚀 Running PSI audits (both mobile & desktop): ${url}`);

  try {
    // Run both audits in parallel
    const [mobileResult, desktopResult] = await Promise.allSettled([
      runPSI(url, 'mobile', forceRefresh),
      runPSI(url, 'desktop', forceRefresh),
    ]);

    const mobile =
      mobileResult.status === 'fulfilled'
        ? mobileResult.value
        : ({ error: true, message: 'Mobile audit failed', code: 'MOBILE_FAILED' } as PSIError);

    const desktop =
      desktopResult.status === 'fulfilled'
        ? desktopResult.value
        : ({ error: true, message: 'Desktop audit failed', code: 'DESKTOP_FAILED' } as PSIError);

    return { mobile, desktop };
  } catch (error) {
    console.error('PSI both audits failed:', error);

    const errorResult: PSIError = {
      error: true,
      message: 'Failed to run PSI audits',
      code: 'BATCH_FAILED',
    };

    return {
      mobile: errorResult,
      desktop: errorResult,
    };
  }
}

/**
 * Check if PSI result is valid (not an error)
 */
export function isPSISuccess(result: PSIResult | PSIError): result is PSIResult {
  return !('error' in result);
}

/**
 * Get average score from mobile and desktop results
 */
export function getAveragePSIScores(mobile: PSIResult | PSIError, desktop: PSIResult | PSIError) {
  const mobileScores = isPSISuccess(mobile) ? mobile : null;
  const desktopScores = isPSISuccess(desktop) ? desktop : null;

  if (!mobileScores && !desktopScores) {
    return {
      perf: 0,
      seo: 0,
      accessibility: 0,
      bestPractices: 0,
      strategy: 'unavailable' as const,
    };
  }

  if (mobileScores && !desktopScores) {
    return {
      perf: mobileScores.perf,
      seo: mobileScores.seo,
      accessibility: mobileScores.accessibility,
      bestPractices: mobileScores.bestPractices,
      strategy: 'mobile-only' as const,
    };
  }

  if (!mobileScores && desktopScores) {
    return {
      perf: desktopScores.perf,
      seo: desktopScores.seo,
      accessibility: desktopScores.accessibility,
      bestPractices: desktopScores.bestPractices,
      strategy: 'desktop-only' as const,
    };
  }

  // Both available - mobile-first with desktop as fallback
  return {
    perf: mobileScores!.perf || desktopScores!.perf,
    seo: mobileScores!.seo || desktopScores!.seo,
    accessibility: mobileScores!.accessibility || desktopScores!.accessibility,
    bestPractices: mobileScores!.bestPractices || desktopScores!.bestPractices,
    strategy: 'mobile-first' as const,
  };
}

/**
 * Clear PSI cache for a specific URL or all cache
 */
export async function clearPSICache(url?: string): Promise<void> {
  try {
    if (url) {
      const normalizedUrl = new URL(url).toString();
      const mobileKey = getCacheKey(normalizedUrl, 'mobile');
      const desktopKey = getCacheKey(normalizedUrl, 'desktop');

      // Clear from Redis
      const redis = initializeCache();
      if (redis) {
        await redis.del(mobileKey, desktopKey);
      }

      // Clear from memory
      memoryCache.delete(mobileKey);
      memoryCache.delete(desktopKey);

      console.log(`🗑️ PSI cache cleared for: ${url}`);
    } else {
      // Clear all cache
      const redis = initializeCache();
      if (redis) {
        const keys = await redis.keys('psi:*');
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      }

      memoryCache.clear();

      console.log('🗑️ All PSI cache cleared');
    }
  } catch (error) {
    console.warn('Failed to clear PSI cache:', error);
  }
}
