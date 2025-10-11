// API endpoint for alert management and configuration
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { AlertManager } from '@/lib/alert-manager';
import { z } from 'zod';

// Validation schemas
const createThresholdSchema = z.object({
  url: z.string().url(),
  metricType: z.enum([
    'psi_performance',
    'psi_accessibility',
    'psi_seo',
    'psi_lcp',
    'psi_cls',
    'opr_clicks',
    'opr_impressions',
    'opr_ctr',
    'opr_position',
    'schema_errors',
    'schema_total',
  ]),
  operator: z.enum(['lt', 'gt', 'eq', 'lte', 'gte']),
  threshold: z.number(),
});

const updateThresholdSchema = z.object({
  threshold: z.number().optional(),
  enabled: z.boolean().optional(),
  operator: z.enum(['lt', 'gt', 'eq', 'lte', 'gte']).optional(),
});

const cronAlertSchema = z.object({
  secret: z.string(),
  action: z.enum(['check', 'send', 'test']).optional().default('check'),
  force: z.boolean().optional().default(false),
});

// POST endpoint for creating thresholds and running alert checks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if this is a cron request
    if (body.secret) {
      return await handleCronRequest(body);
    }

    // Regular authenticated request
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { action, ...data } = body;

    const alertManager = new AlertManager();

    switch (action) {
      case 'create_threshold':
        return await handleCreateThreshold(data, alertManager);

      case 'update_threshold':
        return await handleUpdateThreshold(data, alertManager);

      case 'delete_threshold':
        return await handleDeleteThreshold(data, alertManager);

      case 'test_alert':
        return await handleTestAlert(data, alertManager);

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Alerts endpoint error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET endpoint for retrieving thresholds and alert history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    // Check if this is a cron status request
    if (secret) {
      const cronSecret = process.env.CRON_SECRET;
      if (!cronSecret || secret !== cronSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const alertManager = new AlertManager();
      const pendingAlerts = await alertManager.getAlertHistory(undefined, 1);

      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        pendingAlerts: pendingAlerts.filter((alert) => !alert.sent).length,
        recentAlerts: pendingAlerts.length,
      });
    }

    // Regular authenticated request
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const url = searchParams.get('url');
    const days = parseInt(searchParams.get('days') || '30');
    const type = searchParams.get('type') || 'thresholds'; // 'thresholds' or 'history'

    const alertManager = new AlertManager();

    if (type === 'history') {
      const history = await alertManager.getAlertHistory(url || undefined, days);
      return NextResponse.json({
        success: true,
        data: history,
        metadata: {
          url,
          days,
          total: history.length,
        },
      });
    } else {
      const thresholds = await alertManager.getThresholds(url || undefined);
      return NextResponse.json({
        success: true,
        data: thresholds,
        metadata: {
          url,
          total: thresholds.length,
        },
      });
    }
  } catch (error) {
    console.error('Alerts GET endpoint error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Handle cron-triggered alert operations
async function handleCronRequest(body: any) {
  const validation = cronAlertSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid cron request', details: validation.error.issues },
      { status: 400 }
    );
  }

  const { secret, action, force } = validation.data;

  // Authenticate with CRON_SECRET
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || secret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const alertManager = new AlertManager();

  try {
    switch (action) {
      case 'check':
        const checkResults = await alertManager.checkAllThresholds();
        return NextResponse.json({
          success: true,
          action: 'check',
          timestamp: new Date().toISOString(),
          results: checkResults,
        });

      case 'send':
        const sendResults = await alertManager.sendPendingAlerts();
        return NextResponse.json({
          success: true,
          action: 'send',
          timestamp: new Date().toISOString(),
          results: sendResults,
        });

      case 'test':
        // Create a test alert to verify the system is working
        const testResult = await createTestAlert(alertManager);
        return NextResponse.json({
          success: true,
          action: 'test',
          timestamp: new Date().toISOString(),
          results: testResult,
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error(`Cron alert action ${action} failed:`, error);
    return NextResponse.json(
      {
        error: 'Cron action failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Handle threshold creation
async function handleCreateThreshold(data: any, alertManager: AlertManager) {
  const validation = createThresholdSchema.safeParse(data);
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid threshold data', details: validation.error.issues },
      { status: 400 }
    );
  }

  const threshold = await alertManager.createThreshold(validation.data);

  return NextResponse.json({
    success: true,
    data: threshold,
    message: 'Threshold created successfully',
  });
}

// Handle threshold update
async function handleUpdateThreshold(data: any, alertManager: AlertManager) {
  const { id, ...updateData } = data;

  if (!id) {
    return NextResponse.json({ error: 'Threshold ID is required' }, { status: 400 });
  }

  const validation = updateThresholdSchema.safeParse(updateData);
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid update data', details: validation.error.issues },
      { status: 400 }
    );
  }

  try {
    const threshold = await alertManager.updateThreshold(id, validation.data);

    return NextResponse.json({
      success: true,
      data: threshold,
      message: 'Threshold updated successfully',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Threshold not found or update failed' }, { status: 404 });
  }
}

// Handle threshold deletion
async function handleDeleteThreshold(data: any, alertManager: AlertManager) {
  const { id } = data;

  if (!id) {
    return NextResponse.json({ error: 'Threshold ID is required' }, { status: 400 });
  }

  try {
    await alertManager.deleteThreshold(id);

    return NextResponse.json({
      success: true,
      message: 'Threshold deleted successfully',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Threshold not found or deletion failed' }, { status: 404 });
  }
}

// Handle test alert
async function handleTestAlert(data: any, alertManager: AlertManager) {
  const { url, metricType } = data;

  if (!url || !metricType) {
    return NextResponse.json(
      { error: 'URL and metricType are required for test alerts' },
      { status: 400 }
    );
  }

  try {
    // Create a temporary threshold that will likely trigger
    const testThreshold = await alertManager.createThreshold({
      url,
      metricType,
      operator: 'lt',
      threshold: 999, // High threshold to ensure trigger
    });

    // Check the threshold immediately
    const checkResults = await alertManager.checkAllThresholds();

    // Clean up the test threshold
    await alertManager.deleteThreshold(testThreshold.id);

    return NextResponse.json({
      success: true,
      message: 'Test alert completed',
      results: checkResults,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Test alert failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Create test alert for system verification
async function createTestAlert(alertManager: AlertManager): Promise<any> {
  const testUrl = process.env.ALERT_TEST_URL || 'https://example.com';

  try {
    // Create a test threshold
    const testThreshold = await alertManager.createThreshold({
      url: testUrl,
      metricType: 'psi_performance',
      operator: 'lt',
      threshold: 100, // Will trigger if performance is less than 100
    });

    // Check thresholds to potentially trigger the test alert
    const checkResults = await alertManager.checkAllThresholds();

    // Send any pending alerts
    const sendResults = await alertManager.sendPendingAlerts();

    // Clean up test threshold
    await alertManager.deleteThreshold(testThreshold.id);

    return {
      testThresholdCreated: true,
      checkResults,
      sendResults,
      message: 'Test alert system verification completed',
    };
  } catch (error) {
    throw new Error(
      `Test alert failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
