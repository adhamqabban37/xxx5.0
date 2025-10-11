export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'node:child_process';
import { join } from 'node:path';

interface ExternalAuditRequest {
  url: string;
  timeout?: number;
}

interface ExternalAuditResponse {
  success: boolean;
  data?: {
    url: string;
    timestamp: string;
    report: any;
    scores?: {
      performance?: number;
      accessibility?: number;
      bestPractices?: number;
      seo?: number;
    };
    executionTime: number;
  };
  error?: string;
  code?: string;
}

/**
 * POST /api/audit/external - Run Lighthouse using external process
 * This completely isolates Lighthouse from the Next.js bundle
 */
export async function POST(request: NextRequest): Promise<NextResponse<ExternalAuditResponse>> {
  const startTime = Date.now();

  try {
    const body = (await request.json()) as ExternalAuditRequest;
    const { url, timeout = 60000 } = body;

    // Validate URL
    if (!url) {
      return NextResponse.json(
        {
          success: false,
          error: 'URL is required',
          code: 'MISSING_URL',
        },
        { status: 400 }
      );
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid URL format',
          code: 'INVALID_URL',
        },
        { status: 400 }
      );
    }

    // Run external Lighthouse script
    const scriptPath = join(process.cwd(), 'scripts', 'lighthouse-external.mjs');

    const result = await runExternalLighthouse(scriptPath, url, timeout);

    const executionTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        url,
        timestamp: new Date().toISOString(),
        report: result.report,
        scores: result.scores,
        executionTime,
      },
    });
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error('External Lighthouse audit failed:', error);

    let errorMessage = 'Audit failed';
    let errorCode = 'AUDIT_FAILED';

    if (error instanceof Error) {
      errorMessage = error.message;

      if (errorMessage.includes('timeout')) {
        errorCode = 'AUDIT_TIMEOUT';
      } else if (errorMessage.includes('Chrome')) {
        errorCode = 'CHROME_ERROR';
      } else if (errorMessage.includes('spawn')) {
        errorCode = 'PROCESS_ERROR';
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        code: errorCode,
        data: { executionTime },
      },
      { status: 500 }
    );
  }
}

/**
 * Run Lighthouse using external Node.js process
 */
async function runExternalLighthouse(
  scriptPath: string,
  url: string,
  timeout: number
): Promise<{ report: any; scores?: any }> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const errorChunks: Buffer[] = [];

    // Spawn external process
    const child = spawn('node', [scriptPath, url], {
      env: {
        ...process.env,
        CHROME_PATH: process.env.CHROME_PATH || undefined,
        NODE_ENV: 'production',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Set timeout
    const timeoutId = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`Lighthouse audit timed out after ${timeout}ms`));
    }, timeout);

    // Collect stdout (JSON report)
    child.stdout.on('data', (chunk) => {
      chunks.push(chunk);
    });

    // Collect stderr (logs/errors)
    child.stderr.on('data', (chunk) => {
      errorChunks.push(chunk);
    });

    child.on('close', (code) => {
      clearTimeout(timeoutId);

      const stdout = Buffer.concat(chunks).toString();
      const stderr = Buffer.concat(errorChunks).toString();

      if (code === 0 && stdout.trim()) {
        try {
          const report = JSON.parse(stdout);

          // Extract scores from report
          const scores = report.categories
            ? {
                performance: Math.round((report.categories.performance?.score || 0) * 100),
                accessibility: Math.round((report.categories.accessibility?.score || 0) * 100),
                bestPractices: Math.round((report.categories['best-practices']?.score || 0) * 100),
                seo: Math.round((report.categories.seo?.score || 0) * 100),
              }
            : undefined;

          resolve({ report, scores });
        } catch (parseError) {
          reject(new Error(`Failed to parse Lighthouse report: ${parseError}`));
        }
      } else {
        const errorMessage = stderr || `Process exited with code ${code}`;
        reject(new Error(`Lighthouse process failed: ${errorMessage}`));
      }
    });

    child.on('error', (error) => {
      clearTimeout(timeoutId);
      reject(new Error(`Failed to spawn Lighthouse process: ${error.message}`));
    });
  });
}

/**
 * GET /api/audit/external - Health check for external Lighthouse
 */
export async function GET(): Promise<NextResponse> {
  try {
    const scriptPath = join(process.cwd(), 'scripts', 'lighthouse-external.mjs');

    // Check if script exists
    const fs = await import('node:fs');
    const scriptExists = fs.existsSync(scriptPath);

    return NextResponse.json({
      success: true,
      data: {
        scriptPath,
        scriptExists,
        nodeVersion: process.version,
        platform: process.platform,
        chromePath: process.env.CHROME_PATH || 'auto-detected',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Health check failed',
      },
      { status: 500 }
    );
  }
}
