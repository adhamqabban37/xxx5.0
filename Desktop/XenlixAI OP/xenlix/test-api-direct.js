const https = require('https');
const http = require('http');

const testAnalyzeAPI = () => {
  const data = JSON.stringify({
    url: 'https://example.com'
  });

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/dashboard/analyze',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);
    
    let responseData = '';
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      console.log('Response body:');
      try {
        const parsed = JSON.parse(responseData);
        console.log(JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log(responseData);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
  });

  req.write(data);
  req.end();
};

console.log('Testing AEO Intelligence Dashboard API...');
testAnalyzeAPI();