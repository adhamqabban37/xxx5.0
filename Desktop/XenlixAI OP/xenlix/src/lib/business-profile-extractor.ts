import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';

/**
 * Business Profile interface for type safety
 */
interface BusinessProfile {
  businessName: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  hours: string | null;
  googleReviewCount: number | null;
  googleRating: number | null;
  logoUrl: string | null;
  socialProfiles: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    youtube?: string;
  };
}

/**
 * Extract business information from a website URL and Google search
 * @param url - The website URL to analyze
 * @returns BusinessProfile object with extracted data
 */
export async function getBusinessProfileFromUrl(url: string): Promise<BusinessProfile> {
  try {
    // Initialize result object
    const profile: BusinessProfile = {
      businessName: null,
      address: null,
      phone: null,
      email: null,
      website: url,
      hours: null,
      googleReviewCount: null,
      googleRating: null,
      logoUrl: null,
      socialProfiles: {}
    };

    // Step 1: Scrape the website directly
    console.log(`🔍 Scraping website: ${url}`);
    const websiteData = await scrapeWebsiteData(url);
    
    // Step 2: Extract domain for Google search
    const domain = extractDomain(url);
    console.log(`🌐 Extracted domain: ${domain}`);
    
    // Step 3: Search Google for business profile
    console.log(`🔍 Searching Google for: ${domain}`);
    const googleData = await searchGoogleBusinessProfile(domain);
    
    // Step 4: Synthesize data (prioritize Google data for accuracy)
    profile.businessName = googleData.businessName || websiteData.businessName;
    profile.address = googleData.address || websiteData.address;
    profile.phone = googleData.phone || websiteData.phone;
    profile.email = websiteData.email;
    profile.website = url;
    profile.hours = websiteData.hours;
    profile.googleReviewCount = googleData.reviewCount;
    profile.googleRating = googleData.rating;
    profile.logoUrl = websiteData.logoUrl;
    profile.socialProfiles = websiteData.socialProfiles;

    console.log(`✅ Profile extraction complete for ${domain}`);
    return profile;

  } catch (error) {
    console.error(`❌ Error extracting business profile:`, error);
    
    // Return null profile on error
    return {
      businessName: null,
      address: null,
      phone: null,
      email: null,
      website: url,
      hours: null,
      googleReviewCount: null,
      googleRating: null,
      logoUrl: null,
      socialProfiles: {}
    };
  }
}

/**
 * Scrape website data directly from the provided URL
 */
async function scrapeWebsiteData(url: string) {
  const data = {
    businessName: null as string | null,
    address: null as string | null,
    phone: null as string | null,
    email: null as string | null,
    website: url,
    hours: null as string | null,
    logoUrl: null as string | null,
    socialProfiles: {} as Record<string, string>
  };

  try {
    // Fetch HTML content with better headers
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Step 1: Extract JSON-LD structured data (highest priority)
    const jsonLdData = extractJsonLdData($);
    if (jsonLdData) {
      data.businessName = jsonLdData.name || jsonLdData.legalName || jsonLdData.alternateName;
      data.address = formatAddress(jsonLdData.address);
      data.phone = cleanPhoneNumber(jsonLdData.telephone);
    }

    // Step 2: Extract from meta tags (Open Graph, Twitter Cards)
    if (!data.businessName) {
      data.businessName = extractFromMetaTags($);
    }

    // Step 3: Enhanced HTML element extraction
    if (!data.businessName) {
      data.businessName = extractBusinessNameFromHtml($);
    }

    // Step 4: Extract logo URL with multiple strategies
    data.logoUrl = extractLogoUrl($, url);

    // Step 5: Extract social media links with improved patterns
    data.socialProfiles = extractSocialProfiles($);

    // Step 6: Extract contact info with multiple strategies
    const contactInfo = extractContactInfo($, html);
    data.address = data.address || contactInfo.address;
    data.phone = data.phone || contactInfo.phone;
    data.email = data.email || contactInfo.email;
    data.hours = data.hours || contactInfo.hours;

    // Step 7: Clean and validate extracted data
    data.businessName = cleanBusinessName(data.businessName);
    data.address = cleanAddress(data.address);
    data.phone = cleanPhoneNumber(data.phone);

    return data;

  } catch (error) {
    console.error(`Error scraping website ${url}:`, error);
    return data;
  }
}

/**
 * Extract JSON-LD structured data from the webpage
 */
function extractJsonLdData($: cheerio.CheerioAPI) {
  try {
    const jsonLdScripts = $('script[type="application/ld+json"]');
    
    for (let i = 0; i < jsonLdScripts.length; i++) {
      const scriptContent = $(jsonLdScripts[i]).html();
      if (!scriptContent) continue;

      const jsonData = JSON.parse(scriptContent);
      
      // Handle both single objects and arrays
      const data = Array.isArray(jsonData) ? jsonData[0] : jsonData;
      
      // Look for Organization, LocalBusiness, or similar schema types
      if (data['@type'] && (
        data['@type'].includes('Organization') || 
        data['@type'].includes('LocalBusiness') ||
        data['@type'].includes('Corporation')
      )) {
        return data;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing JSON-LD:', error);
    return null;
  }
}

/**
 * Format address from JSON-LD schema
 */
function formatAddress(address: any): string | null {
  if (!address) return null;
  
  if (typeof address === 'string') return address;
  
  if (typeof address === 'object') {
    const parts = [
      address.streetAddress,
      address.addressLocality,
      address.addressRegion,
      address.postalCode
    ].filter(Boolean);
    
    return parts.length > 0 ? parts.join(', ') : null;
  }
  
  return null;
}

/**
 * Extract logo URL from the webpage
 */
function extractLogoUrl($: cheerio.CheerioAPI, baseUrl: string): string | null {
  // Try JSON-LD logo first
  const jsonLdScripts = $('script[type="application/ld+json"]');
  for (let i = 0; i < jsonLdScripts.length; i++) {
    try {
      const jsonData = JSON.parse($(jsonLdScripts[i]).html() || '{}');
      const data = Array.isArray(jsonData) ? jsonData[0] : jsonData;
      if (data.logo) {
        return typeof data.logo === 'string' ? data.logo : data.logo.url;
      }
    } catch (e) {
      // Continue to next script
    }
  }

  // Fallback: Look for common logo selectors
  const logoSelectors = [
    'img[alt*="logo" i]',
    'img[class*="logo" i]',
    'img[id*="logo" i]',
    '.logo img',
    '#logo img',
    'header img:first-of-type'
  ];

  for (const selector of logoSelectors) {
    const img = $(selector).first();
    if (img.length) {
      const src = img.attr('src');
      if (src) {
        return new URL(src, baseUrl).href;
      }
    }
  }

  return null;
}

/**
 * Extract social media profile links
 */
function extractSocialProfiles($: cheerio.CheerioAPI): Record<string, string> {
  const profiles: Record<string, string> = {};
  
  const socialPatterns = {
    facebook: /facebook\.com\/[^\/\s\?"']+/i,
    twitter: /(?:twitter|x)\.com\/[^\/\s\?"']+/i,
    linkedin: /linkedin\.com\/(?:company|in)\/[^\/\s\?"']+/i,
    instagram: /instagram\.com\/[^\/\s\?"']+/i,
    youtube: /youtube\.com\/(?:channel|user|c)\/[^\/\s\?"']+/i
  };

  $('a[href*="facebook"], a[href*="twitter"], a[href*="linkedin"], a[href*="instagram"], a[href*="youtube"], a[href*="x.com"]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;

    for (const [platform, pattern] of Object.entries(socialPatterns)) {
      if (pattern.test(href) && !profiles[platform]) {
        profiles[platform] = href;
        break;
      }
    }
  });

  return profiles;
}

/**
 * Extract business name from meta tags (Open Graph, Twitter Cards)
 */
function extractFromMetaTags($: cheerio.CheerioAPI): string | null {
  const metaSelectors = [
    'meta[property="og:site_name"]',
    'meta[property="og:title"]',
    'meta[name="twitter:title"]',
    'meta[name="application-name"]',
    'meta[name="apple-mobile-web-app-title"]'
  ];

  for (const selector of metaSelectors) {
    const content = $(selector).attr('content');
    if (content && content.trim()) {
      return content.trim();
    }
  }

  return null;
}

/**
 * Enhanced business name extraction from HTML elements
 */
function extractBusinessNameFromHtml($: cheerio.CheerioAPI): string | null {
  // Priority order for business name extraction
  const nameSelectors = [
    // Common business name patterns
    '.company-name, .business-name, .brand-name, .site-title',
    'header h1, header .logo-text, header .brand',
    '.navbar-brand, .header-brand, .site-brand',
    
    // Semantic HTML
    'h1[data-role="title"], h1[data-type="business-name"]',
    
    // Common CSS classes
    '.name, .title, .company, .business',
    
    // Fallback to first H1
    'h1',
    
    // Last resort: title tag (cleaned)
    'title'
  ];

  for (const selector of nameSelectors) {
    const elements = $(selector);
    
    for (let i = 0; i < elements.length; i++) {
      const text = $(elements[i]).text().trim();
      
      if (text) {
        // Clean the title tag specifically
        if (selector === 'title') {
          return text.replace(/\s*[\|\-–—]\s*.*$/, '').trim();
        }
        
        // Skip generic or too-long text
        if (text.length > 5 && text.length < 100 && !isGenericText(text)) {
          return text;
        }
      }
    }
  }

  return null;
}

/**
 * Check if text is generic/not business name
 */
function isGenericText(text: string): boolean {
  const genericPatterns = [
    /^(home|about|contact|services|products|welcome|hello)$/i,
    /^(menu|navigation|header|footer|sidebar)$/i,
    /^(click|here|more|read|learn|get|find)$/i,
    /^(page|website|site|blog|news)$/i
  ];

  return genericPatterns.some(pattern => pattern.test(text.trim()));
}

/**
 * Enhanced contact information extraction
 */
function extractContactInfo($: cheerio.CheerioAPI, html: string) {
  const contactInfo = {
    address: null as string | null,
    phone: null as string | null,
    email: null as string | null,
    hours: null as string | null
  };

  // Phone extraction with multiple strategies
  contactInfo.phone = extractPhoneNumber($, html);
  
  // Address extraction with multiple strategies
  contactInfo.address = extractAddress($, html);
  
  // Email extraction
  contactInfo.email = extractEmail($, html);
  
  // Hours extraction
  contactInfo.hours = extractBusinessHours($, html);

  return contactInfo;
}

/**
 * Enhanced phone number extraction
 */
function extractPhoneNumber($: cheerio.CheerioAPI, html: string): string | null {
  // Strategy 1: Look for phone links
  const phoneLinks = $('a[href^="tel:"]');
  if (phoneLinks.length > 0) {
    const href = phoneLinks.first().attr('href');
    if (href) {
      return cleanPhoneNumber(href.replace('tel:', ''));
    }
  }

  // Strategy 2: Look for microdata
  const phoneElements = $('[itemprop="telephone"], [data-phone], .phone, .tel, .telephone');
  for (let i = 0; i < phoneElements.length; i++) {
    const text = $(phoneElements[i]).text().trim();
    const phone = extractPhoneFromText(text);
    if (phone) return phone;
  }

  // Strategy 3: Search contact/footer sections
  const contactSections = $('footer, .contact, .contact-info, .contact-details, #contact, .footer');
  for (let i = 0; i < contactSections.length; i++) {
    const text = $(contactSections[i]).text();
    const phone = extractPhoneFromText(text);
    if (phone) return phone;
  }

  // Strategy 4: Full page text search (last resort)
  const pagePhone = extractPhoneFromText(html);
  return pagePhone;
}

/**
 * Extract phone number from text using improved regex
 */
function extractPhoneFromText(text: string): string | null {
  // Enhanced phone regex patterns
  const phonePatterns = [
    // International format: +1 (555) 123-4567
    /\+?1?[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/,
    // Standard US format: (555) 123-4567
    /\(([0-9]{3})\)\s?([0-9]{3})[-.\s]?([0-9]{4})/,
    // Dotted format: 555.123.4567
    /([0-9]{3})\.([0-9]{3})\.([0-9]{4})/,
    // Dashed format: 555-123-4567
    /([0-9]{3})-([0-9]{3})-([0-9]{4})/,
    // Spaced format: 555 123 4567
    /([0-9]{3})\s([0-9]{3})\s([0-9]{4})/,
    // Compact format: 5551234567
    /([0-9]{10})/
  ];

  for (const pattern of phonePatterns) {
    const match = text.match(pattern);
    if (match) {
      const fullMatch = match[0];
      // Validate it looks like a real phone number
      if (fullMatch.replace(/\D/g, '').length >= 10) {
        return cleanPhoneNumber(fullMatch);
      }
    }
  }

  return null;
}

/**
 * Enhanced address extraction
 */
function extractAddress($: cheerio.CheerioAPI, html: string): string | null {
  // Strategy 1: Microdata/structured data
  const addressElements = $('[itemprop="address"], [data-address], .address, .location, .addr');
  for (let i = 0; i < addressElements.length; i++) {
    const text = $(addressElements[i]).text().trim();
    if (isValidAddress(text)) {
      return cleanAddress(text);
    }
  }

  // Strategy 2: Contact sections
  const contactSections = $('footer, .contact, .contact-info, .location, #contact, .footer');
  for (let i = 0; i < contactSections.length; i++) {
    const text = $(contactSections[i]).text();
    const address = extractAddressFromText(text);
    if (address) return address;
  }

  // Strategy 3: Full page search
  const pageAddress = extractAddressFromText(html);
  return pageAddress;
}

/**
 * Extract address from text using improved regex
 */
function extractAddressFromText(text: string): string | null {
  // Enhanced address patterns
  const addressPatterns = [
    // Street address with state and zip: 123 Main St, City, ST 12345
    /\d+\s+[A-Za-z0-9\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct|Place|Pl|Circle|Cir|Parkway|Pkwy)[^,\n]*(?:,\s*[A-Za-z\s]+)*(?:,\s*[A-Z]{2}\s*\d{5}(?:-\d{4})?)/gi,
    
    // PO Box addresses
    /P\.?O\.?\s*Box\s+\d+[^,\n]*(?:,\s*[A-Za-z\s]+)*(?:,\s*[A-Z]{2}\s*\d{5}(?:-\d{4})?)/gi,
    
    // International addresses (more flexible)
    /\d+\s+[A-Za-z0-9\s,.-]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct|Place|Pl)[^,\n]*(?:,\s*[A-Za-z\s,.-]+){1,3}/gi
  ];

  for (const pattern of addressPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      for (const match of matches) {
        const cleaned = cleanAddress(match);
        if (cleaned && isValidAddress(cleaned)) {
          return cleaned;
        }
      }
    }
  }

  return null;
}

/**
 * Validate if text looks like a real address
 */
function isValidAddress(address: string): boolean {
  if (!address || address.length < 10 || address.length > 200) {
    return false;
  }

  // Must contain street indicators
  const streetIndicators = /\b(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|way|court|ct|place|pl|circle|cir|parkway|pkwy|box)\b/i;
  
  // Must contain numbers
  const hasNumbers = /\d/;
  
  return streetIndicators.test(address) && hasNumbers.test(address);
}

/**
 * Extract email address from website
 */
function extractEmail($: cheerio.CheerioAPI, html: string): string | null {
  // Strategy 1: Look for email links
  const emailLinks = $('a[href^="mailto:"]');
  if (emailLinks.length > 0) {
    const href = emailLinks.first().attr('href');
    if (href) {
      return href.replace('mailto:', '');
    }
  }

  // Strategy 2: Look for email in contact sections
  const contactSections = $('footer, .contact, .contact-info, #contact, .footer');
  for (let i = 0; i < contactSections.length; i++) {
    const text = $(contactSections[i]).text();
    const email = extractEmailFromText(text);
    if (email) return email;
  }

  // Strategy 3: Full page search
  const pageEmail = extractEmailFromText(html);
  return pageEmail;
}

/**
 * Extract email from text using regex
 */
function extractEmailFromText(text: string): string | null {
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  const match = text.match(emailPattern);
  return match ? match[0] : null;
}

/**
 * Extract business hours from website
 */
function extractBusinessHours($: cheerio.CheerioAPI, html: string): string | null {
  // Strategy 1: Look for hours in structured data
  const jsonLdScripts = $('script[type="application/ld+json"]');
  for (let i = 0; i < jsonLdScripts.length; i++) {
    try {
      const jsonData = JSON.parse($(jsonLdScripts[i]).html() || '{}');
      const data = Array.isArray(jsonData) ? jsonData[0] : jsonData;
      if (data.openingHours || data.openingHoursSpecification) {
        return JSON.stringify(data.openingHours || data.openingHoursSpecification);
      }
    } catch (e) {
      // Continue to next script
    }
  }

  // Strategy 2: Look for hours elements
  const hoursElements = $('[class*="hours"], [class*="schedule"], [id*="hours"], .opening-hours, .business-hours');
  for (let i = 0; i < hoursElements.length; i++) {
    const text = $(hoursElements[i]).text().trim();
    if (text && text.length > 10 && text.length < 500) {
      return text;
    }
  }

  // Strategy 3: Search contact sections for hours
  const contactSections = $('footer, .contact, .contact-info, #contact');
  for (let i = 0; i < contactSections.length; i++) {
    const text = $(contactSections[i]).text();
    const hours = extractHoursFromText(text);
    if (hours) return hours;
  }

  return null;
}

/**
 * Extract hours from text using patterns
 */
function extractHoursFromText(text: string): string | null {
  // Look for common hour patterns
  const hourPatterns = [
    /(?:monday|mon|tuesday|tue|wednesday|wed|thursday|thu|friday|fri|saturday|sat|sunday|sun)[\s\w-:,]*(?:am|pm|closed)/gi,
    /(?:open|hours?)[\s\w-:,]*(?:am|pm|closed)/gi,
    /\d{1,2}:\d{2}\s*(?:am|pm)\s*[-–—to]\s*\d{1,2}:\d{2}\s*(?:am|pm)/gi
  ];

  for (const pattern of hourPatterns) {
    const match = text.match(pattern);
    if (match && match[0].length > 10) {
      return match[0];
    }
  }

  return null;
}

/**
 * Clean and standardize business name
 */
function cleanBusinessName(name: string | null): string | null {
  if (!name) return null;
  
  return name
    .trim()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/^["']|["']$/g, '') // Remove quotes
    .replace(/\s*[-|–—]\s*.*$/, '') // Remove taglines after dash
    .trim();
}

/**
 * Clean and standardize address
 */
function cleanAddress(address: string | null): string | null {
  if (!address) return null;
  
  return address
    .trim()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\n/g, ', ') // Replace newlines with commas
    .replace(/,\s*,/g, ',') // Remove double commas
    .replace(/^,\s*|,\s*$/g, '') // Remove leading/trailing commas
    .trim();
}

/**
 * Clean and standardize phone number
 */
function cleanPhoneNumber(phone: string | null): string | null {
  if (!phone) return null;
  
  // Remove all non-digits first
  const digits = phone.replace(/\D/g, '');
  
  // Must be at least 10 digits for US numbers
  if (digits.length < 10) return null;
  
  // Format as (XXX) XXX-XXXX for US numbers
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  
  // Format as +1 (XXX) XXX-XXXX for US numbers with country code
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  
  // Return original cleaned format for international numbers
  return digits.length > 11 ? `+${digits}` : digits;
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch (error) {
    console.error('Error extracting domain:', error);
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  }
}

/**
 * Search Google for business profile information using Puppeteer
 */
async function searchGoogleBusinessProfile(domain: string) {
  const data = {
    businessName: null as string | null,
    address: null as string | null,
    phone: null as string | null,
    reviewCount: null as number | null,
    rating: null as number | null
  };

  let browser;
  
  try {
    // Launch browser with stealth settings
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    
    // Set user agent to avoid detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Search Google for the domain
    const searchQuery = `"${domain}" site:google.com/maps OR site:google.com/search`;
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
    
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 10000 });
    
    // Wait a bit for JavaScript to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Try to extract business information from Google search results
    const businessInfo = await page.evaluate(() => {
      // Look for Google Business Profile information
      const businessNameEl = document.querySelector('[data-attrid="title"]') || 
                            document.querySelector('h3');
      
      const addressEl = document.querySelector('[data-attrid="kc:/location/location:address"]') ||
                       document.querySelector('[data-local-attribute="d3adr"]');
      
      const phoneEl = document.querySelector('[data-attrid="kc:/location/location:phone"]') ||
                     document.querySelector('span[data-phone]');
      
      const ratingEl = document.querySelector('[data-attrid="kc:/location/location:rating"]') ||
                      document.querySelector('.z3HNkc');
      
      const reviewCountEl = document.querySelector('[data-attrid="kc:/location/location:num_reviews"]') ||
                           document.querySelector('.hqzQac');

      return {
        businessName: businessNameEl?.textContent?.trim() || null,
        address: addressEl?.textContent?.trim() || null,
        phone: phoneEl?.textContent?.trim() || null,
        rating: ratingEl?.textContent?.trim() || null,
        reviewCount: reviewCountEl?.textContent?.trim() || null
      };
    });

    // Parse rating and review count
    if (businessInfo.rating) {
      const ratingMatch = businessInfo.rating.match(/(\d+\.?\d*)/);
      data.rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;
    }

    if (businessInfo.reviewCount) {
      const reviewMatch = businessInfo.reviewCount.match(/(\d+(?:,\d+)*)/);
      data.reviewCount = reviewMatch ? parseInt(reviewMatch[1].replace(/,/g, '')) : null;
    }

    data.businessName = businessInfo.businessName;
    data.address = businessInfo.address;
    data.phone = businessInfo.phone;

    return data;

  } catch (error) {
    console.error('Error searching Google Business Profile:', error);
    return data;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}