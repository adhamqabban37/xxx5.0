/**
 * Enhanced Business Information Extractor
 * Uses Crawl4AI, HuggingFace embeddings, and NLP to extract comprehensive business data
 */

import { z } from 'zod';
import { HuggingFaceClient } from './huggingface-client';
import { Crawl4AIService } from './crawl4ai-service';

// Enhanced business information schema
export const BusinessInfoSchema = z.object({
  // Core identifiers
  businessName: z.string(),
  name: z.string().optional(), // Alias for businessName
  legalName: z.string().optional(),
  dbaName: z.string().optional(),
  description: z.string().optional(),

  // Industry classification
  industry: z.string(),
  subIndustry: z.string().optional(),
  naicsCode: z.string().optional(),
  sicCode: z.string().optional(),

  // Location data
  location: z.object({
    address: z.object({
      street: z.string().optional(),
      city: z.string(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      country: z.string().default('US'),
      formattedAddress: z.string().optional(),
    }),
    coordinates: z
      .object({
        latitude: z.number(),
        longitude: z.number(),
      })
      .optional(),
    serviceArea: z.array(z.string()).default([]),
    timezone: z.string().optional(),
  }),

  // Contact information
  contact: z.object({
    phone: z.string().optional(),
    email: z.string().email().optional(),
    website: z.string().url().optional(),
    fax: z.string().optional(),
    tollFree: z.string().optional(),
  }),

  // Services and offerings
  services: z.array(z.string()).default([]),
  products: z.array(z.string()).default([]),
  specialties: z.array(z.string()).default([]),

  // Business attributes
  attributes: z.object({
    yearEstablished: z.number().optional(),
    employeeCount: z.number().optional(),
    annualRevenue: z.string().optional(),
    businessType: z
      .enum(['Corporation', 'LLC', 'Partnership', 'Sole Proprietorship', 'Other'])
      .optional(),
    licenseNumber: z.string().optional(),
    certifications: z.array(z.string()).default([]),
    awards: z.array(z.string()).default([]),
  }),

  // Operating details
  hours: z
    .object({
      monday: z.string().optional(),
      tuesday: z.string().optional(),
      wednesday: z.string().optional(),
      thursday: z.string().optional(),
      friday: z.string().optional(),
      saturday: z.string().optional(),
      sunday: z.string().optional(),
      holidayHours: z.string().optional(),
    })
    .optional(),

  // Online presence
  socialMedia: z
    .object({
      facebook: z.string().optional(),
      instagram: z.string().optional(),
      twitter: z.string().optional(),
      linkedin: z.string().optional(),
      youtube: z.string().optional(),
      tiktok: z.string().optional(),
      pinterest: z.string().optional(),
    })
    .optional(),

  // Reviews and reputation
  averageRating: z.number().min(0).max(5).optional(), // Direct property for easy access
  reviews: z
    .array(
      z.object({
        text: z.string(),
        rating: z.number().min(1).max(5),
        author: z.string().optional(),
        date: z.string().optional(),
        platform: z.string().optional(),
      })
    )
    .default([]), // Direct property for easy access
  reputation: z
    .object({
      averageRating: z.number().min(0).max(5),
      totalReviews: z.number().min(0),
      platforms: z
        .object({
          google: z.object({ rating: z.number(), count: z.number() }).optional(),
          yelp: z.object({ rating: z.number(), count: z.number() }).optional(),
          facebook: z.object({ rating: z.number(), count: z.number() }).optional(),
          bbb: z.object({ rating: z.string(), accredited: z.boolean() }).optional(),
        })
        .optional(),
      sentiment: z.enum(['positive', 'neutral', 'negative']).optional(),
    })
    .optional(),

  // SEO and marketing data
  marketing: z.object({
    targetKeywords: z.array(z.string()).default([]),
    competitorKeywords: z.array(z.string()).default([]),
    targetAudience: z.array(z.string()).default([]),
    uniqueSellingPoints: z.array(z.string()).default([]),
    brandVoice: z.string().optional(),
    valueProposition: z.string().optional(),
  }),

  // Extraction metadata
  metadata: z.object({
    extractedAt: z.date(),
    sourceUrl: z.string().url(),
    extractionMethods: z.array(z.string()),
    confidence: z.number().min(0).max(1),
    completeness: z.number().min(0).max(1),
    needsReview: z.array(z.string()).default([]),
    missingData: z.array(z.string()).default([]),
  }),
});

export type BusinessInfo = z.infer<typeof BusinessInfoSchema>;

export class BusinessExtractor {
  private crawl4ai: Crawl4AIService;
  private hf: HuggingFaceClient;

  constructor() {
    this.crawl4ai = new Crawl4AIService();
    this.hf = new HuggingFaceClient();
  }

  /**
   * Extract comprehensive business information from a website URL
   */
  async extractBusinessInfo(url: string): Promise<BusinessInfo> {
    console.log(`Extracting business information from: ${url}`);

    // Step 1: Crawl and analyze the website
    const crawlResult = await this.crawl4ai.scanWithFallback({
      url,
      scan_type: 'full',
      include_ai_analysis: true,
      user_agent: 'XenlixAI-Bot/1.0 (+https://xenlix.ai/bot)',
    });

    // Step 2: Extract basic business data from crawl results
    const basicInfo = this.extractBasicInfo(crawlResult, url);

    // Step 3: Use HuggingFace for enhanced NLP analysis
    const enhancedInfo = await this.enhanceWithNLP(basicInfo, crawlResult);

    // Step 4: Classify industry and extract specialized data
    const classifiedInfo = await this.classifyBusiness(enhancedInfo);

    // Step 5: Extract contact and location data
    const locationInfo = await this.extractLocationData(classifiedInfo, crawlResult);

    // Step 6: Analyze competitive positioning
    const marketingInfo = await this.extractMarketingInsights(locationInfo, crawlResult);

    return BusinessInfoSchema.parse(marketingInfo);
  }

  /**
   * Extract basic business information from crawl results
   */
  private extractBasicInfo(crawlResult: any, sourceUrl: string): Partial<BusinessInfo> {
    const metadata = crawlResult.metadata || {};
    const content = crawlResult.content || {};
    const schemas = crawlResult.schemas?.jsonLd || [];

    // Extract business name from multiple sources
    let businessName = '';
    if (schemas.length > 0) {
      const orgSchema = schemas.find(
        (s: any) => s['@type'] === 'Organization' || s['@type'] === 'LocalBusiness'
      );
      businessName = orgSchema?.name || '';
    }

    if (!businessName) {
      businessName = metadata.title || '';
      // Clean up common title patterns
      businessName = businessName
        .replace(/\s*[\|\-\–]\s*.*/g, '') // Remove everything after | or -
        .replace(/\s*(Home|Homepage|Welcome)\s*/gi, '')
        .trim();
    }

    // Extract services from content analysis
    const services = this.extractServicesFromContent(content.text || '');

    return {
      businessName,
      contact: {
        website: sourceUrl,
        phone: this.extractPhoneNumber(content.text || ''),
        email: this.extractEmail(content.text || ''),
      },
      services,
      metadata: {
        extractedAt: new Date(),
        sourceUrl,
        extractionMethods: ['crawl4ai'],
        confidence: 0.6,
        completeness: 0.4,
        needsReview: [],
        missingData: [],
      },
    };
  }

  /**
   * Enhance business info using HuggingFace NLP models
   */
  private async enhanceWithNLP(
    basicInfo: Partial<BusinessInfo>,
    crawlResult: any
  ): Promise<Partial<BusinessInfo>> {
    const content = crawlResult.content?.text || '';

    if (!content) {
      return basicInfo;
    }

    try {
      // Use HuggingFace for business classification and entity extraction
      const [industry, entities, sentiment] = await Promise.all([
        this.classifyIndustry(content),
        this.extractEntities(content),
        this.analyzeSentiment(content),
      ]);

      return {
        ...basicInfo,
        industry: industry || 'General Business',
        services: [...(basicInfo.services || []), ...this.extractServicesFromEntities(entities)],
        marketing: {
          targetKeywords: this.extractKeywords(content),
          competitorKeywords: [], // Add missing required property
          targetAudience: this.inferTargetAudience(content, industry),
          uniqueSellingPoints: this.extractUSPs(content),
          brandVoice: this.analyzeBrandVoice(content, sentiment),
        },
      };
    } catch (error) {
      console.warn('HuggingFace enhancement failed:', error);
      return basicInfo;
    }
  }

  /**
   * Classify business industry using HuggingFace
   */
  private async classifyIndustry(content: string): Promise<string> {
    try {
      // Use real HuggingFace text classification with industry labels
      const industryLabels = [
        'Healthcare',
        'Legal Services',
        'Real Estate',
        'Automotive',
        'Restaurant',
        'Retail',
        'Technology',
        'Construction',
        'Education',
        'Finance',
        'Manufacturing',
        'Professional Services',
        'Entertainment',
        'Agriculture',
        'Transportation',
      ];

      const results = await this.hf.classifyText(content.substring(0, 512), industryLabels);

      // Return the highest scoring industry
      if (results.length > 0 && results[0].score > 0.3) {
        return results[0].label;
      }

      return 'General Business';
    } catch (error) {
      console.warn('Industry classification failed:', error);
      return 'General Business';
    }
  }

  /**
   * Extract named entities using HuggingFace NER
   */
  private async extractEntities(content: string): Promise<any[]> {
    try {
      const ner = await this.hf.extractEntities(content.substring(0, 1024));
      if (Array.isArray(ner) && ner.length > 0) return ner;
      // Fallback to simple regex if NER returns nothing
      const entities: Array<{ type: string; value: string }> = [];
      const phoneRegex = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
      const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
      (content.match(phoneRegex) || []).forEach((p) => entities.push({ type: 'phone', value: p }));
      (content.match(emailRegex) || []).forEach((e) => entities.push({ type: 'email', value: e }));
      return entities;
    } catch (error) {
      console.warn('Entity extraction failed:', error);
      return [];
    }
  }

  /**
   * Analyze content sentiment
   */
  private async analyzeSentiment(content: string): Promise<string> {
    try {
      // Use real HuggingFace sentiment analysis
      const result = await this.hf.analyzeSentiment(content.substring(0, 512));
      return result.sentiment;
    } catch (error) {
      console.warn('Sentiment analysis failed:', error);
      return 'neutral';
    }
  }

  /**
   * Extract phone number from content
   */
  private extractPhoneNumber(content: string): string | undefined {
    const phoneRegex = /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
    const match = phoneRegex.exec(content);
    return match ? match[0] : undefined;
  }

  /**
   * Extract email from content
   */
  private extractEmail(content: string): string | undefined {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const match = emailRegex.exec(content);
    return match ? match[0] : undefined;
  }

  /**
   * Extract services from content text
   */
  private extractServicesFromContent(content: string): string[] {
    const serviceKeywords = [
      'services',
      'solutions',
      'offerings',
      'specialties',
      'expertise',
      'capabilities',
      'products',
    ];

    const services: string[] = [];
    const lines = content.split('\n');

    lines.forEach((line) => {
      serviceKeywords.forEach((keyword) => {
        if (line.toLowerCase().includes(keyword)) {
          // Extract potential service names from the line
          const words = line.split(/[,\n\r\t]/).map((w) => w.trim());
          words.forEach((word) => {
            if (word.length > 3 && word.length < 50) {
              services.push(word);
            }
          });
        }
      });
    });

    return [...new Set(services)].slice(0, 10); // Dedupe and limit
  }

  /**
   * Extract services from named entities
   */
  private extractServicesFromEntities(entities: any[]): string[] {
    return entities
      .filter((entity) => entity.entity_group === 'MISC' || entity.entity_group === 'ORG')
      .map((entity) => entity.word)
      .filter((word) => word.length > 3 && word.length < 30)
      .slice(0, 5);
  }

  /**
   * Extract keywords from content
   */
  private extractKeywords(content: string): string[] {
    // Simple keyword extraction - could be enhanced with TF-IDF
    const words = content
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 4 && word.length < 20);

    const frequency: { [key: string]: number } = {};
    words.forEach((word) => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Infer target audience from content and industry
   */
  private inferTargetAudience(content: string, industry: string): string[] {
    const audiences: string[] = [];

    // Industry-based audiences
    switch (industry.toLowerCase()) {
      case 'healthcare':
        audiences.push('Patients', 'Medical Professionals', 'Insurance Providers');
        break;
      case 'legal services':
        audiences.push('Individuals', 'Businesses', 'Insurance Companies');
        break;
      case 'real estate':
        audiences.push('Home Buyers', 'Sellers', 'Investors', 'Renters');
        break;
      default:
        audiences.push('General Public', 'Businesses', 'Professionals');
    }

    return audiences;
  }

  /**
   * Extract unique selling propositions
   */
  private extractUSPs(content: string): string[] {
    const uspIndicators = [
      'unique',
      'exclusive',
      'only',
      'best',
      'leading',
      'premier',
      'top',
      'award-winning',
      'certified',
      'experienced',
      'trusted',
      'proven',
    ];

    const sentences = content.split(/[.!?]+/);
    const usps: string[] = [];

    sentences.forEach((sentence) => {
      const lowerSentence = sentence.toLowerCase();
      if (uspIndicators.some((indicator) => lowerSentence.includes(indicator))) {
        if (sentence.trim().length > 10 && sentence.trim().length < 200) {
          usps.push(sentence.trim());
        }
      }
    });

    return usps.slice(0, 5);
  }

  /**
   * Analyze brand voice from content and sentiment
   */
  private analyzeBrandVoice(content: string, sentiment: string): string {
    const formalWords = ['professional', 'expertise', 'qualified', 'certified'];
    const casualWords = ['friendly', 'easy', 'simple', 'fun'];

    const lowerContent = content.toLowerCase();
    const formalCount = formalWords.reduce(
      (count, word) => count + (lowerContent.split(word).length - 1),
      0
    );
    const casualCount = casualWords.reduce(
      (count, word) => count + (lowerContent.split(word).length - 1),
      0
    );

    if (formalCount > casualCount) {
      return 'Professional and Authoritative';
    } else if (casualCount > formalCount) {
      return 'Friendly and Approachable';
    } else {
      return 'Balanced and Informative';
    }
  }

  /**
   * Classify and enhance business data based on industry
   */
  private async classifyBusiness(info: Partial<BusinessInfo>): Promise<Partial<BusinessInfo>> {
    // Add industry-specific enhancements
    return info;
  }

  /**
   * Extract location and geographical data
   */
  private async extractLocationData(
    info: Partial<BusinessInfo>,
    crawlResult: any
  ): Promise<Partial<BusinessInfo>> {
    // Enhance location data extraction
    return info;
  }

  /**
   * Extract marketing insights and competitive data
   */
  private async extractMarketingInsights(
    info: Partial<BusinessInfo>,
    crawlResult: any
  ): Promise<Partial<BusinessInfo>> {
    // Add marketing analysis
    return info;
  }
}
