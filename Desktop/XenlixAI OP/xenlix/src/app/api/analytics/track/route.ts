import { NextRequest, NextResponse } from 'next/server';

// Define the structure of analytics events
interface AnalyticsEvent {
  event: string;
  timestamp: number;
  url?: string;
  userAgent?: string;
  referrer?: string;
  sessionId?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

// In-memory storage for development (replace with database in production)
const analyticsStore: AnalyticsEvent[] = [];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.event) {
      return NextResponse.json(
        { success: false, error: 'Event name is required' },
        { status: 400 }
      );
    }

    // Create analytics event
    const analyticsEvent: AnalyticsEvent = {
      event: body.event,
      timestamp: Date.now(),
      url: body.url || '',
      userAgent: request.headers.get('user-agent') || '',
      referrer: request.headers.get('referer') || '',
      sessionId: body.sessionId || '',
      userId: body.userId || '',
      metadata: body.metadata || {},
    };

    // Store the event (in production, send to analytics service)
    analyticsStore.push(analyticsEvent);

    // Log for development
    console.log('📊 Analytics Event:', {
      event: analyticsEvent.event,
      url: analyticsEvent.url,
      timestamp: new Date(analyticsEvent.timestamp).toISOString(),
      metadata: analyticsEvent.metadata,
    });

    // In production, you would send this to services like:
    // - Google Analytics 4
    // - Mixpanel
    // - Amplitude
    // - Custom analytics database

    // Example integrations (commented out for development):
    /*
    // Google Analytics 4
    if (process.env.GA_MEASUREMENT_ID) {
      await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${process.env.GA_MEASUREMENT_ID}&api_secret=${process.env.GA_API_SECRET}`, {
        method: 'POST',
        body: JSON.stringify({
          client_id: analyticsEvent.sessionId,
          events: [{
            name: analyticsEvent.event,
            params: analyticsEvent.metadata
          }]
        })
      });
    }

    // Mixpanel
    if (process.env.MIXPANEL_TOKEN) {
      await fetch('https://api.mixpanel.com/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.MIXPANEL_TOKEN}`
        },
        body: JSON.stringify({
          event: analyticsEvent.event,
          properties: {
            ...analyticsEvent.metadata,
            time: analyticsEvent.timestamp,
            distinct_id: analyticsEvent.userId || analyticsEvent.sessionId
          }
        })
      });
    }
    */

    return NextResponse.json({
      success: true,
      message: 'Event tracked successfully',
      eventId: analyticsStore.length,
    });
  } catch (error) {
    console.error('❌ Analytics tracking error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to track analytics event',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve analytics data (for development/debugging)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const event = url.searchParams.get('event');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    let events = analyticsStore;

    // Filter by event type if specified
    if (event) {
      events = events.filter((e) => e.event === event);
    }

    // Get recent events (most recent first)
    const recentEvents = events.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);

    return NextResponse.json({
      success: true,
      count: recentEvents.length,
      total: events.length,
      events: recentEvents,
    });
  } catch (error) {
    console.error('❌ Analytics retrieval error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve analytics data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
