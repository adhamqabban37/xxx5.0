import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { analyzeAndImproveJsonLd } from '@/lib/jsonld-analyzer';
import { extractSchemaData } from '@/lib/schema/extract';
import { auditSchemaData, SchemaAudit } from '@/lib/schema/audit';

interface BusinessInfo {
  name: string;
  address?: string;
  phone?: string;
  website: string;
  socials: string[];
  hours?: string[];
  lat?: number;
  lng?: number;
}

interface TechSignals {
  hasJSONLD: boolean;
  hasSitemap: boolean;
  hasRobots: boolean;
  https: boolean;
  canonical?: string;
  metaDescription?: string;
  pageSpeedHint?: 'fast' | 'avg' | 'slow';
}

interface SEOSnippets {
  title: string;
  description: string;
  h1: string;
}

interface JsonLdAnalysis {
  current: any[];
  weaknesses: string[];
  recommendations: string[];
  improved: any[];
  completenessScore: number;
  aeoScore: number;
}

interface PreviewResponse {
  businessInfo: BusinessInfo;
  techSignals: TechSignals;
  seoSnippets: SEOSnippets;
  quickFindings: string[];
  jsonLdAnalysis: JsonLdAnalysis;
  schemaAudit: SchemaAudit;
}

// Mock geocoding function for preview (returns example coordinates)
function mockGeocode(address: string): { lat: number; lng: number } {
  // Return mock coordinates based on address patterns for preview
  const cityCoords: { [key: string]: { lat: number; lng: number } } = {
    'new york': { lat: 40.7128, lng: -74.0060 },
    'los angeles': { lat: 34.0522, lng: -118.2437 },
    'chicago': { lat: 41.8781, lng: -87.6298 },
    'houston': { lat: 29.7604, lng: -95.3698 },
    'phoenix': { lat: 33.4484, lng: -112.0740 },
    'philadelphia': { lat: 39.9526, lng: -75.1652 },
    'san antonio': { lat: 29.4241, lng: -98.4936 },
    'san diego': { lat: 32.7157, lng: -117.1611 },
    'dallas': { lat: 32.7767, lng: -96.7970 },
    'default': { lat: 39.8283, lng: -98.5795 } // Center of US
  };

  const lowerAddress = address.toLowerCase();
  for (const [city, coords] of Object.entries(cityCoords)) {
    if (lowerAddress.includes(city)) {
      return coords;
    }
  }
  
  return cityCoords.default;
}

// Extract JSON-LD structured data
function extractJSONLD($: cheerio.CheerioAPI): { businessInfo: Partial<BusinessInfo>; schemas: any[] } {
  const businessInfo: Partial<BusinessInfo> = { socials: [] };
  const schemas: any[] = [];
  
  $('script[type="application/ld+json"]').each((_, script) => {
    try {
      const jsonText = $(script).html();
      if (!jsonText) return;
      
      const data = JSON.parse(jsonText);
      const items = Array.isArray(data) ? data : [data];
      
      // Store all schemas for analysis
      schemas.push(...items);
      
      for (const item of items) {
        if (item['@type'] === 'Organization' || item['@type'] === 'LocalBusiness' || 
            item['@type'] === 'Restaurant' || item['@type'] === 'Store') {
          
          // Extract name
          if (item.name && !businessInfo.name) {
            businessInfo.name = item.name;
          }
          
          // Extract address
          if (item.address && !businessInfo.address) {
            if (typeof item.address === 'string') {
              businessInfo.address = item.address;
            } else if (item.address.streetAddress) {
              const addr = item.address;
              businessInfo.address = [
                addr.streetAddress,
                addr.addressLocality,
                addr.addressRegion,
                addr.postalCode
              ].filter(Boolean).join(', ');
            }
          }
          
          // Extract phone
          if (item.telephone && !businessInfo.phone) {
            businessInfo.phone = item.telephone;
          }
          
          // Extract operating hours
          if (item.openingHoursSpecification && !businessInfo.hours) {
            businessInfo.hours = item.openingHoursSpecification.map((spec: any) => 
              `${spec.dayOfWeek}: ${spec.opens}-${spec.closes}`
            );
          }
          
          // Extract social media
          if (item.sameAs) {
            const socials = Array.isArray(item.sameAs) ? item.sameAs : [item.sameAs];
            businessInfo.socials = [...(businessInfo.socials || []), ...socials];
          }
          
          // Extract geo coordinates
          if (item.geo && !businessInfo.lat) {
            businessInfo.lat = parseFloat(item.geo.latitude);
            businessInfo.lng = parseFloat(item.geo.longitude);
          }
        }
      }
    } catch (error) {
      // Skip invalid JSON-LD
    }
  });
  
  return { businessInfo, schemas };
}

// Extract OpenGraph and Twitter meta tags
function extractMetaTags($: cheerio.CheerioAPI): { title?: string; siteName?: string; url?: string; image?: string } {
  const meta: any = {};
  
  // OpenGraph tags
  meta.title = $('meta[property="og:title"]').attr('content') || 
               $('meta[name="twitter:title"]').attr('content');
  meta.siteName = $('meta[property="og:site_name"]').attr('content');
  meta.url = $('meta[property="og:url"]').attr('content');
  meta.image = $('meta[property="og:image"]').attr('content') || 
               $('meta[name="twitter:image"]').attr('content');
  
  return meta;
}

// Extract contact information from visible text
function extractContactInfo($: cheerio.CheerioAPI): { phone?: string; email?: string; address?: string } {
  const contact: any = {};
  const bodyText = $('body').text();
  
  // Phone patterns
  const phoneRegex = /(?:\+?1[-.\s]?)?\(?([2-9][0-8][0-9])\)?[-.\s]?([2-9][0-9]{2})[-.\s]?([0-9]{4})/g;
  const phoneMatch = bodyText.match(phoneRegex);
  if (phoneMatch) {
    contact.phone = phoneMatch[0];
  }
  
  // Email patterns
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emailMatch = bodyText.match(emailRegex);
  if (emailMatch) {
    contact.email = emailMatch[0];
  }
  
  // Address patterns (look in footer typically)
  const footerText = $('footer, .footer, [class*="footer"], [id*="footer"]').text();
  const addressRegex = /\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd)[,\s]+[A-Za-z\s]+[,\s]+[A-Z]{2}\s+\d{5}/;
  const addressMatch = footerText.match(addressRegex) || bodyText.match(addressRegex);
  if (addressMatch) {
    contact.address = addressMatch[0];
  }
  
  return contact;
}

// Check technical SEO signals
function checkTechSignals($: cheerio.CheerioAPI, url: string): TechSignals {
  const signals: TechSignals = {
    hasJSONLD: $('script[type="application/ld+json"]').length > 0,
    hasSitemap: false, // Will check in response headers or common paths
    hasRobots: false,  // Will check in response headers or common paths
    https: url.startsWith('https://'),
    canonical: $('link[rel="canonical"]').attr('href'),
    metaDescription: $('meta[name="description"]').attr('content')
  };
  
  // Simple page speed hint based on resource count
  const resourceCount = $('script, link[rel="stylesheet"], img').length;
  if (resourceCount < 20) {
    signals.pageSpeedHint = 'fast';
  } else if (resourceCount < 50) {
    signals.pageSpeedHint = 'avg';
  } else {
    signals.pageSpeedHint = 'slow';
  }
  
  return signals;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json(
      { error: 'URL parameter is required' },
      { status: 400 }
    );
  }

  try {
    // Validate URL format
    let validUrl: URL;
    try {
      validUrl = new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Fetch webpage with timeout
    const response = await axios.get(url, {
      timeout: 5000, // 5 second timeout for fast response
      maxRedirects: 3,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; XenlixBot/1.0; +https://xenlix.com/bot)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive'
      }
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Initialize response structure
    const businessInfo: BusinessInfo = {
      name: '',
      website: validUrl.toString(),
      socials: []
    };
    
    const quickFindings: string[] = [];

    // Step 1: Extract JSON-LD structured data (priority)
    const jsonLDResult = extractJSONLD($);
    const extractedSchemas = jsonLDResult.schemas;
    Object.assign(businessInfo, jsonLDResult.businessInfo);
    
    if (jsonLDResult.businessInfo.name) {
      quickFindings.push('Found structured business data (JSON-LD)');
    }

    // Step 2: Extract OpenGraph/Twitter tags (fallback)
    const metaTags = extractMetaTags($);
    if (!businessInfo.name && metaTags.title) {
      businessInfo.name = metaTags.title;
    }
    if (!businessInfo.name && metaTags.siteName) {
      businessInfo.name = metaTags.siteName;
    }

    // Step 3: Extract visible contact patterns
    const contactInfo = extractContactInfo($);
    if (!businessInfo.phone && contactInfo.phone) {
      businessInfo.phone = contactInfo.phone;
      quickFindings.push('Found phone number in content');
    }
    if (!businessInfo.address && contactInfo.address) {
      businessInfo.address = contactInfo.address;
      quickFindings.push('Found address in content');
    }

    // Step 4: Geocode if no coordinates found
    if (!businessInfo.lat && businessInfo.address) {
      const coords = mockGeocode(businessInfo.address);
      businessInfo.lat = coords.lat;
      businessInfo.lng = coords.lng;
      quickFindings.push('Generated preview coordinates');
    }

    // Fallback for business name
    if (!businessInfo.name) {
      businessInfo.name = $('title').text() || $('h1').first().text() || validUrl.hostname;
    }

    // Extract SEO snippets
    const seoSnippets: SEOSnippets = {
      title: $('title').text() || 'No title found',
      description: $('meta[name="description"]').attr('content') || 
                  $('meta[property="og:description"]').attr('content') || 
                  'No description found',
      h1: $('h1').first().text() || 'No H1 found'
    };

    // Check technical signals
    const techSignals = checkTechSignals($, url);
    
    // Add quick findings based on tech signals
    if (techSignals.hasJSONLD) {
      quickFindings.push('Has structured data markup');
    }
    if (techSignals.https) {
      quickFindings.push('HTTPS enabled');
    }
    if (techSignals.metaDescription) {
      quickFindings.push('Has meta description');
    }
    if (techSignals.canonical) {
      quickFindings.push('Has canonical URL');
    }

    // Analyze JSON-LD and generate improvements
    const pageContent = {
      title: seoSnippets.title,
      metaDescription: techSignals.metaDescription,
      h1: seoSnippets.h1,
      content: $.text() // Get all text content for FAQ analysis
    };
    
    const jsonLdAnalysis = analyzeAndImproveJsonLd(extractedSchemas, businessInfo, pageContent);

    // Perform comprehensive schema audit
    const schemaExtraction = extractSchemaData($);
    const schemaAudit = auditSchemaData(schemaExtraction);

    const result: PreviewResponse = {
      businessInfo,
      techSignals,
      seoSnippets,
      quickFindings,
      jsonLdAnalysis,
      schemaAudit
    };

    const processingTime = Date.now() - startTime;
    console.log(`Preview analysis completed in ${processingTime}ms for: ${url}`);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Preview analysis error:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        return NextResponse.json(
          { error: 'Request timeout - website took too long to respond' },
          { status: 408 }
        );
      }
      if (error.response?.status === 404) {
        return NextResponse.json(
          { error: 'Website not found (404)' },
          { status: 404 }
        );
      }
      if (error.response?.status && error.response.status >= 400) {
        return NextResponse.json(
          { error: `Website returned error: ${error.response.status}` },
          { status: error.response.status }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to analyze website. Please check the URL and try again.' },
      { status: 500 }
    );
  }
}