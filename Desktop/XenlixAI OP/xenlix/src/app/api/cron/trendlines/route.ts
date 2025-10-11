// API endpoint for 30-day trendline data and historical snapshots
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { SnapshotWriter } from '@/lib/snapshot-writer';
import { z } from 'zod';

// Validation schema for trendline requests
const trendlineSchema = z.object({
  url: z.string().url(),
  metricType: z.enum([
    'psi_performance',
    'psi_accessibility',
    'psi_seo',
    'psi_lcp',
    'psi_cls',
    'opr_clicks',
    'opr_impressions',
    'opr_ctr',
    'opr_position',
    'schema_errors',
    'schema_total',
  ]),
  days: z.number().min(1).max(90).optional().default(30),
  granularity: z.enum(['daily', 'weekly']).optional().default('daily'),
});

interface TrendlineDataPoint {
  date: string;
  value: number;
  change?: number;
  changePercent?: number;
}

interface TrendlineResponse {
  url: string;
  metricType: string;
  days: number;
  granularity: string;
  dataPoints: TrendlineDataPoint[];
  summary: {
    current: number | null;
    previous: number | null;
    change: number | null;
    changePercent: number | null;
    trend: 'up' | 'down' | 'stable' | 'no-data';
    min: number | null;
    max: number | null;
    average: number | null;
  };
  sparklineData: number[];
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const metricType = searchParams.get('metricType');
    const days = parseInt(searchParams.get('days') || '30');
    const granularity = searchParams.get('granularity') || 'daily';

    // Validate request parameters
    const validation = trendlineSchema.safeParse({
      url,
      metricType,
      days,
      granularity,
    });

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid parameters',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const {
      url: validUrl,
      metricType: validMetricType,
      days: validDays,
      granularity: validGranularity,
    } = validation.data;

    // Get trendline data
    const trendlineData = await getTrendlineData(
      validUrl,
      validMetricType,
      validDays,
      validGranularity
    );

    return NextResponse.json({
      success: true,
      data: trendlineData,
    });
  } catch (error) {
    console.error('Trendline endpoint error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST endpoint for bulk trendline requests
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { urls, metricTypes, days = 30, granularity = 'daily' } = body;

    if (!Array.isArray(urls) || !Array.isArray(metricTypes)) {
      return NextResponse.json({ error: 'URLs and metricTypes must be arrays' }, { status: 400 });
    }

    if (urls.length > 10 || metricTypes.length > 5) {
      return NextResponse.json(
        { error: 'Too many URLs or metrics requested (max 10 URLs, 5 metrics)' },
        { status: 400 }
      );
    }

    // Generate trendlines for all URL/metric combinations
    const results = [];

    for (const url of urls) {
      for (const metricType of metricTypes) {
        try {
          const validation = trendlineSchema.safeParse({
            url,
            metricType,
            days,
            granularity,
          });

          if (validation.success) {
            const trendlineData = await getTrendlineData(
              validation.data.url,
              validation.data.metricType,
              validation.data.days,
              validation.data.granularity
            );
            results.push(trendlineData);
          } else {
            results.push({
              url,
              metricType,
              error: 'Invalid parameters',
              details: validation.error.issues,
            });
          }
        } catch (error) {
          results.push({
            url,
            metricType,
            error: 'Failed to generate trendline',
            details: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
      metadata: {
        totalRequested: urls.length * metricTypes.length,
        totalReturned: results.length,
        successful: results.filter((r) => !('error' in r)).length,
        failed: results.filter((r) => 'error' in r).length,
      },
    });
  } catch (error) {
    console.error('Bulk trendline endpoint error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Generate trendline data for a specific URL and metric
async function getTrendlineData(
  url: string,
  metricType: string,
  days: number,
  granularity: string
): Promise<TrendlineResponse> {
  const snapshotWriter = new SnapshotWriter();

  try {
    let rawDataPoints: Array<{ date: Date; value: number }> = [];

    // Get raw data based on metric type
    if (metricType.startsWith('psi_')) {
      const psiSnapshots = await snapshotWriter.getPSITrend(url, days);
      rawDataPoints = psiSnapshots.map((snapshot) => ({
        date: snapshot.timestamp,
        value: getMetricValue(snapshot, metricType),
      }));
    } else if (metricType.startsWith('opr_')) {
      const oprSnapshots = await snapshotWriter.getOPRTrend(url, days);
      rawDataPoints = oprSnapshots.map((snapshot) => ({
        date: snapshot.timestamp,
        value: getMetricValue(snapshot, metricType),
      }));
    } else if (metricType.startsWith('schema_')) {
      const schemaSnapshots = await snapshotWriter.getSchemaTrend(url, days);
      rawDataPoints = schemaSnapshots.map((snapshot) => ({
        date: snapshot.timestamp,
        value: getMetricValue(snapshot, metricType),
      }));
    }

    // Process data points based on granularity
    const processedDataPoints = processDataPoints(rawDataPoints, granularity);

    // Calculate summary statistics
    const summary = calculateSummary(processedDataPoints);

    // Generate sparkline data (simplified for visualization)
    const sparklineData = processedDataPoints.map((point) => point.value);

    return {
      url,
      metricType,
      days,
      granularity,
      dataPoints: processedDataPoints.map((point) => ({
        date: point.date.toISOString().split('T')[0],
        value: point.value,
        change: point.change,
        changePercent: point.changePercent,
      })),
      summary,
      sparklineData,
    };
  } catch (error) {
    console.error(`Failed to get trendline data for ${url} - ${metricType}:`, error);

    // Return empty trendline data on error
    return {
      url,
      metricType,
      days,
      granularity,
      dataPoints: [],
      summary: {
        current: null,
        previous: null,
        change: null,
        changePercent: null,
        trend: 'no-data',
        min: null,
        max: null,
        average: null,
      },
      sparklineData: [],
    };
  }
}

// Extract metric value from snapshot based on metric type
function getMetricValue(snapshot: any, metricType: string): number {
  switch (metricType) {
    case 'psi_performance':
      return snapshot.performance || 0;
    case 'psi_accessibility':
      return snapshot.accessibility || 0;
    case 'psi_seo':
      return snapshot.seo || 0;
    case 'psi_lcp':
      return snapshot.lcp || 0;
    case 'psi_cls':
      return snapshot.cls || 0;
    case 'opr_clicks':
      return snapshot.totalClicks || 0;
    case 'opr_impressions':
      return snapshot.totalImpressions || 0;
    case 'opr_ctr':
      return snapshot.averageCTR || 0;
    case 'opr_position':
      return snapshot.averagePosition || 0;
    case 'schema_errors':
      return snapshot.invalidSchemas || 0;
    case 'schema_total':
      return snapshot.schemasFound || 0;
    default:
      return 0;
  }
}

// Process raw data points based on granularity
function processDataPoints(
  rawDataPoints: Array<{ date: Date; value: number }>,
  granularity: string
): Array<{ date: Date; value: number; change?: number; changePercent?: number }> {
  if (rawDataPoints.length === 0) return [];

  // Sort by date
  rawDataPoints.sort((a, b) => a.date.getTime() - b.date.getTime());

  let processedPoints: Array<{
    date: Date;
    value: number;
    change?: number;
    changePercent?: number;
  }>;

  if (granularity === 'weekly') {
    // Group by week and average
    const weeklyGroups = new Map<string, Array<{ date: Date; value: number }>>();

    rawDataPoints.forEach((point) => {
      const weekStart = getWeekStart(point.date);
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weeklyGroups.has(weekKey)) {
        weeklyGroups.set(weekKey, []);
      }
      weeklyGroups.get(weekKey)!.push(point);
    });

    processedPoints = Array.from(weeklyGroups.entries()).map(([weekKey, points]) => {
      const avgValue = points.reduce((sum, p) => sum + p.value, 0) / points.length;
      return {
        date: new Date(weekKey),
        value: avgValue,
      };
    });
  } else {
    // Daily granularity - use raw points
    processedPoints = rawDataPoints.map((point) => ({ ...point }));
  }

  // Calculate changes
  for (let i = 1; i < processedPoints.length; i++) {
    const current = processedPoints[i];
    const previous = processedPoints[i - 1];

    current.change = current.value - previous.value;
    current.changePercent = previous.value !== 0 ? (current.change / previous.value) * 100 : 0;
  }

  return processedPoints;
}

// Calculate summary statistics
function calculateSummary(
  dataPoints: Array<{ date: Date; value: number; change?: number; changePercent?: number }>
): {
  current: number | null;
  previous: number | null;
  change: number | null;
  changePercent: number | null;
  trend: 'up' | 'down' | 'stable' | 'no-data';
  min: number | null;
  max: number | null;
  average: number | null;
} {
  if (dataPoints.length === 0) {
    return {
      current: null,
      previous: null,
      change: null,
      changePercent: null,
      trend: 'no-data',
      min: null,
      max: null,
      average: null,
    };
  }

  const values = dataPoints.map((p) => p.value);
  const current = values[values.length - 1];
  const previous = values.length > 1 ? values[values.length - 2] : null;
  const change = previous !== null ? current - previous : null;
  const changePercent = previous !== null && previous !== 0 ? (change! / previous) * 100 : null;

  // Determine trend
  let trend: 'up' | 'down' | 'stable' | 'no-data' = 'no-data';
  if (changePercent !== null) {
    if (Math.abs(changePercent) < 1) {
      trend = 'stable';
    } else if (changePercent > 0) {
      trend = 'up';
    } else {
      trend = 'down';
    }
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const average = values.reduce((sum, v) => sum + v, 0) / values.length;

  return {
    current,
    previous,
    change,
    changePercent,
    trend,
    min,
    max,
    average,
  };
}

// Get start of week (Sunday)
function getWeekStart(date: Date): Date {
  const day = date.getDay();
  const diff = date.getDate() - day;
  return new Date(date.setDate(diff));
}
