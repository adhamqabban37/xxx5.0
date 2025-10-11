import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { extractFromUrl } from '@/lib/seo/extractFromUrl';
import { normalizeProfile } from '@/lib/seo/normalize';
import { buildJsonLd } from '@/lib/seo/jsonld';
import { PrismaClient } from '@prisma/client';
import { NormalizedBusiness } from '@/types/seo';
import { logger } from '@/lib/logger';
import { validateRequest, createErrorResponse, createSuccessResponse } from '@/lib/validation';

const prisma = new PrismaClient();

// Validation schema
const jsonLdSchema = z.object({
  url: z.string().url('Please provide a valid URL'),
  fallback: z
    .object({
      name: z.string().optional(),
      url: z.string().url().optional(),
      phone: z.string().optional(),
      email: z.string().email().optional(),
      address: z
        .object({
          street: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          zipCode: z.string().optional(),
          country: z.string().optional(),
        })
        .optional(),
      businessHours: z
        .array(
          z.object({
            day: z.string(),
            hours: z.string(),
          })
        )
        .optional(),
      description: z.string().optional(),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Get session for logging context
    const session = await getServerSession(authOptions);
    const userId = session?.user?.email || 'anonymous';

    logger.info('SEO JSON-LD generation started', {
      userId,
      action: 'json_ld_generation_started',
      resource: 'seo',
      request: logger.extractRequestContext(req),
    });

    // Validate request body
    const validation = await validateRequest(req, jsonLdSchema);
    if (!validation.success) {
      logger.warn('Validation failed', {
        userId,
        action: 'validation_failed',
        resource: 'seo',
      });
      return validation.response;
    }

    const { url, fallback } = validation.data;

    logger.info('Starting data extraction', {
      userId,
      action: 'extraction_started',
      resource: 'seo',
      metadata: { url },
    });

    // Extract data from URL
    const extractionResult = await extractFromUrl(url);

    if (!extractionResult.ok) {
      logger.error('URL extraction failed', new Error('Extraction failed'), {
        userId,
        action: 'extraction_failed',
        resource: 'seo',
        metadata: { url, reason: extractionResult.reason },
      });
      return createErrorResponse('FETCH_OR_PARSE_FAILED', 502);
    }

    logger.info('Extraction successful, merging data', {
      userId,
      action: 'extraction_successful',
      resource: 'seo',
      metadata: { url, extractedFields: Object.keys(extractionResult.data) },
    });

    // Normalize fallback data if provided
    let normalizedFallback: NormalizedBusiness = { name: '' };
    if (fallback) {
      normalizedFallback = normalizeProfile(fallback);
    }

    // Merge extracted data with fallback (extracted data takes precedence)
    const mergedData: NormalizedBusiness = {
      name: extractionResult.data.name || normalizedFallback.name || '',
      ...((extractionResult.data.url || normalizedFallback.url) && {
        url: extractionResult.data.url || normalizedFallback.url,
      }),
      ...((extractionResult.data.logo || normalizedFallback.logo) && {
        logo: extractionResult.data.logo || normalizedFallback.logo,
      }),
      ...((extractionResult.data.phone || normalizedFallback.phone) && {
        phone: extractionResult.data.phone || normalizedFallback.phone,
      }),
      ...((extractionResult.data.address || normalizedFallback.address) && {
        address: {
          ...normalizedFallback.address,
          ...extractionResult.data.address,
        },
      }),
      ...((extractionResult.data.services || normalizedFallback.services) && {
        services: extractionResult.data.services || normalizedFallback.services,
      }),
      ...((extractionResult.data.social || normalizedFallback.social) && {
        social: extractionResult.data.social || normalizedFallback.social,
      }),
      ...((extractionResult.data.hours || normalizedFallback.hours) && {
        hours: extractionResult.data.hours || normalizedFallback.hours,
      }),
      ...((extractionResult.data.rating !== undefined ||
        normalizedFallback.rating !== undefined) && {
        rating:
          extractionResult.data.rating !== undefined
            ? extractionResult.data.rating
            : normalizedFallback.rating,
      }),
      ...((extractionResult.data.reviewCount !== undefined ||
        normalizedFallback.reviewCount !== undefined) && {
        reviewCount:
          extractionResult.data.reviewCount !== undefined
            ? extractionResult.data.reviewCount
            : normalizedFallback.reviewCount,
      }),
      ...((extractionResult.data.geo || normalizedFallback.geo) && {
        geo: extractionResult.data.geo || normalizedFallback.geo,
      }),
      ...((extractionResult.data.faqs || normalizedFallback.faqs) && {
        faqs: extractionResult.data.faqs || normalizedFallback.faqs,
      }),
    };

    logger.info('Building JSON-LD from merged data', {
      userId,
      action: 'jsonld_building',
      resource: 'seo',
      metadata: { mergedDataFields: Object.keys(mergedData) },
    });

    // Build JSON-LD
    const jsonLdResult = buildJsonLd(mergedData);

    logger.info('JSON-LD generation completed', {
      userId,
      action: 'jsonld_generated',
      resource: 'seo',
      metadata: {
        url,
        blocksCount: jsonLdResult.blocks.length,
        processingTime: `${Date.now() - startTime}ms`,
      },
    });

    // Try to persist to database (don't block response on failure)
    try {
      const user = await prisma.user.findUnique({
        where: { email: userId },
      });

      if (user) {
        // Note: Commenting out database save due to Prisma schema sync issue
        // await prisma.seoJsonLd.create({
        //   data: {
        //     userId: user.id,
        //     url,
        //     blocks: jsonLdResult
        //   }
        // });

        logger.info('Database persistence skipped (schema sync needed)', {
          userId,
          action: 'db_save_skipped',
          resource: 'seo',
          metadata: { url, userId: user.id },
        });
      }
    } catch (dbError) {
      logger.error('Database save failed (non-blocking)', dbError as Error, {
        userId,
        action: 'db_save_failed',
        resource: 'seo',
        metadata: { url },
      });
      // Continue without failing the response
    }

    return createSuccessResponse(jsonLdResult);
  } catch (error) {
    logger.error('Unexpected error in JSON-LD generation', error as Error, {
      userId: 'unknown',
      action: 'unexpected_error',
      resource: 'seo',
      metadata: { processingTime: `${Date.now() - startTime}ms` },
    });
    return createErrorResponse('Internal server error', 500);
  } finally {
    await prisma.$disconnect();
  }
}
