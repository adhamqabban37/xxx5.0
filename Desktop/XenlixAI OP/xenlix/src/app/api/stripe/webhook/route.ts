import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { createErrorResponse, createSuccessResponse } from '@/lib/validation';

// Prevent execution during build time
export const runtime = 'nodejs';

function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.warn('STRIPE_SECRET_KEY not configured - webhook functionality disabled');
    return null;
  }
  return new Stripe(secretKey, {
    apiVersion: '2025-08-27.basil',
  });
}

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const stripe = getStripeClient();
  if (!stripe) {
    return createErrorResponse('Stripe not configured', 500);
  }

  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return createErrorResponse('No signature', 400);
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return createErrorResponse('Webhook secret not configured', 500);
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return createErrorResponse('Invalid signature', 400);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        console.log('Checkout session completed:', {
          sessionId: session.id,
          customerId: session.customer,
          subscriptionId: session.subscription,
          mode: session.mode,
        });

        // In a real implementation, this would update user subscription status
        // For now, just log the event
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;

        console.log('Subscription event:', {
          type: event.type,
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          status: subscription.status,
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        console.log('Subscription deleted:', {
          subscriptionId: subscription.id,
          customerId: subscription.customer,
        });
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;

        console.log('Payment succeeded:', {
          invoiceId: invoice.id,
          customerId: invoice.customer,
          amount: invoice.amount_paid,
        });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;

        console.log('Payment failed:', {
          invoiceId: invoice.id,
          customerId: invoice.customer,
          amount: invoice.amount_due,
        });
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return createSuccessResponse({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return createErrorResponse('Webhook processing failed', 500);
  }
}
