import { NextRequest, NextResponse } from 'next/server';
import { SEORecommendationEngine } from '@/lib/seo-engine';
import { BusinessProfile } from '@/types/seo';
import { z } from 'zod';
import { validateRequest, createErrorResponse, createSuccessResponse } from '@/lib/validation';

const businessProfileSchema = z.object({
  businessName: z.string().min(1, 'Business name is required'),
  industry: z.string().min(1, 'Industry is required'),
  services: z.array(z.string()).default([]),
  city: z.string().min(1, 'City is required'),
  state: z.string().optional(),
  country: z.string().optional(),
  description: z.string().optional(),
  targetAudience: z.string().optional(),
  competitors: z.array(z.string()).optional(),
  uniqueSellingPoints: z.array(z.string()).optional(),
  operatingHours: z.record(z.string(), z.string()).optional(),
  contact: z
    .object({
      phone: z.string().optional(),
      email: z.string().email().optional(),
      website: z.string().url().optional(),
      address: z.string().optional(),
    })
    .default({}),
  socialMedia: z
    .object({
      facebook: z.string().optional(),
      instagram: z.string().optional(),
      twitter: z.string().optional(),
      linkedin: z.string().optional(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  const result = await validateRequest(request, businessProfileSchema);
  if (!result.success) {
    return result.response;
  }

  try {
    // Initialize SEO engine
    const seoEngine = new SEORecommendationEngine(result.data);

    // Generate comprehensive SEO recommendations
    const analysisResult = await seoEngine.generateRecommendations();

    return createSuccessResponse({
      data: analysisResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('SEO Analysis Error:', error);

    return createErrorResponse('Failed to generate SEO recommendations', 500);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const demo = searchParams.get('demo');

  if (demo === 'true') {
    // Return demo business profile for testing
    const demoProfile: BusinessProfile = {
      businessName: 'Dallas Premier Auto Detailing',
      industry: 'automotive',
      services: [
        'auto detailing',
        'car wash',
        'paint protection',
        'interior cleaning',
        'mobile detailing',
      ],
      city: 'Dallas',
      state: 'Texas',
      country: 'USA',
      description: 'Professional auto detailing services with mobile options',
      targetAudience: 'Car owners, luxury vehicle owners, fleet managers',
      competitors: ['Quick Quack Car Wash', 'Mister Car Wash', 'Zips Car Wash'],
      uniqueSellingPoints: [
        'Mobile service available',
        'Eco-friendly products',
        'Paint protection specialists',
        'Same-day service',
      ],
      operatingHours: {
        Monday: '8:00-18:00',
        Tuesday: '8:00-18:00',
        Wednesday: '8:00-18:00',
        Thursday: '8:00-18:00',
        Friday: '8:00-18:00',
        Saturday: '8:00-16:00',
        Sunday: 'Closed',
      },
      contact: {
        phone: '(214) 555-0123',
        email: 'info@dallasautodetailing.com',
        address: '123 Main St, Dallas, TX 75201',
      },
      reviews: [
        { rating: 4.8, count: 127, source: 'Google' },
        { rating: 4.9, count: 89, source: 'Yelp' },
        { rating: 4.7, count: 45, source: 'Facebook' },
      ],
      attributes: {
        mobileFriendly: true,
        ecoFriendly: true,
        insured: true,
        licensed: true,
        emergencyService: false,
        freeConcultation: true,
      },
      website: {
        currentUrl: 'https://dallasautodetailing.com',
        pages: ['/', '/services', '/about', '/contact', '/reviews'],
        currentSEO: {
          title: 'Dallas Auto Detailing',
          description: 'Car detailing services in Dallas',
          keywords: ['auto detailing', 'car wash', 'Dallas'],
        },
      },
    };

    try {
      const seoEngine = new SEORecommendationEngine(demoProfile);
      const analysisResult = await seoEngine.generateRecommendations();

      return NextResponse.json({
        success: true,
        demo: true,
        data: analysisResult,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Demo SEO Analysis Error:', error);
      return NextResponse.json(
        { error: 'Failed to generate demo SEO recommendations' },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    message: 'SEO Recommendations API',
    usage: {
      POST: 'Send business profile JSON to get SEO recommendations',
      'GET?demo=true': 'Get demo SEO analysis for testing',
    },
    requiredFields: ['businessName', 'industry', 'services (array)', 'city'],
    optionalFields: [
      'state',
      'country',
      'description',
      'targetAudience',
      'competitors',
      'uniqueSellingPoints',
      'operatingHours',
      'contact',
      'reviews',
      'attributes',
      'website',
    ],
  });
}
