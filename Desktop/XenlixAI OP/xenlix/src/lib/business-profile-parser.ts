// Business Profile Parser
// Normalizes imported JSON business profiles into a standard structure for optimization tasks

import { z } from 'zod';

// Standard normalized business profile structure
export interface NormalizedBusinessProfile {
  // Core business information
  businessName: string;
  industry: string;
  services: string[];
  city: string;
  state?: string;
  country?: string;

  // Contact & web presence
  phone?: string;
  email?: string;
  website?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
  };

  // Reviews & reputation
  reviews: {
    rating: number;
    count: number;
    platforms?: {
      google?: { rating: number; count: number };
      yelp?: { rating: number; count: number };
      facebook?: { rating: number; count: number };
      [key: string]: { rating: number; count: number } | undefined;
    };
  };

  // Business attributes
  attributes: {
    yearEstablished?: number;
    employeeCount?: number;
    businessHours?: {
      monday?: string;
      tuesday?: string;
      wednesday?: string;
      thursday?: string;
      friday?: string;
      saturday?: string;
      sunday?: string;
    };
    servicesOffered?: string[];
    specialties?: string[];
    certifications?: string[];
    paymentMethods?: string[];
    languages?: string[];
    features?: string[];
  };

  // Location details
  location: {
    address?: {
      street?: string;
      city: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
    serviceArea?: string[];
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };

  // SEO & optimization data
  seo: {
    primaryKeywords: string[];
    secondaryKeywords: string[];
    targetAudience: string[];
    competitiveAdvantages: string[];
    uniqueSellingPropositions: string[];
  };

  // Parsed metadata
  metadata: {
    source: string;
    parsedAt: Date;
    confidence: number; // 0-1 score of parsing confidence
    warnings: string[];
    lastUpdated?: Date;
    dataQuality?: {
      completeness: number;
      accuracy: number;
      freshness: number;
    };
    processingNotes?: string[];
  };
}

// Validation schemas for common import formats
const GoogleMyBusinessSchema = z.object({
  name: z.string(),
  businessStatus: z.string().optional(),
  categories: z.array(z.string()).optional(),
  phoneNumber: z.string().optional(),
  websiteUri: z.string().optional(),
  regularHours: z
    .object({
      periods: z
        .array(
          z.object({
            openDay: z.string(),
            openTime: z.string(),
            closeDay: z.string(),
            closeTime: z.string(),
          })
        )
        .optional(),
    })
    .optional(),
  location: z
    .object({
      address: z
        .object({
          addressLines: z.array(z.string()).optional(),
          locality: z.string().optional(),
          administrativeArea: z.string().optional(),
          postalCode: z.string().optional(),
          regionCode: z.string().optional(),
        })
        .optional(),
      latlng: z
        .object({
          latitude: z.number(),
          longitude: z.number(),
        })
        .optional(),
    })
    .optional(),
  reviews: z
    .array(
      z.object({
        reviewId: z.string(),
        reviewer: z.object({
          displayName: z.string(),
        }),
        starRating: z.string(),
        comment: z.string(),
      })
    )
    .optional(),
});

const YelpBusinessSchema = z.object({
  id: z.string(),
  name: z.string(),
  image_url: z.string().optional(),
  is_closed: z.boolean().optional(),
  url: z.string().optional(),
  review_count: z.number().optional(),
  categories: z
    .array(
      z.object({
        alias: z.string(),
        title: z.string(),
      })
    )
    .optional(),
  rating: z.number().optional(),
  coordinates: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
    })
    .optional(),
  transactions: z.array(z.string()).optional(),
  location: z
    .object({
      address1: z.string().optional(),
      address2: z.string().optional(),
      address3: z.string().optional(),
      city: z.string().optional(),
      zip_code: z.string().optional(),
      country: z.string().optional(),
      state: z.string().optional(),
      display_address: z.array(z.string()).optional(),
    })
    .optional(),
  phone: z.string().optional(),
  display_phone: z.string().optional(),
  distance: z.number().optional(),
  business_hours: z
    .array(
      z.object({
        open: z.array(
          z.object({
            is_overnight: z.boolean(),
            start: z.string(),
            end: z.string(),
            day: z.number(),
          })
        ),
        hours_type: z.string(),
        is_open_now: z.boolean(),
      })
    )
    .optional(),
});

const FacebookBusinessSchema = z.object({
  id: z.string(),
  name: z.string(),
  about: z.string().optional(),
  category: z.string().optional(),
  category_list: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
      })
    )
    .optional(),
  location: z
    .object({
      city: z.string().optional(),
      country: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      state: z.string().optional(),
      street: z.string().optional(),
      zip: z.string().optional(),
    })
    .optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  hours: z.record(z.string(), z.string()).optional(),
  rating_count: z.number().optional(),
  overall_star_rating: z.number().optional(),
  emails: z.array(z.string()).optional(),
});

const GenericBusinessSchema = z.object({
  // Flexible schema for custom formats
  businessName: z.string().optional(),
  name: z.string().optional(),
  companyName: z.string().optional(),

  industry: z.string().optional(),
  category: z.string().optional(),
  businessType: z.string().optional(),

  services: z.array(z.string()).optional(),
  servicesList: z.array(z.string()).optional(),
  offerings: z.array(z.string()).optional(),

  city: z.string().optional(),
  location: z.string().optional(),
  address: z
    .union([
      z.string(),
      z.object({
        street: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        country: z.string().optional(),
      }),
    ])
    .optional(),

  phone: z.string().optional(),
  phoneNumber: z.string().optional(),
  email: z.string().optional(),
  website: z.string().optional(),

  reviews: z
    .union([
      z.object({
        rating: z.number(),
        count: z.number(),
      }),
      z.array(
        z.object({
          rating: z.number(),
          comment: z.string().optional(),
          author: z.string().optional(),
          platform: z.string().optional(),
        })
      ),
    ])
    .optional(),

  attributes: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export class BusinessProfileParser {
  private warnings: string[] = [];

  /**
   * Parse and normalize a business profile from various JSON formats
   */
  public parseProfile(jsonData: unknown, source: string = 'unknown'): NormalizedBusinessProfile {
    this.warnings = [];

    // Try to determine the source format and parse accordingly
    const profile = this.determineFormatAndParse(jsonData, source);

    // Validate the final profile
    this.validateProfile(profile);

    return profile;
  }

  private determineFormatAndParse(data: unknown, source: string): NormalizedBusinessProfile {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid JSON data provided');
    }

    const dataObj = data as Record<string, unknown>;

    // Google My Business format detection
    if ('businessStatus' in dataObj || 'regularHours' in dataObj || 'location' in dataObj) {
      return this.parseGoogleMyBusiness(dataObj, source);
    }

    // Yelp format detection
    if ('review_count' in dataObj && 'categories' in dataObj && 'coordinates' in dataObj) {
      return this.parseYelpBusiness(dataObj, source);
    }

    // Facebook format detection
    if (
      'overall_star_rating' in dataObj &&
      'rating_count' in dataObj &&
      'category_list' in dataObj
    ) {
      return this.parseFacebookBusiness(dataObj, source);
    }

    // Try generic format
    return this.parseGenericBusiness(dataObj, source);
  }

  private parseGoogleMyBusiness(
    data: Record<string, unknown>,
    source: string
  ): NormalizedBusinessProfile {
    const parsed = GoogleMyBusinessSchema.safeParse(data);
    if (!parsed.success) {
      this.warnings.push(`Google My Business parsing warnings: ${parsed.error.message}`);
    }

    const gmb = parsed.success ? parsed.data : (data as any);

    // Extract business hours
    const businessHours: Record<string, string> = {};
    if (gmb.regularHours?.periods) {
      const dayMap: Record<string, string> = {
        MONDAY: 'monday',
        TUESDAY: 'tuesday',
        WEDNESDAY: 'wednesday',
        THURSDAY: 'thursday',
        FRIDAY: 'friday',
        SATURDAY: 'saturday',
        SUNDAY: 'sunday',
      };

      gmb.regularHours.periods.forEach((period: any) => {
        const day = dayMap[period.openDay];
        if (day) {
          businessHours[day] = `${period.openTime} - ${period.closeTime}`;
        }
      });
    }

    // Calculate review statistics
    const reviews = gmb.reviews || [];
    const totalReviews = reviews.length;
    const avgRating =
      totalReviews > 0
        ? reviews.reduce((sum: number, review: any) => sum + parseInt(review.starRating), 0) /
          totalReviews
        : 0;

    return {
      businessName: gmb.name || '',
      industry: gmb.categories?.[0] || '',
      services: gmb.categories || [],
      city: gmb.location?.address?.locality || '',
      state: gmb.location?.address?.administrativeArea,
      country: gmb.location?.address?.regionCode,

      phone: gmb.phoneNumber,
      website: gmb.websiteUri,

      reviews: {
        rating: avgRating,
        count: totalReviews,
        platforms: {
          google: { rating: avgRating, count: totalReviews },
        },
      },

      attributes: {
        businessHours: Object.keys(businessHours).length > 0 ? businessHours : undefined,
        servicesOffered: gmb.categories,
      },

      location: {
        address: gmb.location?.address
          ? {
              street: gmb.location.address.addressLines?.join(', '),
              city: gmb.location.address.locality || '',
              state: gmb.location.address.administrativeArea,
              zipCode: gmb.location.address.postalCode,
              country: gmb.location.address.regionCode,
            }
          : {
              city: '',
            },
        coordinates: gmb.location?.latlng
          ? {
              latitude: gmb.location.latlng.latitude,
              longitude: gmb.location.latlng.longitude,
            }
          : undefined,
      },

      seo: {
        primaryKeywords: this.generateKeywords(
          gmb.name,
          gmb.categories?.[0],
          gmb.location?.address?.locality
        ),
        secondaryKeywords: gmb.categories || [],
        targetAudience: [],
        competitiveAdvantages: [],
        uniqueSellingPropositions: [],
      },

      metadata: {
        source: `google-my-business:${source}`,
        parsedAt: new Date(),
        confidence: parsed.success ? 0.95 : 0.7,
        warnings: this.warnings,
      },
    };
  }

  private parseYelpBusiness(
    data: Record<string, unknown>,
    source: string
  ): NormalizedBusinessProfile {
    const parsed = YelpBusinessSchema.safeParse(data);
    if (!parsed.success) {
      this.warnings.push(`Yelp parsing warnings: ${parsed.error.message}`);
    }

    const yelp = parsed.success ? parsed.data : (data as any);

    // Extract business hours
    const businessHours: Record<string, string> = {};
    if (yelp.business_hours?.[0]?.open) {
      const dayNames = [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
      ];
      yelp.business_hours[0].open.forEach((hours: any) => {
        const dayName = dayNames[hours.day];
        if (dayName) {
          businessHours[dayName] = `${hours.start} - ${hours.end}`;
        }
      });
    }

    return {
      businessName: yelp.name || '',
      industry: yelp.categories?.[0]?.title || '',
      services: yelp.categories?.map((cat: any) => cat.title) || [],
      city: yelp.location?.city || '',
      state: yelp.location?.state,
      country: yelp.location?.country,

      phone: yelp.phone || yelp.display_phone,
      website: yelp.url,

      reviews: {
        rating: yelp.rating || 0,
        count: yelp.review_count || 0,
        platforms: {
          yelp: { rating: yelp.rating || 0, count: yelp.review_count || 0 },
        },
      },

      attributes: {
        businessHours: Object.keys(businessHours).length > 0 ? businessHours : undefined,
        servicesOffered: yelp.categories?.map((cat: any) => cat.title),
        paymentMethods: yelp.transactions,
      },

      location: {
        address: {
          street: [yelp.location?.address1, yelp.location?.address2, yelp.location?.address3]
            .filter(Boolean)
            .join(', '),
          city: yelp.location?.city || '',
          state: yelp.location?.state,
          zipCode: yelp.location?.zip_code,
          country: yelp.location?.country,
        },
        coordinates: yelp.coordinates
          ? {
              latitude: yelp.coordinates.latitude,
              longitude: yelp.coordinates.longitude,
            }
          : undefined,
      },

      seo: {
        primaryKeywords: this.generateKeywords(
          yelp.name,
          yelp.categories?.[0]?.title,
          yelp.location?.city
        ),
        secondaryKeywords: yelp.categories?.map((cat: any) => cat.title) || [],
        targetAudience: [],
        competitiveAdvantages: [],
        uniqueSellingPropositions: [],
      },

      metadata: {
        source: `yelp:${source}`,
        parsedAt: new Date(),
        confidence: parsed.success ? 0.95 : 0.7,
        warnings: this.warnings,
      },
    };
  }

  private parseFacebookBusiness(
    data: Record<string, unknown>,
    source: string
  ): NormalizedBusinessProfile {
    const parsed = FacebookBusinessSchema.safeParse(data);
    if (!parsed.success) {
      this.warnings.push(`Facebook parsing warnings: ${parsed.error.message}`);
    }

    const fb = parsed.success ? parsed.data : (data as any);

    // Convert Facebook hours format
    const businessHours: Record<string, string> = {};
    if (fb.hours) {
      Object.entries(fb.hours).forEach(([day, hours]) => {
        businessHours[day.toLowerCase()] = hours as string;
      });
    }

    return {
      businessName: fb.name || '',
      industry: fb.category || fb.category_list?.[0]?.name || '',
      services: fb.category_list?.map((cat: any) => cat.name) || [fb.category].filter(Boolean),
      city: fb.location?.city || '',
      state: fb.location?.state,
      country: fb.location?.country,

      phone: fb.phone,
      email: fb.emails?.[0],
      website: fb.website,
      socialMedia: {
        facebook: `https://facebook.com/${fb.id}`,
      },

      reviews: {
        rating: fb.overall_star_rating || 0,
        count: fb.rating_count || 0,
        platforms: {
          facebook: { rating: fb.overall_star_rating || 0, count: fb.rating_count || 0 },
        },
      },

      attributes: {
        businessHours: Object.keys(businessHours).length > 0 ? businessHours : undefined,
        servicesOffered: fb.category_list?.map((cat: any) => cat.name),
      },

      location: {
        address: {
          street: fb.location?.street,
          city: fb.location?.city || '',
          state: fb.location?.state,
          zipCode: fb.location?.zip,
          country: fb.location?.country,
        },
        coordinates:
          fb.location?.latitude && fb.location?.longitude
            ? {
                latitude: fb.location.latitude,
                longitude: fb.location.longitude,
              }
            : undefined,
      },

      seo: {
        primaryKeywords: this.generateKeywords(fb.name, fb.category, fb.location?.city),
        secondaryKeywords: fb.category_list?.map((cat: any) => cat.name) || [],
        targetAudience: [],
        competitiveAdvantages: [],
        uniqueSellingPropositions: [],
      },

      metadata: {
        source: `facebook:${source}`,
        parsedAt: new Date(),
        confidence: parsed.success ? 0.9 : 0.6,
        warnings: this.warnings,
      },
    };
  }

  private parseGenericBusiness(
    data: Record<string, unknown>,
    source: string
  ): NormalizedBusinessProfile {
    const parsed = GenericBusinessSchema.safeParse(data);
    if (!parsed.success) {
      this.warnings.push(`Generic parsing warnings: ${parsed.error.message}`);
    }

    const business = parsed.success ? parsed.data : (data as any);

    // Extract business name from various possible fields
    const businessName = business.businessName || business.name || business.companyName || '';

    // Extract industry/category
    const industry = business.industry || business.category || business.businessType || '';

    // Extract services
    const services = business.services || business.servicesList || business.offerings || [];

    // Extract location
    let city = '';
    let state: string | undefined;
    let country: string | undefined;
    let address: any = {};

    if (typeof business.address === 'string') {
      // Try to parse address string
      const addressParts = business.address.split(',').map((part: string) => part.trim());
      city = addressParts[addressParts.length - 2] || business.city || business.location || '';
      state = addressParts[addressParts.length - 1];
      address = {
        street: addressParts.slice(0, -2).join(', '),
        city,
        state,
      };
    } else if (business.address && typeof business.address === 'object') {
      address = business.address;
      city = (business.address as any).city || business.city || business.location || '';
      state = (business.address as any).state;
      country = (business.address as any).country;
    } else {
      city = business.city || business.location || '';
    }

    // Process reviews
    let reviewData = { rating: 0, count: 0 };
    if (business.reviews) {
      if (Array.isArray(business.reviews)) {
        // Calculate average from review array
        const reviews = business.reviews as any[];
        reviewData.count = reviews.length;
        reviewData.rating =
          reviews.length > 0
            ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length
            : 0;
      } else if (typeof business.reviews === 'object' && 'rating' in business.reviews) {
        reviewData = business.reviews as any;
      }
    }

    return {
      businessName,
      industry,
      services,
      city,
      state,
      country,

      phone: business.phone || business.phoneNumber,
      email: business.email,
      website: business.website,

      reviews: {
        rating: reviewData.rating,
        count: reviewData.count,
      },

      attributes: {
        ...business.attributes,
        servicesOffered: services.length > 0 ? services : undefined,
      },

      location: {
        address: {
          ...address,
          city,
        },
      },

      seo: {
        primaryKeywords: this.generateKeywords(businessName, industry, city),
        secondaryKeywords: services,
        targetAudience: [],
        competitiveAdvantages: [],
        uniqueSellingPropositions: [],
      },

      metadata: {
        source: `generic:${source}`,
        parsedAt: new Date(),
        confidence: parsed.success ? 0.8 : 0.5,
        warnings: this.warnings,
      },
    };
  }

  private generateKeywords(businessName?: string, industry?: string, city?: string): string[] {
    const keywords: string[] = [];

    if (businessName) {
      keywords.push(businessName.toLowerCase());
    }

    if (industry && city) {
      keywords.push(`${industry.toLowerCase()} ${city.toLowerCase()}`);
      keywords.push(`${industry.toLowerCase()} in ${city.toLowerCase()}`);
      keywords.push(`${city.toLowerCase()} ${industry.toLowerCase()}`);
    }

    if (industry) {
      keywords.push(industry.toLowerCase());
      keywords.push(`${industry.toLowerCase()} services`);
      keywords.push(`best ${industry.toLowerCase()}`);
    }

    if (city) {
      keywords.push(`${city.toLowerCase()} business`);
      keywords.push(`near ${city.toLowerCase()}`);
    }

    return [...new Set(keywords)]; // Remove duplicates
  }

  private validateProfile(profile: NormalizedBusinessProfile): void {
    if (!profile.businessName) {
      this.warnings.push('Missing business name');
    }

    if (!profile.city) {
      this.warnings.push('Missing city information');
    }

    if (!profile.industry) {
      this.warnings.push('Missing industry information');
    }

    if (profile.services.length === 0) {
      this.warnings.push('No services found');
    }

    if (profile.reviews.rating < 0 || profile.reviews.rating > 5) {
      this.warnings.push('Invalid review rating detected');
      profile.reviews.rating = Math.max(0, Math.min(5, profile.reviews.rating));
    }

    if (profile.reviews.count < 0) {
      this.warnings.push('Invalid review count detected');
      profile.reviews.count = Math.max(0, profile.reviews.count);
    }

    // Update metadata with final warnings
    profile.metadata.warnings = this.warnings;
  }

  /**
   * Convert normalized profile to CustomerProfile format for existing systems
   */
  public toCustomerProfile(
    normalized: NormalizedBusinessProfile
  ): import('@/types/ads').CustomerProfile {
    return {
      businessName: normalized.businessName,
      industry: normalized.industry,
      targetAudience: normalized.seo.targetAudience.join(', ') || 'General public',
      currentWebsite: normalized.website,
      services: normalized.services,
      city: normalized.city,
      reviews: {
        rating: normalized.reviews.rating,
        count: normalized.reviews.count,
      },
      urls: {
        website: normalized.website,
      },
    };
  }

  /**
   * Generate optimization recommendations based on parsed profile
   */
  public generateOptimizationRecommendations(profile: NormalizedBusinessProfile): {
    seo: string[];
    content: string[];
    reviews: string[];
    local: string[];
    priority: 'high' | 'medium' | 'low';
  } {
    const recommendations = {
      seo: [] as string[],
      content: [] as string[],
      reviews: [] as string[],
      local: [] as string[],
      priority: 'medium' as 'high' | 'medium' | 'low',
    };

    // SEO recommendations
    if (profile.seo.primaryKeywords.length < 5) {
      recommendations.seo.push('Expand primary keyword list for better search coverage');
    }

    if (!profile.website) {
      recommendations.seo.push('Add website URL for better online presence');
      recommendations.priority = 'high';
    }

    // Content recommendations
    if (profile.services.length < 3) {
      recommendations.content.push('Expand service offerings descriptions');
    }

    if (!profile.attributes.specialties || profile.attributes.specialties.length === 0) {
      recommendations.content.push('Define business specialties and unique selling points');
    }

    // Review recommendations
    if (profile.reviews.rating < 4.0) {
      recommendations.reviews.push('Focus on improving customer satisfaction and review scores');
      recommendations.priority = 'high';
    }

    if (profile.reviews.count < 20) {
      recommendations.reviews.push(
        'Implement review collection strategy to increase review volume'
      );
    }

    // Local SEO recommendations
    if (!profile.location.address?.street) {
      recommendations.local.push('Add complete address information for local SEO');
    }

    if (!profile.attributes.businessHours) {
      recommendations.local.push('Add business hours information');
    }

    if (!profile.phone) {
      recommendations.local.push('Add phone number for local business verification');
    }

    return recommendations;
  }
}

// Utility functions for common operations
export function parseBusinessProfileFromJSON(
  jsonData: unknown,
  source?: string
): NormalizedBusinessProfile {
  const parser = new BusinessProfileParser();
  return parser.parseProfile(jsonData, source);
}

export function validateBusinessProfile(profile: unknown): profile is NormalizedBusinessProfile {
  try {
    if (!profile || typeof profile !== 'object') return false;
    const p = profile as any;
    return !!(
      p.businessName &&
      p.industry &&
      p.city &&
      p.reviews &&
      p.location &&
      p.seo &&
      p.metadata
    );
  } catch {
    return false;
  }
}

export function mergeBusinessProfiles(
  primary: NormalizedBusinessProfile,
  secondary: NormalizedBusinessProfile
): NormalizedBusinessProfile {
  return {
    ...primary,
    // Merge services
    services: [...new Set([...primary.services, ...secondary.services])],

    // Take best contact info
    phone: primary.phone || secondary.phone,
    email: primary.email || secondary.email,
    website: primary.website || secondary.website,

    // Merge social media
    socialMedia: {
      ...secondary.socialMedia,
      ...primary.socialMedia,
    },

    // Combine reviews
    reviews: {
      rating:
        primary.reviews.count > secondary.reviews.count
          ? primary.reviews.rating
          : secondary.reviews.rating,
      count: primary.reviews.count + secondary.reviews.count,
      platforms: {
        ...secondary.reviews.platforms,
        ...primary.reviews.platforms,
      },
    },

    // Merge attributes
    attributes: {
      ...secondary.attributes,
      ...primary.attributes,
      servicesOffered: [
        ...new Set([
          ...(primary.attributes.servicesOffered || []),
          ...(secondary.attributes.servicesOffered || []),
        ]),
      ],
      specialties: [
        ...new Set([
          ...(primary.attributes.specialties || []),
          ...(secondary.attributes.specialties || []),
        ]),
      ],
    },

    // Merge SEO data
    seo: {
      primaryKeywords: [
        ...new Set([...primary.seo.primaryKeywords, ...secondary.seo.primaryKeywords]),
      ],
      secondaryKeywords: [
        ...new Set([...primary.seo.secondaryKeywords, ...secondary.seo.secondaryKeywords]),
      ],
      targetAudience: [
        ...new Set([...primary.seo.targetAudience, ...secondary.seo.targetAudience]),
      ],
      competitiveAdvantages: [
        ...new Set([...primary.seo.competitiveAdvantages, ...secondary.seo.competitiveAdvantages]),
      ],
      uniqueSellingPropositions: [
        ...new Set([
          ...primary.seo.uniqueSellingPropositions,
          ...secondary.seo.uniqueSellingPropositions,
        ]),
      ],
    },

    // Update metadata
    metadata: {
      ...primary.metadata,
      source: `merged:${primary.metadata.source}+${secondary.metadata.source}`,
      confidence: (primary.metadata.confidence + secondary.metadata.confidence) / 2,
      warnings: [...primary.metadata.warnings, ...secondary.metadata.warnings],
    },
  };
}
