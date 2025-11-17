import { Queue, QueueEvents } from 'bullmq';
import { getRedisClient, ensureRedisConnection, getRedisStatus } from '../redis-client';
import { PremiumScanPayload, PremiumScanPayloadSchema, JobStatus } from './types';

// Use shared Redis client from redis-client.ts
const connection = getRedisClient();

// Check if Redis is available
function isRedisAvailable(): boolean {
  const status = getRedisStatus();
  return status.available && status.connected;
}

// Queue configuration (only if Redis available)
let premiumScanQueue: Queue | null = null;
let queueEvents: QueueEvents | null = null;

if (connection) {
  try {
    premiumScanQueue = new Queue('premium-scan', {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: 500,
      },
    });

    queueEvents = new QueueEvents('premium-scan', { connection });
  } catch (error) {
    console.error('[Queue] Failed to initialize BullMQ queue:', error);
    premiumScanQueue = null;
    queueEvents = null;
  }
}

export { premiumScanQueue, queueEvents };

// Global job queue interface for compatibility
export const globalJobQueue = {
  addJob: async (
    type: string,
    data: Record<string, unknown>,
    options?: { priority?: number; timeout?: number; maxAttempts?: number }
  ): Promise<string> => {
    // Check if Redis/Queue is available
    if (!connection || !premiumScanQueue || !isRedisAvailable()) {
      throw new Error(
        'Premium scan service is temporarily unavailable. Please ensure Redis is running or start Docker services.'
      );
    }

    try {
      // Ensure Redis is connected
      await ensureRedisConnection();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const job = await premiumScanQueue.add(type, data as any, {
        priority: options?.priority || 5,
        attempts: options?.maxAttempts || 3,
      });
      return job.id || '';
    } catch (error) {
      console.error('[Queue] Failed to add job:', error);
      throw new Error(
        `Queue service unavailable: ${error instanceof Error ? error.message : 'Redis connection failed'}`
      );
    }
  },

  getJob: async (jobId: string) => {
    return getJob(jobId);
  },

  // Health check methods
  getMetrics: async () => {
    if (!premiumScanQueue) throw new Error('Queue not available');
    const counts = await premiumScanQueue.getJobCounts();
    return {
      waiting: counts.waiting || 0,
      active: counts.active || 0,
      completed: counts.completed || 0,
      failed: counts.failed || 0,
      delayed: counts.delayed || 0,
    };
  },

  getStalledCount: async () => {
    if (!premiumScanQueue) return 0;
    const jobs = await premiumScanQueue.getJobs(['active']);
    return jobs.length;
  },

  getWaitingCount: async () => {
    if (!premiumScanQueue) return 0;
    return premiumScanQueue.getWaitingCount();
  },

  getActiveCount: async () => {
    if (!premiumScanQueue) return 0;
    return premiumScanQueue.getActiveCount();
  },

  getCompletedCount: async () => {
    if (!premiumScanQueue) return 0;
    return premiumScanQueue.getCompletedCount();
  },

  getFailedCount: async () => {
    if (!premiumScanQueue) return 0;
    return premiumScanQueue.getFailedCount();
  },
};

export async function enqueuePremiumScan(payload: PremiumScanPayload): Promise<string> {
  // Check if Redis/Queue is available
  if (!premiumScanQueue) {
    throw new Error('Premium scan queue is not available. Please ensure Redis is running.');
  }

  // Validate payload
  const validatedPayload = PremiumScanPayloadSchema.parse(payload);

  // Add job to queue
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const job = await premiumScanQueue.add('premium-scan', validatedPayload as any, {
    priority: getPriorityValue(validatedPayload.priority),
  });

  return job.id || '';
}

export async function getJob(jobId: string): Promise<JobStatus> {
  if (!premiumScanQueue) {
    throw new Error('Premium scan queue is not available. Please ensure Redis is running.');
  }

  const job = await premiumScanQueue.getJob(jobId);

  if (!job) {
    throw new Error('Job not found');
  }

  const state = await job.getState();
  const progress = typeof job.progress === 'number' ? job.progress : 0;
  const result = job.returnvalue as { resultId?: string } | undefined;
  const failedReason = job.failedReason;

  return {
    state: mapBullStateToScanState(state),
    progress,
    resultId: result?.resultId,
    error: failedReason,
  };
}

// Utility functions
function getPriorityValue(priority: 'low' | 'normal' | 'high'): number {
  switch (priority) {
    case 'high':
      return 1;
    case 'normal':
      return 2;
    case 'low':
      return 3;
  }
}

function mapBullStateToScanState(state: string): JobStatus['state'] {
  switch (state) {
    case 'completed':
      return 'succeeded';
    case 'failed':
    case 'stalled':
      return 'failed';
    case 'active':
      return 'running';
    case 'waiting':
    case 'delayed':
      return 'queued';
    default:
      return 'failed';
  }
}
