import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../../auth/[...nextauth]/route';
import { z } from 'zod';
import { GenerateAdsRequest, AdDraftBundle, CampaignGoal, CustomerProfile } from '@/types/ads';
import { validateRequest, createErrorResponse, createSuccessResponse } from '@/lib/validation';

const prisma = new PrismaClient();

const requestSchema = z.object({
  profile: z.object({
    businessName: z.string().optional(),
    industry: z.string().optional(),
    targetAudience: z.string().optional(),
    currentWebsite: z.string().optional(),
    services: z.array(z.string()).optional(),
    city: z.string().optional(),
    reviews: z
      .object({
        rating: z.number(),
        count: z.number(),
      })
      .optional(),
    urls: z
      .object({
        website: z.string().optional(),
      })
      .optional(),
  }),
  objective: z.enum(['leads', 'sales', 'visibility']),
  budget: z.object({
    dailyUSD: z.number().min(5).max(5000),
    durationDays: z.number().min(7).max(90),
  }),
  competitors: z.array(z.string()).optional(),
  usp: z.array(z.string()).optional(),
  promos: z.array(z.string()).optional(),
  landingUrl: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  const result = await validateRequest(request, requestSchema);
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

    const adBundle = generateAdDrafts(result.data);

    // Note: Database save would require adDraft table in schema
    // For now, return the generated bundle

    return createSuccessResponse({
      id: `draft_${Date.now()}`,
      data: adBundle,
    });
  } catch (error) {
    console.error('Ad generation error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

function generateAdDrafts(request: GenerateAdsRequest): AdDraftBundle {
  const { profile, objective, budget, competitors = [], usp = [], promos = [] } = request;

  // Build value propositions
  const businessName = profile.businessName || 'Your Business';
  const industry = profile.industry || 'Business';
  const city = profile.city || 'Local';
  const services = profile.services || [];

  // Social proof indicators
  const hasStrongReviews = Boolean(
    profile.reviews && profile.reviews.rating >= 4.5 && profile.reviews.count >= 50
  );

  // Generate base keywords
  const baseKeywords = [
    businessName.toLowerCase(),
    ...services.map((s) => s.toLowerCase()),
    ...services.map((s) => `${s.toLowerCase()} ${city.toLowerCase()}`),
    ...services.map((s) => `${s.toLowerCase()} near me`),
    `${industry.toLowerCase()} ${city.toLowerCase()}`,
  ];

  // Budget-based strategy
  const isLowBudget = budget.dailyUSD < 30;

  return {
    google: generateGoogleDraft(
      profile,
      objective,
      usp,
      promos,
      baseKeywords,
      hasStrongReviews,
      isLowBudget
    ),
    bing: generateBingDraft(profile, objective, usp, promos, baseKeywords, hasStrongReviews),
    meta: generateMetaDraft(profile, objective, usp, promos, hasStrongReviews),
    tiktok: generateTikTokDraft(profile, objective, usp, promos),
    budget,
    campaignObjective: objective,
  };
}

function generateGoogleDraft(
  profile: CustomerProfile,
  objective: CampaignGoal,
  usp: string[],
  promos: string[],
  keywords: string[],
  hasStrongReviews: boolean,
  isLowBudget: boolean
) {
  const businessName = profile.businessName || 'Your Business';
  const industry = profile.industry || 'Business';
  const city = profile.city || 'Local';
  const services = profile.services?.[0] || 'Services';

  const headlines = [
    `${businessName} - ${city}`,
    `Best ${services} in ${city}`,
    `Professional ${industry}`,
    `${objective === 'leads' ? 'Get Free Quote' : objective === 'sales' ? 'Shop Now' : 'Learn More'}`,
    `${city} ${services} Expert`,
  ].map((h) => (h.length > 30 ? h.substring(0, 27) + '...' : h));

  const descriptions = [
    `${businessName} provides professional ${services} in ${city}. ${objective === 'leads' ? 'Contact us for a free consultation.' : 'Quality results guaranteed.'}`,
    `Expert ${industry} services ${usp.length > 0 ? `with ${usp[0]}` : 'for your needs'}. ${objective === 'sales' ? 'Order today!' : 'Get started now.'}`,
    `${city}'s trusted ${services} provider. ${hasStrongReviews ? '4.5+ star reviews.' : 'Quality service.'} Call today!`,
    `Professional ${services} solutions. ${promos.length > 0 ? promos[0] : 'Competitive pricing'}. Free estimates available.`,
  ].map((d) => (d.length > 90 ? d.substring(0, 87) + '...' : d));

  const callouts = [
    hasStrongReviews ? '5-Star Reviews' : 'Quality Service',
    'Free Consultation',
    'Licensed & Insured',
    'Same Day Service',
  ];

  const sitelinks = [
    { text: 'About Us', url: '#about' },
    { text: 'Services', url: '#services' },
    { text: 'Contact', url: '#contact' },
    { text: 'Reviews', url: '#reviews' },
  ];

  return {
    headlines,
    descriptions,
    longHeadline: `${businessName} - Professional ${services} in ${city} | ${objective === 'leads' ? 'Free Quotes' : 'Quality Results'}`,
    keywords: isLowBudget ? keywords.slice(0, 10) : keywords,
    callouts,
    sitelinks,
    assets: [],
  };
}

function generateBingDraft(
  profile: CustomerProfile,
  objective: CampaignGoal,
  usp: string[],
  promos: string[],
  keywords: string[],
  hasStrongReviews: boolean
) {
  const businessName = profile.businessName || 'Your Business';
  const industry = profile.industry || 'Business';
  const city = profile.city || 'Local';
  const services = profile.services?.[0] || 'Services';

  const headlines = [
    `${businessName} ${city}`,
    `${services} Specialist`,
    `Top ${industry} Provider`,
    `${hasStrongReviews ? '5-Star' : 'Quality'} Service`,
    `${city} ${services}`,
  ].map((h) => (h.length > 30 ? h.substring(0, 27) + '...' : h));

  const descriptions = [
    `Professional ${services} in ${city}. ${businessName} delivers quality results. ${objective === 'leads' ? 'Get your free quote today.' : 'Contact us now.'}`,
    `Expert ${industry} solutions ${usp.length > 0 ? `featuring ${usp[0]}` : 'for all your needs'}. ${promos.length > 0 ? promos[0] : 'Competitive rates.'}`,
    `${city}'s premier ${services} company. ${hasStrongReviews ? 'Highly rated service.' : 'Trusted provider.'} Call for details.`,
    `Quality ${services} you can trust. Licensed professionals. ${objective === 'sales' ? 'Order today!' : 'Free consultation available.'}`,
  ].map((d) => (d.length > 90 ? d.substring(0, 87) + '...' : d));

  return {
    headlines,
    descriptions,
    keywords,
    assets: [],
  };
}

function generateMetaDraft(
  profile: CustomerProfile,
  objective: CampaignGoal,
  usp: string[],
  promos: string[],
  hasStrongReviews: boolean
) {
  const businessName = profile.businessName || 'Your Business';
  const industry = profile.industry || 'Business';
  const city = profile.city || 'Local';
  const services = profile.services?.[0] || 'Services';

  const primaryTexts = [
    `Looking for reliable ${services} in ${city}? ${businessName} has you covered! ${usp.length > 0 ? `We specialize in ${usp[0]}` : 'Professional service'} with ${hasStrongReviews ? '5-star reviews' : 'quality results'}. ${promos.length > 0 ? promos[0] : 'Contact us today!'}`,
    `${businessName} - Your trusted ${industry} expert in ${city}. ${objective === 'leads' ? 'Get a free consultation' : objective === 'sales' ? 'Shop our services' : 'Learn more about us'} and discover why locals choose us for ${services}.`,
    `Transform your ${services.toLowerCase()} experience with ${businessName}. ${hasStrongReviews ? 'Join hundreds of satisfied customers' : 'Quality service guaranteed'}. ${promos.length > 0 ? `Special offer: ${promos[0]}` : 'Professional results every time.'}`,
  ];

  const headlines = [
    `${businessName} ${city}`,
    `Best ${services}`,
    `${hasStrongReviews ? '5-Star' : 'Top'} ${industry}`,
    `Professional Service`,
  ].map((h) => (h.length > 40 ? h.substring(0, 37) + '...' : h));

  const descriptions = [
    `Quality ${services} in ${city}`,
    `Professional ${industry}`,
    `Trusted local provider`,
    `Get results today`,
  ].map((d) => (d.length > 30 ? d.substring(0, 27) + '...' : d));

  const callToAction =
    objective === 'leads'
      ? ('CONTACT_US' as const)
      : objective === 'sales'
        ? ('SHOP_NOW' as const)
        : ('LEARN_MORE' as const);

  return {
    primaryTexts,
    headlines,
    descriptions,
    callToAction,
  };
}

function generateTikTokDraft(
  profile: CustomerProfile,
  objective: CampaignGoal,
  usp: string[],
  promos: string[]
) {
  const businessName = profile.businessName || 'Your Business';
  const industry = profile.industry?.toLowerCase() || 'business';
  const city = profile.city || 'Local';
  const services = profile.services?.[0] || 'Services';

  const hooks = [
    'POV: You need',
    'This will change',
    'Nobody talks about',
    'The secret to',
    "Why everyone's switching",
  ];

  const primaryTexts = [
    `${businessName} just changed the ${industry} game in ${city}! ${usp.length > 0 ? usp[0] : 'Amazing results'} that everyone's talking about. ${promos.length > 0 ? promos[0] : 'DM for details!'}`,
    `Local ${services} that actually works? Yes please! ${businessName} delivers results that speak for themselves. ${city} locals are obsessed!`,
    `Breaking: ${city}'s best kept ${industry} secret revealed! ${businessName} shows you how to get ${objective === 'leads' ? 'amazing results' : 'what you need'}.`,
  ];

  const ctas = ['DM us now!', 'Link in bio', 'Call today', 'Get yours', 'Book now'];

  const hashtags = [
    `#${city.replace(/\s+/g, '')}`,
    `#${industry.replace(/\s+/g, '')}`,
    `#${services.replace(/\s+/g, '')}`,
    '#local',
    '#smallbusiness',
  ];

  return {
    primaryTexts,
    hooks,
    ctas,
    hashtags,
  };
}
