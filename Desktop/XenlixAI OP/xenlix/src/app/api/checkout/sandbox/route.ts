import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../../auth/[...nextauth]/route';
import { z } from 'zod';
import { validateRequest, createErrorResponse, createSuccessResponse } from '@/lib/validation';

const prisma = new PrismaClient();

const sandboxCheckoutSchema = z.object({
  planId: z.enum(['basic', 'pro', 'growth']),
});

// Sandbox checkout that simulates successful payment without Stripe
export async function POST(req: NextRequest) {
  const result = await validateRequest(req, sandboxCheckoutSchema);
  if (!result.success) {
    return result.response;
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return createErrorResponse('Unauthorized', 401);
    }

    const { planId } = result.data;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return createErrorResponse('User not found', 404);
    }

    // Simulate successful payment
    const sandboxSessionId = `cs_sandbox_${Date.now()}`;

    return createSuccessResponse({
      sessionId: sandboxSessionId,
      planId,
      status: 'complete',
      redirectUrl: `/dashboard?session_id=${sandboxSessionId}&sandbox=true`,
      message: `Sandbox ${planId} plan activated successfully`,
    });
  } catch (error) {
    console.error('Sandbox checkout error:', error);
    return createErrorResponse('Failed to process sandbox checkout', 500);
  }
}

// Get current subscription status (sandbox simulation)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return createErrorResponse('Unauthorized', 401);
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return createErrorResponse('User not found', 404);
    }

    return createSuccessResponse({
      subscription: {
        status: 'active',
        plan: 'sandbox',
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      hasSandboxAccess: true,
    });
  } catch (error) {
    console.error('Sandbox status error:', error);
    return createErrorResponse('Failed to get subscription status', 500);
  }
}
