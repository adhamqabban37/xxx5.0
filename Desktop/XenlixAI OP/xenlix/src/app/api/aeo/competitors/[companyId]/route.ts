import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

interface Params {
  companyId: string;
}

// GET /api/competitors/[companyId] - Get competitor benchmarking data
export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId } = params;
    const { searchParams } = new URL(request.url);
    const includeGaps = searchParams.get('includeGaps') === 'true';

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

    // Get competitors
    const competitors = await prisma.companyCompetitor.findMany({
      where: { companyId },
      orderBy: { visibilityScore: 'desc' },
    });

    // Get company's current metrics for comparison
    const companyMetrics = await prisma.companyScore.findFirst({
      where: { companyId },
      orderBy: { date: 'desc' },
    });

    const companyVisibilityScore = companyMetrics?.visibilityIndex || company.visibilityScore || 0;

    // Calculate competitive positioning
    const competitorScores = competitors.map((c) => c.visibilityScore || 0).filter((s) => s > 0);
    const industryAverage =
      competitorScores.length > 0
        ? competitorScores.reduce((sum, score) => sum + score, 0) / competitorScores.length
        : companyVisibilityScore;

    // Rank company against competitors
    const allScores = [...competitorScores, companyVisibilityScore].sort((a, b) => b - a);
    const companyRank = allScores.indexOf(companyVisibilityScore) + 1;
    const totalCompanies = allScores.length;

    // Identify gaps and opportunities
    const gaps = [];
    const opportunities = [];

    for (const competitor of competitors) {
      if ((competitor.visibilityScore || 0) > companyVisibilityScore) {
        gaps.push({
          competitor: competitor.competitorName,
          domain: competitor.competitorDomain,
          visibilityGap:
            Math.round(((competitor.visibilityScore || 0) - companyVisibilityScore) * 10) / 10,
          brandMentions: competitor.brandMentions,
          citationCount: competitor.citationCount,
          aeoScore: competitor.aeoScore,
        });
      } else {
        opportunities.push({
          competitor: competitor.competitorName,
          domain: competitor.competitorDomain,
          advantage:
            Math.round((companyVisibilityScore - (competitor.visibilityScore || 0)) * 10) / 10,
          brandMentions: competitor.brandMentions,
          citationCount: competitor.citationCount,
        });
      }
    }

    // Market share analysis
    const totalMentions = competitors.reduce((sum, c) => sum + (c.brandMentions || 0), 0);
    const companyMentions = await prisma.queryResult.count({
      where: {
        companyId,
        mentioned: true,
      },
    });

    const marketShare =
      totalMentions > 0
        ? Math.round((companyMentions / (totalMentions + companyMentions)) * 100)
        : 0;

    // Trending analysis (mock data for competitors)
    const trendingCompetitors = competitors.map((competitor) => ({
      ...competitor,
      trend: Math.random() > 0.5 ? 'up' : 'down',
      trendValue: Math.round((Math.random() - 0.5) * 20 * 10) / 10, // -10 to +10
    }));

    // Competitive insights and recommendations
    const insights = [];

    if (gaps.length > 0) {
      const topGap = gaps[0];
      insights.push({
        type: 'gap',
        priority: 'high',
        title: `Visibility gap with ${topGap.competitor}`,
        description: `${topGap.competitor} has ${topGap.visibilityGap} points higher visibility score. Focus on increasing brand mentions and citations.`,
        actionItems: [
          `Research ${topGap.competitor}'s content strategy`,
          "Identify citation opportunities they have that you don't",
          'Analyze their schema markup implementation',
        ],
      });
    }

    if (opportunities.length > 0) {
      const topOpportunity = opportunities[0];
      insights.push({
        type: 'opportunity',
        priority: 'medium',
        title: `Maintain advantage over ${topOpportunity.competitor}`,
        description: `You're ahead of ${topOpportunity.competitor} by ${topOpportunity.advantage} points. Continue current strategy.`,
        actionItems: [
          'Monitor their visibility changes weekly',
          'Strengthen your unique value propositions',
          'Expand into new query categories',
        ],
      });
    }

    // Industry benchmarks (mock data)
    const industryBenchmarks = {
      averageVisibilityScore: Math.round(industryAverage),
      topPerformerScore: Math.max(...competitorScores, companyVisibilityScore),
      medianCitations: Math.round(
        competitors.reduce((sum, c) => sum + (c.citationCount || 0), 0) /
          Math.max(competitors.length, 1)
      ),
      averageBrandMentions: Math.round(
        competitors.reduce((sum, c) => sum + (c.brandMentions || 0), 0) /
          Math.max(competitors.length, 1)
      ),
    };

    return NextResponse.json({
      companyId,
      competitivePosition: {
        rank: companyRank,
        totalCompanies,
        visibilityScore: companyVisibilityScore,
        industryAverage: Math.round(industryAverage),
        percentile: Math.round((1 - (companyRank - 1) / (totalCompanies - 1)) * 100),
        marketShare,
      },
      competitors: competitors.map((c) => ({
        id: c.id,
        name: c.competitorName,
        domain: c.competitorDomain,
        industry: c.industry,
        visibilityScore: c.visibilityScore,
        brandMentions: c.brandMentions,
        citationCount: c.citationCount,
        aeoScore: c.aeoScore,
        lastAnalyzed: c.lastAnalyzed,
        trend: trendingCompetitors.find((tc) => tc.id === c.id)?.trend,
        trendValue: trendingCompetitors.find((tc) => tc.id === c.id)?.trendValue,
      })),
      gaps: gaps.slice(0, 5), // Top 5 gaps
      opportunities: opportunities.slice(0, 3), // Top 3 opportunities
      insights,
      industryBenchmarks,
      analysisMetadata: {
        competitorsAnalyzed: competitors.length,
        lastUpdated: competitors[0]?.lastAnalyzed || new Date(),
        dataFreshness: competitors.filter(
          (c) =>
            c.lastAnalyzed &&
            new Date().getTime() - new Date(c.lastAnalyzed).getTime() < 24 * 60 * 60 * 1000
        ).length,
      },
    });
  } catch (error) {
    console.error('Error fetching competitor data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
