import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

interface Params {
  companyId: string;
}

// GET /api/visibility/[companyId] - Get company visibility metrics
export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId } = params;
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const engines = searchParams.get('engines')?.split(',') || [
      'chatgpt',
      'gemini',
      'claude',
      'perplexity',
    ];

    // Verify company ownership and premium access
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        userId: session.user.id,
      },
      include: {
        user: {
          include: { subscription: true },
        },
      },
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const isPremium = company.user.subscription?.status === 'active';
    if (!isPremium) {
      return NextResponse.json(
        {
          error: 'Premium subscription required',
          upgradeRequired: true,
        },
        { status: 403 }
      );
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);

    // Get visibility scores over time
    const scores = await prisma.companyScore.findMany({
      where: {
        companyId,
        date: {
          gte: startDate.toISOString().split('T')[0],
          lte: endDate.toISOString().split('T')[0],
        },
      },
      orderBy: { date: 'asc' },
    });

    // Get query results
    const queryResults = await prisma.queryResult.findMany({
      where: {
        companyId,
        engine: { in: engines },
        fetchedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { fetchedAt: 'desc' },
    });

    // Calculate current metrics
    const totalQueries = queryResults.length;
    const mentionedQueries = queryResults.filter((q) => q.mentioned).length;
    const coverage = totalQueries > 0 ? (mentionedQueries / totalQueries) * 100 : 0;

    // Average position when mentioned
    const mentionedResults = queryResults.filter((q) => q.mentioned && q.position);
    const avgPosition =
      mentionedResults.length > 0
        ? mentionedResults.reduce((sum, q) => sum + (q.position || 0), 0) / mentionedResults.length
        : null;

    // Engine breakdown
    const engineBreakdown = engines.map((engine) => {
      const engineQueries = queryResults.filter((q) => q.engine === engine);
      const engineMentioned = engineQueries.filter((q) => q.mentioned).length;
      return {
        engine,
        totalQueries: engineQueries.length,
        mentioned: engineMentioned,
        coverage: engineQueries.length > 0 ? (engineMentioned / engineQueries.length) * 100 : 0,
      };
    });

    // Recent trends (last 7 days vs previous 7 days)
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    const prev7Days = new Date(last7Days);
    prev7Days.setDate(prev7Days.getDate() - 7);

    const recentQueries = queryResults.filter((q) => q.fetchedAt >= last7Days);
    const previousQueries = queryResults.filter(
      (q) => q.fetchedAt >= prev7Days && q.fetchedAt < last7Days
    );

    const recentCoverage =
      recentQueries.length > 0
        ? (recentQueries.filter((q) => q.mentioned).length / recentQueries.length) * 100
        : 0;
    const previousCoverage =
      previousQueries.length > 0
        ? (previousQueries.filter((q) => q.mentioned).length / previousQueries.length) * 100
        : 0;

    const coverageTrend = recentCoverage - previousCoverage;

    // Get latest visibility score
    const latestScore = scores[scores.length - 1];

    return NextResponse.json({
      companyId,
      period: { days, startDate, endDate },
      currentMetrics: {
        visibilityIndex: latestScore?.visibilityIndex || company.visibilityScore || 0,
        coverage: Math.round(coverage),
        totalQueries,
        mentionedQueries,
        averagePosition: avgPosition ? Math.round(avgPosition * 10) / 10 : null,
        coverageTrend: Math.round(coverageTrend * 10) / 10,
      },
      scores: scores.map((score) => ({
        date: score.date,
        visibilityIndex: score.visibilityIndex,
        coverage: score.coveragePct,
        sourceShare: score.sourceSharePct,
      })),
      engineBreakdown,
      queryResults: queryResults.slice(0, 50).map((q) => ({
        id: q.id,
        query: q.query,
        engine: q.engine,
        mentioned: q.mentioned,
        position: q.position,
        sentiment: q.sentiment,
        fetchedAt: q.fetchedAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching visibility data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
