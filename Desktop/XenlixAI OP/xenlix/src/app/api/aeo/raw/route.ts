/**
 * Premium Raw JSON Analytics API
 * Stores and retrieves complete AEO analysis payloads for premium users
 */

export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// Zod schema for Premium Standards validation
const RuleSchema = z.object({
  name: z.string(),
  status: z.enum(['passed', 'failed', 'warning']),
  score: z.number(),
  evidence: z.array(z.string()),
  score_impact: z.number().optional(),
  passed: z.boolean().optional(),
});

const CategorySchema = z.object({
  score: z.number(),
  rules: z.array(RuleSchema),
});

const CrewAIInsightsSchema = z.object({
  analysis: z.string(),
  recommendations: z.array(z.string()),
  competitive_gaps: z.array(z.string()),
  implementation_priority: z.array(
    z.object({
      task: z.string(),
      impact: z.string(),
      effort: z.string(),
    })
  ),
  competitive_analysis: z
    .object({
      position_estimate: z.number(),
      gap_analysis: z.string(),
      market_opportunity: z.string(),
    })
    .optional(),
  roi_projection: z
    .object({
      timeframe: z.string(),
      estimated_traffic_increase: z.string(),
      confidence_level: z.number(),
    })
    .optional(),
  next_actions: z.array(z.string()).optional(),
});

const PremiumStandardsSchema = z.object({
  // Core scores and structure
  overall_score: z.number(),
  grade: z.string(),
  category_scores: z
    .object({
      technical: z.number(),
      content: z.number(),
      authority: z.number(),
      user_intent: z.number(),
    })
    .optional(),

  // Categories (alternative structure)
  categories: z
    .object({
      technical: CategorySchema,
      content: CategorySchema,
      authority: CategorySchema,
      user_intent: CategorySchema,
    })
    .optional(),

  // Rules and analysis
  critical_issues: z.array(z.any()).optional(),
  all_rules: z.array(RuleSchema).optional(),
  evidence: z.any().optional(),
  recommendations: z.array(z.any()).optional(),
  crewai_insights: CrewAIInsightsSchema.optional(),

  // Premium metadata
  tier: z.string().optional(),
  user_id: z.string().optional(),
  evaluation_time_ms: z.number().optional(),
  detailed_analysis: z
    .object({
      total_rules_evaluated: z.number(),
      rules_passed: z.number(),
      improvement_potential: z.number(),
      priority_fixes: z.number(),
    })
    .optional(),

  // Additional fields
  can_rerun: z.boolean().optional(),
  next_scan_available: z.string().optional(),
});

// Type inference from schema
type PremiumPayload = z.infer<typeof PremiumStandardsSchema>;

// Premium access verification (reusing existing logic)
async function verifyPremiumAccess(
  request: NextRequest
): Promise<{ valid: boolean; userId?: string; error?: string }> {
  try {
    // Check for session-based authentication
    const session = await getServerSession(authOptions);

    if (session?.user?.email) {
      // Find user in database
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { subscription: true },
      });

      if (!user) {
        return { valid: false, error: 'User not found' };
      }

      // Check if user has active premium subscription
      const isPremium = user.subscription?.status === 'active';

      if (isPremium) {
        return { valid: true, userId: user.id };
      }
    }

    // Check for API key authentication
    const apiKey = request.headers.get('x-api-key');
    if (apiKey) {
      // Validate premium API key (implement your logic here)
      const isPremiumKey = apiKey.startsWith('premium_') && apiKey.length > 20;
      if (isPremiumKey) {
        return { valid: true, userId: 'api_user' };
      }
    }

    // Check for temporary access tokens (for payment flows)
    const accessToken = request.headers.get('authorization')?.replace('Bearer ', '');
    if (accessToken === 'temp_premium_access') {
      return { valid: true, userId: 'temp_user' };
    }

    return { valid: false, error: 'Premium subscription required' };
  } catch (error) {
    console.error('Premium access verification error:', error);
    return { valid: false, error: 'Authentication error' };
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify premium access
    const accessCheck = await verifyPremiumAccess(request);
    if (!accessCheck.valid) {
      return NextResponse.json(
        { error: accessCheck.error || 'Premium access required' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();

    // Validate the incoming payload using Premium Standards schema
    const validation = PremiumStandardsSchema.safeParse(body.payload || body);

    if (!validation.success) {
      console.error('Raw JSON validation failed:', validation.error);
      return NextResponse.json(
        {
          error: 'Invalid payload structure',
          details: validation.error.issues.slice(0, 5), // Limit error details
        },
        { status: 400 }
      );
    }

    const validatedPayload = validation.data;

    // Extract scanId or create new validation record
    const scanId = body.scanId;
    const url = body.url || 'unknown';

    // Version stamps
    const schemaVersion = 'premium-standards@1.2.0';
    const analyzerVersion = process.env.AEO_ENGINE_VERSION ?? 'aeo-engine@unknown';

    let result;

    if (scanId) {
      // Update existing AeoValidation record
      result = await prisma.aeoValidation.update({
        where: { id: scanId },
        data: {
          rawJson: validatedPayload as unknown as Prisma.JsonObject,
          schemaVersion,
          analyzerVersion,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          websiteUrl: true,
        },
      });
    } else {
      // Create new AeoValidation record
      result = await prisma.aeoValidation.create({
        data: {
          userId:
            accessCheck.userId !== 'api_user' && accessCheck.userId !== 'temp_user'
              ? accessCheck.userId
              : undefined,
          websiteUrl: url,
          businessName: body.businessName || 'Unknown Business',
          businessType: body.businessType,
          validationResults: validatedPayload,
          overallScore: validatedPayload.overall_score || 0,
          issueCount: validatedPayload.detailed_analysis?.priority_fixes || 0,
          criticalIssues: validatedPayload.critical_issues || [],
          recommendations: validatedPayload.recommendations || [],
          paymentStatus: 'paid', // Assuming premium access means paid
          premiumUnlockedAt: new Date(),
          rawJson: validatedPayload as unknown as Prisma.JsonObject,
          schemaVersion,
          analyzerVersion,
        },
        select: {
          id: true,
          websiteUrl: true,
        },
      });
    }

    return NextResponse.json({
      id: result.id,
      url: result.websiteUrl,
      schemaVersion,
      analyzerVersion,
    });
  } catch (error) {
    console.error('Raw JSON storage error:', error);
    return NextResponse.json({ error: 'Failed to store raw JSON analytics' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify premium access
    const accessCheck = await verifyPremiumAccess(request);
    if (!accessCheck.valid) {
      return NextResponse.json(
        { error: accessCheck.error || 'Premium access required' },
        { status: 401 }
      );
    }

    // Get scan ID from query params
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Scan ID is required' }, { status: 400 });
    }

    // Fetch the raw JSON data
    const scan = await prisma.aeoValidation.findUnique({
      where: { id },
      select: {
        id: true,
        websiteUrl: true,
        rawJson: true,
        schemaVersion: true,
        analyzerVersion: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!scan) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
    }

    // Check if user has access to this scan (optional security check)
    if (
      accessCheck.userId &&
      accessCheck.userId !== 'api_user' &&
      accessCheck.userId !== 'temp_user'
    ) {
      const hasAccess = await prisma.aeoValidation.findFirst({
        where: {
          id,
          userId: accessCheck.userId,
        },
        select: { id: true },
      });

      if (!hasAccess) {
        return NextResponse.json({ error: 'Access denied to this scan' }, { status: 403 });
      }
    }

    return NextResponse.json({
      id: scan.id,
      url: scan.websiteUrl,
      schemaVersion: scan.schemaVersion || 'unknown',
      analyzerVersion: scan.analyzerVersion || 'unknown',
      raw: scan.rawJson,
      createdAt: scan.createdAt,
      updatedAt: scan.updatedAt,
    });
  } catch (error) {
    console.error('Raw JSON retrieval error:', error);
    return NextResponse.json({ error: 'Failed to retrieve raw JSON analytics' }, { status: 500 });
  }
}
