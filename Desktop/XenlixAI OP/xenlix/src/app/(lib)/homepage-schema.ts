// Comprehensive Schema.org JSON-LD for Homepage
// Includes: Organization, LocalBusiness, WebSite, WebPage with stable @id's

export interface HomepageSchemaConfig {
  baseUrl: string;
  organizationName: string;
  description: string;
  address?: {
    streetAddress?: string;
    addressLocality: string;
    addressRegion: string;
    postalCode?: string;
    addressCountry: string;
  };
  phone?: string;
  email?: string;
  sameAs: string[];
  logo?: string;
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
  geo?: {
    latitude: number;
    longitude: number;
  };
  openingHours?: string[];
  priceRange?: string;
}

export function generateHomepageSchema(config: HomepageSchemaConfig) {
  const {
    baseUrl,
    organizationName,
    description,
    address,
    phone,
    email,
    sameAs,
    logo,
    aggregateRating,
    geo,
    openingHours,
    priceRange,
  } = config;

  // Ensure we have at least 3 sameAs URLs as required
  if (sameAs.length < 3) {
    throw new Error('sameAs must contain at least 3 URLs');
  }

  const schemas = [];

  // 1. Organization Schema with stable @id
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${baseUrl}#organization`,
    name: organizationName,
    legalName: `${organizationName} LLC`,
    url: baseUrl,
    description: description,
    sameAs: sameAs,
    ...(logo && { logo: logo }),
    ...(email && {
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        email: email,
        areaServed: ['US', 'CA', 'GB', 'AU'],
        availableLanguage: 'English',
      },
    }),
    ...(aggregateRating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: aggregateRating.ratingValue.toString(),
        reviewCount: aggregateRating.reviewCount,
      },
    }),
  };

  schemas.push(organizationSchema);

  // 2. ProfessionalService Schema (most specific LocalBusiness subtype) with stable @id
  if (address) {
    const professionalServiceSchema = {
      '@context': 'https://schema.org',
      '@type': 'ProfessionalService',
      '@id': `${baseUrl}#localbusiness`,
      name: organizationName,
      url: baseUrl,
      description: description,
      address: {
        '@type': 'PostalAddress',
        ...(address.streetAddress && { streetAddress: address.streetAddress }),
        addressLocality: address.addressLocality,
        addressRegion: address.addressRegion,
        ...(address.postalCode && { postalCode: address.postalCode }),
        addressCountry: address.addressCountry,
      },
      ...(phone && { telephone: phone }),
      ...(geo && {
        geo: {
          '@type': 'GeoCoordinates',
          latitude: geo.latitude,
          longitude: geo.longitude,
        },
      }),
      ...(openingHours && { openingHours: openingHours }),
      ...(priceRange && { priceRange: priceRange }),
      sameAs: sameAs,
      parentOrganization: {
        '@id': `${baseUrl}#organization`,
      },
      serviceType: [
        'Digital Marketing',
        'SEO Services',
        'Answer Engine Optimization',
        'AI Marketing Automation',
      ],
      areaServed: [
        {
          '@type': 'Country',
          name: 'United States',
        },
        {
          '@type': 'Country',
          name: 'Canada',
        },
        {
          '@type': 'Country',
          name: 'United Kingdom',
        },
        {
          '@type': 'Country',
          name: 'Australia',
        },
      ],
      ...(aggregateRating && {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: aggregateRating.ratingValue.toString(),
          reviewCount: aggregateRating.reviewCount,
        },
      }),
    };

    schemas.push(professionalServiceSchema);
  }

  // 3. WebSite Schema with stable @id
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${baseUrl}#website`,
    name: organizationName,
    url: baseUrl,
    description: description,
    publisher: {
      '@id': `${baseUrl}#organization`,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  schemas.push(websiteSchema);

  // 4. WebPage Schema with stable @id
  const webpageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${baseUrl}#webpage`,
    name: `${organizationName} | AI Marketing Automation Platform`,
    url: baseUrl,
    description: description,
    isPartOf: {
      '@id': `${baseUrl}#website`,
    },
    about: {
      '@id': `${baseUrl}#organization`,
    },
    primaryImageOfPage: {
      '@type': 'ImageObject',
      url: `${baseUrl}/og-homepage.jpg`,
      width: 1200,
      height: 630,
    },
    datePublished: '2024-01-01',
    dateModified: new Date().toISOString().split('T')[0],
    inLanguage: 'en-US',
  };

  schemas.push(webpageSchema);

  return schemas;
}

// Default configuration for XenlixAI
export const XENLIX_HOMEPAGE_CONFIG: HomepageSchemaConfig = {
  baseUrl: 'https://xenlix.ai',
  organizationName: 'XenlixAI',
  description:
    'AI-powered Answer Engine Optimization (AEO) platform helping businesses get found in ChatGPT, Claude, Perplexity, and other AI search engines. Comprehensive SEO automation and analytics dashboard.',
  address: {
    addressLocality: 'Dallas',
    addressRegion: 'TX',
    addressCountry: 'US',
  },
  email: 'hello@xenlix.ai',
  sameAs: [
    'https://www.linkedin.com/company/xenlixai', // B2B professional authority
    'https://x.com/xenlixai', // Real-time engagement & thought leadership
    'https://www.facebook.com/xenlixai', // Broad audience reach & engagement
    'https://github.com/xenlixai', // Technical authority & open source
    'https://www.youtube.com/@xenlixai', // Video content & product demos
    'https://www.crunchbase.com/organization/xenlixai', // Business intelligence & authority
    'https://angel.co/company/xenlixai', // Startup ecosystem presence
    'https://www.g2.com/products/xenlixai', // Software review authority & testimonials
  ],
  logo: 'https://www.xenlixai.com/assets/logo.png',
};

// NAP Analysis: Missing Fields for Complete Local Business Schema
export const MISSING_NAP_FIELDS = [
  'streetAddress - Physical business address not provided',
  'postalCode - ZIP code not specified',
  'telephone - Phone number not available',
  'openingHours - Business hours not defined',
  'geo.latitude - Geographic coordinates missing',
  'geo.longitude - Geographic coordinates missing',
];

// Most specific LocalBusiness subtype for XenlixAI (Digital Marketing/SEO Services)
export const XENLIX_BUSINESS_TYPE = 'ProfessionalService'; // More specific than LocalBusiness
