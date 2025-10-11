import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { UnifiedAEOValidator } from '@/lib/unified-aeo-validator';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;

      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment succeeded:', paymentIntent.id);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const validationId = session.metadata?.validationId;
  const userId = session.metadata?.userId;

  if (!validationId) {
    console.error('No validationId in checkout session metadata');
    return;
  }

  try {
    // Update validation status to paid
    const validation = await prisma.aeoValidation.update({
      where: { id: validationId },
      data: {
        paymentStatus: 'paid',
        premiumUnlockedAt: new Date(),
      },
    });

    // Generate premium deliverables
    const validator = new UnifiedAEOValidator();
    const deliverables = await validator.generatePostPaymentDeliverables(
      validation.websiteUrl,
      validation.validationResults as any,
      {
        businessName: validation.businessName || undefined,
        businessType: validation.businessType || undefined,
      }
    );

    // Save deliverables to database
    await prisma.aeoValidation.update({
      where: { id: validationId },
      data: {
        optimizedSchemas: deliverables.optimizedSchemas,
        implementationGuide: deliverables.implementationGuide,
        competitorAnalysis: deliverables.competitorAnalysis,
      },
    });

    console.log(`Successfully processed payment for validation ${validationId}`);
  } catch (error) {
    console.error('Error processing checkout completion:', error);
    throw error;
  }
}
