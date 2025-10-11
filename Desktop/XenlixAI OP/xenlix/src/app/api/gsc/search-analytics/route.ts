// API endpoint for Google Search Console search analytics data
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { GSCClient, getDateRange } from '@/lib/gsc-client';
import { z } from 'zod';

// Request validation schema
const searchAnalyticsSchema = z.object({
  siteUrl: z.string().url(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  days: z.number().min(1).max(90).optional().default(28),
  dimensions: z
    .array(z.enum(['query', 'page', 'country', 'device', 'searchAppearance']))
    .optional()
    .default(['query']),
  type: z.enum(['web', 'image', 'video']).optional().default('web'),
  rowLimit: z.number().min(1).max(25000).optional().default(100),
  startRow: z.number().min(0).optional().default(0),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
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
    const validation = searchAnalyticsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validation.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const {
      siteUrl,
      startDate: requestStartDate,
      endDate: requestEndDate,
      days,
      dimensions,
      type,
      rowLimit,
      startRow,
    } = validation.data;

    // Calculate date range
    let startDate: string, endDate: string;
    if (requestStartDate && requestEndDate) {
      startDate = requestStartDate;
      endDate = requestEndDate;
    } else {
      const dateRange = getDateRange(days);
      startDate = dateRange.startDate;
      endDate = dateRange.endDate;
    }

    // Initialize GSC client
    const gscClient = new GSCClient({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresAt: session.expiresAt,
    });

    try {
      // Get search analytics data
      const analyticsResponse = await gscClient.getSearchAnalytics(siteUrl, {
        startDate,
        endDate,
        dimensions,
        type,
        rowLimit,
        startRow,
      });

      // Process and enhance the data
      const rows = analyticsResponse.rows || [];

      // Calculate totals and summary metrics
      const totals = rows.reduce(
        (acc, row) => ({
          totalClicks: acc.totalClicks + row.clicks,
          totalImpressions: acc.totalImpressions + row.impressions,
          totalQueries: acc.totalQueries + (dimensions.includes('query') ? 1 : 0),
          totalPages: acc.totalPages + (dimensions.includes('page') ? 1 : 0),
        }),
        { totalClicks: 0, totalImpressions: 0, totalQueries: 0, totalPages: 0 }
      );

      const averageCTR =
        totals.totalImpressions > 0 ? (totals.totalClicks / totals.totalImpressions) * 100 : 0;

      const averagePosition =
        rows.length > 0
          ? rows.reduce((sum, row) => sum + row.position * row.impressions, 0) /
            totals.totalImpressions
          : 0;

      // Format rows with additional computed fields
      const enhancedRows = rows.map((row, index) => ({
        ...row,
        rank: startRow + index + 1,
        ctrPercentage: row.ctr * 100,
        clickShare: totals.totalClicks > 0 ? (row.clicks / totals.totalClicks) * 100 : 0,
        impressionShare:
          totals.totalImpressions > 0 ? (row.impressions / totals.totalImpressions) * 100 : 0,
        // Format keys based on dimensions for easier display
        dimensionValues: dimensions.reduce(
          (acc, dimension, i) => {
            acc[dimension] = row.keys[i] || '';
            return acc;
          },
          {} as Record<string, string>
        ),
      }));

      // Get comparison data for previous period if possible
      let previousPeriodData = null;
      try {
        const daysDiff = Math.ceil(
          (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        const prevEndDate = new Date(startDate);
        prevEndDate.setDate(prevEndDate.getDate() - 1);
        const prevStartDate = new Date(prevEndDate);
        prevStartDate.setDate(prevStartDate.getDate() - daysDiff + 1);

        const prevResponse = await gscClient.getSearchAnalytics(siteUrl, {
          startDate: prevStartDate.toISOString().split('T')[0],
          endDate: prevEndDate.toISOString().split('T')[0],
          dimensions: [],
          type,
          rowLimit: 1,
        });

        if (prevResponse.rows && prevResponse.rows.length > 0) {
          const prevRow = prevResponse.rows[0];
          previousPeriodData = {
            clicks: prevRow.clicks,
            impressions: prevRow.impressions,
            ctr: prevRow.ctr,
            position: prevRow.position,
            clicksChange: totals.totalClicks - prevRow.clicks,
            impressionsChange: totals.totalImpressions - prevRow.impressions,
            ctrChange: averageCTR / 100 - prevRow.ctr,
            positionChange: averagePosition - prevRow.position,
          };
        }
      } catch (prevError) {
        console.warn('Failed to fetch previous period data:', prevError);
      }

      return NextResponse.json({
        success: true,
        data: {
          rows: enhancedRows,
          totals: {
            clicks: totals.totalClicks,
            impressions: totals.totalImpressions,
            ctr: averageCTR,
            position: averagePosition,
            queries: totals.totalQueries,
            pages: totals.totalPages,
          },
          previousPeriod: previousPeriodData,
          metadata: {
            siteUrl,
            startDate,
            endDate,
            dimensions,
            type,
            rowLimit,
            startRow,
            totalRows: rows.length,
            responseAggregationType: analyticsResponse.responseAggregationType,
            requestedBy: session.user.email,
            requestTimestamp: new Date().toISOString(),
          },
        },
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
              message: 'Search Console API error. The requested data may not be available.',
              details: error.message,
            },
            { status: 502 }
          );
        }
      }

      console.error('GSC search analytics API error:', error);
      return NextResponse.json(
        {
          error: 'GSC_API_ERROR',
          message: 'Failed to fetch search analytics data. Please try again later.',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Search analytics endpoint error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET endpoint for quick access to common analytics queries
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !session.accessToken) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const siteUrl = searchParams.get('siteUrl');
    const type = searchParams.get('type') || 'queries'; // 'queries' or 'pages'
    const days = parseInt(searchParams.get('days') || '28');

    if (!siteUrl) {
      return NextResponse.json({ error: 'siteUrl parameter is required' }, { status: 400 });
    }

    // Initialize GSC client
    const gscClient = new GSCClient({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresAt: session.expiresAt,
    });

    try {
      let data;
      const { startDate, endDate } = getDateRange(days);

      if (type === 'queries') {
        data = await gscClient.getTopQueries(siteUrl, startDate, endDate, 20);
      } else if (type === 'pages') {
        data = await gscClient.getTopPages(siteUrl, startDate, endDate, 20);
      } else {
        return NextResponse.json(
          { error: 'Invalid type parameter. Use "queries" or "pages".' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        data,
        metadata: {
          siteUrl,
          type,
          startDate,
          endDate,
          days,
        },
      });
    } catch (error) {
      console.error('GSC quick analytics error:', error);
      return NextResponse.json({ error: 'Failed to fetch analytics data' }, { status: 500 });
    }
  } catch (error) {
    console.error('Search analytics GET endpoint error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
