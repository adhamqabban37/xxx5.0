import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { authOptions } from "../auth/[...nextauth]/route";
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
  }
};

const checkoutSchema = z.object({
  planId: z.enum(['basic', 'pro', 'growth']),
  customerInfo: z.object({
    email: z.string().email().optional(),
    name: z.string().optional(),
    company: z.string().optional(),
    phone: z.string().optional()
  }).optional()
});

export async function POST(req: NextRequest) {
  const result = await validateRequest(req, checkoutSchema);
  if (!result.success) {
    return result.response;
  }

  const startTime = Date.now();
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      logger.logCheckout('checkout_unauthorized', '', {});
      return createErrorResponse('Unauthorized', 401);
    }

    const { planId, customerInfo } = result.data;
    
    logger.logCheckout('checkout_started', '', {
      planId,
      billingMode: process.env.BILLING_MODE || 'sandbox',
      request: logger.extractRequestContext(req),
      hasCustomerInfo: !!customerInfo
    });

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return createErrorResponse('User not found', 404);
    }

    // Check billing mode
    const billingMode = process.env.BILLING_MODE || 'sandbox';

    if (billingMode === 'sandbox') {
      // Sandbox mode: Return success without creating Stripe session
      logger.logCheckout('checkout_sandbox_success', '', { planId });
      
      return createSuccessResponse({
        sessionId: `cs_sandbox_${Date.now()}`,
        url: `/dashboard?session_id=sandbox_${Date.now()}&sandbox=true`,
        planId,
        mode: 'sandbox'
      });
    }

    // Stripe mode (test-stripe or live)
    // Create or get Stripe customer
    let customerId: string;
    try {
      const customerData: any = {
        email: session.user.email,
        metadata: { userId: user.id }
      };

      // Add customer info if provided
      if (customerInfo) {
        if (customerInfo.name) customerData.name = customerInfo.name;
        if (customerInfo.phone) customerData.phone = customerInfo.phone;
      }

      const customer = await stripe.customers.create(customerData);
      customerId = customer.id;
    } catch (stripeError) {
      logger.logCheckout('checkout_stripe_customer_error', '', { error: stripeError });
      return createErrorResponse('Failed to create customer', 500);
    }

    // Get price ID based on environment
    const env = process.env.APP_ENV === 'production' ? 'production' : 'staging';
    const priceId = priceMap[env][planId as keyof typeof priceMap[typeof env]];

    if (!priceId) {
      return createErrorResponse('Price not configured', 500);
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
        planId 
      });

      return createSuccessResponse({ url: checkoutSession.url });
    } catch (stripeError) {
      logger.logCheckout('checkout_stripe_session_error', '', { error: stripeError });
      return createErrorResponse('Failed to create checkout session', 500);
    }
    
  } catch (error) {
    console.error('Checkout error:', error);
    logger.logCheckout('checkout_error', '', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime 
    });
    return createErrorResponse('Internal server error', 500);
  }
}