import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { z } from 'zod';
import { addSubmissionLog } from '@/lib/indexnow-logger';

// IndexNow submission schema validation
const indexNowSchema = z.object({
  urls: z.array(z.string().url()).min(1).max(10000), // IndexNow supports up to 10,000 URLs
  reason: z.enum(['created', 'updated', 'deleted']).optional().default('updated'),
});

// Rate limiting configuration
const RATE_LIMIT = {
  MAX_REQUESTS_PER_MINUTE: 10,
  MAX_REQUESTS_PER_HOUR: 100,
  MAX_REQUESTS_PER_DAY: 1000,
};

// In-memory rate limiting store (in production, use Redis or database)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// IndexNow endpoints
const INDEXNOW_ENDPOINTS = {
  bing: 'https://api.indexnow.org/IndexNow',
  google: 'https://indexnow.org/submit', // Google also uses IndexNow protocol
};

interface IndexNowSubmission {
  host: string;
  key: string;
  keyLocation: string;
  urlList: string[];
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

// Rate limiting helper
function checkRateLimit(
  identifier: string,
  windowMs: number,
  maxRequests: number
): RateLimitResult {
  const now = Date.now();
  const key = `${identifier}-${Math.floor(now / windowMs)}`;

  const current = rateLimitStore.get(key);
  if (!current) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs };
  }

  if (current.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: current.resetTime };
  }

  current.count++;
  return { allowed: true, remaining: maxRequests - current.count, resetTime: current.resetTime };
}

// Submit URLs to IndexNow with retry logic
async function submitToIndexNow(
  urls: string[],
  retryCount = 0
): Promise<{ success: boolean; response?: any; error?: string }> {
  const maxRetries = 3;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.xenlixai.com';
  const apiKey = process.env.INDEXNOW_API_KEY;

  if (!apiKey) {
    return { success: false, error: 'IndexNow API key not configured' };
  }

  // Prepare submission payload
  const submission: IndexNowSubmission = {
    host: new URL(baseUrl).hostname,
    key: apiKey,
    keyLocation: `${baseUrl}/${apiKey}.txt`,
    urlList: urls,
  };

  try {
    // Submit to Bing IndexNow (primary endpoint)
    const response = await fetch(INDEXNOW_ENDPOINTS.bing, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'XenlixAI-IndexNow/1.0',
      },
      body: JSON.stringify(submission),
    });

    if (response.status === 200) {
      return {
        success: true,
        response: { status: response.status, statusText: response.statusText },
      };
    }

    if (response.status === 429 && retryCount < maxRetries) {
      // Rate limited - wait and retry
      const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
      await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
      return submitToIndexNow(urls, retryCount + 1);
    }

    if (response.status >= 500 && response.status < 600 && retryCount < maxRetries) {
      // Server error - exponential backoff retry
      const delay = Math.pow(2, retryCount) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return submitToIndexNow(urls, retryCount + 1);
    }

    return {
      success: false,
      error: `IndexNow submission failed: ${response.status} ${response.statusText}`,
    };
  } catch (error) {
    console.error('IndexNow submission error:', error);

    if (retryCount < maxRetries) {
      // Network error - retry with exponential backoff
      const delay = Math.pow(2, retryCount) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return submitToIndexNow(urls, retryCount + 1);
    }

    return {
      success: false,
      error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// Log submission for monitoring
async function logSubmission(
  urls: string[],
  success: boolean,
  response?: any,
  error?: string,
  userId?: string
) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    userId: userId || 'anonymous',
    urlCount: urls.length,
    urls: urls.slice(0, 5), // Log first 5 URLs for debugging
    success,
    response,
    error,
  };

  // In production, store this in database or logging service
  console.log('IndexNow Submission Log:', JSON.stringify(logEntry, null, 2));

  // TODO: Store in database for dashboard display
  // await prisma.indexNowSubmission.create({ data: logEntry });
}

export async function POST(request: NextRequest) {
  let urls: string[] = [];
  let startTime = Date.now();

  try {
    // Authentication check - only authenticated users can submit
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = indexNowSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { urls: validatedUrls, reason } = validation.data;
    urls = validatedUrls; // Assign to variable in outer scope
    const userId = session.user.email;

    // Rate limiting checks
    const minuteLimit = checkRateLimit(
      `${userId}-minute`,
      60 * 1000,
      RATE_LIMIT.MAX_REQUESTS_PER_MINUTE
    );
    if (!minuteLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((minuteLimit.resetTime - Date.now()) / 1000),
          limit: 'minute',
        },
        { status: 429 }
      );
    }

    const hourLimit = checkRateLimit(
      `${userId}-hour`,
      60 * 60 * 1000,
      RATE_LIMIT.MAX_REQUESTS_PER_HOUR
    );
    if (!hourLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Hourly rate limit exceeded',
          retryAfter: Math.ceil((hourLimit.resetTime - Date.now()) / 1000),
          limit: 'hour',
        },
        { status: 429 }
      );
    }

    const dayLimit = checkRateLimit(
      `${userId}-day`,
      24 * 60 * 60 * 1000,
      RATE_LIMIT.MAX_REQUESTS_PER_DAY
    );
    if (!dayLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Daily rate limit exceeded',
          retryAfter: Math.ceil((dayLimit.resetTime - Date.now()) / 1000),
          limit: 'day',
        },
        { status: 429 }
      );
    }

    // Submit to IndexNow
    const startTime = Date.now();
    const result = await submitToIndexNow(urls);
    const duration = Date.now() - startTime;

    // Log the submission with comprehensive details
    const logEntry = addSubmissionLog(urls, result.success, {
      error: result.error,
      reason: body.reason || 'manual',
      responseCode: result.response?.status,
      rateLimits: {
        minute: { remaining: minuteLimit.remaining },
        hour: { remaining: hourLimit.remaining },
        day: { remaining: dayLimit.remaining },
      },
      duration,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Successfully submitted ${urls.length} URL(s) to search engines`,
        urlCount: urls.length,
        reason,
        rateLimits: {
          minute: { remaining: minuteLimit.remaining },
          hour: { remaining: hourLimit.remaining },
          day: { remaining: dayLimit.remaining },
        },
      });
    } else {
      return NextResponse.json(
        {
          error: 'Submission failed',
          details: result.error,
          urlCount: urls.length,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('IndexNow API error:', error);

    // Log the failed submission
    addSubmissionLog(urls || [], false, {
      error: error instanceof Error ? error.message : 'Unknown error',
      reason: 'manual',
      duration: Date.now() - (startTime || Date.now()),
    });

    return NextResponse.json(
      {
        error: 'Internal server error',
        submitted: false,
        urlCount: (urls || []).length,
      },
      { status: 500 }
    );
  }
}

// GET endpoint for checking IndexNow status and configuration
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = session.user.email;
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.xenlixai.com';
    const apiKey = process.env.INDEXNOW_API_KEY;

    // Check rate limit status
    const now = Date.now();
    const minuteKey = `${userId}-minute-${Math.floor(now / (60 * 1000))}`;
    const hourKey = `${userId}-hour-${Math.floor(now / (60 * 60 * 1000))}`;
    const dayKey = `${userId}-day-${Math.floor(now / (24 * 60 * 60 * 1000))}`;

    const minuteUsage = rateLimitStore.get(minuteKey)?.count || 0;
    const hourUsage = rateLimitStore.get(hourKey)?.count || 0;
    const dayUsage = rateLimitStore.get(dayKey)?.count || 0;

    return NextResponse.json({
      configured: !!apiKey,
      keyLocation: apiKey ? `${baseUrl}/${apiKey}.txt` : null,
      rateLimits: {
        minute: {
          used: minuteUsage,
          limit: RATE_LIMIT.MAX_REQUESTS_PER_MINUTE,
          remaining: RATE_LIMIT.MAX_REQUESTS_PER_MINUTE - minuteUsage,
        },
        hour: {
          used: hourUsage,
          limit: RATE_LIMIT.MAX_REQUESTS_PER_HOUR,
          remaining: RATE_LIMIT.MAX_REQUESTS_PER_HOUR - hourUsage,
        },
        day: {
          used: dayUsage,
          limit: RATE_LIMIT.MAX_REQUESTS_PER_DAY,
          remaining: RATE_LIMIT.MAX_REQUESTS_PER_DAY - dayUsage,
        },
      },
      endpoints: Object.keys(INDEXNOW_ENDPOINTS),
    });
  } catch (error) {
    console.error('IndexNow status check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
