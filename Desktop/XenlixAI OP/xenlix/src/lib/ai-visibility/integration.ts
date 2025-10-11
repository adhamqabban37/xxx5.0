/**
 * AI Visibility Integration Module
 * Integrates AI Visibility Index into existing scoring systems without breaking current functionality
 */

import { calculateAIVisibilityIndex } from './scoring';
import { AIVisibilityScore } from './types';
import { logger } from '@/lib/logger';

export interface ScoreIntegrationConfig {
  ai_vis_weight: number; // Weight for AI visibility component (default: 0.2)
  enable_integration: boolean; // Feature flag to enable/disable integration
  fallback_score: number; // Fallback score when AI data unavailable (default: 50)
  min_data_points: number; // Minimum data points required for scoring
  time_window_days: number; // Days of data to consider
  clamp_bounds: {
    min: number;
    max: number;
  };
}

export class AIVisibilityIntegrator {
  private config: ScoreIntegrationConfig;

  constructor(config: Partial<ScoreIntegrationConfig> = {}) {
    this.config = {
      ai_vis_weight: 0.2,
      enable_integration: true,
      fallback_score: 50,
      min_data_points: 1,
      time_window_days: 7,
      clamp_bounds: {
        min: 0,
        max: 100,
      },
      ...config,
    };
  }

  /**
   * Integrate AI Visibility Index into existing final score calculation
   * Formula: FINAL_SCORE_NEW = clamp(0.8 * FINAL_SCORE_OLD + 0.2 * scale(AI_VISIBILITY_INDEX), 0, 100)
   */
  integrateWithFinalScore(
    existingFinalScore: number,
    aiVisibilityScores: AIVisibilityScore[] = [],
    brandId?: string
  ): {
    final_score: number;
    components: {
      existing_score: number;
      ai_visibility_index: number;
      ai_visibility_scaled: number;
      integration_enabled: boolean;
      data_points_used: number;
    };
  } {
    try {
      // Check if integration is enabled
      if (!this.config.enable_integration) {
        return {
          final_score: existingFinalScore,
          components: {
            existing_score: existingFinalScore,
            ai_visibility_index: 0,
            ai_visibility_scaled: 0,
            integration_enabled: false,
            data_points_used: 0,
          },
        };
      }

      // Filter scores by brand if specified
      const relevantScores = brandId
        ? aiVisibilityScores.filter((score) => score.brand_id === brandId)
        : aiVisibilityScores;

      // Check minimum data requirement
      if (relevantScores.length < this.config.min_data_points) {
        logger.info('Insufficient AI visibility data for integration', {
          available_scores: relevantScores.length,
          min_required: this.config.min_data_points,
          brand_id: brandId,
        });

        return {
          final_score: existingFinalScore,
          components: {
            existing_score: existingFinalScore,
            ai_visibility_index: this.config.fallback_score,
            ai_visibility_scaled: this.config.fallback_score,
            integration_enabled: true,
            data_points_used: 0,
          },
        };
      }

      // Calculate AI Visibility Index (0-100)
      const aiVisibilityIndex = calculateAIVisibilityIndex(
        relevantScores,
        this.config.time_window_days
      );

      // Scale AI Visibility Index (already 0-100, so no additional scaling needed)
      const scaledAIVisibility = aiVisibilityIndex;

      // Apply integration formula
      const existingWeight = 1 - this.config.ai_vis_weight;
      const newFinalScore =
        existingWeight * existingFinalScore + this.config.ai_vis_weight * scaledAIVisibility;

      // Clamp to bounds
      const clampedScore = this.clampScore(newFinalScore);

      const result = {
        final_score: clampedScore,
        components: {
          existing_score: existingFinalScore,
          ai_visibility_index: aiVisibilityIndex,
          ai_visibility_scaled: scaledAIVisibility,
          integration_enabled: true,
          data_points_used: relevantScores.length,
        },
      };

      logger.info('AI Visibility integration completed', {
        existing_score: existingFinalScore,
        ai_visibility_index: aiVisibilityIndex,
        final_score: clampedScore,
        brand_id: brandId,
        data_points: relevantScores.length,
      });

      return result;
    } catch (error) {
      logger.error('AI Visibility integration failed', error as Error, {
        existing_score: existingFinalScore,
        brand_id: brandId,
        scores_count: aiVisibilityScores.length,
      });

      // Return original score on error
      return {
        final_score: existingFinalScore,
        components: {
          existing_score: existingFinalScore,
          ai_visibility_index: 0,
          ai_visibility_scaled: 0,
          integration_enabled: false,
          data_points_used: 0,
        },
      };
    }
  }

  /**
   * Integrate AI Visibility into AEO score calculation
   * Extends the existing weighted calculation to include AI visibility
   */
  integrateWithAEOScore(
    semanticScore: number,
    seoScore: number,
    contentScore: number,
    performanceScore: number,
    aiVisibilityScores: AIVisibilityScore[] = [],
    brandId?: string
  ): {
    overall_aeo_score: number;
    components: {
      semantic_score: number;
      seo_score: number;
      content_score: number;
      performance_score: number;
      ai_visibility_score: number;
    };
    weights_used: {
      semantic: number;
      seo: number;
      content: number;
      performance: number;
      ai_visibility: number;
    };
  } {
    try {
      // Get AI Visibility Index
      const relevantScores = brandId
        ? aiVisibilityScores.filter((score) => score.brand_id === brandId)
        : aiVisibilityScores;

      const aiVisibilityIndex =
        relevantScores.length >= this.config.min_data_points
          ? calculateAIVisibilityIndex(relevantScores, this.config.time_window_days)
          : this.config.fallback_score;

      // Adjust weights to include AI Visibility
      let weights = {
        semantic: 0.4,
        seo: 0.3,
        content: 0.2,
        performance: 0.1,
        ai_visibility: 0,
      };

      if (this.config.enable_integration && relevantScores.length >= this.config.min_data_points) {
        // Redistribute weights to make room for AI visibility
        const aiVisWeight = this.config.ai_vis_weight * 0.5; // Use half weight for AEO integration
        const reductionFactor = 1 - aiVisWeight;

        weights = {
          semantic: 0.4 * reductionFactor,
          seo: 0.3 * reductionFactor,
          content: 0.2 * reductionFactor,
          performance: 0.1 * reductionFactor,
          ai_visibility: aiVisWeight,
        };
      }

      // Calculate weighted score
      const overallScore =
        semanticScore * weights.semantic +
        seoScore * weights.seo +
        Math.min(contentScore, 100) * weights.content +
        performanceScore * weights.performance +
        aiVisibilityIndex * weights.ai_visibility;

      const clampedScore = this.clampScore(Math.round(overallScore));

      logger.debug('AEO score integration completed', {
        overall_score: clampedScore,
        ai_visibility_index: aiVisibilityIndex,
        weights_used: weights,
        brand_id: brandId,
      });

      return {
        overall_aeo_score: clampedScore,
        components: {
          semantic_score: semanticScore,
          seo_score: seoScore,
          content_score: Math.min(contentScore, 100),
          performance_score: performanceScore,
          ai_visibility_score: aiVisibilityIndex,
        },
        weights_used: weights,
      };
    } catch (error) {
      logger.error('AEO score integration failed', error as Error);

      // Return original calculation on error
      const originalScore = Math.round(
        semanticScore * 0.4 +
          seoScore * 0.3 +
          Math.min(contentScore, 100) * 0.2 +
          performanceScore * 0.1
      );

      return {
        overall_aeo_score: originalScore,
        components: {
          semantic_score: semanticScore,
          seo_score: seoScore,
          content_score: Math.min(contentScore, 100),
          performance_score: performanceScore,
          ai_visibility_score: 0,
        },
        weights_used: {
          semantic: 0.4,
          seo: 0.3,
          content: 0.2,
          performance: 0.1,
          ai_visibility: 0,
        },
      };
    }
  }

  /**
   * Integrate AI Visibility into optimization score calculation
   */
  integrateWithOptimizationScore(
    businessInfoScore: number,
    schemaScore: number,
    contentOptScore: number,
    localSEOScore: number,
    aiVisibilityScores: AIVisibilityScore[] = [],
    brandId?: string
  ): {
    optimization_score: number;
    components: {
      business_info: number;
      schema_optimization: number;
      content_optimization: number;
      local_seo: number;
      ai_visibility: number;
    };
    weights_used: Record<string, number>;
  } {
    try {
      // Get AI Visibility Index
      const relevantScores = brandId
        ? aiVisibilityScores.filter((score) => score.brand_id === brandId)
        : aiVisibilityScores;

      const aiVisibilityIndex =
        relevantScores.length >= this.config.min_data_points
          ? calculateAIVisibilityIndex(relevantScores, this.config.time_window_days)
          : this.config.fallback_score;

      // Define weights
      let weights = {
        business_info: 0.2,
        schema_optimization: 0.25,
        content_optimization: 0.25,
        local_seo: 0.3,
        ai_visibility: 0,
      };

      if (this.config.enable_integration && relevantScores.length >= this.config.min_data_points) {
        // Adjust weights to include AI visibility
        const aiVisWeight = this.config.ai_vis_weight * 0.6; // Use more weight in optimization scoring
        const reductionFactor = 1 - aiVisWeight;

        weights = {
          business_info: 0.2 * reductionFactor,
          schema_optimization: 0.25 * reductionFactor,
          content_optimization: 0.25 * reductionFactor,
          local_seo: 0.3 * reductionFactor,
          ai_visibility: aiVisWeight,
        };
      }

      // Calculate weighted score
      const optimizationScore =
        businessInfoScore * weights.business_info +
        schemaScore * weights.schema_optimization +
        contentOptScore * weights.content_optimization +
        localSEOScore * weights.local_seo +
        aiVisibilityIndex * weights.ai_visibility;

      const clampedScore = this.clampScore(Math.round(optimizationScore));

      return {
        optimization_score: clampedScore,
        components: {
          business_info: businessInfoScore,
          schema_optimization: schemaScore,
          content_optimization: contentOptScore,
          local_seo: localSEOScore,
          ai_visibility: aiVisibilityIndex,
        },
        weights_used: weights,
      };
    } catch (error) {
      logger.error('Optimization score integration failed', error as Error);

      // Return original calculation on error
      const originalScore = Math.round(
        businessInfoScore * 0.2 + schemaScore * 0.25 + contentOptScore * 0.25 + localSEOScore * 0.3
      );

      return {
        optimization_score: originalScore,
        components: {
          business_info: businessInfoScore,
          schema_optimization: schemaScore,
          content_optimization: contentOptScore,
          local_seo: localSEOScore,
          ai_visibility: 0,
        },
        weights_used: {
          business_info: 0.2,
          schema_optimization: 0.25,
          content_optimization: 0.25,
          local_seo: 0.3,
          ai_visibility: 0,
        },
      };
    }
  }

  /**
   * Check if AI Visibility data is sufficient for integration
   */
  hasValidAIVisibilityData(
    aiVisibilityScores: AIVisibilityScore[],
    brandId?: string
  ): {
    is_valid: boolean;
    data_points: number;
    min_required: number;
    brand_id?: string;
  } {
    const relevantScores = brandId
      ? aiVisibilityScores.filter((score) => score.brand_id === brandId)
      : aiVisibilityScores;

    return {
      is_valid: relevantScores.length >= this.config.min_data_points,
      data_points: relevantScores.length,
      min_required: this.config.min_data_points,
      brand_id: brandId,
    };
  }

  /**
   * Get AI Visibility contribution to a score
   */
  getAIVisibilityContribution(
    totalScore: number,
    aiVisibilityIndex: number
  ): {
    contribution_points: number;
    contribution_percentage: number;
  } {
    const contributionPoints = totalScore * this.config.ai_vis_weight;
    const contributionPercentage = (contributionPoints / totalScore) * 100;

    return {
      contribution_points: Math.round(contributionPoints * 100) / 100,
      contribution_percentage: Math.round(contributionPercentage * 100) / 100,
    };
  }

  private clampScore(score: number): number {
    return Math.max(this.config.clamp_bounds.min, Math.min(this.config.clamp_bounds.max, score));
  }

  /**
   * Update configuration at runtime
   */
  updateConfig(newConfig: Partial<ScoreIntegrationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('AI Visibility integrator config updated', {
      new_config: newConfig,
      full_config: this.config,
    });
  }
}

// Singleton instance for global use
let globalIntegrator: AIVisibilityIntegrator | null = null;

export function getAIVisibilityIntegrator(
  config?: Partial<ScoreIntegrationConfig>
): AIVisibilityIntegrator {
  if (!globalIntegrator) {
    globalIntegrator = new AIVisibilityIntegrator(config);
  } else if (config) {
    globalIntegrator.updateConfig(config);
  }
  return globalIntegrator;
}

// Utility functions for backward compatibility
export function integrateAIVisibilityWithFinalScore(
  existingFinalScore: number,
  aiVisibilityScores: AIVisibilityScore[] = [],
  brandId?: string,
  config?: Partial<ScoreIntegrationConfig>
): number {
  const integrator = getAIVisibilityIntegrator(config);
  return integrator.integrateWithFinalScore(existingFinalScore, aiVisibilityScores, brandId)
    .final_score;
}

export function integrateAIVisibilityWithAEOScore(
  semanticScore: number,
  seoScore: number,
  contentScore: number,
  performanceScore: number,
  aiVisibilityScores: AIVisibilityScore[] = [],
  brandId?: string,
  config?: Partial<ScoreIntegrationConfig>
): number {
  const integrator = getAIVisibilityIntegrator(config);
  return integrator.integrateWithAEOScore(
    semanticScore,
    seoScore,
    contentScore,
    performanceScore,
    aiVisibilityScores,
    brandId
  ).overall_aeo_score;
}

// Environment-based configuration
export function getEnvironmentConfig(): Partial<ScoreIntegrationConfig> {
  return {
    ai_vis_weight: parseFloat(process.env.AI_VIS_WEIGHT || '0.2'),
    enable_integration: process.env.AI_VIS_ENABLED !== 'false',
    fallback_score: parseFloat(process.env.AI_VIS_FALLBACK_SCORE || '50'),
    min_data_points: parseInt(process.env.AI_VIS_MIN_DATA_POINTS || '1'),
    time_window_days: parseInt(process.env.AI_VIS_TIME_WINDOW_DAYS || '7'),
  };
}
