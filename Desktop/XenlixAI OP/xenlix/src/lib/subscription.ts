import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getUserSubscriptionStatus(userEmail: string) {
  try {
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
