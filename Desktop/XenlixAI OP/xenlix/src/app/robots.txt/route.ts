import { NextResponse } from 'next/server';

export async function GET() {
  const isProduction = process.env.APP_ENV === 'production';
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://xenlix.ai';
  
  if (isProduction) {
    const robots = `User-agent: *
Allow: /

# Crawl-delay for respectful crawling
Crawl-delay: 1

# Disallow admin and sensitive paths
Disallow: /dashboard/
Disallow: /onboarding/
Disallow: /api/
Disallow: /_next/
Disallow: /admin/
Disallow: /private/
Disallow: /temp/
Disallow: /.well-known/
Disallow: /checkout/success/

# Disallow search and filter URLs with tracking parameters
Disallow: /*?utm_*
Disallow: /*?ref=*
Disallow: /*?source=*
Disallow: /*?campaign=*
Disallow: /*?gclid=*
Disallow: /*?fbclid=*
Disallow: /*?msclkid=*

# Allow important static assets and tools
Allow: /robots.txt
Allow: /sitemap.xml
Allow: /favicon.ico
Allow: /seo-analyzer
Allow: /schema-generator
Allow: /aeo-scan
Allow: /case-studies/
Allow: /calculators/

# Special rules for different crawlers
User-agent: Googlebot
Allow: /
Crawl-delay: 1

User-agent: Bingbot
Allow: /
Crawl-delay: 2

User-agent: facebookexternalhit
Allow: /
Allow: /case-studies/
Allow: /vs-competitors
Allow: /plans

# Block resource-heavy crawlers on development endpoints
User-agent: SemrushBot
Disallow: /api/
Crawl-delay: 10

User-agent: AhrefsBot
Disallow: /api/
Crawl-delay: 10

User-agent: MJ12bot
Disallow: /

# Sitemaps
Sitemap: ${baseUrl}/sitemap.xml`;
    
    return new NextResponse(robots, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    });
  } else {
    // Staging/preview: block all crawlers except specific testing bots
    const robots = `User-agent: *
Disallow: /

# Allow only specific testing crawlers if needed
User-agent: GoogleBot-Mobile
Disallow: /

User-agent: GoogleBot
Disallow: /

# No sitemaps on staging
# Sitemap: ${baseUrl}/sitemap.xml`;
    
    return new NextResponse(robots, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour on staging
      },
    });
  }
}