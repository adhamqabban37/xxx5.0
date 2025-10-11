/**
 * AI Visibility Top Sources API Route
 * GET /api/ai-visibility/sources/top - Get top cited sources and brand domains
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const prisma = new PrismaClient();

// Validation schemas
const SourcesQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(10),
  days: z.coerce.number().min(1).max(90).default(7),
  brand_id: z.string().optional(),
  engine: z.enum(['perplexity', 'chatgpt']).optional(),
  min_citations: z.coerce.number().min(1).default(2),
});

/**
 * GET /api/ai-visibility/sources/top
 * Returns top cited sources and domains analysis
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = SourcesQuerySchema.parse({
      limit: searchParams.get('limit'),
      days: searchParams.get('days'),
      brand_id: searchParams.get('brand_id'),
      engine: searchParams.get('engine'),
      min_citations: searchParams.get('min_citations'),
    });

    // Date range for query
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - query.days);

    // Build where clause for citations
    const citationWhereClause: any = {
      answer: {
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
    };

    if (query.engine) {
      citationWhereClause.answer.engine = query.engine;
    }

    // If brand_id specified, filter by answers that mention this brand
    if (query.brand_id) {
      citationWhereClause.answer.mentions = {
        some: {
          brand_id: query.brand_id,
        },
      };
    }

    // Get all citations in the time period
    const citations = await prisma.answerCitation.findMany({
      where: citationWhereClause,
      include: {
        answer: {
          include: {
            mentions: {
              include: {
                brand: true,
              },
            },
            run: {
              include: {
                prompt: true,
              },
            },
          },
        },
      },
      orderBy: { rank: 'asc' },
    });

    // Aggregate citation data
    const urlStats = new Map();
    const domainStats = new Map();
    const brandDomainStats = new Map();

    for (const citation of citations) {
      const url = citation.url;
      let domain: string;

      try {
        domain = new URL(url).hostname.replace('www.', '');
      } catch {
        domain = 'unknown';
      }

      // URL-level stats
      if (!urlStats.has(url)) {
        urlStats.set(url, {
          url,
          domain,
          title: citation.title || 'Untitled',
          citation_count: 0,
          avg_rank: 0,
          engines: new Set(),
          brand_mentions: new Map(),
          first_seen: citation.answer.created_at,
          last_seen: citation.answer.created_at,
        });
      }

      const urlStat = urlStats.get(url);
      urlStat.citation_count += 1;
      urlStat.avg_rank =
        (urlStat.avg_rank * (urlStat.citation_count - 1) + citation.rank) / urlStat.citation_count;
      urlStat.engines.add(citation.answer.engine);
      urlStat.last_seen =
        citation.answer.created_at > urlStat.last_seen
          ? citation.answer.created_at
          : urlStat.last_seen;

      // Track brand mentions for this URL
      for (const mention of citation.answer.mentions) {
        const brandId = mention.brand_id;
        if (!urlStat.brand_mentions.has(brandId)) {
          urlStat.brand_mentions.set(brandId, {
            brand_id: brandId,
            brand_name: mention.brand.name,
            mention_count: 0,
          });
        }
        urlStat.brand_mentions.get(brandId).mention_count += 1;
      }

      // Domain-level stats
      if (!domainStats.has(domain)) {
        domainStats.set(domain, {
          domain,
          citation_count: 0,
          unique_urls: new Set(),
          engines: new Set(),
          avg_rank: 0,
          brand_associations: new Map(),
        });
      }

      const domainStat = domainStats.get(domain);
      domainStat.citation_count += 1;
      domainStat.unique_urls.add(url);
      domainStat.engines.add(citation.answer.engine);
      domainStat.avg_rank =
        (domainStat.avg_rank * (domainStat.citation_count - 1) + citation.rank) /
        domainStat.citation_count;

      // Track brand associations for this domain
      for (const mention of citation.answer.mentions) {
        const brandId = mention.brand_id;
        if (!domainStat.brand_associations.has(brandId)) {
          domainStat.brand_associations.set(brandId, {
            brand_id: brandId,
            brand_name: mention.brand.name,
            citation_count: 0,
            association_strength: 0,
          });
        }
        const brandAssoc = domainStat.brand_associations.get(brandId);
        brandAssoc.citation_count += 1;
        brandAssoc.association_strength = brandAssoc.citation_count / domainStat.citation_count;
      }
    }

    // Filter and transform URL stats
    const topUrls = Array.from(urlStats.values())
      .filter((url) => url.citation_count >= query.min_citations)
      .sort((a, b) => {
        // Sort by citation count (desc), then by avg rank (asc)
        if (a.citation_count !== b.citation_count) {
          return b.citation_count - a.citation_count;
        }
        return a.avg_rank - b.avg_rank;
      })
      .slice(0, query.limit)
      .map((url) => ({
        url: url.url,
        domain: url.domain,
        title: url.title,
        citation_count: url.citation_count,
        avg_rank: Math.round(url.avg_rank * 100) / 100,
        engines: Array.from(url.engines),
        brand_mentions: Array.from(url.brand_mentions.values()),
        first_seen: url.first_seen.toISOString(),
        last_seen: url.last_seen.toISOString(),
        authority_score: calculateAuthorityScore(
          url.citation_count,
          url.avg_rank,
          url.engines.size
        ),
      }));

    // Transform domain stats
    const topDomains = Array.from(domainStats.values())
      .sort((a, b) => b.citation_count - a.citation_count)
      .slice(0, query.limit)
      .map((domain) => ({
        domain: domain.domain,
        citation_count: domain.citation_count,
        unique_urls: domain.unique_urls.size,
        engines: Array.from(domain.engines),
        avg_rank: Math.round(domain.avg_rank * 100) / 100,
        brand_associations: Array.from(domain.brand_associations.values()),
        domain_authority: calculateDomainAuthority(
          domain.citation_count,
          domain.unique_urls.size,
          domain.avg_rank,
          domain.engines.size
        ),
      }));

    // Calculate competitive insights
    const competitiveInsights = calculateCompetitiveInsights(topDomains, query.brand_id);

    // Summary statistics
    const summary = {
      total_citations: citations.length,
      unique_urls: urlStats.size,
      unique_domains: domainStats.size,
      avg_citations_per_url:
        citations.length > 0 ? Math.round((citations.length / urlStats.size) * 100) / 100 : 0,
      engines_analyzed: [...new Set(citations.map((c) => c.answer.engine))],
      time_period: {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        days: query.days,
      },
    };

    const response = {
      top_urls: topUrls,
      top_domains: topDomains,
      competitive_insights: competitiveInsights,
      summary,
      filters: {
        limit: query.limit,
        days: query.days,
        brand_id: query.brand_id,
        engine: query.engine,
        min_citations: query.min_citations,
      },
    };

    logger.info('Top sources analysis completed', {
      brand_id: query.brand_id,
      days: query.days,
      total_citations: citations.length,
      top_urls_count: topUrls.length,
      top_domains_count: topDomains.length,
    });

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Failed to analyze top sources', error as Error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function calculateAuthorityScore(
  citationCount: number,
  avgRank: number,
  engineCount: number
): number {
  // Authority score based on citation frequency, ranking position, and engine diversity
  const frequencyScore = Math.min(citationCount / 10, 1) * 40; // Max 40 points
  const rankingScore = Math.max(0, (6 - avgRank) / 5) * 35; // Max 35 points (lower rank = higher score)
  const diversityScore = (engineCount / 2) * 25; // Max 25 points (assuming max 2 engines)

  return Math.round((frequencyScore + rankingScore + diversityScore) * 100) / 100;
}

function calculateDomainAuthority(
  citationCount: number,
  uniqueUrls: number,
  avgRank: number,
  engineCount: number
): number {
  // Domain authority based on citation volume, URL diversity, ranking, and engine presence
  const volumeScore = Math.min(citationCount / 20, 1) * 30; // Max 30 points
  const diversityScore = Math.min(uniqueUrls / 10, 1) * 25; // Max 25 points
  const qualityScore = Math.max(0, (6 - avgRank) / 5) * 30; // Max 30 points
  const presenceScore = (engineCount / 2) * 15; // Max 15 points

  return Math.round((volumeScore + diversityScore + qualityScore + presenceScore) * 100) / 100;
}

function calculateCompetitiveInsights(topDomains: any[], brandId?: string): any {
  if (!brandId) {
    return {
      analysis_type: 'general',
      message: 'Specify brand_id for competitive analysis',
    };
  }

  const brandDomains = topDomains.filter((domain) =>
    domain.brand_associations.some((assoc: any) => assoc.brand_id === brandId)
  );

  const competitorDomains = topDomains.filter((domain) =>
    domain.brand_associations.some(
      (assoc: any) => assoc.brand_id !== brandId && assoc.association_strength > 0.1
    )
  );

  const brandDomainAuthority =
    brandDomains.length > 0
      ? brandDomains.reduce((sum, domain) => sum + domain.domain_authority, 0) / brandDomains.length
      : 0;

  const competitorAvgAuthority =
    competitorDomains.length > 0
      ? competitorDomains.reduce((sum, domain) => sum + domain.domain_authority, 0) /
        competitorDomains.length
      : 0;

  return {
    analysis_type: 'competitive',
    brand_id: brandId,
    brand_domain_count: brandDomains.length,
    competitor_domain_count: competitorDomains.length,
    brand_avg_authority: Math.round(brandDomainAuthority * 100) / 100,
    competitor_avg_authority: Math.round(competitorAvgAuthority * 100) / 100,
    competitive_gap: Math.round((competitorAvgAuthority - brandDomainAuthority) * 100) / 100,
    recommendation:
      brandDomainAuthority > competitorAvgAuthority
        ? 'Your brand domains show strong authority in AI citations'
        : 'Focus on building domain authority to improve AI citation rates',
  };
}
