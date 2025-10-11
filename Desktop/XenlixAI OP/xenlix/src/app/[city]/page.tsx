// Dynamic City Page Route Handler
// Server-side rendered city-focused landing pages with comprehensive SEO optimization

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LocalSEOGenerator } from '@/lib/local-seo-generator';
import {
  CityData,
  BusinessLocation,
  CityPageGenerationConfig,
  GeneratedCityPage,
} from '@/types/local-seo';
import { NormalizedBusinessProfile } from '@/lib/business-profile-parser';
import { MetadataTemplates } from '@/components/SEOMetadata';

// Sample business profile - in production, this would come from database
const SAMPLE_BUSINESS_PROFILE: NormalizedBusinessProfile = {
  businessName: 'XenlixAI Solutions',
  industry: 'Digital Marketing',
  services: [
    'SEO Optimization',
    'AI-Powered Marketing',
    'Content Strategy',
    'Local SEO',
    'Schema Markup',
    'Website Optimization',
  ],
  city: 'Default City',
  state: 'Default State',
  country: 'United States',
  phone: '(555) 123-4567',
  email: 'contact@xenlix.ai',
  website: 'https://xenlix.ai',
  socialMedia: {
    facebook: 'https://facebook.com/xenlix',
    instagram: 'https://instagram.com/xenlix',
    twitter: 'https://twitter.com/xenlix',
    linkedin: 'https://linkedin.com/company/xenlix',
  },
  reviews: {
    rating: 4.9,
    count: 127,
    platforms: {
      google: { rating: 4.9, count: 85 },
      yelp: { rating: 4.8, count: 42 },
    },
  },
  attributes: {
    yearEstablished: 2020,
    employeeCount: 15,
    businessHours: {
      monday: '9:00 AM - 6:00 PM',
      tuesday: '9:00 AM - 6:00 PM',
      wednesday: '9:00 AM - 6:00 PM',
      thursday: '9:00 AM - 6:00 PM',
      friday: '9:00 AM - 6:00 PM',
      saturday: '10:00 AM - 4:00 PM',
      sunday: 'Closed',
    },
    servicesOffered: [
      'SEO Audits',
      'Keyword Research',
      'Technical SEO',
      'Local Business Optimization',
      'Content Marketing',
      'AI-Driven Analytics',
    ],
    specialties: [
      'Local SEO for Small Businesses',
      'E-commerce SEO',
      'AI-Enhanced Marketing Strategies',
      'Schema Markup Implementation',
    ],
    certifications: [
      'Google Analytics Certified',
      'Google Ads Certified',
      'HubSpot Inbound Marketing',
      'Facebook Blueprint Certified',
    ],
    paymentMethods: ['Credit Cards', 'PayPal', 'Bank Transfer', 'Check'],
    languages: ['English', 'Spanish'],
    features: [
      'Free Initial Consultation',
      '24/7 Support',
      'Money-Back Guarantee',
      'Custom Reporting Dashboard',
    ],
  },
  location: {
    address: {
      street: '123 Business Ave',
      city: 'Default City',
      state: 'Default State',
      zipCode: '12345',
      country: 'United States',
    },
    serviceArea: ['Default City', 'Nearby City 1', 'Nearby City 2', 'County Area'],
    coordinates: {
      latitude: 40.7128,
      longitude: -74.006,
    },
  },
  seo: {
    primaryKeywords: ['digital marketing', 'SEO services', 'AI marketing', 'local SEO'],
    secondaryKeywords: [
      'website optimization',
      'content strategy',
      'search engine optimization',
      'marketing automation',
    ],
    targetAudience: [
      'Small Business Owners',
      'Marketing Managers',
      'E-commerce Companies',
      'Local Service Providers',
    ],
    competitiveAdvantages: [
      'AI-Powered Solutions',
      'Local Market Expertise',
      'Proven Track Record',
      'Transparent Reporting',
    ],
    uniqueSellingPropositions: [
      'First AI-enhanced local SEO platform',
      'Guaranteed rankings improvement',
      'Comprehensive SEO toolchain',
      'Real-time performance tracking',
    ],
  },
  metadata: {
    source: 'sample',
    parsedAt: new Date(),
    confidence: 1.0,
    lastUpdated: new Date(),
    warnings: [],
    dataQuality: {
      completeness: 0.95,
      accuracy: 0.98,
      freshness: 1.0,
    },
    processingNotes: [
      'Sample business profile for demonstration',
      'All data is representative and for testing purposes',
    ],
  },
};

// Sample city database - in production, this would be a comprehensive database
const CITY_DATABASE: { [slug: string]: CityData } = {
  'new-york': {
    name: 'New York',
    state: 'New York',
    stateAbbreviation: 'NY',
    county: 'New York County',
    region: 'Northeast',
    country: 'United States',
    coordinates: {
      latitude: 40.7128,
      longitude: -74.006,
    },
    timezone: 'America/New_York',
    zipCodes: ['10001', '10002', '10003', '10004', '10005'],
    demographics: {
      population: 8336817,
      medianAge: 36.2,
      medianIncome: 67046,
      householdCount: 3736077,
      businessCount: 285000,
    },
    economy: {
      majorIndustries: [
        'Financial Services',
        'Technology',
        'Media',
        'Tourism',
        'Real Estate',
        'Healthcare',
      ],
      unemploymentRate: 4.2,
      economicGrowthRate: 2.8,
      businessFriendlyRating: 8.5,
    },
    characteristics: {
      localKeywords: [
        'manhattan',
        'brooklyn',
        'queens',
        'bronx',
        'staten island',
        'nyc',
        'big apple',
      ],
      neighborhoodNames: [
        'Manhattan',
        'Brooklyn',
        'Queens',
        'Bronx',
        'Staten Island',
        'Upper East Side',
        'Greenwich Village',
        'SoHo',
        'Tribeca',
        'Williamsburg',
      ],
      landmarkNames: [
        'Times Square',
        'Central Park',
        'Statue of Liberty',
        'Empire State Building',
        'Brooklyn Bridge',
        'Wall Street',
      ],
      events: ["New Year's Eve Ball Drop", 'NYC Marathon', 'Fashion Week', 'Summer Streets'],
      culture: ['Arts and Theater', 'Diverse Cuisine', 'Fashion Hub', 'Financial Center'],
      climate: 'humid subtropical',
    },
  },
  'los-angeles': {
    name: 'Los Angeles',
    state: 'California',
    stateAbbreviation: 'CA',
    county: 'Los Angeles County',
    region: 'West Coast',
    country: 'United States',
    coordinates: {
      latitude: 34.0522,
      longitude: -118.2437,
    },
    timezone: 'America/Los_Angeles',
    zipCodes: ['90001', '90210', '90028', '90069', '90291'],
    demographics: {
      population: 3971883,
      medianAge: 35.8,
      medianIncome: 62142,
      householdCount: 1456875,
      businessCount: 175000,
    },
    economy: {
      majorIndustries: [
        'Entertainment',
        'Technology',
        'Aerospace',
        'Fashion',
        'Tourism',
        'International Trade',
      ],
      unemploymentRate: 4.8,
      economicGrowthRate: 3.2,
      businessFriendlyRating: 7.8,
    },
    characteristics: {
      localKeywords: [
        'hollywood',
        'beverly hills',
        'santa monica',
        'venice',
        'downtown la',
        'la',
        'city of angels',
      ],
      neighborhoodNames: [
        'Hollywood',
        'Beverly Hills',
        'Santa Monica',
        'Venice',
        'Downtown LA',
        'West Hollywood',
        'Silver Lake',
        'Los Feliz',
        'Brentwood',
        'Manhattan Beach',
      ],
      landmarkNames: [
        'Hollywood Sign',
        'Griffith Observatory',
        'Santa Monica Pier',
        'Getty Center',
        'Venice Beach',
        'Rodeo Drive',
      ],
      events: ['Academy Awards', 'LA Film Festival', 'Rose Parade', 'LA Marathon'],
      culture: [
        'Entertainment Capital',
        'Beach Lifestyle',
        'Diverse Communities',
        'Innovation Hub',
      ],
      climate: 'Mediterranean',
    },
  },
  chicago: {
    name: 'Chicago',
    state: 'Illinois',
    stateAbbreviation: 'IL',
    county: 'Cook County',
    region: 'Midwest',
    country: 'United States',
    coordinates: {
      latitude: 41.8781,
      longitude: -87.6298,
    },
    timezone: 'America/Chicago',
    zipCodes: ['60601', '60602', '60603', '60604', '60605'],
    demographics: {
      population: 2693976,
      medianAge: 34.8,
      medianIncome: 58247,
      householdCount: 1061928,
      businessCount: 125000,
    },
    economy: {
      majorIndustries: [
        'Manufacturing',
        'Transportation',
        'Finance',
        'Technology',
        'Healthcare',
        'Food Processing',
      ],
      unemploymentRate: 4.5,
      economicGrowthRate: 2.4,
      businessFriendlyRating: 8.2,
    },
    characteristics: {
      localKeywords: [
        'windy city',
        'chi-town',
        'the loop',
        'magnificent mile',
        'north shore',
        'second city',
      ],
      neighborhoodNames: [
        'The Loop',
        'River North',
        'Lincoln Park',
        'Wicker Park',
        'Gold Coast',
        'Old Town',
        'Bucktown',
        'Logan Square',
        'Ukrainian Village',
        'Pilsen',
      ],
      landmarkNames: [
        'Millennium Park',
        'Navy Pier',
        'Willis Tower',
        'Art Institute',
        'Wrigley Field',
        'Lincoln Park Zoo',
      ],
      events: ['Lollapalooza', 'Chicago Marathon', 'Air and Water Show', 'Taste of Chicago'],
      culture: ['Architecture', 'Deep Dish Pizza', 'Blues and Jazz', 'Sports Culture'],
      climate: 'continental',
    },
  },
};

// Default configuration
const DEFAULT_CONFIG: CityPageGenerationConfig = {
  template: {
    layout: 'hybrid',
    theme: 'professional',
    components: ['hero', 'services', 'testimonials', 'faq', 'cta'],
  },
  seo: {
    enableAEO: true,
    enableVoiceSearch: true,
    targetFeaturedSnippets: true,
    enableLocalSchema: true,
    customMetaTags: {},
  },
  content: {
    autoGenerateFromProfile: true,
    includeTestimonials: true,
    includeCaseStudies: true,
    generateLocalFAQ: true,
    localContentDepth: 'comprehensive',
  },
  performance: {
    enableStaticGeneration: true,
    revalidationInterval: 3600, // 1 hour
    enableImageOptimization: true,
    enableCaching: true,
  },
};

// Page props interface
interface CityPageProps {
  params: {
    city: string;
  };
}

// Generate metadata for the city page
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ city: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const citySlug = resolvedParams.city;
  const cityData = CITY_DATABASE[citySlug];

  if (!cityData) {
    return {
      title: 'City Not Found',
      description: 'The requested city page could not be found.',
      robots: 'noindex, nofollow',
    };
  }

  const resolvedSearchParams = await searchParams;

  // Use the new metadata template system with canonical normalization
  return MetadataTemplates.cityPage(
    cityData.name,
    cityData.stateAbbreviation,
    `/${citySlug}`,
    resolvedSearchParams
  );
}

// Generate static params for known cities
export async function generateStaticParams() {
  // Return the city slugs we want to pre-generate
  return Object.keys(CITY_DATABASE).map((slug) => ({
    city: slug,
  }));
}

// City page component
export default async function CityPage({ params }: { params: Promise<{ city: string }> }) {
  const resolvedParams = await params;
  const citySlug = resolvedParams.city;
  const cityData = CITY_DATABASE[citySlug];

  // Return 404 if city not found
  if (!cityData) {
    notFound();
  }

  // Create business location from city data
  const businessLocation: BusinessLocation = {
    primaryAddress: {
      street: '123 Business Ave',
      city: cityData.name,
      state: cityData.state,
      zipCode: cityData.zipCodes[0],
      country: cityData.country,
    },
    serviceAreas: {
      cities: [cityData.name, ...cityData.characteristics.neighborhoodNames.slice(0, 5)],
      counties: [cityData.county || `${cityData.name} County`],
      radiusMiles: 25,
      specificZipCodes: cityData.zipCodes,
    },
    locationSpecific: {
      localCompetitors: [],
      localPartnerships: [],
      communityInvolvement: [],
      localCertifications: [],
      localAwards: [],
    },
  };

  // Generate page data
  const generator = new LocalSEOGenerator({
    businessProfile: SAMPLE_BUSINESS_PROFILE,
    targetCity: cityData,
    businessLocation,
    config: DEFAULT_CONFIG,
  });

  const result = await generator.generateCityPage();

  if (!result.success || !result.data) {
    throw new Error('Failed to generate city page data');
  }

  const pageData = result.data;

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            pageData.structuredData.localBusiness,
            pageData.structuredData.faqPage,
            pageData.structuredData.breadcrumbList,
            ...(pageData.structuredData.services || []),
            ...(pageData.structuredData.aggregateRating
              ? [pageData.structuredData.aggregateRating]
              : []),
            ...(pageData.structuredData.place ? [pageData.structuredData.place] : []),
          ]),
        }}
      />

      {/* Main Content */}
      <div className="min-h-screen bg-white">
        {/* Breadcrumb Navigation */}
        <nav className="bg-gray-50 py-4" aria-label="Breadcrumb">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ol className="flex items-center space-x-2 text-sm text-gray-600">
              {pageData.internalLinks.navigation.breadcrumbs.map((crumb, index) => (
                <li key={index} className="flex items-center">
                  {index > 0 && <span className="mx-2">/</span>}
                  {index === pageData.internalLinks.navigation.breadcrumbs.length - 1 ? (
                    <span className="font-medium text-gray-900">{crumb.text}</span>
                  ) : (
                    <a href={crumb.url} className="hover:text-purple-600 transition-colors">
                      {crumb.text}
                    </a>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">{pageData.metadata.h1}</h1>
              <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
                {pageData.content.hero.subheadline}
              </p>

              {/* Trust Signals */}
              <div className="flex flex-wrap justify-center gap-4 mb-8">
                {pageData.content.hero.trustSignals.map((signal, index) => (
                  <div
                    key={index}
                    className="bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-sm"
                  >
                    {signal}
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href={pageData.content.cta.primary.url}
                  className="bg-white text-purple-600 font-semibold px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
                >
                  {pageData.content.cta.primary.text}
                </a>
                <a
                  href={pageData.content.cta.secondary.url}
                  className="border-2 border-white text-white font-semibold px-8 py-4 rounded-lg hover:bg-white hover:text-purple-600 transition-colors inline-flex items-center justify-center"
                >
                  {pageData.content.cta.secondary.text}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {pageData.metadata.h2Tags[1]}
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-4">
                We provide comprehensive {SAMPLE_BUSINESS_PROFILE.services[0].toLowerCase()}{' '}
                solutions tailored specifically for {cityData.name} businesses.
              </p>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Ready to dominate local search?{' '}
                <a
                  href="/calculators/pricing"
                  className="text-purple-600 hover:text-purple-800 underline"
                >
                  Calculate your marketing ROI
                </a>{' '}
                and see how our AI platform can transform your {cityData.name} business.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {pageData.content.services.primary.map((service, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{service.title}</h3>
                  <p className="text-gray-600 mb-6">{service.description}</p>
                  <ul className="space-y-2">
                    {service.benefits.map((benefit, benefitIndex) => (
                      <li key={benefitIndex} className="flex items-center text-sm text-gray-700">
                        <svg
                          className="w-4 h-4 text-green-500 mr-2 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Local Info Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  {pageData.metadata.h2Tags[2]}
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                  {pageData.content.localInfo.areaDescription}
                </p>

                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  Why Choose Us in {cityData.name}?
                </h3>
                <ul className="space-y-3">
                  {pageData.content.localInfo.whyChooseUs.map((reason, index) => (
                    <li key={index} className="flex items-start">
                      <svg
                        className="w-5 h-5 text-purple-600 mr-3 mt-1 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-gray-700">{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-8">
                <h3 className="text-2xl font-semibold text-gray-900 mb-6">
                  {pageData.metadata.h2Tags[3]}
                </h3>
                <div className="space-y-6">
                  {pageData.content.localInfo.localTestimonials.map((testimonial, index) => (
                    <div key={index} className="bg-white rounded-lg p-6 shadow-sm">
                      <p className="text-gray-600 italic mb-4">"{testimonial.quote}"</p>
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-purple-600 font-semibold">
                            {testimonial.author.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{testimonial.author}</p>
                          <p className="text-sm text-gray-600">{testimonial.location}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-xl text-gray-600">
                Common questions about our {SAMPLE_BUSINESS_PROFILE.services[0].toLowerCase()}{' '}
                services in {cityData.name}
              </p>
            </div>

            <div className="space-y-6">
              {pageData.content.faq.map((faq, index) => (
                <details key={index} className="bg-white rounded-lg shadow-sm">
                  <summary className="cursor-pointer p-6 font-semibold text-gray-900 hover:text-purple-600 transition-colors">
                    {faq.question}
                  </summary>
                  <div className="px-6 pb-6 text-gray-600">{faq.answer}</div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 bg-purple-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              {pageData.metadata.h2Tags[4]}
            </h2>
            <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
              Ready to grow your business with professional{' '}
              {SAMPLE_BUSINESS_PROFILE.services[0].toLowerCase()}
              in {cityData.name}? Contact our local team today for a free consultation.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={pageData.content.cta.primary.url}
                className="bg-white text-purple-600 font-semibold px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
              >
                {pageData.content.cta.primary.text}
              </a>
              <a
                href={pageData.content.cta.secondary.url}
                className="border-2 border-white text-white font-semibold px-8 py-4 rounded-lg hover:bg-white hover:text-purple-600 transition-colors inline-flex items-center justify-center"
              >
                {pageData.content.cta.secondary.text}
              </a>
            </div>
          </div>
        </section>

        {/* Internal Links Section */}
        <section className="py-12 bg-gray-100 border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Related Cities */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Other Service Areas</h3>
                <ul className="space-y-2">
                  {pageData.internalLinks.contentLinks.relatedCities.map((city, index) => (
                    <li key={index}>
                      <a
                        href={city.url}
                        className="text-purple-600 hover:text-purple-800 transition-colors"
                      >
                        {city.linkText}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Service Pages */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Our Services</h3>
                <ul className="space-y-2">
                  {pageData.internalLinks.contentLinks.servicePages.map((service, index) => (
                    <li key={index}>
                      <a
                        href={service.url}
                        className="text-purple-600 hover:text-purple-800 transition-colors"
                      >
                        {service.linkText}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Core Pages */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Learn More</h3>
                <ul className="space-y-2">
                  {pageData.internalLinks.contentLinks.corePages
                    .filter((page) => page.placement === 'content')
                    .map((page, index) => (
                      <li key={index}>
                        <a
                          href={page.url}
                          className="text-purple-600 hover:text-purple-800 transition-colors"
                        >
                          {page.linkText}
                        </a>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

// Set revalidation for static generation
export const revalidate = 3600; // Revalidate every hour
