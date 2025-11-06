// Scan system types for XenlixAI two-stage scanning

export interface BusinessInfo {
  name?: string;
  phone?: string;
  address?: string;
  category?: string;
  hours?: string;
  website?: string;
  type?: string; // Business type/category
  location?: string; // Location description
  lat?: number; // Latitude coordinates for mapping
  lng?: number; // Longitude coordinates for mapping
}

export interface FreeScan {
  url: string;
  business?: BusinessInfo;
  quickScore: number; // Overall quick scan score 0-100
  issuesFound: number; // Number of issues found
  quick: {
    aeoScore?: number;
    vitals?: {
      lcp?: number;
      cls?: number;
      fcp?: number;
    };
    structuredData?: {
      jsonld?: number;
      microdata?: number;
      og?: number;
    };
    keyTopics?: string[];
    ts: number;
  };
}

export interface PremiumScan {
  url: string; // MUST equal FreeScan.url
  full: {
    psi?: {
      performance?: number;
      seo?: number;
      accessibility?: number;
      bestPractices?: number;
      audits?: any;
    };
    rules?: any; // YAML rules engine results
    geo?: {
      lat?: number;
      lng?: number;
      normalizedAddress?: string;
      placeId?: string;
    };
    competitors?: Array<{
      name: string;
      rating?: number;
      reviews?: number;
      distanceKm?: number;
      website?: string;
      primaryType?: string;
      address?: string;
    }>;
    citations?: any;
    recommendations?: string[];
    history?: any;
    raw_json_id?: string; // Raw JSON Analytics scan ID
    ts: number;
  };
}

export interface ScanContextType {
  freeScan?: FreeScan;
  premiumScan?: PremiumScan;
  isLoading?: boolean;
  error?: string;
}
