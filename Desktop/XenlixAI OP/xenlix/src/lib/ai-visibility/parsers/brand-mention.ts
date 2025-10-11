/**
 * Brand Mention Parser
 * Intelligently detects brand mentions, competitor references, and sentiment in AI-generated content
 */

import { BrandConfig, BrandMention, ParsedAnswer } from '../types';
import { logger } from '@/lib/logger';

export interface BrandParserConfig {
  case_sensitive: boolean;
  require_word_boundaries: boolean;
  min_mention_length: number;
  max_mentions_per_text: number;
  sentiment_enabled: boolean;
  position_analysis_enabled: boolean;
}

export class BrandMentionParser {
  private config: BrandParserConfig;

  constructor(config: Partial<BrandParserConfig> = {}) {
    this.config = {
      case_sensitive: false,
      require_word_boundaries: true,
      min_mention_length: 2,
      max_mentions_per_text: 50,
      sentiment_enabled: true,
      position_analysis_enabled: true,
      ...config,
    };
  }

  /**
   * Parse answer text for brand mentions and competitive analysis
   */
  parseAnswer(answerText: string, brands: BrandConfig[], promptText?: string): ParsedAnswer {
    const startTime = Date.now();

    try {
      // Clean and normalize text
      const normalizedText = this.normalizeText(answerText);
      const words = this.tokenizeText(normalizedText);

      // Find all brand mentions
      const allMentions = this.findBrandMentions(normalizedText, words, brands);

      // Group mentions by brand
      const mentionsByBrand = this.groupMentionsByBrand(allMentions);

      // Analyze competitive positioning if multiple brands found
      const competitiveAnalysis = this.analyzeCompetitivePositioning(allMentions, normalizedText);

      // Calculate answer-level metrics
      const metrics = this.calculateAnswerMetrics(allMentions, normalizedText, promptText);

      const result: ParsedAnswer = {
        original_text: answerText,
        normalized_text: normalizedText,
        total_words: words.length,
        brand_mentions: allMentions,
        mentions_by_brand: mentionsByBrand,
        competitive_analysis: competitiveAnalysis,
        answer_metrics: metrics,
        parsing_time_ms: Date.now() - startTime,
      };

      logger.info('Brand parsing completed', {
        text_length: answerText.length,
        total_mentions: allMentions.length,
        unique_brands: Object.keys(mentionsByBrand).length,
        parsing_time: result.parsing_time_ms,
      });

      return result;
    } catch (error) {
      logger.error('Brand parsing failed', error as Error, {
        text_length: answerText.length,
        brands_count: brands.length,
      });
      throw error;
    }
  }

  private normalizeText(text: string): string {
    // Clean up common text artifacts from AI responses
    let normalized = text
      .replace(/\[\d+\]/g, '') // Remove citation numbers [1], [2], etc.
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove markdown bold
      .replace(/\*([^*]+)\*/g, '$1') // Remove markdown italic
      .replace(/#{1,6}\s+([^\n]+)/g, '$1') // Remove markdown headers
      .replace(/`([^`]+)`/g, '$1') // Remove inline code markers
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    // Optional: case normalization for case-insensitive matching
    if (!this.config.case_sensitive) {
      normalized = normalized.toLowerCase();
    }

    return normalized;
  }

  private tokenizeText(text: string): string[] {
    // Simple tokenization - can be enhanced with NLP libraries
    return text
      .split(/[\s\.,;:!?\(\)\[\]\{\}\"\'""'']+/)
      .filter((word) => word.length >= this.config.min_mention_length);
  }

  private findBrandMentions(
    normalizedText: string,
    words: string[],
    brands: BrandConfig[]
  ): BrandMention[] {
    const mentions: BrandMention[] = [];

    for (const brand of brands) {
      // Search for primary brand name
      const primaryMentions = this.findMentionsForTerm(
        normalizedText,
        words,
        brand.name,
        brand.id,
        'primary'
      );
      mentions.push(...primaryMentions);

      // Search for brand aliases
      if (brand.aliases) {
        for (const alias of brand.aliases) {
          const aliasMentions = this.findMentionsForTerm(
            normalizedText,
            words,
            alias,
            brand.id,
            'alias'
          );
          mentions.push(...aliasMentions);
        }
      }
    }

    // Sort mentions by position and limit results
    return mentions
      .sort((a, b) => a.position - b.position)
      .slice(0, this.config.max_mentions_per_text);
  }

  private findMentionsForTerm(
    text: string,
    words: string[],
    searchTerm: string,
    brandId: string,
    mentionType: 'primary' | 'alias'
  ): BrandMention[] {
    const mentions: BrandMention[] = [];
    const normalizedTerm = this.config.case_sensitive ? searchTerm : searchTerm.toLowerCase();

    if (this.config.require_word_boundaries) {
      // Word boundary matching for more accurate results
      const regex = new RegExp(`\\b${this.escapeRegex(normalizedTerm)}\\b`, 'g');
      let match;

      while ((match = regex.exec(text)) !== null) {
        mentions.push(this.createBrandMention(match[0], match.index, brandId, mentionType, text));
      }
    } else {
      // Simple substring matching
      let index = text.indexOf(normalizedTerm);
      while (index !== -1) {
        mentions.push(this.createBrandMention(normalizedTerm, index, brandId, mentionType, text));
        index = text.indexOf(normalizedTerm, index + 1);
      }
    }

    return mentions;
  }

  private createBrandMention(
    matchedText: string,
    position: number,
    brandId: string,
    mentionType: 'primary' | 'alias',
    fullText: string
  ): BrandMention {
    const mention: BrandMention = {
      brand_id: brandId,
      matched_text: matchedText,
      position,
      mention_type: mentionType,
      confidence: this.calculateMentionConfidence(matchedText, position, fullText),
    };

    // Add contextual analysis if enabled
    if (this.config.sentiment_enabled) {
      mention.sentiment_score = this.analyzeSentiment(position, fullText);
      mention.context = this.extractContext(position, fullText);
    }

    if (this.config.position_analysis_enabled) {
      mention.position_term = this.analyzePositionTerm(position, fullText);
    }

    return mention;
  }

  private calculateMentionConfidence(
    matchedText: string,
    position: number,
    fullText: string
  ): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence for exact matches
    if (matchedText.length > 3) {
      confidence += 0.2;
    }

    // Increase confidence for mentions at the beginning
    if (position < fullText.length * 0.2) {
      confidence += 0.1;
    }

    // Check for contextual indicators
    const context = this.extractContext(position, fullText);
    if (context) {
      if (context.includes('recommend') || context.includes('best') || context.includes('top')) {
        confidence += 0.1;
      }
      if (context.includes('vs') || context.includes('versus') || context.includes('compared to')) {
        confidence += 0.1;
      }
    }

    return Math.min(confidence, 1.0);
  }

  private analyzeSentiment(position: number, fullText: string): number {
    // Simple sentiment analysis - can be enhanced with ML models
    const context = this.extractContext(position, fullText, 50);
    if (!context) return 0.5; // Neutral

    const positiveWords = [
      'good',
      'great',
      'excellent',
      'best',
      'top',
      'recommend',
      'love',
      'amazing',
      'perfect',
      'outstanding',
    ];
    const negativeWords = [
      'bad',
      'terrible',
      'worst',
      'avoid',
      'hate',
      'awful',
      'poor',
      'disappointing',
      'useless',
    ];

    let positiveCount = 0;
    let negativeCount = 0;

    const contextWords = context.toLowerCase().split(/\s+/);

    for (const word of contextWords) {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    }

    if (positiveCount === 0 && negativeCount === 0) return 0.5; // Neutral

    const totalSentimentWords = positiveCount + negativeCount;
    return positiveCount / totalSentimentWords;
  }

  private analyzePositionTerm(position: number, fullText: string): number {
    // Calculate position as percentage through the text
    const relativePosition = position / fullText.length;

    // Higher scores for mentions earlier in the text
    if (relativePosition <= 0.2) return 1.0; // First 20% of text
    if (relativePosition <= 0.4) return 0.8; // First 40% of text
    if (relativePosition <= 0.6) return 0.6; // First 60% of text
    if (relativePosition <= 0.8) return 0.4; // First 80% of text
    return 0.2; // Last 20% of text
  }

  private extractContext(
    position: number,
    fullText: string,
    contextLength: number = 100
  ): string | undefined {
    const start = Math.max(0, position - contextLength);
    const end = Math.min(fullText.length, position + contextLength);
    return fullText.substring(start, end).trim();
  }

  private groupMentionsByBrand(mentions: BrandMention[]): Record<string, BrandMention[]> {
    const grouped: Record<string, BrandMention[]> = {};

    for (const mention of mentions) {
      if (!grouped[mention.brand_id]) {
        grouped[mention.brand_id] = [];
      }
      grouped[mention.brand_id].push(mention);
    }

    return grouped;
  }

  private analyzeCompetitivePositioning(
    mentions: BrandMention[],
    fullText: string
  ): {
    competitive_brands: string[];
    primary_brand?: string;
    positioning_context?: string;
  } {
    const brandIds = [...new Set(mentions.map((m) => m.brand_id))];

    const analysis: any = {
      competitive_brands: brandIds,
    };

    if (brandIds.length > 1) {
      // Find the most prominently mentioned brand
      const brandMentionCounts = brandIds.map((brandId) => ({
        brandId,
        count: mentions.filter((m) => m.brand_id === brandId).length,
        firstPosition: Math.min(
          ...mentions.filter((m) => m.brand_id === brandId).map((m) => m.position)
        ),
      }));

      // Sort by count, then by first position
      brandMentionCounts.sort((a, b) => {
        if (a.count !== b.count) return b.count - a.count;
        return a.firstPosition - b.firstPosition;
      });

      analysis.primary_brand = brandMentionCounts[0]?.brandId;

      // Look for competitive language
      const competitiveKeywords = [
        'vs',
        'versus',
        'compared to',
        'alternative',
        'competitor',
        'similar to',
      ];
      const hasCompetitiveLanguage = competitiveKeywords.some((keyword) =>
        fullText.toLowerCase().includes(keyword)
      );

      if (hasCompetitiveLanguage) {
        analysis.positioning_context = 'competitive_comparison';
      }
    }

    return analysis;
  }

  private calculateAnswerMetrics(
    mentions: BrandMention[],
    fullText: string,
    promptText?: string
  ): {
    total_mentions: number;
    unique_brands: number;
    avg_sentiment: number;
    avg_position_term: number;
    has_primary_citation: boolean;
    prompt_relevance?: number;
  } {
    const metrics: any = {
      total_mentions: mentions.length,
      unique_brands: new Set(mentions.map((m) => m.brand_id)).size,
      avg_sentiment:
        mentions.length > 0
          ? mentions.reduce((sum, m) => sum + (m.sentiment_score || 0.5), 0) / mentions.length
          : 0.5,
      avg_position_term:
        mentions.length > 0
          ? mentions.reduce((sum, m) => sum + (m.position_term || 0), 0) / mentions.length
          : 0,
      has_primary_citation: mentions.some((m) => m.position < fullText.length * 0.3), // Citation in first 30%
    };

    // Calculate prompt relevance if prompt provided
    if (promptText) {
      metrics.prompt_relevance = this.calculatePromptRelevance(fullText, promptText);
    }

    return metrics;
  }

  private calculatePromptRelevance(answerText: string, promptText: string): number {
    // Simple keyword overlap analysis
    const answerWords = new Set(this.tokenizeText(answerText.toLowerCase()));
    const promptWords = new Set(this.tokenizeText(promptText.toLowerCase()));

    const intersection = new Set([...answerWords].filter((word) => promptWords.has(word)));
    const union = new Set([...answerWords, ...promptWords]);

    return intersection.size / union.size; // Jaccard similarity
  }

  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

// Utility function for quick parsing
export function parseBrandMentions(
  answerText: string,
  brands: BrandConfig[],
  config?: Partial<BrandParserConfig>
): ParsedAnswer {
  const parser = new BrandMentionParser(config);
  return parser.parseAnswer(answerText, brands);
}

// Factory function for creating brand configs
export function createBrandConfig(
  id: string,
  name: string,
  aliases?: string[],
  isCompetitor: boolean = false
): BrandConfig {
  return {
    id,
    name,
    aliases: aliases || [],
    is_competitor: isCompetitor,
    created_at: new Date().toISOString(),
  };
}
