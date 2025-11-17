/**
 * Enhanced Redis Cache Client with Health Checks and Fallback
 * Provides robust caching with memory fallback and detailed metrics
 *
 * UPDATED: Now uses shared Redis client from redis-client.ts
 * - Eliminates redundant Redis connections
 * - Consistent error handling and retry strategy
 * - Proper connection lifecycle management
 */

import {
  getRedisClient,
  checkRedisHealth as checkRedisClientHealth,
  getRedisStatus,
} from './redis-client';
import { getEnvironmentConfig } from './env-config';
import { isRedisDisabled } from './config';

interface CacheMetrics {
  hits: number;
  misses: number;
  errors: number;
  totalRequests: number;
  avgResponseTime: number;
  lastHealthCheck: Date;
  redisConnected: boolean;
}

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
  key: string;
}

class EnhancedRedisCache {
  private memoryCache: Map<string, CacheEntry> = new Map();
  private metrics: CacheMetrics;
  private config: ReturnType<typeof getEnvironmentConfig>;
  private lastConnectionCheck = 0;
  private readonly CONNECTION_CHECK_INTERVAL = 30000; // 30 seconds

  constructor() {
    this.config = getEnvironmentConfig();
    this.metrics = {
      hits: 0,
      misses: 0,
      errors: 0,
      totalRequests: 0,
      avgResponseTime: 0,
      lastHealthCheck: new Date(),
      redisConnected: false,
    };

    // Use shared Redis client - no need to initialize here
    this.updateConnectionStatus();
  }

  private updateConnectionStatus() {
    const status = getRedisStatus();
    this.metrics.redisConnected = status.connected;
  }

  /**
   * Get Redis client (shared singleton)
   */
  private getRedis() {
    const redis = getRedisClient();
    this.updateConnectionStatus();
    return redis;
  }

  /**
   * Health check for Redis connectivity
   */
  async checkRedisHealth(): Promise<boolean> {
    const now = Date.now();

    // Skip if we checked recently
    if (now - this.lastConnectionCheck < this.CONNECTION_CHECK_INTERVAL) {
      const status = getRedisStatus();
      return status.connected;
    }

    this.lastConnectionCheck = now;
    this.metrics.lastHealthCheck = new Date();

    try {
      const result = await checkRedisClientHealth();
      this.metrics.redisConnected = result.healthy;

      if (result.latency) {
        this.updateResponseTime(result.latency);
      }

      return result.healthy;
    } catch (error) {
      // Gracefully handle failures
      const isDev = this.config.app.nodeEnv === 'development' || this.config.app.nodeEnv === 'test';
      if (!isDev && this.metrics.errors < 3) {
        console.warn(
          '⚠️  Redis health check failed (using memory fallback):',
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
      this.isConnected = false;
      this.metrics.redisConnected = false;
      this.metrics.errors++;
    }

    return false;
  }

  /**
   * Get data from cache with fallback to memory
   */
  async get<T>(key: string): Promise<T | null> {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      const redis = this.getRedis();

      // Try Redis first if available
      if (redis && redis.status === 'ready') {
        try {
          const data = await redis.get(key);
          if (data !== null) {
            this.metrics.hits++;
            this.updateResponseTime(Date.now() - startTime);
            return JSON.parse(data) as T;
          }
        } catch (error) {
          // Silent fallback to memory cache in dev mode
          const isDev =
            this.config.app.nodeEnv === 'development' || this.config.app.nodeEnv === 'test';
          if (!isDev && this.metrics.errors < 3) {
            console.warn(
              'Redis get error (using memory fallback):',
              error instanceof Error ? error.message : 'Unknown error'
            );
          }
          this.metrics.errors++;
          // Fall through to memory cache
        }
      }

      // Fallback to memory cache
      const memoryEntry = this.memoryCache.get(key);
      if (memoryEntry) {
        // Check if entry is still valid
        if (Date.now() - memoryEntry.timestamp < memoryEntry.ttl * 1000) {
          this.metrics.hits++;
          this.updateResponseTime(Date.now() - startTime);
          return memoryEntry.data as T;
        } else {
          // Remove expired entry
          this.memoryCache.delete(key);
        }
      }

      // Cache miss
      this.metrics.misses++;
      this.updateResponseTime(Date.now() - startTime);
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      this.metrics.errors++;
      this.updateResponseTime(Date.now() - startTime);
      return null;
    }
  }

  /**
   * Set data in cache with TTL
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    const startTime = Date.now();
    const ttl = ttlSeconds || this.config.redis.cacheTtl;

    try {
      const redis = this.getRedis();

      // Try Redis first if available
      if (redis && redis.status === 'ready') {
        try {
          await redis.setex(key, ttl, JSON.stringify(value));
          this.updateResponseTime(Date.now() - startTime);
          return true;
        } catch (error) {
          // Silent fallback to memory cache
          const isDev =
            this.config.app.nodeEnv === 'development' || this.config.app.nodeEnv === 'test';
          if (!isDev && this.metrics.errors < 3) {
            console.warn(
              'Redis set error (using memory fallback):',
              error instanceof Error ? error.message : 'Unknown error'
            );
          }
          this.metrics.errors++;
          // Fall through to memory cache
        }
      }

      // Fallback to memory cache
      const entry: CacheEntry = {
        data: value,
        timestamp: Date.now(),
        ttl,
        key,
      };

      this.memoryCache.set(key, entry);
      this.updateResponseTime(Date.now() - startTime);

      // Cleanup expired entries periodically
      this.cleanupMemoryCache();

      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      this.metrics.errors++;
      this.updateResponseTime(Date.now() - startTime);
      return false;
    }
  }

  /**
   * Delete entry from cache
   */
  async del(key: string): Promise<boolean> {
    try {
      let deleted = false;
      const redis = this.getRedis();

      // Delete from Redis if available
      if (redis && redis.status === 'ready') {
        try {
          const result = await redis.del(key);
          deleted = result > 0;
        } catch (error) {
          // Silent error handling
          this.metrics.errors++;
        }
      }

      // Delete from memory cache
      const memoryDeleted = this.memoryCache.delete(key);

      return deleted || memoryDeleted;
    } catch (error) {
      console.error('Cache del error:', error);
      this.metrics.errors++;
      return false;
    }
  }

  /**
   * Get cache metrics for monitoring
   */
  getMetrics(): CacheMetrics & {
    hitRate: number;
    memoryCacheSize: number;
    cacheMode: 'redis' | 'memory' | 'hybrid';
  } {
    const hitRate =
      this.metrics.totalRequests > 0 ? (this.metrics.hits / this.metrics.totalRequests) * 100 : 0;

    const status = getRedisStatus();
    const cacheMode = status.connected ? 'redis' : 'memory';

    return {
      ...this.metrics,
      hitRate: Math.round(hitRate * 100) / 100,
      memoryCacheSize: this.memoryCache.size,
      cacheMode: this.memoryCache.size > 0 && status.connected ? 'hybrid' : cacheMode,
    };
  }

  /**
   * Clear all caches
   */
  async clear(): Promise<void> {
    try {
      const redis = this.getRedis();
      if (redis && redis.status === 'ready') {
        await redis.flushall();
      }
      this.memoryCache.clear();
    } catch (error) {
      console.error('Cache clear error:', error);
      this.metrics.errors++;
    }
  }

  /**
   * Generate cache key for URL and parameters
   */
  generateCacheKey(prefix: string, url: string, params?: Record<string, any>): string {
    const urlHash = Buffer.from(url).toString('base64').slice(0, 20);
    const paramsHash = params
      ? Buffer.from(JSON.stringify(params)).toString('base64').slice(0, 10)
      : '';
    return `${prefix}:${urlHash}${paramsHash ? ':' + paramsHash : ''}`;
  }

  private updateResponseTime(responseTime: number) {
    this.metrics.avgResponseTime = (this.metrics.avgResponseTime + responseTime) / 2;
  }

  private cleanupMemoryCache() {
    // Cleanup expired entries (run occasionally)
    if (Math.random() < 0.1) {
      // 10% chance to run cleanup
      const now = Date.now();
      for (const [key, entry] of this.memoryCache.entries()) {
        if (now - entry.timestamp > entry.ttl * 1000) {
          this.memoryCache.delete(key);
        }
      }
    }
  }

  /**
   * Close Redis connection gracefully
   * Note: This doesn't disconnect the shared Redis client, just clears local state
   */
  async disconnect(): Promise<void> {
    // Clear memory cache
    this.memoryCache.clear();
    this.metrics.redisConnected = false;
  }
}

// Lazy singleton instance - only create during runtime
let _cacheClient: EnhancedRedisCache | null = null;

export function getCacheClient(): EnhancedRedisCache {
  if (!_cacheClient) {
    _cacheClient = new EnhancedRedisCache();
  }
  return _cacheClient;
}

// Export legacy compatibility object that delegates to lazy instance
export const cacheClient = {
  get cache() {
    return getCacheClient();
  },
  async get(key: string) {
    return getCacheClient().get(key);
  },
  async set(key: string, value: any, ttl?: number) {
    return getCacheClient().set(key, value, ttl);
  },
  async del(key: string) {
    return getCacheClient().del(key);
  },
  async checkRedisHealth() {
    return getCacheClient().checkRedisHealth();
  },
  async disconnect() {
    return getCacheClient().disconnect();
  },
  getMetrics() {
    return getCacheClient().getMetrics();
  },
};

export default cacheClient;
