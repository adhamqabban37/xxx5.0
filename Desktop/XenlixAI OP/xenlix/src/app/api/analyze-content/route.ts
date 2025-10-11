import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import natural from 'natural';
import nlp from 'compromise';
import { generateSchema } from '@/lib/content-schema-analyzer';
import { analyzeQuestionGaps } from '@/lib/question-gap-analyzer';

// Initialize NLP tools
const { TfIdf, WordTokenizer, SentimentAnalyzer, PorterStemmer } = natural;
const tokenizer = new WordTokenizer();
const analyzer = new SentimentAnalyzer('English', PorterStemmer, 'afinn');

interface ContentAnalysisResult {
  url: string;
  title: string;
  metaDescription: string;
  contentLength: number;
  wordCount: number;
  readabilityScore: number;
  sentimentScore: number;
  aeoOptimization: {
    questionIntentScore: number;
    answerReadinessScore: number;
    conversationalToneScore: number;
    overallAeoScore: number;
  };
  keywordDensity: { [key: string]: number };
  entities: {
    people: string[];
    places: string[];
    organizations: string[];
  };
  headingStructure: {
    h1: string[];
    h2: string[];
    h3: string[];
  };
  technicalSeo: {
    hasMetaDescription: boolean;
    metaDescriptionLength: number;
    titleLength: number;
    hasAltTags: number;
    totalImages: number;
    internalLinks: number;
    externalLinks: number;
  };
  aiEngineOptimization: {
    googleAI: {
      score: number;
      recommendations: string[];
    };
    openAI: {
      score: number;
      recommendations: string[];
    };
    anthropic: {
      score: number;
      recommendations: string[];
    };
    perplexity: {
      score: number;
      recommendations: string[];
    };
  };
  schema?: {
    type: 'FAQPage' | 'Article' | null;
    data: any;
  };
  questionGaps?: {
    answeredQuestions: string[];
    missingQuestions: string[];
    analysisMetrics: {
      totalAnsweredQuestions: number;
      totalMissingQuestions: number;
      coveragePercentage: number;
      opportunityScore: number;
    };
  };
  businessAddress?: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    phone?: string;
  };
}

async function fetchWebContent(url: string): Promise<string> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 10000,
      maxRedirects: 5,
    });
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch content from ${url}: ${error}`);
  }
}

function calculateReadabilityScore(text: string): number {
  const sentences = text.split(/[.!?]+/).length;
  const words = tokenizer.tokenize(text)?.length || 0;
  const syllables = words * 1.5; // Rough estimate

  // Flesch Reading Ease Score
  const score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
  return Math.max(0, Math.min(100, score));
}

function calculateSentimentScore(text: string): number {
  const tokens = tokenizer.tokenize(text.toLowerCase());
  if (!tokens || tokens.length === 0) return 0;

  const score = analyzer.getSentiment(tokens);
  return (score + 1) * 50; // Convert from [-1,1] to [0,100]
}

function analyzeAEOOptimization(text: string, title: string, headings: string[]): any {
  const doc = nlp(text);
  const titleDoc = nlp(title);
  const headingsText = headings.join(' ');
  const headingsDoc = nlp(headingsText);

  // Question Intent Score - Look for question patterns
  const questionWords = [
    'what',
    'how',
    'why',
    'when',
    'where',
    'who',
    'which',
    'can',
    'does',
    'is',
    'are',
  ];
  const questionPattern = doc.match('#Question');
  const titleQuestions = titleDoc.has('#Question');
  const headingQuestions = headingsDoc.has('#Question');

  let questionIntentScore = 0;
  if (titleQuestions) questionIntentScore += 30;
  if (headingQuestions) questionIntentScore += 25;
  if (questionPattern.length > 0) questionIntentScore += 25;

  // Check for FAQ sections
  if (text.toLowerCase().includes('faq') || text.toLowerCase().includes('frequently asked')) {
    questionIntentScore += 20;
  }

  // Answer Readiness Score - Look for direct, comprehensive answers
  const sentences = doc.sentences();
  let answerReadinessScore = 0;

  // Check for direct answer patterns
  const answerPatterns = [
    /^(yes|no),/i,
    /^(the answer is|the solution is|here's how|follow these steps)/i,
    /^(first|second|third|finally)/i,
    /\d+\.\s/g, // Numbered lists
  ];

  sentences.forEach((sentence) => {
    const sentenceText = sentence.text();
    answerPatterns.forEach((pattern) => {
      if (pattern.test(sentenceText)) {
        answerReadinessScore += 5;
      }
    });
  });

  // Check for comprehensive coverage
  if (text.length > 1000) answerReadinessScore += 20;
  if (headings.length > 3) answerReadinessScore += 15;

  answerReadinessScore = Math.min(100, answerReadinessScore);

  // Conversational Tone Score
  let conversationalToneScore = 0;

  // Look for conversational markers
  const conversationalMarkers = [
    /\byou\b/gi,
    /\byour\b/gi,
    /\bwe\b/gi,
    /\bour\b/gi,
    /\blet's\b/gi,
    /\bhere's\b/gi,
    /\bthat's\b/gi,
    /\bit's\b/gi,
  ];

  conversationalMarkers.forEach((marker) => {
    const matches = text.match(marker);
    if (matches) {
      conversationalToneScore += Math.min(matches.length * 2, 20);
    }
  });

  // Check for informal language
  if (text.includes('!')) conversationalToneScore += 10;
  if (doc.has('#Contraction')) conversationalToneScore += 15;

  conversationalToneScore = Math.min(100, conversationalToneScore);

  const overallAeoScore =
    (questionIntentScore + answerReadinessScore + conversationalToneScore) / 3;

  return {
    questionIntentScore,
    answerReadinessScore,
    conversationalToneScore,
    overallAeoScore,
  };
}

function extractEntities(text: string): any {
  const doc = nlp(text);

  return {
    people: doc.people().out('array'),
    places: doc.places().out('array'),
    organizations: doc.organizations().out('array'),
  };
}

function calculateKeywordDensity(text: string): { [key: string]: number } {
  const tokens = tokenizer.tokenize(text.toLowerCase()) || [];
  const totalWords = tokens.length;
  const wordCounts: { [key: string]: number } = {};

  // Filter out common stop words
  const stopWords = new Set([
    'the',
    'a',
    'an',
    'and',
    'or',
    'but',
    'in',
    'on',
    'at',
    'to',
    'for',
    'of',
    'with',
    'by',
  ]);

  tokens.forEach((token) => {
    if (!stopWords.has(token) && token.length > 2) {
      wordCounts[token] = (wordCounts[token] || 0) + 1;
    }
  });

  // Convert to density and get top 10
  const densities: { [key: string]: number } = {};
  Object.entries(wordCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .forEach(([word, count]) => {
      densities[word] = (count / totalWords) * 100;
    });

  return densities;
}

function extractPrimaryKeyword(
  title: string,
  textContent: string,
  keywordDensity: { [key: string]: number }
): string {
  // Try to extract primary keyword from multiple sources

  // 1. Get the highest density keyword
  const topKeyword = Object.keys(keywordDensity)[0];

  // 2. Extract keywords from title (often the most important)
  const titleWords = title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((word) => word.length > 3);

  // 3. Find the best keyword that appears in both title and has good density
  const titleKeywordInDensity = titleWords.find(
    (word) => keywordDensity[word] && keywordDensity[word] > 1
  );

  // 4. Prefer title keyword if it exists in density, otherwise use top keyword
  if (titleKeywordInDensity) {
    return titleKeywordInDensity;
  } else if (topKeyword) {
    return topKeyword;
  }

  // 5. Fallback to first meaningful word from title
  const meaningfulTitleWord = titleWords.find((word) => word.length > 4);
  if (meaningfulTitleWord) {
    return meaningfulTitleWord;
  }

  // 6. Ultimate fallback
  return 'content';
}

function analyzeAIEngineOptimization(text: string, title: string, headings: string[]): any {
  const textLength = text.length;
  const wordCount = tokenizer.tokenize(text)?.length || 0;
  const headingCount = headings.length;

  // Google AI (Bard/Gemini) - Favors comprehensive, well-structured content
  let googleScore = 0;
  const googleRecommendations: string[] = [];

  if (textLength > 1500) {
    googleScore += 25;
  } else {
    googleRecommendations.push(
      'Increase content length to 1500+ words for better Google AI visibility'
    );
  }

  if (headingCount >= 4) {
    googleScore += 20;
  } else {
    googleRecommendations.push('Add more headings (H2, H3) to improve content structure');
  }

  if (title.length >= 30 && title.length <= 60) {
    googleScore += 25;
  } else {
    googleRecommendations.push('Optimize title length to 30-60 characters');
  }

  if (
    text.includes('according to') ||
    text.includes('research shows') ||
    text.includes('studies indicate')
  ) {
    googleScore += 30;
  } else {
    googleRecommendations.push('Add authoritative sources and citations');
  }

  // OpenAI (ChatGPT) - Favors clear, direct answers with examples
  let openAIScore = 0;
  const openAIRecommendations: string[] = [];

  if (text.includes('example') || text.includes('for instance') || text.includes('such as')) {
    openAIScore += 30;
  } else {
    openAIRecommendations.push('Include practical examples and use cases');
  }

  if ((text.match(/\d+\./g)?.length || 0) >= 3) {
    // Numbered lists
    openAIScore += 25;
  } else {
    openAIRecommendations.push('Use numbered lists for step-by-step instructions');
  }

  if (wordCount >= 800 && wordCount <= 2000) {
    openAIScore += 25;
  } else {
    openAIRecommendations.push('Optimize content length to 800-2000 words');
  }

  if (text.toLowerCase().includes('how to') || title.toLowerCase().includes('how to')) {
    openAIScore += 20;
  } else {
    openAIRecommendations.push("Consider adding 'how-to' elements for actionable content");
  }

  // Anthropic (Claude) - Favors nuanced, contextual information
  let anthropicScore = 0;
  const anthropicRecommendations: string[] = [];

  if (text.includes('however') || text.includes('although') || text.includes('while')) {
    anthropicScore += 25;
  } else {
    anthropicRecommendations.push('Add nuanced language to show complexity and context');
  }

  if (
    text.includes('consider') ||
    text.includes('depending on') ||
    text.includes('in some cases')
  ) {
    anthropicScore += 30;
  } else {
    anthropicRecommendations.push('Include conditional statements and considerations');
  }

  if (
    text.includes('pros and cons') ||
    text.includes('advantages') ||
    text.includes('disadvantages')
  ) {
    anthropicScore += 25;
  } else {
    anthropicRecommendations.push('Present balanced perspectives with pros and cons');
  }

  if (
    headings.some(
      (h) => h.toLowerCase().includes('conclusion') || h.toLowerCase().includes('summary')
    )
  ) {
    anthropicScore += 20;
  } else {
    anthropicRecommendations.push('Add a conclusion or summary section');
  }

  // Perplexity - Favors recent, factual information with sources
  let perplexityScore = 0;
  const perplexityRecommendations: string[] = [];

  if (
    text.includes('2024') ||
    text.includes('2023') ||
    text.includes('recently') ||
    text.includes('latest')
  ) {
    perplexityScore += 30;
  } else {
    perplexityRecommendations.push('Include recent dates and current information');
  }

  if (text.includes('source:') || text.includes('according to') || text.match(/\[.*\]/g)) {
    perplexityScore += 35;
  } else {
    perplexityRecommendations.push('Add clear source citations and references');
  }

  if (text.includes('data shows') || text.includes('statistics') || text.includes('%')) {
    perplexityScore += 25;
  } else {
    perplexityRecommendations.push('Include relevant statistics and data points');
  }

  if (text.includes('update') || text.includes('current') || text.includes('as of')) {
    perplexityScore += 10;
  } else {
    perplexityRecommendations.push('Indicate content freshness with update dates');
  }

  return {
    googleAI: { score: googleScore, recommendations: googleRecommendations },
    openAI: { score: openAIScore, recommendations: openAIRecommendations },
    anthropic: { score: anthropicScore, recommendations: anthropicRecommendations },
    perplexity: { score: perplexityScore, recommendations: perplexityRecommendations },
  };
}

function extractBusinessAddress(
  $: any,
  url: string
): { address?: string; city?: string; state?: string; country?: string; phone?: string } {
  const result: any = {};

  // Enhanced patterns for finding business address information
  const addressSelectors = [
    // Schema.org microdata
    '[itemtype*="PostalAddress"]',
    '[itemtype*="LocalBusiness"]',
    '[itemtype*="Organization"]',
    '[itemtype*="Place"]',

    // Common class patterns
    '.address',
    '.location',
    '.contact-info',
    '.contact-address',
    '.business-address',
    '.company-address',
    '.office-address',
    '.street-address',
    '.postal-address',
    '.location-info',
    '.contact-details',
    '.address-block',
    '.location-block',

    // ID patterns
    '#address',
    '#location',
    '#contact',
    '#office-location',
    '#business-location',
    '#company-address',

    // Data attributes
    '[data-address]',
    '[data-location]',
    '[data-contact]',

    // Common footer patterns
    'footer .address',
    'footer .location',
    'footer .contact',
    '.footer-address',
    '.footer-location',
    '.footer-contact',

    // Contact page patterns
    '.contact-page .address',
    '.contact-section .address',
    '.contact-info-block',
    '.location-details',
  ];

  // Enhanced schema.org patterns
  const schemaSelectors = {
    address: '[itemprop="streetAddress"], [itemprop="address"]',
    city: '[itemprop="addressLocality"]',
    state: '[itemprop="addressRegion"]',
    country: '[itemprop="addressCountry"]',
    phone: '[itemprop="telephone"]',
    postalCode: '[itemprop="postalCode"]',
  };

  // Enhanced JSON-LD structured data extraction
  $('script[type="application/ld+json"]').each((_: number, script: any) => {
    try {
      const data = JSON.parse($(script).html() || '{}');
      const extractFromSchema = (obj: any) => {
        if (
          obj['@type'] &&
          (obj['@type'].includes('LocalBusiness') ||
            obj['@type'].includes('Organization') ||
            obj['@type'].includes('Place'))
        ) {
          if (obj.address) {
            if (typeof obj.address === 'string') {
              result.address = obj.address;
            } else if (obj.address.streetAddress) {
              result.address = obj.address.streetAddress;
              if (obj.address.addressLocality) result.city = obj.address.addressLocality;
              if (obj.address.addressRegion) result.state = obj.address.addressRegion;
              if (obj.address.addressCountry) result.country = obj.address.addressCountry;
              if (obj.address.postalCode) result.postalCode = obj.address.postalCode;
            }
          }
          if (obj.telephone && !result.phone) result.phone = obj.telephone;
        }
      };

      if (Array.isArray(data)) {
        data.forEach(extractFromSchema);
      } else {
        extractFromSchema(data);
      }
    } catch (e) {
      // Invalid JSON-LD, continue
    }
  });

  // Try schema.org microdata first
  for (const [field, selector] of Object.entries(schemaSelectors)) {
    if (!result[field]) {
      const element = $(selector).first();
      if (element.length) {
        result[field] = element.text().trim();
      }
    }
  }

  // Enhanced address pattern recognition
  if (!result.address) {
    for (const selector of addressSelectors) {
      const element = $(selector).first();
      if (element.length) {
        const text = element.text().trim();

        // Enhanced address validation patterns
        const addressPatterns = [
          // Standard US address pattern (number + street)
          /\d+\s+[A-Za-z\s]+(street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|way|court|ct|circle|cir|place|pl)\b/i,
          // International address patterns
          /\d+\s+[A-Za-z\s]+(str|strasse|rue|via|calle)\b/i,
          // PO Box patterns
          /(p\.?o\.?\s*box|post\s*office\s*box)\s*\d+/i,
          // Simple address with number and text
          /\d+.*[A-Za-z].*\d{5}/, // Includes zip code
          /\d+\s+[A-Za-z\s,]+\d{5}/, // Number + text + zip
        ];

        const isValidAddress =
          addressPatterns.some((pattern) => pattern.test(text)) ||
          (text.includes(',') && /\d/.test(text) && text.length > 15);

        if (isValidAddress && text.length > 10 && text.length < 200) {
          result.address = text;
          break;
        }
      }
    }
  }

  // Extract phone numbers with enhanced patterns
  if (!result.phone) {
    const phoneSelectors = [
      '[href^="tel:"]',
      '.phone',
      '.telephone',
      '.tel',
      '.call',
      '#phone',
      '#telephone',
      '#tel',
      '.contact-phone',
      '.business-phone',
      '.office-phone',
      '[data-phone]',
      '[data-tel]',
    ];

    for (const selector of phoneSelectors) {
      const element = $(selector).first();
      if (element.length) {
        let phone = element.text().trim();
        if (element.is('a[href^="tel:"]')) {
          phone = element.attr('href')?.replace('tel:', '') || phone;
        }

        // Enhanced phone validation
        const phonePattern = /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/;
        if (phonePattern.test(phone) || /[\d\s\-\(\)\+\.]{10,}/.test(phone)) {
          result.phone = phone;
          break;
        }
      }
    }
  }

  // Extract from meta tags with enhanced patterns
  const metaPatterns = [
    {
      field: 'address',
      names: ['address', 'street-address', 'business:contact_data:street_address'],
    },
    { field: 'city', names: ['city', 'locality', 'business:contact_data:locality'] },
    { field: 'state', names: ['state', 'region', 'business:contact_data:region'] },
    { field: 'country', names: ['country', 'business:contact_data:country'] },
    { field: 'phone', names: ['phone', 'telephone', 'business:contact_data:phone_number'] },
  ];

  metaPatterns.forEach(({ field, names }) => {
    if (!result[field]) {
      for (const name of names) {
        const meta = $(`meta[name="${name}"], meta[property="${name}"]`).attr('content');
        if (meta) {
          result[field] = meta.trim();
          break;
        }
      }
    }
  });

  // Enhanced text mining for addresses in footer, contact, and about sections
  if (!result.address) {
    const contentSections = [
      'footer',
      '.footer',
      '#footer',
      '.contact',
      '#contact',
      '.contact-us',
      '.about',
      '#about',
      '.about-us',
      '.location',
      '.locations',
      '.office',
      '.company-info',
      '.business-info',
    ];

    for (const section of contentSections) {
      const sectionText = $(section).text();
      if (sectionText.length > 50) {
        // Look for address patterns in text
        const addressMatches = sectionText.match(
          /\d+\s+[A-Za-z\s]+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct)[^.]*?\d{5}(?:-\d{4})?/gi
        );
        if (addressMatches && addressMatches[0]) {
          result.address = addressMatches[0].trim();
          break;
        }

        // Look for city, state zip patterns
        const cityStateZip = sectionText.match(/([A-Za-z\s]+),\s*([A-Z]{2})\s*(\d{5}(?:-\d{4})?)/);
        if (cityStateZip && !result.city) {
          result.city = cityStateZip[1].trim();
          result.state = cityStateZip[2].trim();
          result.postalCode = cityStateZip[3].trim();
        }
      }
    }
  }

  // Try to parse comprehensive address from combined text
  if (result.address && !result.city) {
    const addressParts = result.address.split(',').map((p: string) => p.trim());
    if (addressParts.length >= 2) {
      // Enhanced parsing for different address formats
      if (addressParts.length >= 3) {
        // Format: Street, City, State ZIP
        result.city = addressParts[addressParts.length - 2];
        const lastPart = addressParts[addressParts.length - 1];

        // Extract state and zip from last part
        const stateZipMatch = lastPart.match(/([A-Z]{2})\s*(\d{5}(?:-\d{4})?)/);
        if (stateZipMatch) {
          result.state = stateZipMatch[1];
          result.postalCode = stateZipMatch[2];
        } else {
          result.state = lastPart;
        }
      } else {
        // Format: Street, City or City, State
        result.city = addressParts[addressParts.length - 1];
      }
    }
  }

  // Extract location from URL patterns (city-based URLs)
  if (!result.city) {
    const urlPath = new URL(url).pathname;
    const cityPatterns = [
      /\/([A-Za-z\-]+)-([A-Z]{2})\//i, // /city-state/
      /\/locations?\/([A-Za-z\-]+)/i, // /location/city
      /\/([A-Za-z\-]+)\/contact/i, // /city/contact
      /\/([A-Za-z\-]+)\.html?/i, // /city.html
    ];

    for (const pattern of cityPatterns) {
      const match = urlPath.match(pattern);
      if (match) {
        const cityCandidate = match[1].replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
        if (cityCandidate.length > 2 && !result.city) {
          result.city = cityCandidate;
          if (match[2]) result.state = match[2].toUpperCase();
          break;
        }
      }
    }
  }

  // Clean up and validate results
  Object.keys(result).forEach((key) => {
    if (typeof result[key] === 'string') {
      result[key] = result[key].trim().replace(/\s+/g, ' ');
      if (result[key].length === 0) delete result[key];
    }
  });

  return result;
}

export async function POST(request: NextRequest) {
  console.log('=== API ANALYZE-CONTENT START ===');

  try {
    const { url } = await request.json();
    console.log('Analyzing URL:', url);

    if (!url) {
      console.log('ERROR: Missing URL');
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      console.log('ERROR: Invalid URL format');
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    console.log('Fetching content from:', url);
    const html = await fetchWebContent(url);
    const $ = cheerio.load(html);

    // Extract basic information
    const title = $('title').text() || '';
    const metaDescription = $('meta[name="description"]').attr('content') || '';

    // Extract business address information from common patterns
    const businessAddress = extractBusinessAddress($, url);

    // Extract text content
    $('script, style, nav, footer, aside').remove(); // Remove non-content elements
    const textContent = $('body').text().replace(/\s+/g, ' ').trim();

    // Extract heading structure
    const headingStructure = {
      h1: $('h1')
        .map((_, el) => $(el).text().trim())
        .get(),
      h2: $('h2')
        .map((_, el) => $(el).text().trim())
        .get(),
      h3: $('h3')
        .map((_, el) => $(el).text().trim())
        .get(),
    };

    const allHeadings = [...headingStructure.h1, ...headingStructure.h2, ...headingStructure.h3];

    // Technical SEO analysis
    const images = $('img');
    const imagesWithAlt = images.filter('[alt]');
    const internalLinks = $('a[href^="/"], a[href*="' + new URL(url).hostname + '"]');
    const externalLinks = $('a[href^="http"]').not('[href*="' + new URL(url).hostname + '"]');

    const technicalSeo = {
      hasMetaDescription: !!metaDescription,
      metaDescriptionLength: metaDescription.length,
      titleLength: title.length,
      hasAltTags: imagesWithAlt.length,
      totalImages: images.length,
      internalLinks: internalLinks.length,
      externalLinks: externalLinks.length,
    };

    // Perform analysis
    const wordCount = tokenizer.tokenize(textContent)?.length || 0;
    const readabilityScore = calculateReadabilityScore(textContent);
    const sentimentScore = calculateSentimentScore(textContent);
    const aeoOptimization = analyzeAEOOptimization(textContent, title, allHeadings);
    const entities = extractEntities(textContent);
    const keywordDensity = calculateKeywordDensity(textContent);
    const aiEngineOptimization = analyzeAIEngineOptimization(textContent, title, allHeadings);

    // Generate schema markup
    const generatedSchema = await generateSchema($, nlp);
    const schema = generatedSchema
      ? {
          type: generatedSchema['@type'] as 'FAQPage' | 'Article',
          data: generatedSchema,
        }
      : {
          type: null as null,
          data: null,
        };

    // Analyze question gaps
    const primaryKeyword = extractPrimaryKeyword(title, textContent, keywordDensity);
    const questionGaps = await analyzeQuestionGaps($, primaryKeyword);

    const result: ContentAnalysisResult = {
      url,
      title,
      metaDescription,
      contentLength: textContent.length,
      wordCount,
      readabilityScore,
      sentimentScore,
      aeoOptimization,
      keywordDensity,
      entities,
      headingStructure,
      technicalSeo,
      aiEngineOptimization,
      schema,
      questionGaps,
      businessAddress,
    };

    console.log('Analysis completed successfully for:', url);
    console.log('Result overview:', {
      hasUrl: !!result.url,
      hasTitle: !!result.title,
      hasAeoOptimization: !!result.aeoOptimization,
      overallAeoScore: result.aeoOptimization?.overallAeoScore,
      resultKeys: Object.keys(result),
    });
    console.log('=== API ANALYZE-CONTENT SUCCESS ===');

    return NextResponse.json(result);
  } catch (error) {
    console.error('=== API ANALYZE-CONTENT ERROR ===');
    console.error('Error details:', error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    // Determine the specific error type and provide user-friendly messages
    if (error instanceof Error) {
      // Network/fetch errors
      if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
        return NextResponse.json(
          {
            error: 'Unable to reach the website',
            message:
              'The website appears to be down or unreachable. Please check the URL and try again.',
            code: 'NETWORK_ERROR',
          },
          { status: 400 }
        );
      }

      // Timeout errors
      if (error.message.includes('timeout')) {
        return NextResponse.json(
          {
            error: 'Request timeout',
            message:
              'The website took too long to respond. Please try again or check if the website is accessible.',
            code: 'TIMEOUT_ERROR',
          },
          { status: 408 }
        );
      }

      // SSL/HTTPS errors
      if (error.message.includes('certificate') || error.message.includes('SSL')) {
        return NextResponse.json(
          {
            error: 'SSL certificate error',
            message:
              "There is an issue with the website's security certificate. Please verify the URL is correct.",
            code: 'SSL_ERROR',
          },
          { status: 400 }
        );
      }

      // Invalid URL errors
      if (error.message.includes('Invalid URL') || error.message.includes('ERR_INVALID_URL')) {
        return NextResponse.json(
          {
            error: 'Invalid URL',
            message: 'Please enter a valid website URL starting with http:// or https://',
            code: 'INVALID_URL',
          },
          { status: 400 }
        );
      }

      // 404 or server errors
      if (error.message.includes('404') || error.message.includes('Request failed')) {
        return NextResponse.json(
          {
            error: 'Website not found',
            message: 'The requested page could not be found. Please check the URL and try again.',
            code: 'NOT_FOUND',
          },
          { status: 404 }
        );
      }

      // Rate limiting or blocking
      if (error.message.includes('429') || error.message.includes('rate limit')) {
        return NextResponse.json(
          {
            error: 'Rate limited',
            message:
              'The website is currently blocking our analysis requests. Please try again later.',
            code: 'RATE_LIMITED',
          },
          { status: 429 }
        );
      }
    }

    // Generic error fallback
    return NextResponse.json(
      {
        error: 'Analysis failed',
        message:
          'We encountered an issue analyzing this website. Please try again or contact support if the problem persists.',
        code: 'ANALYSIS_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
