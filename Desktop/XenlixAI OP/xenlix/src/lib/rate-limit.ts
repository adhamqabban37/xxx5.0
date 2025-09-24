interface RateLimitOptions {
  interval: number; // Time window in milliseconds
  uniqueTokenPerInterval: number; // Maximum number of unique tokens per interval
}

interface RateLimitData {
  count: number;
  resetTime: number;
}

class RateLimit {
  private cache = new Map<string, RateLimitData>();
  private options: RateLimitOptions;

  constructor(options: RateLimitOptions) {
    this.options = options;
    
    // Clean up expired entries every 5 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [key, data] of this.cache.entries()) {
        if (now > data.resetTime) {
          this.cache.delete(key);
        }
      }
    }, 5 * 60 * 1000);
  }

  async check(limit: number, token: string): Promise<void> {
    const now = Date.now();
    const key = `${token}:${Math.floor(now / this.options.interval)}`;
    
    const current = this.cache.get(key) || {
      count: 0,
      resetTime: now + this.options.interval
    };

    if (current.count >= limit) {
      const error = new Error('Rate limit exceeded');
      (error as any).status = 429;
      throw error;
    }

    current.count++;
    this.cache.set(key, current);
  }

  getStatus(token: string): { count: number; remaining: number; resetTime: number } {
    const now = Date.now();
    const key = `${token}:${Math.floor(now / this.options.interval)}`;
    
    const current = this.cache.get(key) || {
      count: 0,
      resetTime: now + this.options.interval
    };

    return {
      count: current.count,
      remaining: Math.max(0, this.options.uniqueTokenPerInterval - current.count),
      resetTime: current.resetTime
    };
  }
}

export function rateLimit(options: RateLimitOptions) {
  return new RateLimit(options);
}