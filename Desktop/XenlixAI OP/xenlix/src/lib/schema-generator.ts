import {
  BusinessProfileForSchema,
  FAQData,
  SchemaGeneratorOptions,
  SchemaOutput,
  LocalBusiness,
  Service,
  FAQPage,
  WebSite,
  Organization,
  Address,
  ContactPoint,
  OpeningHours,
  AggregateRating,
  Review,
  BUSINESS_TYPE_MAPPINGS,
} from '@/types/schema';

export class SchemaGenerator {
  private options: SchemaGeneratorOptions;

  constructor(options: SchemaGeneratorOptions = {}) {
    this.options = {
      includeLocalBusiness: true,
      includeServices: true,
      includeFAQ: false,
      includeWebsite: true,
      includeOrganization: false,
      minifyOutput: false,
      validateSchema: true,
      ...options,
    };
  }

  /**
   * Generate comprehensive schema markup from business profile
   */
  public generateSchemas(
    businessProfile: BusinessProfileForSchema,
    faqData?: FAQData
  ): SchemaOutput {
    const schemas: SchemaOutput = {};

    if (this.options.includeLocalBusiness) {
      schemas.localBusiness = this.generateLocalBusinessSchema(businessProfile);
    }

    if (this.options.includeServices && businessProfile.services?.length) {
      schemas.services = this.generateServiceSchemas(businessProfile);
    }

    if (this.options.includeFAQ && faqData?.questions?.length) {
      schemas.faqPage = this.generateFAQSchema(faqData);
    }

    if (this.options.includeWebsite && businessProfile.contact?.website) {
      schemas.website = this.generateWebsiteSchema(businessProfile);
    }

    if (this.options.includeOrganization) {
      schemas.organization = this.generateOrganizationSchema(businessProfile);
    }

    // Generate combined output
    schemas.combined = this.generateCombinedSchema(schemas);

    return schemas;
  }

  /**
   * Generate LocalBusiness schema
   */
  private generateLocalBusinessSchema(profile: BusinessProfileForSchema): LocalBusiness {
    const businessType = this.getBusinessType(profile.industry);

    const schema: LocalBusiness = {
      '@context': 'https://schema.org',
      '@type': businessType,
      name: profile.businessName,
      description: profile.description,
      url: profile.contact?.website,
    };

    // Add contact information
    if (profile.contact?.phone) {
      schema.telephone = profile.contact.phone;
    }
    if (profile.contact?.email) {
      schema.email = profile.contact.email;
    }

    // Add address
    if (profile.address) {
      schema.address = this.generateAddressSchema(profile.address);
    }

    // Add geo coordinates
    if (profile.coordinates) {
      schema.geo = {
        '@type': 'GeoCoordinates',
        latitude: profile.coordinates.latitude,
        longitude: profile.coordinates.longitude,
      };
    }

    // Add opening hours
    if (profile.hours) {
      schema.openingHoursSpecification = this.generateOpeningHoursSchema(profile.hours);
    }

    // Add contact points
    if (profile.contact) {
      schema.contactPoint = this.generateContactPointSchema(profile.contact);
    }

    // Add social media
    if (profile.socialMedia) {
      schema.sameAs = this.extractSocialMediaUrls(profile.socialMedia);
    }

    // Add images
    if (profile.images?.length) {
      schema.image = profile.images;
    }

    // Add pricing information
    if (profile.pricing) {
      if (profile.pricing.range) {
        schema.priceRange = profile.pricing.range;
      }
      if (profile.pricing.currency) {
        schema.currenciesAccepted = profile.pricing.currency;
      }
      if (profile.pricing.accepted) {
        schema.paymentAccepted = profile.pricing.accepted;
      }
    }

    // Add rating
    if (profile.rating) {
      schema.aggregateRating = this.generateAggregateRatingSchema(profile.rating);
      if (profile.rating.reviews) {
        schema.review = this.generateReviewSchemas(profile.rating.reviews);
      }
    }

    // Add additional business info
    if (profile.foundingDate) {
      schema.foundingDate = profile.foundingDate;
    }
    if (profile.founder) {
      schema.founder = {
        '@type': 'Person',
        name: profile.founder,
      };
    }
    if (profile.employeeCount) {
      schema.numberOfEmployees = profile.employeeCount;
    }
    if (profile.slogan) {
      schema.slogan = profile.slogan;
    }

    return schema;
  }

  /**
   * Generate Service schemas
   */
  private generateServiceSchemas(profile: BusinessProfileForSchema): Service[] {
    return profile.services!.map((serviceName) => {
      const service: Service = {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: serviceName,
        description: `Professional ${serviceName.toLowerCase()} services provided by ${profile.businessName}`,
        provider: {
          '@type': 'LocalBusiness',
          name: profile.businessName,
          url: profile.contact?.website,
        },
      };

      // Add area served
      if (profile.address?.city && profile.address?.state) {
        service.areaServed = [`${profile.address.city}, ${profile.address.state}`];
      }

      // Add service type based on industry
      if (profile.industry) {
        service.serviceType = profile.industry;
        service.category = profile.industry;
      }

      // Add offers if pricing is available
      if (profile.pricing) {
        service.offers = [
          {
            '@type': 'Offer',
            description: `${serviceName} service`,
            priceCurrency: profile.pricing.currency || 'USD',
            availability: 'https://schema.org/InStock',
          },
        ];
      }

      // Add rating if available
      if (profile.rating) {
        service.aggregateRating = this.generateAggregateRatingSchema(profile.rating);
      }

      return service;
    });
  }

  /**
   * Generate FAQ schema
   */
  private generateFAQSchema(faqData: FAQData): FAQPage {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqData.questions.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    };
  }

  /**
   * Generate Website schema
   */
  private generateWebsiteSchema(profile: BusinessProfileForSchema): WebSite {
    const schema: WebSite = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: profile.businessName,
      url: profile.contact!.website!,
      description: profile.description,
    };

    // Add search action if it's an e-commerce site
    if (profile.industry === 'ecommerce' || profile.industry === 'retail') {
      schema.potentialAction = {
        '@type': 'SearchAction',
        target: `${profile.contact!.website}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      };
    }

    // Add social media
    if (profile.socialMedia) {
      schema.sameAs = this.extractSocialMediaUrls(profile.socialMedia);
    }

    return schema;
  }

  /**
   * Generate Organization schema
   */
  private generateOrganizationSchema(profile: BusinessProfileForSchema): Organization {
    const schema: Organization = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: profile.businessName,
      description: profile.description,
      url: profile.contact?.website,
    };

    // Add logo (first image if available)
    if (profile.images?.length) {
      schema.logo = profile.images[0];
      schema.image = profile.images;
    }

    // Add social media
    if (profile.socialMedia) {
      schema.sameAs = this.extractSocialMediaUrls(profile.socialMedia);
    }

    // Add contact points
    if (profile.contact) {
      schema.contactPoint = this.generateContactPointSchema(profile.contact);
    }

    // Add address
    if (profile.address) {
      schema.address = this.generateAddressSchema(profile.address);
    }

    // Add founding info
    if (profile.foundingDate) {
      schema.foundingDate = profile.foundingDate;
    }
    if (profile.founder) {
      schema.founder = {
        '@type': 'Person',
        name: profile.founder,
      };
    }

    return schema;
  }

  /**
   * Helper methods
   */
  private getBusinessType(industry?: string): string {
    if (!industry) return BUSINESS_TYPE_MAPPINGS.default;

    const normalizedIndustry = industry.toLowerCase();
    return (
      BUSINESS_TYPE_MAPPINGS[normalizedIndustry] ||
      this.options.customBusinessType ||
      BUSINESS_TYPE_MAPPINGS.default
    );
  }

  private generateAddressSchema(address: BusinessProfileForSchema['address']): Address {
    return {
      '@type': 'PostalAddress',
      streetAddress: address?.street,
      addressLocality: address?.city,
      addressRegion: address?.state,
      postalCode: address?.zipCode,
      addressCountry: address?.country || 'US',
    };
  }

  private generateContactPointSchema(contact: BusinessProfileForSchema['contact']): ContactPoint[] {
    const contactPoints: ContactPoint[] = [];

    if (contact?.phone) {
      contactPoints.push({
        '@type': 'ContactPoint',
        telephone: contact.phone,
        contactType: 'customer service',
      });
    }

    if (contact?.email) {
      contactPoints.push({
        '@type': 'ContactPoint',
        email: contact.email,
        contactType: 'customer service',
      });
    }

    return contactPoints;
  }

  private generateOpeningHoursSchema(hours: BusinessProfileForSchema['hours']): OpeningHours[] {
    const openingHours: OpeningHours[] = [];
    const daysMap: Record<string, string> = {
      monday: 'Monday',
      tuesday: 'Tuesday',
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday',
      saturday: 'Saturday',
      sunday: 'Sunday',
    };

    Object.entries(hours!).forEach(([day, times]) => {
      if (times?.open && times?.close) {
        openingHours.push({
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: [daysMap[day]],
          opens: times.open,
          closes: times.close,
        });
      }
    });

    return openingHours;
  }

  private generateAggregateRatingSchema(
    rating: BusinessProfileForSchema['rating']
  ): AggregateRating {
    return {
      '@type': 'AggregateRating',
      ratingValue: rating!.value,
      reviewCount: rating!.count,
      bestRating: 5,
      worstRating: 1,
    };
  }

  private generateReviewSchemas(
    reviews: NonNullable<BusinessProfileForSchema['rating']>['reviews']
  ): Review[] {
    return reviews!.map((review) => ({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: review.author,
      },
      reviewRating: {
        '@type': 'Rating',
        ratingValue: review.rating,
        bestRating: 5,
      },
      reviewBody: review.text,
      datePublished: review.date,
    }));
  }

  private extractSocialMediaUrls(socialMedia: BusinessProfileForSchema['socialMedia']): string[] {
    const urls: string[] = [];
    if (socialMedia?.facebook) urls.push(socialMedia.facebook);
    if (socialMedia?.twitter) urls.push(socialMedia.twitter);
    if (socialMedia?.instagram) urls.push(socialMedia.instagram);
    if (socialMedia?.linkedin) urls.push(socialMedia.linkedin);
    if (socialMedia?.youtube) urls.push(socialMedia.youtube);
    return urls;
  }

  private generateCombinedSchema(schemas: SchemaOutput): string {
    const allSchemas: any[] = [];

    if (schemas.localBusiness) allSchemas.push(schemas.localBusiness);
    if (schemas.services) allSchemas.push(...schemas.services);
    if (schemas.faqPage) allSchemas.push(schemas.faqPage);
    if (schemas.website) allSchemas.push(schemas.website);
    if (schemas.organization) allSchemas.push(schemas.organization);

    const scriptContent =
      allSchemas.length === 1
        ? JSON.stringify(allSchemas[0], null, this.options.minifyOutput ? 0 : 2)
        : JSON.stringify(allSchemas, null, this.options.minifyOutput ? 0 : 2);

    return `<script type="application/ld+json">
${scriptContent}
</script>`;
  }

  /**
   * Validate generated schema (basic validation)
   */
  public validateSchema(schema: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!schema['@context']) {
      errors.push('Missing @context property');
    }

    if (!schema['@type']) {
      errors.push('Missing @type property');
    }

    if (schema['@type'] === 'LocalBusiness' && !schema.name) {
      errors.push('LocalBusiness schema requires a name property');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate schema for specific use cases
   */
  public generateRestaurantSchema(profile: BusinessProfileForSchema): LocalBusiness {
    const schema = this.generateLocalBusinessSchema(profile);
    schema['@type'] = 'Restaurant';

    // Add restaurant-specific properties
    if (profile.pricing?.range) {
      schema.priceRange = profile.pricing.range;
    }

    return schema;
  }

  public generateAutoRepairSchema(profile: BusinessProfileForSchema): LocalBusiness {
    const schema = this.generateLocalBusinessSchema(profile);
    schema['@type'] = 'AutoRepair';
    return schema;
  }

  public generateMedicalSchema(profile: BusinessProfileForSchema): LocalBusiness {
    const schema = this.generateLocalBusinessSchema(profile);
    schema['@type'] = 'MedicalOrganization';
    return schema;
  }
}
