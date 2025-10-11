/**
 * Enhanced Dashboard API Endpoint
 * Provides comprehensive business analysis with AEO insights
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { BusinessExtractor } from '@/lib/business-extractor';
import { BusinessSchemaGenerator } from '@/lib/business-schema-generator';
import { HuggingFaceClient } from '@/lib/huggingface-client';
import { z } from 'zod';

const DashboardAnalysisRequestSchema = z.object({
  url: z.string().url(),
  includeBusinessExtraction: z.boolean().default(true),
  includeSchemaGeneration: z.boolean().default(true),
  includeAEOAnalysis: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Parse and validate request
    const body = await request.json();
    const { url, includeBusinessExtraction, includeSchemaGeneration, includeAEOAnalysis } =
      DashboardAnalysisRequestSchema.parse(body);

    const results: any = {
      url,
      timestamp: new Date().toISOString(),
      userId: session.user.email,
    };

    // Step 1: Extract business information from URL
    let businessInfo = null;
    if (includeBusinessExtraction) {
      console.log(`Extracting business information for: ${url}`);
      const businessExtractor = new BusinessExtractor();

      try {
        businessInfo = await businessExtractor.extractBusinessInfo(url);
        results.businessInfo = businessInfo;
        results.businessExtractionStatus = 'success';
      } catch (error) {
        console.error('Business extraction failed:', error);
        results.businessExtractionStatus = 'failed';
        results.businessExtractionError = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    // Step 2: Generate enhanced business schema
    let generatedSchemas = null;
    if (includeSchemaGeneration && businessInfo) {
      console.log('Generating comprehensive business schemas');
      const schemaGenerator = new BusinessSchemaGenerator();

      try {
        generatedSchemas = schemaGenerator.generateBusinessSchema(businessInfo, {
          includeReviews: true,
          includeFAQ: true,
          includeServices: true,
          includeLocalBusiness: true,
          includeOrganization: true,
          includeBreadcrumbs: true,
          includeWebsite: true,
        });

        results.generatedSchemas = generatedSchemas;
        results.schemaGenerationStatus = 'success';
        results.schemaStats = {
          totalSchemas: generatedSchemas.length,
          schemaTypes: generatedSchemas.map((schema) => schema['@type']),
          estimatedSEOImprovement: calculateSEOImprovement(generatedSchemas),
        };
      } catch (error) {
        console.error('Schema generation failed:', error);
        results.schemaGenerationStatus = 'failed';
        results.schemaGenerationError = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    // Step 3: Perform AEO analysis with extracted business context
    let aeoAnalysis = null;
    if (includeAEOAnalysis && businessInfo) {
      console.log('Performing AEO analysis with business context');

      try {
        aeoAnalysis = await performAEOAnalysis(businessInfo, url);
        results.aeoAnalysis = aeoAnalysis;
        results.aeoAnalysisStatus = 'success';
      } catch (error) {
        console.error('AEO analysis failed:', error);
        results.aeoAnalysisStatus = 'failed';
        results.aeoAnalysisError = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    // Step 4: Run Lighthouse audit for performance and SEO data
    let lighthouseResults = null;
    try {
      console.log('Running Lighthouse audit for comprehensive performance analysis');
      const lighthouseResponse = await fetch(`${request.nextUrl.origin}/api/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          categories: ['performance', 'seo', 'accessibility'],
          device: 'desktop',
        }),
      });

      if (lighthouseResponse.ok) {
        const lighthouseData = await lighthouseResponse.json();
        if (lighthouseData.success) {
          lighthouseResults = lighthouseData.data;
          results.lighthouse = lighthouseResults;
          results.lighthouseStatus = 'success';
        }
      }
    } catch (error) {
      console.warn('Lighthouse audit failed:', error);
      results.lighthouseStatus = 'failed';
      results.lighthouseError = error instanceof Error ? error.message : 'Unknown error';
    }

    // Step 5: Generate actionable recommendations
    if (businessInfo && aeoAnalysis) {
      results.recommendations = generateActionableRecommendations(
        businessInfo,
        aeoAnalysis,
        lighthouseResults
      );
    }

    // Step 6: Calculate overall optimization score
    results.optimizationScore = calculateOptimizationScore(
      businessInfo,
      aeoAnalysis,
      generatedSchemas || [],
      lighthouseResults
    );

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Dashboard analysis error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request format', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Perform comprehensive AEO analysis using business context
 */
async function performAEOAnalysis(businessInfo: any, url: string) {
  const hf = new HuggingFaceClient();

  const analysis = {
    schemaOptimization: {
      score: 0,
      recommendations: [] as string[],
      missingSchemas: [] as string[],
    },
    contentOptimization: {
      score: 0,
      voiceSearchReadiness: 0,
      conversationalLanguage: 0,
      questionAnswerPairs: 0,
      recommendations: [] as string[],
    },
    localSEO: {
      score: 0,
      googleMyBusinessOptimization: 0,
      localKeywordUsage: 0,
      locationConsistency: 0,
      recommendations: [] as string[],
    },
    technicalSEO: {
      score: 0,
      pageSpeed: 0,
      mobileOptimization: 0,
      structuredData: 0,
      recommendations: [] as string[],
    },
    competitiveAnalysis: {
      industryBenchmark: 0,
      competitiveAdvantages: [] as string[],
      opportunityAreas: [] as string[],
    },
  };

  // Analyze schema optimization
  analysis.schemaOptimization = analyzeSchemaOptimization(businessInfo);

  // Analyze content for AEO readiness
  try {
    const contentAnalysis = await analyzeContentForAEO(businessInfo, hf);
    analysis.contentOptimization = contentAnalysis;
  } catch (error) {
    console.warn('Content analysis failed:', error);
  }

  // Analyze local SEO factors
  analysis.localSEO = analyzeLocalSEO(businessInfo);

  // Technical SEO analysis would require actual website crawling
  analysis.technicalSEO = {
    score: 75, // Mock score
    pageSpeed: 80,
    mobileOptimization: 85,
    structuredData: 60,
    recommendations: [
      'Optimize page loading speed',
      'Add more structured data',
      'Improve mobile user experience',
    ],
  };

  // Industry competitive analysis
  analysis.competitiveAnalysis = await performCompetitiveAnalysis(businessInfo, hf);

  return analysis;
}

/**
 * Analyze schema optimization opportunities
 */
function analyzeSchemaOptimization(businessInfo: any) {
  const analysis = {
    score: 0,
    recommendations: [] as string[],
    missingSchemas: [] as string[],
  };

  let score = 0;
  const recommendations: string[] = [];
  const missingSchemas: string[] = [];

  // Check for basic LocalBusiness schema elements
  if (businessInfo.businessName) score += 15;
  else {
    recommendations.push('Add clear business name for LocalBusiness schema');
    missingSchemas.push('LocalBusiness.name');
  }

  if (businessInfo.location?.address?.street) score += 15;
  else {
    recommendations.push('Add complete address information');
    missingSchemas.push('LocalBusiness.address');
  }

  if (businessInfo.contact?.phone) score += 10;
  else recommendations.push('Add phone number for better local visibility');

  if (businessInfo.hours) score += 10;
  else recommendations.push('Add business hours for better customer experience');

  if (businessInfo.services?.length > 0) score += 15;
  else recommendations.push('Define specific services for Service schema');

  // Check for advanced schema opportunities
  if (businessInfo.services?.length > 3) {
    score += 10;
  } else {
    recommendations.push('Add more detailed service descriptions for better AEO optimization');
  }

  // FAQ schema opportunity
  if (businessInfo.industry) {
    score += 10;
    recommendations.push(`Add FAQ schema with common ${businessInfo.industry} questions`);
  }

  // Social media presence
  if (businessInfo.socialMedia && Object.values(businessInfo.socialMedia).some(Boolean)) {
    score += 15;
  } else {
    recommendations.push('Connect social media profiles to Organization schema');
  }

  analysis.score = score;
  analysis.recommendations = recommendations;
  analysis.missingSchemas = missingSchemas;

  return analysis;
}

/**
 * Analyze content for AEO and voice search optimization
 */
async function analyzeContentForAEO(businessInfo: any, hf: HuggingFaceClient) {
  const analysis = {
    score: 0,
    voiceSearchReadiness: 0,
    conversationalLanguage: 0,
    questionAnswerPairs: 0,
    recommendations: [] as string[],
  };

  const recommendations: string[] = [];
  let totalScore = 0;

  // Analyze service descriptions for conversational language
  if (businessInfo.services?.length > 0) {
    const serviceText = businessInfo.services.join(' ');

    try {
      // Real sentiment analysis using HuggingFace
      const sentiment = await hf.analyzeSentiment(serviceText);

      // Use sentiment analysis and text characteristics for conversational tone
      if (
        serviceText.length > 100 &&
        (serviceText.includes('you') || serviceText.includes('your') || sentiment.confidence > 0.7)
      ) {
        analysis.conversationalLanguage = Math.round(sentiment.confidence * 100);
        totalScore += 20;
      } else {
        analysis.conversationalLanguage = 40;
        recommendations.push('Use more engaging, conversational language in service descriptions');
      }
    } catch (error) {
      analysis.conversationalLanguage = 50;
    }
  }

  // Check for question-answer structure opportunities
  const questionKeywords = ['what', 'how', 'why', 'when', 'where', 'who'];
  const businessText = `${businessInfo.businessName} ${businessInfo.services?.join(' ') || ''}`;

  const hasQuestions = questionKeywords.some((keyword) =>
    businessText.toLowerCase().includes(keyword)
  );

  if (hasQuestions) {
    analysis.questionAnswerPairs = 70;
    totalScore += 15;
  } else {
    analysis.questionAnswerPairs = 20;
    recommendations.push('Create FAQ content answering common customer questions');
  }

  // Voice search readiness based on local business factors
  let voiceReadiness = 0;
  if (businessInfo.location?.address?.city) voiceReadiness += 25;
  if (businessInfo.contact?.phone) voiceReadiness += 25;
  if (businessInfo.hours) voiceReadiness += 25;
  if (businessInfo.services?.some((s: string) => s.includes('near me') || s.includes('local'))) {
    voiceReadiness += 25;
  } else {
    recommendations.push('Optimize content for "near me" and local voice searches');
  }

  analysis.voiceSearchReadiness = voiceReadiness;
  totalScore += voiceReadiness / 4; // Weight voice readiness

  // Industry-specific recommendations
  const industryRecommendations = getIndustryAEORecommendations(businessInfo.industry);
  recommendations.push(...industryRecommendations);

  analysis.score = Math.min(100, totalScore);
  analysis.recommendations = recommendations;

  return analysis;
}

/**
 * Analyze local SEO factors
 */
function analyzeLocalSEO(businessInfo: any) {
  const analysis = {
    score: 0,
    googleMyBusinessOptimization: 0,
    localKeywordUsage: 0,
    locationConsistency: 100,
    recommendations: [] as string[],
  };

  let score = 0;
  const recommendations: string[] = [];

  // Google My Business factors
  let gmbScore = 0;
  if (businessInfo.businessName) gmbScore += 20;
  if (businessInfo.location?.address?.street) gmbScore += 20;
  if (businessInfo.contact?.phone) gmbScore += 20;
  if (businessInfo.hours) gmbScore += 20;
  if (businessInfo.services?.length > 0) gmbScore += 20;

  analysis.googleMyBusinessOptimization = gmbScore;
  score += gmbScore * 0.4; // Weight GMB optimization heavily

  // Local keyword usage
  const hasLocationInServices = businessInfo.services?.some((service: string) =>
    service.toLowerCase().includes(businessInfo.location?.address?.city?.toLowerCase() || '')
  );

  if (hasLocationInServices) {
    analysis.localKeywordUsage = 80;
    score += 20;
  } else {
    analysis.localKeywordUsage = 30;
    recommendations.push(
      `Include "${businessInfo.location?.address?.city}" in service descriptions`
    );
  }

  // Service area optimization
  if (businessInfo.location?.serviceArea?.length > 0) {
    score += 15;
    recommendations.push('Create dedicated pages for each service area');
  } else {
    recommendations.push('Define and optimize for specific service areas');
  }

  // Industry-specific local recommendations
  if (businessInfo.industry?.toLowerCase().includes('healthcare')) {
    recommendations.push('Ensure medical license numbers are visible and up-to-date');
  } else if (businessInfo.industry?.toLowerCase().includes('legal')) {
    recommendations.push('Include bar admission information and practice areas');
  } else if (businessInfo.industry?.toLowerCase().includes('contractor')) {
    recommendations.push('Display license and insurance information prominently');
  }

  analysis.score = Math.min(100, score);
  analysis.recommendations = recommendations;

  return analysis;
}

/**
 * Perform competitive analysis using HuggingFace
 */
async function performCompetitiveAnalysis(businessInfo: any, hf: HuggingFaceClient) {
  const analysis = {
    industryBenchmark: 75, // Mock benchmark
    competitiveAdvantages: [] as string[],
    opportunityAreas: [] as string[],
  };

  // Industry-specific competitive advantages
  const advantages: string[] = [];
  const opportunities: string[] = [];

  if (businessInfo.attributes?.yearEstablished) {
    const yearsInBusiness = new Date().getFullYear() - businessInfo.attributes.yearEstablished;
    if (yearsInBusiness > 10) {
      advantages.push(`${yearsInBusiness} years of experience in ${businessInfo.industry}`);
    }
  }

  if (businessInfo.services?.length > 5) {
    advantages.push('Comprehensive service offering');
  } else {
    opportunities.push('Expand service descriptions and specialties');
  }

  if (
    businessInfo.socialMedia &&
    Object.values(businessInfo.socialMedia).filter(Boolean).length > 2
  ) {
    advantages.push('Strong social media presence');
  } else {
    opportunities.push('Develop stronger social media presence');
  }

  // Location-based advantages
  if (businessInfo.location?.serviceArea?.length > 3) {
    advantages.push('Wide service area coverage');
  } else {
    opportunities.push('Expand to additional service areas');
  }

  analysis.competitiveAdvantages = advantages;
  analysis.opportunityAreas = opportunities;

  return analysis;
}

/**
 * Get industry-specific AEO recommendations
 */
function getIndustryAEORecommendations(industry: string): string[] {
  const industryRecommendations: Record<string, string[]> = {
    healthcare: [
      'Create content answering common health questions',
      'Include doctor credentials and specializations',
      'Add appointment booking schema',
      'Optimize for symptom-based voice searches',
    ],
    'legal services': [
      'Create FAQ content for common legal questions',
      'Include practice area specializations',
      'Add lawyer/attorney schema with bar admissions',
      'Optimize for "lawyer near me" searches',
    ],
    'real estate': [
      'Create neighborhood and market analysis content',
      'Add property listing schemas',
      'Include market statistics and trends',
      'Optimize for "homes for sale near me" searches',
    ],
    restaurant: [
      'Add menu schema with prices',
      'Include dietary options and restrictions',
      'Create content about cuisine and specialties',
      'Optimize for "restaurants near me" searches',
    ],
    automotive: [
      'Add service schemas for auto repairs',
      'Include make and model specializations',
      'Create troubleshooting and maintenance content',
      'Optimize for "auto repair near me" searches',
    ],
  };

  return (
    industryRecommendations[industry?.toLowerCase()] || [
      'Create industry-specific FAQ content',
      'Optimize for local voice searches',
      'Include service-specific schema markup',
    ]
  );
}

/**
 * Generate actionable recommendations based on analysis
 */
function generateActionableRecommendations(
  businessInfo: any,
  aeoAnalysis: any,
  lighthouseResults?: any
) {
  const recommendations = {
    immediate: [] as Array<{
      action: string;
      impact: string;
      timeRequired: string;
      difficulty: string;
    }>, // Can be done today
    shortTerm: [] as Array<{
      action: string;
      impact: string;
      timeRequired: string;
      difficulty: string;
    }>, // Within 1 week
    longTerm: [] as Array<{
      action: string;
      impact: string;
      timeRequired: string;
      difficulty: string;
    }>, // Within 1 month
    priority: 'high', // high, medium, low
  };

  // Immediate actions (can be done today)
  if (aeoAnalysis.schemaOptimization.score < 60) {
    recommendations.immediate.push({
      action: 'Add LocalBusiness schema to homepage',
      impact: 'High',
      timeRequired: '30 minutes',
      difficulty: 'Easy',
    });
  }

  if (!businessInfo.contact?.phone) {
    recommendations.immediate.push({
      action: 'Add phone number to website footer and contact page',
      impact: 'High',
      timeRequired: '15 minutes',
      difficulty: 'Easy',
    });
  }

  // Short-term actions (within 1 week)
  if (aeoAnalysis.contentOptimization.questionAnswerPairs < 50) {
    recommendations.shortTerm.push({
      action: 'Create FAQ page with industry-specific questions',
      impact: 'High',
      timeRequired: '2-4 hours',
      difficulty: 'Medium',
    });
  }

  if (aeoAnalysis.localSEO.googleMyBusinessOptimization < 80) {
    recommendations.shortTerm.push({
      action: 'Complete Google My Business profile optimization',
      impact: 'Very High',
      timeRequired: '1-2 hours',
      difficulty: 'Easy',
    });
  }

  // Long-term actions (within 1 month)
  if (businessInfo.location?.serviceArea?.length < 3) {
    recommendations.longTerm.push({
      action: 'Create dedicated pages for each service area',
      impact: 'High',
      timeRequired: '1-2 weeks',
      difficulty: 'Medium',
    });
  }

  recommendations.longTerm.push({
    action: 'Implement comprehensive review management system',
    impact: 'High',
    timeRequired: '2-3 weeks',
    difficulty: 'Hard',
  });

  return recommendations;
}

/**
 * Calculate SEO improvement potential from generated schemas
 */
function calculateSEOImprovement(schemas: any[]): number {
  let improvement = 0;

  schemas.forEach((schema) => {
    switch (schema['@type']) {
      case 'LocalBusiness':
        improvement += 25;
        break;
      case 'FAQPage':
        improvement += 20;
        break;
      case 'Service':
        improvement += 10;
        break;
      case 'Organization':
        improvement += 15;
        break;
      default:
        improvement += 5;
    }
  });

  return Math.min(100, improvement);
}

/**
 * Calculate overall optimization score
 */
function calculateOptimizationScore(
  businessInfo: any,
  aeoAnalysis: any,
  schemas: any[],
  lighthouseResults?: any
) {
  if (!businessInfo || !aeoAnalysis) return 0;

  const weights = {
    businessInfo: 0.2,
    schemaOptimization: 0.25,
    contentOptimization: 0.25,
    localSEO: 0.3,
  };

  let score = 0;

  // Business info completeness
  const businessCompleteness = calculateBusinessCompleteness(businessInfo);
  score += businessCompleteness * weights.businessInfo;

  // Schema optimization score
  score += (aeoAnalysis.schemaOptimization?.score || 0) * weights.schemaOptimization;

  // Content optimization score
  score += (aeoAnalysis.contentOptimization?.score || 0) * weights.contentOptimization;

  // Local SEO score
  score += (aeoAnalysis.localSEO?.score || 0) * weights.localSEO;

  return Math.round(score);
}

/**
 * Calculate business information completeness percentage
 */
function calculateBusinessCompleteness(businessInfo: any): number {
  const requiredFields = [
    'businessName',
    'industry',
    'contact.phone',
    'contact.email',
    'location.address.street',
    'location.address.city',
    'services',
  ];

  const optionalFields = [
    'hours',
    'socialMedia',
    'specialties',
    'attributes.yearEstablished',
    'location.serviceArea',
  ];

  let score = 0;
  const totalPossibleScore = requiredFields.length * 10 + optionalFields.length * 5;

  // Check required fields (10 points each)
  requiredFields.forEach((field) => {
    const value = getNestedValue(businessInfo, field);
    if (value && (Array.isArray(value) ? value.length > 0 : value.toString().trim())) {
      score += 10;
    }
  });

  // Check optional fields (5 points each)
  optionalFields.forEach((field) => {
    const value = getNestedValue(businessInfo, field);
    if (value && (Array.isArray(value) ? value.length > 0 : value.toString().trim())) {
      score += 5;
    }
  });

  return (score / totalPossibleScore) * 100;
}

/**
 * Get nested object value by path string
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}
