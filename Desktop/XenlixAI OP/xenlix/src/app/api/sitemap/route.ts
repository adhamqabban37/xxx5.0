import { NextRequest, NextResponse } from 'next/server'
import { countSitemapUrls } from '@/lib/sitemap-generator'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://xenlix.ai'

/**
 * Sitemap Ping and Validation API
 * 
 * Endpoints:
 * - POST /api/sitemap/ping - Ping search engines about sitemap updates
 * - GET /api/sitemap/validate - Validate sitemap structure and accessibility
 * - GET /api/sitemap/stats - Get sitemap statistics
 */

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'ping') {
      return await pingSitemapToSearchEngines()
    }

    return NextResponse.json(
      { error: 'Invalid action. Use ?action=ping' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Sitemap ping error:', error)
    return NextResponse.json(
      { error: 'Failed to ping sitemap' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'validate':
        return await validateSitemap()
      case 'stats':
        return await getSitemapStats()
      default:
        return NextResponse.json({
          endpoints: {
            'POST /api/sitemap/ping?action=ping': 'Ping search engines about sitemap updates',
            'GET /api/sitemap/validate?action=validate': 'Validate sitemap structure',
            'GET /api/sitemap/stats?action=stats': 'Get sitemap statistics'
          }
        })
    }
  } catch (error) {
    console.error('Sitemap API error:', error)
    return NextResponse.json(
      { error: 'API request failed' },
      { status: 500 }
    )
  }
}

async function pingSitemapToSearchEngines() {
  const sitemapUrl = `${baseUrl}/sitemap.xml`
  const encodedSitemapUrl = encodeURIComponent(sitemapUrl)
  
  const pingUrls = [
    `https://www.google.com/ping?sitemap=${encodedSitemapUrl}`,
    `https://www.bing.com/ping?sitemap=${encodedSitemapUrl}`,
  ]

  const results = []

  for (const pingUrl of pingUrls) {
    try {
      const response = await fetch(pingUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'XenlixAI Sitemap Ping Bot/1.0'
        }
      })
      
      const searchEngine = pingUrl.includes('google') ? 'Google' : 'Bing'
      
      results.push({
        searchEngine,
        status: response.status,
        success: response.ok,
        message: response.ok ? 'Sitemap pinged successfully' : `Failed with status ${response.status}`
      })
    } catch (error) {
      const searchEngine = pingUrl.includes('google') ? 'Google' : 'Bing'
      results.push({
        searchEngine,
        status: 0,
        success: false,
        message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    }
  }

  return NextResponse.json({
    success: results.some(r => r.success),
    sitemapUrl,
    results,
    timestamp: new Date().toISOString()
  })
}

async function validateSitemap() {
  try {
    // Test sitemap accessibility
    const sitemapUrl = `${baseUrl}/sitemap.xml`
    const response = await fetch(sitemapUrl)
    
    if (!response.ok) {
      return NextResponse.json({
        valid: false,
        error: `Sitemap not accessible: HTTP ${response.status}`,
        sitemapUrl
      })
    }

    const sitemapContent = await response.text()
    
    // Basic XML validation
    const isValidXml = sitemapContent.includes('<?xml') && 
                      sitemapContent.includes('<urlset') &&
                      sitemapContent.includes('</urlset>')

    // Count URLs in sitemap
    const urlMatches = sitemapContent.match(/<url>/g)
    const urlCount = urlMatches ? urlMatches.length : 0

    // Get expected URL count
    const expectedUrlCount = await countSitemapUrls()

    return NextResponse.json({
      valid: isValidXml,
      sitemapUrl,
      urlCount,
      expectedUrlCount,
      sizeMB: (sitemapContent.length / (1024 * 1024)).toFixed(2),
      contentType: response.headers.get('content-type'),
      lastModified: response.headers.get('last-modified'),
      cacheControl: response.headers.get('cache-control'),
      validationTime: new Date().toISOString()
    })

  } catch (error) {
    return NextResponse.json({
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown validation error',
      sitemapUrl: `${baseUrl}/sitemap.xml`
    })
  }
}

async function getSitemapStats() {
  try {
    const totalUrls = await countSitemapUrls()
    const maxUrlsPerSitemap = 50000
    const sitemapCount = Math.ceil(totalUrls / maxUrlsPerSitemap)
    const needsIndex = totalUrls > maxUrlsPerSitemap

    return NextResponse.json({
      totalUrls,
      maxUrlsPerSitemap,
      sitemapCount,
      needsIndex,
      mainSitemapUrl: `${baseUrl}/sitemap.xml`,
      indexUrl: needsIndex ? `${baseUrl}/sitemap-index.xml` : null,
      paginatedSitemaps: needsIndex ? 
        Array.from({ length: sitemapCount - 1 }, (_, i) => `${baseUrl}/sitemap-${i + 1}.xml`) : 
        [],
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      generatedAt: new Date().toISOString()
    })
  }
}