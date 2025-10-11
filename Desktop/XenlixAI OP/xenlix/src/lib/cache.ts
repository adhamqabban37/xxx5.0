import { CacheService } from './redis';

// Mock Redis service for development when Redis server is not available
class MockCacheService extends CacheService {
  private cache = new Map<string, { value: any; expires: number }>();
  private static mockInstance: MockCacheService;

  static getInstance(): MockCacheService {
    if (!MockCacheService.mockInstance) {
      MockCacheService.mockInstance = new MockCacheService();
    }
    return MockCacheService.mockInstance;
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    const expires = Date.now() + ttl * 1000;
    this.cache.set(key, { value, expires });
    console.log(`[MockCache] Set key: ${key} (TTL: ${ttl}s)`);
  }

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    console.log(`[MockCache] Get key: ${key}`);
    return item.value;
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
    console.log(`[MockCache] Delete key: ${key}`);
  }

  async exists(key: string): Promise<boolean> {
    const exists = this.cache.has(key);
    console.log(`[MockCache] Exists key: ${key} = ${exists}`);
    return exists;
  }
}

// Mock job queue for development
export class MockJobQueue {
  private jobs = new Map<string, any>();

  constructor(private name: string) {}

  async add(name: string, data: any, options?: any): Promise<{ id: string }> {
    const id = `${Date.now()}-${Math.random()}`;
    this.jobs.set(id, { name, data, options, status: 'waiting' });
    console.log(`[MockQueue:${this.name}] Added job: ${name} (ID: ${id})`);

    // Simulate async processing
    setTimeout(() => {
      const job = this.jobs.get(id);
      if (job) {
        job.status = 'completed';
        console.log(`[MockQueue:${this.name}] Job completed: ${name} (ID: ${id})`);
      }
    }, 1000);

    return { id };
  }

  async process(processor: (job: any) => Promise<void>): Promise<void> {
    console.log(`[MockQueue:${this.name}] Process handler registered`);
  }

  async close(): Promise<void> {
    this.jobs.clear();
    console.log(`[MockQueue:${this.name}] Queue closed`);
  }
}

// Development-safe Redis client
export function createRedisClient() {
  try {
    // Import environment config
    const { getEnvironmentConfig, isServiceAvailable } = require('./env-config');

    if (!isServiceAvailable('redis')) {
      return null;
    }

    // Try to create real Redis connection
    const Redis = require('ioredis');
    const envConfig = getEnvironmentConfig();
    const redis = new Redis({
      host: envConfig.redis.host,
      port: envConfig.redis.port,
      password: envConfig.redis.password,
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });

    // Test connection
    redis
      .ping()
      .then(() => {
        console.log('✅ Redis connected successfully');
      })
      .catch(() => {
        console.warn('⚠️  Redis server not available, using mock cache');
      });

    return redis;
  } catch (error) {
    console.warn('⚠️  Redis not available, using mock cache service');
    return null;
  }
}

// Export cache service (real or mock)
export function getCacheService(): CacheService {
  const redisAvailable = process.env.REDIS_URL && process.env.NODE_ENV === 'production';

  if (redisAvailable) {
    try {
      return CacheService.getInstance();
    } catch {
      console.warn('Falling back to mock cache service');
      return MockCacheService.getInstance();
    }
  }

  return MockCacheService.getInstance();
}

// Export job queues (real or mock)
export function createJobQueue(name: string) {
  const redisAvailable = process.env.REDIS_URL && process.env.NODE_ENV === 'production';

  if (redisAvailable) {
    try {
      const { Queue } = require('bullmq');
      return new Queue(name, { connection: process.env.REDIS_URL });
    } catch {
      console.warn(`Falling back to mock queue for: ${name}`);
      return new MockJobQueue(name);
    }
  }

  return new MockJobQueue(name);
}
