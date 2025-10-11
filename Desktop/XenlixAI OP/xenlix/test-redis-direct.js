/**
 * Simple Redis Test - Direct Connection
 * Tests Redis connection without Next.js complexity
 */

const Redis = require('ioredis');

async function testRedisDirectly() {
  console.log('🔍 Testing Redis Connection Directly...\n');

  let redis = null;

  try {
    // Create Redis connection
    redis = new Redis({
      host: 'localhost',
      port: 6379,
      maxRetriesPerRequest: 3,
      connectTimeout: 10000,
      lazyConnect: true,
    });

    // Test connection
    console.log('📡 Connecting to Redis...');
    await redis.ping();
    console.log('✅ Redis PING successful');

    // Test basic operations
    console.log('\n📝 Testing basic SET/GET operations...');

    // Set a test value
    const setStart = Date.now();
    await redis.set(
      'test:key1',
      JSON.stringify({ message: 'Hello Redis!', timestamp: new Date() }),
      'EX',
      60
    );
    const setTime = Date.now() - setStart;
    console.log(`✅ SET operation: ${setTime}ms`);

    // Get the value back
    const getStart = Date.now();
    const value = await redis.get('test:key1');
    const getTime = Date.now() - getStart;
    console.log(`✅ GET operation: ${getTime}ms`);

    if (value) {
      const parsed = JSON.parse(value);
      console.log('📄 Retrieved data:', parsed);
    }

    // Test cache key generation pattern
    console.log('\n🔑 Testing cache key patterns...');
    const url = 'https://example.com';
    const params = { scanType: 'basic' };
    const cacheKey = `crawl:${Buffer.from(url).toString('base64').slice(0, 20)}:${Buffer.from(JSON.stringify(params)).toString('base64').slice(0, 10)}`;

    await redis.set(
      cacheKey,
      JSON.stringify({
        url,
        cached: true,
        timestamp: new Date(),
        data: { title: 'Test Page', content: 'Sample content' },
      }),
      'EX',
      3600
    );

    console.log(`✅ Cached with key: ${cacheKey}`);

    // Retrieve cached data
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      console.log('✅ Cache retrieval successful');
      const parsed = JSON.parse(cachedData);
      console.log('📄 Cached data preview:', { url: parsed.url, cached: parsed.cached });
    }

    // Get Redis info
    console.log('\n📊 Redis Information:');
    const info = await redis.info('memory');
    const memoryLines = info
      .split('\r\n')
      .filter(
        (line) =>
          line.includes('used_memory_human') ||
          line.includes('used_memory_peak_human') ||
          line.includes('connected_clients')
      );

    memoryLines.forEach((line) => {
      console.log(`📈 ${line}`);
    });

    console.log('\n🎉 Redis is working perfectly!');
  } catch (error) {
    console.error('❌ Redis test failed:', error.message);

    // Provide troubleshooting info
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check if Redis container is running: docker ps | grep redis');
    console.log('2. Check Redis logs: docker logs aeo-redis');
    console.log('3. Test Redis directly: docker exec aeo-redis redis-cli ping');
  } finally {
    if (redis) {
      await redis.quit();
      console.log('\n👋 Redis connection closed');
    }
  }
}

// Run the test
testRedisDirectly();
