// Simple test script to verify our new API integrations
const { spawn } = require('child_process');

async function testEndpoint(path, options = {}) {
  const url = `http://localhost:3000${path}`;
  const method = options.method || 'GET';

  console.log(`\n🧪 Testing ${method} ${path}`);

  try {
    const fetchOptions = {
      method,
      headers: { 'Content-Type': 'application/json' },
      ...(options.body && { body: JSON.stringify(options.body) }),
    };

    const response = await fetch(url, fetchOptions);
    const data = await response.json();

    console.log(`✅ Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      console.log(`📊 Response:`, JSON.stringify(data, null, 2).slice(0, 500) + '...');
    } else {
      console.log(`❌ Error:`, data.error || data);
    }

    return { status: response.status, data };
  } catch (error) {
    console.log(`❌ Network Error:`, error.message);
    return { status: 0, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Testing XenlixAI API Integration\n');

  // Wait for server to be ready
  console.log('⏳ Waiting for server to be ready...');
  await new Promise((resolve) => setTimeout(resolve, 3000));

  const results = [];

  // 1. Test Health Endpoint
  const healthResult = await testEndpoint('/api/health');
  results.push({ name: 'Health API', ...healthResult });

  // 2. Test Maps Token Endpoint
  const mapsResult = await testEndpoint('/api/maps-token');
  results.push({ name: 'Maps Token API', ...mapsResult });

  // 3. Test Extract Endpoint
  const extractResult = await testEndpoint('/api/extract', {
    method: 'POST',
    body: { websiteUrl: 'https://google.com' },
  });
  results.push({ name: 'Extract API', ...extractResult });

  // 4. Test Unified Validation Endpoint
  const validationResult = await testEndpoint('/api/unified-validation', {
    method: 'POST',
    body: {
      websiteUrl: 'https://google.com',
      businessData: { name: 'Test Business', industry: 'Technology' },
    },
  });
  results.push({ name: 'Unified Validation API', ...validationResult });

  // Generate summary report
  console.log('\n🎯 TEST SUMMARY REPORT');
  console.log('='.repeat(50));

  results.forEach((result) => {
    const status =
      result.status === 200
        ? '✅ PASS'
        : result.status === 404
          ? '⚠️  NOT FOUND'
          : result.status === 0
            ? '❌ FAIL (Network)'
            : '❌ FAIL';

    console.log(`${status.padEnd(15)} ${result.name.padEnd(20)} (${result.status})`);
  });

  const passCount = results.filter((r) => r.status === 200).length;
  const totalCount = results.length;

  console.log('\n📈 Overall Score:', `${passCount}/${totalCount} tests passed`);

  if (passCount === totalCount) {
    console.log('🎉 All tests passed! API integration is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the logs above for details.');
  }
}

// Check if server is running
const testConnection = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/health', {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
    });
    return true;
  } catch (error) {
    console.log('❌ Server not responding. Please start the dev server with: pnpm dev');
    return false;
  }
};

// Run tests if server is available
testConnection().then((isServerRunning) => {
  if (isServerRunning) {
    runTests();
  } else {
    process.exit(1);
  }
});
