import { NextRequest, NextResponse } from 'next/server';
import { countSitemapUrls, shouldGenerateSitemapIndex } from '@/lib/sitemap-generator';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://xenlix.ai';
const MAX_URLS_PER_SITEMAP = 50000;

/**
 * Generate sitemap index when we have multiple sitemaps
 * This follows Google's sitemap protocol for large sites
 */
export async function GET(request: NextRequest) {
  try {
    // Count total URLs to determine if we need multiple sitemaps
    const totalUrls = await countSitemapUrls();

    if (!shouldGenerateSitemapIndex(totalUrls, MAX_URLS_PER_SITEMAP)) {
      // Redirect to main sitemap if we don't need an index
      return NextResponse.redirect(`${baseUrl}/sitemap.xml`, 301);
    }

    // Calculate number of sitemap files needed
    const sitemapCount = Math.ceil(totalUrls / MAX_URLS_PER_SITEMAP);

    // Generate sitemap index XML
    const sitemapIndexXml = generateSitemapIndexXml(sitemapCount);

    return new NextResponse(sitemapIndexXml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error generating sitemap index:', error);

    // Fallback to main sitemap on error
    return NextResponse.redirect(`${baseUrl}/sitemap.xml`, 302);
  }
}

function generateSitemapIndexXml(sitemapCount: number): string {
  const currentDate = new Date().toISOString();

  let sitemapEntries = '';

  // Generate entries for each sitemap file
  for (let i = 1; i <= sitemapCount; i++) {
    sitemapEntries += `
  <sitemap>
    <loc>${baseUrl}/sitemap-${i}.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Main sitemap with core pages -->
  <sitemap>
    <loc>${baseUrl}/sitemap.xml</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>${sitemapEntries}
</sitemapindex>`;
}
