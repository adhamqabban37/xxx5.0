/**
 * Canonical AEO (Answer Engine Optimization) Types
 * Single source of truth for all AEO-related interfaces and types
 */

// Core Business Information
export interface BusinessInfo {
  businessName: string;
  legalName?: string;
  industry: string;
  location: {
    address: {
      city: string;
      country: string;
      street?: string;
      state?: string;
      zipCode?: string;
      formattedAddress?: string;
    };
    serviceArea: string[];
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    timezone?: string;
  };
  contact: {
    phone?: string;
    email?: string;
    website?: string;
  };
  socialMedia: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  };
  description?: string;
  hours?: {
    [day: string]: {
      open: string;
      close: string;
      closed?: boolean;
    };
  };
  logoUrl?: string;
  images?: string[];
  // Added missing properties for type compatibility
  products?: Array<{
    name: string;
    description?: string;
    price?: number;
    category?: string;
  }>;
  reviews?: Review[];
  metadata: {
    lastUpdated: Date;
    source: string;
    confidence: number;
    extractionMethod?: string;
  };
}

// Review Information
export interface Review {
  id?: string;
  platform: string;
  rating: number;
  reviewText?: string;
  author?: string;
  date?: Date | string;
  verified?: boolean;
  helpfulCount?: number;
}

// Recommendation Structure
export interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  category: 'content' | 'schema' | 'technical' | 'voice-search' | 'local-seo';
  issue: string;
  solution: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
}

// AEO Analysis Results
export interface AEOAnalysis {
  schema_compliance_score: number;
  voice_search_readiness: number;
  snippet_optimization_score: number;
  faq_structure_score: number;
  local_optimization_score: number;
  overall_aeo_score: number;
}

// Content Analysis
export interface ContentAnalysis {
  has_question_answer_pairs: boolean;
  has_clear_answers: boolean;
  has_natural_language_content: boolean;
  has_location_info: boolean;
  avg_sentence_length: number;
  sentence_count?: number;
  paragraph_count?: number;
  readabilityScore?: number;
}

// Generated Schemas
export interface GeneratedSchemas {
  organization?: Record<string, any>;
  localBusiness?: Record<string, any>;
  website?: Record<string, any>;
  breadcrumb?: Record<string, any>;
  faq?: Record<string, any>;
  review?: Record<string, any>;
  product?: Record<string, any>[];
  service?: Record<string, any>[];
  jsonLd?: any[];
  types?: string[];
}

// Website Scan Result (unified interface)
export interface ScanResult {
  url: string;
  status: string;
  timestamp: string | Date;
  title?: string;
  meta_description?: string;
  canonical_url?: string;
  word_count: number;
  headings: Record<string, string[]>;
  json_ld_schemas: any[];
  schema_types: string[];
  has_faq_schema: boolean;
  has_local_business_schema: boolean;
  has_article_schema: boolean;
  open_graph: Record<string, string | undefined>;
  twitter_card: Record<string, string | undefined>;
  content_analysis: ContentAnalysis;
  aeo_analysis?: AEOAnalysis;
  recommendations: Recommendation[];
  raw_html?: string;
  extracted_content?: string;
  // Additional fields for local scanner compatibility
  metaDescription?: string;
  canonicalUrl?: string;
  wordCount?: number;
  jsonLd?: any[];
  schemaTypes?: string[];
  hasFAQSchema?: boolean;
  hasLocalBusinessSchema?: boolean;
  hasArticleSchema?: boolean;
  openGraph?: Record<string, string | undefined>;
  twitterCard?: Record<string, string | undefined>;
  contentAnalysis?: ContentAnalysis;
  aeoScore?: {
    overall: number;
    schemaCompliance: number;
    voiceSearchReady: number;
    snippetOptimized: number;
    faqStructure: number;
    localOptimization: number;
  };
}

// Lighthouse Scores
export interface LighthouseScores {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  pwa: number;
}

// Alert Types
export type AlertOperator = 'gte' | 'lt' | 'gt' | 'eq' | 'lte';
export type AlertSeverity = 'high' | 'medium' | 'low' | 'critical';

export interface AlertThreshold {
  id: string;
  url: string;
  createdAt: Date;
  updatedAt: Date;
  metricType: string;
  operator: AlertOperator;
  threshold: number;
  enabled: boolean;
  lastTriggered: Date | null;
}

export interface AlertEvent {
  id: string;
  thresholdId: string;
  url: string;
  metricType: string;
  value: number;
  threshold: number;
  severity: AlertSeverity;
  message: string;
  createdAt: Date;
  acknowledged: boolean;
  threshold?: AlertThreshold;
}

// Trend Types
export type Trend = 'stable' | 'up' | 'down' | 'no-data';

// Dashboard Card Props
export interface DashboardCardWithSparklineProps {
  title: string;
  value: string;
  trend: Trend;
  sparklineData: number[];
  icon?: React.ReactNode;
  subtitle?: string;
  subtitleClass?: string;
}

// GSC (Google Search Console) Types
export interface GSCDimensionValues {
  query?: string;
  page?: string;
}

export interface GSCRow {
  dimensionValues: GSCDimensionValues;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

// Platform Icons
export interface PlatformIcons {
  google: string;
  yelp: string;
  facebook: string;
  [key: string]: string;
}

// Job Status Types
export type JobStatus = 'running' | 'completed' | 'failed';

export interface JobInstance {
  id: string;
  type: 'cleanup' | 'alerts' | 'snapshots';
  startTime: Date;
  status: JobStatus;
  progress: number;
  error?: string;
}

// Environment and Configuration
export interface EnvironmentConfig {
  redis: {
    url: string;
    host: string;
    port: number;
    password?: string;
  };
  crawl4ai: {
    url: string;
    apiKey: string;
    enabled: boolean;
  };
  huggingface: {
    apiToken?: string;
    enabled: boolean;
  };
  firebase: {
    enabled: boolean;
    projectId?: string;
  };
}

// Error handling
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: ValidationError[];
  timestamp: string;
}