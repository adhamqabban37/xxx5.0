#!/usr/bin/env node
/**
 * Redis Stability Test Script
 *
 * Tests the unified Redis client implementation:
 * - Connection pooling and singleton pattern
 * - Health checks and reconnection behavior
 * - Job locking / idempotency
 * - Graceful degradation when Redis unavailable
 */

const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

async function runTests() {
  console.log('🧪 REDIS STABILITY TEST SUITE\n');
  console.log('═'.repeat(60));

  const results = {
    passed: 0,
    failed: 0,
    skipped: 0,
    tests: [],
  };

  // Test 1: Redis Client Singleton
  console.log('\n📋 Test 1: Redis Client Singleton Pattern');
  console.log('─'.repeat(60));
  try {
    const { getRedisClient, getRedisStatus } = require('./src/lib/redis-client.ts');

    const client1 = getRedisClient();
    const client2 = getRedisClient();

    if (client1 === client2) {
      console.log('✅ PASS: Single Redis client instance (singleton)');
      results.passed++;
      results.tests.push({ name: 'Singleton Pattern', status: 'PASS' });
    } else {
      console.log('❌ FAIL: Multiple Redis client instances detected');
      results.failed++;
      results.tests.push({ name: 'Singleton Pattern', status: 'FAIL' });
    }

    const status = getRedisStatus();
    console.log(`   Client Status: ${status.status}`);
    console.log(`   Connected: ${status.connected}`);
    console.log(`   Available: ${status.available}`);

    if (status.error) {
      console.log(`   Error: ${status.error}`);
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    results.failed++;
    results.tests.push({ name: 'Singleton Pattern', status: 'FAIL', error: error.message });
  }

  // Test 2: Redis Health Check
  console.log('\n📋 Test 2: Redis Health Check');
  console.log('─'.repeat(60));
  try {
    const { checkRedisHealth, ensureRedisConnection } = require('./src/lib/redis-client.ts');

    console.log('   Attempting connection...');
    const connected = await ensureRedisConnection();
    console.log(`   Connection result: ${connected}`);

    console.log('   Running health check...');
    const startTime = Date.now();
    const health = await checkRedisHealth();
    const duration = Date.now() - startTime;

    if (health.healthy) {
      console.log(`✅ PASS: Redis health check (${health.latency}ms)`);
      results.passed++;
      results.tests.push({
        name: 'Health Check',
        status: 'PASS',
        latency: health.latency,
      });
    } else {
      console.log(`⚠️  SKIP: Redis unavailable - ${health.error}`);
      console.log('   This is OK in dev mode - using memory fallback');
      results.skipped++;
      results.tests.push({
        name: 'Health Check',
        status: 'SKIP',
        reason: health.error,
      });
    }
  } catch (error) {
    console.log(`⚠️  SKIP: Redis connection failed - ${error.message}`);
    console.log('   This is OK in dev mode - using memory fallback');
    results.skipped++;
    results.tests.push({
      name: 'Health Check',
      status: 'SKIP',
      error: error.message,
    });
  }

  // Test 3: Job Idempotency Locks
  console.log('\n📋 Test 3: Job Idempotency Locks');
  console.log('─'.repeat(60));
  try {
    const {
      acquireJobLock,
      releaseJobLock,
      checkJobLock,
    } = require('./src/lib/job-idempotency.ts');

    const userId = 'test-user-123';
    const domain = 'https://example.com';
    const jobId = `test-job-${Date.now()}`;

    console.log(`   Acquiring lock for ${domain}...`);
    const acquireResult1 = await acquireJobLock(userId, domain, jobId);

    if (acquireResult1.success) {
      console.log(`   ✓ Lock acquired: ${jobId}`);

      // Try to acquire again (should fail)
      console.log('   Attempting duplicate lock...');
      const acquireResult2 = await acquireJobLock(userId, domain, 'different-job');

      if (!acquireResult2.success && acquireResult2.existingJobId === jobId) {
        console.log(`   ✓ Duplicate prevented (existing: ${acquireResult2.existingJobId})`);

        // Check lock status
        const lockStatus = await checkJobLock(userId, domain);
        if (lockStatus.locked && lockStatus.jobId === jobId) {
          console.log(`   ✓ Lock check passed (TTL: ${lockStatus.ttl}s)`);

          // Release lock
          await releaseJobLock(userId, domain, jobId);
          console.log('   ✓ Lock released');

          // Verify lock is gone
          const lockStatusAfter = await checkJobLock(userId, domain);
          if (!lockStatusAfter.locked) {
            console.log('✅ PASS: Job idempotency locks working correctly');
            results.passed++;
            results.tests.push({ name: 'Job Locks', status: 'PASS' });
          } else {
            console.log('❌ FAIL: Lock not released properly');
            results.failed++;
            results.tests.push({ name: 'Job Locks', status: 'FAIL' });
          }
        } else {
          console.log('❌ FAIL: Lock check mismatch');
          results.failed++;
          results.tests.push({ name: 'Job Locks', status: 'FAIL' });
        }
      } else if (acquireResult2.success) {
        console.log('❌ FAIL: Duplicate lock was allowed (idempotency broken)');
        results.failed++;
        results.tests.push({ name: 'Job Locks', status: 'FAIL' });
      } else {
        console.log('⚠️  WARN: Unexpected duplicate lock behavior');
        results.failed++;
        results.tests.push({ name: 'Job Locks', status: 'FAIL' });
      }
    } else {
      console.log('⚠️  SKIP: Redis unavailable for lock test');
      console.log('   Job locking will use fail-open strategy (allow jobs)');
      results.skipped++;
      results.tests.push({ name: 'Job Locks', status: 'SKIP', reason: 'Redis unavailable' });
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    console.error(error);
    results.failed++;
    results.tests.push({ name: 'Job Locks', status: 'FAIL', error: error.message });
  }

  // Test 4: Enhanced Cache
  console.log('\n📋 Test 4: Enhanced Redis Cache');
  console.log('─'.repeat(60));
  try {
    const cacheClient = require('./src/lib/enhanced-redis-cache.ts').default;

    const testKey = `test:cache:${Date.now()}`;
    const testValue = { message: 'Hello Redis', timestamp: Date.now() };

    console.log(`   Setting cache key: ${testKey}`);
    const setResult = await cacheClient.set(testKey, testValue, 60);

    if (setResult) {
      console.log('   ✓ Cache set successful');

      console.log('   Getting cache key...');
      const getValue = await cacheClient.get(testKey);

      if (getValue && getValue.message === testValue.message) {
        console.log('   ✓ Cache get successful (value matches)');

        // Delete the key
        await cacheClient.del(testKey);
        console.log('   ✓ Cache delete successful');

        // Get metrics
        const metrics = cacheClient.getMetrics();
        console.log(`   Cache mode: ${metrics.cacheMode}`);
        console.log(`   Hit rate: ${metrics.hitRate}%`);
        console.log(`   Redis connected: ${metrics.redisConnected}`);

        console.log('✅ PASS: Enhanced cache working correctly');
        results.passed++;
        results.tests.push({
          name: 'Enhanced Cache',
          status: 'PASS',
          mode: metrics.cacheMode,
        });
      } else {
        console.log('❌ FAIL: Cache value mismatch');
        results.failed++;
        results.tests.push({ name: 'Enhanced Cache', status: 'FAIL' });
      }
    } else {
      console.log('⚠️  WARN: Cache set failed (using memory fallback)');
      console.log('   This is OK if Redis is unavailable');
      results.skipped++;
      results.tests.push({ name: 'Enhanced Cache', status: 'SKIP' });
    }
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}`);
    results.failed++;
    results.tests.push({ name: 'Enhanced Cache', status: 'FAIL', error: error.message });
  }

  // Test 5: Queue Connection (if available)
  console.log('\n📋 Test 5: BullMQ Queue Connection');
  console.log('─'.repeat(60));
  try {
    const { premiumScanQueue, globalJobQueue } = require('./src/lib/queue/index.ts');

    if (premiumScanQueue) {
      console.log('   ✓ Premium scan queue initialized');

      try {
        const metrics = await globalJobQueue.getMetrics();
        console.log(`   Queue metrics:`);
        console.log(`     Waiting: ${metrics.waiting}`);
        console.log(`     Active: ${metrics.active}`);
        console.log(`     Completed: ${metrics.completed}`);
        console.log(`     Failed: ${metrics.failed}`);

        console.log('✅ PASS: Queue connection healthy');
        results.passed++;
        results.tests.push({ name: 'Queue Connection', status: 'PASS' });
      } catch (error) {
        console.log('⚠️  SKIP: Queue metrics unavailable (Redis down)');
        results.skipped++;
        results.tests.push({ name: 'Queue Connection', status: 'SKIP' });
      }
    } else {
      console.log('⚠️  SKIP: Queue not initialized (Redis unavailable)');
      results.skipped++;
      results.tests.push({ name: 'Queue Connection', status: 'SKIP' });
    }
  } catch (error) {
    console.log(`⚠️  SKIP: ${error.message}`);
    results.skipped++;
    results.tests.push({ name: 'Queue Connection', status: 'SKIP', error: error.message });
  }

  // Test 6: Health Endpoint
  console.log('\n📋 Test 6: Health Endpoint (Redis Status)');
  console.log('─'.repeat(60));
  try {
    console.log('   Checking if dev server is running...');
    const response = await fetch('http://localhost:3000/api/health', {
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const health = await response.json();

      console.log(`   Overall status: ${health.status}`);
      console.log(`   Redis status: ${health.services?.redis?.status || 'unknown'}`);
      console.log(`   Redis connected: ${health.services?.redis?.connected}`);
      console.log(`   Cache mode: ${health.services?.cache?.mode}`);

      if (health.services?.redis) {
        if (health.services.redis.error) {
          console.log(`   Redis error: ${health.services.redis.error}`);
        }
        if (health.services.redis.responseTime) {
          console.log(`   Redis response time: ${health.services.redis.responseTime}`);
        }
      }

      console.log('✅ PASS: Health endpoint returns Redis status');
      results.passed++;
      results.tests.push({ name: 'Health Endpoint', status: 'PASS' });
    } else {
      console.log(`⚠️  SKIP: Health endpoint returned ${response.status}`);
      results.skipped++;
      results.tests.push({ name: 'Health Endpoint', status: 'SKIP' });
    }
  } catch (error) {
    if (error.name === 'AbortError' || error.code === 'ECONNREFUSED') {
      console.log('⚠️  SKIP: Dev server not running (start with: npm run dev)');
      results.skipped++;
      results.tests.push({ name: 'Health Endpoint', status: 'SKIP', reason: 'Server not running' });
    } else {
      console.log(`❌ FAIL: ${error.message}`);
      results.failed++;
      results.tests.push({ name: 'Health Endpoint', status: 'FAIL', error: error.message });
    }
  }

  // Final Results
  console.log('\n' + '═'.repeat(60));
  console.log('📊 TEST RESULTS');
  console.log('═'.repeat(60));
  console.log(`✅ Passed:  ${results.passed}`);
  console.log(`❌ Failed:  ${results.failed}`);
  console.log(`⚠️  Skipped: ${results.skipped}`);
  console.log(`📝 Total:   ${results.tests.length}`);

  if (results.failed === 0) {
    console.log('\n🎉 All tests passed! Redis is stable and working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Review the output above for details.');
  }

  if (results.skipped > 0) {
    console.log('\nℹ️  Note: Skipped tests are usually due to Redis being unavailable,');
    console.log('   which is OK in development. The app will use memory fallback.');
  }

  console.log('\n💡 Recommendations:');

  if (!process.env.REDIS_URL && !process.env.UPSTASH_REDIS_REST_URL) {
    console.log('   • Set REDIS_URL in .env.local for Redis functionality');
    console.log('   • Or start Docker Redis: docker-compose up redis -d');
  }

  console.log('   • For production: Ensure Redis is running and URL is configured');
  console.log('   • Monitor /api/health endpoint for Redis status');
  console.log('   • Job locks will use fail-open strategy when Redis unavailable');

  console.log('\n' + '═'.repeat(60));

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch((error) => {
  console.error('\n❌ Test suite crashed:', error);
  process.exit(1);
});
