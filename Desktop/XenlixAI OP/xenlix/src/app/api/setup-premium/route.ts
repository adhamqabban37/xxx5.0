import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Simple setup endpoint that can be called via browser
export async function GET(req: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
    }

    console.log('Setting up premium access and mock data...');

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

    // Create premium subscription if it doesn't exist
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

    // Check if companies already exist
    const existingCompanies = await prisma.company.findMany({
      where: { userId: testUser.id },
    });

    if (existingCompanies.length === 0) {
      // Create one sample company with full data
      const company = await prisma.company.create({
        data: {
          name: 'Sample Tech Company',
          website: 'https://example-tech.com',
          industry: 'Technology',
          description: 'Sample technology company for testing',
          userId: testUser.id,
          status: 'completed',
          progress: 100,
        },
      });

      // Add sample scores for the last 30 days
      for (let i = 30; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        await prisma.companyScore.create({
          data: {
            companyId: company.id,
            date: date.toISOString().split('T')[0],
            visibilityScore: Math.floor(Math.random() * 30) + 60, // 60-90
            overallScore: Math.floor(Math.random() * 25) + 70, // 70-95
            citationScore: Math.floor(Math.random() * 20) + 75, // 75-95
            competitorScore: Math.floor(Math.random() * 15) + 80, // 80-95
          },
        });
      }

      // Add sample citations
      await prisma.companyCitation.createMany({
        data: [
          {
            companyId: company.id,
            source: 'TechCrunch',
            url: 'https://techcrunch.com/sample-article',
            authority: 95,
            relevance: 88,
            sentiment: 'positive',
            context: 'Featured in top technology companies list',
          },
          {
            companyId: company.id,
            source: 'Forbes',
            url: 'https://forbes.com/sample-article',
            authority: 98,
            relevance: 92,
            sentiment: 'positive',
            context: 'Mentioned as industry leader',
          },
        ],
      });

      // Add sample competitors
      await prisma.companyCompetitor.createMany({
        data: [
          {
            companyId: company.id,
            name: 'CompetitorA Inc',
            website: 'https://competitora.com',
            visibilityScore: 75,
            marketShare: 15,
          },
          {
            companyId: company.id,
            name: 'Rival Corp',
            website: 'https://rivalcorp.com',
            visibilityScore: 68,
            marketShare: 12,
          },
        ],
      });

      // Add sample recommendations
      await prisma.companyRecommendation.createMany({
        data: [
          {
            companyId: company.id,
            title: 'Improve Schema Markup',
            description: 'Add structured data to improve search visibility',
            priority: 'high',
            category: 'technical',
            status: 'open',
            impact: 'Potential 15-20% increase in click-through rates',
          },
          {
            companyId: company.id,
            title: 'Optimize for Voice Search',
            description: 'Create FAQ content optimized for voice queries',
            priority: 'medium',
            category: 'content',
            status: 'open',
            impact: 'Better visibility in voice search results',
          },
        ],
      });
    }

    // Return HTML with auto-redirect to premium dashboard
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Premium Access Granted</title>
    <meta http-equiv="refresh" content="2;url=/dashboard/premium-aeo">
    <style>
        body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            margin-top: 100px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: rgba(255,255,255,0.1);
            padding: 40px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
        }
        .success { color: #4CAF50; font-size: 48px; margin-bottom: 20px; }
        h1 { margin: 20px 0; }
        .spinner { 
            border: 4px solid rgba(255,255,255,0.3);
            border-top: 4px solid white;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="success">✅</div>
        <h1>Premium Access Granted!</h1>
        <p>Mock data created successfully</p>
        <div class="spinner"></div>
        <p>Redirecting to Premium Dashboard...</p>
        <p><a href="/dashboard/premium-aeo" style="color: #FFE082;">Click here if not redirected automatically</a></p>
    </div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({ error: 'Failed to setup premium access' }, { status: 500 });
  }
}
