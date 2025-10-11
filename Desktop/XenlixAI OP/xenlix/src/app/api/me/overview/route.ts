import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        guidances: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        adDrafts: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // For now, mock subscription data (you can add Subscription model later)
    const mockSubscription = {
      plan: 'Free',
      status: 'active',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    };

    // Check if user has profile (from Zustand store structure)
    const hasProfile = true; // We'll assume true for now since we have sample data

    const response = {
      user: {
        id: user.id,
        email: user.email,
      },
      subscription: mockSubscription,
      guidance: user.guidances[0] || null,
      adDraft: user.adDrafts[0] || null,
      hasProfile,
    };

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
