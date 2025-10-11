/**
 * Citation Statistics API Endpoint - /api/citations/stats
 *
 * Get aggregated statistics about citations across all answers
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

// Query parameters schema
const QuerySchema = z.object({
  timeRange: z.enum(['hour', 'day', 'week', 'month', 'year', 'all']).default('all'),
  domain: z.string().optional(),
  citationType: z.enum(['url', 'footnote', 'inline', 'structured', 'numbered']).optional(),
  groupBy: z.enum(['domain', 'citationType', 'isLive', 'hour', 'day', 'week']).optional(),
  includeHealth: z.enum(['true', 'false']).default('true'),
  includeAuthority: z.enum(['true', 'false']).default('true'),
});

/**
 * GET /api/citations/stats - Get citation statistics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = QuerySchema.parse(Object.fromEntries(searchParams.entries()));

    // Calculate time filter
    let timeFilter: any = {};
    if (query.timeRange !== 'all') {
      const now = new Date();
      const timeRanges = {
        hour: new Date(now.getTime() - 60 * 60 * 1000),
        day: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        month: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        year: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
      };
      timeFilter.createdAt = { gte: timeRanges[query.timeRange] };
    }

    // Build where clause
    const where: any = { ...timeFilter };

    if (query.domain) {
      where.domain = { contains: query.domain, mode: 'insensitive' };
    }

    if (query.citationType) {
      where.citationType = query.citationType;
    }

    // Get overall statistics
    const [
      totalCitations,
      uniqueDomains,
      liveCitations,
      authorityStats,
      confidenceStats,
      citationTypes,
      topDomains,
      healthStats,
    ] = await Promise.all([
      // Total citations count
      prisma.answerCitation.count({ where }),

      // Unique domains count
      prisma.answerCitation
        .groupBy({
          by: ['domain'],
          where,
          _count: { domain: true },
        })
        .then((results) => results.length),

      // Live citations count
      prisma.answerCitation.count({
        where: { ...where, isLive: true },
      }),

      // Authority score statistics
      query.includeAuthority === 'true'
        ? prisma.answerCitation.aggregate({
            where: { ...where, authorityScore: { not: null } },
            _avg: { authorityScore: true },
            _min: { authorityScore: true },
            _max: { authorityScore: true },
            _count: { authorityScore: true },
          })
        : null,

      // Confidence score statistics
      prisma.answerCitation.aggregate({
        where,
        _avg: { confidenceScore: true },
        _min: { confidenceScore: true },
        _max: { confidenceScore: true },
      }),

      // Citation types distribution
      prisma.answerCitation.groupBy({
        by: ['citationType'],
        where,
        _count: { citationType: true },
      }),

      // Top domains by count
      prisma.answerCitation.groupBy({
        by: ['domain'],
        where,
        _count: { domain: true },
        orderBy: { _count: { domain: 'desc' } },
        take: 10,
      }),

      // Health check statistics
      query.includeHealth === 'true'
        ? prisma.answerCitation.groupBy({
            by: ['isLive'],
            where: { ...where, lastChecked: { not: null } },
            _count: { isLive: true },
          })
        : null,
    ]);

    // Get grouped statistics if requested
    let groupedStats = null;
    if (query.groupBy) {
      switch (query.groupBy) {
        case 'domain':
          groupedStats = await prisma.answerCitation.groupBy({
            by: ['domain'],
            where,
            _count: { domain: true },
            _avg: { confidenceScore: true, authorityScore: true },
            orderBy: { _count: { domain: 'desc' } },
            take: 20,
          });
          break;

        case 'citationType':
          groupedStats = await prisma.answerCitation.groupBy({
            by: ['citationType'],
            where,
            _count: { citationType: true },
            _avg: { confidenceScore: true, authorityScore: true },
          });
          break;

        case 'isLive':
          groupedStats = await prisma.answerCitation.groupBy({
            by: ['isLive'],
            where: { ...where, lastChecked: { not: null } },
            _count: { isLive: true },
            _avg: { confidenceScore: true, authorityScore: true },
          });
          break;

        case 'day':
        case 'week':
        case 'hour':
          // Time-based grouping would require raw SQL for proper date truncation
          // For now, we'll return daily stats for the last 30 days
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          groupedStats = await prisma.$queryRaw`
            SELECT 
              DATE(createdAt) as date,
              COUNT(*) as count,
              AVG(confidenceScore) as avgConfidence,
              AVG(authorityScore) as avgAuthority
            FROM AnswerCitation 
            WHERE createdAt >= ${thirtyDaysAgo}
              ${query.domain ? prisma.$queryRaw`AND domain LIKE ${`%${query.domain}%`}` : prisma.$queryRaw``}
              ${query.citationType ? prisma.$queryRaw`AND citationType = ${query.citationType}` : prisma.$queryRaw``}
            GROUP BY DATE(createdAt)
            ORDER BY date DESC
            LIMIT 30
          `;
          break;
      }
    }

    // Calculate derived statistics
    const livePercentage = totalCitations > 0 ? (liveCitations / totalCitations) * 100 : 0;

    const authorityDistribution = authorityStats
      ? {
          average: authorityStats._avg.authorityScore || 0,
          minimum: authorityStats._min.authorityScore || 0,
          maximum: authorityStats._max.authorityScore || 0,
          count: authorityStats._count.authorityScore || 0,
        }
      : null;

    const confidenceDistribution = {
      average: confidenceStats._avg.confidenceScore || 0,
      minimum: confidenceStats._min.confidenceScore || 0,
      maximum: confidenceStats._max.confidenceScore || 0,
    };

    // Format citation types with percentages
    const citationTypeStats = citationTypes.map((type) => ({
      type: type.citationType,
      count: type._count.citationType,
      percentage: totalCitations > 0 ? (type._count.citationType / totalCitations) * 100 : 0,
    }));

    // Format top domains with percentages and authority info
    const topDomainsStats = topDomains.map((domain) => ({
      domain: domain.domain,
      count: domain._count.domain,
      percentage: totalCitations > 0 ? (domain._count.domain / totalCitations) * 100 : 0,
    }));

    // Format health statistics
    const healthDistribution = healthStats
      ? healthStats.map((stat) => ({
          isLive: stat.isLive,
          count: stat._count.isLive,
          percentage:
            liveCitations > 0
              ? (stat._count.isLive /
                  (liveCitations + (healthStats.find((s) => !s.isLive)?._count.isLive || 0))) *
                100
              : 0,
        }))
      : null;

    const response = {
      success: true,
      data: {
        overview: {
          totalCitations,
          uniqueDomains,
          liveCitations,
          livePercentage: Math.round(livePercentage * 100) / 100,
          checkedCitations: healthStats
            ? healthStats.reduce((acc, stat) => acc + stat._count.isLive, 0)
            : 0,
        },
        confidence: confidenceDistribution,
        authority: authorityDistribution,
        citationTypes: citationTypeStats,
        topDomains: topDomainsStats,
        health: healthDistribution,
        groupedStats,
        filters: {
          timeRange: query.timeRange,
          domain: query.domain,
          citationType: query.citationType,
          groupBy: query.groupBy,
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          timeRange: query.timeRange,
          includesHealth: query.includeHealth === 'true',
          includesAuthority: query.includeAuthority === 'true',
        },
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error generating citation statistics:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate citation statistics',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/citations/stats/domains - Get detailed domain statistics
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domains, includeGaps = true } = body;

    if (!domains || !Array.isArray(domains) || domains.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Domains array is required',
        },
        { status: 400 }
      );
    }

    // Get detailed stats for each domain
    const domainStats = await Promise.all(
      domains.map(async (domain: string) => {
        const [citations, avgAuthority, avgConfidence, typesUsed, healthStatus] = await Promise.all(
          [
            // Citation count
            prisma.answerCitation.count({
              where: { domain: { equals: domain, mode: 'insensitive' } },
            }),

            // Average authority score
            prisma.answerCitation.aggregate({
              where: {
                domain: { equals: domain, mode: 'insensitive' },
                authorityScore: { not: null },
              },
              _avg: { authorityScore: true },
            }),

            // Average confidence score
            prisma.answerCitation.aggregate({
              where: { domain: { equals: domain, mode: 'insensitive' } },
              _avg: { confidenceScore: true },
            }),

            // Citation types used
            prisma.answerCitation.groupBy({
              by: ['citationType'],
              where: { domain: { equals: domain, mode: 'insensitive' } },
              _count: { citationType: true },
            }),

            // Health status
            prisma.answerCitation.groupBy({
              by: ['isLive'],
              where: {
                domain: { equals: domain, mode: 'insensitive' },
                lastChecked: { not: null },
              },
              _count: { isLive: true },
            }),
          ]
        );

        return {
          domain,
          citationCount: citations,
          averageAuthority: avgAuthority._avg.authorityScore || 0,
          averageConfidence: avgConfidence._avg.confidenceScore || 0,
          citationTypes: typesUsed.map((type) => ({
            type: type.citationType,
            count: type._count.citationType,
          })),
          healthStatus: healthStatus.map((status) => ({
            isLive: status.isLive,
            count: status._count.isLive,
          })),
        };
      })
    );

    // Calculate domain gaps if requested
    let gaps = null;
    if (includeGaps) {
      // Find domains that are highly cited but have low authority scores
      const potentialGaps = domainStats
        .filter(
          (domain) =>
            domain.citationCount >= 3 &&
            domain.averageAuthority < 3.0 &&
            domain.averageAuthority > 0
        )
        .sort((a, b) => b.citationCount - a.citationCount);

      gaps = {
        lowAuthorityHighUsage: potentialGaps.slice(0, 5),
        recommendations:
          potentialGaps.length > 0
            ? [
                'Consider finding alternative sources with higher domain authority',
                'Verify the credibility of frequently cited low-authority domains',
                'Supplement with authoritative sources where possible',
              ]
            : ['Citation authority distribution looks healthy'],
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        domains: domainStats,
        gaps,
        summary: {
          totalDomains: domainStats.length,
          totalCitations: domainStats.reduce((acc, d) => acc + d.citationCount, 0),
          averageAuthority:
            domainStats.reduce((acc, d) => acc + d.averageAuthority, 0) / domainStats.length,
          averageConfidence:
            domainStats.reduce((acc, d) => acc + d.averageConfidence, 0) / domainStats.length,
        },
      },
    });
  } catch (error) {
    console.error('Error generating domain statistics:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate domain statistics',
      },
      { status: 500 }
    );
  }
}
