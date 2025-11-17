import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import cacheClient from '@/lib/enhanced-redis-cache';
import { checkRedisHealth, getRedisStatus } from '@/lib/redis-client';
import { firebaseClient } from '@/lib/firebase-client';
import { getEnvironmentConfig } from '@/lib/env-config';
import { HuggingFaceClient } from '@/lib/huggingface-client';
import { checkCrawl4AIHealth } from '@/lib/crawl4ai-client';

const prisma = new PrismaClient();

// Phase 5: Feature flag circuit breaker
const PREMIUM_SCANS_ENABLED = process.env.PREMIUM_SCANS_ENABLED !== 'false';

// Environment variables we need to check
const REQUIRED_ENV_VARS = {
  // Core application
  NEXTAUTH_SECRET: { required: true, type: 'server' },
  NEXTAUTH_URL: { required: true, type: 'server' },
  DATABASE_URL: { required: true, type: 'server' },

  // Google APIs
  GOOGLE_CLIENT_ID: { required: true, type: 'server' },
  GOOGLE_CLIENT_SECRET: { required: true, type: 'server' },
  PSI_API_KEY: { required: false, type: 'server' },
  GOOGLE_TOKEN_ENCRYPTION_SECRET: { required: false, type: 'server' },

  // Public environment variables
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: { required: false, type: 'client' },
  NEXT_PUBLIC_SITE_URL: { required: true, type: 'client' },

  // Optional services
  REDIS_URL: { required: false, type: 'server' },
  OPENPAGERANK_API_KEY: { required: false, type: 'server' },
  HUGGINGFACE_API_TOKEN: { required: false, type: 'server' },
} as const;

function checkEnvironmentVariables() {
  console.log('[Health] Checking environment variables...');
  const missing: string[] = [];
  const present: string[] = [];
  const envStatus: Record<
    string,
    {
      present: boolean;
      type: 'server' | 'client';
      required: boolean;
      masked?: string;
    }
  > = {};

  Object.entries(REQUIRED_ENV_VARS).forEach(([key, config]) => {
    const value = process.env[key];
    const hasValue = !!value && value.trim() !== '';

    envStatus[key] = {
      present: hasValue,
      type: config.type,
      required: config.required,
      masked: hasValue ? `${value.substring(0, 8)}...` : undefined,
    };

    if (config.required && !hasValue) {
      missing.push(key);
    } else if (hasValue) {
      present.push(key);
    }
  });

  return { missing, present, envStatus };
}

export async function GET() {
  try {
    const startTime = Date.now();
    const config = getEnvironmentConfig();
    const isDev = config.app.nodeEnv === 'development' || config.app.nodeEnv === 'test';

    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    const dbResponseTime = Date.now() - startTime;

    // Check environment variables
    const envCheck = checkEnvironmentVariables();

    // Check Redis health (optional in dev/test) - using unified client
    let redisHealthy = false;
    let redisResponseTime = null;
    let redisError = null;
    const redisOptional = isDev; // Redis is optional in dev/test mode

    try {
      const redisStatus = getRedisStatus();
      const startTime = Date.now();
      const healthResult = await checkRedisHealth();
      redisResponseTime = Date.now() - startTime;
      redisHealthy = healthResult.healthy;

      if (!redisHealthy) {
        redisError = healthResult.error || 'Health check failed';
      }
    } catch (error) {
      redisHealthy = false;
      redisError = error instanceof Error ? error.message : 'Unknown error';
    }

    const cacheMetrics = cacheClient.getMetrics();

    // Check HuggingFace service
    let huggingfaceHealthy = false;
    let huggingfaceResponseTime = null;
    let huggingfaceError = null;

    try {
      const hfClient = HuggingFaceClient.getInstance();
      const hfStartTime = Date.now();
      const hfHealth = await hfClient.healthCheck();
      huggingfaceResponseTime = Date.now() - hfStartTime;
      huggingfaceHealthy = hfHealth.status === 'healthy';
      if (!huggingfaceHealthy) {
        huggingfaceError = hfHealth.error;
      }
    } catch (error) {
      huggingfaceHealthy = false;
      huggingfaceError = error instanceof Error ? error.message : 'Unknown HF error';
    }

    // Check Crawler service (crawl4ai) - optional in dev/test
    let crawlerHealthy = false;
    let crawlerResponseTime = null;
    let crawlerError = null;
    const crawlerOptional = isDev || process.env.CRAWL4AI_ENABLED === 'false';
    const crawlerUrl =
      process.env.CRAWL4AI_URL || process.env.CRAWL4AI_SERVICE_URL || 'http://localhost:8001';

    if (!crawlerOptional) {
      try {
        const crawlerStartTime = Date.now();
        crawlerHealthy = await checkCrawl4AIHealth();
        crawlerResponseTime = Date.now() - crawlerStartTime;

        if (!crawlerHealthy) {
          crawlerError = 'Health check returned false';
        }
      } catch (error) {
        crawlerHealthy = false;
        if ((error as any).code === 'ECONNREFUSED') {
          crawlerError = 'Connection refused - service not running or wrong port';
        } else {
          crawlerError = error instanceof Error ? error.message : 'Crawler service unreachable';
        }
      }
    }

    // Test Crawl4AI with smoke test
    let crawlerSmokeTest = false;
    if (crawlerHealthy) {
      try {
        const smokeResponse = await fetch(`${crawlerUrl}/analyze?url=https://example.com`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        });
        crawlerSmokeTest = smokeResponse.ok;
      } catch (error) {
        console.warn('[Health] Crawl4AI smoke test failed:', error);
      }
    }

    // Check Lighthouse service
    let lighthouseHealthy = false;
    let lighthouseResponseTime = null;
    let lighthouseError = null;
    const lighthouseUrl = process.env.LIGHTHOUSE_URL || 'http://localhost:9222';

    try {
      const lighthouseStartTime = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const lighthouseResponse = await fetch(`${lighthouseUrl}/json/version`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      lighthouseResponseTime = Date.now() - lighthouseStartTime;
      lighthouseHealthy = lighthouseResponse.ok;

      if (!lighthouseHealthy) {
        lighthouseError = `HTTP ${lighthouseResponse.status}`;
      }
    } catch (error) {
      lighthouseHealthy = false;
      lighthouseError = error instanceof Error ? error.message : 'Lighthouse service unreachable';
    }

    // Get package.json version
    const packageJson = require('../../../../package.json');

    // Check Firebase health
    const firebaseHealth = await firebaseClient.healthCheck();
    const firebaseHealthy = firebaseHealth.status === 'healthy';

    // Overall health calculation
    // In dev/test mode: Only database and env vars are required
    // In production: Also require HuggingFace and Firebase
    const requiredServicesHealthy = isDev
      ? envCheck.missing.length === 0 // Dev: only env vars and database (already checked)
      : envCheck.missing.length === 0 && huggingfaceHealthy && firebaseHealthy; // Prod: add AI services

    const optionalServicesDown = [];
    if (!redisHealthy && redisOptional) optionalServicesDown.push('Redis');
    if (!crawlerHealthy && crawlerOptional) optionalServicesDown.push('Crawl4AI');
    if (!lighthouseHealthy) optionalServicesDown.push('Lighthouse');

    const overallHealthy = requiredServicesHealthy;
    const isDegraded = optionalServicesDown.length > 0;
    const responseTime = Date.now() - startTime;

    const recommendations: Array<{ type: string; message: string; action: string }> = [];

    // Add environment variable recommendations
    if (envCheck.missing.length > 0) {
      recommendations.push({
        type: 'error',
        message: `Missing required environment variables: ${envCheck.missing.join(', ')}`,
        action: 'Set missing environment variables in .env.local',
      });
    }

    // Check for optional but recommended variables
    const optionalMissing = Object.entries(envCheck.envStatus)
      .filter(([key, status]) => !status.required && !status.present)
      .map(([key]) => key);

    if (optionalMissing.includes('PSI_API_KEY')) {
      recommendations.push({
        type: 'warning',
        message: 'PSI_API_KEY not configured - PageSpeed Insights disabled',
        action: 'Add PSI_API_KEY for live PageSpeed Insights integration',
      });
    }

    if (optionalMissing.includes('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY')) {
      recommendations.push({
        type: 'info',
        message: 'Google Maps API key not configured - using OpenStreetMap fallback',
        action: 'Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY for Google Maps integration',
      });
    }

    // Add health recommendations
    if (!redisHealthy) {
      recommendations.push({
        type: redisOptional ? 'info' : 'warning',
        message: redisError
          ? `Redis unavailable: ${redisError}`
          : 'Redis unavailable. Using memory cache fallback.',
        action: 'Check Redis: docker ps | grep redis OR set REDIS_URL environment variable',
      });
    }

    if (!huggingfaceHealthy) {
      recommendations.push({
        type: 'error',
        message: 'HuggingFace Inference API unavailable.',
        action: 'Check HuggingFace API token and service availability',
      });
    }

    if (!firebaseHealthy) {
      recommendations.push({
        type: 'error',
        message: 'Firebase/Firestore unavailable.',
        action: 'Check Firebase configuration and service account',
      });
    }

    if (!crawlerHealthy) {
      recommendations.push({
        type: 'warning', // Changed from 'error' to 'warning'
        message: `Crawler service (crawl4ai) unavailable at ${crawlerUrl} - using fallback.`,
        action: `Start with: docker-compose up crawl4ai -d OR check CRAWL4AI_URL env var`,
      });
    }

    if (!lighthouseHealthy) {
      recommendations.push({
        type: 'warning', // Changed from 'error' to 'warning'
        message: 'Lighthouse service unavailable - using fallback.',
        action: `Optional service. Job processor will use alternative methods.`,
      });
    }

    if (cacheMetrics.hitRate < 50 && cacheMetrics.totalRequests > 10) {
      recommendations.push({
        type: 'info',
        message: `Low cache hit rate (${cacheMetrics.hitRate}%).`,
        action: 'Review caching strategy',
      });
    }

    const healthData = {
      ok: overallHealthy,
      status: !overallHealthy ? 'unhealthy' : isDegraded ? 'degraded' : 'healthy',
      degraded: isDegraded,
      optionalServicesDown: isDegraded ? optionalServicesDown : [],
      time: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      mode: isDev ? 'development' : 'production',
      version: packageJson.version,
      env: process.env.APP_ENV || 'development',
      uptime: process.uptime(),

      // Environment variable status
      environment: {
        hasRequiredKeys: envCheck.missing.length === 0,
        keysMissing: envCheck.missing,
        keysPresent: envCheck.present.length,
        totalKeys: Object.keys(REQUIRED_ENV_VARS).length,
        variables: envCheck.envStatus,
      },

      services: {
        database: {
          connected: true,
          responseTime: `${dbResponseTime}ms`,
          type: 'sqlite',
        },

        redis: {
          status: redisHealthy ? 'healthy' : 'unhealthy',
          connected: cacheMetrics.redisConnected,
          fallbackMode: !cacheMetrics.redisConnected ? 'memory' : null,
          url: config.redis.url,
          responseTime: redisResponseTime ? `${redisResponseTime}ms` : null,
          error: redisError || null,
          lastCheck: cacheMetrics.lastHealthCheck,
          optional: redisOptional,
        },

        huggingface: {
          status: huggingfaceHealthy ? 'healthy' : 'unhealthy',
          model: 'sentence-transformers/all-MiniLM-L6-v2',
          responseTime: huggingfaceResponseTime ? `${huggingfaceResponseTime}ms` : null,
          error: huggingfaceError || null,
          apiConfigured: !!config.ai.huggingface?.token,
        },

        firebase: {
          status: firebaseHealthy ? 'healthy' : 'unhealthy',
          connected: firebaseHealth.details.firestore,
          projectId: firebaseHealth.details.projectId,
          responseTime: firebaseHealth.latency ? `${firebaseHealth.latency}ms` : null,
          error: firebaseHealth.error || null,
          storage: firebaseHealth.details.storage,
        },

        crawler: {
          status: crawlerHealthy ? 'up' : 'down',
          url: crawlerUrl,
          responseTime: crawlerResponseTime ? `${crawlerResponseTime}ms` : null,
          error: crawlerError || null,
          smokeTest: crawlerSmokeTest ? 'passed' : 'not run or failed',
        },

        lighthouse: {
          status: lighthouseHealthy ? 'up' : 'down',
          url: lighthouseUrl,
          responseTime: lighthouseResponseTime ? `${lighthouseResponseTime}ms` : null,
          error: lighthouseError || null,
        },

        cache: {
          mode: cacheMetrics.cacheMode,
          hitRate: `${cacheMetrics.hitRate}%`,
          totalRequests: cacheMetrics.totalRequests,
          hits: cacheMetrics.hits,
          misses: cacheMetrics.misses,
          errors: cacheMetrics.errors,
          avgResponseTime: `${Math.round(cacheMetrics.avgResponseTime)}ms`,
          memoryCacheSize: cacheMetrics.memoryCacheSize,
        },

        nextjs: '15.5.3',
        node: process.version,
        platform: process.platform,
      },

      recommendations,
    };

    return NextResponse.json(healthData, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error) {
    const errorData = {
      ok: false,
      status: 'unhealthy',
      time: new Date().toISOString(),
      mode: process.env.BILLING_MODE || 'unknown',
      version: 'unknown',
      env: process.env.APP_ENV || 'development',
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: {
        hasRequiredKeys: false,
        keysMissing: ['Unable to check - system error'],
        keysPresent: 0,
        totalKeys: Object.keys(REQUIRED_ENV_VARS).length,
      },
      database: {
        connected: false,
        error: 'Database connection failed',
      },
    };

    return NextResponse.json(errorData, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } finally {
    await prisma.$disconnect();
  }
}
