import * as cheerio from 'cheerio';
import { ExtractionResult, NormalizedBusiness } from '@/types/seo';

/**
 * Extract business data from a webpage URL
 * Server-side only function for HTML parsing and data extraction
 */
export async function extractFromUrl(url: string): Promise<ExtractionResult> {
  const startTime = Date.now();

  try {
    // Validate URL
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid URL provided');
    }

    let validUrl: URL;
    try {
      validUrl = new URL(url);
      if (!['http:', 'https:'].includes(validUrl.protocol)) {
        throw new Error('Only HTTP/HTTPS URLs are supported');
      }
    } catch {
      throw new Error('Invalid URL format');
    }

    // Fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(validUrl.toString(), {
      signal: controller.signal,
      headers: {
        'User-Agent': 'XenlixAI-SEO-Extractor/1.0',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        DNT: '1',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract data
    const data: Partial<NormalizedBusiness> & { faqs?: { q: string; a: string }[] } = {};

    // Business name extraction
    data.name = extractBusinessName($, validUrl.hostname);

    // URL (canonical or current)
    data.url = extractCanonicalUrl($, validUrl.toString());

    // Logo extraction
    data.logo = extractLogo($, validUrl.origin);

    // Phone extraction
    data.phone = extractPhone($);

    // Address extraction (NAP)
    data.address = extractAddress($);

    // Services extraction
    data.services = extractServices($);

    // Social profiles extraction
    data.social = extractSocialProfiles($);

    // Hours extraction
    data.hours = extractHours($);

    // Geo coordinates extraction
    data.geo = extractGeoCoordinates($);

    // Rating and review count
    const ratings = extractRatings($);
    if (ratings.rating !== undefined) data.rating = ratings.rating;
    if (ratings.reviewCount !== undefined) data.reviewCount = ratings.reviewCount;

    // FAQs extraction
    data.faqs = extractFAQs($);

    const duration = Date.now() - startTime;

    return { ok: true, data };
  } catch (error) {
    const duration = Date.now() - startTime;
    return { ok: false, reason: 'FETCH_OR_PARSE_FAILED' };
  }
}

function extractBusinessName($: cheerio.CheerioAPI, hostname: string): string {
  // Try multiple selectors for business name
  const selectors = [
    'h1[itemProp="name"]',
    '[itemProp="name"]',
    'meta[property="og:site_name"]',
    'meta[property="og:title"]',
    'title',
    'h1',
    '.business-name',
    '.company-name',
    '.logo-text',
  ];

  for (const selector of selectors) {
    const element = $(selector).first();
    if (element.length) {
      const text = element.attr('content') || element.text();
      if (text && text.trim()) {
        return text.trim();
      }
    }
  }

  // Fallback to hostname
  return hostname.replace('www.', '').split('.')[0];
}

function extractCanonicalUrl($: cheerio.CheerioAPI, fallbackUrl: string): string {
  const canonical = $('link[rel="canonical"]').attr('href');
  if (canonical && canonical.trim()) {
    try {
      return new URL(canonical, fallbackUrl).toString();
    } catch {
      return fallbackUrl;
    }
  }
  return fallbackUrl;
}

function extractLogo($: cheerio.CheerioAPI, origin: string): string | undefined {
  const selectors = [
    'link[rel="icon"][sizes*="192"]',
    'link[rel="apple-touch-icon"]',
    'meta[property="og:image"]',
    'img.logo',
    'img[alt*="logo" i]',
    '.logo img',
    'header img',
  ];

  for (const selector of selectors) {
    const element = $(selector).first();
    if (element.length) {
      const src = element.attr('href') || element.attr('content') || element.attr('src');
      if (src && src.trim()) {
        try {
          return new URL(src, origin).toString();
        } catch {
          continue;
        }
      }
    }
  }

  return undefined;
}

function extractPhone($: cheerio.CheerioAPI): string | undefined {
  // Try microdata first
  const itemPropPhone = $('[itemProp="telephone"]').first().text();
  if (itemPropPhone && itemPropPhone.trim()) {
    return itemPropPhone.trim();
  }

  // Look for tel: links
  const telLink = $('a[href^="tel:"]').first().attr('href');
  if (telLink) {
    return telLink.replace('tel:', '').trim();
  }

  // Pattern matching in text
  const phoneRegex = /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/;
  const bodyText = $('body').text();
  const match = bodyText.match(phoneRegex);
  if (match) {
    return match[0].trim();
  }

  return undefined;
}

function extractAddress($: cheerio.CheerioAPI): NormalizedBusiness['address'] | undefined {
  // Try structured data first
  const structuredAddress: any = {};

  const streetElement = $('[itemProp="streetAddress"]').first();
  if (streetElement.length) {
    structuredAddress.street = streetElement.text().trim();
  }

  const cityElement = $('[itemProp="addressLocality"]').first();
  if (cityElement.length) {
    structuredAddress.city = cityElement.text().trim();
  }

  const regionElement = $('[itemProp="addressRegion"]').first();
  if (regionElement.length) {
    structuredAddress.region = regionElement.text().trim();
  }

  const postalElement = $('[itemProp="postalCode"]').first();
  if (postalElement.length) {
    structuredAddress.postal = postalElement.text().trim();
  }

  const countryElement = $('[itemProp="addressCountry"]').first();
  if (countryElement.length) {
    structuredAddress.country = countryElement.text().trim();
  }

  if (Object.keys(structuredAddress).length > 0) {
    return structuredAddress;
  }

  // Look for address in common selectors
  const addressSelectors = [
    '.address',
    '.contact-address',
    '.location',
    '[class*="address"]',
    'address',
  ];

  for (const selector of addressSelectors) {
    const addressText = $(selector).first().text().trim();
    if (addressText && addressText.length > 10) {
      // Simple address parsing
      const lines = addressText
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line);
      if (lines.length >= 2) {
        return {
          street: lines[0],
          city: lines[1].split(',')[0]?.trim(),
          region: lines[1].split(',')[1]?.trim(),
          country: 'US', // Default assumption
        };
      }
    }
  }

  return undefined;
}

function extractServices($: cheerio.CheerioAPI): string[] | undefined {
  const services: string[] = [];

  // Navigation links
  $('nav a, .nav a, .menu a').each((_, element) => {
    const text = $(element).text().trim();
    if (text && text.length > 2 && text.length < 50) {
      services.push(text);
    }
  });

  // Service lists
  $('.services li, .service-list li, [class*="service"] li').each((_, element) => {
    const text = $(element).text().trim();
    if (text && text.length > 2 && text.length < 100) {
      services.push(text);
    }
  });

  // Headings that might be services
  $('h3, h4').each((_, element) => {
    const text = $(element).text().trim();
    if (text && text.length > 2 && text.length < 80) {
      services.push(text);
    }
  });

  // Remove duplicates and common navigation items
  const filtered = [...new Set(services)]
    .filter(
      (service) => !service.toLowerCase().match(/^(home|about|contact|blog|news|login|search)$/i)
    )
    .slice(0, 20); // Limit to 20 services

  return filtered.length > 0 ? filtered : undefined;
}

function extractSocialProfiles($: cheerio.CheerioAPI): string[] | undefined {
  const socialPatterns = /facebook|instagram|linkedin|yelp|maps|tiktok|twitter|x\.com/i;
  const socialUrls: string[] = [];

  $('a[href]').each((_, element) => {
    const href = $(element).attr('href');
    if (href && socialPatterns.test(href)) {
      try {
        const url = new URL(href, 'https://example.com').toString();
        socialUrls.push(url);
      } catch {
        // Invalid URL, skip
      }
    }
  });

  const unique = [...new Set(socialUrls)].slice(0, 10);
  return unique.length > 0 ? unique : undefined;
}

function extractHours($: cheerio.CheerioAPI): string[] | undefined {
  const hours: string[] = [];

  // Microdata hours
  $('[itemProp="openingHours"]').each((_, element) => {
    const hoursText = $(element).text().trim();
    if (hoursText) {
      hours.push(hoursText);
    }
  });

  // Common hour patterns
  const hourSelectors = ['.hours', '.opening-hours', '.business-hours', '[class*="hour"]'];

  for (const selector of hourSelectors) {
    $(selector).each((_, element) => {
      const text = $(element).text().trim();
      if (text && text.match(/\d{1,2}:\d{2}|closed|open/i)) {
        hours.push(text);
      }
    });
  }

  const filtered = [...new Set(hours)].slice(0, 7);
  return filtered.length > 0 ? filtered : undefined;
}

function extractGeoCoordinates($: cheerio.CheerioAPI): { lat: number; lon: number } | undefined {
  // Try meta tags first
  const lat = parseFloat($('meta[property="place:location:latitude"]').attr('content') || '');
  const lon = parseFloat($('meta[property="place:location:longitude"]').attr('content') || '');

  if (!isNaN(lat) && !isNaN(lon)) {
    return { lat, lon };
  }

  // Try microdata
  const itemLat = parseFloat($('[itemProp="latitude"]').first().text() || '');
  const itemLon = parseFloat($('[itemProp="longitude"]').first().text() || '');

  if (!isNaN(itemLat) && !isNaN(itemLon)) {
    return { lat: itemLat, lon: itemLon };
  }

  return undefined;
}

function extractRatings($: cheerio.CheerioAPI): { rating?: number; reviewCount?: number } {
  const result: { rating?: number; reviewCount?: number } = {};

  // Microdata rating
  const ratingValue = parseFloat($('[itemProp="ratingValue"]').first().text() || '');
  if (!isNaN(ratingValue) && ratingValue >= 0 && ratingValue <= 5) {
    result.rating = ratingValue;
  }

  // Review count
  const reviewCount = parseInt($('[itemProp="reviewCount"]').first().text() || '');
  if (!isNaN(reviewCount) && reviewCount >= 0) {
    result.reviewCount = reviewCount;
  }

  // Try to find star ratings in common patterns
  if (!result.rating) {
    const starText = $('.rating, .stars, [class*="rating"]').first().text();
    const starMatch = starText.match(/(\d+(?:\.\d+)?)\s*(?:\/\s*5|stars?)/i);
    if (starMatch) {
      const rating = parseFloat(starMatch[1]);
      if (rating >= 0 && rating <= 5) {
        result.rating = rating;
      }
    }
  }

  return result;
}

function extractFAQs($: cheerio.CheerioAPI): { q: string; a: string }[] | undefined {
  const faqs: { q: string; a: string }[] = [];

  // Structured data FAQs
  $('[itemType*="FAQPage"] [itemProp="mainEntity"]').each((_, entity) => {
    const question = $(entity).find('[itemProp="name"]').text().trim();
    const answer = $(entity).find('[itemProp="text"]').text().trim();
    if (question && answer) {
      faqs.push({ q: question, a: answer });
    }
  });

  // Common FAQ patterns
  $('.faq, .faqs, .frequently-asked')
    .find('dt, .question, h3, h4')
    .each((_, questionElement) => {
      const question = $(questionElement).text().trim();
      if (question && question.endsWith('?')) {
        const answerElement = $(questionElement).next('dd, .answer, p');
        const answer = answerElement.text().trim();
        if (answer && answer.length > 10) {
          faqs.push({ q: question, a: answer });
        }
      }
    });

  const unique = faqs.slice(0, 10); // Limit to 10 FAQs
  return unique.length > 0 ? unique : undefined;
}
