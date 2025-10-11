import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

interface Params {
  companyId: string;
}

// GET /api/recommendations/[companyId] - Get AI-generated recommendations
export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId } = params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all'; // all, open, completed
    const category = searchParams.get('category'); // schema, content, technical, citations
    const priority = searchParams.get('priority'); // high, medium, low

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
    if (status !== 'all') {
      whereClause.status = status;
    }
    if (category) {
      whereClause.category = category;
    }
    if (priority) {
      whereClause.priority = priority;
    }

    // Get recommendations
    const recommendations = await prisma.companyRecommendation.findMany({
      where: whereClause,
      orderBy: [
        { priority: 'desc' }, // High priority first
        { impact: 'desc' }, // High impact first
        { createdAt: 'desc' }, // Most recent first
      ],
    });

    // Calculate summary statistics
    const totalRecommendations = recommendations.length;
    const openRecommendations = recommendations.filter((r) => r.status === 'open').length;
    const completedRecommendations = recommendations.filter((r) => r.status === 'completed').length;
    const inProgressRecommendations = recommendations.filter(
      (r) => r.status === 'in-progress'
    ).length;

    // Group by category
    const categoryBreakdown = {
      schema: recommendations.filter((r) => r.category === 'schema').length,
      content: recommendations.filter((r) => r.category === 'content').length,
      technical: recommendations.filter((r) => r.category === 'technical').length,
      citations: recommendations.filter((r) => r.category === 'citations').length,
    };

    // Group by priority
    const priorityBreakdown = {
      high: recommendations.filter((r) => r.priority === 'high').length,
      medium: recommendations.filter((r) => r.priority === 'medium').length,
      low: recommendations.filter((r) => r.priority === 'low').length,
    };

    // Calculate estimated impact score
    const impactScore = recommendations
      .filter((r) => r.status === 'open')
      .reduce((score, rec) => {
        const priorityMultiplier = rec.priority === 'high' ? 3 : rec.priority === 'medium' ? 2 : 1;
        const impactMultiplier = rec.impact === 'high' ? 3 : rec.impact === 'medium' ? 2 : 1;
        return score + priorityMultiplier * impactMultiplier;
      }, 0);

    // Generate quick wins (high impact, easy to implement)
    const quickWins = recommendations
      .filter(
        (r) =>
          r.status === 'open' &&
          r.impact === 'high' &&
          (r.category === 'content' || r.category === 'schema')
      )
      .slice(0, 3);

    // Generate roadmap priorities
    const roadmap = {
      immediate: recommendations
        .filter((r) => r.status === 'open' && r.priority === 'high')
        .slice(0, 3),
      shortTerm: recommendations
        .filter((r) => r.status === 'open' && r.priority === 'medium')
        .slice(0, 5),
      longTerm: recommendations
        .filter((r) => r.status === 'open' && r.priority === 'low')
        .slice(0, 3),
    };

    return NextResponse.json({
      companyId,
      summary: {
        totalRecommendations,
        openRecommendations,
        completedRecommendations,
        inProgressRecommendations,
        completionRate:
          totalRecommendations > 0
            ? Math.round((completedRecommendations / totalRecommendations) * 100)
            : 0,
        estimatedImpactScore: impactScore,
      },
      categoryBreakdown,
      priorityBreakdown,
      quickWins: quickWins.map((rec) => ({
        id: rec.id,
        title: rec.title,
        description: rec.description,
        category: rec.category,
        impact: rec.impact,
        actionItems: rec.actionItems,
      })),
      roadmap: {
        immediate: roadmap.immediate.map((rec) => ({
          id: rec.id,
          title: rec.title,
          description: rec.description,
          category: rec.category,
          estimatedEffort: 'Low', // Mock data
          expectedImpact: rec.impact,
        })),
        shortTerm: roadmap.shortTerm.map((rec) => ({
          id: rec.id,
          title: rec.title,
          description: rec.description,
          category: rec.category,
          estimatedEffort: 'Medium',
          expectedImpact: rec.impact,
        })),
        longTerm: roadmap.longTerm.map((rec) => ({
          id: rec.id,
          title: rec.title,
          description: rec.description,
          category: rec.category,
          estimatedEffort: 'High',
          expectedImpact: rec.impact,
        })),
      },
      recommendations: recommendations.map((rec) => ({
        id: rec.id,
        title: rec.title,
        description: rec.description,
        priority: rec.priority,
        impact: rec.impact,
        category: rec.category,
        actionItems: rec.actionItems,
        status: rec.status,
        createdAt: rec.createdAt,
        completedAt: rec.completedAt,
        updatedAt: rec.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/recommendations/[companyId] - Update recommendation status
export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId } = params;
    const body = await request.json();
    const { recommendationId, status } = body;

    if (!recommendationId || !status) {
      return NextResponse.json(
        {
          error: 'Recommendation ID and status are required',
        },
        { status: 400 }
      );
    }

    if (!['open', 'in-progress', 'completed', 'dismissed'].includes(status)) {
      return NextResponse.json(
        {
          error: 'Invalid status value',
        },
        { status: 400 }
      );
    }

    // Verify company ownership
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        userId: session.user.id,
      },
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Update recommendation
    const updatedRecommendation = await prisma.companyRecommendation.update({
      where: {
        id: recommendationId,
        companyId, // Ensure recommendation belongs to this company
      },
      data: {
        status,
        completedAt: status === 'completed' ? new Date() : null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      recommendation: {
        id: updatedRecommendation.id,
        status: updatedRecommendation.status,
        completedAt: updatedRecommendation.completedAt,
        updatedAt: updatedRecommendation.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating recommendation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
