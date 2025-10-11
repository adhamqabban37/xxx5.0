/**
 * AI Visibility Collection Trigger API Route
 * POST /api/ai-visibility/collect - Manually trigger AI visibility collection
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { triggerManualCollection } from '@/lib/ai-visibility/orchestrator';
import { logger } from '@/lib/logger';

// Validation schema
const CollectionTriggerSchema = z.object({
  type: z.enum(['full_collection', 'brand_collection', 'prompt_collection']),
  brand_id: z.string().optional(),
  prompt_ids: z.array(z.number()).optional(),
  locale: z.string().default('en-US'),
  force_refresh: z.boolean().default(false),
});

/**
 * POST /api/ai-visibility/collect
 * Manually trigger AI visibility data collection
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const jobData = CollectionTriggerSchema.parse(body);

    // Validate specific requirements
    if (jobData.type === 'brand_collection' && !jobData.brand_id) {
      return NextResponse.json(
        { error: 'brand_id is required for brand_collection type' },
        { status: 400 }
      );
    }

    if (
      jobData.type === 'prompt_collection' &&
      (!jobData.prompt_ids || jobData.prompt_ids.length === 0)
    ) {
      return NextResponse.json(
        { error: 'prompt_ids array is required for prompt_collection type' },
        { status: 400 }
      );
    }

    // Trigger the collection job
    const jobId = await triggerManualCollection(jobData);

    const response = {
      success: true,
      job_id: jobId,
      job_data: jobData,
      message: 'AI visibility collection job triggered successfully',
      status_url: `/api/ai-visibility/jobs/${jobId}`,
    };

    logger.info('Manual AI visibility collection triggered', {
      job_id: jobId,
      job_type: jobData.type,
      brand_id: jobData.brand_id,
      prompt_ids_count: jobData.prompt_ids?.length || 0,
    });

    return NextResponse.json(response, { status: 202 }); // 202 Accepted
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Failed to trigger AI visibility collection', error as Error);
    return NextResponse.json({ error: 'Failed to trigger collection job' }, { status: 500 });
  }
}
