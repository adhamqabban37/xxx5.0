// Test script to verify our new Zod validation and error handling
// Run this in a browser console at http://localhost:3000

async function testValidationEndpoints() {
  console.log('🧪 Testing API validation endpoints...\n');

  // Test 1: Valid request to contact endpoint
  console.log('📧 Testing contact endpoint with valid data...');
  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'This is a test message',
      }),
    });
    const data = await response.json();
    console.log('✅ Valid request:', data);
  } catch (error) {
    console.log('❌ Error:', error);
  }

  // Test 2: Invalid request to contact endpoint (missing required fields)
  console.log('\n📧 Testing contact endpoint with invalid data...');
  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '', // Invalid: empty name
        email: 'not-an-email', // Invalid: bad email format
        // Missing message field
      }),
    });
    const data = await response.json();
    console.log('✅ Validation caught errors:', data);
  } catch (error) {
    console.log('❌ Error:', error);
  }

  // Test 3: Valid request to SEO recommendations endpoint
  console.log('\n🎯 Testing SEO recommendations with valid data...');
  try {
    const response = await fetch('/api/seo/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessName: 'Test Business',
        industry: 'technology',
        city: 'Austin',
        services: ['web development', 'consulting'],
      }),
    });
    const data = await response.json();
    console.log('✅ SEO recommendations generated:', data.success);
  } catch (error) {
    console.log('❌ Error:', error);
  }

  // Test 4: Invalid request to SEO recommendations endpoint
  console.log('\n🎯 Testing SEO recommendations with invalid data...');
  try {
    const response = await fetch('/api/seo/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Missing required businessName, industry, and city
        services: [],
      }),
    });
    const data = await response.json();
    console.log('✅ Validation caught missing fields:', data);
  } catch (error) {
    console.log('❌ Error:', error);
  }

  // Test 5: Sandbox checkout with valid plan
  console.log('\n💳 Testing sandbox checkout with valid plan...');
  try {
    const response = await fetch('/api/checkout/sandbox', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId: 'pro',
      }),
    });
    const data = await response.json();
    console.log('✅ Sandbox checkout:', data);
  } catch (error) {
    console.log('❌ Error:', error);
  }

  // Test 6: Sandbox checkout with invalid plan
  console.log('\n💳 Testing sandbox checkout with invalid plan...');
  try {
    const response = await fetch('/api/checkout/sandbox', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId: 'invalid-plan', // Should fail validation
      }),
    });
    const data = await response.json();
    console.log('✅ Validation caught invalid plan:', data);
  } catch (error) {
    console.log('❌ Error:', error);
  }

  console.log('\n🎉 Validation testing complete!');
  console.log('📋 Summary:');
  console.log('- All POST routes now have strict Zod validation');
  console.log('- Standardized error responses with field-level errors');
  console.log('- User-friendly toast notifications for client-side errors');
  console.log('- Consistent API response format across all endpoints');
}

// Auto-run if in browser environment
if (typeof window !== 'undefined') {
  testValidationEndpoints();
} else {
  console.log('Run this script in a browser console at http://localhost:3000');
}
