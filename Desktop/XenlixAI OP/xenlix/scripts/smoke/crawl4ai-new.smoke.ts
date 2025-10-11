/**
 * Crawl4AI Service Smoke Test
 * Tests direct connectivity to the FastAPI service
 */

async function main() {
  console.log('🔍 Testing Crawl4AI Service...');

  const baseUrl = 'http://localhost:8001';
  let passed = 0;
  let failed = 0;

  // Test 1: Health Check
  try {
    console.log('\n1️⃣ Testing health endpoint...');
    const response = await fetch(`${baseUrl}/health`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Health response:', JSON.stringify(data, null, 2));

    if (data.status === 'ok') {
      console.log('✅ Health check passed');
      passed++;
    } else {
      throw new Error(`Expected status 'ok', got '${data.status}'`);
    }
  } catch (error) {
    console.log(
      `❌ Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    failed++;
  }

  // Test 2: Crawl Endpoint
  try {
    console.log('\n2️⃣ Testing crawl endpoint...');
    const testUrl = 'https://example.com';
    const response = await fetch(`${baseUrl}/crawl?url=${encodeURIComponent(testUrl)}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Crawl response:', JSON.stringify(data, null, 2));

    if (data.ok === true && data.url === testUrl) {
      console.log('✅ Crawl test passed');
      passed++;
    } else {
      throw new Error(
        `Expected ok=true and url='${testUrl}', got ok=${data.ok} and url='${data.url}'`
      );
    }
  } catch (error) {
    console.log(
      `❌ Crawl test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    failed++;
  }

  // Test 3: Invalid URL handling
  try {
    console.log('\n3️⃣ Testing invalid URL handling...');
    const response = await fetch(`${baseUrl}/crawl?url=invalid-url`);

    if (response.status === 400) {
      console.log('✅ Invalid URL correctly rejected (400)');
      passed++;
    } else {
      throw new Error(`Expected 400 status, got ${response.status}`);
    }
  } catch (error) {
    console.log(
      `❌ Invalid URL test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    failed++;
  }

  // Results
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);

  if (failed === 0) {
    console.log('🎉 All Crawl4AI smoke tests passed!');
    process.exit(0);
  } else {
    console.log('💥 Some Crawl4AI smoke tests failed!');
    process.exit(1);
  }
}

// Handle fetch errors gracefully
if (typeof fetch === 'undefined') {
  console.log('❌ fetch is not available. Run with Node.js 18+ or install node-fetch');
  process.exit(1);
}

main().catch((error) => {
  console.log(`💥 Smoke test crashed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  process.exit(1);
});
