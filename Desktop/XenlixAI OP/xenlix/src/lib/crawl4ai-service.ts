import { z } from 'zod';
import { getEnvironmentConfig, getServiceUrl } from './env-config';

// Get environment configuration
const envConfig = getEnvironmentConfig();
const CRAWL4AI_SERVICE_URL = getServiceUrl('crawl4ai');

// Request schema
const crawl4aiRequestSchema = z.object({
  url: z.string().url(),
  scan_type: z.enum(['full', 'quick', 'schema-only']).default('full'),
  include_ai_analysis: z.boolean().default(true),
  user_agent: z.string().default('XenlixAI-Bot/1.0 (+https://xenlix.ai/bot)')
});

// Response schemas
const aeoAnalysisSchema = z.object({
  schema_compliance_score: z.number(),
  voice_search_readiness: z.number(),
  snippet_optimization_score: z.number(),
  faq_structure_score: z.number(),
  local_optimization_score: z.number(),
  overall_aeo_score: z.number()
});

const scanResultSchema = z.object({
  url: z.string(),
  status: z.string(),
  timestamp: z.string(),
  title: z.string().optional(),
  meta_description: z.string().optional(),
  canonical_url: z.string().optional(),
  word_count: z.number(),
  headings: z.record(z.string(), z.array(z.string())),
  json_ld_schemas: z.array(z.any()),
  schema_types: z.array(z.string()),
  has_faq_schema: z.boolean(),
  has_local_business_schema: z.boolean(),
  has_article_schema: z.boolean(),
  open_graph: z.record(z.string(), z.string().optional()),
  twitter_card: z.record(z.string(), z.string().optional()),
  content_analysis: z.record(z.string(), z.any()),
  aeo_analysis: aeoAnalysisSchema.optional(),
  recommendations: z.array(z.object({
    priority: z.string(),
    category: z.string(),
    issue: z.string(),
    solution: z.string(),
    impact: z.string(),
    effort: z.string()
  })),
  raw_html: z.string().optional(),
  extracted_content: z.string().optional()
});

export type ScanRequest = z.infer<typeof crawl4aiRequestSchema>;
export type ScanResult = z.infer<typeof scanResultSchema>;
export type AEOAnalysis = z.infer<typeof aeoAnalysisSchema>;

export class Crawl4AIService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || CRAWL4AI_SERVICE_URL;
  }

  /**
   * Check if the Crawl4AI service is healthy and available
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      return response.ok;
    } catch (error) {
      console.error('Crawl4AI service health check failed:', error);
      return false;
    }
  }

  /**
   * Scan a website using the Crawl4AI service
   */
  async scanWebsite(request: ScanRequest): Promise<ScanResult> {
    // Validate request
    const validatedRequest = crawl4aiRequestSchema.parse(request);

    try {
      const response = await fetch(`${this.baseUrl}/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedRequest),
        signal: AbortSignal.timeout(60000) // 60 second timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Crawl4AI service error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      // Validate response
      return scanResultSchema.parse(result);

    } catch (error) {
      console.error('Crawl4AI scan failed:', error);
      
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid response from Crawl4AI service: ${error.message}`);
      }
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('Unknown error occurred during website scan');
    }
  }

  /**
   * Fallback method that uses local scanner if Crawl4AI service is unavailable
   */
  async scanWithFallback(request: ScanRequest): Promise<ScanResult> {
    // First try Crawl4AI service
    if (await this.checkHealth()) {
      try {
        return await this.scanWebsite(request);
      } catch (error) {
        console.warn('Crawl4AI service scan failed, falling back to local scanner:', error);
      }
    }

    // Fallback to local scanner
    console.log('Using local scanner fallback for:', request.url);
    return await this.scanWithLocalFallback(request.url);
  }

  /**
   * Fallback implementation using the existing local WebsiteScanner
   */
  private async scanWithLocalFallback(url: string): Promise<ScanResult> {
    const { WebsiteScanner } = await import('@/lib/website-scanner');
    const scanner = new WebsiteScanner();
    
    try {
      const result = await scanner.scanWebsite(url);
      
      // Transform local scanner result to match Crawl4AI format
      return {
        url: result.url,
        status: result.status === 'success' ? 'success' : 'failed',
        timestamp: result.timestamp.toISOString(),
        title: result.title || undefined,
        meta_description: result.metaDescription || undefined,
        canonical_url: result.canonicalUrl || undefined,
        word_count: result.wordCount || 0,
        headings: result.headings || {},
        json_ld_schemas: result.jsonLd || [],
        schema_types: result.schemaTypes || [],
        has_faq_schema: result.hasFAQSchema || false,
        has_local_business_schema: result.hasLocalBusinessSchema || false,
        has_article_schema: result.hasArticleSchema || false,
        open_graph: result.openGraph || {},
        twitter_card: result.twitterCard || {},
        content_analysis: {
          has_question_answer_pairs: result.contentAnalysis?.hasQuestionAnswerPairs || false,
          has_clear_answers: result.contentAnalysis?.hasClearAnswers || false,
          has_natural_language_content: result.contentAnalysis?.hasNaturalLanguageContent || false,
          has_location_info: result.contentAnalysis?.hasLocationInfo || false,
          avg_sentence_length: result.contentAnalysis?.avgSentenceLength || 0,
          sentence_count: 0, // Not available in local scanner
          paragraph_count: 0 // Not available in local scanner
        },
        aeo_analysis: result.aeoScore ? {
          schema_compliance_score: result.aeoScore.schemaCompliance || 0,
          voice_search_readiness: result.aeoScore.voiceSearchReady || 0,
          snippet_optimization_score: result.aeoScore.snippetOptimized || 0,
          faq_structure_score: result.aeoScore.faqStructure || 0,
          local_optimization_score: result.aeoScore.localOptimization || 0,
          overall_aeo_score: result.aeoScore.overall || 0
        } : undefined,
        recommendations: result.recommendations?.map((rec: any) => ({
          priority: rec.priority,
          category: rec.category,
          issue: rec.issue,
          solution: rec.solution,
          impact: rec.impact,
          effort: rec.effort
        })) || [],
        raw_html: undefined, // Not provided by local scanner
        extracted_content: undefined // Not available in local scanner
      };
      
    } catch (error) {
      console.error('Local scanner fallback failed:', error);
      throw new Error(`Both Crawl4AI service and local scanner failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const crawl4aiService = new Crawl4AIService();