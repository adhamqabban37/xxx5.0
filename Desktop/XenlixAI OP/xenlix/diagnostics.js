// SendU Plugin Connectivity Diagnostic Tool
// This script checks all service connections and identifies issues

const diagnostics = {
  server: { url: 'http://localhost:3000', name: 'Next.js Server' },
  health: { url: 'http://localhost:3000/api/health', name: 'Health API' },
  huggingface: { url: 'http://localhost:3000/api/test-hf', name: 'HuggingFace Service' },
  crawl4ai: { url: 'http://localhost:8001/health', name: 'Crawl4AI External Service' },
  crawl4ai_api: { url: 'http://localhost:3000/api/crawl', name: 'Crawl4AI API Endpoint' },
};

async function checkConnectivity(service) {
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(service.url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'SendU-Diagnostics/1.0',
      },
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    if (response.ok) {
      const data = await response.json();
      return {
        status: 'SUCCESS',
        code: response.status,
        responseTime: `${responseTime}ms`,
        data: data,
      };
    } else {
      return {
        status: 'HTTP_ERROR',
        code: response.status,
        responseTime: `${responseTime}ms`,
        error: `HTTP ${response.status}`,
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;

    if (error.name === 'AbortError') {
      return {
        status: 'TIMEOUT',
        responseTime: `${responseTime}ms (timeout)`,
        error: 'Request timed out after 5 seconds',
      };
    } else if (error.message.includes('ECONNREFUSED') || error.message.includes('refused')) {
      return {
        status: 'CONNECTION_REFUSED',
        responseTime: `${responseTime}ms`,
        error: 'Connection refused - service not running',
      };
    } else {
      return {
        status: 'NETWORK_ERROR',
        responseTime: `${responseTime}ms`,
        error: error.message,
      };
    }
  }
}

async function runDiagnostics() {
  console.log('🔍 SendU Plugin Connectivity Diagnostics');
  console.log('='.repeat(50));
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  const results = {};

  for (const [key, service] of Object.entries(diagnostics)) {
    console.log(`Testing ${service.name}...`);

    const result = await checkConnectivity(service);
    results[key] = result;

    // Format output based on status
    const statusIcon =
      {
        SUCCESS: '✅',
        HTTP_ERROR: '⚠️',
        TIMEOUT: '⏱️',
        CONNECTION_REFUSED: '❌',
        NETWORK_ERROR: '🔴',
      }[result.status] || '❓';

    console.log(`${statusIcon} ${service.name}: ${result.status}`);
    console.log(`   URL: ${service.url}`);
    console.log(`   Response Time: ${result.responseTime}`);

    if (result.code) {
      console.log(`   HTTP Code: ${result.code}`);
    }

    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }

    if (result.data && result.data.services) {
      console.log(`   Services Status:`);
      for (const [svcName, svcStatus] of Object.entries(result.data.services)) {
        const svcIcon = svcStatus.status === 'healthy' ? '✅' : '❌';
        console.log(`     ${svcIcon} ${svcName}: ${svcStatus.status}`);
      }
    }

    console.log('');
  }

  // Summary
  console.log('📊 DIAGNOSTIC SUMMARY');
  console.log('='.repeat(50));

  const successful = Object.values(results).filter((r) => r.status === 'SUCCESS').length;
  const total = Object.values(results).length;

  console.log(`Overall Status: ${successful}/${total} services responding`);

  // Identify issues
  const issues = [];

  if (results.server?.status !== 'SUCCESS') {
    issues.push('🔴 CRITICAL: Next.js server not accessible');
  }

  if (results.health?.status !== 'SUCCESS') {
    issues.push('🔴 CRITICAL: Health API not responding');
  }

  if (results.huggingface?.status !== 'SUCCESS') {
    issues.push('⚠️ WARNING: HuggingFace service issues');
  }

  if (results.crawl4ai?.status !== 'SUCCESS') {
    issues.push('ℹ️ INFO: External Crawl4AI service not running (fallback available)');
  }

  if (results.crawl4ai_api?.status !== 'SUCCESS') {
    issues.push('⚠️ WARNING: Crawl4AI API endpoint issues');
  }

  if (issues.length > 0) {
    console.log('\n🚨 IDENTIFIED ISSUES:');
    issues.forEach((issue) => console.log(`   ${issue}`));
  } else {
    console.log('\n🎉 ALL SERVICES HEALTHY!');
  }

  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');

  if (results.server?.status !== 'SUCCESS') {
    console.log('   • Start Next.js server: npm run dev');
  }

  if (results.crawl4ai?.status !== 'SUCCESS') {
    console.log('   • External Crawl4AI service not needed (local fallback works)');
  }

  if (
    results.huggingface?.status === 'SUCCESS' &&
    results.huggingface?.data?.modelInfo?.model?.includes('development')
  ) {
    console.log('   • Add real HuggingFace API token for production features');
  }

  console.log('   • Monitor health endpoint: http://localhost:3000/api/health');

  return results;
}

// Run diagnostics
runDiagnostics()
  .then((results) => {
    console.log('\n✅ Diagnostics completed');
  })
  .catch((error) => {
    console.error('❌ Diagnostic failed:', error);
  });
