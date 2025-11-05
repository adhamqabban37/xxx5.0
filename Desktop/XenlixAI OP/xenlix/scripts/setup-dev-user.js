/**
 * Development setup script to create a premium user for testing
 * Run with: node scripts/setup-dev-user.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupDevUser() {
  try {
    console.log('Setting up development user with premium access...');

    // Get your email from the current session (you'll need to update this)
    const userEmail = 'your-email@example.com'; // Update this with your actual email

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: { subscription: true },
    });

    if (!user) {
      console.log('Creating new user...');
      user = await prisma.user.create({
        data: {
          email: userEmail,
          name: 'Development User',
        },
        include: { subscription: true },
      });
    }

    // Create or update subscription
    if (user.subscription) {
      console.log('Updating existing subscription to active...');
      await prisma.subscription.update({
        where: { id: user.subscription.id },
        data: {
          status: 'active',
          plan: 'premium',
          stripeSubscriptionId: 'sandbox_dev_premium',
          stripeCustomerId: 'cus_dev_test',
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        },
      });
    } else {
      console.log('Creating new premium subscription...');
      await prisma.subscription.create({
        data: {
          userId: user.id,
          status: 'active',
          plan: 'premium',
          stripeSubscriptionId: 'sandbox_dev_premium',
          stripeCustomerId: 'cus_dev_test',
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        },
      });
    }

    console.log('✅ Development user setup complete!');
    console.log(`User: ${userEmail}`);
    console.log('Plan: Premium (Active)');
    console.log('Access: Full premium features enabled');
    console.log('\nYou can now sign in and access the premium dashboard.');
  } catch (error) {
    console.error('❌ Error setting up development user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupDevUser();
