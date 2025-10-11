import Redis from 'ioredis';
import { Queue } from 'bullmq';
import { getEnvironmentConfig } from './env-config';

// Get Redis configuration from environment
const envConfig = getEnvironmentConfig();
const redisConfig = {
  host: envConfig.redis.host,
  port: envConfig.redis.port,
  password: envConfig.redis.password,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
};

// Create Redis clients
export const redis = new Redis(redisConfig);
export const redisSubscriber = new Redis(redisConfig);

// Job Queues (using BullMQ)
export const crawlQueue = new Queue('crawl jobs', {
  connection: redisConfig,
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

export const auditQueue = new Queue('audit jobs', {
  connection: redisConfig,
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

export const embeddingQueue = new Queue('embedding jobs', {
  connection: redisConfig,
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
      await redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Redis cache set error:', error);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis cache get error:', error);
      return null;
    }
  }

  async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      console.error('Redis cache delete error:', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      return (await redis.exists(key)) === 1;
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

// Initialize connection
redis.on('connect', () => {
  console.log('Redis connected successfully');
});

redis.on('error', (error) => {
  console.error('Redis connection error:', error);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await redis.quit();
  await redisSubscriber.quit();
  await crawlQueue.close();
  await auditQueue.close();
  await embeddingQueue.close();
  process.exit(0);
});

export default redis;
