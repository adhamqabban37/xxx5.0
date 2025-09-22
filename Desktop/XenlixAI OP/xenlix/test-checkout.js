// Test script to verify checkout functionality
const testCheckout = async () => {
  try {
    // Test the checkout API endpoint
    const response = await fetch('http://localhost:3003/api/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        planId: 'free',
        email: 'test@example.com',
        phone: '+1234567890',
        companyName: 'Test Company'
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Checkout API working correctly');
      console.log('Response:', data);
      
      if (data.success && data.isFreeTrial) {
        console.log('✅ Free trial created successfully');
        console.log('Trial ends at:', data.trialEndDate);
      }
    } else {
      console.log('❌ Checkout API error');
      console.log('Error:', data);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
};

// Run the test
console.log('🧪 Testing checkout functionality...');
testCheckout();