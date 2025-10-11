// CRON job endpoint with authentication and concurrency controls
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for cron job requests
const cronJobSchema = z.object({
  secret: z.string(),
  jobs: z
    .array(z.enum(['snapshots', 'alerts', 'cleanup']))
    .optional()
    .default(['snapshots']),
  force: z.boolean().optional().default(false), // Force run even if already running
});

// Global state for tracking running jobs
const runningJobs = new Map<
  string,
  {
    id: string;
    type: string;
    startTime: Date;
    status: 'running' | 'completed' | 'failed';
    progress: number;
    error?: string;
  }
>();

// Concurrency limits
const MAX_CONCURRENT_JOBS = 3;
const JOB_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request
    const body = await request.json();
    const validation = cronJobSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { secret, jobs, force } = validation.data;

    // Authenticate with CRON_SECRET
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      console.error('CRON_SECRET not configured');
      return NextResponse.json({ error: 'Cron system not configured' }, { status: 500 });
    }

    if (secret !== cronSecret) {
      console.warn('Invalid CRON_SECRET attempted');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check concurrency limits
    const currentlyRunning = Array.from(runningJobs.values()).filter(
      (job) => job.status === 'running'
    );

    if (currentlyRunning.length >= MAX_CONCURRENT_JOBS && !force) {
      return NextResponse.json(
        {
          error: 'Concurrency limit reached',
          message: `Maximum ${MAX_CONCURRENT_JOBS} jobs can run concurrently`,
          runningJobs: currentlyRunning.map((job) => ({
            id: job.id,
            type: job.type,
            startTime: job.startTime,
            progress: job.progress,
          })),
        },
        { status: 429 }
      );
    }

    // Clean up stale jobs (older than timeout)
    const now = new Date();
    for (const [jobId, job] of runningJobs.entries()) {
      if (now.getTime() - job.startTime.getTime() > JOB_TIMEOUT_MS) {
        job.status = 'failed';
        job.error = 'Job timeout';
        console.warn(`Job ${jobId} timed out and was marked as failed`);
      }
    }

    // Execute requested jobs
    const results = [];

    for (const jobType of jobs) {
      // Check if this job type is already running
      const existingJob = Array.from(runningJobs.values()).find(
        (job) => job.type === jobType && job.status === 'running'
      );

      if (existingJob && !force) {
        results.push({
          type: jobType,
          status: 'skipped',
          message: `Job type ${jobType} is already running`,
          existingJobId: existingJob.id,
        });
        continue;
      }

      // Create new job instance
      const jobId = `${jobType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const jobInstance: {
        id: string;
        type: string;
        startTime: Date;
        status: 'running' | 'completed' | 'failed';
        progress: number;
        error?: string;
      } = {
        id: jobId,
        type: jobType,
        startTime: new Date(),
        status: 'running',
        progress: 0,
      };

      runningJobs.set(jobId, jobInstance);

      try {
        // Execute the job asynchronously
        const jobResult = await executeJob(jobType, jobId);

        // Update job status
        jobInstance.status = 'completed';
        jobInstance.progress = 100;

        results.push({
          type: jobType,
          status: 'completed',
          jobId,
          result: jobResult,
          duration: Date.now() - jobInstance.startTime.getTime(),
        });
      } catch (error) {
        // Update job status
        jobInstance.status = 'failed';
        jobInstance.error = error instanceof Error ? error.message : 'Unknown error';

        console.error(`Job ${jobId} failed:`, error);

        results.push({
          type: jobType,
          status: 'failed',
          jobId,
          error: jobInstance.error,
          duration: Date.now() - jobInstance.startTime.getTime(),
        });
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
      runningJobs: Array.from(runningJobs.values())
        .filter((job) => job.status === 'running')
        .map((job) => ({
          id: job.id,
          type: job.type,
          startTime: job.startTime,
          progress: job.progress,
        })),
    });
  } catch (error) {
    console.error('Cron endpoint error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET endpoint for checking job status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    // Authenticate with CRON_SECRET
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || secret !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Clean up completed jobs older than 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    for (const [jobId, job] of runningJobs.entries()) {
      if (job.status !== 'running' && job.startTime < oneHourAgo) {
        runningJobs.delete(jobId);
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      jobs: Array.from(runningJobs.values()).map((job) => ({
        id: job.id,
        type: job.type,
        status: job.status,
        startTime: job.startTime,
        progress: job.progress,
        error: job.error,
      })),
      stats: {
        total: runningJobs.size,
        running: Array.from(runningJobs.values()).filter((j) => j.status === 'running').length,
        completed: Array.from(runningJobs.values()).filter((j) => j.status === 'completed').length,
        failed: Array.from(runningJobs.values()).filter((j) => j.status === 'failed').length,
      },
    });
  } catch (error) {
    console.error('Cron status endpoint error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Job execution function
async function executeJob(jobType: string, jobId: string): Promise<any> {
  const job = runningJobs.get(jobId);
  if (!job) throw new Error('Job not found');

  console.log(`Starting job ${jobId} of type ${jobType}`);

  switch (jobType) {
    case 'snapshots':
      return await runSnapshotCollection(job);

    case 'alerts':
      return await runAlertChecks(job);

    case 'cleanup':
      return await runCleanupTasks(job);

    default:
      throw new Error(`Unknown job type: ${jobType}`);
  }
}

// Snapshot collection job
async function runSnapshotCollection(job: any): Promise<any> {
  const { SnapshotWriter } = await import('@/lib/snapshot-writer');
  const snapshotWriter = new SnapshotWriter();

  job.progress = 10;

  // Get all monitored URLs (this should come from your database)
  const urls = await getMonitoredUrls();

  const results = {
    psi: { collected: 0, failed: 0 },
    opr: { collected: 0, failed: 0 },
    schema: { collected: 0, failed: 0 },
  };

  const totalTasks = urls.length * 3; // 3 tasks per URL
  let completedTasks = 0;

  for (const url of urls) {
    try {
      // PSI Snapshot
      await snapshotWriter.savePSISnapshot(url);
      results.psi.collected++;
      completedTasks++;
      job.progress = Math.round((completedTasks / totalTasks) * 80) + 10; // 10-90%

      // OPR Snapshot
      await snapshotWriter.saveOPRSnapshot(url);
      results.opr.collected++;
      completedTasks++;
      job.progress = Math.round((completedTasks / totalTasks) * 80) + 10;

      // Schema Snapshot
      await snapshotWriter.saveSchemaSnapshot(url);
      results.schema.collected++;
      completedTasks++;
      job.progress = Math.round((completedTasks / totalTasks) * 80) + 10;
    } catch (error) {
      console.error(`Failed to collect snapshots for ${url}:`, error);
      results.psi.failed++;
      results.opr.failed++;
      results.schema.failed++;
      completedTasks += 3;
    }
  }

  job.progress = 95;

  // Trigger alert checks after snapshot collection
  try {
    await runAlertChecks(job, true); // silent mode
  } catch (alertError) {
    console.warn('Alert checks failed after snapshot collection:', alertError);
  }

  job.progress = 100;

  return {
    message: 'Snapshot collection completed',
    urls: urls.length,
    results,
    timestamp: new Date().toISOString(),
  };
}

// Alert checking job
async function runAlertChecks(job: any, silent = false): Promise<any> {
  const { AlertManager } = await import('@/lib/alert-manager');
  const alertManager = new AlertManager();

  job.progress = 20;

  const alertResults = await alertManager.checkAllThresholds();

  job.progress = 80;

  if (!silent) {
    await alertManager.sendPendingAlerts();
  }

  job.progress = 100;

  return {
    message: 'Alert checks completed',
    ...alertResults,
    timestamp: new Date().toISOString(),
  };
}

// Cleanup job
async function runCleanupTasks(job: any): Promise<any> {
  job.progress = 25;

  // Clean up old snapshots (keep last 30 days)
  const { SnapshotWriter } = await import('@/lib/snapshot-writer');
  const snapshotWriter = new SnapshotWriter();
  const cleanupResults = await snapshotWriter.cleanupOldSnapshots(30);

  job.progress = 50;

  // Clean up old logs
  const logCleanup = await cleanupOldLogs();

  job.progress = 75;

  // Clean up expired sessions, etc.
  const miscCleanup = await cleanupMiscData();

  job.progress = 100;

  return {
    message: 'Cleanup completed',
    snapshots: cleanupResults,
    logs: logCleanup,
    misc: miscCleanup,
    timestamp: new Date().toISOString(),
  };
}

// Helper functions
async function getMonitoredUrls(): Promise<string[]> {
  // This should query your database for URLs to monitor
  // For now, return a default set
  return ['https://example.com', 'https://example.com/about', 'https://example.com/services'];
}

async function cleanupOldLogs(): Promise<any> {
  // Implement log cleanup logic
  return { cleaned: 0, errors: 0 };
}

async function cleanupMiscData(): Promise<any> {
  // Implement misc cleanup logic
  return { cleaned: 0, errors: 0 };
}
