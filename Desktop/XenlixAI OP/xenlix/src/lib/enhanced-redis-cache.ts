/**
 * Enhanced Redis Cache Client with Health Checks and Fallback
 * Provides robust caching with memory fallback and detailed metrics
 */

import Redis from 'ioredis';
import { getEnvironmentConfig } from './env-config';

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
  private redis: Redis | null = null;
  private memoryCache: Map<string, CacheEntry> = new Map();
  private metrics: CacheMetrics;
  private config: ReturnType<typeof getEnvironmentConfig>;
  private isConnected = false;
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

    this.initializeRedis();
  }

  private async initializeRedis() {
    try {
      const redisConfig = this.config.redis;

      this.redis = new Redis({
        host: redisConfig.host,
        port: redisConfig.port,
        password: redisConfig.password || undefined,
        maxRetriesPerRequest: redisConfig.maxRetries,
        connectTimeout: 10000,
        lazyConnect: true,
        enableOfflineQueue: false,
      });

      // Handle connection events
      this.redis.on('connect', () => {
        console.log('✅ Redis connected successfully');
        this.isConnected = true;
        this.metrics.redisConnected = true;
      });

      this.redis.on('error', (error) => {
        console.error('❌ Redis connection error:', error.message);
        this.isConnected = false;
        this.metrics.redisConnected = false;
        this.metrics.errors++;
      });

      this.redis.on('close', () => {
        console.log('⚠️  Redis connection closed');
        this.isConnected = false;
        this.metrics.redisConnected = false;
      });

      // Test initial connection
      await this.checkRedisHealth();
    } catch (error) {
      console.error('Failed to initialize Redis:', error);
      this.isConnected = false;
      this.metrics.redisConnected = false;
    }
  }

  /**
   * Health check for Redis connectivity
   */
  async checkRedisHealth(): Promise<boolean> {
    const now = Date.now();

    // Skip if we checked recently
    if (now - this.lastConnectionCheck < this.CONNECTION_CHECK_INTERVAL) {
      return this.isConnected;
    }

    this.lastConnectionCheck = now;
    this.metrics.lastHealthCheck = new Date();

    try {
      if (this.redis) {
        const startTime = Date.now();
        await this.redis.ping();
        const responseTime = Date.now() - startTime;

        this.isConnected = true;
        this.metrics.redisConnected = true;
        this.updateResponseTime(responseTime);

        console.log(`✅ Redis health check passed (${responseTime}ms)`);
        return true;
      }
    } catch (error) {
      console.error('❌ Redis health check failed:', error);
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
      // Try Redis first if connected
      if (this.isConnected && this.redis) {
        try {
          const data = await this.redis.get(key);
          if (data !== null) {
            this.metrics.hits++;
            this.updateResponseTime(Date.now() - startTime);
            return JSON.parse(data) as T;
          }
        } catch (error) {
          console.error('Redis get error:', error);
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
      // Try Redis first if connected
      if (this.isConnected && this.redis) {
        try {
          await this.redis.setex(key, ttl, JSON.stringify(value));
          this.updateResponseTime(Date.now() - startTime);
          return true;
        } catch (error) {
          console.error('Redis set error:', error);
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

      // Delete from Redis if connected
      if (this.isConnected && this.redis) {
        try {
          const result = await this.redis.del(key);
          deleted = result > 0;
        } catch (error) {
          console.error('Redis del error:', error);
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

    const cacheMode = this.isConnected ? 'redis' : 'memory';

    return {
      ...this.metrics,
      hitRate: Math.round(hitRate * 100) / 100,
      memoryCacheSize: this.memoryCache.size,
      cacheMode: this.memoryCache.size > 0 && this.isConnected ? 'hybrid' : cacheMode,
    };
  }

  /**
   * Clear all caches
   */
  async clear(): Promise<void> {
    try {
      if (this.isConnected && this.redis) {
        await this.redis.flushall();
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
   */
  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
    }
    this.isConnected = false;
  }
}

// Export singleton instance
export const cacheClient = new EnhancedRedisCache();
export default cacheClient;
