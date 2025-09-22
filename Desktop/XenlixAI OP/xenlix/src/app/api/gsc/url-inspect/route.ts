// API endpoint for Google Search Console URL inspection
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { GSCClient } from '@/lib/gsc-client';
import { z } from 'zod';

// Request validation schema
const urlInspectionSchema = z.object({
  siteUrl: z.string().url(),
  inspectionUrl: z.string().url(),
  languageCode: z.string().optional().default('en'),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check for Google OAuth tokens
    if (!session.accessToken) {
      return NextResponse.json(
        { 
          error: 'GSC_AUTH_REQUIRED',
          message: 'Google Search Console authentication required. Please sign in with Google.',
        },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = urlInspectionSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request',
          details: validation.error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const { siteUrl, inspectionUrl, languageCode } = validation.data;

    // Validate that inspectionUrl is under the siteUrl
    const siteUrlObj = new URL(siteUrl);
    const inspectionUrlObj = new URL(inspectionUrl);
    
    // For domain properties, check if they're on the same domain
    if (siteUrl.startsWith('sc-domain:')) {
      const domain = siteUrl.replace('sc-domain:', '');
      if (!inspectionUrlObj.hostname.endsWith(domain)) {
        return NextResponse.json(
          { 
            error: 'URL_NOT_UNDER_PROPERTY',
            message: `URL ${inspectionUrl} is not under the domain property ${domain}`,
          },
          { status: 400 }
        );
      }
    } else {
      // For URL prefix properties, check if URL starts with the property URL
      if (!inspectionUrl.startsWith(siteUrl)) {
        return NextResponse.json(
          { 
            error: 'URL_NOT_UNDER_PROPERTY',
            message: `URL ${inspectionUrl} is not under the property ${siteUrl}`,
          },
          { status: 400 }
        );
      }
    }

    // Initialize GSC client
    const gscClient = new GSCClient({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresAt: session.expiresAt,
    });

    try {
      // Get URL inspection data
      const inspectionData = await gscClient.inspectUrl(siteUrl, inspectionUrl, languageCode);
      
      // Extract and enhance the inspection result
      const result = inspectionData.inspectionResult;
      
      // Calculate index status and verdict
      let indexStatus = 'unknown';
      let indexVerdict = 'Unknown status';
      let indexBadgeColor = 'gray';
      
      if (result?.indexStatusResult) {
        const indexResult = result.indexStatusResult;
        
        if (indexResult.verdict === 'PASS') {
          indexStatus = 'indexed';
          indexVerdict = 'URL is on Google';
          indexBadgeColor = 'green';
        } else if (indexResult.verdict === 'FAIL') {
          indexStatus = 'not-indexed';
          indexVerdict = indexResult.pageFetchState || 'Page cannot be indexed';
          indexBadgeColor = 'red';
        } else if (indexResult.verdict === 'PARTIAL') {
          indexStatus = 'partially-indexed';
          indexVerdict = 'URL has issues';
          indexBadgeColor = 'yellow';
        }
      }

      // Extract coverage state
      let coverageState = 'unknown';
      if (result?.indexStatusResult?.coverageState) {
        coverageState = result.indexStatusResult.coverageState;
      }

      // Extract last crawl time
      let lastCrawlTime = null;
      if (result?.indexStatusResult?.lastCrawlTime) {
        lastCrawlTime = result.indexStatusResult.lastCrawlTime;
      }

      // Extract robots.txt info
      let robotsTxtState = 'unknown';
      if (result?.indexStatusResult?.robotsTxtState) {
        robotsTxtState = result.indexStatusResult.robotsTxtState;
      }

      // Extract sitemap info
      const sitemaps = result?.indexStatusResult?.sitemap || [];

      // Extract page fetch info
      let pageFetchState = 'unknown';
      if (result?.indexStatusResult?.pageFetchState) {
        pageFetchState = result.indexStatusResult.pageFetchState;
      }

      // Extract AMP info if available
      let ampInfo = null;
      if (result?.ampResult) {
        ampInfo = {
          verdict: result.ampResult.verdict,
          ampUrl: result.ampResult.ampUrl,
          issues: result.ampResult.issues || [],
        };
      }

      // Extract mobile usability info
      let mobileUsabilityInfo = null;
      if (result?.mobileUsabilityResult) {
        mobileUsabilityInfo = {
          verdict: result.mobileUsabilityResult.verdict,
          issues: result.mobileUsabilityResult.issues || [],
        };
      }

      // Extract rich results info
      let richResultsInfo = null;
      if (result?.richResultsResult) {
        richResultsInfo = {
          verdict: result.richResultsResult.verdict,
          detectedItems: result.richResultsResult.detectedItems || [],
        };
      }

      // Format the enhanced response
      const enhancedResult = {
        inspectionUrl,
        siteUrl,
        indexStatus: {
          status: indexStatus,
          verdict: indexVerdict,
          badgeColor: indexBadgeColor,
          coverageState,
          lastCrawlTime,
          robotsTxtState,
          pageFetchState,
          sitemaps,
        },
        ampInfo,
        mobileUsabilityInfo,
        richResultsInfo,
        metadata: {
          inspectionUrl,
          siteUrl,
          languageCode,
          inspectionTimestamp: new Date().toISOString(),
          requestedBy: session.user.email,
        },
        rawResult: result, // Include raw result for debugging
      };

      return NextResponse.json({
        success: true,
        data: enhancedResult,
      });

    } catch (error) {
      // Handle specific GSC API errors
      if (error instanceof Error) {
        if (error.message === 'GSC_AUTH_REQUIRED') {
          return NextResponse.json(
            { 
              error: 'GSC_AUTH_REQUIRED',
              message: 'Google Search Console authentication has expired. Please re-authenticate.',
            },
            { status: 401 }
          );
        }
        
        if (error.message === 'GSC_PERMISSION_DENIED') {
          return NextResponse.json(
            { 
              error: 'GSC_PERMISSION_DENIED',
              message: 'Access denied to this Search Console property.',
            },
            { status: 403 }
          );
        }

        if (error.message.includes('GSC API error')) {
          return NextResponse.json(
            { 
              error: 'GSC_API_ERROR',
              message: 'Search Console API error. URL inspection failed.',
              details: error.message,
            },
            { status: 502 }
          );
        }

        // Handle specific URL inspection errors
        if (error.message.includes('PERMISSION_DENIED')) {
          return NextResponse.json(
            { 
              error: 'URL_INSPECTION_PERMISSION_DENIED',
              message: 'Permission denied for URL inspection. The URL may not be under your verified property.',
            },
            { status: 403 }
          );
        }

        if (error.message.includes('INVALID_URL')) {
          return NextResponse.json(
            { 
              error: 'INVALID_URL',
              message: 'The provided URL is invalid or cannot be inspected.',
            },
            { status: 400 }
          );
        }

        if (error.message.includes('QUOTA_EXCEEDED')) {
          return NextResponse.json(
            { 
              error: 'QUOTA_EXCEEDED',
              message: 'URL inspection quota exceeded. Please try again later.',
            },
            { status: 429 }
          );
        }
      }

      console.error('GSC URL inspection API error:', error);
      return NextResponse.json(
        { 
          error: 'GSC_API_ERROR',
          message: 'Failed to inspect URL. Please try again later.',
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('URL inspection endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint for quick URL inspection with URL parameter
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !session.accessToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const siteUrl = searchParams.get('siteUrl');
    const inspectionUrl = searchParams.get('url');
    const languageCode = searchParams.get('languageCode') || 'en';

    if (!siteUrl || !inspectionUrl) {
      return NextResponse.json(
        { error: 'Both siteUrl and url parameters are required' },
        { status: 400 }
      );
    }

    // Validate URLs
    try {
      new URL(siteUrl);
      new URL(inspectionUrl);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL provided' },
        { status: 400 }
      );
    }

    // Initialize GSC client
    const gscClient = new GSCClient({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresAt: session.expiresAt,
    });

    try {
      // Get URL inspection data
      const inspectionData = await gscClient.inspectUrl(siteUrl, inspectionUrl, languageCode);
      
      // Quick format for GET requests - just the essential info
      const result = inspectionData.inspectionResult;
      let indexStatus = 'unknown';
      let indexVerdict = 'Unknown status';
      
      if (result?.indexStatusResult) {
        const indexResult = result.indexStatusResult;
        
        if (indexResult.verdict === 'PASS') {
          indexStatus = 'indexed';
          indexVerdict = 'URL is on Google';
        } else if (indexResult.verdict === 'FAIL') {
          indexStatus = 'not-indexed';
          indexVerdict = indexResult.pageFetchState || 'Page cannot be indexed';
        } else if (indexResult.verdict === 'PARTIAL') {
          indexStatus = 'partially-indexed';
          indexVerdict = 'URL has issues';
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          inspectionUrl,
          siteUrl,
          indexStatus,
          indexVerdict,
          lastCrawlTime: result?.indexStatusResult?.lastCrawlTime,
          coverageState: result?.indexStatusResult?.coverageState,
        },
      });

    } catch (error) {
      console.error('GSC quick URL inspection error:', error);
      return NextResponse.json(
        { error: 'Failed to inspect URL' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('URL inspection GET endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}