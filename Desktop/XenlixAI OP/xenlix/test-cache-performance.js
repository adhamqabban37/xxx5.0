/**
 * Redis Cache Performance Test
 * Tests cache hit/miss performance and shows metrics
 */

const testUrl1 = 'https://example.com';
const testUrl2 = 'https://google.com';

async function testCachePerformance() {
  console.log('🧪 Testing Redis Cache Performance...\n');

  try {
    // Test 1: First request (should be a MISS)
    console.log('📡 Test 1: First request to /api/crawl (cache MISS expected)');
    const start1 = Date.now();
    
    const response1 = await fetch('http://localhost:3000/api/crawl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: testUrl1,
        options: { scanType: 'basic' }
      })
    });
    
    const end1 = Date.now();
    const data1 = await response1.json();
    
    console.log(`⏱️  Response Time: ${end1 - start1}ms`);
    console.log(`🎯 Cache Hit: ${data1.cacheHit || false}`);
    console.log(`📊 Metrics:`, data1.metrics || 'No metrics available');
    console.log('');

    // Test 2: Same request (should be a HIT)
    console.log('📡 Test 2: Repeat request to /api/crawl (cache HIT expected)');
    const start2 = Date.now();
    
    const response2 = await fetch('http://localhost:3000/api/crawl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: testUrl1,
        options: { scanType: 'basic' }
      })
    });
    
    const end2 = Date.now();
    const data2 = await response2.json();
    
    console.log(`⏱️  Response Time: ${end2 - start2}ms`);
    console.log(`🎯 Cache Hit: ${data2.cacheHit || false}`);
    console.log(`📊 Metrics:`, data2.metrics || 'No metrics available');
    
    // Performance comparison
    const speedImprovement = Math.round(((end1 - start1) / (end2 - start2)) * 100) / 100;
    console.log(`\n🚀 Speed Improvement: ${speedImprovement}x faster with cache`);

    // Test 3: Different URL (should be a MISS)
    console.log('\n📡 Test 3: Different URL request (cache MISS expected)');
    const start3 = Date.now();
    
    const response3 = await fetch('http://localhost:3000/api/crawl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: testUrl2,
        options: { scanType: 'basic' }
      })
    });
    
    const end3 = Date.now();
    const data3 = await response3.json();
    
    console.log(`⏱️  Response Time: ${end3 - start3}ms`);
    console.log(`🎯 Cache Hit: ${data3.cacheHit || false}`);
    console.log(`📊 Final Metrics:`, data3.metrics || 'No metrics available');

    // Health check
    console.log('\n🏥 Health Check:');
    const healthResponse = await fetch('http://localhost:3000/api/health');
    const healthData = await healthResponse.json();
    
    if (healthData.services?.redis) {
      console.log(`✅ Redis Status: ${healthData.services.redis.status}`);
      console.log(`🔗 Redis Connected: ${healthData.services.redis.connected}`);
    }
    
    if (healthData.services?.cache) {
      console.log(`📈 Cache Hit Rate: ${healthData.services.cache.hitRate}`);
      console.log(`📊 Total Requests: ${healthData.services.cache.totalRequests}`);
      console.log(`🎯 Cache Hits: ${healthData.services.cache.hits}`);
      console.log(`❌ Cache Misses: ${healthData.services.cache.misses}`);
      console.log(`🧠 Memory Cache Size: ${healthData.services.cache.memoryCacheSize}`);
      console.log(`⚡ Avg Response Time: ${healthData.services.cache.avgResponseTime}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testCachePerformance().then(() => {
  console.log('\n✅ Cache performance test completed!');
}).catch(error => {
  console.error('❌ Test suite failed:', error);
});