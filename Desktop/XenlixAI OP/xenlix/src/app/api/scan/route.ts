import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { WebsiteScanner } from '@/lib/website-scanner';
import { scanQueue } from '@/lib/scan-queue';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';

// Rate limiting configuration
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Max 500 unique tokens per minute
});

const scanRequestSchema = z.object({
  url: z.string().url('Please provide a valid URL'),
  priority: z.enum(['high', 'normal', 'low']).default('normal'),
  scanType: z.enum(['full', 'quick', 'premium']).default('full'),
  features: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Rate limiting
    const identifier =
      session.user.email ||
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'anonymous';
    try {
      await limiter.check(3, identifier); // 3 requests per minute per user
    } catch {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please wait before making another scan request.',
          retryAfter: 60,
        },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { url, priority, scanType, features } = scanRequestSchema.parse(body);

    console.log(`Starting ${scanType} AEO scan for ${url} by user ${session.user.email}`);
    if (features) {
      console.log(`Premium features requested: ${features.join(', ')}`);
    }

    // Add scan to queue for async processing (use Crawl4AI for full and premium scans)
    const useCrawl4AI = scanType === 'full' || scanType === 'premium';
    const scanId = await scanQueue.addScan(url, session.user.id!, priority, useCrawl4AI, features);

    // Return the scan job ID for tracking
    return NextResponse.json({
      success: true,
      scanId,
      status: 'queued',
      message: 'Scan added to queue. Check status using the scanId.',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Scan API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Scan failed. Please try again.',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get scan history for user
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');

    // This would typically fetch from database
    // For now, return empty array until database integration is complete
    const scanHistory: any[] = [];

    return NextResponse.json({
      success: true,
      scans: scanHistory,
      total: 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Scan history API error:', error);
    return NextResponse.json({ error: 'Failed to fetch scan history' }, { status: 500 });
  }
}

function generateScanId(): string {
  return `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
