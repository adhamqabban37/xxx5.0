import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../auth/[...nextauth]/route';
import { logger } from '../../../lib/logger';
import { z } from 'zod';
import { validateRequest, createErrorResponse, createSuccessResponse } from '@/lib/validation';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

const prisma = new PrismaClient();

// Price mappings based on environment
const priceMap = {
  production: {
    basic: process.env.STRIPE_PRICE_BASIC_LIVE!,
    pro: process.env.STRIPE_PRICE_PRO_LIVE!,
    growth: process.env.STRIPE_PRICE_GROWTH_LIVE!,
  },
  staging: {
    basic: process.env.STRIPE_PRICE_BASIC_TEST!,
    pro: process.env.STRIPE_PRICE_PRO_TEST!,
    growth: process.env.STRIPE_PRICE_GROWTH_TEST!,
  },
};

const checkoutSchema = z.object({
  planId: z.enum(['free', 'basic', 'premium', 'pro', 'growth', 'enterprise']),
  customerInfo: z
    .object({
      email: z.string().optional(),
      name: z.string().optional(),
      company: z.string().optional(),
      phone: z.string().optional(),
      website: z.string().optional(),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  const result = await validateRequest(req, checkoutSchema);
  if (!result.success) {
    console.error('Validation failed:', result.response);
    return result.response;
  }

  const startTime = Date.now();
  const { planId, customerInfo } = result.data;

  try {
    const session = await getServerSession(authOptions);
    console.log('Session:', session);
    console.log('Plan ID:', planId);

    // Allow free trials without authentication for testing
    if (planId === 'free') {
      try {
        // Calculate trial end date (7 days from now)
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 7);

        console.log('Creating free trial without authentication');

        logger.logCheckout('checkout_free_trial_success', '', { planId, trialEndDate });

        return NextResponse.json({
          sessionId: `cs_free_trial_${Date.now()}`,
          url: `/dashboard?session_id=free_trial_${Date.now()}&trial=true`,
          planId,
          mode: 'free_trial',
          isFreeTrial: true,
          trialEndDate: trialEndDate.toISOString(),
        });
      } catch (error) {
        console.error('Free trial error:', error);
        logger.logCheckout('checkout_free_trial_error', '', { error });
        return NextResponse.json(
          { error: 'Failed to create free trial. Please try again.' },
          { status: 500 }
        );
      }
    }

    // For paid plans, require authentication
    if (!session?.user?.email) {
      console.error('No session or email found for paid plan');
      logger.logCheckout('checkout_unauthorized', '', {});
      return NextResponse.json(
        { error: 'Please sign in to continue with checkout' },
        { status: 401 }
      );
    }

    logger.logCheckout('checkout_started', '', {
      planId,
      billingMode: process.env.BILLING_MODE || 'sandbox',
      request: logger.extractRequestContext(req),
      hasCustomerInfo: !!customerInfo,
    });

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User account not found. Please try signing in again.' },
        { status: 404 }
      );
    }

    // Check billing mode
    const billingMode = process.env.BILLING_MODE || 'sandbox';

    if (billingMode === 'sandbox') {
      // Sandbox mode: Return success without creating Stripe session
      logger.logCheckout('checkout_sandbox_success', '', { planId });

      return NextResponse.json({
        sessionId: `cs_sandbox_${Date.now()}`,
        url: `/dashboard?session_id=sandbox_${Date.now()}&sandbox=true`,
        planId,
        mode: 'sandbox',
      });
    }

    // Validate Stripe configuration
    if (
      !process.env.STRIPE_SECRET_KEY ||
      process.env.STRIPE_SECRET_KEY === 'your-stripe-secret-key-here'
    ) {
      return createErrorResponse('Payment system is not configured. Please contact support.', 500);
    }

    // Stripe mode (test-stripe or live)
    // Create or get Stripe customer
    let customerId: string;
    try {
      const customerData: any = {
        email: session.user.email,
        metadata: { userId: user.id },
      };

      // Add customer info if provided
      if (customerInfo) {
        if (customerInfo.name) customerData.name = customerInfo.name;
        if (customerInfo.phone) customerData.phone = customerInfo.phone;
      }

      const customer = await stripe.customers.create(customerData);
      customerId = customer.id;
    } catch (stripeError: any) {
      logger.logCheckout('checkout_stripe_customer_error', '', { error: stripeError });
      return createErrorResponse(
        `Failed to create customer account: ${stripeError.message || 'Unknown error'}`,
        500
      );
    }

    // Get price ID based on environment
    const env = process.env.APP_ENV === 'production' ? 'production' : 'staging';
    const priceId = priceMap[env][planId as keyof (typeof priceMap)[typeof env]];

    if (!priceId) {
      logger.logCheckout('checkout_price_not_configured', '', { planId, env });
      return createErrorResponse(
        `Pricing not configured for plan: ${planId}. Please contact support.`,
        500
      );
    }

    // Create checkout session
    try {
      const checkoutSession = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: `${req.nextUrl.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.nextUrl.origin}/plans`,
        metadata: {
          userId: user.id,
          planId: planId,
        },
      });

      logger.logCheckout('checkout_stripe_session_created', '', {
        sessionId: checkoutSession.id,
        planId,
      });

      return NextResponse.json({ url: checkoutSession.url });
    } catch (stripeError: any) {
      logger.logCheckout('checkout_stripe_session_error', '', { error: stripeError });
      return createErrorResponse(
        `Failed to create checkout session: ${stripeError.message || 'Unknown error'}`,
        500
      );
    }
  } catch (error) {
    console.error('Checkout error:', error);
    logger.logCheckout('checkout_error', '', {
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime,
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
