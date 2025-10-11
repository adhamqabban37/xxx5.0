/**
 * AI Visibility Scoring Engine
 * Calculates AI Visibility scores using the specified algorithm:
 * AI_VISIBILITY = 0.5*mentioned + 0.3*primary_citation + 0.15*position_term + 0.05*sentiment_score
 */

import { ParsedAnswer, AIVisibilityScore, AIVisibilityMetrics, BrandMention } from '../types';
import { logger } from '@/lib/logger';

export interface ScoringConfig {
  weights: {
    mentioned: number;
    primary_citation: number;
    position_term: number;
    sentiment_score: number;
  };
  normalization: {
    max_mentions_for_full_score: number;
    position_decay_factor: number;
    sentiment_neutral_baseline: number;
  };
  penalties: {
    competitor_mention_penalty: number;
    low_confidence_penalty: number;
    negative_sentiment_penalty: number;
  };
}

export class AIVisibilityScorer {
  private config: ScoringConfig;

  constructor(config: Partial<ScoringConfig> = {}) {
    this.config = {
      weights: {
        mentioned: 0.5,
        primary_citation: 0.3,
        position_term: 0.15,
        sentiment_score: 0.05,
        ...config.weights,
      },
      normalization: {
        max_mentions_for_full_score: 5,
        position_decay_factor: 0.8,
        sentiment_neutral_baseline: 0.5,
        ...config.normalization,
      },
      penalties: {
        competitor_mention_penalty: 0.2,
        low_confidence_penalty: 0.1,
        negative_sentiment_penalty: 0.15,
        ...config.penalties,
      },
    };
  }

  /**
   * Calculate AI Visibility Score for a single brand in a parsed answer
   */
  calculateBrandScore(
    brandId: string,
    parsedAnswer: ParsedAnswer,
    citedUrls: string[] = [],
    brandDomains: string[] = []
  ): AIVisibilityScore {
    const brandMentions = parsedAnswer.mentions_by_brand[brandId] || [];

    if (brandMentions.length === 0) {
      return this.createZeroScore(brandId, parsedAnswer.original_text);
    }

    // Calculate component scores
    const mentionedScore = this.calculateMentionedScore(brandMentions);
    const primaryCitationScore = this.calculatePrimaryCitationScore(
      brandMentions,
      citedUrls,
      brandDomains
    );
    const positionTermScore = this.calculatePositionTermScore(brandMentions);
    const sentimentScore = this.calculateSentimentScore(brandMentions);

    // Apply penalties
    const penalties = this.calculatePenalties(brandMentions, parsedAnswer);

    // Calculate weighted final score
    const rawScore =
      this.config.weights.mentioned * mentionedScore +
      this.config.weights.primary_citation * primaryCitationScore +
      this.config.weights.position_term * positionTermScore +
      this.config.weights.sentiment_score * sentimentScore;

    const finalScore = Math.max(0, Math.min(1, rawScore - penalties.total));

    const score: AIVisibilityScore = {
      brand_id: brandId,
      final_score: finalScore,
      component_scores: {
        mentioned: mentionedScore,
        primary_citation: primaryCitationScore,
        position_term: positionTermScore,
        sentiment_score: sentimentScore,
      },
      penalties,
      metrics: {
        total_mentions: brandMentions.length,
        avg_confidence:
          brandMentions.reduce((sum, m) => sum + (m.confidence || 0.5), 0) / brandMentions.length,
        first_mention_position: Math.min(...brandMentions.map((m) => m.position)),
        citation_urls: citedUrls.filter((url) =>
          brandDomains.some((domain) => url.includes(domain))
        ),
        competitive_context:
          parsedAnswer.competitive_analysis?.competitive_brands?.includes(brandId) || false,
      },
      calculated_at: new Date().toISOString(),
    };

    logger.debug('Brand score calculated', {
      brand_id: brandId,
      final_score: finalScore,
      mentions_count: brandMentions.length,
      component_scores: score.component_scores,
    });

    return score;
  }

  /**
   * Calculate scores for all brands mentioned in an answer
   */
  calculateAllBrandScores(
    parsedAnswer: ParsedAnswer,
    citedUrls: string[] = [],
    brandDomainsMap: Record<string, string[]> = {}
  ): AIVisibilityScore[] {
    const scores: AIVisibilityScore[] = [];

    for (const brandId of Object.keys(parsedAnswer.mentions_by_brand)) {
      const brandDomains = brandDomainsMap[brandId] || [];
      const score = this.calculateBrandScore(brandId, parsedAnswer, citedUrls, brandDomains);
      scores.push(score);
    }

    return scores.sort((a, b) => b.final_score - a.final_score);
  }

  /**
   * Calculate aggregate metrics for an answer across all brands
   */
  calculateAnswerMetrics(
    parsedAnswer: ParsedAnswer,
    brandScores: AIVisibilityScore[]
  ): AIVisibilityMetrics {
    const metrics: AIVisibilityMetrics = {
      total_brands_mentioned: brandScores.length,
      avg_visibility_score:
        brandScores.length > 0
          ? brandScores.reduce((sum, score) => sum + score.final_score, 0) / brandScores.length
          : 0,
      max_visibility_score:
        brandScores.length > 0 ? Math.max(...brandScores.map((s) => s.final_score)) : 0,
      total_mentions: parsedAnswer.brand_mentions.length,
      answer_length: parsedAnswer.original_text.length,
      competitive_analysis: {
        has_multiple_brands: brandScores.length > 1,
        dominant_brand: brandScores[0]?.brand_id,
        brand_distribution: this.calculateBrandDistribution(brandScores),
      },
      citation_analysis: {
        total_citations: parsedAnswer.brand_mentions.filter((m) => m.mention_type === 'primary')
          .length,
        brands_with_citations: brandScores.filter((s) => s.metrics.citation_urls.length > 0).length,
      },
      calculated_at: new Date().toISOString(),
    };

    return metrics;
  }

  private calculateMentionedScore(mentions: BrandMention[]): number {
    if (mentions.length === 0) return 0;

    // Normalize based on number of mentions with diminishing returns
    const normalizedCount = Math.min(
      mentions.length / this.config.normalization.max_mentions_for_full_score,
      1
    );

    // Apply confidence weighting
    const avgConfidence =
      mentions.reduce((sum, m) => sum + (m.confidence || 0.5), 0) / mentions.length;

    return normalizedCount * avgConfidence;
  }

  private calculatePrimaryCitationScore(
    mentions: BrandMention[],
    citedUrls: string[],
    brandDomains: string[]
  ): number {
    if (brandDomains.length === 0 || citedUrls.length === 0) return 0;

    // Check if any cited URLs belong to this brand's domains
    const brandCitations = citedUrls.filter((url) =>
      brandDomains.some((domain) => url.toLowerCase().includes(domain.toLowerCase()))
    );

    if (brandCitations.length === 0) return 0;

    // Higher score for multiple citations, with diminishing returns
    const citationScore = Math.min(brandCitations.length / 3, 1); // Max score at 3 citations

    // Boost score if brand is mentioned near the beginning (primary position)
    const hasEarlyMention = mentions.some((m) => m.position_term && m.position_term > 0.7);
    const primaryBoost = hasEarlyMention ? 1.2 : 1.0;

    return Math.min(citationScore * primaryBoost, 1);
  }

  private calculatePositionTermScore(mentions: BrandMention[]): number {
    if (mentions.length === 0) return 0;

    // Weight by position with exponential decay for later mentions
    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const mention of mentions) {
      const positionScore = mention.position_term || 0;
      const weight = Math.pow(
        this.config.normalization.position_decay_factor,
        mentions.indexOf(mention)
      );

      totalWeightedScore += positionScore * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
  }

  private calculateSentimentScore(mentions: BrandMention[]): number {
    if (mentions.length === 0) return this.config.normalization.sentiment_neutral_baseline;

    // Calculate weighted average sentiment
    const sentiments = mentions
      .map((m) => m.sentiment_score || this.config.normalization.sentiment_neutral_baseline)
      .filter((s) => s !== undefined);

    if (sentiments.length === 0) return this.config.normalization.sentiment_neutral_baseline;

    return sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length;
  }

  private calculatePenalties(
    mentions: BrandMention[],
    parsedAnswer: ParsedAnswer
  ): {
    competitor_penalty: number;
    low_confidence_penalty: number;
    negative_sentiment_penalty: number;
    total: number;
  } {
    let competitorPenalty = 0;
    let lowConfidencePenalty = 0;
    let negativeSentimentPenalty = 0;

    // Competitor mention penalty
    const hasCompetitorContext = parsedAnswer.competitive_analysis?.competitive_brands?.length > 1;
    if (hasCompetitorContext) {
      competitorPenalty = this.config.penalties.competitor_mention_penalty;
    }

    // Low confidence penalty
    const avgConfidence =
      mentions.reduce((sum, m) => sum + (m.confidence || 0.5), 0) / mentions.length;
    if (avgConfidence < 0.6) {
      lowConfidencePenalty = this.config.penalties.low_confidence_penalty * (0.6 - avgConfidence);
    }

    // Negative sentiment penalty
    const avgSentiment =
      mentions.reduce((sum, m) => sum + (m.sentiment_score || 0.5), 0) / mentions.length;
    if (avgSentiment < 0.4) {
      negativeSentimentPenalty =
        this.config.penalties.negative_sentiment_penalty * (0.4 - avgSentiment);
    }

    const total = competitorPenalty + lowConfidencePenalty + negativeSentimentPenalty;

    return {
      competitor_penalty: competitorPenalty,
      low_confidence_penalty: lowConfidencePenalty,
      negative_sentiment_penalty: negativeSentimentPenalty,
      total,
    };
  }

  private calculateBrandDistribution(scores: AIVisibilityScore[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    const totalScore = scores.reduce((sum, s) => sum + s.final_score, 0);

    if (totalScore === 0) return distribution;

    for (const score of scores) {
      distribution[score.brand_id] = score.final_score / totalScore;
    }

    return distribution;
  }

  private createZeroScore(brandId: string, originalText: string): AIVisibilityScore {
    return {
      brand_id: brandId,
      final_score: 0,
      component_scores: {
        mentioned: 0,
        primary_citation: 0,
        position_term: 0,
        sentiment_score: this.config.normalization.sentiment_neutral_baseline,
      },
      penalties: {
        competitor_penalty: 0,
        low_confidence_penalty: 0,
        negative_sentiment_penalty: 0,
        total: 0,
      },
      metrics: {
        total_mentions: 0,
        avg_confidence: 0,
        first_mention_position: originalText.length,
        citation_urls: [],
        competitive_context: false,
      },
      calculated_at: new Date().toISOString(),
    };
  }
}

/**
 * Utility function to calculate AI Visibility Index from daily scores
 * Aggregates multiple scores into a single index value (0-100)
 */
export function calculateAIVisibilityIndex(
  dailyScores: AIVisibilityScore[],
  timeWindow: number = 7 // days
): number {
  if (dailyScores.length === 0) return 0;

  // Group scores by brand
  const scoresByBrand: Record<string, number[]> = {};

  for (const score of dailyScores) {
    if (!scoresByBrand[score.brand_id]) {
      scoresByBrand[score.brand_id] = [];
    }
    scoresByBrand[score.brand_id].push(score.final_score);
  }

  // Calculate weighted average for each brand
  const brandAverages = Object.entries(scoresByBrand).map(([brandId, scores]) => {
    // More recent scores get higher weight
    const weightedSum = scores.reduce((sum, score, index) => {
      const recencyWeight = Math.pow(0.9, scores.length - index - 1);
      return sum + score * recencyWeight;
    }, 0);

    const totalWeight = scores.reduce((sum, _, index) => {
      return sum + Math.pow(0.9, scores.length - index - 1);
    }, 0);

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  });

  // Return the maximum brand score scaled to 0-100
  const maxBrandScore = brandAverages.length > 0 ? Math.max(...brandAverages) : 0;
  return Math.round(maxBrandScore * 100);
}

// Factory function for creating scorer with default config
export function createAIVisibilityScorer(config?: Partial<ScoringConfig>): AIVisibilityScorer {
  return new AIVisibilityScorer(config);
}

// Utility function for quick scoring
export function scoreBrandInAnswer(
  brandId: string,
  parsedAnswer: ParsedAnswer,
  citedUrls: string[] = [],
  brandDomains: string[] = []
): AIVisibilityScore {
  const scorer = new AIVisibilityScorer();
  return scorer.calculateBrandScore(brandId, parsedAnswer, citedUrls, brandDomains);
}
