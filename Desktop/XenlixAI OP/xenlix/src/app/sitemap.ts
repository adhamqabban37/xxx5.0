import { MetadataRoute } from 'next';
export const revalidate = 60;

// Import server-safe canonical normalization
import { normalizeCanonicalUrlServer } from '@/lib/url-server';

// Get city database for dynamic routes
import { getCityDatabase } from '@/lib/sitemap-generator';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://xenlix.ai';
const MAX_URLS_PER_SITEMAP = 50000;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const allUrls: MetadataRoute.Sitemap = [];

  // Core pages with canonical URLs
  const corePages = [
    {
      url: normalizeCanonicalUrlServer('/'),
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: normalizeCanonicalUrlServer('/signup'),
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: normalizeCanonicalUrlServer('/contact'),
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: normalizeCanonicalUrlServer('/plans'),
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: normalizeCanonicalUrlServer('/vs-competitors'),
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: normalizeCanonicalUrlServer('/case-studies'),
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: normalizeCanonicalUrlServer('/seo-analyzer'),
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: normalizeCanonicalUrlServer('/schema-generator'),
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: normalizeCanonicalUrlServer('/ai-seo-automation'),
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: normalizeCanonicalUrlServer('/ai-website-builder'),
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: normalizeCanonicalUrlServer('/tools/json-ld'),
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: normalizeCanonicalUrlServer('/calculators/pricing'),
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: normalizeCanonicalUrlServer('/calculators/roi'),
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: normalizeCanonicalUrlServer('/aeo-scan'),
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: normalizeCanonicalUrlServer('/ads'),
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: normalizeCanonicalUrlServer('/business/import'),
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    // Special Dallas page
    {
      url: normalizeCanonicalUrlServer('/dallas'),
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
  ];

  allUrls.push(...corePages);

  // Dynamic city pages
  try {
    const cityDatabase = await getCityDatabase();
    const cityUrls = Object.keys(cityDatabase).map((citySlug) => ({
      url: normalizeCanonicalUrlServer(`/${citySlug}`),
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    allUrls.push(...cityUrls);
  } catch (error) {
    console.warn('Failed to load city database for sitemap:', error);
  }

  // Case study pages
  try {
    const caseStudyPages = [
      'auto-detailing-dallas',
      'consulting-firm-lead-generation',
      'dental-practice-ai-optimization',
      'restaurant-chain-expansion',
      'saas-blended-cac-reduction',
    ];

    const caseStudyUrls = caseStudyPages.map((slug) => ({
      url: normalizeCanonicalUrlServer(`/case-studies/${slug}`),
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));

    allUrls.push(...caseStudyUrls);
  } catch (error) {
    console.warn('Failed to generate case study URLs for sitemap:', error);
  }

  // Limit to MAX_URLS_PER_SITEMAP
  const limitedUrls = allUrls.slice(0, MAX_URLS_PER_SITEMAP);

  console.log(`Generated sitemap with ${limitedUrls.length} URLs (limit: ${MAX_URLS_PER_SITEMAP})`);

  return limitedUrls;
}
