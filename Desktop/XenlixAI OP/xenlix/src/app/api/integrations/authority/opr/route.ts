import { NextRequest, NextResponse } from 'next/server';
import { URL } from 'url';

// Enhanced request validation schema
interface RequestBody {
  url?: string;
  domains?: string[];
}

interface ValidationResult {
  isValid: boolean;
  domain: string;
  error?: string;
}

// Enhanced logging utility with consistent format and metadata
const log = {
  info: (message: string, metadata?: Record<string, any>) => {
    const timestamp = new Date().toISOString();
    console.log(
      `[${timestamp}] [OPR-API] INFO: ${message}`,
      metadata ? JSON.stringify(metadata) : ''
    );
  },
  warn: (message: string, metadata?: Record<string, any>) => {
    const timestamp = new Date().toISOString();
    console.warn(
      `[${timestamp}] [OPR-API] WARN: ${message}`,
      metadata ? JSON.stringify(metadata) : ''
    );
  },
  error: (message: string, metadata?: Record<string, any>) => {
    const timestamp = new Date().toISOString();
    console.error(
      `[${timestamp}] [OPR-API] ERROR: ${message}`,
      metadata ? JSON.stringify(metadata) : ''
    );
  },
};

// Validate request body manually
function validateRequest(body: any): { valid: boolean; data?: RequestBody; error?: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a JSON object' };
  }

  const { url, domains } = body;

  // Validate URL if provided (just check if it's a non-empty string)
  if (url !== undefined) {
    if (typeof url !== 'string' || url.trim() === '') {
      return { valid: false, error: 'URL must be a non-empty string' };
    }
  }

  // Validate domains if provided
  if (domains !== undefined) {
    if (!Array.isArray(domains)) {
      return { valid: false, error: 'Domains must be an array' };
    }
    for (const domain of domains) {
      if (typeof domain !== 'string') {
        return { valid: false, error: 'All domains must be strings' };
      }
    }
  }

  // At least one of url or domains must be provided and not empty
  const hasValidUrl = url && typeof url === 'string' && url.trim() !== '';
  const hasValidDomains = domains && Array.isArray(domains) && domains.length > 0;

  if (!hasValidUrl && !hasValidDomains) {
    return {
      valid: false,
      error: 'Either url or domains array with at least one domain must be provided',
    };
  }

  return { valid: true, data: { url, domains } };
}

// Open PageRank API response types
interface OPRResponse {
  status_code: number;
  error?: string;
  response?: Array<{
    domain: string;
    page_rank_decimal: number;
    page_rank_integer: number;
    rank?: number;
    status_code: number;
    error?: string;
  }>;
}

// Normalized response type
interface AuthorityResult {
  domain: string;
  opr: number;
  oprInt: number;
  globalRank: number | null;
  status: 'success' | 'error';
  error?: string;
}

interface AuthorityResponse {
  updatedAt: string;
  results: AuthorityResult[];
}

// Enhanced hostname extraction with robust fallback logic
function extractHostname(url: string): ValidationResult {
  const trimmedUrl = url.trim();

  if (!trimmedUrl) {
    return { isValid: false, domain: '', error: 'Empty URL provided' };
  }

  try {
    // Try parsing as full URL first
    let urlObj: URL;

    if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
      urlObj = new URL(trimmedUrl);
    } else {
      // Try adding protocol
      urlObj = new URL(`https://${trimmedUrl}`);
    }

    let hostname = urlObj.hostname.toLowerCase();

    // Remove www prefix
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }

    // Validate extracted hostname
    if (!hostname || hostname.length === 0) {
      return { isValid: false, domain: trimmedUrl, error: 'No hostname found in URL' };
    }

    return { isValid: true, domain: hostname };
  } catch (urlError) {
    // Fallback: treat as domain directly
    log.warn('URL parsing failed, attempting direct domain extraction', {
      originalUrl: trimmedUrl,
      error: urlError instanceof Error ? urlError.message : 'Unknown error',
    });

    try {
      // Clean up potential domain string
      let cleanDomain = trimmedUrl
        .toLowerCase()
        .replace(/^https?:\/\//, '') // Remove protocol
        .replace(/^www\./, '') // Remove www
        .replace(/\/.*$/, '') // Remove path
        .replace(/:.*$/, '') // Remove port
        .replace(/\?.*$/, '') // Remove query params
        .replace(/#.*$/, ''); // Remove anchors

      if (!cleanDomain) {
        return { isValid: false, domain: trimmedUrl, error: 'Unable to extract valid domain' };
      }

      return { isValid: true, domain: cleanDomain };
    } catch (fallbackError) {
      log.error('Both URL parsing and fallback extraction failed', {
        originalUrl: trimmedUrl,
        urlError: urlError instanceof Error ? urlError.message : 'Unknown URL error',
        fallbackError:
          fallbackError instanceof Error ? fallbackError.message : 'Unknown fallback error',
      });

      return {
        isValid: false,
        domain: trimmedUrl,
        error: 'Failed to extract domain from input',
      };
    }
  }
}

// Enhanced domain validation supporting IDNs and Punycode
function isValidDomain(domain: string): ValidationResult {
  if (!domain || typeof domain !== 'string') {
    return { isValid: false, domain: domain || '', error: 'Domain must be a non-empty string' };
  }

  const cleanDomain = domain.trim().toLowerCase();

  if (cleanDomain.length === 0) {
    return { isValid: false, domain: cleanDomain, error: 'Domain cannot be empty' };
  }

  if (cleanDomain.length > 253) {
    return {
      isValid: false,
      domain: cleanDomain,
      error: 'Domain name too long (max 253 characters)',
    };
  }

  try {
    // Use URL constructor to validate domain format (supports IDN/Punycode)
    const testUrl = new URL(`https://${cleanDomain}`);
    const normalizedDomain = testUrl.hostname.toLowerCase();

    // Additional checks for domain structure
    if (normalizedDomain !== cleanDomain) {
      log.info('Domain normalized during validation', {
        original: cleanDomain,
        normalized: normalizedDomain,
      });
    }

    // Check for valid TLD (must have at least one dot and valid characters)
    if (!normalizedDomain.includes('.')) {
      return {
        isValid: false,
        domain: cleanDomain,
        error: 'Domain must include a top-level domain (TLD)',
      };
    }

    // Check for invalid patterns
    if (normalizedDomain.startsWith('.') || normalizedDomain.endsWith('.')) {
      return {
        isValid: false,
        domain: cleanDomain,
        error: 'Domain cannot start or end with a dot',
      };
    }

    if (normalizedDomain.includes('..')) {
      return {
        isValid: false,
        domain: cleanDomain,
        error: 'Domain cannot contain consecutive dots',
      };
    }

    // Enhanced regex that supports IDN domains (including xn-- Punycode prefix)
    const domainRegex =
      /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;
    const punycodeRegex =
      /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*xn--[a-zA-Z0-9-]+(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    if (!domainRegex.test(normalizedDomain) && !punycodeRegex.test(normalizedDomain)) {
      return {
        isValid: false,
        domain: cleanDomain,
        error: 'Domain contains invalid characters or format',
      };
    }

    return { isValid: true, domain: normalizedDomain };
  } catch (validationError) {
    return {
      isValid: false,
      domain: cleanDomain,
      error: `Invalid domain format: ${validationError instanceof Error ? validationError.message : 'Unknown error'}`,
    };
  }
}

// Enhanced environment variable validation
function validateApiKey(): { isValid: boolean; error?: string } {
  const apiKey = process.env.OPR_API_KEY;

  if (!apiKey) {
    return {
      isValid: false,
      error:
        'OPR_API_KEY environment variable is not set. Please configure your Open PageRank API key.',
    };
  }

  if (typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    return {
      isValid: false,
      error: 'OPR_API_KEY environment variable is empty or invalid.',
    };
  }

  // Basic format validation (OPR keys are typically alphanumeric)
  const keyPattern = /^[a-zA-Z0-9]+$/;
  if (!keyPattern.test(apiKey.trim())) {
    return {
      isValid: false,
      error: 'OPR_API_KEY format appears to be invalid. Expected alphanumeric characters only.',
    };
  }

  return { isValid: true };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Enhanced API key validation
    const keyValidation = validateApiKey();
    if (!keyValidation.isValid) {
      log.error('API key validation failed', { error: keyValidation.error });
      return NextResponse.json(
        { error: keyValidation.error, code: 'INVALID_API_KEY' },
        { status: 401 }
      );
    }

    const apiKey = process.env.OPR_API_KEY!;
    log.info('API key validated successfully');

    // Parse and validate request body
    const body = await request.json();
    log.info('Request received', { bodyKeys: Object.keys(body) });

    const validation = validateRequest(body);

    if (!validation.valid) {
      log.error('Request validation failed', { error: validation.error, body });
      return NextResponse.json(
        { error: validation.error || 'Invalid request format', code: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }

    const { url, domains = [] } = validation.data!;
    log.info('Request validated successfully', { hasUrl: !!url, domainCount: domains.length });

    // Build domain list with enhanced validation
    const allDomains = new Set<string>();
    const invalidDomains: Array<{ input: string; error: string }> = [];

    // Add domain from URL if provided
    if (url) {
      const hostnameResult = extractHostname(url);
      if (hostnameResult.isValid) {
        const domainValidation = isValidDomain(hostnameResult.domain);
        if (domainValidation.isValid) {
          allDomains.add(domainValidation.domain);
        } else {
          invalidDomains.push({
            input: url,
            error: domainValidation.error || 'Invalid domain format',
          });
        }
      } else {
        invalidDomains.push({
          input: url,
          error: hostnameResult.error || 'Failed to extract hostname',
        });
      }
    }

    // Add additional domains
    domains.forEach((domain: string) => {
      const hostnameResult = extractHostname(domain);
      if (hostnameResult.isValid) {
        const domainValidation = isValidDomain(hostnameResult.domain);
        if (domainValidation.isValid) {
          allDomains.add(domainValidation.domain);
        } else {
          invalidDomains.push({
            input: domain,
            error: domainValidation.error || 'Invalid domain format',
          });
        }
      } else {
        invalidDomains.push({
          input: domain,
          error: hostnameResult.error || 'Failed to extract hostname',
        });
      }
    });

    // Log invalid domains for debugging
    if (invalidDomains.length > 0) {
      log.warn('Some domains failed validation', {
        invalidCount: invalidDomains.length,
        invalidDomains: invalidDomains.slice(0, 5), // Log first 5 for brevity
        totalAttempted: domains.length + (url ? 1 : 0),
      });
    }

    // Validate we have at least one domain
    if (allDomains.size === 0) {
      const errorMessage =
        invalidDomains.length > 0
          ? `No valid domains provided. ${invalidDomains.length} domains failed validation.`
          : 'No valid domains provided.';

      log.error('No valid domains after processing', {
        invalidDomains,
        originalInput: { url, domains },
      });

      return NextResponse.json(
        {
          error: errorMessage,
          code: 'NO_VALID_DOMAINS',
          details: invalidDomains.length <= 10 ? invalidDomains : invalidDomains.slice(0, 10),
        },
        { status: 400 }
      );
    }

    // Limit to 100 domains (API constraint)
    const domainList = Array.from(allDomains).slice(0, 100);

    if (allDomains.size > 100) {
      log.warn('Domain list truncated due to API limits', {
        originalCount: allDomains.size,
        truncatedCount: domainList.length,
      });
    }

    // Build Open PageRank API URL
    const oprUrl = new URL('https://openpagerank.com/api/v1.0/getPageRank');
    domainList.forEach((domain) => {
      oprUrl.searchParams.append('domains[]', domain);
    });

    log.info('Initiating OPR API request', {
      domainCount: domainList.length,
      domains: domainList.slice(0, 10), // Log first 10 domains
      apiUrl: oprUrl.origin + oprUrl.pathname,
    });

    // Call Open PageRank API with enhanced error handling and timeout
    const fetchStartTime = Date.now();
    let oprResponse: Response;

    try {
      oprResponse = await fetch(oprUrl.toString(), {
        method: 'GET',
        headers: {
          'API-OPR': apiKey,
          'User-Agent': 'XenlixAI-Dashboard/1.0',
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        // Note: Next.js caching handled by return headers
        signal: AbortSignal.timeout(30000), // 30 second timeout
      } as RequestInit);
    } catch (fetchError) {
      const fetchTime = Date.now() - fetchStartTime;
      log.error('OPR API fetch failed', {
        error: fetchError instanceof Error ? fetchError.message : 'Unknown fetch error',
        fetchTimeMs: fetchTime,
        domainCount: domainList.length,
      });

      if (fetchError instanceof Error && fetchError.name === 'TimeoutError') {
        return NextResponse.json(
          {
            error: 'Request to Open PageRank API timed out. Please try again with fewer domains.',
            code: 'API_TIMEOUT',
            details: { domainCount: domainList.length, timeoutMs: 30000 },
          },
          { status: 504 }
        );
      }

      return NextResponse.json(
        {
          error:
            'Failed to connect to Open PageRank API. Please check your internet connection and try again.',
          code: 'API_CONNECTION_ERROR',
          details: { error: fetchError instanceof Error ? fetchError.message : 'Unknown error' },
        },
        { status: 502 }
      );
    }

    const fetchTime = Date.now() - fetchStartTime;
    log.info('OPR API response received', {
      statusCode: oprResponse.status,
      fetchTimeMs: fetchTime,
      contentType: oprResponse.headers.get('content-type'),
    });

    if (!oprResponse.ok) {
      let errorBody: string;
      try {
        errorBody = await oprResponse.text();
      } catch (textError) {
        errorBody = 'Unable to read error response';
        log.warn('Failed to read OPR API error response', {
          textError: textError instanceof Error ? textError.message : 'Unknown text error',
        });
      }

      // Enhanced error status code mapping
      const statusCode = oprResponse.status;
      let clientStatusCode = 502; // Default to bad gateway
      let errorMessage = 'Open PageRank API request failed';

      if (statusCode === 401 || statusCode === 403) {
        clientStatusCode = 401;
        errorMessage =
          'Invalid or expired Open PageRank API key. Please check your OPR_API_KEY configuration.';
      } else if (statusCode === 429) {
        clientStatusCode = 429;
        errorMessage = 'Open PageRank API rate limit exceeded. Please try again later.';
      } else if (statusCode === 400) {
        clientStatusCode = 400;
        errorMessage = 'Invalid request to Open PageRank API. Please check your domain formatting.';
      } else if (statusCode >= 500) {
        errorMessage = 'Open PageRank API is temporarily unavailable. Please try again later.';
      }

      log.error('OPR API returned error status', {
        statusCode,
        errorBody: errorBody.length > 500 ? errorBody.substring(0, 500) + '...' : errorBody,
        domainCount: domainList.length,
      });

      return NextResponse.json(
        {
          error: errorMessage,
          code: 'OPR_API_ERROR',
          details: {
            statusCode: statusCode,
            errorBody: errorBody.slice(0, 200), // Limit error body size
            domainCount: domainList.length,
          },
        },
        { status: clientStatusCode }
      );
    }

    // Parse JSON response with error handling
    let oprData: OPRResponse;
    try {
      oprData = await oprResponse.json();
    } catch (jsonError) {
      log.error('Failed to parse OPR API JSON response', {
        jsonError: jsonError instanceof Error ? jsonError.message : 'Unknown JSON error',
        responseStatus: oprResponse.status,
        contentType: oprResponse.headers.get('content-type'),
      });

      return NextResponse.json(
        {
          error: 'Invalid response format from Open PageRank API',
          code: 'INVALID_API_RESPONSE',
          details: {
            statusCode: oprResponse.status,
            contentType: oprResponse.headers.get('content-type'),
          },
        },
        { status: 502 }
      );
    }

    // Handle API-level errors in response data
    if (oprData.status_code !== 200 || !oprData.response) {
      const apiError = oprData.error || 'Unknown API error';
      log.error('OPR API returned error in response data', {
        statusCode: oprData.status_code,
        error: apiError,
        hasResponse: !!oprData.response,
      });

      return NextResponse.json(
        {
          error: `Open PageRank API error: ${apiError}`,
          code: 'OPR_API_RESPONSE_ERROR',
          details: {
            statusCode: oprData.status_code,
            apiError: apiError,
          },
        },
        { status: 502 }
      );
    }

    // Normalize response data with enhanced validation
    const results: AuthorityResult[] = [];
    const processedDomains = new Set<string>();

    oprData.response.forEach((item) => {
      if (!item.domain) {
        log.warn('OPR response item missing domain', { item });
        return;
      }

      processedDomains.add(item.domain);

      results.push({
        domain: item.domain,
        opr:
          typeof item.page_rank_decimal === 'number'
            ? Math.round(item.page_rank_decimal * 100) / 100
            : 0, // Round to 2 decimals or default to 0
        oprInt: typeof item.page_rank_integer === 'number' ? item.page_rank_integer : 0,
        globalRank: typeof item.rank === 'number' ? item.rank : null,
        status: item.status_code === 200 ? 'success' : 'error',
        error: item.error || undefined,
      });
    });

    // Add any missing domains with error status
    const missingDomains: string[] = [];
    domainList.forEach((domain) => {
      if (!processedDomains.has(domain)) {
        missingDomains.push(domain);
        results.push({
          domain,
          opr: 0,
          oprInt: 0,
          globalRank: null,
          status: 'error',
          error: 'Domain not found in OPR response',
        });
      }
    });

    if (missingDomains.length > 0) {
      log.warn('Some domains missing from OPR response', {
        missingDomains,
        missingCount: missingDomains.length,
        totalRequested: domainList.length,
      });
    }

    const totalTime = Date.now() - startTime;
    const response: AuthorityResponse = {
      updatedAt: new Date().toISOString(),
      results,
    };

    log.info('OPR API request completed successfully', {
      domainsRequested: domainList.length,
      domainsReturned: results.length,
      successfulResults: results.filter((r) => r.status === 'success').length,
      missingDomains: missingDomains.length,
      totalTimeMs: totalTime,
      fetchTimeMs: fetchTime,
    });

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200', // 24h cache, 12h stale
        'X-Response-Time': `${totalTime}ms`,
        'X-Domain-Count': domainList.length.toString(),
      },
    });
  } catch (error) {
    const totalTime = Date.now() - startTime;

    log.error('Unexpected error in OPR API handler', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      totalTimeMs: totalTime,
    });

    // Don't leak internal error details to client
    return NextResponse.json(
      {
        error: 'An unexpected error occurred while processing your request. Please try again.',
        code: 'INTERNAL_SERVER_ERROR',
        requestId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      },
      { status: 500 }
    );
  }
}

// Enhanced method validation with proper error responses
export async function GET() {
  log.warn('GET method attempted on OPR API endpoint', {
    userAgent: 'Unknown',
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json(
    {
      error: 'Method not allowed. This endpoint only accepts POST requests.',
      code: 'METHOD_NOT_ALLOWED',
      allowedMethods: ['POST'],
      documentation:
        'Send POST request with { "url": "example.com" } or { "domains": ["example.com"] }',
    },
    {
      status: 405,
      headers: {
        Allow: 'POST',
        'Content-Type': 'application/json',
      },
    }
  );
}

export async function PUT() {
  return NextResponse.json(
    {
      error: 'Method not allowed. This endpoint only accepts POST requests.',
      code: 'METHOD_NOT_ALLOWED',
      allowedMethods: ['POST'],
    },
    { status: 405, headers: { Allow: 'POST' } }
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      error: 'Method not allowed. This endpoint only accepts POST requests.',
      code: 'METHOD_NOT_ALLOWED',
      allowedMethods: ['POST'],
    },
    { status: 405, headers: { Allow: 'POST' } }
  );
}
