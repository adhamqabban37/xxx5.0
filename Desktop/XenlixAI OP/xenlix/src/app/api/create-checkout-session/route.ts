import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { validationId, priceId } = body;

    if (!validationId || !priceId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Verify the validation exists
    const validation = await prisma.aeoValidation.findUnique({
      where: { id: validationId },
    });

    if (!validation) {
      return NextResponse.json({ error: 'Validation not found' }, { status: 404 });
    }

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXTAUTH_URL}/aeo-validation/${validationId}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/aeo-validation/${validationId}`,
      metadata: {
        validationId,
        userId: session?.user?.id || 'anonymous',
      },
      customer_email: session?.user?.email || undefined,
    });

    // Update validation with payment intent ID
    await prisma.aeoValidation.update({
      where: { id: validationId },
      data: {
        paymentStatus: 'processing',
        stripePaymentIntentId: checkoutSession.id,
      },
    });

    return NextResponse.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error('Checkout session creation error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
