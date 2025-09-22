import { MetadataRoute } from 'next'

// Import our canonical normalization
import { normalizeCanonicalUrl } from '@/components/CanonicalNormalization'

// Get city database for dynamic routes
import { getCityDatabase } from '@/lib/sitemap-generator'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://xenlix.ai'
const MAX_URLS_PER_SITEMAP = 50000

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const allUrls: MetadataRoute.Sitemap = []
  
  // Core pages with canonical URLs
  const corePages = [
    {
      url: normalizeCanonicalUrl('/', null),
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: normalizeCanonicalUrl('/signup', null),
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: normalizeCanonicalUrl('/contact', null),
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: normalizeCanonicalUrl('/plans', null),
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: normalizeCanonicalUrl('/vs-competitors', null),
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: normalizeCanonicalUrl('/case-studies', null),
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: normalizeCanonicalUrl('/seo-analyzer', null),
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: normalizeCanonicalUrl('/schema-generator', null),
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: normalizeCanonicalUrl('/ai-seo-automation', null),
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: normalizeCanonicalUrl('/ai-website-builder', null),
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: normalizeCanonicalUrl('/tools/json-ld', null),
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: normalizeCanonicalUrl('/calculators/pricing', null),
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: normalizeCanonicalUrl('/calculators/roi', null),
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: normalizeCanonicalUrl('/aeo-scan', null),
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: normalizeCanonicalUrl('/ads', null),
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: normalizeCanonicalUrl('/business/import', null),
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    // Special Dallas page
    {
      url: normalizeCanonicalUrl('/dallas', null),
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
  ]

  allUrls.push(...corePages)

  // Dynamic city pages
  try {
    const cityDatabase = await getCityDatabase()
    const cityUrls = Object.keys(cityDatabase).map(citySlug => ({
      url: normalizeCanonicalUrl(`/${citySlug}`, null),
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
    
    allUrls.push(...cityUrls)
  } catch (error) {
    console.warn('Failed to load city database for sitemap:', error)
  }

  // Case study pages
  try {
    const caseStudyPages = [
      'auto-detailing-dallas',
      'consulting-firm-lead-generation', 
      'dental-practice-ai-optimization',
      'restaurant-chain-expansion',
      'saas-blended-cac-reduction'
    ]
    
    const caseStudyUrls = caseStudyPages.map(slug => ({
      url: normalizeCanonicalUrl(`/case-studies/${slug}`, null),
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))
    
    allUrls.push(...caseStudyUrls)
  } catch (error) {
    console.warn('Failed to generate case study URLs for sitemap:', error)
  }

  // Limit to MAX_URLS_PER_SITEMAP
  const limitedUrls = allUrls.slice(0, MAX_URLS_PER_SITEMAP)
  
  console.log(`Generated sitemap with ${limitedUrls.length} URLs (limit: ${MAX_URLS_PER_SITEMAP})`)
  
  return limitedUrls
}