// Test the enhanced competitors API
async function testCompetitorsAPI() {
  try {
    console.log('Testing competitors API...');
    
    const response = await fetch('http://localhost:3002/api/schema/competitors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://example.com',
        competitors: ['https://google.com', 'https://facebook.com']
      })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:');
    response.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });
    
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

// Test input validation
async function testValidation() {
  console.log('\n=== Testing Input Validation ===');
  
  // Test missing URL
  try {
    const response = await fetch('http://localhost:3002/api/schema/competitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ competitors: ['https://google.com'] })
    });
    console.log('Missing URL test - Status:', response.status);
    const data = await response.json();
    console.log('Missing URL test - Response:', data);
  } catch (error) {
    console.error('Error in missing URL test:', error);
  }
  
  // Test invalid competitor format
  try {
    const response = await fetch('http://localhost:3002/api/schema/competitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        url: 'https://example.com',
        competitors: 'not-an-array'
      })
    });
    console.log('Invalid competitors test - Status:', response.status);
    const data = await response.json();
    console.log('Invalid competitors test - Response:', data);
  } catch (error) {
    console.error('Error in invalid competitors test:', error);
  }
}

// Test rate limiting
async function testRateLimit() {
  console.log('\n=== Testing Rate Limiting ===');
  
  // Make two quick requests
  const requests = [
    fetch('http://localhost:3002/api/schema/competitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: 'https://example.com',
        competitors: ['https://google.com']
      })
    }),
    fetch('http://localhost:3002/api/schema/competitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: 'https://example.com',
        competitors: ['https://facebook.com']
      })
    })
  ];
  
  try {
    const responses = await Promise.all(requests);
    console.log('First request status:', responses[0].status);
    console.log('Second request status:', responses[1].status);
    
    const data2 = await responses[1].json();
    console.log('Second request response:', data2);
  } catch (error) {
    console.error('Error in rate limit test:', error);
  }
}

// Run all tests
async function runTests() {
  await testCompetitorsAPI();
  await testValidation();
  await testRateLimit();
}

runTests();