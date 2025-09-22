import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { LocalSEOGenerator } from "@/lib/local-seo-generator";
import { SchemaGenerator } from "@/lib/schema-generator";
import { BusinessProfileParser } from "@/lib/business-profile-parser";
// import { generateSEORecommendations } from "@/lib/seo-engine";
import {
  CityData,
  BusinessLocation,
  CityPageGenerationConfig,
  GeneratedCityPage,
  CityPageGenerationResponse,
  BulkCityPageGeneration,
  BulkGenerationResult
} from "@/types/local-seo";
import { z } from "zod";
import { validateRequest, createErrorResponse, createSuccessResponse } from "@/lib/validation";

// Prevent execution during build time
export const runtime = 'nodejs';

// Request validation schemas
const CityPageGenerationSchema = z.object({
  businessProfile: z.object({
    businessName: z.string(),
    industry: z.string(),
    services: z.array(z.string()),
    city: z.string(),
    state: z.string().optional(),
    country: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    website: z.string().optional(),
    socialMedia: z.object({
      facebook: z.string().optional(),
      instagram: z.string().optional(),
      twitter: z.string().optional(),
      linkedin: z.string().optional()
    }).optional(),
    reviews: z.object({
      rating: z.number(),
      count: z.number(),
      platforms: z.record(z.string(), z.object({
        rating: z.number(),
        count: z.number()
      })).optional()
    }),
    attributes: z.object({
      yearEstablished: z.number().optional(),
      employeeCount: z.number().optional(),
      businessHours: z.object({
        monday: z.string().optional(),
        tuesday: z.string().optional(),
        wednesday: z.string().optional(),
        thursday: z.string().optional(),
        friday: z.string().optional(),
        saturday: z.string().optional(),
        sunday: z.string().optional()
      }).optional(),
      servicesOffered: z.array(z.string()).optional(),
      specialties: z.array(z.string()).optional(),
      certifications: z.array(z.string()).optional(),
      paymentMethods: z.array(z.string()).optional(),
      languages: z.array(z.string()).optional(),
      features: z.array(z.string()).optional()
    }).optional(),
    location: z.object({
      address: z.object({
        street: z.string().optional(),
        city: z.string(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        country: z.string().optional()
      }).optional(),
      serviceArea: z.array(z.string()).optional(),
      coordinates: z.object({
        latitude: z.number(),
        longitude: z.number()
      }).optional()
    }).optional(),
    seo: z.object({
      primaryKeywords: z.array(z.string()),
      secondaryKeywords: z.array(z.string()),
      targetAudience: z.array(z.string()),
      competitiveAdvantages: z.array(z.string()),
      uniqueSellingPropositions: z.array(z.string())
    }).optional(),
    metadata: z.object({
      source: z.string(),
      confidence: z.number(),
      lastUpdated: z.date(),
      warnings: z.array(z.string()),
      dataQuality: z.object({
        completeness: z.number(),
        accuracy: z.number(),
        freshness: z.number()
      }),
      processingNotes: z.array(z.string())
    })
  }),
  targetCity: z.object({
    name: z.string(),
    state: z.string(),
    stateAbbreviation: z.string(),
    county: z.string().optional(),
    region: z.string().optional(),
    country: z.string(),
    coordinates: z.object({
      latitude: z.number(),
      longitude: z.number()
    }),
    timezone: z.string(),
    zipCodes: z.array(z.string()),
    demographics: z.object({
      population: z.number(),
      medianAge: z.number(),
      medianIncome: z.number(),
      householdCount: z.number(),
      businessCount: z.number().optional()
    }),
    economy: z.object({
      majorIndustries: z.array(z.string()),
      unemploymentRate: z.number().optional(),
      economicGrowthRate: z.number().optional(),
      businessFriendlyRating: z.number().optional()
    }),
    characteristics: z.object({
      localKeywords: z.array(z.string()),
      neighborhoodNames: z.array(z.string()),
      landmarkNames: z.array(z.string()),
      events: z.array(z.string()),
      culture: z.array(z.string()),
      climate: z.string()
    })
  }),
  businessLocation: z.object({
    primaryAddress: z.object({
      street: z.string(),
      city: z.string(),
      state: z.string(),
      zipCode: z.string(),
      country: z.string()
    }),
    serviceAreas: z.object({
      cities: z.array(z.string()),
      counties: z.array(z.string()),
      radiusMiles: z.number(),
      specificZipCodes: z.array(z.string())
    }),
    locationSpecific: z.object({
      localCompetitors: z.array(z.string()),
      localPartnerships: z.array(z.string()),
      communityInvolvement: z.array(z.string()),
      localCertifications: z.array(z.string()),
      localAwards: z.array(z.string())
    })
  }),
  config: z.object({
    template: z.object({
      layout: z.enum(['standard', 'service-focused', 'location-focused', 'hybrid']),
      theme: z.string(),
      components: z.array(z.string())
    }),
    seo: z.object({
      enableAEO: z.boolean(),
      enableVoiceSearch: z.boolean(),
      targetFeaturedSnippets: z.boolean(),
      enableLocalSchema: z.boolean(),
      customMetaTags: z.record(z.string(), z.string())
    }),
    content: z.object({
      autoGenerateFromProfile: z.boolean(),
      includeTestimonials: z.boolean(),
      includeCaseStudies: z.boolean(),
      generateLocalFAQ: z.boolean(),
      localContentDepth: z.enum(['basic', 'detailed', 'comprehensive'])
    }),
    performance: z.object({
      enableStaticGeneration: z.boolean(),
      revalidationInterval: z.number(),
      enableImageOptimization: z.boolean(),
      enableCaching: z.boolean()
    })
  }),
  customizations: z.object({
    customContent: z.record(z.string(), z.unknown()).optional(),
    customMetadata: z.record(z.string(), z.unknown()).optional(),
    customStructuredData: z.record(z.string(), z.unknown()).optional()
  }).optional()
});

const BulkGenerationSchema = z.object({
  cities: z.array(z.object({
    id: z.string(),
    cityData: CityPageGenerationSchema.shape.targetCity,
    businessLocation: CityPageGenerationSchema.shape.businessLocation,
    isActive: z.boolean(),
    priority: z.enum(['high', 'medium', 'low']),
    competitionLevel: z.enum(['low', 'medium', 'high']),
    marketPotential: z.number().min(1).max(10),
    lastUpdated: z.date(),
    customizations: z.object({
      customContent: z.record(z.string(), z.unknown()).optional(),
      customKeywords: z.array(z.string()).optional(),
      customCompetitors: z.array(z.string()).optional()
    }).optional()
  })),
  globalConfig: CityPageGenerationSchema.shape.config,
  generateInParallel: z.boolean(),
  maxConcurrency: z.number().optional()
});

// Response types
interface LocalSEOResponse {
  success: boolean;
  data?: GeneratedCityPage;
  seoRecommendations?: any;
  schemaMarkup?: any;
  error?: string;
  warnings?: string[];
  performance?: {
    generationTime: number;
    optimizationsApplied: string[];
    recommendations: string[];
  };
}

interface BulkResponse {
  success: boolean;
  data?: BulkGenerationResult;
  error?: string;
}

// POST - Generate single city page
export async function POST(request: NextRequest): Promise<NextResponse> {
  const result = await validateRequest(request, CityPageGenerationSchema);
  if (!result.success) {
    return result.response;
  }

  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return createErrorResponse("Authentication required", 401);
    }

    const {
      businessProfile,
      targetCity,
      businessLocation,
      config,
      customizations
    } = result.data;

    // Generate city page
    const generator = new LocalSEOGenerator({
      businessProfile: businessProfile as any,
      targetCity,
      businessLocation,
      config,
      customizations
    });

    const generationResult = await generator.generateCityPage();

    if (!generationResult.success) {
      return createErrorResponse("Failed to generate city page", 500);
    }

    // Generate additional SEO recommendations using existing system
    const transformedProfile: any = {
      industry: businessProfile.industry,
      services: businessProfile.services,
      city: businessProfile.city,
      state: businessProfile.state,
      country: businessProfile.country,
      businessName: businessProfile.businessName,
      contact: {
        phone: businessProfile.phone,
        email: businessProfile.email,
        address: businessProfile.location?.address?.street
      },
      reviews: businessProfile.reviews ? [{
        rating: businessProfile.reviews.rating,
        count: businessProfile.reviews.count,
        source: 'multiple'
      }] : undefined,
      attributes: businessProfile.attributes ? {
        yearEstablished: businessProfile.attributes.yearEstablished?.toString(),
        employeeCount: businessProfile.attributes.employeeCount?.toString()
      } : undefined
    };
    // const seoRecommendations = generateSEORecommendations(transformedProfile);

    // Generate schema markup using existing system
    const schemaGenerator = new SchemaGenerator({
      includeLocalBusiness: true,
      includeServices: true,
      includeFAQ: true,
      includeWebsite: true,
      includeOrganization: true
    });

    // Convert business profile to schema format
    const businessProfileForSchema = {
      businessName: businessProfile.businessName,
      description: `Professional ${businessProfile.services.join(', ')} services in ${targetCity.name}, ${targetCity.state}`,
      industry: businessProfile.industry,
      services: businessProfile.services,
      address: {
        street: businessLocation.primaryAddress.street,
        city: businessLocation.primaryAddress.city,
        state: businessLocation.primaryAddress.state,
        zipCode: businessLocation.primaryAddress.zipCode,
        country: businessLocation.primaryAddress.country
      },
      contact: {
        phone: businessProfile.phone,
        email: businessProfile.email,
        website: businessProfile.website
      },
      socialMedia: businessProfile.socialMedia,
      rating: businessProfile.reviews.rating > 0 ? {
        value: businessProfile.reviews.rating,
        count: businessProfile.reviews.count,
        reviews: []
      } : undefined,
      coordinates: businessProfile.location?.coordinates || {
        latitude: targetCity.coordinates.latitude,
        longitude: targetCity.coordinates.longitude
      }
    };

    const schemaMarkup = schemaGenerator.generateSchemas(businessProfileForSchema);

    // Temporary placeholder recommendations until real engine added
    const seoRecommendations = [
      'Add city-specific FAQ schema',
      'Improve internal linking between city pages',
      'Ensure NAP consistency across all directory listings'
    ];

    return createSuccessResponse({
      data: generationResult.data,
      seoRecommendations,
      schemaMarkup,
      generationTime: 0
    });

  } catch (error) {
    console.error('Local SEO generation error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Unknown error occurred',
      500
    );
  }
}

// PUT - Bulk generate city pages
export async function PUT(request: NextRequest): Promise<NextResponse<BulkResponse>> {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate request data
    const validationResult = BulkGenerationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid request data"
        },
        { status: 400 }
      );
    }

    const {
      cities,
      globalConfig,
      generateInParallel,
      maxConcurrency = 3
    } = validationResult.data;

    const startTime = Date.now();
    const results: BulkGenerationResult['results'] = [];
    let successful = 0;
    let failed = 0;

    // Process cities based on parallel setting
    if (generateInParallel) {
      // Process in batches for better performance
      const batches = [];
      for (let i = 0; i < cities.length; i += maxConcurrency) {
        batches.push(cities.slice(i, i + maxConcurrency));
      }

      for (const batch of batches) {
        const batchPromises = batch.map(async (cityMarket) => {
          try {
            // Use sample business profile - in production, this would come from user's profile
            const businessProfile = {
              businessName: "Sample Business",
              industry: "Professional Services",
              services: ["Service 1", "Service 2"],
              city: cityMarket.cityData.name,
              state: cityMarket.cityData.state,
              country: cityMarket.cityData.country,
              reviews: { rating: 4.5, count: 50 },
              metadata: {
                source: "api",
                confidence: 1.0,
                lastUpdated: new Date(),
                warnings: [],
                dataQuality: {
                  completeness: 0.9,
                  accuracy: 0.95,
                  freshness: 1.0
                },
                processingNotes: []
              }
            };

            const generator = new LocalSEOGenerator({
              businessProfile: businessProfile as any,
              targetCity: cityMarket.cityData,
              businessLocation: cityMarket.businessLocation,
              config: globalConfig,
              customizations: cityMarket.customizations
            });

            const result = await generator.generateCityPage();
            
            if (result.success) {
              successful++;
              return {
                cityName: cityMarket.cityData.name,
                success: true,
                page: result.data
              };
            } else {
              failed++;
              return {
                cityName: cityMarket.cityData.name,
                success: false,
                error: result.error
              };
            }
          } catch (error) {
            failed++;
            return {
              cityName: cityMarket.cityData.name,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      }
    } else {
      // Process sequentially
      for (const cityMarket of cities) {
        try {
          // Use sample business profile - in production, this would come from user's profile
          const businessProfile = {
            businessName: "Sample Business",
            industry: "Professional Services",
            services: ["Service 1", "Service 2"],
            city: cityMarket.cityData.name,
            state: cityMarket.cityData.state,
            country: cityMarket.cityData.country,
            reviews: { rating: 4.5, count: 50 },
            metadata: {
              source: "api",
              confidence: 1.0,
              lastUpdated: new Date(),
              warnings: [],
              dataQuality: {
                completeness: 0.9,
                accuracy: 0.95,
                freshness: 1.0
              },
              processingNotes: []
            }
          };

          const generator = new LocalSEOGenerator({
            businessProfile: businessProfile as any,
            targetCity: cityMarket.cityData,
            businessLocation: cityMarket.businessLocation,
            config: globalConfig,
            customizations: cityMarket.customizations
          });

          const result = await generator.generateCityPage();
          
          if (result.success) {
            successful++;
            results.push({
              cityName: cityMarket.cityData.name,
              success: true,
              page: result.data
            });
          } else {
            failed++;
            results.push({
              cityName: cityMarket.cityData.name,
              success: false,
              error: result.error
            });
          }
        } catch (error) {
          failed++;
          results.push({
            cityName: cityMarket.cityData.name,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    const totalTime = Date.now() - startTime;
    const generationTimes = results
      .filter(r => r.success)
      .map(() => totalTime / successful); // Approximate individual times

    const bulkResult: BulkGenerationResult = {
      totalRequested: cities.length,
      successful,
      failed,
      results,
      overallPerformance: {
        totalTime,
        averageTimePerPage: successful > 0 ? totalTime / successful : 0,
        fastestGeneration: Math.min(...generationTimes),
        slowestGeneration: Math.max(...generationTimes)
      }
    };

    // TODO: Save bulk generation results to database
    // await saveBulkGenerationResults(session.user.email, bulkResult);

    return NextResponse.json({
      success: true,
      data: bulkResult
    });

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

// GET - Retrieve city page data or list available cities
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const citySlug = searchParams.get('city');
    const action = searchParams.get('action');

    if (action === 'list-cities') {
      // Return list of available cities for generation
      const availableCities = [
        { slug: 'new-york', name: 'New York', state: 'NY' },
        { slug: 'los-angeles', name: 'Los Angeles', state: 'CA' },
        { slug: 'chicago', name: 'Chicago', state: 'IL' },
        { slug: 'houston', name: 'Houston', state: 'TX' },
        { slug: 'phoenix', name: 'Phoenix', state: 'AZ' },
        { slug: 'philadelphia', name: 'Philadelphia', state: 'PA' },
        { slug: 'san-antonio', name: 'San Antonio', state: 'TX' },
        { slug: 'san-diego', name: 'San Diego', state: 'CA' },
        { slug: 'dallas', name: 'Dallas', state: 'TX' },
        { slug: 'san-jose', name: 'San Jose', state: 'CA' }
      ];

      return NextResponse.json({
        success: true,
        data: availableCities
      });
    }

    if (citySlug) {
      // TODO: Retrieve generated city page from database
      // const cityPage = await getCityPageBySlug(citySlug);
      
      return NextResponse.json({
        success: true,
        message: `City page data for ${citySlug} would be retrieved here`
      });
    }

    return NextResponse.json({
      success: true,
      message: "Local SEO API endpoint",
      endpoints: {
        "POST /api/local-seo": "Generate single city page",
        "PUT /api/local-seo": "Bulk generate city pages",
        "GET /api/local-seo?action=list-cities": "List available cities",
        "GET /api/local-seo?city=slug": "Get specific city page data"
      }
    });

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

// DELETE - Remove city page
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const citySlug = searchParams.get('city');

    if (!citySlug) {
      return NextResponse.json(
        { success: false, error: "City slug required" },
        { status: 400 }
      );
    }

    // TODO: Delete city page from database
    // await deleteCityPage(session.user.email, citySlug);

    return NextResponse.json({
      success: true,
      message: `City page for ${citySlug} deleted successfully`
    });

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}