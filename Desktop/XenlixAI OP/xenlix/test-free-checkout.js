// Test free trial checkout
async function testFreeCheckout() {
  console.log('🧪 Testing free trial checkout...');

  try {
    const response = await fetch('http://localhost:3003/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        planId: 'free',
        customerInfo: {
          email: 'test@example.com',
          name: 'Test User',
          company: 'Test Company',
          phone: '+1234567890',
        },
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Free trial checkout successful!');
      console.log('Response:', JSON.stringify(data, null, 2));

      if (data.url) {
        console.log('✅ Redirect URL generated:', data.url);
      }

      if (data.isFreeTrial) {
        console.log('✅ Free trial flag confirmed');
      }

      if (data.trialEndDate) {
        console.log('✅ Trial end date:', data.trialEndDate);
      }
    } else {
      console.log('❌ Checkout failed');
      console.log('Error:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

testFreeCheckout();
