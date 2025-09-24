/**
 * Enhanced Business Schema Generator
 * Creates comprehensive JSON-LD structured data from extracted business information
 */

import { BusinessInfo } from './business-extractor';

export interface SchemaGeneratorOptions {
  includeReviews?: boolean;
  includeFAQ?: boolean;
  includeServices?: boolean;
  includeLocalBusiness?: boolean;
  includeOrganization?: boolean;
  includeBreadcrumbs?: boolean;
  includeWebsite?: boolean;
}

export class BusinessSchemaGenerator {
  /**
   * Generate comprehensive business schema from extracted information
   */
  generateBusinessSchema(
    businessInfo: BusinessInfo,
    options: SchemaGeneratorOptions = {}
  ): Record<string, any>[] {
    const schemas: Record<string, any>[] = [];

    const defaultOptions = {
      includeReviews: true,
      includeFAQ: true,
      includeServices: true,
      includeLocalBusiness: true,
      includeOrganization: true,
      includeBreadcrumbs: true,
      includeWebsite: true,
      ...options
    };

    // 1. LocalBusiness Schema (Primary)
    if (defaultOptions.includeLocalBusiness) {
      schemas.push(this.generateLocalBusinessSchema(businessInfo));
    }

    // 2. Organization Schema
    if (defaultOptions.includeOrganization) {
      schemas.push(this.generateOrganizationSchema(businessInfo));
    }

    // 3. Website Schema
    if (defaultOptions.includeWebsite && businessInfo.contact.website) {
      schemas.push(this.generateWebsiteSchema(businessInfo));
    }

    // 4. Services Schema
    if (defaultOptions.includeServices && businessInfo.services.length > 0) {
      schemas.push(...this.generateServicesSchema(businessInfo));
    }

    // 5. FAQ Schema
    if (defaultOptions.includeFAQ) {
      schemas.push(this.generateFAQSchema(businessInfo));
    }

    // 6. Review Schema
    if (defaultOptions.includeReviews && businessInfo.reputation) {
      schemas.push(this.generateAggregateRatingSchema(businessInfo));
    }

    // 7. Breadcrumb Schema
    if (defaultOptions.includeBreadcrumbs) {
      schemas.push(this.generateBreadcrumbSchema(businessInfo));
    }

    return schemas.filter(schema => schema !== null);
  }

  /**
   * Generate LocalBusiness schema with comprehensive business data
   */
  private generateLocalBusinessSchema(businessInfo: BusinessInfo): Record<string, any> {
    const schema: Record<string, any> = {
      '@context': 'https://schema.org',
      '@type': this.getBusinessType(businessInfo.industry),
      '@id': `${businessInfo.contact.website}#business`,
      name: businessInfo.businessName,
      image: this.generateImageUrls(businessInfo),
      url: businessInfo.contact.website,
      telephone: businessInfo.contact.phone,
      email: businessInfo.contact.email,
      priceRange: this.inferPriceRange(businessInfo.industry),
    };

    // Add address if available
    if (businessInfo.location.address) {
      schema.address = {
        '@type': 'PostalAddress',
        streetAddress: businessInfo.location.address.street,
        addressLocality: businessInfo.location.address.city,
        addressRegion: businessInfo.location.address.state,
        postalCode: businessInfo.location.address.zipCode,
        addressCountry: businessInfo.location.address.country || 'US'
      };
    }

    // Add coordinates if available
    if (businessInfo.location.coordinates) {
      schema.geo = {
        '@type': 'GeoCoordinates',
        latitude: businessInfo.location.coordinates.latitude,
        longitude: businessInfo.location.coordinates.longitude
      };
    }

    // Add business hours if available
    if (businessInfo.hours) {
      schema.openingHoursSpecification = this.formatBusinessHours(businessInfo.hours);
    }

    // Add service areas
    if (businessInfo.location.serviceArea.length > 0) {
      schema.areaServed = businessInfo.location.serviceArea.map(area => ({
        '@type': 'City',
        name: area
      }));
    }

    // Add social media profiles
    if (businessInfo.socialMedia) {
      schema.sameAs = Object.values(businessInfo.socialMedia).filter(Boolean);
    }

    // Add services/products offered
    if (businessInfo.services.length > 0) {
      schema.hasOfferCatalog = {
        '@type': 'OfferCatalog',
        name: 'Services',
        itemListElement: businessInfo.services.map((service, index) => ({
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: service
          }
        }))
      };
    }

    // Add aggregate rating if available
    if (businessInfo.reputation && businessInfo.reputation.totalReviews > 0) {
      schema.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: businessInfo.reputation.averageRating,
        reviewCount: businessInfo.reputation.totalReviews,
        bestRating: 5,
        worstRating: 1
      };
    }

    // Add founding date if available
    if (businessInfo.attributes.yearEstablished) {
      schema.foundingDate = businessInfo.attributes.yearEstablished.toString();
    }

    // Add number of employees if available
    if (businessInfo.attributes.employeeCount) {
      schema.numberOfEmployees = {
        '@type': 'QuantitativeValue',
        value: businessInfo.attributes.employeeCount
      };
    }

    return schema;
  }

  /**
   * Generate Organization schema
   */
  private generateOrganizationSchema(businessInfo: BusinessInfo): Record<string, any> {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': `${businessInfo.contact.website}#organization`,
      name: businessInfo.businessName,
      legalName: businessInfo.legalName || businessInfo.businessName,
      url: businessInfo.contact.website,
      logo: `${businessInfo.contact.website}/logo.png`,
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: businessInfo.contact.phone,
        email: businessInfo.contact.email,
        contactType: 'customer service',
        availableLanguage: ['English']
      }
    };

    // Add social media profiles
    if (businessInfo.socialMedia) {
      schema.sameAs = Object.values(businessInfo.socialMedia).filter(Boolean);
    }

    return schema;
  }

  /**
   * Generate Website schema
   */
  private generateWebsiteSchema(businessInfo: BusinessInfo): Record<string, any> {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${businessInfo.contact.website}#website`,
      url: businessInfo.contact.website,
      name: businessInfo.businessName,
      description: `${businessInfo.businessName} - ${businessInfo.services.join(', ')}`,
      publisher: {
        '@id': `${businessInfo.contact.website}#organization`
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${businessInfo.contact.website}/search?q={search_term_string}`
        },
        'query-input': 'required name=search_term_string'
      }
    };
  }

  /**
   * Generate Service schemas for each service offered
   */
  private generateServicesSchema(businessInfo: BusinessInfo): Record<string, any>[] {
    return businessInfo.services.map((service, index) => ({
      '@context': 'https://schema.org',
      '@type': 'Service',
      '@id': `${businessInfo.contact.website}#service-${index + 1}`,
      name: service,
      provider: {
        '@id': `${businessInfo.contact.website}#business`
      },
      areaServed: businessInfo.location.serviceArea.length > 0 
        ? businessInfo.location.serviceArea.map(area => ({
            '@type': 'City',
            name: area
          }))
        : {
            '@type': 'City',
            name: businessInfo.location.address.city
          },
      serviceType: service,
      description: `Professional ${service.toLowerCase()} services provided by ${businessInfo.businessName}`
    }));
  }

  /**
   * Generate FAQ schema with industry-specific questions
   */
  private generateFAQSchema(businessInfo: BusinessInfo): Record<string, any> {
    const faqs = this.generateIndustryFAQs(businessInfo);

    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      '@id': `${businessInfo.contact.website}#faq`,
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer
        }
      }))
    };
  }

  /**
   * Generate Aggregate Rating schema
   */
  private generateAggregateRatingSchema(businessInfo: BusinessInfo): Record<string, any> | null {
    if (!businessInfo.reputation || businessInfo.reputation.totalReviews === 0) {
      return null;
    }

    return {
      '@context': 'https://schema.org',
      '@type': 'Product', // Or Service
      name: `${businessInfo.businessName} Services`,
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: businessInfo.reputation.averageRating,
        reviewCount: businessInfo.reputation.totalReviews,
        bestRating: 5,
        worstRating: 1
      },
      brand: {
        '@type': 'Brand',
        name: businessInfo.businessName
      }
    };
  }

  /**
   * Generate Breadcrumb schema
   */
  private generateBreadcrumbSchema(businessInfo: BusinessInfo): Record<string, any> {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: businessInfo.contact.website
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: businessInfo.industry,
          item: `${businessInfo.contact.website}/${businessInfo.industry.toLowerCase().replace(/\s+/g, '-')}`
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: businessInfo.location.address.city,
          item: `${businessInfo.contact.website}/${businessInfo.location.address.city.toLowerCase().replace(/\s+/g, '-')}`
        }
      ]
    };
  }

  /**
   * Determine the most appropriate business type based on industry
   */
  private getBusinessType(industry: string): string {
    const industryMap: Record<string, string> = {
      'healthcare': 'MedicalOrganization',
      'dental': 'Dentist',
      'legal services': 'Attorney',
      'real estate': 'RealEstateAgent',
      'restaurant': 'Restaurant',
      'automotive': 'AutomotiveBusiness',
      'construction': 'GeneralContractor',
      'plumbing': 'Plumber',
      'electrical': 'Electrician',
      'hvac': 'HVACBusiness',
      'beauty': 'BeautySalon',
      'fitness': 'ExerciseGym',
      'retail': 'Store',
      'hotel': 'LodgingBusiness',
      'education': 'EducationalOrganization'
    };

    const lowerIndustry = industry.toLowerCase();
    return industryMap[lowerIndustry] || 'LocalBusiness';
  }

  /**
   * Generate industry-specific FAQ content
   */
  private generateIndustryFAQs(businessInfo: BusinessInfo): Array<{question: string, answer: string}> {
    const industryFAQs: Record<string, Array<{question: string, answer: string}>> = {
      'healthcare': [
        {
          question: 'What insurance do you accept?',
          answer: `${businessInfo.businessName} accepts most major insurance plans. Please contact us to verify your specific insurance coverage.`
        },
        {
          question: 'How do I schedule an appointment?',
          answer: `You can schedule an appointment by calling ${businessInfo.contact.phone} or visiting our website at ${businessInfo.contact.website}.`
        },
        {
          question: 'What are your office hours?',
          answer: 'Our office hours vary by day. Please check our website or call for current hours.'
        }
      ],
      'legal services': [
        {
          question: 'Do you offer free consultations?',
          answer: `${businessInfo.businessName} offers initial consultations. Contact us at ${businessInfo.contact.phone} to discuss your case.`
        },
        {
          question: 'What types of cases do you handle?',
          answer: `We specialize in ${businessInfo.services.join(', ')}. Contact us to discuss your specific legal needs.`
        },
        {
          question: 'How much do your services cost?',
          answer: 'Legal fees vary based on the complexity of your case. We offer transparent pricing and will discuss costs during your consultation.'
        }
      ],
      'real estate': [
        {
          question: 'Are you available for showings on weekends?',
          answer: `Yes, ${businessInfo.businessName} offers flexible scheduling including weekends and evenings to accommodate your schedule.`
        },
        {
          question: 'What areas do you serve?',
          answer: `We serve ${businessInfo.location.serviceArea.join(', ')} and surrounding areas.`
        },
        {
          question: 'How do you price homes for sale?',
          answer: 'We use comprehensive market analysis and local expertise to price homes competitively and accurately.'
        }
      ]
    };

    const lowerIndustry = businessInfo.industry.toLowerCase();
    return industryFAQs[lowerIndustry] || [
      {
        question: `What services does ${businessInfo.businessName} offer?`,
        answer: `We specialize in ${businessInfo.services.join(', ')}. Contact us at ${businessInfo.contact.phone} for more information.`
      },
      {
        question: 'What areas do you serve?',
        answer: `We proudly serve ${businessInfo.location.address.city}${businessInfo.location.serviceArea.length > 0 ? ' and ' + businessInfo.location.serviceArea.join(', ') : ''}.`
      },
      {
        question: 'How can I contact you?',
        answer: `You can reach us by phone at ${businessInfo.contact.phone}, email at ${businessInfo.contact.email}, or visit our website at ${businessInfo.contact.website}.`
      }
    ];
  }

  /**
   * Format business hours for schema
   */
  private formatBusinessHours(hours: NonNullable<BusinessInfo['hours']>): Array<Record<string, any>> {
    const dayMapping: Record<string, string> = {
      monday: 'Monday',
      tuesday: 'Tuesday',
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday',
      saturday: 'Saturday',
      sunday: 'Sunday'
    };

    const openingHours: Array<Record<string, any>> = [];

    Object.entries(hours).forEach(([day, timeRange]) => {
      if (timeRange && day !== 'holidayHours') {
        const dayName = dayMapping[day];
        if (dayName && timeRange.toLowerCase() !== 'closed') {
          openingHours.push({
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: dayName,
            opens: this.extractOpenTime(timeRange),
            closes: this.extractCloseTime(timeRange)
          });
        }
      }
    });

    return openingHours;
  }

  /**
   * Extract opening time from time range string
   */
  private extractOpenTime(timeRange: string): string {
    const match = timeRange.match(/(\d{1,2}):?(\d{0,2})\s*(am|pm)?/i);
    if (match) {
      let [, hour, minute = '00', period] = match;
      if (period && period.toLowerCase() === 'pm' && parseInt(hour) !== 12) {
        hour = (parseInt(hour) + 12).toString();
      } else if (period && period.toLowerCase() === 'am' && parseInt(hour) === 12) {
        hour = '00';
      }
      return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
    }
    return '09:00'; // Default
  }

  /**
   * Extract closing time from time range string
   */
  private extractCloseTime(timeRange: string): string {
    const matches = timeRange.match(/(\d{1,2}):?(\d{0,2})\s*(am|pm)?/gi);
    if (matches && matches.length >= 2) {
      const closeMatch = matches[1].match(/(\d{1,2}):?(\d{0,2})\s*(am|pm)?/i);
      if (closeMatch) {
        let [, hour, minute = '00', period] = closeMatch;
        if (period && period.toLowerCase() === 'pm' && parseInt(hour) !== 12) {
          hour = (parseInt(hour) + 12).toString();
        } else if (period && period.toLowerCase() === 'am' && parseInt(hour) === 12) {
          hour = '00';
        }
        return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
      }
    }
    return '17:00'; // Default
  }

  /**
   * Infer price range based on industry
   */
  private inferPriceRange(industry: string): string {
    const priceRanges: Record<string, string> = {
      'legal services': '$$$$',
      'healthcare': '$$$',
      'dental': '$$$',
      'real estate': '$$$',
      'automotive': '$$',
      'restaurant': '$$',
      'beauty': '$$',
      'fitness': '$',
      'retail': '$-$$'
    };

    return priceRanges[industry.toLowerCase()] || '$$';
  }

  /**
   * Generate image URLs for the business
   */
  private generateImageUrls(businessInfo: BusinessInfo): string[] {
    const baseUrl = businessInfo.contact.website;
    return [
      `${baseUrl}/images/logo.jpg`,
      `${baseUrl}/images/storefront.jpg`,
      `${baseUrl}/images/team.jpg`
    ];
  }
}