// Test script for the unified AEO validation system
const testValidation = async () => {
  const testPayload = {
    websiteUrl: 'https://example.com',
    businessName: 'Test Business',
    businessType: 'Technology',
  };

  try {
    console.log('Testing AEO validation API...');

    const response = await fetch('http://localhost:3000/api/unified-validation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Validation successful!');
    console.log('Validation ID:', result.data.id);
    console.log('Overall Score:', result.data.overallScore);
    console.log('Issues Found:', result.data.issueCount);
    console.log('Payment Status:', result.data.paymentStatus);

    return result.data;
  } catch (error) {
    console.error('Validation failed:', error);
    return null;
  }
};

// Run the test
testValidation().then((result) => {
  if (result) {
    console.log('\n✅ AEO Validation System Test: PASSED');
    console.log(`🔗 View results at: http://localhost:3000/aeo-validation/${result.id}`);
  } else {
    console.log('\n❌ AEO Validation System Test: FAILED');
  }
});
