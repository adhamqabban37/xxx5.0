/**
 * URL Pattern Analysis for Canonical Normalization
 * Identifies duplicate/variant URLs that need deduplication
 */

// Pages with query parameters that should be canonicalized
const URL_PATTERNS = {
  // Analytics page with URL parameter
  ANALYTICS: {
    pattern: '/analytics',
    variants: [
      '/analytics?url=example.com',
      '/analytics?url=example.com&tab=authority',
      '/analytics?url=example.com&ref=dashboard'
    ],
    canonical: '/analytics',
    shouldNoindex: false,
    notes: 'Premium feature - already has noindex'
  },

  // AEO Results with various tracking parameters
  AEO_RESULTS: {
    pattern: '/aeo/results',
    variants: [
      '/aeo/results?id=123',
      '/aeo/results?id=123&payment_success=true',
      '/aeo/results?id=123&utm_source=email&utm_campaign=follow_up',
      '/aeo/results?id=123&ref=dashboard'
    ],
    canonical: '/aeo/results',
    shouldNoindex: true,
    notes: 'Dynamic results should not be indexed'
  },

  // SEO Results with tracking
  SEO_RESULTS: {
    pattern: '/seo/results',
    variants: [
      '/seo/results?id=456',
      '/seo/results?id=456&source=audit',
      '/seo/results?id=456&utm_source=google&utm_medium=organic'
    ],
    canonical: '/seo/results',
    shouldNoindex: true,
    notes: 'Dynamic audit results should not be indexed'
  },

  // City pages with tracking parameters
  CITY_PAGES: {
    pattern: '/[city]',
    variants: [
      '/dallas?utm_source=google',
      '/dallas?ref=homepage',
      '/dallas?campaign=local_seo',
      '/austin?utm_campaign=expansion'
    ],
    canonical: '/[city]', // Will be dynamically generated
    shouldNoindex: false,
    notes: 'City pages should be indexed, but strip tracking params'
  },

  // Authentication pages with redirects
  AUTH_PAGES: {
    pattern: '/signin',
    variants: [
      '/signin?message=Premium+access+required',
      '/signin?redirect=/dashboard',
      '/signin?utm_source=trial_expired'
    ],
    canonical: '/signin',
    shouldNoindex: true,
    notes: 'Auth pages already have noindex'
  },

  // Tool pages with parameters
  TOOLS: {
    pattern: '/tools/json-ld',
    variants: [
      '/tools/json-ld?template=business',
      '/tools/json-ld?source=homepage',
      '/tools/json-ld?utm_campaign=free_tools'
    ],
    canonical: '/tools/json-ld',
    shouldNoindex: false,
    notes: 'Tool pages should be indexed without parameters'
  },

  // Calculator pages with preset values
  CALCULATORS: {
    pattern: '/calculators/roi',
    variants: [
      '/calculators/roi?industry=restaurants',
      '/calculators/roi?preset=small_business',
      '/calculators/roi?utm_source=blog'
    ],
    canonical: '/calculators/roi',
    shouldNoindex: false,
    notes: 'Calculator pages should be indexed without preset values'
  }
};

// Common tracking parameters that should be stripped
const TRACKING_PARAMETERS = [
  'utm_source',
  'utm_medium', 
  'utm_campaign',
  'utm_term',
  'utm_content',
  'ref',
  'source',
  'campaign',
  'gclid',
  'fbclid',
  'msclkid',
  'referrer',
  'affiliate',
  'partner'
];

// Parameters that affect content and should be preserved in canonical
const CONTENT_PARAMETERS = [
  'id',
  'slug',
  'category',
  'type',
  'template',
  'page'
];

// Pages that should always be noindexed regardless of parameters
const ALWAYS_NOINDEX_PATTERNS = [
  '/dashboard',
  '/dashboard/**',
  '/analytics',
  '/analytics/**', 
  '/aeo/results',
  '/seo/results',
  '/checkout',
  '/checkout/**',
  '/signin',
  '/signup',
  '/onboarding'
];

// Pages that should be indexed but have parameter variants
const INDEX_WITH_CANONICAL_PATTERNS = [
  '/',
  '/dallas',
  '/[city]',
  '/contact',
  '/tools/**',
  '/calculators/**',
  '/case-studies/**',
  '/ai-seo-automation',
  '/ai-website-builder',
  '/vs-competitors',
  '/plans'
];

module.exports = {
  URL_PATTERNS,
  TRACKING_PARAMETERS,
  CONTENT_PARAMETERS,
  ALWAYS_NOINDEX_PATTERNS,
  INDEX_WITH_CANONICAL_PATTERNS
};