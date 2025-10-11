// SEO Recommendation Types
export interface SEORecommendation {
  metaTags: MetaTagRecommendations;
  headings: HeadingRecommendations;
  internalLinking: InternalLinkingStrategy;
  localContent: LocalContentIdeas;
  sitemapUpdates: SitemapRecommendations;
  technicalSEO: TechnicalSEOChecklist;
  keywordStrategy: KeywordStrategy;
  contentOptimization: ContentOptimization;
}

export interface MetaTagRecommendations {
  title: {
    primary: string;
    alternatives: string[];
    length: number;
    keywordDensity: number;
  };
  description: {
    primary: string;
    alternatives: string[];
    length: number;
    callToAction: string;
  };
  keywords: string[];
  openGraph: {
    title: string;
    description: string;
    image: string;
    type: string;
  };
  twitter: {
    card: string;
    title: string;
    description: string;
    image: string;
  };
  localBusiness: {
    type: string;
    name: string;
    address: string;
    phone: string;
    hours: string;
    geo: {
      latitude?: number;
      longitude?: number;
    };
  };
}

export interface HeadingRecommendations {
  h1: {
    primary: string;
    alternatives: string[];
    keywords: string[];
  };
  h2: {
    suggestions: string[];
    structure: string[];
  };
  h3: {
    suggestions: string[];
    supportingTopics: string[];
  };
  optimization: {
    keywordPlacement: string[];
    semanticKeywords: string[];
    userIntent: string;
  };
}

export interface InternalLinkingStrategy {
  primaryPages: {
    url: string;
    title: string;
    purpose: string;
    priority: 'high' | 'medium' | 'low';
  }[];
  linkingOpportunities: {
    fromPage: string;
    toPage: string;
    anchorText: string;
    context: string;
    seoValue: number;
  }[];
  siteArchitecture: {
    pillars: string[];
    clusters: {
      topic: string;
      pages: string[];
      internalLinks: number;
    }[];
  };
  breadcrumbs: {
    structure: string[];
    implementation: string;
  };
}

export interface LocalContentIdeas {
  locationPages: {
    title: string;
    url: string;
    content: string[];
    keywords: string[];
    priority: number;
  }[];
  localTopics: {
    topic: string;
    keywords: string[];
    contentType: 'blog' | 'service' | 'location' | 'event' | 'resource';
    difficulty: 'easy' | 'medium' | 'hard';
    impact: number;
  }[];
  communityContent: {
    events: string[];
    partnerships: string[];
    sponsorships: string[];
    localNews: string[];
  };
  seasonalContent: {
    month: string;
    topics: string[];
    keywords: string[];
  }[];
}

export interface SitemapRecommendations {
  structure: {
    mainSitemap: string;
    subSitemaps: {
      type: string;
      url: string;
      priority: number;
    }[];
  };
  pages: {
    url: string;
    priority: number;
    changeFreq: 'daily' | 'weekly' | 'monthly' | 'yearly';
    lastMod: string;
    images?: string[];
  }[];
  localSEO: {
    businessListing: boolean;
    locationPages: string[];
    serviceAreaPages: string[];
  };
}

export interface TechnicalSEOChecklist {
  coreWebVitals: {
    lcp: { target: string; recommendations: string[] };
    fid: { target: string; recommendations: string[] };
    cls: { target: string; recommendations: string[] };
  };
  mobile: {
    responsive: boolean;
    mobileFirst: boolean;
    recommendations: string[];
  };
  pageSpeed: {
    targetScore: number;
    optimizations: string[];
    priorityFixes: string[];
  };
  indexing: {
    robotsTxt: string;
    indexabilityIssues: string[];
    crawlabilityChecks: string[];
  };
  schema: {
    businessSchema: boolean;
    localBusinessSchema: boolean;
    serviceSchema: boolean;
    reviewSchema: boolean;
    faqSchema: boolean;
  };
}

export interface KeywordStrategy {
  primary: {
    keyword: string;
    volume: number;
    difficulty: number;
    intent: 'informational' | 'navigational' | 'commercial' | 'transactional';
  }[];
  secondary: {
    keyword: string;
    volume: number;
    difficulty: number;
    intent: string;
  }[];
  longTail: {
    keyword: string;
    volume: number;
    opportunity: number;
  }[];
  local: {
    keyword: string;
    localVolume: number;
    competition: 'low' | 'medium' | 'high';
  }[];
  seasonal: {
    keyword: string;
    months: string[];
    trend: 'increasing' | 'stable' | 'decreasing';
  }[];
}

export interface ContentOptimization {
  existingContent: {
    url: string;
    currentTitle: string;
    recommendedTitle: string;
    improvements: string[];
    priority: number;
  }[];
  gapAnalysis: {
    missingTopics: string[];
    competitorContent: string[];
    opportunityScore: number;
  };
  contentCalendar: {
    month: string;
    topics: {
      title: string;
      type: 'blog' | 'service' | 'location' | 'resource';
      keywords: string[];
      deadline: string;
    }[];
  }[];
}

// Business Profile Input Types
export interface BusinessProfile {
  industry: string;
  services: string[];
  city: string;
  state?: string;
  country?: string;
  businessName: string;
  description?: string;
  targetAudience?: string;
  competitors?: string[];
  uniqueSellingPoints?: string[];
  operatingHours?: {
    [key: string]: string;
  };
  contact: {
    phone?: string;
    email?: string;
    address?: string;
  };
  reviews?: {
    rating: number;
    count: number;
    source: string;
  }[];
  attributes?: {
    [key: string]: string | boolean | number;
  };
  website?: {
    currentUrl?: string;
    pages?: string[];
    currentSEO?: {
      title?: string;
      description?: string;
      keywords?: string[];
    };
  };
}

export interface SEOAnalysisResult {
  businessProfile: BusinessProfile;
  recommendations: SEORecommendation;
  competitorAnalysis: {
    competitors: string[];
    gapAnalysis: string[];
    opportunities: string[];
  };
  actionPlan: {
    immediate: { task: string; impact: 'high' | 'medium' | 'low'; effort: number }[];
    shortTerm: { task: string; impact: 'high' | 'medium' | 'low'; effort: number }[];
    longTerm: { task: string; impact: 'high' | 'medium' | 'low'; effort: number }[];
  };
  estimatedResults: {
    timeframe: '1-3 months' | '3-6 months' | '6-12 months';
    expectedTrafficIncrease: string;
    expectedRankingImprovement: string;
    localVisibilityImprovement: string;
  };
}

// AEO/JSON-LD Types for XenlixAI Platform

export type NormalizedBusiness = {
  name: string;
  url?: string;
  logo?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    region?: string;
    postal?: string;
    country?: string;
  };
  services?: string[];
  social?: string[];
  hours?: string[];
  rating?: number;
  reviewCount?: number;
  geo?: {
    lat?: number;
    lon?: number;
  };
  faqs?: {
    q: string;
    a: string;
  }[];
};

export type JsonLdBlocks = {
  blocks: any[];
};

export type AeoChecklistItem = {
  category: 'GBP' | 'Bing' | 'Apple' | 'Reviews' | 'NAP' | 'Schema' | 'Citations';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status?: 'complete' | 'pending' | 'needs-attention';
};

export type SeoChecklistItem = {
  category: 'Technical' | 'Content' | 'Local' | 'Performance' | 'Authority';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status?: 'complete' | 'pending' | 'needs-attention';
};

export type ExtractionResult =
  | {
      ok: true;
      data: Partial<NormalizedBusiness> & { faqs?: { q: string; a: string }[] };
    }
  | {
      ok: false;
      reason: 'FETCH_OR_PARSE_FAILED';
    };
