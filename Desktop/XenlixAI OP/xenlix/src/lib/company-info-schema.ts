import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import companyInfoSchema from '../../schemas/company-info.schema.json';

// Initialize AJV with format validation
const ajv = new Ajv({
  allErrors: true,
  strict: false,
  validateFormats: true,
});

// Add standard formats (date-time, uri, etc.)
addFormats(ajv);

// Compile the company info schema
export const validateCompanyInfo = ajv.compile(companyInfoSchema);

// Type definitions for the company info schema
export interface CompanyInfoSource {
  requestedUrl: string;
  finalUrl: string;
  httpStatus?: number;
  collectedAt: string;
  locale?: string;
  region?: string;
}

export interface CompanyInfoCompany {
  name: string;
  legalName?: string;
  description?: string;
  industry?: string;
  foundedYear?: number;
  employeesRange?: string;
  address?: {
    street?: string;
    locality?: string;
    region?: string;
    postalCode?: string;
    country?: string;
  };
  contacts?: {
    email?: string;
    phone?: string;
  };
}

export interface CompanyInfoWeb {
  domain: string;
  canonicalUrl?: string;
  sitemapUrl?: string;
  robotsTxt?: string;
  social?: {
    twitter?: string;
    linkedin?: string;
    facebook?: string;
    youtube?: string;
    instagram?: string;
  };
  technologies?: string[];
}

export interface CompanyInfoContent {
  title: string;
  meta: {
    description?: string;
    keywords?: string[];
    og?: {
      'og:title'?: string;
      'og:description'?: string;
      'og:image'?: string;
    };
  };
  schemaOrg?: Array<{
    '@type': string;
    '@context': string;
    [key: string]: any;
  }>;
  headings?: Array<{
    level: number;
    text: string;
  }>;
}

export interface CompanyInfoExtractions {
  brandMentions: Array<{
    brand: string;
    aliasMatched?: string;
    position?: number | null;
    sentiment?: -1 | 0 | 1;
  }>;
  citations: Array<{
    url?: string;
    domain: string;
    title?: string;
    rank?: number;
    source?: 'page' | 'ai-answer';
  }>;
}

export interface CompanyInfoMetrics {
  opr?: {
    domain?: string;
    rank?: number;
    fetchedAt?: string;
  };
  lighthouse?: {
    performance?: number;
    accessibility?: number;
    bestPractices?: number;
    seo?: number;
    reportPath?: string;
  };
  aeo: {
    visibilityIndex?: number;
    coveragePct?: number;
    sourceSharePct?: number;
    lastSweepAt?: string;
  };
}

export interface CompanyInfoProvenance {
  hash: string;
  pipelineVersion: string;
  collector?: string;
  notes?: string;
}

export interface CompanyInfo {
  source: CompanyInfoSource;
  company: CompanyInfoCompany;
  web: CompanyInfoWeb;
  content: CompanyInfoContent;
  extractions: CompanyInfoExtractions;
  metrics: CompanyInfoMetrics;
  provenance: CompanyInfoProvenance;
}

// Validation helper function with detailed error reporting
export function validateCompanyInfoData(data: unknown): {
  valid: boolean;
  data?: CompanyInfo;
  errors?: string[];
} {
  const valid = validateCompanyInfo(data);

  if (valid) {
    return {
      valid: true,
      data: data as CompanyInfo,
    };
  }

  const errors = validateCompanyInfo.errors?.map((err) => {
    const path = err.instancePath || err.schemaPath || 'root';
    return `${path}: ${err.message}`;
  }) || ['Unknown validation error'];

  return {
    valid: false,
    errors,
  };
}

// Create a normalized company info document
export function createCompanyInfo(options: {
  url: string;
  companyName: string;
  domain: string;
  collector?: string;
}): CompanyInfo {
  const now = new Date().toISOString();

  return {
    source: {
      requestedUrl: options.url,
      finalUrl: options.url,
      httpStatus: 200,
      collectedAt: now,
      locale: 'en-US',
      region: 'US',
    },
    company: {
      name: options.companyName,
    },
    web: {
      domain: options.domain,
    },
    content: {
      title: `${options.companyName} - Company Profile`,
      meta: {},
    },
    extractions: {
      brandMentions: [],
      citations: [],
    },
    metrics: {
      aeo: {},
    },
    provenance: {
      hash: `sha256:${Date.now()}`,
      pipelineVersion: '2025.09.26-rc1',
      collector: options.collector || 'manual',
      notes: 'Initial company profile creation',
    },
  };
}

// Extract key metrics for database storage
export function extractMetricsFromCompanyInfo(companyInfo: CompanyInfo) {
  return {
    visibilityScore: companyInfo.metrics.aeo.visibilityIndex || 0,
    coveragePct: companyInfo.metrics.aeo.coveragePct || 0,
    sourceSharePct: companyInfo.metrics.aeo.sourceSharePct || 0,
    oprRank: companyInfo.metrics.opr?.rank,
    lighthousePerformance: companyInfo.metrics.lighthouse?.performance,
    lighthouseSeo: companyInfo.metrics.lighthouse?.seo,
  };
}
