const axios = require('axios');

async function testAPI() {
  console.log('=== Testing API Debug ===');

  try {
    console.log('Making request to http://localhost:3002/api/analyze-content...');

    const response = await axios.post(
      'http://localhost:3002/api/analyze-content',
      {
        url: 'https://example.com',
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
      }
    );

    console.log('Response status:', response.status);
    console.log('Response data keys:', Object.keys(response.data));
    console.log('AEO Score:', response.data.aeoOptimization?.overallAeoScore);
    console.log('=== API Test Success ===');
  } catch (error) {
    console.error('=== API Test Error ===');
    console.error('Error message:', error.message);
    console.error('Error type:', error.constructor.name);

    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received');
      console.error('Request details:', error.request._options || 'No details');
    } else {
      console.error('Request setup error');
    }

    console.error('Error code:', error.code);
  }
}

testAPI();
