/**
 * Unified Redis Client Manager
 *
 * PROBLEM SOLVED:
 * - Multiple Redis clients being created across the codebase
 * - "Stream isn't writeable and enableOfflineQueue is false" errors
 * - Inconsistent retry strategies
 * - Connection instability causing job lock failures
 *
 * SOLUTION:
 * - Single shared Redis client per runtime (singleton pattern)
 * - Proper connection lifecycle management
 * - Graceful degradation when Redis unavailable
 * - Consistent retry strategy across all usage
 */

import Redis, { RedisOptions } from 'ioredis';
import { getEnvironmentConfig } from './env-config';

interface RedisClientManager {
  client: Redis | null;
  isConnected: boolean;
  isConnecting: boolean;
  connectionAttempts: number;
  lastError: Error | null;
  maxConnectionAttempts: number;
}

// Singleton instance
let redisManager: RedisClientManager | null = null;

// Configuration
const MAX_CONNECTION_ATTEMPTS = 3;
const CONNECTION_TIMEOUT = 10000; // 10 seconds
const RETRY_DELAY_BASE = 1000; // 1 second base delay
const MAX_RETRY_DELAY = 5000; // 5 seconds max delay

/**
 * Check if we should skip Redis initialization
 */
function shouldSkipRedis(): boolean {
  // Skip during build
  if (
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.NEXT_PHASE === 'phase-export' ||
    process.env.NEXT_BUILD === 'true'
  ) {
    return true;
  }

  // Skip if no Redis URL configured
  if (!process.env.REDIS_URL && !process.env.UPSTASH_REDIS_REST_URL) {
    return true;
  }

  // Skip if explicitly disabled
  if (process.env.REDIS_DISABLED === '1') {
    return true;
  }

  // Skip in browser context
  if (typeof window !== 'undefined') {
    return true;
  }

  return false;
}

/**
 * Get optimal Redis configuration based on environment
 */
function getRedisOptions(): RedisOptions {
  const envConfig = getEnvironmentConfig();
  const isDev = envConfig.app.nodeEnv === 'development' || envConfig.app.nodeEnv === 'test';

  return {
    host: envConfig.redis.host,
    port: envConfig.redis.port,
    password: envConfig.redis.password || undefined,

    // Connection behavior
    lazyConnect: true, // Don't connect immediately - connect on first use
    connectTimeout: CONNECTION_TIMEOUT,

    // Retry strategy - exponential backoff
    retryStrategy: (times: number) => {
      // In dev mode, give up faster
      if (isDev && times > 2) {
        console.warn('[Redis] Connection failed after 2 attempts in dev mode');
        return null; // Stop retrying
      }

      // In production, retry with exponential backoff
      if (times > MAX_CONNECTION_ATTEMPTS) {
        console.error('[Redis] Connection failed after max attempts');
        return null; // Stop retrying
      }

      const delay = Math.min(times * RETRY_DELAY_BASE, MAX_RETRY_DELAY);
      console.log(`[Redis] Retrying connection in ${delay}ms (attempt ${times})`);
      return delay;
    },

    // Critical: Enable offline queue to buffer commands during reconnection
    // This prevents "Stream isn't writeable" errors
    enableOfflineQueue: true,

    // For BullMQ compatibility
    maxRetriesPerRequest: null,

    // Connection ready check
    enableReadyCheck: true,

    // Keep connection alive
    keepAlive: 30000, // 30 seconds

    // Reconnect on error
    reconnectOnError: (err) => {
      const targetError = 'READONLY';
      if (err.message.includes(targetError)) {
        // Reconnect on READONLY errors (Redis failover)
        return true;
      }
      return false;
    },
  };
}

/**
 * Initialize Redis client with proper error handling
 */
function initializeRedisClient(): Redis | null {
  if (shouldSkipRedis()) {
    console.log('[Redis] Skipping initialization (not configured or disabled)');
    return null;
  }

  try {
    const options = getRedisOptions();
    const client = new Redis(options);

    // Connection event handlers
    client.on('connect', () => {
      console.log('✅ [Redis] Connected successfully');
      if (redisManager) {
        redisManager.isConnected = true;
        redisManager.isConnecting = false;
        redisManager.connectionAttempts = 0;
        redisManager.lastError = null;
      }
    });

    client.on('ready', () => {
      console.log('✅ [Redis] Client ready');
    });

    client.on('error', (error) => {
      // Suppress noisy errors in dev mode after first failure
      const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
      const shouldLog = !isDev || (redisManager && redisManager.connectionAttempts < 2);

      if (shouldLog) {
        console.warn('⚠️  [Redis] Connection error:', error.message);
      }

      if (redisManager) {
        redisManager.isConnected = false;
        redisManager.lastError = error;
        redisManager.connectionAttempts++;
      }
    });

    client.on('close', () => {
      const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
      if (!isDev || (redisManager && redisManager.isConnected)) {
        console.log('⚠️  [Redis] Connection closed');
      }

      if (redisManager) {
        redisManager.isConnected = false;
        redisManager.isConnecting = false;
      }
    });

    client.on('reconnecting', (delay: number) => {
      console.log(`🔄 [Redis] Reconnecting in ${delay}ms`);
      if (redisManager) {
        redisManager.isConnecting = true;
      }
    });

    client.on('end', () => {
      console.log('[Redis] Connection ended');
      if (redisManager) {
        redisManager.isConnected = false;
        redisManager.isConnecting = false;
      }
    });

    return client;
  } catch (error) {
    console.error('[Redis] Failed to initialize client:', error);
    return null;
  }
}

/**
 * Get or create Redis client singleton
 */
export function getRedisClient(): Redis | null {
  if (!redisManager) {
    redisManager = {
      client: initializeRedisClient(),
      isConnected: false,
      isConnecting: false,
      connectionAttempts: 0,
      lastError: null,
      maxConnectionAttempts: MAX_CONNECTION_ATTEMPTS,
    };
  }

  return redisManager.client;
}

/**
 * Get Redis connection status
 */
export function getRedisStatus() {
  if (!redisManager || !redisManager.client) {
    return {
      available: false,
      connected: false,
      status: 'not_configured',
      error: null,
      attempts: 0,
    };
  }

  return {
    available: true,
    connected: redisManager.isConnected,
    status: redisManager.client.status,
    error: redisManager.lastError?.message || null,
    attempts: redisManager.connectionAttempts,
  };
}

/**
 * Ensure Redis is connected before using
 * Returns true if connected or connection succeeded
 * Returns false if connection failed and Redis is unavailable
 */
export async function ensureRedisConnection(): Promise<boolean> {
  const client = getRedisClient();

  if (!client) {
    return false; // Redis not configured
  }

  // Already connected
  if (redisManager && redisManager.isConnected && client.status === 'ready') {
    return true;
  }

  // Already connecting
  if (redisManager && redisManager.isConnecting) {
    // Wait for connection to complete (with timeout)
    try {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Connection timeout')), 5000);

        const checkConnection = () => {
          if (client.status === 'ready') {
            clearTimeout(timeout);
            resolve();
          } else if (client.status === 'end' || client.status === 'close') {
            clearTimeout(timeout);
            reject(new Error('Connection failed'));
          } else {
            setTimeout(checkConnection, 100);
          }
        };

        checkConnection();
      });
      return true;
    } catch (error) {
      console.warn('[Redis] Connection wait failed:', error);
      return false;
    }
  }

  // Try to connect
  try {
    if (redisManager) {
      redisManager.isConnecting = true;
    }

    await client.connect();
    return true;
  } catch (error) {
    console.warn('[Redis] Connection failed:', error);
    if (redisManager) {
      redisManager.isConnecting = false;
    }
    return false;
  }
}

/**
 * Perform Redis health check
 */
export async function checkRedisHealth(): Promise<{
  healthy: boolean;
  latency?: number;
  error?: string;
}> {
  const client = getRedisClient();

  if (!client) {
    return {
      healthy: false,
      error: 'Redis not configured',
    };
  }

  try {
    const startTime = Date.now();

    // Try to connect if not connected
    const connected = await ensureRedisConnection();
    if (!connected) {
      return {
        healthy: false,
        error: 'Connection failed',
      };
    }

    // Ping with timeout
    await Promise.race([
      client.ping(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Ping timeout')), 2000)),
    ]);

    const latency = Date.now() - startTime;

    return {
      healthy: true,
      latency,
    };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Gracefully disconnect Redis client
 */
export async function disconnectRedis(): Promise<void> {
  if (redisManager && redisManager.client) {
    try {
      await redisManager.client.quit();
      console.log('[Redis] Disconnected gracefully');
    } catch (error) {
      console.warn('[Redis] Error during disconnect:', error);
    } finally {
      redisManager.client = null;
      redisManager.isConnected = false;
      redisManager.isConnecting = false;
    }
  }
}

// Graceful shutdown handler
if (typeof process !== 'undefined' && typeof window === 'undefined') {
  process.on('SIGINT', async () => {
    await disconnectRedis();
  });

  process.on('SIGTERM', async () => {
    await disconnectRedis();
  });
}

// Export default client for convenience
export default {
  getClient: getRedisClient,
  getStatus: getRedisStatus,
  ensureConnection: ensureRedisConnection,
  checkHealth: checkRedisHealth,
  disconnect: disconnectRedis,
};
