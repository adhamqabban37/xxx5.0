// Simple test for the SEO API endpoint
const testBusinessProfile = {
  businessName: 'Elite Auto Care',
  industry: 'automotive',
  services: ['car detailing', 'paint protection', 'ceramic coating'],
  city: 'Austin',
  state: 'Texas',
  description: 'Premium automotive detailing services with eco-friendly products',
  contact: {
    phone: '(512) 555-0123',
    email: 'info@eliteautocare.com',
    address: '123 Auto Way, Austin, TX 78701',
  },
};

async function testSEOAPI() {
  try {
    console.log('🚀 Testing SEO API Endpoint...\n');

    // Test POST endpoint
    const response = await fetch('http://localhost:3000/api/seo/recommendations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testBusinessProfile),
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ API Test Successful!');
      console.log('📋 Business Profile:', data.data.businessProfile.businessName);
      console.log('🎯 Generated Title:', data.data.recommendations.metaTags.title.primary);
      console.log('📝 Meta Description:', data.data.recommendations.metaTags.description.primary);
      console.log(
        '🔑 Primary Keywords Count:',
        data.data.recommendations.keywordStrategy.primary.length
      );
      console.log(
        '📍 Local Content Ideas Count:',
        data.data.recommendations.localContent.localTopics.length
      );
      console.log('⚡ Immediate Actions Count:', data.data.actionPlan.immediate.length);
    } else {
      console.error('❌ API Error:', data.error);
    }

    // Test GET demo endpoint
    console.log('\n🔍 Testing Demo Endpoint...');
    const demoResponse = await fetch('http://localhost:3000/api/seo/recommendations?demo=true');
    const demoData = await demoResponse.json();

    if (demoData.success) {
      console.log('✅ Demo Endpoint Working!');
      console.log('📋 Demo Business:', demoData.data.businessProfile.businessName);
    } else {
      console.error('❌ Demo Endpoint Error:', demoData.error);
    }
  } catch (error) {
    console.error('❌ Network Error:', error.message);
  }
}

// Only run this if we're in a browser environment
if (typeof window !== 'undefined') {
  // This will work in the browser console
  testSEOAPI();
} else {
  console.log('This script should be run in a browser console at http://localhost:3000');
}
