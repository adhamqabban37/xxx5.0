/**
 * Google Search Console Summary API
 *
 * Fetches search analytics, sitemap data, and index status for verified sites
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';
import { decryptToken } from '@/lib/google-token-encryption';
import { z } from 'zod';

// Request validation
const gscSummarySchema = z.object({
  siteUrl: z.string().url('Please provide a valid site URL'),
});

// GSC API interfaces
interface GSCSearchAnalytics {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  period: string;
}

interface GSCSitemapInfo {
  path: string;
  submitted: number;
  indexed: number;
  lastSubmitted?: string;
}

interface GSCIndexStatus {
  totalPages: number;
  indexedPages: number;
  notIndexedPages: number;
}

interface GSCSummary {
  verified: boolean;
  siteUrl?: string;
  searchAnalytics?: GSCSearchAnalytics;
  sitemaps?: GSCSitemapInfo[];
  indexStatus?: GSCIndexStatus;
  lastUpdated: string;
  error?: string;
}

/**
 * Get authenticated Google Search Console client
 */
async function getGSCClient(userId: string): Promise<any | null> {
  try {
    // Get tokens from database
    const tokenRecord = await prisma.googleTokens.findUnique({
      where: { userId },
    });

    if (!tokenRecord || !tokenRecord.encryptedAccessToken) {
      return null;
    }

    // Check if token is expired
    if (tokenRecord.tokenExpiresAt && tokenRecord.tokenExpiresAt < new Date()) {
      console.log('GSC token expired, attempting refresh...');

      if (!tokenRecord.encryptedRefreshToken) {
        console.log('No refresh token available');
        return null;
      }

      // Try to refresh the token
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        console.error('Missing Google OAuth credentials for token refresh');
        return null;
      }

      const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
      const refreshToken = await decryptToken(tokenRecord.encryptedRefreshToken);

      oauth2Client.setCredentials({
        refresh_token: refreshToken,
      });

      const { credentials } = await oauth2Client.refreshAccessToken();

      // Update tokens in database
      if (credentials.access_token) {
        const { encryptToken } = await import('@/lib/google-token-encryption');
        const encryptedAccessToken = await encryptToken(credentials.access_token);

        await prisma.googleTokens.update({
          where: { userId },
          data: {
            encryptedAccessToken,
            tokenExpiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
            lastUsedAt: new Date(),
          },
        });

        oauth2Client.setCredentials(credentials);
        return google.webmasters({ version: 'v3', auth: oauth2Client });
      }
    } else {
      // Use existing valid token
      const accessToken = await decryptToken(tokenRecord.encryptedAccessToken);

      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({
        access_token: accessToken,
      });

      // Update last used timestamp
      await prisma.googleTokens.update({
        where: { userId },
        data: { lastUsedAt: new Date() },
      });

      return google.webmasters({ version: 'v3', auth: oauth2Client });
    }
  } catch (error) {
    console.error('Failed to get GSC client:', error);
    return null;
  }

  return null;
}

/**
 * Fetch search analytics data for last 28 days
 */
async function getSearchAnalytics(
  webmasters: any,
  siteUrl: string
): Promise<GSCSearchAnalytics | null> {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 28);

    const response = await webmasters.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        dimensions: [],
        aggregationType: 'auto',
      },
    });

    const data = response.data;
    if (!data.rows || data.rows.length === 0) {
      return {
        clicks: 0,
        impressions: 0,
        ctr: 0,
        position: 0,
        period: '28 days',
      };
    }

    const totalClicks = data.rows.reduce((sum: number, row: any) => sum + (row.clicks || 0), 0);
    const totalImpressions = data.rows.reduce(
      (sum: number, row: any) => sum + (row.impressions || 0),
      0
    );
    const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const avgPosition =
      data.rows.reduce((sum: number, row: any) => sum + (row.position || 0), 0) / data.rows.length;

    return {
      clicks: totalClicks,
      impressions: totalImpressions,
      ctr: Math.round(avgCtr * 100) / 100,
      position: Math.round(avgPosition * 100) / 100,
      period: '28 days',
    };
  } catch (error) {
    console.error('Failed to fetch search analytics:', error);
    return null;
  }
}

/**
 * Fetch sitemaps data
 */
async function getSitemapsInfo(webmasters: any, siteUrl: string): Promise<GSCSitemapInfo[]> {
  try {
    const response = await webmasters.sitemaps.list({ siteUrl });

    if (!response.data.sitemap) {
      return [];
    }

    return response.data.sitemap.map((sitemap: any) => ({
      path: sitemap.path || '',
      submitted:
        sitemap.contents?.reduce(
          (sum: number, content: any) => sum + (content.submitted || 0),
          0
        ) || 0,
      indexed:
        sitemap.contents?.reduce((sum: number, content: any) => sum + (content.indexed || 0), 0) ||
        0,
      lastSubmitted: sitemap.lastSubmitted,
    }));
  } catch (error) {
    console.error('Failed to fetch sitemaps:', error);
    return [];
  }
}

/**
 * Get basic index status (simplified)
 */
async function getIndexStatus(webmasters: any, siteUrl: string): Promise<GSCIndexStatus | null> {
  try {
    // Note: URL Inspection API requires different setup and quotas
    // For now, we'll derive basic stats from sitemaps if available
    const sitemaps = await getSitemapsInfo(webmasters, siteUrl);

    if (sitemaps.length === 0) {
      return null;
    }

    const totalSubmitted = sitemaps.reduce((sum, sitemap) => sum + sitemap.submitted, 0);
    const totalIndexed = sitemaps.reduce((sum, sitemap) => sum + sitemap.indexed, 0);

    return {
      totalPages: totalSubmitted,
      indexedPages: totalIndexed,
      notIndexedPages: Math.max(0, totalSubmitted - totalIndexed),
    };
  } catch (error) {
    console.error('Failed to get index status:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate request
    const url = new URL(request.url);
    const siteUrl = url.searchParams.get('siteUrl');

    const validation = gscSummarySchema.safeParse({ siteUrl });
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { siteUrl: validSiteUrl } = validation.data;

    console.log(`🔍 GSC summary request for: ${validSiteUrl}`);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get GSC client
    const webmasters = await getGSCClient(user.id);

    if (!webmasters) {
      const summary: GSCSummary = {
        verified: false,
        lastUpdated: new Date().toISOString(),
        error: 'Google Search Console not connected or tokens expired',
      };

      return NextResponse.json({ success: true, summary });
    }

    // Check if site is verified
    let verifiedSites: string[] = [];
    try {
      const sitesResponse = await webmasters.sites.list();
      verifiedSites = sitesResponse.data.siteEntry?.map((site: any) => site.siteUrl) || [];
    } catch (error) {
      console.error('Failed to list verified sites:', error);

      const summary: GSCSummary = {
        verified: false,
        lastUpdated: new Date().toISOString(),
        error: 'Failed to verify site ownership',
      };

      return NextResponse.json({ success: true, summary });
    }

    // Normalize URLs for comparison
    const normalizedSiteUrl = validSiteUrl.endsWith('/') ? validSiteUrl : validSiteUrl + '/';
    const isVerified = verifiedSites.some((site) => {
      const normalizedSite = site.endsWith('/') ? site : site + '/';
      return normalizedSite === normalizedSiteUrl || site === validSiteUrl;
    });

    if (!isVerified) {
      const summary: GSCSummary = {
        verified: false,
        siteUrl: validSiteUrl,
        lastUpdated: new Date().toISOString(),
        error: `Site not verified in Google Search Console. Verified sites: ${verifiedSites.length}`,
      };

      return NextResponse.json({ success: true, summary });
    }

    // Fetch GSC data with timeout
    const dataPromises = [
      Promise.race([
        getSearchAnalytics(webmasters, validSiteUrl),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Search analytics timeout')), 10000)
        ),
      ]),
      Promise.race([
        getSitemapsInfo(webmasters, validSiteUrl),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Sitemaps timeout')), 5000)),
      ]),
      Promise.race([
        getIndexStatus(webmasters, validSiteUrl),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Index status timeout')), 5000)
        ),
      ]),
    ];

    const [searchAnalytics, sitemaps, indexStatus] = await Promise.allSettled(dataPromises);

    const summary: GSCSummary = {
      verified: true,
      siteUrl: validSiteUrl,
      searchAnalytics: searchAnalytics.status === 'fulfilled' ? searchAnalytics.value : undefined,
      sitemaps: sitemaps.status === 'fulfilled' ? sitemaps.value : undefined,
      indexStatus: indexStatus.status === 'fulfilled' ? indexStatus.value : undefined,
      lastUpdated: new Date().toISOString(),
    };

    console.log(`✅ GSC summary completed for: ${validSiteUrl}`);

    return NextResponse.json({ success: true, summary });
  } catch (error) {
    console.error('GSC summary error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
