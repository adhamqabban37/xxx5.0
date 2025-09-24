import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { z } from 'zod';
import { getCacheService } from '@/lib/cache';
import { firestoreService } from '@/lib/firebase-admin';

// Development-safe imports
let Ratelimit: any, kv: any, lighthouse: any, chromeLauncher: any;
try {
  ({ Ratelimit } = require('@upstash/ratelimit'));
  ({ kv } = require('@vercel/kv'));
  lighthouse = require('lighthouse');
  chromeLauncher = require('chrome-launcher');
} catch (error) {
  console.warn('Some dependencies not available, using fallbacks');
  const { createMockRateLimit } = require('@/lib/dev-config');
  Ratelimit = class { constructor() { return createMockRateLimit(); } };
  kv = { get: async () => null, set: async () => 'OK' };
  lighthouse = null;
  chromeLauncher = null;
}

// Initialize cache service
const cacheService = getCacheService();

// Rate limiting - allow 3 lighthouse audits per minute (they're resource intensive)
const auditLimiter = Ratelimit ? new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow ? Ratelimit.slidingWindow(3, '1 m') : null,
}) : { check: async () => ({ success: true }) };

// Request schema validation
const auditRequestSchema = z.object({
  url: z.string().url('Please provide a valid URL'),
  categories: z.array(z.enum(['performance', 'accessibility', 'best-practices', 'seo', 'pwa'])).default(['performance', 'seo']),
  device: z.enum(['mobile', 'desktop']).default('mobile'),
  throttling: z.boolean().default(true)
});

interface AuditResult {
  scores: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
    pwa: number | null;
  };
  metrics: {
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    cumulativeLayoutShift: number;
    totalBlockingTime: number;
    speedIndex: number;
    timeToInteractive: number;
  };
  opportunities: any[];
  diagnostics: any[];
  seoAudits: any[];
  accessibilityIssues: any[];
  structuredDataIssues: any[];
  fetchTime: string;
  finalUrl: string;
  userAgent: string;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  
  try {
    console.log(`[${requestId}] Lighthouse audit request started`);
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log(`[${requestId}] Authentication failed`);
      return NextResponse.json(
        { 
          error: 'Authentication required',
          requestId,
          timestamp: new Date().toISOString()
        },
        { status: 401 }
      );
    }

    // Rate limiting - stricter for lighthouse as it's resource intensive
    const identifier = session.user.email || request.headers.get('x-forwarded-for') || 'anonymous';
    try {
      await auditLimiter.check(identifier);
    } catch {
      console.log(`[${requestId}] Rate limit exceeded for user: ${identifier}`);
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Lighthouse audits are limited to 3 per minute.',
          retryAfter: 60,
          requestId,
          timestamp: new Date().toISOString()
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
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    let validatedData;
    try {
      validatedData = auditRequestSchema.parse(body);
    } catch (validationError) {
      console.error(`[${requestId}] Validation error:`, validationError);
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationError instanceof z.ZodError ? validationError.issues : 'Invalid request format',
          requestId,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    const { url, categories, device, throttling } = validatedData;
    console.log(`[${requestId}] Starting Lighthouse audit for URL: ${url}`);

    // Check cache first (Lighthouse audits are expensive)
    const cacheKey = `audit:${Buffer.from(`${url}_${device}_${categories.join(',')}`).toString('base64')}`;
    let auditResult = await cacheService.get<AuditResult>(cacheKey);
    
    if (auditResult) {
      console.log(`[${requestId}] Returning cached Lighthouse audit result`);
    } else {
      // Run Lighthouse audit
      try {
        auditResult = await runLighthouseAudit(url, categories, device, throttling, requestId);
        console.log(`[${requestId}] Lighthouse audit completed successfully`);
        
        // Cache the result for 1 hour (3600 seconds)
        await cacheService.set(cacheKey, auditResult, 3600);
        
        // Save to Firestore
        await firestoreService.saveLighthouseReport({
          url,
          userId: session.user.id!,
          report: auditResult,
          scores: auditResult.scores,
          timestamp: new Date(),
          requestId
        });
        
      } catch (auditError) {
        console.error(`[${requestId}] Lighthouse audit error:`, auditError);
        
        // Return specific error based on the failure
        if (auditError instanceof Error) {
          if (auditError.message.includes('timeout')) {
            return NextResponse.json(
              { 
                error: 'Audit timed out',
                message: 'The website took too long to audit. Please try again.',
                requestId,
                timestamp: new Date().toISOString()
              },
              { status: 408 }
            );
          }
          
          if (auditError.message.includes('404') || auditError.message.includes('not found')) {
            return NextResponse.json(
              { 
                error: 'Website not found',
                message: 'The specified URL could not be found.',
                requestId,
                timestamp: new Date().toISOString()
              },
              { status: 404 }
            );
          }
        }
        
        throw auditError; // Re-throw for general error handling
      }
    }

    const elapsed = Date.now() - startTime;
    console.log(`[${requestId}] Audit completed successfully in ${elapsed}ms`);

    return NextResponse.json({
      success: true,
      url,
      requestId,
      timestamp: new Date().toISOString(),
      userId: session.user.id,
      processingTimeMs: elapsed,
      device,
      ...auditResult
    });

  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`[${requestId}] Audit API error after ${elapsed}ms:`, error);

    // Handle specific error types
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: error.issues,
          requestId,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    // Handle Chrome/Lighthouse specific errors
    if (error instanceof Error) {
      if (error.message.includes('Chrome') || error.message.includes('browser')) {
        return NextResponse.json(
          { 
            error: 'Browser unavailable',
            message: 'Unable to launch browser for audit. Please try again later.',
            requestId,
            timestamp: new Date().toISOString()
          },
          { status: 503 }
        );
      }
    }

    // Generic error response
    return NextResponse.json(
      { 
        error: 'Audit failed',
        message: 'Website audit failed due to an unexpected error. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

async function runLighthouseAudit(
  url: string,
  categories: string[],
  device: string,
  throttling: boolean,
  requestId: string
): Promise<AuditResult> {
  // Check if Lighthouse is available
  if (!lighthouse || !chromeLauncher) {
    console.warn(`[${requestId}] Lighthouse not available, returning mock results`);
    return createMockAuditResult(url);
  }

  let chrome;
  
  try {
    console.log(`[${requestId}] Launching Chrome for Lighthouse audit`);
    
    // Launch Chrome
    chrome = await chromeLauncher.launch({
      chromeFlags: [
        '--headless',
        '--disable-gpu',
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-extensions',
        '--no-first-run',
        '--disable-default-apps'
      ]
    });

    // Configure Lighthouse options
    const options = {
      logLevel: 'info' as const,
      output: 'json' as const,
      port: chrome.port,
      onlyCategories: categories,
      formFactor: device as 'mobile' | 'desktop',
      throttling: throttling ? 'mobileSlow4G' : 'devtools',
      screenEmulation: {
        mobile: device === 'mobile',
        width: device === 'mobile' ? 375 : 1350,
        height: device === 'mobile' ? 667 : 940,
        deviceScaleFactor: device === 'mobile' ? 2 : 1,
        disabled: false,
      },
      emulatedUserAgent: device === 'mobile' 
        ? 'Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36'
        : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    };

    console.log(`[${requestId}] Running Lighthouse audit...`);
    
    // Run Lighthouse
    const runnerResult = await lighthouse(url, options);
    
    if (!runnerResult || !runnerResult.lhr) {
      throw new Error('Lighthouse audit failed to complete');
    }

    const lhr = runnerResult.lhr;
    
    // Extract and structure the results
    const auditResult: AuditResult = {
      scores: {
        performance: Math.round((lhr.categories.performance?.score || 0) * 100),
        accessibility: Math.round((lhr.categories.accessibility?.score || 0) * 100),
        bestPractices: Math.round((lhr.categories['best-practices']?.score || 0) * 100),
        seo: Math.round((lhr.categories.seo?.score || 0) * 100),
        pwa: lhr.categories.pwa ? Math.round((lhr.categories.pwa.score || 0) * 100) : null
      },
      metrics: {
        firstContentfulPaint: lhr.audits['first-contentful-paint']?.numericValue || 0,
        largestContentfulPaint: lhr.audits['largest-contentful-paint']?.numericValue || 0,
        cumulativeLayoutShift: lhr.audits['cumulative-layout-shift']?.numericValue || 0,
        totalBlockingTime: lhr.audits['total-blocking-time']?.numericValue || 0,
        speedIndex: lhr.audits['speed-index']?.numericValue || 0,
        timeToInteractive: lhr.audits['interactive']?.numericValue || 0
      },
      opportunities: extractOpportunities(lhr),
      diagnostics: extractDiagnostics(lhr),
      seoAudits: extractSEOAudits(lhr),
      accessibilityIssues: extractAccessibilityIssues(lhr),
      structuredDataIssues: extractStructuredDataIssues(lhr),
      fetchTime: lhr.fetchTime,
      finalUrl: lhr.finalUrl,
      userAgent: lhr.userAgent
    };

    return auditResult;

  } finally {
    // Always close Chrome
    if (chrome) {
      await chrome.kill();
      console.log(`[${requestId}] Chrome browser closed`);
    }
  }
}

function createMockAuditResult(url: string): AuditResult {
  return {
    scores: {
      performance: 85,
      accessibility: 90,
      bestPractices: 88,
      seo: 75,
      pwa: null
    },
    metrics: {
      firstContentfulPaint: 1200,
      largestContentfulPaint: 2400,
      cumulativeLayoutShift: 0.1,
      totalBlockingTime: 300,
      speedIndex: 2000,
      timeToInteractive: 3000
    },
    opportunities: [
      {
        id: 'render-blocking-resources',
        title: 'Eliminate render-blocking resources',
        description: 'Resources are blocking the first paint of your page.',
        score: 70,
        displayValue: 'Potential savings of 200 ms',
        details: []
      }
    ],
    diagnostics: [],
    seoAudits: [
      {
        id: 'document-title',
        title: 'Document has a title element',
        description: 'The title gives screen reader users an overview of the page.',
        score: 100,
        displayValue: null,
        details: null
      }
    ],
    accessibilityIssues: [],
    structuredDataIssues: [],
    fetchTime: new Date().toISOString(),
    finalUrl: url,
    userAgent: 'Mock Lighthouse Agent'
  };
}

function extractOpportunities(lhr: any) {
  const opportunities = [];
  const opportunityAudits = [
    'unused-css-rules',
    'unused-javascript',
    'modern-image-formats',
    'offscreen-images',
    'render-blocking-resources',
    'unminified-css',
    'unminified-javascript',
    'efficient-animated-content',
    'duplicated-javascript',
    'legacy-javascript'
  ];

  for (const auditId of opportunityAudits) {
    const audit = lhr.audits[auditId];
    if (audit && audit.score !== null && audit.score < 1) {
      opportunities.push({
        id: auditId,
        title: audit.title,
        description: audit.description,
        score: Math.round((audit.score || 0) * 100),
        displayValue: audit.displayValue,
        details: audit.details?.items?.slice(0, 5) || [] // Limit to top 5 items
      });
    }
  }

  return opportunities;
}

function extractDiagnostics(lhr: any) {
  const diagnostics = [];
  const diagnosticAudits = [
    'mainthread-work-breakdown',
    'bootup-time',
    'uses-long-cache-ttl',
    'total-byte-weight',
    'dom-size',
    'critical-request-chains',
    'user-timings',
    'diagnostics'
  ];

  for (const auditId of diagnosticAudits) {
    const audit = lhr.audits[auditId];
    if (audit && audit.score !== null) {
      diagnostics.push({
        id: auditId,
        title: audit.title,
        description: audit.description,
        score: Math.round((audit.score || 0) * 100),
        displayValue: audit.displayValue,
        numericValue: audit.numericValue
      });
    }
  }

  return diagnostics;
}

function extractSEOAudits(lhr: any) {
  const seoAudits = [];
  const seoAuditIds = [
    'document-title',
    'meta-description',
    'http-status-code',
    'link-text',
    'crawlable-anchors',
    'is-crawlable',
    'robots-txt',
    'image-alt',
    'hreflang',
    'canonical',
    'structured-data'
  ];

  for (const auditId of seoAuditIds) {
    const audit = lhr.audits[auditId];
    if (audit) {
      seoAudits.push({
        id: auditId,
        title: audit.title,
        description: audit.description,
        score: audit.score !== null ? Math.round((audit.score || 0) * 100) : null,
        displayValue: audit.displayValue,
        details: audit.details
      });
    }
  }

  return seoAudits;
}

function extractAccessibilityIssues(lhr: any) {
  const issues = [];
  const a11yAuditIds = [
    'color-contrast',
    'image-alt',
    'label',
    'link-name',
    'button-name',
    'document-title',
    'duplicate-id',
    'html-has-lang',
    'html-lang-valid',
    'meta-viewport'
  ];

  for (const auditId of a11yAuditIds) {
    const audit = lhr.audits[auditId];
    if (audit && audit.score !== null && audit.score < 1) {
      issues.push({
        id: auditId,
        title: audit.title,
        description: audit.description,
        score: Math.round((audit.score || 0) * 100),
        impact: audit.details?.impact || 'unknown',
        details: audit.details?.items?.slice(0, 10) || []
      });
    }
  }

  return issues;
}

function extractStructuredDataIssues(lhr: any) {
  const structuredDataAudit = lhr.audits['structured-data'];
  
  if (!structuredDataAudit || !structuredDataAudit.details) {
    return [];
  }

  const items = structuredDataAudit.details.items || [];
  return items.map((item: any) => ({
    type: item.name,
    status: item.status,
    error: item.error,
    warning: item.warning
  }));
}