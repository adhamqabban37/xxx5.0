import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const ExtractRequestSchema = z.object({
  websiteUrl: z.string().url('Invalid URL format'),
});

interface ExtractedData {
  url: string;
  title?: string;
  meta: {
    description?: string;
    keywords?: string;
    author?: string;
    viewport?: string;
    robots?: string;
    canonical?: string;
  };
  openGraph: {
    title?: string;
    description?: string;
    image?: string;
    type?: string;
    url?: string;
    siteName?: string;
  };
  twitter: {
    card?: string;
    title?: string;
    description?: string;
    image?: string;
    creator?: string;
  };
  jsonLd: any[];
  business?: {
    name?: string;
    address?: string;
    phone?: string;
    hours?: string[];
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  technical: {
    hasHttps: boolean;
    hasRobots: boolean;
    hasSitemap: boolean;
    cms?: string;
    favicon?: string;
    languages?: string[];
    hreflang?: Array<{ lang: string; url: string }>;
    pageSpeedHints?: {
      loadTime?: number;
      performance?: 'fast' | 'average' | 'slow';
    };
  };
  links: {
    internal: number;
    external: number;
    sitemap?: string[];
    navigation?: Array<{ text: string; url: string }>;
  };
  content: {
    headings: {
      h1?: string[];
      h2?: string[];
      h3?: string[];
    };
    images: Array<{
      src: string;
      alt?: string;
      title?: string;
    }>;
    wordCount?: number;
  };
}

function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);

    // Ensure HTTPS if no protocol specified
    if (!url.startsWith('http')) {
      urlObj.protocol = 'https:';
    }

    // Remove trailing slash
    if (urlObj.pathname.endsWith('/') && urlObj.pathname !== '/') {
      urlObj.pathname = urlObj.pathname.slice(0, -1);
    }

    return urlObj.toString();
  } catch {
    throw new Error('Invalid URL format');
  }
}

function validateUrl(url: string): void {
  const urlObj = new URL(url);

  // Reject localhost, private IPs, and obvious invalid domains
  if (
    urlObj.hostname === 'localhost' ||
    urlObj.hostname.startsWith('127.') ||
    urlObj.hostname.startsWith('192.168.') ||
    urlObj.hostname.startsWith('10.') ||
    urlObj.hostname.includes('test.') ||
    urlObj.hostname.length < 4
  ) {
    throw new Error('Invalid or private URL not allowed');
  }
}

async function extractWebsiteData(url: string): Promise<ExtractedData> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'XenlixAI SEO Analyzer Bot/1.0 (+https://xenlix.ai)',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const urlObj = new URL(url);

    // Parse HTML content
    const extractedData: ExtractedData = {
      url,
      title: extractTitle(html),
      meta: extractMeta(html),
      openGraph: extractOpenGraph(html),
      twitter: extractTwitter(html),
      jsonLd: extractJsonLd(html),
      business: extractBusinessInfo(html),
      technical: {
        hasHttps: urlObj.protocol === 'https:',
        hasRobots: html.toLowerCase().includes('robots.txt'),
        hasSitemap: html.toLowerCase().includes('sitemap'),
        cms: detectCMS(html),
        favicon: extractFavicon(html, url),
        languages: extractLanguages(html),
        hreflang: extractHreflang(html),
        pageSpeedHints: {
          loadTime: Date.now() - performance.now(),
          performance: 'average', // Will be enhanced with actual metrics
        },
      },
      links: extractLinks(html, url),
      content: extractContent(html),
    };

    return extractedData;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout - website took too long to respond');
    }

    throw error;
  }
}

function extractTitle(html: string): string | undefined {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? match[1].trim() : undefined;
}

function extractMeta(html: string) {
  const meta: any = {};

  // Description
  const descMatch = html.match(
    /<meta[^>]*name=[\"']description[\"'][^>]*content=[\"']([^\"']+)[\"']/i
  );
  if (descMatch) meta.description = descMatch[1];

  // Keywords
  const keywordsMatch = html.match(
    /<meta[^>]*name=[\"']keywords[\"'][^>]*content=[\"']([^\"']+)[\"']/i
  );
  if (keywordsMatch) meta.keywords = keywordsMatch[1];

  // Author
  const authorMatch = html.match(
    /<meta[^>]*name=[\"']author[\"'][^>]*content=[\"']([^\"']+)[\"']/i
  );
  if (authorMatch) meta.author = authorMatch[1];

  // Robots
  const robotsMatch = html.match(
    /<meta[^>]*name=[\"']robots[\"'][^>]*content=[\"']([^\"']+)[\"']/i
  );
  if (robotsMatch) meta.robots = robotsMatch[1];

  // Canonical
  const canonicalMatch = html.match(
    /<link[^>]*rel=[\"']canonical[\"'][^>]*href=[\"']([^\"']+)[\"']/i
  );
  if (canonicalMatch) meta.canonical = canonicalMatch[1];

  return meta;
}

function extractOpenGraph(html: string) {
  const og: any = {};

  const ogMatches = html.match(
    /<meta[^>]*property=[\"']og:([^\"']+)[\"'][^>]*content=[\"']([^\"']+)[\"']/gi
  );
  if (ogMatches) {
    ogMatches.forEach((match) => {
      const propMatch = match.match(/property=[\"']og:([^\"']+)[\"']/);
      const contentMatch = match.match(/content=[\"']([^\"']+)[\"']/);
      if (propMatch && contentMatch) {
        const property = propMatch[1];
        const content = contentMatch[1];
        og[property] = content;
      }
    });
  }

  return og;
}

function extractTwitter(html: string) {
  const twitter: any = {};

  const twitterMatches = html.match(
    /<meta[^>]*name=[\"']twitter:([^\"']+)[\"'][^>]*content=[\"']([^\"']+)[\"']/gi
  );
  if (twitterMatches) {
    twitterMatches.forEach((match) => {
      const nameMatch = match.match(/name=[\"']twitter:([^\"']+)[\"']/);
      const contentMatch = match.match(/content=[\"']([^\"']+)[\"']/);
      if (nameMatch && contentMatch) {
        const property = nameMatch[1];
        const content = contentMatch[1];
        twitter[property] = content;
      }
    });
  }

  return twitter;
}

function extractJsonLd(html: string): any[] {
  const scripts = html.match(
    /<script[^>]*type=[\"']application\/ld\+json[\"'][^>]*>([^<]+)<\/script>/gi
  );
  const jsonLdArray: any[] = [];

  if (scripts) {
    scripts.forEach((script) => {
      try {
        const jsonMatch = script.match(/>([^<]+)</);
        if (jsonMatch) {
          const jsonData = JSON.parse(jsonMatch[1]);
          jsonLdArray.push(jsonData);
        }
      } catch {
        // Ignore invalid JSON-LD
      }
    });
  }

  return jsonLdArray;
}

function extractBusinessInfo(html: string) {
  const business: any = {};

  // Try to find business name from JSON-LD, meta, or title
  const jsonLd = extractJsonLd(html);
  const orgSchema = jsonLd.find(
    (item) =>
      item['@type'] === 'Organization' ||
      item['@type'] === 'LocalBusiness' ||
      item['@type']?.includes?.('Business')
  );

  if (orgSchema) {
    business.name = orgSchema.name;
    if (orgSchema.address) {
      business.address =
        typeof orgSchema.address === 'string'
          ? orgSchema.address
          : `${orgSchema.address.streetAddress || ''} ${orgSchema.address.addressLocality || ''} ${orgSchema.address.addressRegion || ''}`.trim();
    }
    business.phone = orgSchema.telephone;
    business.hours = orgSchema.openingHours;

    if (orgSchema.geo) {
      business.coordinates = {
        lat: parseFloat(orgSchema.geo.latitude),
        lng: parseFloat(orgSchema.geo.longitude),
      };
    }
  }

  return Object.keys(business).length > 0 ? business : undefined;
}

function detectCMS(html: string): string | undefined {
  if (html.includes('wp-content') || html.includes('wordpress')) return 'WordPress';
  if (html.includes('shopify')) return 'Shopify';
  if (html.includes('wix.com')) return 'Wix';
  if (html.includes('squarespace')) return 'Squarespace';
  if (html.includes('webflow')) return 'Webflow';
  if (html.includes('drupal')) return 'Drupal';
  if (html.includes('joomla')) return 'Joomla';
  return undefined;
}

function extractFavicon(html: string, baseUrl: string): string | undefined {
  const faviconMatch = html.match(
    /<link[^>]*rel=[\"'][^\"']*icon[^\"']*[\"'][^>]*href=[\"']([^\"']+)[\"']/i
  );
  if (faviconMatch) {
    const href = faviconMatch[1];
    return href.startsWith('http') ? href : new URL(href, baseUrl).toString();
  }
  return undefined;
}

function extractLanguages(html: string): string[] {
  const languages: string[] = [];
  const langMatch = html.match(/<html[^>]*lang=[\"']([^\"']+)[\"']/i);
  if (langMatch) {
    languages.push(langMatch[1]);
  }
  return languages;
}

function extractHreflang(html: string): Array<{ lang: string; url: string }> {
  const hreflang: Array<{ lang: string; url: string }> = [];
  const hreflangMatches = html.match(
    /<link[^>]*rel=[\"']alternate[\"'][^>]*hreflang=[\"']([^\"']+)[\"'][^>]*href=[\"']([^\"']+)[\"']/gi
  );

  if (hreflangMatches) {
    hreflangMatches.forEach((match) => {
      const langMatch = match.match(/hreflang=[\"']([^\"']+)[\"']/);
      const urlMatch = match.match(/href=[\"']([^\"']+)[\"']/);
      if (langMatch && urlMatch) {
        hreflang.push({ lang: langMatch[1], url: urlMatch[1] });
      }
    });
  }

  return hreflang;
}

function extractLinks(html: string, baseUrl: string) {
  const links = html.match(/<a[^>]*href=[\"']([^\"']+)[\"']/gi) || [];
  let internal = 0;
  let external = 0;
  const sitemap: string[] = [];
  const navigation: Array<{ text: string; url: string }> = [];

  const urlObj = new URL(baseUrl);

  links.forEach((link) => {
    const hrefMatch = link.match(/href=[\"']([^\"']+)[\"']/);
    const textMatch = link.match(/>([^<]+)</);

    if (hrefMatch) {
      const href = hrefMatch[1];
      const text = textMatch ? textMatch[1].trim() : '';

      try {
        const linkUrl = new URL(href, baseUrl);

        if (linkUrl.hostname === urlObj.hostname) {
          internal++;
          if (href.includes('sitemap')) {
            sitemap.push(href);
          }
        } else {
          external++;
        }

        if (text && text.length < 50) {
          navigation.push({ text, url: href });
        }
      } catch {
        // Invalid URL, count as internal
        internal++;
      }
    }
  });

  return { internal, external, sitemap, navigation: navigation.slice(0, 10) };
}

function extractContent(html: string) {
  const content: any = { headings: {}, images: [] };

  // Headings
  const h1Matches = html.match(/<h1[^>]*>([^<]+)<\/h1>/gi);
  if (h1Matches) {
    content.headings.h1 = h1Matches.map((h) => h.replace(/<[^>]+>/g, '').trim());
  }

  const h2Matches = html.match(/<h2[^>]*>([^<]+)<\/h2>/gi);
  if (h2Matches) {
    content.headings.h2 = h2Matches.map((h) => h.replace(/<[^>]+>/g, '').trim()).slice(0, 5);
  }

  // Images
  const imgMatches = html.match(/<img[^>]*>/gi);
  if (imgMatches) {
    imgMatches.slice(0, 10).forEach((img) => {
      const srcMatch = img.match(/src=[\"']([^\"']+)[\"']/);
      const altMatch = img.match(/alt=[\"']([^\"']+)[\"']/);
      const titleMatch = img.match(/title=[\"']([^\"']+)[\"']/);

      if (srcMatch) {
        content.images.push({
          src: srcMatch[1],
          alt: altMatch ? altMatch[1] : undefined,
          title: titleMatch ? titleMatch[1] : undefined,
        });
      }
    });
  }

  // Word count (approximate)
  const textContent = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  content.wordCount = textContent.split(' ').filter((word) => word.length > 0).length;

  return content;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { websiteUrl } = ExtractRequestSchema.parse(body);

    // Normalize and validate URL
    const normalizedUrl = normalizeUrl(websiteUrl);
    validateUrl(normalizedUrl);

    console.log(`[Extract] Starting extraction for: ${normalizedUrl}`);
    const startTime = Date.now();

    // Extract website data
    const extractedData = await extractWebsiteData(normalizedUrl);
    const processingTime = Date.now() - startTime;

    console.log(`[Extract] Completed extraction in ${processingTime}ms`);

    return NextResponse.json({
      success: true,
      data: extractedData,
      meta: {
        extractedAt: new Date().toISOString(),
        processingTime: `${processingTime}ms`,
        url: normalizedUrl,
      },
    });
  } catch (error) {
    console.error('[Extract] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request format',
          details: error.errors[0]?.message || 'Validation failed',
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          type: 'extraction_error',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error during extraction',
        type: 'server_error',
      },
      { status: 500 }
    );
  }
}
