import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { scanQueue } from '@/lib/scan-queue';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Scan ID is required' },
        { status: 400 }
      );
    }

    const job = scanQueue.getJob(id);

    if (!job) {
      return NextResponse.json(
        { error: 'Scan not found' },
        { status: 404 }
      );
    }

    // Check if user owns this scan
    if (job.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized access to scan' },
        { status: 403 }
      );
    }

    // Return job status and result if completed
    return NextResponse.json({
      success: true,
      scanId: job.id,
      status: job.status,
      url: job.url,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      result: job.status === 'completed' ? (job.crawl4aiResult || job.result) : undefined,
      resultType: job.crawl4aiResult ? 'crawl4ai' : 'local',
      error: job.error,
      retryCount: job.retryCount,
      progress: getProgress(job.status)
    });

  } catch (error) {
    console.error('Scan status API error:', error);
    return NextResponse.json(
      { error: 'Failed to get scan status' },
      { status: 500 }
    );
  }
}

function getProgress(status: string): number {
  switch (status) {
    case 'pending': return 10;
    case 'processing': return 50;
    case 'completed': return 100;
    case 'failed': return 0;
    default: return 0;
  }
}