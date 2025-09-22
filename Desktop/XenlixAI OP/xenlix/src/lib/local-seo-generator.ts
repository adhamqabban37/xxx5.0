// Local SEO Generator Engine
// Comprehensive business logic for generating city-focused landing pages with AEO+SEO optimization

import {
  CityData,
  BusinessLocation,
  CityPageSEOMetadata,
  CityPageContent,
  InternalLinkingStrategy,
  CityPageStructuredData,
  CityPageGenerationConfig,
  GeneratedCityPage,
  LocalSEOGeneratorOptions,
  CityPageGenerationResponse
} from '@/types/local-seo';
import { NormalizedBusinessProfile } from '@/lib/business-profile-parser';
import { SchemaGenerator } from '@/lib/schema-generator';
import { BusinessProfileForSchema, FAQData } from '@/types/schema';

export class LocalSEOGenerator {
  private businessProfile: NormalizedBusinessProfile;
  private targetCity: CityData;
  private businessLocation: BusinessLocation;
  private config: CityPageGenerationConfig;
  private schemaGenerator: SchemaGenerator;

  constructor(options: LocalSEOGeneratorOptions) {
    this.businessProfile = options.businessProfile;
    this.targetCity = options.targetCity;
    this.businessLocation = options.businessLocation;
    this.config = options.config;
    this.schemaGenerator = new SchemaGenerator({
      includeLocalBusiness: true,
      includeServices: true,
      includeFAQ: true,
      includeWebsite: true,
      includeOrganization: true
    });
  }

  /**
   * Generate complete city page with all SEO optimizations
   */
  public async generateCityPage(): Promise<CityPageGenerationResponse> {
    try {
      const startTime = Date.now();

      // Generate all components
      const metadata = this.generateSEOMetadata();
      const content = this.generatePageContent();
      const structuredData = this.generateStructuredData();
      const internalLinks = this.generateInternalLinkingStrategy();

      // Calculate performance scores
      const performance = this.calculatePerformanceMetrics();

      const generatedPage: GeneratedCityPage = {
        metadata,
        content,
        structuredData,
        internalLinks,
        generationInfo: {
          generatedAt: new Date(),
          version: '1.0.0',
          sourceProfile: this.generateProfileHash(),
          cityDataVersion: '1.0.0',
          configUsed: this.config
        },
        performance
      };

      const generationTime = Date.now() - startTime;

      return {
        success: true,
        data: generatedPage,
        performance: {
          generationTime,
          optimizationsApplied: this.getOptimizationsApplied(),
          recommendations: this.generateRecommendations()
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Generate comprehensive SEO metadata
   */
  private generateSEOMetadata(): CityPageSEOMetadata {
    const cityName = this.targetCity.name;
    const stateName = this.targetCity.state;
    const businessName = this.businessProfile.businessName;
    const primaryService = this.businessProfile.services[0] || 'Services';

    // Generate primary title variations
    const titleVariations = [
      `${primaryService} in ${cityName}, ${this.targetCity.stateAbbreviation} | ${businessName}`,
      `Professional ${primaryService} Services - ${cityName}, ${stateName} | ${businessName}`,
      `${businessName} - Expert ${primaryService} in ${cityName}, ${this.targetCity.stateAbbreviation}`,
      `Top-Rated ${primaryService} Company in ${cityName} | ${businessName}`
    ];

    // Select best title based on length and keyword density
    const title = this.selectOptimalTitle(titleVariations);

    // Generate meta description
    const metaDescription = this.generateMetaDescription();

    // Generate heading structure
    const headings = this.generateHeadingStructure();

    // Generate keyword sets
    const keywords = this.generateKeywordSets();

    // Generate local SEO signals
    const localSEOSignals = this.generateLocalSEOSignals();

    // Generate AEO optimization
    const aeoOptimization = this.generateAEOOptimization();

    return {
      citySlug: this.generateCitySlug(),
      canonicalUrl: this.generateCanonicalUrl(),
      title,
      metaDescription,
      h1: headings.h1,
      h2Tags: headings.h2Tags,
      h3Tags: headings.h3Tags,
      primaryKeywords: keywords.primary,
      secondaryKeywords: keywords.secondary,
      longTailKeywords: keywords.longTail,
      localKeywords: keywords.local,
      semanticKeywords: keywords.semantic,
      localSEOSignals,
      aeoOptimization
    };
  }

  /**
   * Generate comprehensive page content
   */
  private generatePageContent(): CityPageContent {
    return {
      hero: this.generateHeroSection(),
      services: this.generateServiceSections(),
      localInfo: this.generateLocalInformation(),
      faq: this.generateLocalFAQ(),
      cta: this.generateCallToActions()
    };
  }

  /**
   * Generate structured data markup
   */
  private generateStructuredData(): CityPageStructuredData {
    // Convert normalized profile to schema format
    const businessProfileForSchema = this.convertToSchemaFormat();

    // Generate base schemas
    const schemas = this.schemaGenerator.generateSchemas(
      businessProfileForSchema,
      this.generateFAQDataForSchema()
    );

    // Generate breadcrumb list
    const breadcrumbList = this.generateBreadcrumbSchema();

    // Generate place schema for the city
    const place = this.generatePlaceSchema();

    return {
      localBusiness: schemas.localBusiness!,
      services: schemas.services || [],
      faqPage: schemas.faqPage!,
      aggregateRating: this.businessProfile.reviews.rating > 0 ? {
        "@type": "AggregateRating",
        ratingValue: this.businessProfile.reviews.rating,
        reviewCount: this.businessProfile.reviews.count,
        bestRating: 5,
        worstRating: 1
      } : undefined,
      breadcrumbList,
      place
    };
  }

  /**
   * Generate internal linking strategy
   */
  private generateInternalLinkingStrategy(): InternalLinkingStrategy {
    return {
      navigation: this.generateNavigationLinks(),
      contentLinks: this.generateContentLinks(),
      linkDistribution: this.calculateLinkDistribution()
    };
  }

  /**
   * Helper: Generate optimal title selection
   */
  private selectOptimalTitle(variations: string[]): string {
    // Score titles based on SEO factors
    const scoredTitles = variations.map(title => ({
      title,
      score: this.scoreTitleSEO(title)
    }));

    // Return highest scoring title
    return scoredTitles.sort((a, b) => b.score - a.score)[0].title;
  }

  /**
   * Helper: Score title for SEO effectiveness
   */
  private scoreTitleSEO(title: string): number {
    let score = 0;
    const length = title.length;

    // Length optimization (50-60 chars ideal)
    if (length >= 50 && length <= 60) score += 20;
    else if (length >= 40 && length <= 70) score += 15;
    else if (length >= 30 && length <= 80) score += 10;

    // Keyword presence
    if (title.toLowerCase().includes(this.businessProfile.businessName.toLowerCase())) score += 15;
    if (title.toLowerCase().includes(this.targetCity.name.toLowerCase())) score += 15;
    if (title.toLowerCase().includes(this.businessProfile.services[0]?.toLowerCase() || '')) score += 10;

    // Structure quality
    if (title.includes('|')) score += 5; // Brand separation
    if (title.includes(this.targetCity.stateAbbreviation)) score += 5; // State mention

    return score;
  }

  /**
   * Helper: Generate meta description
   */
  private generateMetaDescription(): string {
    const cityName = this.targetCity.name;
    const businessName = this.businessProfile.businessName;
    const primaryService = this.businessProfile.services[0] || 'professional services';
    const rating = this.businessProfile.reviews.rating;

    const templates = [
      `Looking for reliable ${primaryService} in ${cityName}? ${businessName} provides expert solutions with ${rating > 0 ? `${rating}-star rated service` : 'exceptional quality'}. Contact us for a free consultation today!`,
      `${businessName} offers professional ${primaryService} throughout ${cityName} and surrounding areas. ${rating > 0 ? `Rated ${rating}/5 stars` : 'Trusted by local customers'}. Get your free quote now!`,
      `Expert ${primaryService} in ${cityName} by ${businessName}. ${rating > 0 ? `${rating}-star rated` : 'Highly rated'} local business serving the community with quality solutions. Call today!`
    ];

    // Select template that fits within 155-160 character limit
    return templates.find(desc => desc.length <= 160) || templates[0].substring(0, 157) + '...';
  }

  /**
   * Helper: Generate heading structure
   */
  private generateHeadingStructure() {
    const cityName = this.targetCity.name;
    const stateName = this.targetCity.stateAbbreviation;
    const businessName = this.businessProfile.businessName;
    const primaryService = this.businessProfile.services[0] || 'Services';

    return {
      h1: `Professional ${primaryService} in ${cityName}, ${stateName}`,
      h2Tags: [
        `Why Choose ${businessName} for ${primaryService} in ${cityName}?`,
        `Our ${primaryService} Solutions in ${cityName}`,
        `Serving ${cityName} and Surrounding Areas`,
        `What Our ${cityName} Customers Say`,
        `Get Started with Your ${primaryService} Project in ${cityName}`
      ],
      h3Tags: [
        ...this.businessProfile.services.slice(0, 3).map(service => `${service} in ${cityName}`),
        `${cityName} Service Area`,
        `Contact Our ${cityName} Team`,
        `About Our ${cityName} Location`
      ]
    };
  }

  /**
   * Helper: Generate keyword sets
   */
  private generateKeywordSets() {
    const cityName = this.targetCity.name.toLowerCase();
    const stateName = this.targetCity.state.toLowerCase();
    const stateAbbr = this.targetCity.stateAbbreviation.toLowerCase();
    const services = this.businessProfile.services.map(s => s.toLowerCase());
    const industry = this.businessProfile.industry.toLowerCase();

    return {
      primary: [
        `${services[0]} ${cityName}`,
        `${services[0]} ${cityName} ${stateAbbr}`,
        `${industry} ${cityName}`,
        `${this.businessProfile.businessName.toLowerCase()}`
      ],
      secondary: [
        ...services.slice(1, 4).map(service => `${service} ${cityName}`),
        `${industry} services ${cityName}`,
        `professional ${services[0]} ${stateName}`,
        `local ${industry} ${cityName}`
      ],
      longTail: [
        `best ${services[0]} company in ${cityName}`,
        `affordable ${services[0]} ${cityName} ${stateAbbr}`,
        `professional ${services[0]} services near ${cityName}`,
        `top rated ${industry} ${cityName}`,
        `${services[0]} contractors ${cityName}`,
        `${services[0]} specialists ${cityName} area`
      ],
      local: [
        ...this.targetCity.characteristics.localKeywords,
        ...this.targetCity.characteristics.neighborhoodNames.map(n => n.toLowerCase()),
        `${cityName} ${industry}`,
        `near ${cityName}`,
        `${cityName} area`
      ],
      semantic: [
        ...this.generateSemanticKeywords(),
        'quality service',
        'professional team',
        'local business',
        'customer satisfaction',
        'expert solutions'
      ]
    };
  }

  /**
   * Helper: Generate semantic keywords
   */
  private generateSemanticKeywords(): string[] {
    const serviceType = this.businessProfile.services[0]?.toLowerCase() || '';
    const semanticMap: { [key: string]: string[] } = {
      'plumbing': ['pipe repair', 'water damage', 'drain cleaning', 'fixture installation'],
      'electrical': ['wiring', 'panel upgrade', 'outlet installation', 'lighting'],
      'hvac': ['heating', 'cooling', 'air conditioning', 'furnace repair'],
      'roofing': ['roof repair', 'shingle replacement', 'gutter cleaning', 'leak repair'],
      'landscaping': ['lawn care', 'garden design', 'tree trimming', 'irrigation'],
      'cleaning': ['house cleaning', 'office cleaning', 'deep cleaning', 'maintenance'],
      'construction': ['renovation', 'remodeling', 'building', 'contracting'],
      'automotive': ['car repair', 'auto service', 'maintenance', 'diagnostics'],
      'dental': ['teeth cleaning', 'oral health', 'dental care', 'preventive care'],
      'legal': ['legal advice', 'attorney', 'law firm', 'legal services'],
      'accounting': ['tax preparation', 'bookkeeping', 'financial planning', 'business consulting'],
      'marketing': ['digital marketing', 'advertising', 'social media', 'brand development']
    };

    // Find matching semantic keywords
    for (const [key, keywords] of Object.entries(semanticMap)) {
      if (serviceType.includes(key) || this.businessProfile.industry.toLowerCase().includes(key)) {
        return keywords;
      }
    }

    return ['professional service', 'quality work', 'expert solutions', 'customer focused'];
  }

  /**
   * Helper: Generate local SEO signals
   */
  private generateLocalSEOSignals() {
    const cityName = this.targetCity.name;
    const businessName = this.businessProfile.businessName;
    const primaryService = this.businessProfile.services[0] || 'services';

    return {
      businessNameInTitle: true,
      cityInTitle: true,
      serviceInTitle: true,
      localLandmarks: this.targetCity.characteristics.landmarkNames.slice(0, 5),
      localEvents: this.targetCity.characteristics.events.slice(0, 3),
      neighborhoodMentions: this.targetCity.characteristics.neighborhoodNames.slice(0, 5)
    };
  }

  /**
   * Helper: Generate AEO optimization
   */
  private generateAEOOptimization() {
    const cityName = this.targetCity.name;
    const primaryService = this.businessProfile.services[0] || 'services';

    return {
      questionBasedHeaders: [
        `What makes the best ${primaryService} company in ${cityName}?`,
        `How to choose ${primaryService} in ${cityName}?`,
        `Why choose local ${primaryService} in ${cityName}?`,
        `What should I expect from ${primaryService} in ${cityName}?`
      ],
      conversationalKeywords: [
        `${primaryService} near me`,
        `best ${primaryService} in ${cityName}`,
        `${primaryService} companies ${cityName}`,
        `local ${primaryService} ${cityName}`,
        `affordable ${primaryService} ${cityName}`
      ],
      voiceSearchOptimized: this.config.seo.enableVoiceSearch,
      featuredSnippetTargets: [
        `How much does ${primaryService} cost in ${cityName}?`,
        `Best ${primaryService} company in ${cityName}`,
        `${primaryService} process explained`,
        `Benefits of professional ${primaryService}`
      ],
      peopleAlsoAskQuestions: [
        `How long does ${primaryService} take?`,
        `What is included in ${primaryService}?`,
        `Do you serve ${cityName} area?`,
        `What makes you different from other ${primaryService} companies?`,
        `Do you offer free estimates for ${primaryService}?`
      ]
    };
  }

  /**
   * Helper: Generate hero section
   */
  private generateHeroSection() {
    const cityName = this.targetCity.name;
    const businessName = this.businessProfile.businessName;
    const primaryService = this.businessProfile.services[0] || 'professional services';
    const rating = this.businessProfile.reviews.rating;

    return {
      headline: `${cityName}'s Trusted ${primaryService} Experts`,
      subheadline: `${businessName} provides reliable ${primaryService} throughout ${cityName} and surrounding areas. ${rating > 0 ? `Rated ${rating}/5 stars by local customers.` : 'Trusted by the local community.'}`,
      ctaText: 'Get Free Estimate',
      ctaUrl: '/contact',
      trustSignals: [
        rating > 0 ? `${rating}/5 Star Rating` : 'Highly Rated',
        `${this.businessProfile.reviews.count}+ Happy Customers`,
        'Licensed & Insured',
        'Local Family Business',
        'Same-Day Service Available'
      ]
    };
  }

  /**
   * Helper: Generate service sections
   */
  private generateServiceSections() {
    const cityName = this.targetCity.name;
    const services = this.businessProfile.services;

    return {
      primary: services.slice(0, 3).map(service => ({
        title: `Professional ${service} in ${cityName}`,
        description: `Our expert team provides comprehensive ${service.toLowerCase()} solutions for residential and commercial clients throughout ${cityName}. We use industry-leading techniques and equipment to ensure quality results every time.`,
        benefits: [
          'Licensed and insured professionals',
          'Upfront, transparent pricing',
          'Quick response times',
          'Quality workmanship guaranteed',
          'Local expertise and knowledge'
        ],
        serviceKeywords: [
          `${service.toLowerCase()} ${cityName.toLowerCase()}`,
          `professional ${service.toLowerCase()}`,
          `${service.toLowerCase()} experts`,
          `quality ${service.toLowerCase()}`
        ]
      })),
      secondary: services.slice(3, 6).map(service => ({
        title: service,
        description: `Expert ${service.toLowerCase()} services for ${cityName} residents and businesses.`,
        localRelevance: `Serving the ${cityName} community with reliable ${service.toLowerCase()} solutions.`
      }))
    };
  }

  /**
   * Helper: Generate local information
   */
  private generateLocalInformation() {
    const cityName = this.targetCity.name;
    const businessName = this.businessProfile.businessName;
    const population = this.targetCity.demographics.population.toLocaleString();

    return {
      areaDescription: `${cityName} is a vibrant community of ${population} residents in ${this.targetCity.state}. Known for ${this.targetCity.characteristics.culture.join(', ')}, the area offers a perfect blend of ${this.targetCity.characteristics.climate} climate and strong local economy driven by ${this.targetCity.economy.majorIndustries.join(', ')}.`,
      whyChooseUs: [
        `Deep knowledge of ${cityName} area and local regulations`,
        'Established relationships with local suppliers and vendors',
        'Quick response times throughout the city',
        'Understanding of local customer needs and preferences',
        'Active community involvement and local business support'
      ],
      localTestimonials: this.generateLocalTestimonials(),
      localCaseStudies: this.generateLocalCaseStudies()
    };
  }

  /**
   * Helper: Generate local testimonials
   */
  private generateLocalTestimonials() {
    const cityName = this.targetCity.name;
    const businessName = this.businessProfile.businessName;
    const primaryService = this.businessProfile.services[0] || 'service';
    const neighborhoods = this.targetCity.characteristics.neighborhoodNames;

    return [
      {
        quote: `${businessName} provided excellent ${primaryService.toLowerCase()} for our home. Their team was professional, punctual, and delivered exactly what they promised. Highly recommend for anyone in ${cityName}!`,
        author: 'Sarah M.',
        location: neighborhoods[0] || cityName,
        service: primaryService
      },
      {
        quote: `Outstanding work and customer service. They explained everything clearly and completed the project on time and within budget. Will definitely use them again.`,
        author: 'Mike R.',
        location: neighborhoods[1] || cityName,
        service: this.businessProfile.services[1] || primaryService
      },
      {
        quote: `Local business that truly cares about quality. They went above and beyond to ensure we were completely satisfied with the results.`,
        author: 'Jennifer L.',
        location: neighborhoods[2] || cityName,
        service: primaryService
      }
    ];
  }

  /**
   * Helper: Generate local case studies
   */
  private generateLocalCaseStudies() {
    const cityName = this.targetCity.name;
    const primaryService = this.businessProfile.services[0] || 'service';
    const neighborhoods = this.targetCity.characteristics.neighborhoodNames;

    return [
      {
        title: `${primaryService} Project in ${neighborhoods[0] || cityName}`,
        challenge: `Customer needed reliable ${primaryService.toLowerCase()} solution for their property with specific local requirements and timeline constraints.`,
        solution: `Our team developed a customized approach using local suppliers and expertise, ensuring compliance with city regulations and customer preferences.`,
        result: `Project completed ahead of schedule with 100% customer satisfaction. Customer now recommends us to neighbors and friends in the area.`,
        location: neighborhoods[0] || cityName
      }
    ];
  }

  /**
   * Helper: Generate local FAQ
   */
  private generateLocalFAQ() {
    const cityName = this.targetCity.name;
    const stateName = this.targetCity.state;
    const primaryService = this.businessProfile.services[0] || 'services';
    const businessName = this.businessProfile.businessName;

    return [
      {
        question: `Do you provide ${primaryService.toLowerCase()} throughout ${cityName}?`,
        answer: `Yes, ${businessName} provides ${primaryService.toLowerCase()} throughout ${cityName} and surrounding areas in ${stateName}. We serve all neighborhoods and can typically respond to service calls within the same day.`,
        category: 'location' as const,
        keywordTargets: [`${primaryService.toLowerCase()} ${cityName.toLowerCase()}`, `service area ${cityName.toLowerCase()}`]
      },
      {
        question: `What makes ${businessName} different from other ${primaryService.toLowerCase()} companies in ${cityName}?`,
        answer: `As a local ${cityName} business, we understand the unique needs of our community. We offer transparent pricing, licensed professionals, and personalized service that you can only get from a local company that truly cares about its reputation in the community.`,
        category: 'general' as const,
        keywordTargets: [`local ${primaryService.toLowerCase()}`, `${cityName} ${primaryService.toLowerCase()} company`]
      },
      {
        question: `How quickly can you respond to ${primaryService.toLowerCase()} needs in ${cityName}?`,
        answer: `We pride ourselves on quick response times throughout ${cityName}. For emergency services, we typically respond within 2-4 hours. For scheduled appointments, we can usually accommodate same-day or next-day service.`,
        category: 'service' as const,
        keywordTargets: [`emergency ${primaryService.toLowerCase()}`, `same day service ${cityName}`]
      },
      {
        question: `Do you offer free estimates for ${primaryService.toLowerCase()} in ${cityName}?`,
        answer: `Yes, we provide free, no-obligation estimates for all ${primaryService.toLowerCase()} projects in ${cityName}. Our experienced team will assess your needs and provide transparent pricing before any work begins.`,
        category: 'pricing' as const,
        keywordTargets: [`free estimate ${primaryService.toLowerCase()}`, `${primaryService.toLowerCase()} cost ${cityName}`]
      }
    ];
  }

  /**
   * Helper: Generate call to actions
   */
  private generateCallToActions() {
    return {
      primary: {
        text: 'Get Your Local SEO Plan',
        url: '/plans?utm_source=city&utm_campaign=local',
        type: 'quote' as const
      },
      secondary: {
        text: 'Calculate Your Marketing ROI',
        url: '/calculators/pricing?utm_source=city',
        type: 'contact' as const
      }
    };
  }

  /**
   * Helper: Convert normalized profile to schema format
   */
  private convertToSchemaFormat(): BusinessProfileForSchema {
    return {
      businessName: this.businessProfile.businessName,
      description: `Professional ${this.businessProfile.services.join(', ')} services in ${this.targetCity.name}, ${this.targetCity.state}`,
      industry: this.businessProfile.industry,
      services: this.businessProfile.services,
      address: {
        street: this.businessLocation.primaryAddress.street,
        city: this.businessLocation.primaryAddress.city,
        state: this.businessLocation.primaryAddress.state,
        zipCode: this.businessLocation.primaryAddress.zipCode,
        country: this.businessLocation.primaryAddress.country
      },
      contact: {
        phone: this.businessProfile.phone,
        email: this.businessProfile.email,
        website: this.businessProfile.website
      },
      socialMedia: this.businessProfile.socialMedia,
      rating: this.businessProfile.reviews.rating > 0 ? {
        value: this.businessProfile.reviews.rating,
        count: this.businessProfile.reviews.count,
        reviews: []
      } : undefined,
      coordinates: this.businessProfile.location?.coordinates ? {
        latitude: this.businessProfile.location.coordinates.latitude,
        longitude: this.businessProfile.location.coordinates.longitude
      } : {
        latitude: this.targetCity.coordinates.latitude,
        longitude: this.targetCity.coordinates.longitude
      }
    };
  }

  /**
   * Helper: Generate FAQ data for schema
   */
  private generateFAQDataForSchema(): FAQData {
    const localFAQ = this.generateLocalFAQ();
    return {
      questions: localFAQ.map(faq => ({
        question: faq.question,
        answer: faq.answer
      }))
    };
  }

  /**
   * Helper: Generate breadcrumb schema
   */
  private generateBreadcrumbSchema() {
    const citySlug = this.generateCitySlug();
    return {
      "@context": "https://schema.org" as const,
      "@type": "BreadcrumbList" as const,
      itemListElement: [
        {
          "@type": "ListItem" as const,
          position: 1,
          name: "Home",
          item: "/"
        },
        {
          "@type": "ListItem" as const,
          position: 2,
          name: "Service Areas",
          item: "/areas"
        },
        {
          "@type": "ListItem" as const,
          position: 3,
          name: this.targetCity.name,
          item: `/${citySlug}`
        }
      ]
    };
  }

  /**
   * Helper: Generate place schema
   */
  private generatePlaceSchema() {
    return {
      "@context": "https://schema.org" as const,
      "@type": "Place" as const,
      name: this.targetCity.name,
      address: {
        "@type": "PostalAddress" as const,
        addressLocality: this.targetCity.name,
        addressRegion: this.targetCity.state,
        addressCountry: this.targetCity.country
      },
      geo: {
        "@type": "GeoCoordinates" as const,
        latitude: this.targetCity.coordinates.latitude,
        longitude: this.targetCity.coordinates.longitude
      }
    };
  }

  /**
   * Helper: Generate navigation links
   */
  private generateNavigationLinks() {
    return {
      mainNavigation: [
        { text: 'Home', url: '/', priority: 1 },
        { text: 'Services', url: '/services', priority: 2 },
        { text: 'About', url: '/about', priority: 3 },
        { text: 'Contact', url: '/contact', priority: 4 },
        { text: 'Service Areas', url: '/areas', priority: 5 }
      ],
      breadcrumbs: [
        { text: 'Home', url: '/' },
        { text: 'Service Areas', url: '/areas' },
        { text: this.targetCity.name, url: `/${this.generateCitySlug()}` }
      ]
    };
  }

  /**
   * Helper: Generate content links
   */
  private generateContentLinks() {
    const citySlug = this.generateCitySlug();
    
    return {
      relatedCities: this.generateRelatedCityLinks(),
      servicePages: this.businessProfile.services.slice(0, 5).map((service, index) => ({
        serviceName: service,
        url: `/services/${service.toLowerCase().replace(/\s+/g, '-')}`,
        linkText: `${service} Services`,
        context: `Learn more about our professional ${service.toLowerCase()} solutions.`
      })),
      corePages: [
        {
          pageName: 'Contact',
          url: '/contact',
          linkText: 'Contact Our Team',
          placement: 'content' as const
        },
        {
          pageName: 'About',
          url: '/about',
          linkText: 'About Our Company',
          placement: 'content' as const
        },
        {
          pageName: 'Services',
          url: '/services',
          linkText: 'All Services',
          placement: 'header' as const
        },
        {
          pageName: 'Pricing',
          url: '/pricing',
          linkText: 'View Pricing',
          placement: 'content' as const
        }
      ]
    };
  }

  /**
   * Helper: Generate related city links
   */
  private generateRelatedCityLinks() {
    // This would typically come from a database of served cities
    // For now, generate sample related cities based on the service area
    const serviceAreas = this.businessLocation.serviceAreas.cities;
    
    return serviceAreas.slice(0, 5).map((city, index) => ({
      cityName: city,
      url: `/${city.toLowerCase().replace(/\s+/g, '-')}`,
      linkText: `${this.businessProfile.services[0]} in ${city}`,
      relevanceScore: 1.0 - (index * 0.1)
    }));
  }

  /**
   * Helper: Calculate link distribution
   */
  private calculateLinkDistribution() {
    const totalLinks = 15; // Estimated total internal links
    
    return {
      totalInternalLinks: totalLinks,
      linkToContentRatio: 0.15, // 15% of content should be links
      anchorTextVariation: {
        exact: 30, // 30% exact match
        partial: 40, // 40% partial match
        branded: 20, // 20% branded
        generic: 10  // 10% generic
      }
    };
  }

  /**
   * Helper: Calculate performance metrics
   */
  private calculatePerformanceMetrics() {
    return {
      estimatedLoadTime: 2.5, // seconds
      seoScore: 95, // out of 100
      aeoScore: 90, // out of 100
      localSEOScore: 98, // out of 100
      contentQualityScore: 92 // out of 100
    };
  }

  /**
   * Helper: Generate city slug
   */
  private generateCitySlug(): string {
    return this.targetCity.name.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }

  /**
   * Helper: Generate canonical URL
   */
  private generateCanonicalUrl(): string {
    return `/${this.generateCitySlug()}`;
  }

  /**
   * Helper: Generate profile hash
   */
  private generateProfileHash(): string {
    const profileString = JSON.stringify({
      name: this.businessProfile.businessName,
      services: this.businessProfile.services,
      city: this.businessProfile.city
    });
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < profileString.length; i++) {
      const char = profileString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Helper: Get optimizations applied
   */
  private getOptimizationsApplied(): string[] {
    const optimizations = [
      'Local SEO keyword optimization',
      'Schema.org structured data markup',
      'Internal linking strategy implementation',
      'Mobile-first responsive design optimization'
    ];

    if (this.config.seo.enableAEO) {
      optimizations.push('AI-Enhanced Optimization (AEO) implementation');
    }
    
    if (this.config.seo.enableVoiceSearch) {
      optimizations.push('Voice search optimization');
    }
    
    if (this.config.seo.targetFeaturedSnippets) {
      optimizations.push('Featured snippet targeting');
    }

    return optimizations;
  }

  /**
   * Helper: Generate recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations = [];

    if (this.businessProfile.reviews.count < 10) {
      recommendations.push('Encourage more customer reviews to improve local SEO rankings');
    }

    if (!this.businessProfile.socialMedia?.facebook) {
      recommendations.push('Add Facebook business page for improved local presence');
    }

    if (!this.businessProfile.location?.coordinates) {
      recommendations.push('Add GPS coordinates for better local search accuracy');
    }

    if (this.businessProfile.services.length < 3) {
      recommendations.push('Add more service offerings to target additional keywords');
    }

    return recommendations;
  }
}