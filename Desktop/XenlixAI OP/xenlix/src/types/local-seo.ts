// Local SEO Types
// Comprehensive type definitions for dynamic city-focused landing pages with AEO+SEO optimization

import { NormalizedBusinessProfile } from '@/lib/business-profile-parser';
import { LocalBusiness, Service, FAQPage, AggregateRating } from './schema';

// City and location data structures
export interface CityData {
  // Basic city information
  name: string;
  state: string;
  stateAbbreviation: string;
  county?: string;
  region?: string;
  country: string;

  // Geographic data
  coordinates: {
    latitude: number;
    longitude: number;
  };
  timezone: string;
  zipCodes: string[];

  // Demographics and market data
  demographics: {
    population: number;
    medianAge: number;
    medianIncome: number;
    householdCount: number;
    businessCount?: number;
  };

  // Economic indicators
  economy: {
    majorIndustries: string[];
    unemploymentRate?: number;
    economicGrowthRate?: number;
    businessFriendlyRating?: number;
  };

  // Local characteristics
  characteristics: {
    localKeywords: string[];
    neighborhoodNames: string[];
    landmarkNames: string[];
    events: string[];
    culture: string[];
    climate: string;
  };
}

// Business location and service area configuration
export interface BusinessLocation {
  // Primary location
  primaryAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };

  // Service coverage
  serviceAreas: {
    cities: string[];
    counties: string[];
    radiusMiles: number;
    specificZipCodes: string[];
  };

  // Location-specific data
  locationSpecific: {
    localCompetitors: string[];
    localPartnerships: string[];
    communityInvolvement: string[];
    localCertifications: string[];
    localAwards: string[];
  };
}

// SEO metadata for city pages
export interface CityPageSEOMetadata {
  // Page identifiers
  citySlug: string;
  canonicalUrl: string;
  alternateUrls?: { [lang: string]: string };

  // Core SEO elements
  title: string;
  metaDescription: string;
  h1: string;
  h2Tags: string[];
  h3Tags: string[];

  // Keywords and targeting
  primaryKeywords: string[];
  secondaryKeywords: string[];
  longTailKeywords: string[];
  localKeywords: string[];
  semanticKeywords: string[];

  // Local SEO specifics
  localSEOSignals: {
    businessNameInTitle: boolean;
    cityInTitle: boolean;
    serviceInTitle: boolean;
    localLandmarks: string[];
    localEvents: string[];
    neighborhoodMentions: string[];
  };

  // AEO optimization
  aeoOptimization: {
    questionBasedHeaders: string[];
    conversationalKeywords: string[];
    voiceSearchOptimized: boolean;
    featuredSnippetTargets: string[];
    peopleAlsoAskQuestions: string[];
  };
}

// Content structure for city pages
export interface CityPageContent {
  // Hero section
  hero: {
    headline: string;
    subheadline: string;
    ctaText: string;
    ctaUrl: string;
    backgroundImage?: string;
    trustSignals: string[];
  };

  // Service sections
  services: {
    primary: {
      title: string;
      description: string;
      benefits: string[];
      serviceKeywords: string[];
    }[];
    secondary: {
      title: string;
      description: string;
      localRelevance: string;
    }[];
  };

  // Local information
  localInfo: {
    areaDescription: string;
    whyChooseUs: string[];
    localTestimonials: {
      quote: string;
      author: string;
      location: string;
      service: string;
    }[];
    localCaseStudies?: {
      title: string;
      challenge: string;
      solution: string;
      result: string;
      location: string;
    }[];
  };

  // FAQ section optimized for local searches
  faq: {
    question: string;
    answer: string;
    category: 'general' | 'location' | 'service' | 'pricing';
    keywordTargets: string[];
  }[];

  // Call-to-action sections
  cta: {
    primary: {
      text: string;
      url: string;
      type: 'contact' | 'quote' | 'schedule' | 'learn-more';
    };
    secondary: {
      text: string;
      url: string;
      type: 'contact' | 'quote' | 'schedule' | 'learn-more';
    };
  };
}

// Internal linking strategy
export interface InternalLinkingStrategy {
  // Navigation links
  navigation: {
    mainNavigation: {
      text: string;
      url: string;
      priority: number;
    }[];
    breadcrumbs: {
      text: string;
      url: string;
    }[];
  };

  // Content links
  contentLinks: {
    // Links to other city pages
    relatedCities: {
      cityName: string;
      url: string;
      linkText: string;
      relevanceScore: number;
    }[];

    // Links to service pages
    servicePages: {
      serviceName: string;
      url: string;
      linkText: string;
      context: string;
    }[];

    // Links to core pages
    corePages: {
      pageName: string;
      url: string;
      linkText: string;
      placement: 'header' | 'content' | 'footer' | 'sidebar';
    }[];
  };

  // SEO link distribution
  linkDistribution: {
    totalInternalLinks: number;
    linkToContentRatio: number;
    anchorTextVariation: {
      exact: number;
      partial: number;
      branded: number;
      generic: number;
    };
  };
}

// Structured data for city pages
export interface CityPageStructuredData {
  // Main business schema
  localBusiness: LocalBusiness;

  // Service schemas
  services: Service[];

  // FAQ schema
  faqPage: FAQPage;

  // Local business aggregated rating
  aggregateRating?: AggregateRating;

  // Additional schemas
  breadcrumbList: {
    '@context': 'https://schema.org';
    '@type': 'BreadcrumbList';
    itemListElement: {
      '@type': 'ListItem';
      position: number;
      name: string;
      item: string;
    }[];
  };

  // Local area schema
  place?: {
    '@context': 'https://schema.org';
    '@type': 'Place';
    name: string;
    address: {
      '@type': 'PostalAddress';
      addressLocality: string;
      addressRegion: string;
      addressCountry: string;
    };
    geo: {
      '@type': 'GeoCoordinates';
      latitude: number;
      longitude: number;
    };
  };
}

// Configuration for city page generation
export interface CityPageGenerationConfig {
  // Template configuration
  template: {
    layout: 'standard' | 'service-focused' | 'location-focused' | 'hybrid';
    theme: string;
    components: string[];
  };

  // SEO configuration
  seo: {
    enableAEO: boolean;
    enableVoiceSearch: boolean;
    targetFeaturedSnippets: boolean;
    enableLocalSchema: boolean;
    customMetaTags: { [key: string]: string };
  };

  // Content generation
  content: {
    autoGenerateFromProfile: boolean;
    includeTestimonials: boolean;
    includeCaseStudies: boolean;
    generateLocalFAQ: boolean;
    localContentDepth: 'basic' | 'detailed' | 'comprehensive';
  };

  // Performance optimization
  performance: {
    enableStaticGeneration: boolean;
    revalidationInterval: number;
    enableImageOptimization: boolean;
    enableCaching: boolean;
  };
}

// Complete city page data structure
export interface GeneratedCityPage {
  // Page metadata
  metadata: CityPageSEOMetadata;

  // Page content
  content: CityPageContent;

  // Structured data
  structuredData: CityPageStructuredData;

  // Internal linking
  internalLinks: InternalLinkingStrategy;

  // Generation info
  generationInfo: {
    generatedAt: Date;
    version: string;
    sourceProfile: string; // Business profile ID/hash
    cityDataVersion: string;
    configUsed: CityPageGenerationConfig;
  };

  // Performance metrics
  performance: {
    estimatedLoadTime: number;
    seoScore: number;
    aeoScore: number;
    localSEOScore: number;
    contentQualityScore: number;
  };
}

// City page generation options
export interface LocalSEOGeneratorOptions {
  // Business profile to use
  businessProfile: NormalizedBusinessProfile;

  // Target city
  targetCity: CityData;

  // Business location data
  businessLocation: BusinessLocation;

  // Generation configuration
  config: CityPageGenerationConfig;

  // Optional customizations
  customizations?: {
    customContent?: Partial<CityPageContent>;
    customMetadata?: Partial<CityPageSEOMetadata>;
    customStructuredData?: Partial<CityPageStructuredData>;
  };
}

// API response types
export interface CityPageGenerationResponse {
  success: boolean;
  data?: GeneratedCityPage;
  error?: string;
  warnings?: string[];
  performance?: {
    generationTime: number;
    optimizationsApplied: string[];
    recommendations: string[];
  };
}

// City management types
export interface CityMarket {
  id: string;
  cityData: CityData;
  businessLocation: BusinessLocation;
  isActive: boolean;
  priority: 'high' | 'medium' | 'low';
  competitionLevel: 'low' | 'medium' | 'high';
  marketPotential: number; // 1-10 scale
  lastUpdated: Date;
  customizations?: {
    customContent?: Partial<CityPageContent>;
    customKeywords?: string[];
    customCompetitors?: string[];
  };
}

// Bulk generation types
export interface BulkCityPageGeneration {
  cities: CityMarket[];
  globalConfig: CityPageGenerationConfig;
  generateInParallel: boolean;
  maxConcurrency?: number;
  progressCallback?: (completed: number, total: number, current: string) => void;
}

export interface BulkGenerationResult {
  totalRequested: number;
  successful: number;
  failed: number;
  results: {
    cityName: string;
    success: boolean;
    page?: GeneratedCityPage;
    error?: string;
  }[];
  overallPerformance: {
    totalTime: number;
    averageTimePerPage: number;
    fastestGeneration: number;
    slowestGeneration: number;
  };
}

// Analytics and reporting types
export interface CityPageAnalytics {
  cityName: string;
  url: string;
  metrics: {
    organicTraffic: number;
    localSearchRankings: {
      keyword: string;
      position: number;
      searchVolume: number;
    }[];
    conversionRate: number;
    bounceRate: number;
    avgSessionDuration: number;
    localCTR: number;
  };
  seoHealth: {
    technicalSEO: number;
    onPageSEO: number;
    localSEO: number;
    aeoOptimization: number;
    overallScore: number;
  };
  recommendations: {
    type: 'content' | 'technical' | 'local' | 'aeo';
    priority: 'high' | 'medium' | 'low';
    description: string;
    expectedImpact: string;
  }[];
}
