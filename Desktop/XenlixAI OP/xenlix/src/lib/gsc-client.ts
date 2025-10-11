// Google Search Console API client utility
// Handles authentication, API calls, and caching for GSC data

interface GSCAuthConfig {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

interface GSCSearchAnalyticsRequest {
  startDate: string;
  endDate: string;
  dimensions?: ('query' | 'page' | 'country' | 'device' | 'searchAppearance')[];
  type?: 'web' | 'image' | 'video';
  rowLimit?: number;
  startRow?: number;
}

interface GSCSearchAnalyticsRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface GSCSearchAnalyticsResponse {
  rows: GSCSearchAnalyticsRow[];
  responseAggregationType: string;
}

interface GSCUrlInspectionRequest {
  inspectionUrl: string;
  siteUrl: string;
  languageCode?: string;
}

interface GSCUrlInspectionResponse {
  inspectionResult: {
    indexStatusResult: {
      verdict: 'PASS' | 'PARTIAL' | 'FAIL' | 'NEUTRAL';
      coverageState: string;
      robotsTxtState: string;
      indexingState: string;
      lastCrawlTime: string;
      pageFetchState: string;
      googleCanonical: string;
      userCanonical: string;
    };
    mobileUsabilityResult: {
      verdict: 'PASS' | 'FAIL' | 'NEUTRAL';
      issues: Array<{
        issueType: string;
        severity: string;
        message: string;
      }>;
    };
    richResultsResult: {
      verdict: 'PASS' | 'FAIL' | 'NEUTRAL';
      detectedItems: Array<{
        richResultType: string;
        items: Array<{
          name: string;
          issues: Array<{
            issueType: string;
            severity: string;
            message: string;
          }>;
        }>;
      }>;
    };
  };
}

interface GSCSite {
  siteUrl: string;
  permissionLevel: 'siteFullUser' | 'siteOwner' | 'siteRestrictedUser' | 'siteUnverifiedUser';
}

interface GSCSitesResponse {
  siteEntry: GSCSite[];
}

// Cache implementation for GSC data
class GSCCache {
  private static cache = new Map<string, { data: any; expires: number }>();

  static set(key: string, data: any, ttlSeconds: number): void {
    const expires = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { data, expires });
  }

  static get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expires) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  static clear(): void {
    this.cache.clear();
  }

  static delete(key: string): void {
    this.cache.delete(key);
  }
}

export class GSCClient {
  private accessToken: string;
  private refreshToken?: string;
  private expiresAt?: number;

  constructor(auth: GSCAuthConfig) {
    this.accessToken = auth.accessToken;
    this.refreshToken = auth.refreshToken;
    this.expiresAt = auth.expiresAt;
  }

  // Check if access token is expired and needs refresh
  private isTokenExpired(): boolean {
    if (!this.expiresAt) return false;
    return Date.now() >= this.expiresAt * 1000 - 300000; // Refresh 5 min before expiry
  }

  // Refresh access token using refresh token
  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: this.refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh access token');
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.expiresAt = Math.floor(Date.now() / 1000) + data.expires_in;
  }

  // Make authenticated request to GSC API
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Refresh token if needed
    if (this.isTokenExpired()) {
      await this.refreshAccessToken();
    }

    const response = await fetch(`https://www.googleapis.com/webmasters/v3${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (response.status === 401) {
      throw new Error('GSC_AUTH_REQUIRED');
    }

    if (response.status === 403) {
      throw new Error('GSC_PERMISSION_DENIED');
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GSC API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  // Get list of Search Console sites/properties
  async getSites(): Promise<GSCSite[]> {
    const cacheKey = `gsc:sites:${this.accessToken.slice(-10)}`;
    const cached = GSCCache.get<GSCSite[]>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const response = await this.makeRequest<GSCSitesResponse>('/sites');
      const sites = response.siteEntry || [];

      // Cache for 1 hour
      GSCCache.set(cacheKey, sites, 3600);

      return sites;
    } catch (error) {
      console.error('GSC getSites error:', error);
      throw error;
    }
  }

  // Get search analytics data with caching
  async getSearchAnalytics(
    siteUrl: string,
    request: GSCSearchAnalyticsRequest
  ): Promise<GSCSearchAnalyticsResponse> {
    const cacheKey = `gsc:analytics:${siteUrl}:${JSON.stringify(request)}`;
    const cached = GSCCache.get<GSCSearchAnalyticsResponse>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const encodedSiteUrl = encodeURIComponent(siteUrl);
      const response = await this.makeRequest<GSCSearchAnalyticsResponse>(
        `/sites/${encodedSiteUrl}/searchAnalytics/query`,
        {
          method: 'POST',
          body: JSON.stringify(request),
        }
      );

      // Cache for 24 hours (analytics data)
      GSCCache.set(cacheKey, response, 86400);

      return response;
    } catch (error) {
      console.error('GSC getSearchAnalytics error:', error);
      throw error;
    }
  }

  // Inspect URL for indexing status with caching
  async inspectUrl(
    siteUrl: string,
    inspectionUrl: string,
    languageCode: string = 'en-US'
  ): Promise<GSCUrlInspectionResponse> {
    const cacheKey = `gsc:inspect:${siteUrl}:${inspectionUrl}`;
    const cached = GSCCache.get<GSCUrlInspectionResponse>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const encodedSiteUrl = encodeURIComponent(siteUrl);
      const response = await this.makeRequest<GSCUrlInspectionResponse>(
        `/urlInspection/index:inspect`,
        {
          method: 'POST',
          body: JSON.stringify({
            inspectionUrl,
            siteUrl,
            languageCode,
          }),
        }
      );

      // Cache for 6 hours (inspection data)
      GSCCache.set(cacheKey, response, 21600);

      return response;
    } catch (error) {
      console.error('GSC inspectUrl error:', error);
      throw error;
    }
  }

  // Get formatted search analytics for queries
  async getTopQueries(
    siteUrl: string,
    startDate: string,
    endDate: string,
    limit: number = 20
  ): Promise<GSCSearchAnalyticsRow[]> {
    const response = await this.getSearchAnalytics(siteUrl, {
      startDate,
      endDate,
      dimensions: ['query'],
      rowLimit: limit,
    });

    return response.rows || [];
  }

  // Get formatted search analytics for pages
  async getTopPages(
    siteUrl: string,
    startDate: string,
    endDate: string,
    limit: number = 20
  ): Promise<GSCSearchAnalyticsRow[]> {
    const response = await this.getSearchAnalytics(siteUrl, {
      startDate,
      endDate,
      dimensions: ['page'],
      rowLimit: limit,
    });

    return response.rows || [];
  }

  // Get index status for multiple URLs (batch inspection)
  async batchInspectUrls(
    siteUrl: string,
    urls: string[]
  ): Promise<Array<{ url: string; result: GSCUrlInspectionResponse | null; error?: string }>> {
    const results = [];

    // Process URLs in parallel but with rate limiting
    const chunks = [];
    for (let i = 0; i < urls.length; i += 5) {
      chunks.push(urls.slice(i, i + 5));
    }

    for (const chunk of chunks) {
      const chunkPromises = chunk.map(async (url) => {
        try {
          const result = await this.inspectUrl(siteUrl, url);
          return { url, result };
        } catch (error) {
          return {
            url,
            result: null,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      });

      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);

      // Small delay between chunks to respect rate limits
      if (chunks.indexOf(chunk) < chunks.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  // Clear cache for specific site
  static clearSiteCache(siteUrl: string): void {
    const keys = Array.from(GSCCache['cache'].keys());
    keys.forEach((key) => {
      if (key.includes(siteUrl)) {
        GSCCache.delete(key);
      }
    });
  }

  // Clear all cache
  static clearAllCache(): void {
    GSCCache.clear();
  }
}

// Utility functions
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function getDateRange(days: number): { startDate: string; endDate: string } {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  };
}

export function getIndexStatusBadge(verdict: string): {
  text: string;
  color: 'green' | 'yellow' | 'red' | 'gray';
} {
  switch (verdict) {
    case 'PASS':
      return { text: 'Indexed', color: 'green' };
    case 'PARTIAL':
      return { text: 'Partial', color: 'yellow' };
    case 'FAIL':
      return { text: 'Not Indexed', color: 'red' };
    case 'NEUTRAL':
    default:
      return { text: 'Unknown', color: 'gray' };
  }
}

export type {
  GSCAuthConfig,
  GSCSearchAnalyticsRequest,
  GSCSearchAnalyticsRow,
  GSCSearchAnalyticsResponse,
  GSCUrlInspectionResponse,
  GSCSite,
};
