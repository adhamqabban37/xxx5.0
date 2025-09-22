const https = require('https');
const http = require('http');

function testAPIEndpoint() {
  const data = JSON.stringify({
    url: 'https://example.com'
  });

  const options = {
    hostname: 'localhost',
    port: 3002,
    path: '/api/analyze-content',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  console.log('🧪 Testing API endpoint with https://example.com...');
  console.time('API Response Time');

  const req = http.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);

    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });

    res.on('end', () => {
      console.timeEnd('API Response Time');
      
      try {
        const response = JSON.parse(body);
        console.log('\n✅ API Response Structure:');
        console.log('- URL:', response.url);
        console.log('- Title:', response.title);
        console.log('- Word Count:', response.wordCount);
        console.log('- Readability Score:', response.readabilityScore);
        console.log('- Sentiment Score:', response.sentimentScore);
        console.log('- Overall AEO Score:', response.aeoOptimization?.overallAeoScore);
        console.log('- Google AI Score:', response.aiEngineOptimization?.googleAI?.score);
        console.log('- OpenAI Score:', response.aiEngineOptimization?.openAI?.score);
        console.log('- Anthropic Score:', response.aiEngineOptimization?.anthropic?.score);
        console.log('- Perplexity Score:', response.aiEngineOptimization?.perplexity?.score);
        
        // Check if it's real data (not mock)
        const isRealData = response.wordCount > 0 && 
                          response.title && 
                          response.title !== 'Mock Title' &&
                          response.contentLength > 0;
        
        console.log('\n🔍 Data Analysis:');
        console.log('- Is Real Data:', isRealData ? '✅ YES' : '❌ NO (Still using mock data)');
        console.log('- Content Length:', response.contentLength);
        console.log('- Has Meta Description:', response.technicalSeo?.hasMetaDescription);
        console.log('- Total Images:', response.technicalSeo?.totalImages);
        console.log('- Internal Links:', response.technicalSeo?.internalLinks);
        console.log('- External Links:', response.technicalSeo?.externalLinks);
        
      } catch (error) {
        console.error('❌ Error parsing response:', error);
        console.log('Raw response:', body);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ API Request failed:', error);
  });

  req.on('timeout', () => {
    console.error('❌ API Request timed out');
    req.destroy();
  });

  req.setTimeout(30000); // 30 second timeout
  req.write(data);
  req.end();
}

// Test invalid URL handling
function testInvalidURL() {
  const data = JSON.stringify({
    url: 'invalid-url-test'
  });

  const options = {
    hostname: 'localhost',
    port: 3002,
    path: '/api/analyze-content',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  console.log('\n🧪 Testing invalid URL handling...');

  const req = http.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);

    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });

    res.on('end', () => {
      try {
        const response = JSON.parse(body);
        console.log('❌ Invalid URL Response:', response);
      } catch (error) {
        console.log('✅ Error handling working - got non-JSON response:', body);
      }
    });
  });

  req.on('error', (error) => {
    console.log('✅ Error handling working - request failed as expected:', error.message);
  });

  req.write(data);
  req.end();
}

// Run tests
console.log('🚀 Starting API Backend Validation Tests\n');
testAPIEndpoint();

setTimeout(() => {
  testInvalidURL();
}, 5000);