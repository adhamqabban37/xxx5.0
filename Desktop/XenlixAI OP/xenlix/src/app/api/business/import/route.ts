import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { BusinessProfileParser, NormalizedBusinessProfile } from '@/lib/business-profile-parser';
import { z } from 'zod';
import { validateRequest, createErrorResponse, createSuccessResponse } from '@/lib/validation';

// Request validation schema
const ImportRequestSchema = z.object({
  jsonData: z.unknown(),
  source: z.string().optional(),
  mergeWithExisting: z.boolean().optional().default(false),
});

// Response types
interface ImportResponse {
  success: boolean;
  data?: {
    profile: NormalizedBusinessProfile;
    recommendations: {
      seo: string[];
      content: string[];
      reviews: string[];
      local: string[];
      priority: 'high' | 'medium' | 'low';
    };
  };
  error?: string;
  warnings?: string[];
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const result = await validateRequest(request, ImportRequestSchema);
  if (!result.success) {
    return result.response;
  }

  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return createErrorResponse('Authentication required', 401);
    }

    const { jsonData, source = 'manual-import', mergeWithExisting } = result.data;

    // Parse the business profile
    const parser = new BusinessProfileParser();
    const normalizedProfile = parser.parseProfile(jsonData, source);

    // Generate optimization recommendations
    const recommendations = parser.generateOptimizationRecommendations(normalizedProfile);

    return createSuccessResponse({
      profile: normalizedProfile,
      recommendations,
      warnings: normalizedProfile.metadata.warnings,
    });
  } catch (error) {
    console.error('Business profile import error:', error);

    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to import business profile',
      500
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Return supported import formats and examples
    const supportedFormats = {
      'google-my-business': {
        description: 'Google My Business API export format',
        example: {
          name: 'Example Business',
          businessStatus: 'OPERATIONAL',
          categories: ['Restaurant', 'Italian Restaurant'],
          phoneNumber: '+1-555-123-4567',
          websiteUri: 'https://example.com',
          location: {
            address: {
              addressLines: ['123 Main St'],
              locality: 'San Francisco',
              administrativeArea: 'CA',
              postalCode: '94102',
              regionCode: 'US',
            },
            latlng: {
              latitude: 37.7749,
              longitude: -122.4194,
            },
          },
          regularHours: {
            periods: [
              {
                openDay: 'MONDAY',
                openTime: '09:00',
                closeDay: 'MONDAY',
                closeTime: '17:00',
              },
            ],
          },
        },
      },
      yelp: {
        description: 'Yelp Business API format',
        example: {
          id: 'example-business-id',
          name: 'Example Business',
          image_url: 'https://example.com/image.jpg',
          is_closed: false,
          url: 'https://yelp.com/biz/example',
          review_count: 150,
          categories: [
            { alias: 'restaurants', title: 'Restaurants' },
            { alias: 'italian', title: 'Italian' },
          ],
          rating: 4.5,
          coordinates: {
            latitude: 37.7749,
            longitude: -122.4194,
          },
          location: {
            address1: '123 Main St',
            city: 'San Francisco',
            state: 'CA',
            zip_code: '94102',
            country: 'US',
          },
          phone: '+15551234567',
        },
      },
      facebook: {
        description: 'Facebook Business API format',
        example: {
          id: '123456789',
          name: 'Example Business',
          about: 'We provide excellent service',
          category: 'Restaurant',
          category_list: [
            { id: '1', name: 'Restaurant' },
            { id: '2', name: 'Italian Restaurant' },
          ],
          location: {
            city: 'San Francisco',
            country: 'United States',
            latitude: 37.7749,
            longitude: -122.4194,
            state: 'CA',
            street: '123 Main St',
            zip: '94102',
          },
          phone: '+1-555-123-4567',
          website: 'https://example.com',
          overall_star_rating: 4.5,
          rating_count: 100,
        },
      },
      generic: {
        description: 'Generic business profile format',
        example: {
          businessName: 'Example Business',
          industry: 'Restaurant',
          services: ['Fine Dining', 'Catering', 'Private Events'],
          city: 'San Francisco',
          address: {
            street: '123 Main St',
            city: 'San Francisco',
            state: 'CA',
            zipCode: '94102',
          },
          phone: '+1-555-123-4567',
          email: 'info@example.com',
          website: 'https://example.com',
          reviews: {
            rating: 4.5,
            count: 200,
          },
          attributes: {
            yearEstablished: 2015,
            employeeCount: 25,
            specialties: ['Italian Cuisine', 'Wine Selection'],
            paymentMethods: ['Cash', 'Credit Cards', 'Mobile Pay'],
          },
        },
      },
    };

    return NextResponse.json({
      success: true,
      supportedFormats,
      endpoint: '/api/business/import',
      methods: ['POST'],
      description: 'Import and normalize business profile data from various sources',
    });
  } catch (error) {
    console.error('Business profile formats error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get supported formats' },
      { status: 500 }
    );
  }
}
