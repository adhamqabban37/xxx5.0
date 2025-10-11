interface RateLimitOptions {
  interval: number; // Time window in milliseconds
  uniqueTokenPerInterval: number; // Maximum number of unique tokens per interval
}

interface RateLimitData {
  count: number;
  resetTime: number;
}

// PSI-specific rate limiting configuration
export const PSI_RATE_LIMITS = {
  // Conservative daily quota management (100 requests/day typical free tier)
  daily: {
    interval: 24 * 60 * 60 * 1000, // 24 hours
    maxRequests: 80, // Leave buffer for other usage
  },

  // Per-hour limits to prevent burst usage
  hourly: {
    interval: 60 * 60 * 1000, // 1 hour
    maxRequests: 20,
  },

  // Per-IP rate limiting for validation API
  validation: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 validations per minute per IP
  },
};

// Enhanced rate limiter for PSI quotas
export class PSIRateLimit {
  private cache = new Map<string, RateLimitData>();

  constructor() {
    // Clean up expired entries every 5 minutes
    setInterval(
      () => {
        const now = Date.now();
        for (const [key, data] of this.cache.entries()) {
          if (now > data.resetTime) {
            this.cache.delete(key);
          }
        }
      },
      5 * 60 * 1000
    );
  }

  async checkPSIQuota(
    ip: string
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = Date.now();

    // Check hourly limit
    const hourlyKey = `psi:hourly:${ip}:${Math.floor(now / PSI_RATE_LIMITS.hourly.interval)}`;
    const hourlyData = this.cache.get(hourlyKey) || {
      count: 0,
      resetTime: now + PSI_RATE_LIMITS.hourly.interval,
    };

    if (hourlyData.count >= PSI_RATE_LIMITS.hourly.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: hourlyData.resetTime,
      };
    }

    // Check daily limit
    const dailyKey = `psi:daily:${ip}:${Math.floor(now / PSI_RATE_LIMITS.daily.interval)}`;
    const dailyData = this.cache.get(dailyKey) || {
      count: 0,
      resetTime: now + PSI_RATE_LIMITS.daily.interval,
    };

    if (dailyData.count >= PSI_RATE_LIMITS.daily.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: dailyData.resetTime,
      };
    }

    // Increment counters (for both mobile + desktop = 2 requests)
    hourlyData.count += 2;
    dailyData.count += 2;

    this.cache.set(hourlyKey, hourlyData);
    this.cache.set(dailyKey, dailyData);

    return {
      allowed: true,
      remaining: Math.min(
        PSI_RATE_LIMITS.hourly.maxRequests - hourlyData.count,
        PSI_RATE_LIMITS.daily.maxRequests - dailyData.count
      ),
      resetTime: Math.min(hourlyData.resetTime, dailyData.resetTime),
    };
  }

  async checkValidationRate(
    ip: string
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = Date.now();
    const key = `validation:${ip}:${Math.floor(now / PSI_RATE_LIMITS.validation.interval)}`;

    const data = this.cache.get(key) || {
      count: 0,
      resetTime: now + PSI_RATE_LIMITS.validation.interval,
    };

    if (data.count >= PSI_RATE_LIMITS.validation.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: data.resetTime,
      };
    }

    data.count++;
    this.cache.set(key, data);

    return {
      allowed: true,
      remaining: PSI_RATE_LIMITS.validation.maxRequests - data.count,
      resetTime: data.resetTime,
    };
  }
}

// Global PSI rate limiter instance
export const psiRateLimit = new PSIRateLimit();

class RateLimit {
  private cache = new Map<string, RateLimitData>();
  private options: RateLimitOptions;

  constructor(options: RateLimitOptions) {
    this.options = options;

    // Clean up expired entries every 5 minutes
    setInterval(
      () => {
        const now = Date.now();
        for (const [key, data] of this.cache.entries()) {
          if (now > data.resetTime) {
            this.cache.delete(key);
          }
        }
      },
      5 * 60 * 1000
    );
  }

  async check(limit: number, token: string): Promise<void> {
    const now = Date.now();
    const key = `${token}:${Math.floor(now / this.options.interval)}`;

    const current = this.cache.get(key) || {
      count: 0,
      resetTime: now + this.options.interval,
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
      resetTime: now + this.options.interval,
    };

    return {
      count: current.count,
      remaining: Math.max(0, this.options.uniqueTokenPerInterval - current.count),
      resetTime: current.resetTime,
    };
  }
}

export function rateLimit(options: RateLimitOptions) {
  return new RateLimit(options);
}
