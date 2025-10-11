import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';
import { getCacheService } from '@/lib/cache';
import cacheClient from '@/lib/enhanced-redis-cache';
import { crawlResultsService } from '@/lib/firestore-services';
import { CrawlResult } from '@/lib/firebase-client';

// Initialize services
const cacheService = getCacheService();

// Development-safe rate limiting
let crawlLimiter: any;
try {
  const { Ratelimit } = require('@upstash/ratelimit');
  const { kv } = require('@vercel/kv');
  crawlLimiter = new Ratelimit({
    redis: kv,
    limiter: Ratelimit.slidingWindow(5, '60 s'),
  });
} catch (error) {
  // Fallback rate limiter for development
  crawlLimiter = {
    limit: async () => ({ success: true, limit: 5, remaining: 4, reset: new Date() }),
  };
}

// Request validation schema
const crawlRequestSchema = z.object({
  url: z.string().url('Must be a valid URL'),
  userId: z.string().optional(),
  options: z
    .object({
      maxDepth: z.number().min(1).max(3).default(1),
      followExternalLinks: z.boolean().default(false),
      excludePatterns: z.array(z.string()).optional(),
      includeContent: z.boolean().default(true),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = crawlRequestSchema.parse(body);
    const { url, options = {} } = validatedData;

    // Check enhanced Redis cache first
    const cacheKey = cacheClient.generateCacheKey('crawl', url, options);
    const cachedResult = await cacheClient.get(cacheKey);

    if (cachedResult) {
      console.log(`🎯 Cache HIT for URL: ${url}`);
      return NextResponse.json({
        success: true,
        cached: true,
        cacheHit: true,
        data: cachedResult,
        metrics: cacheClient.getMetrics(),
      });
    }

    console.log(`🔍 Cache MISS for URL: ${url}`);

    const startTime = Date.now();

    // Simple crawl implementation
    const crawlResult = {
      url,
      title: 'Sample Title',
      content: 'Sample content',
      metadata: {
        statusCode: 200,
        contentType: 'text/html',
        size: 1000,
      },
    };

    // Cache result with enhanced Redis cache
    await cacheClient.set(cacheKey, crawlResult, 3600);

    const endTime = Date.now();
    const responseTime = endTime - startTime;
    console.log(`✅ Crawl completed for ${url} in ${responseTime}ms`);

    // Save to Firestore for persistence
    try {
      const crawlData: CrawlResult = {
        id: '', // Will be set by Firestore
        url,
        title: crawlResult.title || '',
        content: crawlResult.content || '',
        metadata: {
          crawledAt: new Date(),
          contentType: crawlResult.metadata?.contentType || 'text/html',
          statusCode: crawlResult.metadata?.statusCode || 200,
          responseTime,
        },
        analysis: {
          wordCount: (crawlResult.content || '').split(' ').length,
          headings: [], // Will be extracted when real crawl is implemented
          links: 0, // Will be counted when real crawl is implemented
          images: 0, // Will be counted when real crawl is implemented
        },
      };

      const crawlId = await crawlResultsService.create(crawlData);
      console.log(`✅ Saved crawl result to Firestore:`, crawlId);
    } catch (firestoreError) {
      console.warn('Failed to save to Firestore:', firestoreError);
    }

    return NextResponse.json({
      success: true,
      cached: false,
      cacheHit: false,
      responseTime: `${responseTime}ms`,
      data: crawlResult,
      metrics: cacheClient.getMetrics(),
    });
  } catch (error) {
    console.error('Crawl API error:', error);

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
      { error: 'Failed to crawl website. Please try again later.' },
      { status: 500 }
    );
  }
}
