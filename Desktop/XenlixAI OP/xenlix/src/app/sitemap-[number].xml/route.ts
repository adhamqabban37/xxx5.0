import { NextRequest, NextResponse } from 'next/server'
import { normalizeCanonicalUrl } from '@/components/CanonicalNormalization'
import { getCityDatabase } from '@/lib/sitemap-generator'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://xenlix.ai'
const MAX_URLS_PER_SITEMAP = 50000

/**
 * Generate paginated sitemaps for large numbers of URLs
 * Route: /sitemap-[number].xml
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { number: string } }
) {
  try {
    const sitemapNumber = parseInt(params.number)
    
    if (isNaN(sitemapNumber) || sitemapNumber < 1) {
      return new NextResponse('Invalid sitemap number', { status: 400 })
    }

    // Generate the specific sitemap
    const sitemapXml = await generatePaginatedSitemap(sitemapNumber)
    
    if (!sitemapXml) {
      return new NextResponse('Sitemap not found', { status: 404 })
    }

    return new NextResponse(sitemapXml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    })
  } catch (error) {
    console.error(`Error generating sitemap-${params.number}.xml:`, error)
    return new NextResponse('Error generating sitemap', { status: 500 })
  }
}

async function generatePaginatedSitemap(sitemapNumber: number): Promise<string | null> {
  try {
    const allUrls: Array<{
      url: string
      lastModified: Date
      changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
      priority: number
    }> = []

    // Get all dynamic URLs (excluding core pages which are in main sitemap)
    const cityDatabase = await getCityDatabase()
    
    // City pages
    Object.keys(cityDatabase).forEach(citySlug => {
      allUrls.push({
        url: normalizeCanonicalUrl(`/${citySlug}`, null),
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8
      })
    })

    // Additional content types can be added here
    // Example: Blog posts, product pages, etc.

    // Calculate pagination
    const startIndex = (sitemapNumber - 1) * MAX_URLS_PER_SITEMAP
    const endIndex = startIndex + MAX_URLS_PER_SITEMAP
    const paginatedUrls = allUrls.slice(startIndex, endIndex)

    if (paginatedUrls.length === 0) {
      return null // No URLs for this sitemap number
    }

    // Generate XML
    const urlEntries = paginatedUrls.map(urlEntry => `
  <url>
    <loc>${urlEntry.url}</loc>
    <lastmod>${urlEntry.lastModified.toISOString()}</lastmod>
    <changefreq>${urlEntry.changeFrequency}</changefreq>
    <priority>${urlEntry.priority}</priority>
  </url>`).join('')

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Paginated sitemap ${sitemapNumber} - ${paginatedUrls.length} URLs -->${urlEntries}
</urlset>`

  } catch (error) {
    console.error('Error in generatePaginatedSitemap:', error)
    return null
  }
}