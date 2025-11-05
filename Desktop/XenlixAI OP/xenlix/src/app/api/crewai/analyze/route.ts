import { NextRequest, NextResponse } from 'next/server';
import { CrewAIService } from '@/lib/crewai-service';
import { CrewAIAnalysisInputSchema, type CrewAIAnalysisInput } from '@/lib/crewai-service';

const crewAIService = new CrewAIService();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input using Zod schema
    const validationResult = CrewAIAnalysisInputSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid input data',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const analysisInput: CrewAIAnalysisInput = validationResult.data;

    // Perform CrewAI analysis
    const analysis = await crewAIService.analyzeWebsite(analysisInput);

    return NextResponse.json({
      success: true,
      data: analysis,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('CrewAI API Error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'CrewAI Analysis API - Use POST method with analysis data',
    requiredFields: ['url', 'technicalMetrics', 'businessContext', 'competitorUrls'],
    example: {
      url: 'https://example.com',
      technicalMetrics: {
        lighthouse: {
          performance: 85,
          accessibility: 92,
          bestPractices: 88,
          seo: 91,
          pwa: 45,
        },
        coreWebVitals: {
          lcp: 2.1,
          fid: 95,
          cls: 0.08,
        },
        technicalDebt: 'low',
        securityScore: 'high',
      },
      businessContext: {
        industry: 'Technology',
        targetAudience: 'Developers',
        businessGoals: ['increase_conversions', 'improve_seo'],
        currentTraffic: 50000,
        conversionRate: 2.5,
        budget: 'medium',
      },
      competitorUrls: ['https://competitor1.com', 'https://competitor2.com'],
    },
  });
}
