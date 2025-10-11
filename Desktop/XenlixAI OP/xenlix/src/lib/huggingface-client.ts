import { getEnvironmentConfig } from './env-config';
import { hfEmbeddings, hfSentiment, hfEntities, hfHealthCheck, getHfClient } from './hf';

// HuggingFace configuration interface
interface HuggingFaceConfig {
  apiToken: string;
  model: string;
  maxRetries: number;
  timeoutMs: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

// Embedding response interface
export interface EmbeddingResponse {
  embeddings: number[][];
  model: string;
  usage: {
    tokens: number;
    processingTimeMs: number;
  };
}

// Health check response
export interface HuggingFaceHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  latency?: number;
  error?: string;
  modelInfo: {
    model: string;
    dimensions: number;
    maxTokens: number;
  };
  quota?: {
    remaining: number;
    limit: number;
    resetTime?: string;
  };
}

// Similarity matrix interface
export interface SimilarityMatrix {
  queryEmbeddings: number[][];
  contentEmbeddings: number[][];
  similarities: number[][];
  topMatches: Array<{
    queryIndex: number;
    query: string;
    contentIndex: number;
    content: string;
    similarity: number;
    rank: number;
  }>;
}

/**
 * HuggingFace Inference API client with robust error handling and retry logic
 */
export class HuggingFaceClient {
  private static instance: HuggingFaceClient;
  private config: HuggingFaceConfig;
  private isInitialized = false;
  private lastHealthCheck: number = 0;
  private healthStatus: HuggingFaceHealth['status'] = 'unhealthy';
  private consecutiveFailures = 0;
  private metrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    avgLatency: 0,
    quotaRemaining: 0,
  };

  constructor() {
    this.config = this.loadConfig();
    this.initializeClient();
  }

  // Singleton pattern
  public static getInstance(): HuggingFaceClient {
    if (!HuggingFaceClient.instance) {
      HuggingFaceClient.instance = new HuggingFaceClient();
    }
    return HuggingFaceClient.instance;
  }

  // Load configuration from environment
  private loadConfig(): HuggingFaceConfig {
    const env = getEnvironmentConfig();

    const apiToken = env.ai?.huggingface?.token || '';
    if (!apiToken) {
      // We intentionally do not throw here to keep constructor side-effect free;
      // healthCheck() and calls will surface a 401 with clear message.
      console.warn('HUGGINGFACE_API_TOKEN is not set. Calls will fail with 401.');
    }

    return {
      apiToken: apiToken,
      model: env.ai?.huggingface?.model || 'sentence-transformers/all-MiniLM-L6-v2',
      maxRetries: 3,
      timeoutMs: 30000, // 30 seconds
      baseDelayMs: 1000, // 1 second base delay
      maxDelayMs: 10000, // 10 seconds max delay
    };
  }

  // Initialize HuggingFace client
  private initializeClient(): void {
    try {
      // Initialization is lightweight now; the underlying client is in hf.ts
      console.log('✅ HuggingFace client wired to hf.ts helpers');
      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize HuggingFace client:', error);
      throw new Error(`HuggingFace initialization failed: ${error}`);
    }
  }

  // Exponential backoff delay calculation
  private calculateDelay(attempt: number): number {
    const delay = Math.min(this.config.baseDelayMs * Math.pow(2, attempt), this.config.maxDelayMs);
    // Add jitter (±25%)
    const jitter = delay * 0.25 * (Math.random() * 2 - 1);
    return Math.round(delay + jitter);
  }

  // Sleep utility for delays
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Simple hash function for consistent mock embeddings
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Health check with comprehensive validation
  public async healthCheck(): Promise<HuggingFaceHealth> {
    const startTime = Date.now();

    try {
      const res = await hfHealthCheck();
      const latency = Date.now() - startTime;
      this.lastHealthCheck = Date.now();
      if ((res as any).status === 'healthy') {
        this.healthStatus = 'healthy';
        this.consecutiveFailures = 0;
        return {
          status: 'healthy',
          latency,
          modelInfo: {
            model: this.config.model,
            dimensions: 384,
            maxTokens: 512,
          },
          quota: {
            remaining: this.metrics.quotaRemaining,
            limit: 1000,
          },
        };
      }
      throw new Error((res as any).error || 'HF health check failed');
    } catch (error) {
      const latency = Date.now() - startTime;
      this.consecutiveFailures++;
      this.healthStatus = this.consecutiveFailures > 5 ? 'unhealthy' : 'degraded';

      console.error('❌ HuggingFace health check failed:', error);

      return {
        status: this.healthStatus,
        error: error instanceof Error ? error.message : 'Unknown error',
        modelInfo: {
          model: this.config.model,
          dimensions: 384, // all-MiniLM-L6-v2 default
          maxTokens: 512,
        },
      };
    }
  }

  // Generate embeddings with retry logic and error handling
  public async generateEmbeddings(texts: string[]): Promise<EmbeddingResponse> {
    if (texts.length === 0) {
      throw new Error('No texts provided for embedding generation');
    }

    // Validate and clean input texts
    const validTexts = texts.map((text) => text?.trim()).filter((text) => text && text.length > 0);

    if (validTexts.length === 0) {
      throw new Error('No valid texts provided after filtering');
    }

    // No more mock branch; delegate to hf.ts which supports HF_MOCK for tests

    // Truncate texts that are too long
    const processedTexts = validTexts.map((text) => {
      if (text.length > 2000) {
        // Conservative limit for sentence transformers
        console.warn(`Text truncated from ${text.length} to 2000 characters`);
        return text.substring(0, 2000);
      }
      return text;
    });

    let lastError: Error | null = null;
    const startTime = Date.now();

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        console.log(
          `🧠 Generating embeddings for ${processedTexts.length} texts (attempt ${attempt + 1}/${this.config.maxRetries + 1})`
        );

        this.metrics.totalRequests++;

        // Create timeout controller
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

        const response = await hfEmbeddings(processedTexts);
        clearTimeout(timeoutId);
        let embeddings: number[][] = response.embeddings as any;

        // Validate embeddings
        if (!Array.isArray(embeddings) || embeddings.length !== processedTexts.length) {
          throw new Error(
            `Invalid embeddings response: expected ${processedTexts.length} embeddings, got ${embeddings.length}`
          );
        }

        // Validate embedding dimensions
        const expectedDimensions = 384; // all-MiniLM-L6-v2 dimensions
        for (let i = 0; i < embeddings.length; i++) {
          if (!Array.isArray(embeddings[i]) || embeddings[i].length !== expectedDimensions) {
            throw new Error(
              `Invalid embedding dimensions at index ${i}: expected ${expectedDimensions}, got ${embeddings[i]?.length}`
            );
          }
        }

        const processingTime = Date.now() - startTime;
        this.metrics.successfulRequests++;
        this.metrics.avgLatency = (this.metrics.avgLatency + processingTime) / 2;
        this.consecutiveFailures = 0;

        console.log(`✅ Generated ${embeddings.length} embeddings in ${processingTime}ms`);

        return {
          embeddings,
          model: this.config.model,
          usage: {
            tokens: processedTexts.join(' ').split(' ').length,
            processingTimeMs: processingTime,
          },
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.metrics.failedRequests++;
        this.consecutiveFailures++;

        console.error(`❌ Embedding generation attempt ${attempt + 1} failed:`, lastError.message);

        // Don't retry on certain errors
        if (
          lastError.message.includes('authentication') ||
          lastError.message.includes('quota') ||
          lastError.message.includes('rate limit')
        ) {
          console.error('❌ Non-retryable error encountered, failing immediately');
          break;
        }

        // Apply exponential backoff before retry
        if (attempt < this.config.maxRetries) {
          const delay = this.calculateDelay(attempt);
          console.log(`⏳ Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    // All attempts failed
    const finalError = lastError || new Error('Unknown embedding generation failure');
    console.error(`❌ All embedding generation attempts failed: ${finalError.message}`);
    throw finalError;
  }

  // Calculate cosine similarity between two vectors
  public cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) return 0;

    return dotProduct / denominator;
  }

  // Generate similarity matrix between queries and content
  public generateSimilarityMatrix(
    queries: string[],
    queryEmbeddings: number[][],
    content: string[],
    contentEmbeddings: number[][]
  ): SimilarityMatrix {
    const similarities: number[][] = [];

    // Calculate similarity matrix
    for (let i = 0; i < queryEmbeddings.length; i++) {
      similarities[i] = [];
      for (let j = 0; j < contentEmbeddings.length; j++) {
        similarities[i][j] = this.cosineSimilarity(queryEmbeddings[i], contentEmbeddings[j]);
      }
    }

    // Find top matches for each query
    const topMatches: SimilarityMatrix['topMatches'] = [];

    for (let i = 0; i < queries.length; i++) {
      const queryMatches = content.map((contentText, j) => ({
        queryIndex: i,
        query: queries[i],
        contentIndex: j,
        content: contentText.substring(0, 200) + (contentText.length > 200 ? '...' : ''),
        similarity: similarities[i][j],
        rank: 0, // Will be set below
      }));

      // Sort by similarity and assign ranks
      queryMatches.sort((a, b) => b.similarity - a.similarity);
      queryMatches.forEach((match, index) => {
        match.rank = index + 1;
      });

      // Take top 3 matches per query
      topMatches.push(...queryMatches.slice(0, 3));
    }

    return {
      queryEmbeddings,
      contentEmbeddings,
      similarities,
      topMatches: topMatches.sort((a, b) => b.similarity - a.similarity),
    };
  }

  // Get client metrics
  public getMetrics() {
    return {
      ...this.metrics,
      isInitialized: this.isInitialized,
      healthStatus: this.healthStatus,
      lastHealthCheck: this.lastHealthCheck,
      consecutiveFailures: this.consecutiveFailures,
      config: {
        model: this.config.model,
        maxRetries: this.config.maxRetries,
        timeoutMs: this.config.timeoutMs,
      },
    };
  }

  // Test connectivity with detailed diagnostics
  public async testConnectivity(): Promise<{
    success: boolean;
    latency?: number;
    error?: string;
    details: {
      authentication: boolean;
      modelAccess: boolean;
      quotaStatus: 'available' | 'limited' | 'exceeded' | 'unknown';
      responseFormat: boolean;
    };
  }> {
    const startTime = Date.now();
    const details = {
      authentication: false,
      modelAccess: false,
      quotaStatus: 'unknown' as 'available' | 'limited' | 'exceeded' | 'unknown',
      responseFormat: false,
    };

    try {
      const health = await this.healthCheck();
      const latency = Date.now() - startTime;

      if (health.status === 'healthy') {
        details.authentication = true;
        details.modelAccess = true;
        details.responseFormat = true;
        details.quotaStatus = health.quota?.remaining
          ? health.quota.remaining > 10
            ? 'available'
            : 'limited'
          : 'unknown';

        return {
          success: true,
          latency,
          details,
        };
      } else {
        return {
          success: false,
          error: health.error,
          details,
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Analyze error to provide better diagnostics
      if (errorMessage.includes('401') || errorMessage.includes('authentication')) {
        details.authentication = false;
      } else if (errorMessage.includes('404') || errorMessage.includes('model')) {
        details.authentication = true;
        details.modelAccess = false;
      } else if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
        details.authentication = true;
        details.modelAccess = true;
        details.quotaStatus = 'exceeded';
      }

      return {
        success: false,
        error: errorMessage,
        details,
      };
    }
  }

  // Real sentiment analysis using HuggingFace inference
  public async analyzeSentiment(text: string): Promise<{ sentiment: string; confidence: number }> {
    const maxLength = 512;
    const truncatedText = text.slice(0, maxLength);
    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        console.log(`🔍 Analyzing sentiment (attempt ${attempt + 1}/${this.config.maxRetries})`);
        const result = await hfSentiment(truncatedText);
        if (result && result.label && typeof result.score === 'number') {
          return {
            sentiment: result.label.toLowerCase(),
            confidence: result.score,
          };
        }

        throw new Error('Invalid sentiment analysis response format');
      } catch (error) {
        console.warn(`⚠️ Sentiment analysis attempt ${attempt + 1} failed:`, error);

        if (attempt === this.config.maxRetries - 1) {
          // Fallback to keyword-based analysis
          console.log('🔄 Falling back to keyword-based sentiment analysis');
          return this.fallbackSentimentAnalysis(text);
        }

        const delay = this.calculateDelay(attempt);
        await this.sleep(delay);
      }
    }

    // Should not reach here, but return fallback just in case
    return this.fallbackSentimentAnalysis(text);
  }

  // Expose NER using HF helpers
  public async extractEntities(
    text: string
  ): Promise<Array<{ entity: string; word: string; score: number }>> {
    const maxLength = 1024;
    const truncated = text.slice(0, maxLength);
    try {
      const res = await hfEntities(truncated);
      return res as any;
    } catch (error) {
      console.warn('Entity extraction failed:', error);
      return [];
    }
  }

  // Text classification for business industry detection
  public async classifyText(
    text: string,
    labels: string[]
  ): Promise<{ label: string; score: number }[]> {
    const maxLength = 512;
    const truncatedText = text.slice(0, maxLength);

    try {
      const result = await getHfClient().zeroShotClassification({
        model: 'facebook/bart-large-mnli',
        inputs: truncatedText,
        parameters: { candidate_labels: labels },
      });

      if (result && 'labels' in result && 'scores' in result) {
        const typedResult = result as { labels: string[]; scores: number[] };
        return typedResult.labels.map((label: string, index: number) => ({
          label,
          score: typedResult.scores[index],
        }));
      }

      throw new Error('Invalid classification response format');
    } catch (error) {
      console.warn('Text classification failed, using fallback:', error);
      // Simple fallback based on keyword matching
      return this.fallbackTextClassification(text, labels);
    }
  }

  // Fallback sentiment analysis using keywords
  private fallbackSentimentAnalysis(text: string): { sentiment: string; confidence: number } {
    const lowerText = text.toLowerCase();
    const positiveWords = [
      'excellent',
      'great',
      'amazing',
      'wonderful',
      'best',
      'professional',
      'quality',
      'recommended',
      'friendly',
      'satisfied',
      'outstanding',
      'fantastic',
    ];
    const negativeWords = [
      'bad',
      'terrible',
      'awful',
      'worst',
      'poor',
      'horrible',
      'disappointed',
      'unprofessional',
      'slow',
      'expensive',
      'rude',
    ];

    const positiveCount = positiveWords.filter((word) => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter((word) => lowerText.includes(word)).length;

    if (positiveCount > negativeCount) {
      return { sentiment: 'positive', confidence: Math.min(0.8, 0.5 + positiveCount * 0.1) };
    } else if (negativeCount > positiveCount) {
      return { sentiment: 'negative', confidence: Math.min(0.8, 0.5 + negativeCount * 0.1) };
    } else {
      return { sentiment: 'neutral', confidence: 0.6 };
    }
  }

  // Fallback text classification using keyword matching
  private fallbackTextClassification(
    text: string,
    labels: string[]
  ): { label: string; score: number }[] {
    const lowerText = text.toLowerCase();
    const labelScores = labels.map((label) => {
      const keywords = label.toLowerCase().split(/[\s-_]+/);
      const matchCount = keywords.filter((keyword) => lowerText.includes(keyword)).length;
      return {
        label,
        score: matchCount / keywords.length,
      };
    });

    return labelScores.sort((a, b) => b.score - a.score);
  }
}

// Export singleton instance
export const huggingFaceClient = HuggingFaceClient.getInstance();

// Export utility functions
export function validateEmbeddingDimensions(embeddings: number[][]): boolean {
  if (!Array.isArray(embeddings) || embeddings.length === 0) return false;

  const expectedDim = 384; // all-MiniLM-L6-v2
  return embeddings.every(
    (embedding) => Array.isArray(embedding) && embedding.length === expectedDim
  );
}

export function calculateSimilarityScore(similarities: number[][]): {
  averageScore: number;
  maxScore: number;
  minScore: number;
  coveragePercentage: number;
} {
  const allScores = similarities.flat();
  const threshold = 0.5; // Similarity threshold for "good" matches

  return {
    averageScore: allScores.reduce((sum, score) => sum + score, 0) / allScores.length,
    maxScore: Math.max(...allScores),
    minScore: Math.min(...allScores),
    coveragePercentage:
      (allScores.filter((score) => score >= threshold).length / allScores.length) * 100,
  };
}
