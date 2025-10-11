// API endpoint for IndexNow logs and statistics
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import {
  getRecentLogs,
  getSubmissionStats,
  getFilteredLogs,
  getErrorLogs,
} from '@/lib/indexnow-logger';

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const filter = searchParams.get('filter'); // 'success', 'error', etc.
    const since = searchParams.get('since'); // ISO date string

    // Get logs based on filters
    let logs;
    if (filter === 'error') {
      logs = getErrorLogs(limit);
    } else if (filter || since) {
      const sinceDate = since ? new Date(since) : undefined;
      logs = getFilteredLogs({
        success: filter === 'success' ? true : filter === 'error' ? false : undefined,
        since: sinceDate,
        limit,
      });
    } else {
      logs = getRecentLogs(limit);
    }

    // Get current statistics
    const stats = getSubmissionStats();

    return NextResponse.json({
      logs,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('IndexNow logs API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
