/**
 * AI Visibility API Routes
 * Provides endpoints for accessing AI visibility data and metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { calculateAIVisibilityIndex } from '@/lib/ai-visibility/scoring';
import { triggerManualCollection } from '@/lib/ai-visibility/orchestrator';
import { logger } from '@/lib/logger';

const prisma = new PrismaClient();

// Validation schemas
const SummaryQuerySchema = z.object({
  brand_id: z.string().optional(),
  days: z.coerce.number().min(1).max(90).default(7),
  locale: z.string().default('en-US'),
});

const AnswersQuerySchema = z.object({
  engine: z.enum(['perplexity', 'chatgpt']).optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  include_mentions: z.coerce.boolean().default(true),
});

const SourcesQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(10),
  days: z.coerce.number().min(1).max(30).default(7),
  brand_id: z.string().optional(),
});

const CollectionTriggerSchema = z.object({
  type: z.enum(['full_collection', 'brand_collection', 'prompt_collection']),
  brand_id: z.string().optional(),
  prompt_ids: z.array(z.number()).optional(),
  locale: z.string().default('en-US'),
  force_refresh: z.boolean().default(false),
});

/**
 * GET /api/ai-visibility/summary
 * Returns AI visibility summary metrics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = SummaryQuerySchema.parse({
      brand_id: searchParams.get('brand_id'),
      days: searchParams.get('days'),
      locale: searchParams.get('locale'),
    });

    // Date range for query
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - query.days);

    // Get recent AI visibility scores
    const whereClause: any = {
      answer: {
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
    };

    if (query.brand_id) {
      whereClause.brand_id = query.brand_id;
    }

    const recentScores = await prisma.aIVisibilityMetric.findMany({
      where: whereClause,
      include: {
        answer: {
          include: {
            run: {
              include: {
                prompt: true,
              },
            },
          },
        },
        brand: {
          include: {
            aliases: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // Calculate AI Visibility Index
    const visibilityScores = recentScores.map((score) => ({
      brand_id: score.brand_id,
      final_score: score.final_score,
      component_scores: {
        mentioned: score.mentioned_score,
        primary_citation: score.primary_citation_score,
        position_term: score.position_term_score,
        sentiment_score: score.sentiment_score,
      },
      penalties:
        typeof score.penalties === 'string' ? JSON.parse(score.penalties) : score.penalties,
      metrics: typeof score.metrics === 'string' ? JSON.parse(score.metrics) : score.metrics,
      calculated_at: score.created_at.toISOString(),
    }));

    const aiVisibilityIndex = calculateAIVisibilityIndex(visibilityScores, query.days);

    // Aggregate metrics by brand
    const brandMetrics = new Map();

    for (const score of recentScores) {
      const brandId = score.brand_id;
      if (!brandMetrics.has(brandId)) {
        brandMetrics.set(brandId, {
          brand_id: brandId,
          brand_name: score.brand.name,
          total_mentions: 0,
          avg_visibility_score: 0,
          total_answers: 0,
          engines_coverage: new Set(),
          scores: [],
        });
      }

      const metrics = brandMetrics.get(brandId);
      metrics.total_mentions += JSON.parse(score.metrics || '{}').total_mentions || 0;
      metrics.total_answers += 1;
      metrics.engines_coverage.add(score.answer.engine);
      metrics.scores.push(score.final_score);
    }

    // Calculate averages
    const brandSummaries = Array.from(brandMetrics.values()).map((metrics) => ({
      brand_id: metrics.brand_id,
      brand_name: metrics.brand_name,
      total_mentions: metrics.total_mentions,
      avg_visibility_score:
        metrics.scores.length > 0
          ? metrics.scores.reduce((sum: number, score: number) => sum + score, 0) /
            metrics.scores.length
          : 0,
      total_answers: metrics.total_answers,
      engines_coverage: Array.from(metrics.engines_coverage),
      trend: calculateTrend(metrics.scores),
    }));

    // Calculate coverage metrics
    const totalPrompts = await prisma.prompt.count({
      where: { active: true },
    });

    const answersInPeriod = await prisma.answer.count({
      where: {
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const coverage = {
      prompts_with_recent_data: new Set(recentScores.map((s) => s.answer.run.prompt_id)).size,
      total_active_prompts: totalPrompts,
      coverage_percentage:
        totalPrompts > 0
          ? (new Set(recentScores.map((s) => s.answer.run.prompt_id)).size / totalPrompts) * 100
          : 0,
      answers_collected: answersInPeriod,
    };

    const summary = {
      ai_visibility_index: aiVisibilityIndex,
      time_period: {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        days: query.days,
      },
      brand_summaries: brandSummaries,
      coverage,
      competitive_analysis: {
        total_brands_tracked: brandSummaries.length,
        dominant_brand:
          brandSummaries.length > 0
            ? brandSummaries.reduce((max, brand) =>
                brand.avg_visibility_score > max.avg_visibility_score ? brand : max
              ).brand_id
            : null,
        visibility_distribution: Object.fromEntries(
          brandSummaries.map((brand) => [brand.brand_id, brand.avg_visibility_score])
        ),
      },
    };

    logger.info('AI visibility summary generated', {
      brand_id: query.brand_id,
      days: query.days,
      ai_visibility_index: aiVisibilityIndex,
      brands_count: brandSummaries.length,
    });

    return NextResponse.json(summary);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Failed to generate AI visibility summary', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function calculateTrend(scores: number[]): 'up' | 'down' | 'stable' {
  if (scores.length < 2) return 'stable';

  const recent = scores.slice(-Math.ceil(scores.length / 2));
  const older = scores.slice(0, Math.floor(scores.length / 2));

  const recentAvg = recent.reduce((sum, score) => sum + score, 0) / recent.length;
  const olderAvg = older.reduce((sum, score) => sum + score, 0) / older.length;

  const threshold = 0.05; // 5% threshold for trend detection

  if (recentAvg > olderAvg + threshold) return 'up';
  if (recentAvg < olderAvg - threshold) return 'down';
  return 'stable';
}
