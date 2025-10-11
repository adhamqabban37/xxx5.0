'use server';

import type { LighthouseResult, LighthouseOptions, LighthouseConfig } from './lighthouse-types';

/**
 * Server-only Lighthouse runner that prevents Turbopack from bundling Lighthouse internals
 * Uses dynamic imports at runtime to avoid build-time resolution issues
 */

export interface LighthouseRunnerOptions {
  url: string;
  chromePath?: string;
  outputFormat?: 'json' | 'html' | 'csv';
  onlyCategories?: string[];
  chromeFlags?: string[];
  throttling?: {
    rttMs?: number;
    throughputKbps?: number;
    cpuSlowdownMultiplier?: number;
  };
  timeout?: number;
  logLevel?: 'silent' | 'error' | 'info' | 'verbose';
}

export interface LighthouseRunnerResult {
  report: string;
  lhr?: any; // Lighthouse Result object
  scores?: {
    performance?: number;
    accessibility?: number;
    bestPractices?: number;
    seo?: number;
    pwa?: number;
  };
  metrics?: {
    firstContentfulPaint?: string;
    largestContentfulPaint?: string;
    cumulativeLayoutShift?: string;
    speedIndex?: string;
  };
}

/**
 * Run Lighthouse audit on the server
 * Dynamic imports prevent Turbopack from analyzing lighthouse internals during build
 */
export async function runLighthouse(
  options: LighthouseRunnerOptions
): Promise<LighthouseRunnerResult> {
  const startTime = Date.now();

  try {
    // Dynamic imports - prevents Turbopack bundling
    const [{ default: lighthouse }, { launch: chromeLaunch }] = await Promise.all([
      import('lighthouse').catch((err) => {
        throw new Error(`Failed to import lighthouse: ${err.message}`);
      }),
      import('chrome-launcher').catch((err) => {
        throw new Error(`Failed to import chrome-launcher: ${err.message}`);
      }),
    ]);

    const {
      url,
      chromePath = process.env.CHROME_PATH,
      outputFormat = 'json',
      onlyCategories = ['performance', 'accessibility', 'best-practices', 'seo'],
      chromeFlags = [
        '--headless=new',
        '--no-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--no-default-browser-check',
        '--no-first-run',
      ],
      throttling = {
        rttMs: 40,
        throughputKbps: 10240,
        cpuSlowdownMultiplier: 1,
      },
      timeout = 30000,
      logLevel = 'error',
    } = options;

    // Launch Chrome
    const chrome = await chromeLaunch({
      chromePath,
      chromeFlags,
      logLevel: logLevel === 'verbose' ? 'info' : 'silent',
    });

    let result: any;

    try {
      // Configure Lighthouse options
      const lighthouseOptions: LighthouseOptions = {
        port: chrome.port,
        output: [outputFormat],
        logLevel,
        onlyCategories,
        throttling,
      };

      // Configure Lighthouse settings
      const lighthouseConfig: LighthouseConfig = {
        extends: 'lighthouse:default',
        settings: {
          ...throttling,
          maxWaitForFcp: timeout,
          maxWaitForLoad: timeout,
          // Disable storage reset for faster runs
          disableStorageReset: true,
          // Skip some audits for faster execution
          skipAudits:
            process.env.SKIP_PWA === 'true'
              ? ['installable-manifest', 'splash-screen', 'themed-omnibox']
              : [],
        },
      };

      // Run Lighthouse audit
      result = await lighthouse(url, lighthouseOptions, lighthouseConfig);

      if (!result) {
        throw new Error('Lighthouse returned no result');
      }

      // Extract scores and metrics
      const lhr = result.lhr;
      const scores = lhr?.categories
        ? {
            performance: Math.round((lhr.categories.performance?.score || 0) * 100),
            accessibility: Math.round((lhr.categories.accessibility?.score || 0) * 100),
            bestPractices: Math.round((lhr.categories['best-practices']?.score || 0) * 100),
            seo: Math.round((lhr.categories.seo?.score || 0) * 100),
            pwa: lhr.categories.pwa ? Math.round((lhr.categories.pwa.score || 0) * 100) : undefined,
          }
        : undefined;

      const metrics = lhr?.audits
        ? {
            firstContentfulPaint: lhr.audits['first-contentful-paint']?.displayValue,
            largestContentfulPaint: lhr.audits['largest-contentful-paint']?.displayValue,
            cumulativeLayoutShift: lhr.audits['cumulative-layout-shift']?.displayValue,
            speedIndex: lhr.audits['speed-index']?.displayValue,
          }
        : undefined;

      const duration = Date.now() - startTime;

      // Log execution info
      console.log(`✅ Lighthouse audit completed in ${duration}ms`);
      if (scores?.performance) {
        console.log(`📊 Performance score: ${scores.performance}/100`);
      }

      return {
        report: Array.isArray(result.report) ? result.report[0] : result.report,
        lhr,
        scores,
        metrics,
      };
    } finally {
      // Always kill Chrome process
      await chrome.kill().catch((err) => {
        console.warn('Failed to kill Chrome process:', err.message);
      });
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Lighthouse audit failed after ${duration}ms:`, error);

    // Provide helpful error context
    if (error instanceof Error) {
      if (error.message.includes('CHROME_PATH')) {
        throw new Error(
          'Chrome not found. Please install Chrome/Chromium or set CHROME_PATH environment variable. ' +
            'Run: npm run lighthouse:check'
        );
      }
      if (error.message.includes('timeout')) {
        throw new Error(
          `Lighthouse audit timed out after ${options.timeout || 30000}ms. ` +
            'The target URL may be slow or unresponsive.'
        );
      }
      if (error.message.includes('ECONNREFUSED')) {
        throw new Error(
          'Cannot connect to target URL. Ensure the application is running and accessible.'
        );
      }
    }

    throw error;
  }
}

/**
 * Quick Lighthouse performance audit (performance category only)
 * Optimized for speed with minimal audits
 */
export async function runQuickPerformanceAudit(url: string): Promise<{
  performanceScore: number;
  metrics: { fcp?: string; lcp?: string; cls?: string };
}> {
  const result = await runLighthouse({
    url,
    onlyCategories: ['performance'],
    outputFormat: 'json',
    logLevel: 'silent',
  });

  return {
    performanceScore: result.scores?.performance || 0,
    metrics: {
      fcp: result.metrics?.firstContentfulPaint,
      lcp: result.metrics?.largestContentfulPaint,
      cls: result.metrics?.cumulativeLayoutShift,
    },
  };
}

/**
 * Validate Chrome installation (server-side check)
 */
export async function validateChromeInstallation(): Promise<{
  available: boolean;
  path?: string;
  version?: string;
  error?: string;
}> {
  try {
    // Dynamic import to prevent bundling
    const { launch } = await import('chrome-launcher');

    const chromePath = process.env.CHROME_PATH;
    const chrome = await launch({
      chromePath,
      chromeFlags: ['--headless=new', '--no-sandbox'],
      logLevel: 'silent',
    });

    let version: string | undefined;

    try {
      // Try to get Chrome version
      if (chromePath) {
        const { spawn } = await import('child_process');
        const proc = spawn(chromePath, ['--version'], { stdio: 'pipe' });
        const chunks: Buffer[] = [];

        for await (const chunk of proc.stdout) {
          chunks.push(chunk);
        }

        version = Buffer.concat(chunks).toString().trim();
      }
    } catch (err) {
      // Version detection failed, but Chrome launched successfully
    } finally {
      await chrome.kill();
    }

    return {
      available: true,
      path: chromePath,
      version,
    };
  } catch (error) {
    return {
      available: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
