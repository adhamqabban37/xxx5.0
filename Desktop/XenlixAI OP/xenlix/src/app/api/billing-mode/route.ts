import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const billingMode = process.env.BILLING_MODE || 'sandbox';

  return NextResponse.json({
    mode: billingMode,
    description:
      {
        sandbox: 'Free testing mode with 14-day trial access',
        'test-stripe': 'Test payment processing with Stripe test cards',
        live: 'Live payment processing with real credit cards',
      }[billingMode] || 'Unknown billing mode',
  });
}
