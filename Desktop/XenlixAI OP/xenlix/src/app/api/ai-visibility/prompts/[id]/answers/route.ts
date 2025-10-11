/**
 * AI Visibility Prompts API Route
 * GET /api/ai-visibility/prompts/[id]/answers - Get answers for a specific prompt
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const prisma = new PrismaClient();

// Validation schemas
const AnswersQuerySchema = z.object({
  engine: z.enum(['perplexity', 'chatgpt']).optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  include_mentions: z.coerce.boolean().default(true),
  include_citations: z.coerce.boolean().default(true),
  days: z.coerce.number().min(1).max(90).default(30),
});

interface RouteParams {
  params: { id: string };
}

/**
 * GET /api/ai-visibility/prompts/[id]/answers
 * Returns answers collected for a specific prompt with mentions and citations
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const promptId = parseInt(params.id);

    if (isNaN(promptId)) {
      return NextResponse.json({ error: 'Invalid prompt ID' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const query = AnswersQuerySchema.parse({
      engine: searchParams.get('engine'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
      include_mentions: searchParams.get('include_mentions'),
      include_citations: searchParams.get('include_citations'),
      days: searchParams.get('days'),
    });

    // Verify prompt exists
    const prompt = await prisma.prompt.findUnique({
      where: { id: promptId },
      include: {
        brands: {
          include: {
            aliases: true,
          },
        },
      },
    });

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    // Date range for answers
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - query.days);

    // Build query filters
    const whereClause: any = {
      run: {
        prompt_id: promptId,
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
    };

    if (query.engine) {
      whereClause.engine = query.engine;
    }

    // Get answers with related data
    const answers = await prisma.answer.findMany({
      where: whereClause,
      include: {
        run: {
          include: {
            prompt: true,
          },
        },
        mentions: query.include_mentions
          ? {
              include: {
                brand: {
                  include: {
                    aliases: true,
                  },
                },
              },
            }
          : false,
        citations: query.include_citations,
        aiVisibilityMetrics: {
          include: {
            brand: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      skip: query.offset,
      take: query.limit,
    });

    // Get total count for pagination
    const totalCount = await prisma.answer.count({
      where: whereClause,
    });

    // Transform answers data
    const transformedAnswers = answers.map((answer) => {
      const citedLinks = answer.cited_links
        ? typeof answer.cited_links === 'string'
          ? JSON.parse(answer.cited_links)
          : answer.cited_links
        : [];

      const rawPayload = answer.raw_payload
        ? typeof answer.raw_payload === 'string'
          ? JSON.parse(answer.raw_payload)
          : answer.raw_payload
        : {};

      return {
        id: answer.id,
        engine: answer.engine,
        query_text: answer.query_text,
        locale: answer.locale,
        answer_text: answer.answer_text,
        cited_links: citedLinks,
        html_snapshot_path: answer.html_snapshot_path,
        raw_payload: rawPayload,
        created_at: answer.created_at.toISOString(),
        run: {
          id: answer.run.id,
          locale: answer.run.locale,
          status: answer.run.status,
          created_at: answer.run.created_at.toISOString(),
          completed_at: answer.run.completed_at?.toISOString(),
        },
        mentions: query.include_mentions
          ? answer.mentions?.map((mention) => ({
              id: mention.id,
              brand_id: mention.brand_id,
              brand_name: mention.brand.name,
              matched_text: mention.matched_text,
              position: mention.position,
              mention_type: mention.mention_type,
              confidence: mention.confidence,
              sentiment_score: mention.sentiment_score,
              context: mention.context,
              position_term: mention.position_term,
            }))
          : undefined,
        citations: query.include_citations
          ? answer.citations?.map((citation) => ({
              id: citation.id,
              url: citation.url,
              title: citation.title,
              rank: citation.rank,
            }))
          : undefined,
        ai_visibility_scores: answer.aiVisibilityMetrics?.map((metric) => ({
          brand_id: metric.brand_id,
          brand_name: metric.brand.name,
          final_score: metric.final_score,
          component_scores: {
            mentioned: metric.mentioned_score,
            primary_citation: metric.primary_citation_score,
            position_term: metric.position_term_score,
            sentiment_score: metric.sentiment_score,
          },
          penalties:
            typeof metric.penalties === 'string' ? JSON.parse(metric.penalties) : metric.penalties,
          metrics: typeof metric.metrics === 'string' ? JSON.parse(metric.metrics) : metric.metrics,
        })),
      };
    });

    // Calculate summary metrics
    const summaryMetrics = {
      total_answers: totalCount,
      answers_returned: transformedAnswers.length,
      engines_used: [...new Set(transformedAnswers.map((a) => a.engine))],
      total_mentions: transformedAnswers.reduce(
        (sum, answer) => sum + (answer.mentions?.length || 0),
        0
      ),
      total_citations: transformedAnswers.reduce(
        (sum, answer) => sum + (answer.citations?.length || 0),
        0
      ),
      avg_answer_length:
        transformedAnswers.length > 0
          ? Math.round(
              transformedAnswers.reduce(
                (sum, answer) => sum + (answer.answer_text?.length || 0),
                0
              ) / transformedAnswers.length
            )
          : 0,
      brands_mentioned: [
        ...new Set(
          transformedAnswers.flatMap((answer) => answer.mentions?.map((m) => m.brand_id) || [])
        ),
      ].length,
    };

    // Calculate pagination info
    const pagination = {
      offset: query.offset,
      limit: query.limit,
      total: totalCount,
      has_more: query.offset + query.limit < totalCount,
      next_offset: query.offset + query.limit < totalCount ? query.offset + query.limit : null,
    };

    const response = {
      prompt: {
        id: prompt.id,
        text: prompt.text,
        category: prompt.category,
        locale: prompt.locale,
        active: prompt.active,
        created_at: prompt.created_at.toISOString(),
        brands: prompt.brands.map((brand) => ({
          id: brand.id,
          name: brand.name,
          aliases: brand.aliases.map((alias) => alias.alias_name),
          is_competitor: brand.is_competitor,
        })),
      },
      answers: transformedAnswers,
      summary: summaryMetrics,
      pagination,
      filters: {
        engine: query.engine,
        days: query.days,
        include_mentions: query.include_mentions,
        include_citations: query.include_citations,
      },
    };

    logger.info('Prompt answers retrieved', {
      prompt_id: promptId,
      answers_count: transformedAnswers.length,
      total_count: totalCount,
      engine_filter: query.engine,
    });

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Failed to retrieve prompt answers', error as Error, {
      prompt_id: params.id,
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
