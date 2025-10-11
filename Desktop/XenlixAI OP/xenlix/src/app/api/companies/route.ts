import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import {
  scheduleCompanyAnalysis,
  scheduleVisibilitySweep,
  scheduleCompetitorAnalysis,
} from '@/lib/job-queue';

export const runtime = 'nodejs';

// GET /api/companies - List user's companies
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has premium subscription
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        subscription: true,
        companies: {
          include: {
            scores: {
              orderBy: { date: 'desc' },
              take: 1,
            },
            _count: {
              select: {
                citations: true,
                competitors: true,
                recommendations: { where: { status: 'open' } },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check premium status
    const isPremium = user.subscription?.status === 'active';
    if (!isPremium) {
      return NextResponse.json(
        {
          error: 'Premium subscription required',
          upgradeRequired: true,
        },
        { status: 403 }
      );
    }

    const companies = user.companies.map((company) => ({
      id: company.id,
      name: company.name,
      domain: company.domain,
      industry: company.industry,
      description: company.description,
      visibilityScore: company.visibilityScore,
      status: company.status,
      scanProgress: company.scanProgress,
      lastScanAt: company.lastScanAt,
      nextScanAt: company.nextScanAt,
      createdAt: company.createdAt,
      latestScore: company.scores[0] || null,
      counts: {
        citations: company._count.citations,
        competitors: company._count.competitors,
        openRecommendations: company._count.recommendations,
      },
    }));

    return NextResponse.json({ companies });
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/companies - Create new company analysis
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check premium status
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { subscription: true },
    });

    const isPremium = user?.subscription?.status === 'active';
    if (!isPremium) {
      return NextResponse.json(
        {
          error: 'Premium subscription required',
          upgradeRequired: true,
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { url, companyName, competitors = [], fullScan = true } = body;

    if (!url || !companyName) {
      return NextResponse.json(
        {
          error: 'URL and company name are required',
        },
        { status: 400 }
      );
    }

    // Extract domain from URL
    let domain;
    try {
      const urlObj = new URL(url);
      domain = urlObj.hostname.replace(/^www\./, '');
    } catch {
      return NextResponse.json(
        {
          error: 'Invalid URL format',
        },
        { status: 400 }
      );
    }

    // Check if company already exists for this user
    const existingCompany = await prisma.company.findFirst({
      where: {
        userId: session.user.id,
        domain,
      },
    });

    if (existingCompany) {
      return NextResponse.json(
        {
          error: 'Company with this domain already exists',
          companyId: existingCompany.id,
        },
        { status: 409 }
      );
    }

    // Create company record
    const company = await prisma.company.create({
      data: {
        userId: session.user.id,
        name: companyName,
        domain,
        status: 'pending',
        scanProgress: 0,
      },
    });

    // Schedule analysis job
    const jobId = await scheduleCompanyAnalysis(company.id, url, companyName, session.user.id, {
      competitors,
      fullScan,
    });

    // Schedule competitor analysis if competitors provided
    if (competitors.length > 0) {
      await scheduleCompetitorAnalysis(company.id, competitors, 5000); // 5 second delay
    }

    // Schedule daily visibility sweep
    await scheduleVisibilitySweep(company.id);

    return NextResponse.json(
      {
        company: {
          id: company.id,
          name: company.name,
          domain: company.domain,
          status: company.status,
          scanProgress: company.scanProgress,
        },
        jobId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating company:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
