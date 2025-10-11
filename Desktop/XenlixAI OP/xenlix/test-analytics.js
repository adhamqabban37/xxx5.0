// Test analytics endpoint functionality
const testAnalytics = async () => {
  try {
    const response = await fetch('http://localhost:3003/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: 'analytics_test_success',
        url: 'https://moodymotorswa.com',
        metadata: {
          status: 'endpoint_working',
          feature: 'analytics_tracking',
          timestamp: new Date().toISOString(),
        },
      }),
    });

    const data = await response.json();
    console.log('✅ Analytics Test Result:', {
      status: response.status,
      success: data.success,
      message: data.message,
      eventId: data.eventId,
    });

    // Test GET endpoint to retrieve events
    const getResponse = await fetch('http://localhost:3003/api/analytics/track?limit=5');
    const analytics = await getResponse.json();
    console.log('📊 Recent Analytics Events:', {
      count: analytics.count,
      total: analytics.total,
      recentEvents: analytics.events?.slice(0, 2).map((e) => ({
        event: e.event,
        timestamp: new Date(e.timestamp).toISOString(),
        url: e.url,
      })),
    });
  } catch (error) {
    console.error('❌ Analytics Test Error:', error.message);
  }
};

testAnalytics();
