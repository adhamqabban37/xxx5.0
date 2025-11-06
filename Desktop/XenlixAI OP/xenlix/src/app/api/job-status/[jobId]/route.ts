import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Safe KV operations with fallback for development
const safeKV = {
  async get(key: string) {
    if (process.env.KV_URL || process.env.VERCEL_ENV === 'production') {
      try {
        const { kv } = await import('@vercel/kv');
        return await kv.get(key);
      } catch (error) {
        console.warn('KV get failed, returning null:', error);
        return null;
      }
    }
    // Development fallback - return null (job not found)
    return null;
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        {
          error: 'Authentication required',
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    if (!jobId) {
      return NextResponse.json(
        {
          error: 'Job ID is required',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Get job from cache
    const jobData = await safeKV.get(`job:${jobId}`);

    if (!jobData) {
      return NextResponse.json(
        {
          error: 'Job not found or expired',
          jobId,
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const job = JSON.parse(jobData as string);

    // Verify job belongs to user
    if (job.userId !== session.user.id) {
      return NextResponse.json(
        {
          error: 'Access denied',
          timestamp: new Date().toISOString(),
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      jobId,
      status: job.status,
      progress: job.progress,
      url: job.url,
      queries: job.queries,
      results: job.results,
      error: job.error,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Job status check error:', error);

    return NextResponse.json(
      {
        error: 'Failed to check job status',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
