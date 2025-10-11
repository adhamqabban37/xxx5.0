// Schema.org JSON-LD types for business profile markup

export interface Address {
  '@type': 'PostalAddress';
  streetAddress?: string;
  addressLocality?: string;
  addressRegion?: string;
  postalCode?: string;
  addressCountry?: string;
}

export interface ContactPoint {
  '@type': 'ContactPoint';
  telephone?: string;
  email?: string;
  contactType?: string;
  areaServed?: string;
  availableLanguage?: string;
}

export interface GeoCoordinates {
  '@type': 'GeoCoordinates';
  latitude?: number;
  longitude?: number;
}

export interface OpeningHours {
  '@type': 'OpeningHoursSpecification';
  dayOfWeek: string[];
  opens: string;
  closes: string;
}

export interface AggregateRating {
  '@type': 'AggregateRating';
  ratingValue: number;
  reviewCount: number;
  bestRating?: number;
  worstRating?: number;
}

export interface Review {
  '@type': 'Review';
  author: {
    '@type': 'Person';
    name: string;
  };
  reviewRating: {
    '@type': 'Rating';
    ratingValue: number;
    bestRating?: number;
  };
  reviewBody?: string;
  datePublished?: string;
}

export interface LocalBusiness {
  '@context': 'https://schema.org';
  '@type': 'LocalBusiness' | string; // Allow for specific business types
  name: string;
  description?: string;
  url?: string;
  telephone?: string;
  email?: string;
  address?: Address;
  geo?: GeoCoordinates;
  openingHoursSpecification?: OpeningHours[];
  contactPoint?: ContactPoint[];
  sameAs?: string[]; // Social media URLs
  image?: string[];
  priceRange?: string;
  currenciesAccepted?: string;
  paymentAccepted?: string[];
  areaServed?: string[];
  aggregateRating?: AggregateRating;
  review?: Review[];
  foundingDate?: string;
  founder?: {
    '@type': 'Person';
    name: string;
  };
  numberOfEmployees?: number;
  slogan?: string;
}

export interface Service {
  '@context': 'https://schema.org';
  '@type': 'Service';
  name: string;
  description?: string;
  provider: {
    '@type': 'LocalBusiness' | 'Organization';
    name: string;
    url?: string;
  };
  areaServed?: string[];
  serviceType?: string;
  category?: string;
  offers?: {
    '@type': 'Offer';
    description?: string;
    price?: string;
    priceCurrency?: string;
    availability?: string;
  }[];
  aggregateRating?: AggregateRating;
  review?: Review[];
}

export interface FAQPage {
  '@context': 'https://schema.org';
  '@type': 'FAQPage';
  mainEntity: {
    '@type': 'Question';
    name: string;
    acceptedAnswer: {
      '@type': 'Answer';
      text: string;
    };
  }[];
}

export interface Product {
  '@context': 'https://schema.org';
  '@type': 'Product';
  name: string;
  description?: string;
  image?: string[];
  brand?: {
    '@type': 'Brand';
    name: string;
  };
  manufacturer?: {
    '@type': 'Organization';
    name: string;
  };
  offers?: {
    '@type': 'Offer';
    price?: string;
    priceCurrency?: string;
    availability?: string;
    seller?: {
      '@type': 'Organization';
      name: string;
    };
  };
  aggregateRating?: AggregateRating;
  review?: Review[];
}

export interface WebSite {
  '@context': 'https://schema.org';
  '@type': 'WebSite';
  name: string;
  url: string;
  description?: string;
  potentialAction?: {
    '@type': 'SearchAction';
    target: string;
    'query-input': string;
  };
  sameAs?: string[];
}

export interface Organization {
  '@context': 'https://schema.org';
  '@type': 'Organization';
  name: string;
  description?: string;
  url?: string;
  logo?: string;
  image?: string[];
  sameAs?: string[];
  contactPoint?: ContactPoint[];
  address?: Address;
  foundingDate?: string;
  founder?: {
    '@type': 'Person';
    name: string;
  };
}

// Input types for generating schemas
export interface BusinessProfileForSchema {
  businessName: string;
  description?: string;
  industry?: string;
  services?: string[];
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  };
  hours?: {
    monday?: { open: string; close: string };
    tuesday?: { open: string; close: string };
    wednesday?: { open: string; close: string };
    thursday?: { open: string; close: string };
    friday?: { open: string; close: string };
    saturday?: { open: string; close: string };
    sunday?: { open: string; close: string };
  };
  rating?: {
    value: number;
    count: number;
    reviews?: Array<{
      author: string;
      rating: number;
      text?: string;
      date?: string;
    }>;
  };
  pricing?: {
    range?: string;
    currency?: string;
    accepted?: string[];
  };
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  images?: string[];
  foundingDate?: string;
  founder?: string;
  employeeCount?: number;
  slogan?: string;
}

export interface FAQData {
  questions: Array<{
    question: string;
    answer: string;
  }>;
}

export interface SchemaGeneratorOptions {
  includeLocalBusiness?: boolean;
  includeServices?: boolean;
  includeFAQ?: boolean;
  includeWebsite?: boolean;
  includeOrganization?: boolean;
  customBusinessType?: string; // e.g., "Restaurant", "AutoRepair", "LegalService"
  minifyOutput?: boolean;
  validateSchema?: boolean;
}

// Business type mappings for schema.org
export const BUSINESS_TYPE_MAPPINGS: Record<string, string> = {
  restaurant: 'Restaurant',
  automotive: 'AutoRepair',
  legal: 'LegalService',
  medical: 'MedicalOrganization',
  dental: 'DentistOffice',
  fitness: 'ExerciseGym',
  beauty: 'BeautySalon',
  retail: 'Store',
  ecommerce: 'OnlineStore',
  'real estate': 'RealEstateAgent',
  plumbing: 'Plumber',
  electrical: 'Electrician',
  hvac: 'HVACBusiness',
  cleaning: 'CleaningService',
  landscaping: 'LandscapingBusiness',
  photography: 'PhotographyBusiness',
  consulting: 'ProfessionalService',
  technology: 'TechnologyCompany',
  default: 'LocalBusiness',
};

export interface SchemaOutput {
  localBusiness?: LocalBusiness;
  services?: Service[];
  faqPage?: FAQPage;
  website?: WebSite;
  organization?: Organization;
  combined?: string; // All schemas combined in a single script tag
}
