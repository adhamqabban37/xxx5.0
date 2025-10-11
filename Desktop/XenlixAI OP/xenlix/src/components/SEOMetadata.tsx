import { Metadata } from 'next';
import { generateCanonicalUrl, shouldNoindex as shouldNoindexUtil } from '@/lib/canonical-server';

interface SEOMetadataConfig {
  // Basic metadata
  title: string;
  description: string;
  keywords?: string;

  // Canonical configuration
  pathname: string;
  searchParams?: { [key: string]: string | string[] | undefined };
  baseUrl?: string;
  preserveParams?: string[];

  // Indexing directives
  forceNoindex?: boolean;
  forceIndex?: boolean;

  // Open Graph
  ogImage?: string;
  ogType?: 'website' | 'article' | 'book' | 'profile';

  // Additional metadata
  alternateLanguages?: { [lang: string]: string };
  verification?: {
    google?: string;
    bing?: string;
  };
}

/**
 * Generate normalized metadata with proper canonical and indexing directives
 */
export async function generateSEOMetadata(config: SEOMetadataConfig): Promise<Metadata> {
  const {
    title,
    description,
    keywords,
    pathname,
    searchParams,
    baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://xenlix.ai',
    preserveParams = ['id', 'slug', 'category', 'type', 'template', 'page'],
    forceNoindex,
    forceIndex,
    ogImage,
    ogType = 'website',
    alternateLanguages,
    verification,
  } = config;

  // Generate canonical URL
  const canonicalUrl = await generateCanonicalUrl(pathname, searchParams, {
    baseUrl,
    preserveParams,
    forceHttps: true,
    forceLowercase: true,
    removeTrailingSlash: true,
  });

  // Determine indexing directive
  let shouldNoindex = false;

  if (forceNoindex) {
    shouldNoindex = true;
  } else if (forceIndex) {
    shouldNoindex = false;
  } else {
    // Use async shouldNoindexUtil
    shouldNoindex = await shouldNoindexUtil(pathname, searchParams);
  }

  // Build robots directive
  const robots = shouldNoindex ? 'noindex, nofollow' : 'index, follow';

  // Build metadata object
  const metadata: Metadata = {
    title,
    description,
    keywords,

    // Canonical URL
    alternates: {
      canonical: canonicalUrl,
      ...(alternateLanguages && { languages: alternateLanguages }),
    },

    // Robots directive
    robots: {
      index: !shouldNoindex,
      follow: !shouldNoindex,
      googleBot: {
        index: !shouldNoindex,
        follow: !shouldNoindex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    // Open Graph
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'XenlixAI',
      type: ogType,
      locale: 'en_US',
      ...(ogImage && {
        images: [
          {
            url: ogImage.startsWith('http') ? ogImage : `${baseUrl}${ogImage}`,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      }),
    },

    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      creator: '@XenlixAI',
      ...(ogImage && {
        images: [ogImage.startsWith('http') ? ogImage : `${baseUrl}${ogImage}`],
      }),
    },

    // Additional metadata
    authors: [{ name: 'XenlixAI' }],
    creator: 'XenlixAI',
    publisher: 'XenlixAI',

    // Verification
    ...(verification && { verification }),

    // Format detection
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },

    // Additional robots meta
    other: {
      robots: robots,
      ...(shouldNoindex && { googlebot: 'noindex, nofollow' }),
    },
  };

  return metadata;
}

/**
 * Quick metadata generator for common page types
 */
export const MetadataTemplates = {
  // Homepage
  homepage: async (searchParams?: {
    [key: string]: string | string[] | undefined;
  }): Promise<Metadata> =>
    await generateSEOMetadata({
      title: 'XenlixAI - AI-Powered SEO & AEO Marketing Platform',
      description:
        "Transform your marketing with XenlixAI's AI-powered SEO and AEO platform. Get discovered in ChatGPT, Claude, and traditional search engines.",
      pathname: '/',
      searchParams,
      ogImage: '/og-homepage.jpg',
    }),

  // City pages
  cityPage: async (
    cityName: string,
    stateAbbr: string,
    pathname: string,
    searchParams?: { [key: string]: string | string[] | undefined }
  ): Promise<Metadata> =>
    await generateSEOMetadata({
      title: `AI SEO Services in ${cityName}, ${stateAbbr} | XenlixAI Local Marketing`,
      description: `Professional AI-powered SEO and local marketing services in ${cityName}, ${stateAbbr}. Boost your local visibility and drive more customers with XenlixAI.`,
      pathname,
      searchParams,
      ogImage: '/og-city-default.jpg',
    }),

  // Tool pages
  toolPage: async (
    toolName: string,
    toolDescription: string,
    pathname: string,
    searchParams?: { [key: string]: string | string[] | undefined }
  ): Promise<Metadata> =>
    await generateSEOMetadata({
      title: `${toolName} | Free SEO Tool - XenlixAI`,
      description: toolDescription,
      pathname,
      searchParams,
      ogImage: '/og-tools.jpg',
    }),

  // Private/authenticated pages
  privatePage: async (
    title: string,
    description: string,
    pathname: string,
    searchParams?: { [key: string]: string | string[] | undefined }
  ): Promise<Metadata> =>
    await generateSEOMetadata({
      title,
      description,
      pathname,
      searchParams,
      forceNoindex: true,
    }),

  // Case study pages
  caseStudy: async (
    title: string,
    description: string,
    pathname: string,
    searchParams?: { [key: string]: string | string[] | undefined }
  ): Promise<Metadata> =>
    await generateSEOMetadata({
      title: `${title} | Case Study - XenlixAI`,
      description,
      pathname,
      searchParams,
      ogImage: '/og-case-studies.jpg',
    }),
};

/**
 * Generate structured metadata export for layout/page files
 */
export async function createMetadataExport(config: SEOMetadataConfig) {
  const metadata = await generateSEOMetadata(config);
  return {
    ...metadata,
    // Add viewport for mobile optimization
    viewport: 'width=device-width, initial-scale=1',
    // Add theme color
    themeColor: '#6366f1',
    // Add manifest
    manifest: '/site.webmanifest',
  };
}
