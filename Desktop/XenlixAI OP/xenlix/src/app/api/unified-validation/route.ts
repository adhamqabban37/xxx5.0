/**
 * Unified AEO Validation API
 * Main endpoint for comprehensive website validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { UnifiedAEOValidator } from '@/lib/unified-aeo-validator';
import { z } from 'zod';

const validationRequestSchema = z.object({
  websiteUrl: z.string().url('Please enter a valid website URL'),
  businessData: z
    .object({
      name: z.string().optional(),
      industry: z.string().optional(),
      location: z.string().optional(),
      keywords: z.array(z.string()).optional(),
      description: z.string().optional(),
    })
    .optional(),
  includePaymentInfo: z.boolean().default(false),
  enableAuthorityScoring: z.boolean().default(false),
  competitors: z.array(z.string().url()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const clientIP =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';

    // Check rate limits before processing
    const { psiRateLimit } = await import('@/lib/rate-limit');

    const [validationRate, psiRate] = await Promise.all([
      psiRateLimit.checkValidationRate(clientIP),
      psiRateLimit.checkPSIQuota(clientIP),
    ]);

    // Check validation rate limit
    if (!validationRate.allowed) {
      return NextResponse.json(
        {
          error: 'Too many validation requests',
          message: `Please wait ${Math.ceil((validationRate.resetTime - Date.now()) / 1000)} seconds before trying again.`,
          retryAfter: Math.ceil((validationRate.resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((validationRate.resetTime - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // Check PSI quota (this will be used inside validator)
    if (!psiRate.allowed) {
      console.warn(`PSI quota exceeded for ${clientIP}, continuing with fallback data`);
    }

    // Validate request
    const body = await request.json();
    const validation = validationRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { websiteUrl, businessData, includePaymentInfo, enableAuthorityScoring, competitors } =
      validation.data;

    console.log(`🚀 Starting unified AEO validation for: ${websiteUrl}`);
    if (enableAuthorityScoring) {
      console.log(`🔍 Authority scoring enabled with ${competitors?.length || 0} competitors`);
    }

    // Create validator instance with authority scoring options
    const validator = new UnifiedAEOValidator(
      websiteUrl,
      businessData,
      enableAuthorityScoring,
      competitors,
      clientIP
    );

    // Run complete validation
    const results = await validator.runCompleteValidation();

    // Check if user is authenticated for GSC data and saving results
    const session = await getServerSession(authOptions);

    // Optionally fetch GSC data for verified sites
    let gscData = null;
    if (session?.user?.email) {
      try {
        console.log('🔍 Checking for GSC data...');

        // Make internal API call to GSC summary
        const gscResponse = await fetch(
          `${process.env.NEXTAUTH_URL}/api/gsc/summary?siteUrl=${encodeURIComponent(websiteUrl)}`,
          {
            headers: {
              Cookie: request.headers.get('Cookie') || '',
              'User-Agent': 'Internal-API-Call',
            },
          }
        );

        if (gscResponse.ok) {
          const gscResult = await gscResponse.json();
          if (gscResult.success && gscResult.summary?.verified) {
            gscData = gscResult.summary;
            console.log('✅ GSC data retrieved for verified site');
          } else {
            console.log('ℹ️ Site not verified in GSC or no data available');
          }
        }
      } catch (gscError) {
        console.warn('GSC data fetch failed (non-blocking):', gscError);
        // Continue without GSC data - it's optional
      }
    }
    let savedValidationId = null;

    if (session?.user?.email) {
      try {
        // Find user
        const user = await prisma.user.findUnique({
          where: { email: session.user.email },
        });

        if (user) {
          // Extract data for database storage
          const authorityScore =
            enableAuthorityScoring && results.categories?.authority
              ? results.categories.authority.score
              : null;

          const competitorAuthority =
            enableAuthorityScoring && results.categories?.authority?.details
              ? results.categories.authority.details.competitorScores
              : null;

          // Extract PSI data from results
          const psiResults = (results as any).psi; // Type assertion for PSI data
          const psiMobile = psiResults?.mobile || null;
          const psiDesktop = psiResults?.desktop || null;
          const psiPerf = psiResults?.averageScores?.perf || null;
          const psiSeo = psiResults?.averageScores?.seo || null;
          const psiAccessibility = psiResults?.averageScores?.accessibility || null;
          const psiBestPractices = psiResults?.averageScores?.bestPractices || null;

          const savedValidation = await prisma.aeoValidation.create({
            data: {
              userId: user.id,
              websiteUrl,
              businessData: businessData || {},
              validationResults: results,
              overallScore: results.overallScore,
              authorityScore,
              competitorAuthority,
              psiMobile,
              psiDesktop,
              psiPerf,
              psiSeo,
              psiAccessibility,
              psiBestPractices,
              gscSummary: gscData,
              gscConnected: gscData !== null,
              status: 'completed',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
          savedValidationId = savedValidation.id;
          console.log(`✅ Validation saved with ID: ${savedValidationId}`);
        }
      } catch (dbError) {
        console.error('Database save error:', dbError);
        // Continue without saving - don't fail the entire request
      }
    }

    // Include payment information if requested
    if (includePaymentInfo) {
      results.paymentInfo = {
        required: results.paymentRequired,
        amount: 29.99,
        currency: 'USD',
        description: 'Complete AEO Analysis & Schema Generation',
        features: [
          'Full website validation report',
          'Custom JSON-LD schema generation',
          'AEO optimization recommendations',
          'Implementation guidance',
          'Rich Results testing URLs',
        ],
      };
    }

    return NextResponse.json({
      success: true,
      validationId: savedValidationId,
      results,
      gscData,
      message: 'AEO validation completed successfully',
      features: {
        psiEnabled: true,
        gscConnected: gscData !== null,
        authorityScoring: enableAuthorityScoring,
      },
    });
  } catch (error) {
    console.error('Unified validation error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get saved validation by ID
    const url = new URL(request.url);
    const validationId = url.searchParams.get('id');

    if (!validationId) {
      return NextResponse.json({ error: 'Validation ID required' }, { status: 400 });
    }

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get validation results
    const validation = await prisma.aeoValidation.findFirst({
      where: {
        id: validationId,
        userId: user.id,
      },
    });

    if (!validation) {
      return NextResponse.json({ error: 'Validation not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      validation: {
        id: validation.id,
        websiteUrl: validation.websiteUrl,
        businessData: validation.businessData,
        results: validation.validationResults,
        overallScore: validation.overallScore,
        status: validation.status,
        createdAt: validation.createdAt,
        updatedAt: validation.updatedAt,
      },
    });
  } catch (error) {
    console.error('Get validation error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * Handle post-payment deliverables
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { validationId, paymentConfirmed } = body;

    if (!validationId || !paymentConfirmed) {
      return NextResponse.json(
        {
          error: 'Validation ID and payment confirmation required',
        },
        { status: 400 }
      );
    }

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find user and validation
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const validation = await prisma.aeoValidation.findFirst({
      where: {
        id: validationId,
        userId: user.id,
      },
    });

    if (!validation) {
      return NextResponse.json({ error: 'Validation not found' }, { status: 404 });
    }

    // Generate post-payment deliverables
    const validator = new UnifiedAEOValidator(
      validation.websiteUrl,
      validation.businessData as any
    );

    const deliverables = await validator.generatePostPaymentDeliverables();

    // Update validation with payment status and deliverables
    const updatedValidation = await prisma.aeoValidation.update({
      where: { id: validationId },
      data: {
        isPaid: true,
        deliverables,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Payment confirmed, deliverables generated',
      deliverables,
      validation: {
        id: updatedValidation.id,
        isPaid: updatedValidation.isPaid,
        updatedAt: updatedValidation.updatedAt,
      },
    });
  } catch (error) {
    console.error('Post-payment deliverables error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
