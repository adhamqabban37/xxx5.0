import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mock data creation for testing
export async function POST(req: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
    }

    console.log('Creating mock data for testing...');

    // Create or get test user
    let testUser = await prisma.user.findUnique({
      where: { email: 'test@example.com' },
    });

    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
        },
      });
    }

    // Create premium subscription
    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId: testUser.id },
    });

    if (!existingSubscription) {
      await prisma.subscription.create({
        data: {
          userId: testUser.id,
          status: 'active',
          plan: 'premium',
          stripeSubscriptionId: 'test_premium_access',
          stripeCustomerId: 'cus_test_premium',
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        },
      });
    }

    // Create mock companies
    const mockCompanies = [
      {
        name: 'TechCorp Solutions',
        website: 'https://techcorp.example.com',
        industry: 'Technology',
        description: 'Leading software development company',
      },
      {
        name: 'Green Energy Co',
        website: 'https://greenenergy.example.com',
        industry: 'Energy',
        description: 'Renewable energy solutions provider',
      },
      {
        name: 'Healthcare Plus',
        website: 'https://healthcareplus.example.com',
        industry: 'Healthcare',
        description: 'Advanced healthcare services',
      },
    ];

    for (const companyData of mockCompanies) {
      // Check if company already exists
      const existingCompany = await prisma.company.findFirst({
        where: {
          userId: testUser.id,
          name: companyData.name,
        },
      });

      if (!existingCompany) {
        const company = await prisma.company.create({
          data: {
            ...companyData,
            userId: testUser.id,
            status: 'completed',
            progress: 100,
          },
        });

        // Add mock scores
        const dates = [];
        for (let i = 30; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          dates.push(date.toISOString().split('T')[0]);
        }

        for (const date of dates) {
          await prisma.companyScore.create({
            data: {
              companyId: company.id,
              date,
              visibilityScore: Math.floor(Math.random() * 30) + 60, // 60-90
              overallScore: Math.floor(Math.random() * 25) + 70, // 70-95
              citationScore: Math.floor(Math.random() * 20) + 75, // 75-95
              competitorScore: Math.floor(Math.random() * 15) + 80, // 80-95
            },
          });
        }

        // Add mock citations
        const mockCitations = [
          {
            source: 'TechCrunch',
            url: 'https://techcrunch.com/sample-article',
            authority: 95,
            relevance: 88,
            sentiment: 'positive',
            context: 'Featured in top technology companies list',
          },
          {
            source: 'Forbes',
            url: 'https://forbes.com/sample-article',
            authority: 98,
            relevance: 92,
            sentiment: 'positive',
            context: 'Mentioned as industry leader',
          },
          {
            source: 'Industry Week',
            url: 'https://industryweek.com/sample',
            authority: 82,
            relevance: 85,
            sentiment: 'neutral',
            context: 'Company analysis and market position',
          },
        ];

        for (const citation of mockCitations) {
          await prisma.companyCitation.create({
            data: {
              ...citation,
              companyId: company.id,
            },
          });
        }

        // Add mock competitors
        const mockCompetitors = [
          {
            name: 'CompetitorA Inc',
            website: 'https://competitora.com',
            visibilityScore: Math.floor(Math.random() * 20) + 65,
            marketShare: Math.floor(Math.random() * 15) + 10,
          },
          {
            name: 'Rival Corp',
            website: 'https://rivalcorp.com',
            visibilityScore: Math.floor(Math.random() * 20) + 60,
            marketShare: Math.floor(Math.random() * 12) + 8,
          },
        ];

        for (const competitor of mockCompetitors) {
          await prisma.companyCompetitor.create({
            data: {
              ...competitor,
              companyId: company.id,
            },
          });
        }

        // Add mock recommendations
        const mockRecommendations = [
          {
            title: 'Improve Schema Markup',
            description: 'Add structured data to improve search visibility',
            priority: 'high',
            category: 'technical',
            status: 'open',
            impact: 'Potential 15-20% increase in click-through rates',
          },
          {
            title: 'Optimize for Voice Search',
            description: 'Create FAQ content optimized for voice queries',
            priority: 'medium',
            category: 'content',
            status: 'open',
            impact: 'Better visibility in voice search results',
          },
          {
            title: 'Local SEO Enhancement',
            description: 'Improve Google My Business and local citations',
            priority: 'medium',
            category: 'local',
            status: 'in-progress',
            impact: 'Increased local search visibility',
          },
        ];

        for (const recommendation of mockRecommendations) {
          await prisma.companyRecommendation.create({
            data: {
              ...recommendation,
              companyId: company.id,
            },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Mock data created successfully!',
      user: testUser.email,
      companiesCreated: mockCompanies.length,
    });
  } catch (error) {
    console.error('Mock data creation error:', error);
    return NextResponse.json({ error: 'Failed to create mock data' }, { status: 500 });
  }
}

// Get current mock data status
export async function GET(req: NextRequest) {
  try {
    const testUser = await prisma.user.findUnique({
      where: { email: 'test@example.com' },
      include: {
        companies: {
          include: {
            _count: {
              select: {
                scores: true,
                citations: true,
                competitors: true,
                recommendations: true,
              },
            },
          },
        },
        subscription: true,
      },
    });

    return NextResponse.json({
      testUser: testUser
        ? {
            email: testUser.email,
            hasSubscription: !!testUser.subscription,
            companies: testUser.companies.map((company) => ({
              name: company.name,
              website: company.website,
              industry: company.industry,
              status: company.status,
              counts: company._count,
            })),
          }
        : null,
      mockDataExists: !!testUser && testUser.companies.length > 0,
    });
  } catch (error) {
    console.error('Mock data status error:', error);
    return NextResponse.json({ error: 'Failed to get mock data status' }, { status: 500 });
  }
}
