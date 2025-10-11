/**
 * AEO Content Analyzer - Production-Ready AEO Audit System
 * Combines Crawl4AI, HuggingFace MiniLM, and Lighthouse for comprehensive AEO analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { Crawl4AIService } from '@/lib/crawl4ai-service';
import { HuggingFaceClient } from '@/lib/huggingface-client';
import { lighthouseAuditsService } from '@/lib/firestore-services';
import { SchemaValidator, LighthouseAnalyzer, ContentGapAnalyzer } from '@/lib/schema-validator';

// Business type mappings for LocalBusiness schema subtypes
const BUSINESS_TYPE_MAPPINGS = {
  'dental|dentist|orthodontic': 'DentistOffice',
  'plumber|plumbing|pipe|drain': 'PlumbingService',
  'auto|car|mechanic|repair|automotive': 'AutoRepair',
  'restaurant|food|dining|cafe|bar': 'Restaurant',
  'lawyer|attorney|legal|law': 'Attorney',
  'doctor|medical|clinic|hospital': 'MedicalClinic',
  'real estate|realtor|property': 'RealEstateAgent',
  'hair|salon|beauty|spa': 'BeautySalon',
  'gym|fitness|training': 'ExerciseGym',
  'school|education|tutoring': 'EducationalOrganization',
  'contractor|construction|builder': 'GeneralContractor',
  'insurance|financial|accounting': 'InsuranceAgency',
  'veterinary|vet|animal': 'VeterinaryCare',
  'cleaning|janitorial|maid': 'HousePainter', // Closest available
  'marketing|advertising|agency': 'ProfessionalService',
};

// Common user intents for semantic analysis
const COMMON_USER_INTENTS = [
  'what services do you offer',
  'how much does it cost',
  'what are your hours',
  'where are you located',
  'how to contact you',
  'do you accept insurance',
  'how to schedule appointment',
  'what is your experience',
  'customer reviews testimonials',
  'emergency services available',
  'payment methods accepted',
  'service area coverage',
  'warranty guarantee policy',
  'how long does it take',
  'what makes you different',
  'free consultation estimate',
  'licensed bonded insured',
  'years in business',
  'before after photos',
  'satisfied customer stories',
];

interface PageAnalysis {
  url: string;
  pageType: 'home' | 'services' | 'locations' | 'about' | 'contact' | 'blog' | 'other';
  crawlData: any;
  lighthouseData: any;
  semanticAnalysis: {
    topIntents: Array<{
      intent: string;
      score: number;
      contentMatch: string;
    }>;
    weakIntents: Array<{
      intent: string;
      score: number;
      recommendedSnippet: string;
    }>;
  };
}

interface LocalBusinessSchema {
  '@context': string;
  '@type': string;
  '@id': string;
  url: string;
  name: string;
  image?: string;
  telephone?: string;
  email?: string;
  address?: any;
  geo?: any;
  openingHoursSpecification?: any[];
  sameAs?: string[];
  priceRange?: string;
  areaServed?: any;
  hasOfferCatalog?: any;
  aggregateRating?: any;
  review?: any[];
}

interface FAQSchema {
  '@context': string;
  '@type': string;
  mainEntity: Array<{
    '@type': string;
    name: string;
    acceptedAnswer: {
      '@type': string;
      text: string;
    };
  }>;
}

interface MetaData {
  title: string;
  description: string;
  canonical: string;
  ogTitle: string;
  ogDescription: string;
  issues: string[];
}

interface ValidationResult {
  schemaValid: boolean;
  richResultsEligible: boolean;
  lighthouseIssues: string[];
  fixes: string[];
  detailedValidation?: any;
  richResultsTestUrls?: {
    google: string[];
    testing: string[];
  };
}

class AEOContentAnalyzer {
  private crawl4ai: Crawl4AIService;
  private hfClient: HuggingFaceClient;

  constructor() {
    this.crawl4ai = new Crawl4AIService();
    this.hfClient = new HuggingFaceClient();
  }

  async analyzePages(urls: string[]): Promise<{
    pages: PageAnalysis[];
    localBusinessSchema: LocalBusinessSchema;
    faqSchemas: Record<string, FAQSchema>;
    metaData: Record<string, MetaData>;
    validation: ValidationResult;
    nextjsIntegration: any;
  }> {
    const pages: PageAnalysis[] = [];

    // Analyze each page
    for (const url of urls) {
      try {
        const pageAnalysis = await this.analyzeSinglePage(url);
        pages.push(pageAnalysis);
      } catch (error) {
        console.error(`Failed to analyze ${url}:`, error);
      }
    }

    // Generate schemas and metadata
    const localBusinessSchema = await this.generateLocalBusinessSchema(pages);
    const faqSchemas = await this.generateFAQSchemas(pages);
    const metaData = await this.generateMetaData(pages);

    // Validate everything
    const validation = await this.validateResults(localBusinessSchema, faqSchemas, pages);

    // Generate Next.js integration code
    const nextjsIntegration = this.generateNextJSIntegration(
      localBusinessSchema,
      faqSchemas,
      metaData
    );

    return {
      pages,
      localBusinessSchema,
      faqSchemas,
      metaData,
      validation,
      nextjsIntegration,
    };
  }

  private async analyzeSinglePage(url: string): Promise<PageAnalysis> {
    // Get crawled content
    const crawlResult = await this.crawl4ai.scanWithFallback({
      url,
      scan_type: 'full',
      include_ai_analysis: true,
      user_agent: 'AEO-Analyzer/1.0',
    });

    // Get Lighthouse data
    const lighthouseResults = await lighthouseAuditsService.getByUrl(url);
    const lighthouseData = lighthouseResults[0] || null;

    // Determine page type
    const pageType = this.determinePageType(url, crawlResult);

    // Perform semantic analysis
    const semanticAnalysis = await this.performSemanticAnalysis(
      crawlResult.extracted_content || '',
      COMMON_USER_INTENTS
    );

    return {
      url,
      pageType,
      crawlData: crawlResult,
      lighthouseData,
      semanticAnalysis,
    };
  }

  private determinePageType(url: string, crawlData: any): PageAnalysis['pageType'] {
    const urlPath = new URL(url).pathname.toLowerCase();
    const title = crawlData.title?.toLowerCase() || '';
    const content = (crawlData.extracted_content || '').toLowerCase();

    if (urlPath === '/' || urlPath === '/home' || title.includes('home')) return 'home';
    if (urlPath.includes('/services') || title.includes('services')) return 'services';
    if (urlPath.includes('/location') || title.includes('location')) return 'locations';
    if (urlPath.includes('/about') || title.includes('about')) return 'about';
    if (urlPath.includes('/contact') || title.includes('contact')) return 'contact';
    if (urlPath.includes('/blog') || urlPath.includes('/news')) return 'blog';

    return 'other';
  }

  private async performSemanticAnalysis(
    content: string,
    intents: string[]
  ): Promise<{
    topIntents: Array<{ intent: string; score: number; contentMatch: string }>;
    weakIntents: Array<{ intent: string; score: number; recommendedSnippet: string }>;
  }> {
    try {
      // Get embeddings for content and intents
      const contentChunks = this.chunkContent(content);
      const contentEmbeddings = await this.hfClient.generateEmbeddings(contentChunks);
      const intentEmbeddings = await this.hfClient.generateEmbeddings(intents);

      const topIntents: Array<{ intent: string; score: number; contentMatch: string }> = [];
      const weakIntents: Array<{ intent: string; score: number; recommendedSnippet: string }> = [];

      // Process similarity analysis if embeddings were generated successfully
      if (contentEmbeddings.embeddings && intentEmbeddings.embeddings) {
        intents.forEach((intent, intentIdx) => {
          const intentVector = intentEmbeddings.embeddings[intentIdx];
          let maxScore = 0;
          let bestMatch = '';

          contentChunks.forEach((chunk, chunkIdx) => {
            const chunkVector = contentEmbeddings.embeddings[chunkIdx];
            const similarity = this.calculateCosineSimilarity(intentVector, chunkVector);

            if (similarity > maxScore) {
              maxScore = similarity;
              bestMatch = chunk;
            }
          });

          if (maxScore > 0.7) {
            topIntents.push({
              intent,
              score: maxScore,
              contentMatch: bestMatch.substring(0, 200) + '...',
            });
          } else if (maxScore < 0.4) {
            weakIntents.push({
              intent,
              score: maxScore,
              recommendedSnippet: this.generateAnswerSnippet(intent),
            });
          }
        });
      }

      return {
        topIntents: topIntents.slice(0, 5),
        weakIntents: weakIntents.slice(0, 3),
      };
    } catch (error) {
      console.error('Semantic analysis failed:', error);
      return { topIntents: [], weakIntents: [] };
    }
  }

  private chunkContent(content: string): string[] {
    // Split content into meaningful chunks for analysis
    const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 20);
    const chunks: string[] = [];

    for (let i = 0; i < sentences.length; i += 3) {
      chunks.push(
        sentences
          .slice(i, i + 3)
          .join('. ')
          .trim()
      );
    }

    return chunks.length > 0 ? chunks : [content.substring(0, 500)];
  }

  private calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private generateAnswerSnippet(intent: string): string {
    const snippets: Record<string, string> = {
      'what services do you offer':
        'We specialize in [SERVICE_TYPE] with [X] years of experience serving [LOCATION]. Our comprehensive services include [LIST_SERVICES] to meet all your [INDUSTRY] needs.',
      'how much does it cost':
        'Our [SERVICE_TYPE] starts at $[PRICE] with free estimates available. We offer competitive pricing and flexible payment options to fit your budget.',
      'what are your hours':
        'We are open [DAYS] from [TIME] to [TIME]. Emergency services available 24/7 for urgent [SERVICE_TYPE] needs.',
      'where are you located':
        'Proudly serving [CITY], [STATE] and surrounding areas including [NEARBY_CITIES]. Our main location is at [ADDRESS] with convenient parking.',
      'how to contact you':
        'Call us at [PHONE] or email [EMAIL] for immediate assistance. You can also request a free quote through our online form.',
    };

    return (
      snippets[intent] ||
      `We provide comprehensive ${intent.replace('what ', '').replace('how ', '')} information. Contact us at [PHONE] to learn more about our services.`
    );
  }

  private async generateLocalBusinessSchema(pages: PageAnalysis[]): Promise<LocalBusinessSchema> {
    const homePage = pages.find((p) => p.pageType === 'home');
    const aboutPage = pages.find((p) => p.pageType === 'about');
    const contactPage = pages.find((p) => p.pageType === 'contact');

    const primaryData = homePage?.crawlData || pages[0]?.crawlData;

    if (!primaryData) {
      throw new Error('No crawled data available for LocalBusiness schema generation');
    }

    // Determine business type
    const businessType = this.determineBusinessType(primaryData);

    // Extract business information
    const businessInfo = await this.extractBusinessInfo(pages);

    const schema: LocalBusinessSchema = {
      '@context': 'https://schema.org',
      '@type': businessType,
      '@id': `${businessInfo.url}#business`,
      url: businessInfo.url,
      name: businessInfo.name,
      ...(businessInfo.image && { image: businessInfo.image }),
      ...(businessInfo.telephone && { telephone: businessInfo.telephone }),
      ...(businessInfo.email && { email: businessInfo.email }),
      ...(businessInfo.address && { address: businessInfo.address }),
      ...(businessInfo.geo && { geo: businessInfo.geo }),
      ...(businessInfo.hours && { openingHoursSpecification: businessInfo.hours }),
      ...(businessInfo.socialMedia &&
        businessInfo.socialMedia.length > 0 && { sameAs: businessInfo.socialMedia }),
      ...(businessInfo.priceRange && { priceRange: businessInfo.priceRange }),
      ...(businessInfo.areaServed && { areaServed: businessInfo.areaServed }),
      ...(businessInfo.services && { hasOfferCatalog: businessInfo.services }),
    };

    // Only include ratings if real data is detected
    if (businessInfo.hasRealRatings) {
      schema.aggregateRating = businessInfo.aggregateRating;
      schema.review = businessInfo.reviews;
    }

    return schema;
  }

  private determineBusinessType(crawlData: any): string {
    const content =
      `${crawlData.title || ''} ${crawlData.meta_description || ''} ${crawlData.extracted_content || ''}`.toLowerCase();

    for (const [keywords, type] of Object.entries(BUSINESS_TYPE_MAPPINGS)) {
      const keywordRegex = new RegExp(`\\b(${keywords})\\b`, 'i');
      if (keywordRegex.test(content)) {
        return type;
      }
    }

    return 'LocalBusiness'; // Default fallback
  }

  private async extractBusinessInfo(pages: PageAnalysis[]): Promise<any> {
    // Extract from multiple pages for comprehensive business info
    const homePage = pages.find((p) => p.pageType === 'home');
    const contactPage = pages.find((p) => p.pageType === 'contact');
    const aboutPage = pages.find((p) => p.pageType === 'about');

    const info: any = {};

    // Extract basic info from home page
    if (homePage) {
      info.name = homePage.crawlData.title?.replace(/\s*-\s*.*/, '') || 'Business Name TODO';
      info.url = homePage.url;

      // Look for logo in images
      const images = homePage.crawlData.content_analysis?.images || [];
      const logo = images.find(
        (img: any) =>
          img.alt?.toLowerCase().includes('logo') || img.src?.toLowerCase().includes('logo')
      );
      if (logo) info.image = logo.src;
    }

    // Extract contact info from contact page or any page
    const contactSources = [contactPage, homePage, aboutPage].filter(Boolean);
    for (const page of contactSources) {
      if (!page) continue;

      const content = page.crawlData.extracted_content || '';

      // Phone extraction
      if (!info.telephone) {
        const phoneMatch = content.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
        if (phoneMatch) info.telephone = phoneMatch[0];
      }

      // Email extraction
      if (!info.email) {
        const emailMatch = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (emailMatch) info.email = emailMatch[0];
      }

      // Address extraction (basic)
      if (!info.address) {
        const addressMatch = content.match(
          /\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Circle|Cir|Court|Ct)[A-Za-z\s,]*\d{5}/
        );
        if (addressMatch) {
          const addressParts = addressMatch[0].split(',');
          info.address = {
            '@type': 'PostalAddress',
            streetAddress: addressParts[0]?.trim() || 'TODO: Street Address',
            addressLocality: addressParts[1]?.trim() || 'TODO: City',
            addressRegion: 'TODO: State',
            postalCode: addressMatch[0].match(/\d{5}/)?.[0] || 'TODO: ZIP',
          };
        }
      }
    }

    // Set defaults for missing required fields
    if (!info.name) info.name = 'TODO: Business Name';
    if (!info.telephone) info.telephone = 'TODO: Phone Number';
    if (!info.address) {
      info.address = {
        '@type': 'PostalAddress',
        streetAddress: 'TODO: Street Address',
        addressLocality: 'TODO: City',
        addressRegion: 'TODO: State',
        postalCode: 'TODO: ZIP Code',
      };
    }

    return info;
  }

  private async generateFAQSchemas(pages: PageAnalysis[]): Promise<Record<string, FAQSchema>> {
    const faqSchemas: Record<string, FAQSchema> = {};

    for (const page of pages) {
      try {
        const faqs = await this.extractFAQsFromPage(page);
        if (faqs.length > 0) {
          faqSchemas[page.url] = {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqs.map((faq) => ({
              '@type': 'Question',
              name: faq.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
              },
            })),
          };
        }
      } catch (error) {
        console.error(`FAQ extraction failed for ${page.url}:`, error);
      }
    }

    return faqSchemas;
  }

  private async extractFAQsFromPage(
    page: PageAnalysis
  ): Promise<Array<{ question: string; answer: string }>> {
    const content = page.crawlData.extracted_content || '';
    const faqs: Array<{ question: string; answer: string }> = [];

    // Look for existing FAQ patterns
    const faqPatterns = [
      /(?:Q:|Question:)\s*([^?]*\?)\s*(?:A:|Answer:)\s*([^Q]*)/gi,
      /([^?.!]*\?)\s*([^?]*(?:\.|$))/g,
    ];

    for (const pattern of faqPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null && faqs.length < 8) {
        if (match[1] && match[2]) {
          faqs.push({
            question: match[1].trim(),
            answer: match[2].trim().substring(0, 300), // Limit answer length
          });
        }
      }
    }

    // If no FAQs found, generate from weak intents
    if (faqs.length === 0) {
      for (const intent of page.semanticAnalysis.weakIntents.slice(0, 5)) {
        faqs.push({
          question: this.intentToQuestion(intent.intent),
          answer: intent.recommendedSnippet,
        });
      }
    }

    return faqs;
  }

  private intentToQuestion(intent: string): string {
    const questionMap: Record<string, string> = {
      'what services do you offer': 'What services do you offer?',
      'how much does it cost': 'How much does it cost?',
      'what are your hours': 'What are your business hours?',
      'where are you located': 'Where are you located?',
      'how to contact you': 'How can I contact you?',
    };

    return questionMap[intent] || intent.charAt(0).toUpperCase() + intent.slice(1) + '?';
  }

  private async generateMetaData(pages: PageAnalysis[]): Promise<Record<string, MetaData>> {
    const metaData: Record<string, MetaData> = {};

    for (const page of pages) {
      const crawlData = page.crawlData;
      const currentTitle = crawlData.title || '';
      const currentDescription = crawlData.meta_description || '';

      // Generate optimized meta data
      const optimizedMeta = this.generateOptimizedMeta(page);

      // Detect issues
      const issues: string[] = [];
      if (!currentTitle) issues.push('Missing title tag');
      if (!currentDescription) issues.push('Missing meta description');
      if (currentTitle.length > 60) issues.push('Title too long (>60 chars)');
      if (currentDescription.length > 160) issues.push('Description too long (>160 chars)');
      if (currentDescription.length < 140) issues.push('Description too short (<140 chars)');

      metaData[page.url] = {
        title: optimizedMeta.title,
        description: optimizedMeta.description,
        canonical: page.url,
        ogTitle: optimizedMeta.title,
        ogDescription: optimizedMeta.description,
        issues,
      };
    }

    // Check for duplicates
    this.flagDuplicateMetaData(metaData);

    return metaData;
  }

  private generateOptimizedMeta(page: PageAnalysis): { title: string; description: string } {
    const crawlData = page.crawlData;
    const content = crawlData.extracted_content || '';
    const businessName = this.extractBusinessName(content);

    // Extract location/service info
    const location = this.extractLocation(content);
    const services = this.extractServices(content, page.pageType);

    let title = '';
    let description = '';

    switch (page.pageType) {
      case 'home':
        title = `${businessName} - ${services} in ${location}`;
        description = `Professional ${services.toLowerCase()} in ${location}. ${this.extractBenefit(content)} Call for free estimate.`;
        break;
      case 'services':
        title = `${services} - ${businessName} | ${location}`;
        description = `Expert ${services.toLowerCase()} services in ${location}. ${this.extractBenefit(content)} Contact us today.`;
        break;
      case 'contact':
        title = `Contact ${businessName} - ${services} in ${location}`;
        description = `Contact ${businessName} for ${services.toLowerCase()} in ${location}. ${this.extractBenefit(content)} Get quote.`;
        break;
      default:
        title = `${crawlData.title || page.pageType} - ${businessName}`;
        description = `${this.extractBenefit(content)} ${businessName} in ${location}. Contact us for ${services.toLowerCase()}.`;
    }

    // Ensure length constraints
    title = title.length > 60 ? title.substring(0, 57) + '...' : title;
    description = description.length > 160 ? description.substring(0, 157) + '...' : description;
    description =
      description.length < 140 ? description + ' Professional service guaranteed.' : description;

    return { title, description };
  }

  private extractBusinessName(content: string): string {
    // Try to extract business name from content
    const namePatterns = [
      /(?:Welcome to|About)\s+([A-Z][A-Za-z\s&]{2,30})(?:\s|$)/,
      /([A-Z][A-Za-z\s&]{2,30})(?:\s+is\s+a|\s+provides|\s+specializes)/,
    ];

    for (const pattern of namePatterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return 'TODO: Business Name';
  }

  private extractLocation(content: string): string {
    const locationMatch = content.match(
      /(?:in|serving|located)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/
    );
    return locationMatch?.[1] || 'TODO: Location';
  }

  private extractServices(content: string, pageType: string): string {
    const serviceKeywords = ['services', 'repair', 'installation', 'maintenance', 'consultation'];
    for (const keyword of serviceKeywords) {
      if (content.toLowerCase().includes(keyword)) {
        return keyword.charAt(0).toUpperCase() + keyword.slice(1);
      }
    }
    return 'Professional Services';
  }

  private extractBenefit(content: string): string {
    const benefits = [
      'Licensed & insured',
      'Free estimates',
      '24/7 emergency service',
      'Satisfaction guaranteed',
    ];
    const contentLower = content.toLowerCase();

    for (const benefit of benefits) {
      if (contentLower.includes(benefit.toLowerCase())) {
        return benefit;
      }
    }

    return 'Quality service';
  }

  private flagDuplicateMetaData(metaData: Record<string, MetaData>): void {
    const titles = new Set<string>();
    const descriptions = new Set<string>();

    Object.values(metaData).forEach((meta) => {
      if (titles.has(meta.title)) {
        meta.issues.push('Duplicate title detected');
      } else {
        titles.add(meta.title);
      }

      if (descriptions.has(meta.description)) {
        meta.issues.push('Duplicate description detected');
      } else {
        descriptions.add(meta.description);
      }
    });
  }

  private async validateResults(
    localBusinessSchema: LocalBusinessSchema,
    faqSchemas: Record<string, FAQSchema>,
    pages: PageAnalysis[]
  ): Promise<ValidationResult> {
    // Use the comprehensive schema validator
    const validationResults = SchemaValidator.validateAll({
      localBusinessSchema,
      faqSchemas,
      metaData: {}, // Will be populated separately
    });

    const issues: string[] = [];
    const fixes: string[] = [];

    // Collect validation issues
    if (!validationResults.localBusiness.isValid) {
      issues.push(...validationResults.localBusiness.errors);
      fixes.push(
        ...validationResults.localBusiness.errors.map((err) => `Fix LocalBusiness: ${err}`)
      );
    }

    // Check FAQ validation
    Object.entries(validationResults.faqs).forEach(([url, result]) => {
      if (!result.isValid) {
        issues.push(`FAQ schema issues on ${url}`);
        fixes.push(...result.errors.map((err) => `Fix FAQ: ${err}`));
      }
    });

    // Analyze Lighthouse issues
    pages.forEach((page) => {
      if (page.lighthouseData) {
        const lighthouseAnalysis = LighthouseAnalyzer.analyzeSEOAudit(page.lighthouseData);
        issues.push(...lighthouseAnalysis.issues);
        fixes.push(...lighthouseAnalysis.fixes);
      }
    });

    return {
      schemaValid: validationResults.localBusiness.isValid,
      richResultsEligible: validationResults.overall.richResultsReady && issues.length === 0,
      lighthouseIssues: issues,
      fixes,
      detailedValidation: validationResults,
      richResultsTestUrls: {
        google: SchemaValidator.generateRichResultsTestUrls({
          localBusiness: localBusinessSchema,
          faqs: faqSchemas,
        }).map((item) => item.url),
        testing: [
          `https://search.google.com/test/rich-results?url=${encodeURIComponent(pages[0]?.url || '')}`,
        ],
      },
    };
  }

  private generateNextJSIntegration(
    localBusinessSchema: LocalBusinessSchema,
    faqSchemas: Record<string, FAQSchema>,
    metaData: Record<string, MetaData>
  ) {
    return {
      layoutSchema: {
        filePath: '/app/layout.tsx',
        code: this.generateLayoutSchemaCode(localBusinessSchema),
      },
      pageSchemas: Object.entries(faqSchemas).map(([url, schema]) => ({
        url,
        filePath: this.getPageFilePath(url),
        faqSchema: schema,
        code: this.generatePageSchemaCode(schema),
      })),
      metaTags: Object.entries(metaData).map(([url, meta]) => ({
        url,
        filePath: this.getPageFilePath(url),
        code: this.generateMetaTagsCode(meta),
      })),
    };
  }

  private generateLayoutSchemaCode(schema: LocalBusinessSchema): string {
    return `
// Add this to your layout.tsx file in the <head> section
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify(${JSON.stringify(schema, null, 2)})
  }}
/>`;
  }

  private generatePageSchemaCode(schema: FAQSchema): string {
    return `
// Add this FAQ schema to the specific page component
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify(${JSON.stringify(schema, null, 2)})
  }}
/>

// Corresponding HTML FAQ section:
<section className="faq-section">
  <h2>Frequently Asked Questions</h2>
  ${schema.mainEntity
    .map(
      (faq) => `
  <div className="faq-item">
    <h3>${faq.name}</h3>
    <p>${faq.acceptedAnswer.text}</p>
  </div>`
    )
    .join('')}
</section>`;
  }

  private generateMetaTagsCode(meta: MetaData): string {
    return `
// Add to generateMetadata() function or page <Head>
export const metadata: Metadata = {
  title: "${meta.title}",
  description: "${meta.description}",
  alternates: {
    canonical: "${meta.canonical}"
  },
  openGraph: {
    title: "${meta.ogTitle}",
    description: "${meta.ogDescription}",
    url: "${meta.canonical}"
  }
};`;
  }

  private getPageFilePath(url: string): string {
    const path = new URL(url).pathname;
    if (path === '/') return '/app/page.tsx';
    if (path === '/services') return '/app/services/page.tsx';
    if (path === '/contact') return '/app/contact/page.tsx';
    if (path === '/about') return '/app/about/page.tsx';
    return `/app${path}/page.tsx`;
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { urls } = body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: 'URLs array is required' }, { status: 400 });
    }

    const analyzer = new AEOContentAnalyzer();
    const results = await analyzer.analyzePages(urls);

    return NextResponse.json({
      success: true,
      data: results,
      metadata: {
        pagesAnalyzed: results.pages.length,
        schemasGenerated: Object.keys(results.faqSchemas).length + 1, // +1 for LocalBusiness
        validationPassed: results.validation.richResultsEligible,
        processingTime: Date.now(),
      },
    });
  } catch (error) {
    console.error('AEO Content Analyzer error:', error);
    return NextResponse.json(
      {
        error: 'Analysis failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
