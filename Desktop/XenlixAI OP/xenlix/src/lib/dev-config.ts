/**
 * Development configuration for AEO Platform
 * Handles graceful fallbacks when services are not available
 */

export interface DevConfig {
  mockServices: {
    crawl4ai: boolean;
    redis: boolean;
    firebase: boolean;
  };
  fallbackData: {
    useLocalStorage: boolean;
    enableMockResponses: boolean;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enableRequestLogging: boolean;
  };
}

export const devConfig: DevConfig = {
  mockServices: {
    crawl4ai: process.env.NODE_ENV === 'development' && !process.env.CRAWL4AI_SERVICE_URL?.includes('production'),
    redis: process.env.NODE_ENV === 'development' && !process.env.UPSTASH_REDIS_REST_URL?.includes('upstash'),
    firebase: process.env.NODE_ENV === 'development' && !process.env.FIREBASE_PROJECT_ID?.includes('production'),
  },
  fallbackData: {
    useLocalStorage: process.env.NODE_ENV === 'development',
    enableMockResponses: process.env.NODE_ENV === 'development',
  },
  logging: {
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    enableRequestLogging: process.env.NODE_ENV === 'development',
  }
};

// Mock Redis implementation for development
export class MockRedisKV {
  private storage = new Map<string, any>();

  async get(key: string) {
    return this.storage.get(key) || null;
  }

  async set(key: string, value: any, options?: { ex?: number }) {
    this.storage.set(key, value);
    if (options?.ex) {
      setTimeout(() => this.storage.delete(key), options.ex * 1000);
    }
    return 'OK';
  }

  async del(key: string) {
    this.storage.delete(key);
    return 1;
  }

  async exists(key: string) {
    return this.storage.has(key) ? 1 : 0;
  }
}

// Mock rate limiter for development
export class MockRateLimit {
  private attempts = new Map<string, { count: number; resetTime: number }>();

  async check(limit: number, identifier: string) {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    
    const attempt = this.attempts.get(identifier);
    if (!attempt || now > attempt.resetTime) {
      this.attempts.set(identifier, { count: 1, resetTime: now + windowMs });
      return { success: true, remaining: limit - 1 };
    }
    
    if (attempt.count >= limit) {
      throw new Error('Rate limit exceeded');
    }
    
    attempt.count++;
    return { success: true, remaining: limit - attempt.count };
  }
}

export const createMockKV = () => new MockRedisKV();
export const createMockRateLimit = () => ({
  check: (identifier: string) => new MockRateLimit().check(10, identifier)
});

export default devConfig;