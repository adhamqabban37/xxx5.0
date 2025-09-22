import { NextRequest, NextResponse } from 'next/server';

// Request validation schema (simplified to avoid zod dependency)
interface RequestBody {
  url?: string;
  domains?: string[];
}

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
    return { valid: false, error: 'Either url or domains array with at least one domain must be provided' };
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

// Extract hostname from URL
function extractHostname(url: string): string {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    // If URL parsing fails, assume it's already a domain
    return url.replace(/^www\./, '').toLowerCase();
  }
}

// Validate domain format
function isValidDomain(domain: string): boolean {
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return domainRegex.test(domain) && domain.length <= 253;
}

export async function POST(request: NextRequest) {
  try {
    // Check API key
    const apiKey = process.env.OPR_API_KEY;
    if (!apiKey) {
      console.error('OPR_API_KEY not configured');
      return NextResponse.json(
        { error: 'Open PageRank API not configured' },
        { status: 500 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    console.log('Received request body:', JSON.stringify(body, null, 2));
    
    const validation = validateRequest(body);
    
    if (!validation.valid) {
      console.error('Validation failed:', validation.error);
      return NextResponse.json(
        { error: validation.error || 'Invalid request format' },
        { status: 400 }
      );
    }

    const { url, domains = [] } = validation.data!;
    console.log('Validated data:', { url, domains });

    // Build domain list
    const allDomains = new Set<string>();
    
    // Add domain from URL if provided
    if (url) {
      const hostname = extractHostname(url);
      if (isValidDomain(hostname)) {
        allDomains.add(hostname);
      }
    }

    // Add additional domains
    domains.forEach((domain: string) => {
      const cleanDomain = extractHostname(domain);
      if (isValidDomain(cleanDomain)) {
        allDomains.add(cleanDomain);
      }
    });

    // Validate we have at least one domain
    if (allDomains.size === 0) {
      return NextResponse.json(
        { error: 'No valid domains provided' },
        { status: 400 }
      );
    }

    // Limit to 100 domains (API constraint)
    const domainList = Array.from(allDomains).slice(0, 100);

    // Build Open PageRank API URL
    const oprUrl = new URL('https://openpagerank.com/api/v1.0/getPageRank');
    domainList.forEach(domain => {
      oprUrl.searchParams.append('domains[]', domain);
    });

    console.log(`Fetching OPR data for ${domainList.length} domains:`, domainList);

    // Call Open PageRank API with caching
    const oprResponse = await fetch(oprUrl.toString(), {
      method: 'GET',
      headers: {
        'API-OPR': apiKey,
        'User-Agent': 'XenlixAI-Dashboard/1.0',
      },
      next: { revalidate: 60 * 60 * 24 }, // 24h cache
    });

    if (!oprResponse.ok) {
      const errorBody = await oprResponse.text().catch(() => 'Unknown error');
      console.error(`OPR API error ${oprResponse.status}:`, errorBody);
      
      return NextResponse.json(
        {
          code: 'upstream_error',
          status: oprResponse.status,
          body: errorBody.slice(0, 200), // Limit error body size
        },
        { status: 502 }
      );
    }

    const oprData: OPRResponse = await oprResponse.json();

    // Handle API-level errors
    if (oprData.status_code !== 200 || !oprData.response) {
      console.error('OPR API returned error:', oprData.error);
      return NextResponse.json(
        {
          code: 'upstream_error',
          status: oprData.status_code,
          body: oprData.error || 'Unknown API error',
        },
        { status: 502 }
      );
    }

    // Normalize response data
    const results: AuthorityResult[] = oprData.response.map(item => ({
      domain: item.domain,
      opr: Math.round(item.page_rank_decimal * 100) / 100, // Round to 2 decimals
      oprInt: item.page_rank_integer,
      globalRank: item.rank || null,
      status: item.status_code === 200 ? 'success' : 'error',
      error: item.error || undefined,
    }));

    // Add any missing domains with error status
    domainList.forEach(domain => {
      if (!results.find(r => r.domain === domain)) {
        results.push({
          domain,
          opr: 0,
          oprInt: 0,
          globalRank: null,
          status: 'error',
          error: 'Domain not found in response',
        });
      }
    });

    const response: AuthorityResponse = {
      updatedAt: new Date().toISOString(),
      results,
    };

    console.log(`OPR data fetched successfully for ${results.length} domains`);

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200', // 24h cache, 12h stale
      },
    });

  } catch (error) {
    console.error('Authority API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Reject other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405 }
  );
}