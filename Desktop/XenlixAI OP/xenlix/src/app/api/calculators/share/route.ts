import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { validateRequest, createErrorResponse, createSuccessResponse } from '@/lib/validation';

// In-memory store for demo purposes
// In production, you'd use a database like Redis, DynamoDB, or PostgreSQL
const shareStore = new Map<
  string,
  {
    data: any;
    createdAt: number;
    expiresAt: number;
  }
>();

// Clean up expired entries every hour
setInterval(
  () => {
    const now = Date.now();
    for (const [key, value] of shareStore.entries()) {
      if (now > value.expiresAt) {
        shareStore.delete(key);
      }
    }
  },
  60 * 60 * 1000
);

// Validation schemas
const roiInputsSchema = z.object({
  monthlyRevenue: z.number().min(0, 'Monthly revenue must be positive'),
  conversionRate: z.number().min(0).max(100, 'Conversion rate must be between 0 and 100'),
  averageOrderValue: z.number().min(0, 'Average order value must be positive'),
  marketingBudget: z.number().min(0, 'Marketing budget must be positive'),
  optimizationCost: z.number().min(0, 'Optimization cost must be positive'),
});

const pricingInputsSchema = z.object({
  tier: z.enum(['basic', 'premium', 'enterprise']),
  billingCycle: z.enum(['monthly', 'annual']),
  features: z.array(z.string()).optional(),
  quantity: z.number().min(1, 'Quantity must be at least 1').optional(),
});

const shareSchema = z.object({
  type: z.enum(['roi', 'pricing']).refine((val) => ['roi', 'pricing'].includes(val), {
    message: 'Calculator type must be either "roi" or "pricing"',
  }),
  inputs: z.union([roiInputsSchema, pricingInputsSchema]),
});

export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const validation = await validateRequest(request, shareSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { type, inputs } = validation.data;

    // Generate unique short ID
    const shareId = nanoid(8); // 8-character random string
    const createdAt = Date.now();
    const expiresAt = createdAt + 30 * 24 * 60 * 60 * 1000; // 30 days

    // Store the data
    shareStore.set(shareId, {
      data: { type, inputs },
      createdAt,
      expiresAt,
    });

    return createSuccessResponse({
      shareId,
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://localhost:3000'}/calculators/${type}?share=${shareId}`,
      expiresAt: new Date(expiresAt).toISOString(),
    });
  } catch (error) {
    return createErrorResponse('Internal server error', 500);
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const shareId = searchParams.get('id');

  if (!shareId) {
    return NextResponse.json({ error: 'Missing share ID' }, { status: 400 });
  }

  const shareData = shareStore.get(shareId);

  if (!shareData) {
    return NextResponse.json({ error: 'Share link not found or expired' }, { status: 404 });
  }

  // Check if expired
  if (Date.now() > shareData.expiresAt) {
    shareStore.delete(shareId);
    return NextResponse.json({ error: 'Share link has expired' }, { status: 410 });
  }

  return NextResponse.json({
    data: shareData.data,
    createdAt: new Date(shareData.createdAt).toISOString(),
    expiresAt: new Date(shareData.expiresAt).toISOString(),
  });
}

export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const shareId = searchParams.get('id');

  if (!shareId) {
    return NextResponse.json({ error: 'Missing share ID' }, { status: 400 });
  }

  const existed = shareStore.has(shareId);
  shareStore.delete(shareId);

  if (!existed) {
    return NextResponse.json({ error: 'Share link not found' }, { status: 404 });
  }

  return NextResponse.json({ message: 'Share link deleted successfully' });
}
