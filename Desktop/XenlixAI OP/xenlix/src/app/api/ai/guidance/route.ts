import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../../auth/[...nextauth]/route';
import { z } from 'zod';
import { buildAeoChecklist } from '@/lib/seo/aeo';
import { buildSeoChecklist } from '@/lib/seo/seo';
import { normalizeProfile } from '@/lib/seo/normalize';
import { validateRequest, createErrorResponse, createSuccessResponse } from '@/lib/validation';

const prisma = new PrismaClient();

// Types for AEO and SEO guidance
export interface GuidanceItem {
  id: string;
  task: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  effort: number; // 1-10 scale
  impact: 'high' | 'medium' | 'low';
  completed: boolean;
  category: string;
  estimatedTime: string;
  resources?: string[];
}

export interface GuidanceSection {
  title: string;
  description: string;
  progress: number; // 0-100 percentage
  totalItems: number;
  completedItems: number;
  items: GuidanceItem[];
}

// Input validation schema
const GuidanceRequestSchema = z.object({
  profile: z.object({
    businessName: z.string().min(1),
    businessType: z.string().min(1),
    targetAudience: z.string().min(1),
    goals: z.array(z.string()).min(1),
    monthlyBudget: z.number().positive(),
    currentChallenges: z.string().min(1),
  }),
});

type GuidanceProfile = z.infer<typeof GuidanceRequestSchema>['profile'];

// Generate AEO (AI Engine Optimization) guidance
function generateAEOGuidance(profile: GuidanceProfile): GuidanceSection {
  // Normalize the profile to match our AEO checklist expectations
  const normalizedProfile = normalizeProfile({
    name: profile.businessName || 'Unknown Business',
    businessType: profile.businessType || '',
    website: '',
    description: '',
    // Add any other available profile data here
  });

  // Generate AEO checklist items using our new function
  const aeoItems = buildAeoChecklist(normalizedProfile);

  // Convert AEO checklist items to guidance items format
  const items: GuidanceItem[] = aeoItems.map((item, index) => ({
    id: `aeo-${index + 1}`,
    task: item.title,
    description: item.description,
    priority: item.priority,
    effort: item.priority === 'high' ? 7 : item.priority === 'medium' ? 5 : 3, // Estimate effort based on priority
    impact: item.priority, // Use priority as impact indicator
    completed: item.status === 'complete',
    category: item.category,
    estimatedTime:
      item.priority === 'high'
        ? '2-4 hours'
        : item.priority === 'medium'
          ? '1-2 hours'
          : '30-60 minutes',
    resources: [], // Default empty resources for now
  }));

  const completedItems = items.filter((item) => item.completed).length;
  const progress = Math.round((completedItems / items.length) * 100);

  return {
    title: 'AI Search Engine Optimization (AEO)',
    description: 'Optimize your content for AI-powered search engines and language models',
    progress,
    totalItems: items.length,
    completedItems,
    items,
  };
}

// Generate Traditional SEO guidance
function generateTraditionalSEOGuidance(profile: GuidanceProfile): GuidanceSection {
  // Normalize the profile to match our SEO checklist expectations
  const normalizedProfile = normalizeProfile({
    name: profile.businessName || 'Unknown Business',
    businessType: profile.businessType || '',
    website: '',
    description: '',
    // Add any other available profile data here
  });

  // Generate SEO checklist items using our new function
  const seoItems = buildSeoChecklist(normalizedProfile);

  // Convert SEO checklist items to guidance items format
  const items: GuidanceItem[] = seoItems.map((item, index) => ({
    id: `seo-${index + 1}`,
    task: item.title,
    description: item.description,
    priority: item.priority,
    effort: item.priority === 'high' ? 7 : item.priority === 'medium' ? 5 : 3, // Estimate effort based on priority
    impact: item.priority, // Use priority as impact indicator
    completed: item.status === 'complete',
    category: item.category,
    estimatedTime:
      item.priority === 'high'
        ? '3-5 hours'
        : item.priority === 'medium'
          ? '1-3 hours'
          : '30-90 minutes',
    resources: [], // Default empty resources for now
  }));

  const completedItems = items.filter((item) => item.completed).length;
  const progress = Math.round((completedItems / items.length) * 100);

  return {
    title: 'Traditional SEO',
    description:
      'Essential search engine optimization tactics for Google, Bing, and other search engines',
    progress,
    totalItems: items.length,
    completedItems,
    items,
  };
}

// Mock AI guidance generation (replace with actual AI service)
function generateGuidance(profile: GuidanceProfile) {
  const businessType = profile.businessType.toLowerCase();
  const budget = profile.monthlyBudget;
  const goals = profile.goals;

  // Generate AEO and Traditional SEO guidance
  const aeoGuidance = generateAEOGuidance(profile);
  const traditionalSEOGuidance = generateTraditionalSEOGuidance(profile);

  // Mock budget analysis
  const budgetAnalysis = {
    daily: Math.round(budget / 30),
    recommended: {
      search: Math.round(budget * 0.4),
      shopping: Math.round(budget * 0.3),
      display: Math.round(budget * 0.2),
      video: Math.round(budget * 0.1),
    },
  };

  // Mock recommendations based on business type and goals
  const recommendations = [];

  if (goals.includes('increase_sales')) {
    recommendations.push('Focus on Shopping campaigns for direct product promotion');
    recommendations.push('Use audience targeting to reach high-intent customers');
  }

  if (goals.includes('brand_awareness')) {
    recommendations.push('Allocate budget to Display and Video campaigns');
    recommendations.push('Target broad awareness audiences with compelling creative');
  }

  if (goals.includes('lead_generation')) {
    recommendations.push('Implement lead form extensions in Search campaigns');
    recommendations.push('Use remarketing lists to re-engage website visitors');
  }

  if (businessType.includes('ecommerce') || businessType.includes('retail')) {
    recommendations.push('Set up Google Merchant Center for Shopping campaigns');
    recommendations.push('Implement dynamic remarketing for cart abandoners');
  }

  // Mock optimization tips
  const optimizationTips = [
    'Test different ad copy variations weekly',
    'Monitor search terms and add negative keywords regularly',
    'Adjust bids based on time-of-day performance',
    'Use automated bidding strategies for efficiency',
    'Set up conversion tracking for all important actions',
  ];

  return {
    guidance: {
      summary: `AEO Analysis for ${profile.businessName}`,
      budgetAnalysis,
      keyRecommendations: recommendations.slice(0, 3),
      optimizationTips: optimizationTips.slice(0, 4),
      priority: 'high',
      estimatedImpact: '20-30% improvement in performance',
    },
    aeoGuidance,
    traditionalSEOGuidance,
    businessProfile: {
      name: profile.businessName,
      industry: profile.businessType,
      hasProfile: true,
    },
    lastUpdated: new Date().toISOString(),
    timestamp: new Date().toISOString(),
    version: '2.0',
  };
}

// GET endpoint for dashboard to fetch guidance sections
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For GET requests, return sample guidance data
    const mockProfile: GuidanceProfile = {
      businessName: 'Sample Business',
      businessType: 'general',
      targetAudience: 'general audience',
      goals: ['increase_sales'],
      monthlyBudget: 1000,
      currentChallenges: 'general optimization',
    };

    const guidanceData = generateGuidance(mockProfile);

    return NextResponse.json({
      success: true,
      data: {
        aeo: guidanceData.aeoGuidance,
        traditionalSEO: guidanceData.traditionalSEOGuidance,
        businessProfile: guidanceData.businessProfile,
        lastUpdated: guidanceData.lastUpdated,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate guidance recommendations',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const result = await validateRequest(request, GuidanceRequestSchema);
  if (!result.success) {
    return result.response;
  }

  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return createErrorResponse('Unauthorized', 401);
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return createErrorResponse('User not found', 404);
    }

    // Generate AI guidance
    const guidanceOutput = generateGuidance(result.data.profile);

    return createSuccessResponse({
      id: 'temp-id',
      aeo: guidanceOutput.aeoGuidance,
      traditionalSEO: guidanceOutput.traditionalSEOGuidance,
      businessProfile: guidanceOutput.businessProfile,
      lastUpdated: guidanceOutput.lastUpdated,
      legacy: guidanceOutput.guidance, // Keep legacy format for compatibility
    });
  } catch (error) {
    console.error('AI guidance generation error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
