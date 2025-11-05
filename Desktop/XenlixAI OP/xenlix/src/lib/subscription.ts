import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getUserSubscriptionStatus(userEmail: string) {
  try {
    // Development override - always grant premium access in development/testing
    const isDevelopment = process.env.NODE_ENV === 'development';
    const enableTestingMode = process.env.ENABLE_TESTING_PREMIUM === 'true';

    if (isDevelopment || enableTestingMode) {
      const user = await prisma.user.findUnique({
        where: { email: userEmail },
      });

      if (user) {
        return {
          hasAccess: true,
          subscription: {
            id: 'dev-sub',
            status: 'active',
            plan: 'premium',
            stripeSubscriptionId: 'dev_testing_premium',
            stripeCustomerId: 'cus_dev_testing',
            currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            userId: user.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          isSandbox: true,
          user: {
            id: user.id,
            email: user.email,
            stripeCustomerId: 'cus_dev_testing',
          },
        };
      }
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: { subscription: true },
    });

    if (!user) {
      return { hasAccess: false, subscription: null, error: 'User not found' };
    }

    const subscription = user.subscription;
    const hasAccess = subscription?.status === 'active';
    const isSandbox = subscription?.stripeSubscriptionId?.startsWith('sandbox_');

    return {
      hasAccess,
      subscription,
      isSandbox: isSandbox || false,
      user: {
        id: user.id,
        email: user.email,
        stripeCustomerId: user.stripeCustomerId,
      },
    };
  } catch (error) {
    return { hasAccess: false, subscription: null, error: 'Database error' };
  } finally {
    await prisma.$disconnect();
  }
}

export async function requireActiveSubscription(userEmail: string) {
  const status = await getUserSubscriptionStatus(userEmail);

  if (!status.hasAccess) {
    throw new Error('Active subscription required');
  }

  return status;
}
