import Redis from 'ioredis';
import { Queue } from 'bullmq';
import { getEnvironmentConfig } from './env-config';

// Build-time suppression: skip Redis initialization when REDIS_URL is missing
// or when explicitly building (NEXT_BUILD === "true"). Return a no-op client/queue.
const SHOULD_SKIP_REDIS = !process.env.REDIS_URL || process.env.NEXT_BUILD === 'true';

function createNoopRedis(): Redis {
  // Generic no-op proxy that returns a function resolving to null for any method
  return new Proxy({} as Redis, {
    get() {
      return () => Promise.resolve(null);
    },
  });
}

function createNoopQueue(): Queue {
  return new Proxy({} as Queue, {
    get() {
      return () => Promise.resolve(null);
    },
  });
}

// Get Redis configuration from environment
let redisConfig: any = null;
let _redis: Redis | null = null;
let _redisSubscriber: Redis | null = null;

function getRedisConfig() {
  if (!redisConfig) {
    const envConfig = getEnvironmentConfig();
    redisConfig = {
      host: envConfig.redis.host,
      port: envConfig.redis.port,
      password: envConfig.redis.password,
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
    };
  }
  return redisConfig;
}

// Lazy Redis client getters
export function getRedisClient(): Redis {
  if (!_redis) {
    _redis = SHOULD_SKIP_REDIS ? createNoopRedis() : new Redis(getRedisConfig());
  }
  return _redis;
}

export function getRedisSubscriber(): Redis {
  if (!_redisSubscriber) {
    _redisSubscriber = SHOULD_SKIP_REDIS ? createNoopRedis() : new Redis(getRedisConfig());
  }
  return _redisSubscriber;
}

// For backward compatibility - lazy Redis instances
let _exportedRedis: Redis | null = null;
let _exportedRedisSubscriber: Redis | null = null;

// Lazy Redis getters to avoid build-time connections
function getLazyRedis(): Redis | null {
  if (
    !_exportedRedis &&
    typeof process !== 'undefined' &&
    process.env.NODE_ENV &&
    typeof window === 'undefined'
  ) {
    try {
      _exportedRedis = getRedisClient();
    } catch (e) {
      console.warn('Redis connection failed, operations will be skipped');
    }
  }
  return _exportedRedis;
}

function getLazyRedisSubscriber(): Redis | null {
  if (
    !_exportedRedisSubscriber &&
    typeof process !== 'undefined' &&
    process.env.NODE_ENV &&
    typeof window === 'undefined'
  ) {
    try {
      _exportedRedisSubscriber = getRedisSubscriber();
    } catch (e) {
      console.warn('Redis subscriber connection failed, operations will be skipped');
    }
  }
  return _exportedRedisSubscriber;
}

export const redis = getLazyRedis();
export const redisSubscriber = getLazyRedisSubscriber();

// Job Queues (using BullMQ) - lazy initialization to prevent build-time Redis connections
let _crawlQueue: Queue | null = null;
let _auditQueue: Queue | null = null;
let _embeddingQueue: Queue | null = null;

export function getCrawlQueue(): Queue {
  if (!_crawlQueue) {
    if (SHOULD_SKIP_REDIS) {
      _crawlQueue = createNoopQueue();
    } else if (
      typeof process !== 'undefined' &&
      process.env.NODE_ENV &&
      typeof window === 'undefined'
    ) {
      _crawlQueue = new Queue('crawl jobs', {
        connection: getRedisConfig(),
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      });
    }
  }
  return _crawlQueue!;
}

export function getAuditQueue(): Queue {
  if (!_auditQueue) {
    if (SHOULD_SKIP_REDIS) {
      _auditQueue = createNoopQueue();
    } else if (
      typeof process !== 'undefined' &&
      process.env.NODE_ENV &&
      typeof window === 'undefined'
    ) {
      _auditQueue = new Queue('audit jobs', {
        connection: getRedisConfig(),
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      });
    }
  }
  return _auditQueue!;
}

export function getEmbeddingQueue(): Queue {
  if (!_embeddingQueue) {
    if (SHOULD_SKIP_REDIS) {
      _embeddingQueue = createNoopQueue();
    } else if (
      typeof process !== 'undefined' &&
      process.env.NODE_ENV &&
      typeof window === 'undefined'
    ) {
      _embeddingQueue = new Queue('embedding jobs', {
        connection: getRedisConfig(),
        defaultJobOptions: {
          removeOnComplete: 50,
          removeOnFail: 25,
          attempts: 2,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      });
    }
  }
  return _embeddingQueue!;
}

// Legacy exports for backward compatibility - lazy proxies
export const crawlQueue = new Proxy({} as Queue, {
  get(target, prop) {
    return getCrawlQueue()[prop as keyof Queue];
  },
});

export const auditQueue = new Proxy({} as Queue, {
  get(target, prop) {
    return getAuditQueue()[prop as keyof Queue];
  },
});

export const embeddingQueue = new Proxy({} as Queue, {
  get(target, prop) {
    return getEmbeddingQueue()[prop as keyof Queue];
  },
});

// Cache utilities
export class CacheService {
  private static instance: CacheService;

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    try {
      await getRedisClient().setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Redis cache set error:', error);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await getRedisClient().get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis cache get error:', error);
      return null;
    }
  }

  async del(key: string): Promise<void> {
    try {
      await getRedisClient().del(key);
    } catch (error) {
      console.error('Redis cache delete error:', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      return (await getRedisClient().exists(key)) === 1;
    } catch (error) {
      console.error('Redis cache exists error:', error);
      return false;
    }
  }

  // Cache crawler results
  async cacheCrawlResult(url: string, result: any, ttl: number = 7200): Promise<void> {
    const key = `crawl:${Buffer.from(url).toString('base64')}`;
    await this.set(key, result, ttl);
  }

  async getCachedCrawlResult(url: string): Promise<any> {
    const key = `crawl:${Buffer.from(url).toString('base64')}`;
    return await this.get(key);
  }

  // Cache audit results
  async cacheAuditResult(url: string, result: any, ttl: number = 3600): Promise<void> {
    const key = `audit:${Buffer.from(url).toString('base64')}`;
    await this.set(key, result, ttl);
  }

  async getCachedAuditResult(url: string): Promise<any> {
    const key = `audit:${Buffer.from(url).toString('base64')}`;
    return await this.get(key);
  }

  // Cache embeddings
  async cacheEmbedding(text: string, embedding: number[], ttl: number = 86400): Promise<void> {
    const key = `embedding:${Buffer.from(text).toString('base64').substring(0, 50)}`;
    await this.set(key, embedding, ttl);
  }

  async getCachedEmbedding(text: string): Promise<number[] | null> {
    const key = `embedding:${Buffer.from(text).toString('base64').substring(0, 50)}`;
    return await this.get(key);
  }

  // Session management
  async setUserSession(sessionId: string, data: any, ttl: number = 3600): Promise<void> {
    const key = `session:${sessionId}`;
    await this.set(key, data, ttl);
  }

  async getUserSession(sessionId: string): Promise<any> {
    const key = `session:${sessionId}`;
    return await this.get(key);
  }

  async deleteUserSession(sessionId: string): Promise<void> {
    const key = `session:${sessionId}`;
    await this.del(key);
  }
}

// Initialize connection when needed
function initializeRedisEvents() {
  if (typeof process !== 'undefined' && process.env.NODE_ENV && typeof window === 'undefined') {
    const redisClient = getRedisClient();

    redisClient.on('connect', () => {
      console.log('Redis connected successfully');
    });

    redisClient.on('error', (error) => {
      console.error('Redis connection error:', error);
    });
  }
}

// Initialize events on first access
let eventsInitialized = false;
function ensureEventsInitialized() {
  if (!eventsInitialized) {
    initializeRedisEvents();
    eventsInitialized = true;
  }
}

// Graceful shutdown
if (typeof process !== 'undefined' && process.env.NODE_ENV && typeof window === 'undefined') {
  process.on('SIGINT', async () => {
    try {
      await getRedisClient().quit();
      await getRedisSubscriber().quit();
      await crawlQueue.close();
      await auditQueue.close();
      await embeddingQueue.close();
    } catch (error) {
      console.error('Error during graceful shutdown:', error);
    }
    process.exit(0);
  });
}

export default {
  get redis() {
    ensureEventsInitialized();
    return getRedisClient();
  },
};
