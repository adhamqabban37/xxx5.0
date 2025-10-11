import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  console.log('🚀 Checkout API called');

  try {
    const body = await req.json();
    console.log('📝 Request body:', body);

    if (body.planId === 'free') {
      console.log('✅ Free trial requested');

      const response = {
        sessionId: `cs_free_trial_${Date.now()}`,
        url: `/dashboard?session_id=free_trial_${Date.now()}&trial=true`,
        planId: 'free',
        mode: 'free_trial',
        isFreeTrial: true,
        trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      console.log('📤 Sending response:', response);
      return NextResponse.json(response);
    }

    return NextResponse.json({ error: 'Plan not supported in test mode' }, { status: 400 });
  } catch (error) {
    console.error('❌ Checkout error:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Checkout API is working' });
}
