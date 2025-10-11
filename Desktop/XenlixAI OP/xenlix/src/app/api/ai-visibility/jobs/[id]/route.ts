/**
 * AI Visibility Job Status API Route
 * GET /api/ai-visibility/jobs/[id] - Get status of a collection job
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrchestrator } from '@/lib/ai-visibility/orchestrator';
import { logger } from '@/lib/logger';

interface RouteParams {
  params: { id: string };
}

/**
 * GET /api/ai-visibility/jobs/[id]
 * Get status and details of a specific collection job
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const jobId = params.id;

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    const orchestrator = getOrchestrator();
    const jobStatus = await orchestrator.getJobStatus(jobId);

    if (!jobStatus) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Transform job status for API response
    const response = {
      job_id: jobStatus.id,
      name: jobStatus.name,
      data: jobStatus.data,
      progress: jobStatus.progress || 0,
      status: getJobStatusText(jobStatus),
      created_at: jobStatus.opts?.timestamp
        ? new Date(jobStatus.opts.timestamp).toISOString()
        : null,
      started_at: jobStatus.processedOn ? new Date(jobStatus.processedOn).toISOString() : null,
      completed_at: jobStatus.finishedOn ? new Date(jobStatus.finishedOn).toISOString() : null,
      failed_reason: jobStatus.failedReason || null,
      result: jobStatus.returnvalue || null,
      attempts: jobStatus.opts?.attempts || 0,
      max_attempts: jobStatus.opts?.attempts || 3,
    };

    logger.info('Job status retrieved', {
      job_id: jobId,
      status: response.status,
      progress: response.progress,
    });

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Failed to get job status', error as Error, {
      job_id: params.id,
    });
    return NextResponse.json({ error: 'Failed to retrieve job status' }, { status: 500 });
  }
}

function getJobStatusText(job: any): string {
  if (job.finishedOn && !job.failedReason) {
    return 'completed';
  }
  if (job.failedReason) {
    return 'failed';
  }
  if (job.processedOn) {
    return 'running';
  }
  return 'waiting';
}
