import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';
import { z } from 'zod';
import { embeddingCacheService } from '@/lib/embedding-cache';
import cacheClient from '@/lib/enhanced-redis-cache';

// Rate limiting - allow 2 full analysis requests per minute
let fullAnalysisLimiter: any;

// Check if Vercel KV is available in development
const isVercelKVAvailable = process.env.KV_URL || process.env.VERCEL_ENV === 'production';

if (isVercelKVAvailable) {
  try {
    fullAnalysisLimiter = new Ratelimit({
      redis: kv,
      limiter: Ratelimit.slidingWindow(2, '1 m'),
    });
  } catch (error) {
    console.warn('Failed to initialize Vercel KV rate limiter, using fallback');
    fullAnalysisLimiter = {
      limit: async () => ({ success: true, limit: 2, remaining: 1, reset: new Date() }),
    };
  }
} else {
  // Development fallback - no external Redis/KV needed
  fullAnalysisLimiter = {
    limit: async () => ({ success: true, limit: 2, remaining: 1, reset: new Date() }),
  };
}

// Request schema validation
const fullAnalysisRequestSchema = z.object({
  url: z.string().url('Please provide a valid URL'),
  queries: z.array(z.string()).min(1, 'At least one query is required'),
  includeSemanticAnalysis: z.boolean().default(true),
  includeLighthouse: z.boolean().default(true),
  device: z.enum(['mobile', 'desktop']).default('mobile'),
  cacheResults: z.boolean().default(true),
});

interface AnalysisJob {
  id: string;
  url: string;
  queries: string[];
  status: 'pending' | 'crawling' | 'analyzing' | 'auditing' | 'completed' | 'failed';
  progress: number;
  results?: any;
  error?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    console.log(`[${requestId}] Full analysis job request started`);

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log(`[${requestId}] Authentication failed`);
      return NextResponse.json(
        {
          error: 'Authentication required',
          requestId,
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    // Rate limiting - stricter for full analysis
    const identifier = session.user.email || request.headers.get('x-forwarded-for') || 'anonymous';
    try {
      await fullAnalysisLimiter.check(identifier);
    } catch {
      console.log(`[${requestId}] Rate limit exceeded for user: ${identifier}`);
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Full analysis is limited to 2 requests per minute.',
          retryAfter: 60,
          requestId,
          timestamp: new Date().toISOString(),
        },
        { status: 429 }
      );
    }

    // Parse and validate request
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error(`[${requestId}] JSON parse error:`, parseError);
      return NextResponse.json(
        {
          error: 'Invalid JSON in request body',
          requestId,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    let validatedData;
    try {
      validatedData = fullAnalysisRequestSchema.parse(body);
    } catch (validationError) {
      console.error(`[${requestId}] Validation error:`, validationError);
      return NextResponse.json(
        {
          error: 'Validation failed',
          details:
            validationError instanceof z.ZodError
              ? validationError.issues
              : 'Invalid request format',
          requestId,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const { url, queries, includeSemanticAnalysis, includeLighthouse, device, cacheResults } =
      validatedData;

    // Check enhanced Redis cache first
    const analysisParams = { queries, includeSemanticAnalysis, includeLighthouse, device };
    const cacheKey = cacheClient.generateCacheKey('full-analysis', url, analysisParams);

    if (cacheResults) {
      const cachedResult = await cacheClient.get(cacheKey);
      if (cachedResult) {
        console.log(`[${requestId}] 🎯 Redis Cache HIT for full analysis: ${url}`);
        return NextResponse.json({
          success: true,
          jobId: requestId,
          cached: true,
          cacheHit: true,
          data: cachedResult,
          metrics: cacheClient.getMetrics(),
          requestId,
          timestamp: new Date().toISOString(),
        });
      }

      // Fallback to legacy embedding cache
      try {
        const legacyCachedResult = await embeddingCacheService.getCachedAEOResult(url, queries);
        if (legacyCachedResult) {
          console.log(`[${requestId}] 📁 Legacy Cache HIT - returning cached full analysis`);
          // Cache in new Redis system for future requests
          await cacheClient.set(cacheKey, legacyCachedResult, 3600);
          return NextResponse.json({
            success: true,
            jobId: requestId,
            status: 'completed',
            url,
            cached: true,
            timestamp: new Date().toISOString(),
            userId: session.user.id,
            data: legacyCachedResult,
          });
        }
      } catch (cacheError) {
        console.warn(`[${requestId}] Cache check failed:`, cacheError);
      }
    }

    // Create async job
    const job: AnalysisJob = {
      id: requestId,
      url,
      queries,
      status: 'pending',
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: session.user.id,
    };

    // Store job in Redis/cache for tracking
    await storeJob(job);

    // Start async processing (fire and forget)
    processAnalysisJob(job, includeSemanticAnalysis, includeLighthouse, device, cacheResults).catch(
      (error) => {
        console.error(`[${requestId}] Job processing failed:`, error);
        updateJobStatus(requestId, 'failed', 100, undefined, error.message);
      }
    );

    const elapsed = Date.now() - startTime;
    console.log(`[${requestId}] Full analysis job queued successfully in ${elapsed}ms`);

    return NextResponse.json({
      success: true,
      jobId: requestId,
      status: 'pending',
      message: 'Analysis job queued successfully',
      estimatedTime: '2-3 minutes',
      url,
      timestamp: new Date().toISOString(),
      userId: session.user.id,
      checkStatusUrl: `/api/job-status/${requestId}`,
    });
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`[${requestId}] Full analysis job error after ${elapsed}ms:`, error);

    return NextResponse.json(
      {
        error: 'Failed to queue analysis job',
        message: 'An unexpected error occurred while queuing your analysis.',
        details: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

async function processAnalysisJob(
  job: AnalysisJob,
  includeSemanticAnalysis: boolean,
  includeLighthouse: boolean,
  device: string,
  cacheResults: boolean
) {
  const { id: jobId, url, queries } = job;

  try {
    const results: any = {};

    // Step 1: Crawl content
    await updateJobStatus(jobId, 'crawling', 10);
    const crawlResponse = await fetch(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/crawl`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          scanType: 'full',
          includeContent: true,
        }),
      }
    );

    if (!crawlResponse.ok) {
      throw new Error(`Crawl failed: ${crawlResponse.statusText}`);
    }

    results.crawlData = await crawlResponse.json();
    await updateJobStatus(jobId, 'crawling', 30);

    // Step 2: Semantic Analysis (if enabled)
    if (includeSemanticAnalysis) {
      await updateJobStatus(jobId, 'analyzing', 40);
      const aeoResponse = await fetch(
        `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/aeo-score`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url,
            queries,
            scanType: 'full',
            includeSemanticAnalysis: true,
          }),
        }
      );

      if (!aeoResponse.ok) {
        throw new Error(`AEO analysis failed: ${aeoResponse.statusText}`);
      }

      results.aeoScore = await aeoResponse.json();
      await updateJobStatus(jobId, 'analyzing', 60);
    }

    // Step 3: Lighthouse Audit (if enabled)
    if (includeLighthouse) {
      await updateJobStatus(jobId, 'auditing', 70);
      const lighthouseResponse = await fetch(
        `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/audit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url,
            categories: ['performance', 'seo', 'accessibility', 'best-practices'],
            device,
          }),
        }
      );

      if (!lighthouseResponse.ok) {
        throw new Error(`Lighthouse audit failed: ${lighthouseResponse.statusText}`);
      }

      results.lighthouseAudit = await lighthouseResponse.json();
      await updateJobStatus(jobId, 'auditing', 90);
    }

    // Calculate overall score
    results.overallScore = calculateOverallAEOScore(
      results.crawlData,
      results.aeoScore,
      results.lighthouseAudit
    );

    // Cache results if enabled
    if (cacheResults && results.aeoScore) {
      try {
        // Use the singleton instance directly
        await embeddingCacheService.cacheAEOResult(
          url,
          queries,
          results,
          'sentence-transformers/all-MiniLM-L6-v2'
        );
      } catch (cacheError) {
        console.warn(`[${jobId}] Failed to cache results:`, cacheError);
      }
    }

    // Complete the job
    await updateJobStatus(jobId, 'completed', 100, results);
    console.log(`[${jobId}] Analysis job completed successfully`);
  } catch (error) {
    console.error(`[${jobId}] Analysis job failed:`, error);
    await updateJobStatus(
      jobId,
      'failed',
      100,
      undefined,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

async function storeJob(job: AnalysisJob): Promise<void> {
  try {
    await kv.set(`job:${job.id}`, JSON.stringify(job), { ex: 3600 }); // 1 hour expiry
  } catch (error) {
    console.error('Failed to store job:', error);
  }
}

async function updateJobStatus(
  jobId: string,
  status: AnalysisJob['status'],
  progress: number,
  results?: any,
  error?: string
): Promise<void> {
  try {
    const jobData = await kv.get(`job:${jobId}`);
    if (jobData) {
      const job: AnalysisJob = JSON.parse(jobData as string);
      job.status = status;
      job.progress = progress;
      job.updatedAt = new Date().toISOString();

      if (results) {
        job.results = results;
      }

      if (error) {
        job.error = error;
      }

      await kv.set(`job:${jobId}`, JSON.stringify(job), { ex: 3600 });
    }
  } catch (error) {
    console.error(`Failed to update job status for ${jobId}:`, error);
  }
}

function generateCacheKey(
  url: string,
  queries: string[],
  semantic: boolean,
  lighthouse: boolean,
  device: string
): string {
  return `full-analysis:${url}:${queries.sort().join(',')}:${semantic}:${lighthouse}:${device}`;
}

function calculateOverallAEOScore(crawlData: any, aeoScore: any, lighthouse: any): number {
  // Same calculation as in the unified component
  const semanticScore = aeoScore?.overall_score || 0;
  const seoScore = lighthouse?.scores?.seo || 0;
  const performanceScore = lighthouse?.scores?.performance || 0;

  // Content structure score
  let contentScore = 0;
  const content = crawlData?.content;

  if (content) {
    if (content.title && content.title.length > 10) contentScore += 20;
    if (content.metaDescription && content.metaDescription.length > 50) contentScore += 15;
    const headings = content.headings || {};
    if (headings.h1 && headings.h1.length > 0) contentScore += 10;
    if (headings.h2 && headings.h2.length > 0) contentScore += 8;
    if (headings.h3 && headings.h3.length > 0) contentScore += 7;
    const paragraphs = content.paragraphs || [];
    if (paragraphs.length > 5) contentScore += 20;
    else if (paragraphs.length > 2) contentScore += 10;
    if (content.structuredData && content.structuredData.length > 0) contentScore += 20;
  }

  const weighted =
    semanticScore * 0.4 +
    seoScore * 0.3 +
    Math.min(contentScore, 100) * 0.2 +
    performanceScore * 0.1;

  return Math.round(weighted);
}
