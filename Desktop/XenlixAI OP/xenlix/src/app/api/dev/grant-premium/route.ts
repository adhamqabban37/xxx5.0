import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// Development endpoint to instantly grant premium access
export async function POST(req: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { subscription: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user.name || 'Dev User',
        },
        include: { subscription: true },
      });
    }

    // Create or update subscription to premium
    if (user.subscription) {
      await prisma.subscription.update({
        where: { id: user.subscription.id },
        data: {
          status: 'active',
          plan: 'premium',
          stripeSubscriptionId: 'dev_premium_access',
          stripeCustomerId: 'cus_dev_premium',
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        },
      });
    } else {
      await prisma.subscription.create({
        data: {
          userId: user.id,
          status: 'active',
          plan: 'premium',
          stripeSubscriptionId: 'dev_premium_access',
          stripeCustomerId: 'cus_dev_premium',
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Premium access granted!',
      user: {
        email: user.email,
        premium: true,
      },
    });
  } catch (error) {
    console.error('Dev premium grant error:', error);
    return NextResponse.json({ error: 'Failed to grant premium access' }, { status: 500 });
  }
}

// Get current user status
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { subscription: true },
    });

    return NextResponse.json({
      user: {
        email: session.user.email,
        hasPremium: user?.subscription?.status === 'active',
        subscription: user?.subscription,
      },
      isDevelopment: process.env.NODE_ENV === 'development',
      testingMode: process.env.ENABLE_TESTING_PREMIUM === 'true',
    });
  } catch (error) {
    console.error('Dev status error:', error);
    return NextResponse.json({ error: 'Failed to get status' }, { status: 500 });
  }
}
