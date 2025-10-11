import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

interface Params {
  companyId: string;
}

// GET /api/aeo/citations/[companyId] - Get company citations and source analysis
export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId } = params;
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sortBy') || 'authority'; // authority, recent, domain
    const sourceFilter = searchParams.get('source'); // page, ai-answer
    const limit = parseInt(searchParams.get('limit') || '100');

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

    // Build where clause
    const whereClause: any = { companyId };
    if (sourceFilter) {
      whereClause.source = sourceFilter;
    }

    // Build order clause
    let orderBy: any = {};
    switch (sortBy) {
      case 'authority':
        orderBy = { authorityScore: 'desc' };
        break;
      case 'recent':
        orderBy = { createdAt: 'desc' };
        break;
      case 'domain':
        orderBy = { domain: 'asc' };
        break;
      default:
        orderBy = { authorityScore: 'desc' };
    }

    // Get citations
    const citations = await prisma.companyCitation.findMany({
      where: whereClause,
      orderBy,
      take: limit,
    });

    // Calculate summary statistics
    const totalCitations = citations.length;
    const trustedCitations = citations.filter((c) => c.isTrusted).length;
    const primaryDomainCitations = citations.filter((c) => c.isPrimary).length;
    const liveCitations = citations.filter((c) => c.isLive).length;

    // Group by source type
    const sourceBreakdown = {
      page: citations.filter((c) => c.source === 'page').length,
      aiAnswer: citations.filter((c) => c.source === 'ai-answer').length,
    };

    // Top domains by citation count
    const domainCounts = citations.reduce(
      (acc, citation) => {
        acc[citation.domain] = (acc[citation.domain] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const topDomains = Object.entries(domainCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([domain, count]) => {
        const domainCitations = citations.filter((c) => c.domain === domain);
        const avgAuthority =
          domainCitations.length > 0
            ? domainCitations.reduce((sum, c) => sum + (c.authorityScore || 0), 0) /
              domainCitations.length
            : 0;

        return {
          domain,
          citationCount: count,
          avgAuthorityScore: Math.round(avgAuthority * 10) / 10,
          isTrusted: domainCitations.some((c) => c.isTrusted),
          isPrimary: domainCitations.some((c) => c.isPrimary),
        };
      });

    // Authority score distribution
    const authorityBuckets = {
      high: citations.filter((c) => (c.authorityScore || 0) >= 70).length,
      medium: citations.filter((c) => (c.authorityScore || 0) >= 40 && (c.authorityScore || 0) < 70)
        .length,
      low: citations.filter((c) => (c.authorityScore || 0) < 40).length,
    };

    // Missing high-authority domains (domains that cite competitors but not this company)
    // This would require competitor analysis data in a real implementation
    const missingOpportunities = [
      {
        domain: 'techcrunch.com',
        authorityScore: 92,
        citesCompetitors: ['Competitor A', 'Competitor B'],
        lastMentioned: null,
        outreachPriority: 'high',
      },
      {
        domain: 'marketingland.com',
        authorityScore: 78,
        citesCompetitors: ['Competitor C'],
        lastMentioned: null,
        outreachPriority: 'medium',
      },
    ];

    return NextResponse.json({
      companyId,
      summary: {
        totalCitations,
        trustedCitations,
        primaryDomainCitations,
        liveCitations,
        trustScore: totalCitations > 0 ? Math.round((trustedCitations / totalCitations) * 100) : 0,
      },
      sourceBreakdown,
      authorityDistribution: authorityBuckets,
      topDomains,
      missingOpportunities,
      citations: citations.map((citation) => ({
        id: citation.id,
        url: citation.url,
        domain: citation.domain,
        title: citation.title,
        authorityScore: citation.authorityScore,
        source: citation.source,
        engine: citation.engine,
        isTrusted: citation.isTrusted,
        isPrimary: citation.isPrimary,
        isLive: citation.isLive,
        createdAt: citation.createdAt,
        lastChecked: citation.lastChecked,
      })),
    });
  } catch (error) {
    console.error('Error fetching citations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
