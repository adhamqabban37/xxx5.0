import { NextRequest, NextResponse } from 'next/server';
import { extractSchemaData } from '@/lib/schema/extract';
import { auditSchemaData } from '@/lib/schema/audit';
import * as cheerio from 'cheerio';

interface CompetitorAnalysisRequest {
  url: string;
  competitors: string[];
}

interface AnalysisResult {
  url: string;
  score: number;
  detectedTypes: string[];
  issuesCount: number;
  success: boolean;
  error?: string;
}

interface CompetitorAnalysisResponse {
  base: AnalysisResult;
  competitors: AnalysisResult[];
  deltas: {
    strongerThanUs: string[];
    weLeadOn: string[];
  };
}

// Simple in-memory cache with TTL (6 hours)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

// Rate limiting: 1 request per 15 seconds per IP
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW = 15 * 1000; // 15 seconds

const MAX_COMPETITORS = 5;
const CONCURRENCY_LIMIT = 3;
const FETCH_TIMEOUT = 10000; // 10 seconds

// Enhanced URL validation
function validateUrl(url: string): { valid: boolean; error?: string } {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL must be a non-empty string' };
  }

  const trimmedUrl = url.trim();
  if (!trimmedUrl) {
    return { valid: false, error: 'URL cannot be empty' };
  }

  try {
    const parsed = new URL(trimmedUrl);

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'URL must use HTTP or HTTPS protocol' };
    }

    if (parsed.protocol === 'http:') {
      return { valid: false, error: 'HTTPS URLs are required for security' };
    }

    if (!parsed.hostname || parsed.hostname.length < 3) {
      return { valid: false, error: 'URL must have a valid hostname' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid URL format' };
  }
}

// Validate competitor URLs array
function validateCompetitors(competitors: any): {
  valid: boolean;
  error?: string;
  validUrls?: string[];
} {
  if (!Array.isArray(competitors)) {
    return { valid: false, error: 'Competitors must be an array of URLs' };
  }

  if (competitors.length === 0) {
    return { valid: false, error: 'At least one competitor URL is required' };
  }

  if (competitors.length > MAX_COMPETITORS) {
    return {
      valid: false,
      error: `Maximum ${MAX_COMPETITORS} competitors allowed, received ${competitors.length}`,
    };
  }

  const validUrls: string[] = [];
  const errors: string[] = [];

  for (let i = 0; i < competitors.length; i++) {
    const competitor = competitors[i];
    const validation = validateUrl(competitor);

    if (!validation.valid) {
      errors.push(`Competitor ${i + 1}: ${validation.error}`);
      continue;
    }

    try {
      const normalizedUrl = new URL(competitor.trim()).toString();
      validUrls.push(normalizedUrl);
    } catch {
      errors.push(`Competitor ${i + 1}: Failed to normalize URL`);
    }
  }

  if (errors.length > 0) {
    return { valid: false, error: errors.join('; ') };
  }

  if (validUrls.length === 0) {
    return { valid: false, error: 'No valid competitor URLs provided' };
  }

  return { valid: true, validUrls };
}

// Check rate limit for IP
function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const lastRequest = rateLimitMap.get(ip);

  if (lastRequest && now - lastRequest < RATE_LIMIT_WINDOW) {
    const retryAfter = Math.ceil((RATE_LIMIT_WINDOW - (now - lastRequest)) / 1000);
    return { allowed: false, retryAfter };
  }

  rateLimitMap.set(ip, now);

  // Clean up old entries periodically
  if (Math.random() < 0.1) {
    // 10% chance to clean up
    for (const [ipKey, timestamp] of rateLimitMap.entries()) {
      if (now - timestamp > RATE_LIMIT_WINDOW * 2) {
        rateLimitMap.delete(ipKey);
      }
    }
  }

  return { allowed: true };
}

// Get client IP address
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP.trim();
  }

  if (cfConnectingIP) {
    return cfConnectingIP.trim();
  }

  return 'unknown';
}

// Deduplicate URLs by hostname
function deduplicateUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  return urls.filter((url) => {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      if (seen.has(hostname)) {
        return false;
      }
      seen.add(hostname);
      return true;
    } catch {
      return false;
    }
  });
}

// Get cached data if valid
function getCachedData(url: string): any | null {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

// Set cache data
function setCacheData(url: string, data: any): void {
  cache.set(url, { data, timestamp: Date.now() });
}

// Fetch HTML with timeout and safe user agent
async function fetchHtmlSafely(url: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; XenlixAI Schema Analyzer/1.0; +https://xenlix.ai/crawler)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    return html;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Analyze a single URL
async function analyzeUrl(url: string): Promise<AnalysisResult> {
  try {
    // Check cache first
    const cached = getCachedData(url);
    if (cached) {
      return cached;
    }

    // Fetch and analyze
    const html = await fetchHtmlSafely(url);
    const $ = cheerio.load(html);

    // Extract schema data using existing utilities
    const schemaExtraction = extractSchemaData($);

    // Audit schema data
    const schemaAudit = auditSchemaData(schemaExtraction);

    const result: AnalysisResult = {
      url,
      score: schemaAudit.score,
      detectedTypes: schemaAudit.detectedTypes,
      issuesCount: schemaAudit.issues.length,
      success: true,
    };

    // Cache the result
    setCacheData(url, result);

    return result;
  } catch (error) {
    const result: AnalysisResult = {
      url,
      score: 0,
      detectedTypes: [],
      issuesCount: 0,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    return result;
  }
}

// Process URLs with concurrency limit
async function analyzeUrlsConcurrently(urls: string[]): Promise<AnalysisResult[]> {
  const results: AnalysisResult[] = [];

  for (let i = 0; i < urls.length; i += CONCURRENCY_LIMIT) {
    const batch = urls.slice(i, i + CONCURRENCY_LIMIT);
    const batchPromises = batch.map((url) => analyzeUrl(url));
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  return results;
}

// Calculate deltas between base and competitors
function calculateDeltas(
  base: AnalysisResult,
  competitors: AnalysisResult[]
): {
  strongerThanUs: string[];
  weLeadOn: string[];
} {
  const baseTypes = new Set(base.detectedTypes);
  const allCompetitorTypes = new Set<string>();
  const competitorScores = competitors.filter((c) => c.success).map((c) => c.score);

  // Collect all competitor types
  competitors.forEach((comp) => {
    comp.detectedTypes.forEach((type) => allCompetitorTypes.add(type));
  });

  // Types that competitors have but we don't
  const strongerThanUs = Array.from(allCompetitorTypes).filter((type) => !baseTypes.has(type));

  // Our strengths: types we have that most competitors don't, or higher score
  const weLeadOn: string[] = [];

  // Check type advantages
  baseTypes.forEach((type) => {
    const competitorsWithType = competitors.filter((c) => c.detectedTypes.includes(type)).length;
    if (competitorsWithType < competitors.length * 0.5) {
      // Less than half have this type
      weLeadOn.push(
        `${type} schema (${competitorsWithType}/${competitors.length} competitors have it)`
      );
    }
  });

  // Check score advantage
  if (competitorScores.length > 0) {
    const medianScore = competitorScores.sort((a, b) => a - b)[
      Math.floor(competitorScores.length / 2)
    ];
    if (base.score > medianScore + 10) {
      // At least 10 points above median
      weLeadOn.push(`Overall score (${base.score} vs median ${medianScore})`);
    }
  }

  return { strongerThanUs, weLeadOn };
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const clientIP = getClientIP(request);
    const rateLimitCheck = checkRateLimit(clientIP);

    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please wait before analyzing competitors again.',
          message: `Rate limit exceeded. Try again in ${rateLimitCheck.retryAfter} seconds.`,
          retryAfter: rateLimitCheck.retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': rateLimitCheck.retryAfter!.toString(),
            'X-RateLimit-Limit': '1',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + RATE_LIMIT_WINDOW).toISOString(),
          },
        }
      );
    }

    console.log('Competitors API: Received request from IP:', clientIP);
    const body: CompetitorAnalysisRequest = await request.json();
    console.log('Competitors API: Request body:', body);

    // Validate input structure
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          message: 'Request body must be a JSON object with url and competitors fields.',
        },
        { status: 400 }
      );
    }

    if (!body.url) {
      return NextResponse.json(
        {
          error: 'Missing base URL',
          message: 'The "url" field is required and must contain your website URL.',
        },
        { status: 400 }
      );
    }

    if (!body.competitors) {
      return NextResponse.json(
        {
          error: 'Missing competitors',
          message: 'The "competitors" field is required and must be an array of competitor URLs.',
        },
        { status: 400 }
      );
    }

    // Validate base URL
    const baseUrlValidation = validateUrl(body.url);
    if (!baseUrlValidation.valid) {
      return NextResponse.json(
        {
          error: 'Invalid base URL',
          message: `Base URL validation failed: ${baseUrlValidation.error}`,
        },
        { status: 400 }
      );
    }

    // Validate competitor URLs
    const competitorsValidation = validateCompetitors(body.competitors);
    if (!competitorsValidation.valid) {
      return NextResponse.json(
        {
          error: 'Invalid competitor URLs',
          message: competitorsValidation.error,
        },
        { status: 400 }
      );
    }

    const baseUrl = new URL(body.url.trim()).toString();
    const validCompetitors = competitorsValidation.validUrls!;
    const uniqueCompetitors = deduplicateUrls(validCompetitors);

    if (uniqueCompetitors.length === 0) {
      return NextResponse.json(
        {
          error: 'No unique competitors',
          message:
            'After deduplication, no unique competitor domains remain. Please provide competitors with different hostnames.',
        },
        { status: 400 }
      );
    }

    // Analyze all URLs concurrently
    const allUrls = [baseUrl, ...uniqueCompetitors];
    const results = await analyzeUrlsConcurrently(allUrls);

    const base = results[0];
    const competitors = results.slice(1);
    const deltas = calculateDeltas(base, competitors);

    const response: CompetitorAnalysisResponse = {
      base,
      competitors,
      deltas,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=43200',
        'X-Cache-TTL': '21600',
        'X-Analyzed-URLs': allUrls.length.toString(),
        'X-Rate-Limit-Remaining': '1',
      },
    });
  } catch (error) {
    console.error('Competitor analysis error:', error);

    // Handle JSON parsing errors specifically
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: 'Invalid JSON',
          message: 'Request body must be valid JSON. Please check your request format.',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        message:
          'An unexpected error occurred while analyzing competitors. Please try again later.',
      },
      { status: 500 }
    );
  }
}
