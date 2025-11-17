/**
 * Phase 4: Job Idempotency Manager
 * Prevents duplicate scans for same {userId, domain} at a time
 *
 * UPDATED: Now uses shared Redis client from redis-client.ts
 * - Eliminates redundant Redis connections
 * - Consistent error handling and retry strategy
 * - Proper connection lifecycle management
 */

import { getRedisClient, ensureRedisConnection } from './redis-client';

const LOCK_TTL = 300; // 5 minutes max lock duration
const LOCK_PREFIX = 'job:lock:';

/**
 * Generate lock key for job
 */
function getLockKey(userId: string, domain: string): string {
  // Normalize domain
  const normalizedDomain = domain
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');
  return `${LOCK_PREFIX}${userId}:${normalizedDomain}`;
}

export async function acquireJobLock(
  userId: string,
  domain: string,
  jobId: string
): Promise<{ success: boolean; existingJobId?: string }> {
  const lockKey = getLockKey(userId, domain);
  const redis = getRedisClient();

  if (!redis) {
    // No Redis available - allow job to proceed (best effort)
    console.warn('[Job Idempotency] Redis unavailable, skipping lock check');
    return { success: true };
  }

  try {
    // Ensure connected before attempting lock
    const connected = await ensureRedisConnection();
    if (!connected) {
      console.warn('[Job Idempotency] Redis connection failed, skipping lock check');
      return { success: true };
    }

    // Try to set key only if it doesn't exist (NX) with expiry
    const result = await redis.set(lockKey, jobId, 'EX', LOCK_TTL, 'NX');

    if (result === 'OK') {
      console.log('[Job Idempotency] Lock acquired', {
        userId,
        domain,
        jobId,
        lockKey,
      });
      return { success: true };
    }

    // Lock already exists - get existing job ID
    const existingJobId = await redis.get(lockKey);
    console.warn('[Job Idempotency] Lock denied - duplicate scan in progress', {
      userId,
      domain,
      requestedJobId: jobId,
      existingJobId,
      lockKey,
    });

    return { success: false, existingJobId: existingJobId || undefined };
  } catch (error) {
    console.error('[Job Idempotency] Lock acquisition error:', error);
    // On error, allow job to proceed (fail-open for availability)
    return { success: true };
  }
}

/**
 * Release job lock
 */
export async function releaseJobLock(userId: string, domain: string, jobId: string): Promise<void> {
  const lockKey = getLockKey(userId, domain);
  const redis = getRedisClient();

  if (!redis) return;

  try {
    // Ensure connected before attempting unlock
    const connected = await ensureRedisConnection();
    if (!connected) {
      console.warn('[Job Idempotency] Redis connection failed, cannot release lock');
      return;
    }

    // Only delete if the lock belongs to this job (avoid race conditions)
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;

    const result = await redis.eval(script, 1, lockKey, jobId);

    if (result === 1) {
      console.log('[Job Idempotency] Lock released', {
        userId,
        domain,
        jobId,
        lockKey,
      });
    } else {
      console.warn('[Job Idempotency] Lock not released (already expired or different job)', {
        userId,
        domain,
        jobId,
        lockKey,
      });
    }
  } catch (error) {
    console.error('[Job Idempotency] Lock release error:', error);
  }
}

/**
 * Check if job lock exists for user/domain
 */
export async function checkJobLock(
  userId: string,
  domain: string
): Promise<{ locked: boolean; jobId?: string; ttl?: number }> {
  const lockKey = getLockKey(userId, domain);
  const redis = getRedisClient();

  if (!redis) {
    return { locked: false };
  }

  try {
    // Ensure connected before checking lock
    const connected = await ensureRedisConnection();
    if (!connected) {
      return { locked: false };
    }

    const [jobId, ttl] = await Promise.all([redis.get(lockKey), redis.ttl(lockKey)]);

    if (jobId) {
      return {
        locked: true,
        jobId,
        ttl: ttl > 0 ? ttl : undefined,
      };
    }

    return { locked: false };
  } catch (error) {
    console.error('[Job Idempotency] Lock check error:', error);
    return { locked: false };
  }
}
