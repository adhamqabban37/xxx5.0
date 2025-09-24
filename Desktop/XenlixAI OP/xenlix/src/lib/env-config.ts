/**
 * Environment Configuration Utility
 * Provides secure loading, validation, and fallbacks for environment variables
 */

export interface EnvironmentConfig {
  // Core Backend Services
  redis: {
    url: string;
    host: string;
    port: number;
    password?: string;
    cacheTtl: number;
    maxRetries: number;
    retryDelay: number;
  };
  firebase: {
    projectId: string;
    clientEmail: string;
    privateKey: string;
    databaseUrl?: string;
  };
  crawl4ai: {
    url: string;
    apiKey?: string;
    enabled: boolean;
  };

  // AI/ML Services
  ai: {
    openai?: {
      apiKey: string;
      organization?: string;
    };
    huggingface?: {
      token: string;
      model?: string;
    };
    anthropic?: {
      apiKey: string;
    };
    google?: {
      apiKey: string;
    };
  };

  // Google Services
  google: {
    clientId?: string;
    clientSecret?: string;
    pagespeedApiKey?: string;
    mapsApiKey?: string;
    safeBrowsingApiKey?: string;
    siteVerification?: string;
  };

  // Application Config
  app: {
    nodeEnv: string;
    environment: string;
    siteUrl: string;
    baseUrl: string;
  };

  // Security & Monitoring
  security: {
    nextAuthSecret: string;
    cronSecret?: string;
  };

  // Alert Configuration
  alerts?: {
    emailEnabled: boolean;
    emailTo?: string;
    emailFrom?: string;
    webhookUrl?: string;
  };
}

/**
 * Validates required environment variables
 */
function validateRequiredEnvVars(): string[] {
  const missing: string[] = [];
  
  // Critical environment variables
  if (!process.env.NEXTAUTH_SECRET) {
    missing.push('NEXTAUTH_SECRET');
  }
  
  if (!process.env.NEXT_PUBLIC_SITE_URL) {
    missing.push('NEXT_PUBLIC_SITE_URL');
  }

  return missing;
}

/**
 * Securely loads and validates environment configuration
 */
export function loadEnvironmentConfig(): EnvironmentConfig {
  // Validate required variables first
  const missing = validateRequiredEnvVars();
  if (missing.length > 0) {
    console.warn('⚠️  Missing required environment variables:', missing);
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }

  return {
    // Redis Configuration
    redis: {
      url: process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL || 'redis://localhost:6379',
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      cacheTtl: parseInt(process.env.REDIS_CACHE_TTL || '3600'),
      maxRetries: parseInt(process.env.REDIS_MAX_RETRIES || '3'),
      retryDelay: parseInt(process.env.REDIS_RETRY_DELAY || '1000'),
    },

    // Firebase Configuration
    firebase: {
      projectId: process.env.FIREBASE_PROJECT_ID || 'xenlix-aeo-platform',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk@xenlix-aeo-platform.iam.gserviceaccount.com',
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      databaseUrl: process.env.FIREBASE_DATABASE_URL,
    },

    // Crawl4AI Configuration
    crawl4ai: {
      url: process.env.CRAWL4AI_URL || process.env.CRAWL4AI_SERVICE_URL || 'http://localhost:8001',
      apiKey: process.env.CRAWL4AI_API_KEY || 'demo-key',
      enabled: process.env.CRAWL4AI_ENABLED !== 'false',
    },

    // AI/ML Services
    ai: {
      openai: process.env.OPENAI_API_KEY ? {
        apiKey: process.env.OPENAI_API_KEY,
        organization: process.env.OPENAI_ORGANIZATION,
      } : undefined,
      
      huggingface: process.env.HUGGINGFACE_API_TOKEN ? {
        token: process.env.HUGGINGFACE_API_TOKEN,
        model: process.env.HUGGINGFACE_MODEL || 'sentence-transformers/all-MiniLM-L6-v2',
      } : undefined,
      
      anthropic: process.env.ANTHROPIC_API_KEY ? {
        apiKey: process.env.ANTHROPIC_API_KEY,
      } : undefined,
      
      google: process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY ? {
        apiKey: process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY!,
      } : undefined,
    },

    // Google Services
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      pagespeedApiKey: process.env.PSI_API_KEY || process.env.GOOGLE_PAGESPEED_API_KEY,
      mapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      safeBrowsingApiKey: process.env.GOOGLE_SAFE_BROWSING_API_KEY,
      siteVerification: process.env.GOOGLE_SITE_VERIFICATION,
    },

    // Application Configuration
    app: {
      nodeEnv: process.env.NODE_ENV || 'development',
      environment: process.env.APP_ENV || process.env.ENVIRONMENT || 'development',
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.xenlixai.com',
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.xenlixai.com',
    },

    // Security Configuration
    security: {
      nextAuthSecret: process.env.NEXTAUTH_SECRET || 'development-secret-key',
      cronSecret: process.env.CRON_SECRET,
    },

    // Alert Configuration
    alerts: {
      emailEnabled: process.env.ALERT_EMAIL_ENABLED === 'true',
      emailTo: process.env.ALERT_EMAIL_TO,
      emailFrom: process.env.ALERT_EMAIL_FROM,
      webhookUrl: process.env.ALERT_WEBHOOK_URL,
    },
  };
}

/**
 * Gets environment configuration with caching
 */
let cachedConfig: EnvironmentConfig | null = null;

export function getEnvironmentConfig(): EnvironmentConfig {
  if (!cachedConfig) {
    cachedConfig = loadEnvironmentConfig();
    
    // Log configuration status (without sensitive data)
    console.log('🔧 Environment Configuration Loaded:', {
      nodeEnv: cachedConfig.app.nodeEnv,
      environment: cachedConfig.app.environment,
      services: {
        redis: !!cachedConfig.redis.url,
        firebase: !!cachedConfig.firebase.projectId,
        crawl4ai: cachedConfig.crawl4ai.enabled,
        openai: !!cachedConfig.ai.openai,
        huggingface: !!cachedConfig.ai.huggingface,
        anthropic: !!cachedConfig.ai.anthropic,
      }
    });
  }
  
  return cachedConfig;
}

/**
 * Checks if service is available based on configuration
 */
export function isServiceAvailable(service: keyof EnvironmentConfig): boolean {
  const config = getEnvironmentConfig();
  
  switch (service) {
    case 'redis':
      return !!config.redis.url && config.app.nodeEnv === 'production';
    case 'firebase':
      return !!config.firebase.projectId && !!config.firebase.privateKey;
    case 'crawl4ai':
      return config.crawl4ai.enabled && !!config.crawl4ai.url;
    default:
      return false;
  }
}

/**
 * Gets service URL with fallbacks
 */
export function getServiceUrl(service: 'crawl4ai' | 'nextauth'): string {
  const config = getEnvironmentConfig();
  
  switch (service) {
    case 'crawl4ai':
      return config.crawl4ai.url;
    case 'nextauth':
      return process.env.NEXTAUTH_URL || config.app.baseUrl;
    default:
      throw new Error(`Unknown service: ${service}`);
  }
}