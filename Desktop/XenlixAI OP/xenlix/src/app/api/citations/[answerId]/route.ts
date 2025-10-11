/**
 * Citation API Endpoint - /api/citations/[answerId]
 *
 * Fetch citations for a specific answer with filtering and pagination
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { CitationExtractor } from '@/lib/citationExtractor';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

// Query parameters schema
const QuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  domain: z.string().optional(),
  citationType: z.enum(['url', 'footnote', 'inline', 'structured', 'numbered']).optional(),
  isLive: z.enum(['true', 'false']).optional(),
  isPrimary: z.enum(['true', 'false']).optional(),
  minConfidence: z.coerce.number().min(0).max(1).optional(),
  minAuthorityScore: z.coerce.number().min(0).max(10).optional(),
  sortBy: z.enum(['rank', 'confidence', 'authority', 'created']).default('rank'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

/**
 * GET /api/citations/[answerId] - Get citations for an answer
 */
export async function GET(request: NextRequest, { params }: { params: { answerId: string } }) {
  try {
    const { answerId } = params;
    const { searchParams } = new URL(request.url);

    // Parse and validate query parameters
    const query = QuerySchema.parse(Object.fromEntries(searchParams.entries()));

    // Build where clause
    const where: any = {
      answerId: answerId,
    };

    if (query.domain) {
      where.domain = { contains: query.domain, mode: 'insensitive' };
    }

    if (query.citationType) {
      where.citationType = query.citationType;
    }

    if (query.isLive !== undefined) {
      where.isLive = query.isLive === 'true';
    }

    if (query.isPrimary !== undefined) {
      where.isPrimary = query.isPrimary === 'true';
    }

    if (query.minConfidence !== undefined) {
      where.confidenceScore = { gte: query.minConfidence };
    }

    if (query.minAuthorityScore !== undefined) {
      where.authorityScore = { gte: query.minAuthorityScore };
    }

    // Build order by
    const orderBy: any = {};
    switch (query.sortBy) {
      case 'rank':
        orderBy.rank = query.sortOrder;
        break;
      case 'confidence':
        orderBy.confidenceScore = query.sortOrder;
        break;
      case 'authority':
        orderBy.authorityScore = query.sortOrder;
        break;
      case 'created':
        orderBy.createdAt = query.sortOrder;
        break;
    }

    // Calculate pagination
    const skip = (query.page - 1) * query.limit;

    // Fetch citations with pagination
    const [citations, totalCount] = await Promise.all([
      prisma.answerCitation.findMany({
        where,
        orderBy,
        skip,
        take: query.limit,
        select: {
          id: true,
          rawCitation: true,
          normalizedUrl: true,
          url: true,
          domain: true,
          title: true,
          rank: true,
          authorityScore: true,
          confidenceScore: true,
          citationType: true,
          isLive: true,
          isPrimary: true,
          lastChecked: true,
          createdAt: true,
        },
      }),
      prisma.answerCitation.count({ where }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / query.limit);
    const hasNextPage = query.page < totalPages;
    const hasPreviousPage = query.page > 1;

    return NextResponse.json({
      success: true,
      data: {
        citations,
        pagination: {
          page: query.page,
          limit: query.limit,
          totalCount,
          totalPages,
          hasNextPage,
          hasPreviousPage,
        },
        filters: {
          domain: query.domain,
          citationType: query.citationType,
          isLive: query.isLive,
          isPrimary: query.isPrimary,
          minConfidence: query.minConfidence,
          minAuthorityScore: query.minAuthorityScore,
        },
        sorting: {
          sortBy: query.sortBy,
          sortOrder: query.sortOrder,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching citations:', error);

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
        error: 'Failed to fetch citations',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/citations/[answerId] - Extract and store citations for an answer
 */
export async function POST(request: NextRequest, { params }: { params: { answerId: string } }) {
  try {
    const { answerId } = params;
    const body = await request.json();

    const { answerText, options = {} } = body;

    if (!answerText) {
      return NextResponse.json(
        {
          success: false,
          error: 'Answer text is required',
        },
        { status: 400 }
      );
    }

    // Check if answer exists
    const answer = await prisma.answer.findUnique({
      where: { id: answerId },
    });

    if (!answer) {
      return NextResponse.json(
        {
          success: false,
          error: 'Answer not found',
        },
        { status: 404 }
      );
    }

    // Extract citations
    const extractedCitations = CitationExtractor.extractCitations(answerText, {
      maxCitations: options.maxCitations || 20,
      extractTitles: options.extractTitles ?? true,
      confidenceThreshold: options.confidenceThreshold || 0.4,
    });

    if (extractedCitations.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          message: 'No citations found in answer text',
          citationsExtracted: 0,
          citationsStored: 0,
        },
      });
    }

    // Store citations in database
    const citationData = extractedCitations.map((citation) => ({
      answerId,
      rawCitation: citation.rawCitation,
      normalizedUrl: citation.normalizedUrl,
      url: citation.url,
      domain: citation.domain,
      title: citation.title || null,
      rank: citation.rank || null,
      confidenceScore: citation.confidenceScore,
      citationType: citation.citationType,
      isPrimary: false, // Will be updated by background job
    }));

    // Use createMany with skipDuplicates for efficiency
    const result = await prisma.answerCitation.createMany({
      data: citationData,
      skipDuplicates: true,
    });

    // Get citation statistics
    const stats = CitationExtractor.getCitationStats(extractedCitations);

    return NextResponse.json({
      success: true,
      data: {
        message: 'Citations extracted and stored successfully',
        citationsExtracted: extractedCitations.length,
        citationsStored: result.count,
        statistics: stats,
        extractedCitations: extractedCitations.map((c) => ({
          domain: c.domain,
          citationType: c.citationType,
          confidenceScore: c.confidenceScore,
          rank: c.rank,
        })),
      },
    });
  } catch (error) {
    console.error('Error processing citations:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process citations',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/citations/[answerId] - Delete all citations for an answer
 */
export async function DELETE(request: NextRequest, { params }: { params: { answerId: string } }) {
  try {
    const { answerId } = params;

    const result = await prisma.answerCitation.deleteMany({
      where: { answerId },
    });

    return NextResponse.json({
      success: true,
      data: {
        message: 'Citations deleted successfully',
        deletedCount: result.count,
      },
    });
  } catch (error) {
    console.error('Error deleting citations:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete citations',
      },
      { status: 500 }
    );
  }
}
