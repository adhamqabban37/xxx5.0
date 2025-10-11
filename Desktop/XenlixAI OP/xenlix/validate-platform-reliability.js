#!/usr/bin/env node

/**
 * Platform Reliability Validation Script
 * Tests redirect rules, validates routes, and simulates crawl behavior
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_ROUTES = [
  // Core routes that should exist
  '/',
  '/calculators',
  '/calculators/roi',
  '/calculators/pricing',
  '/tools/json-ld',
  '/aeo',
  '/seo/audit',
  '/plans',
  '/contact',
  '/case-studies',
  '/dallas',
  '/aeo-scan',
  '/seo-analyzer',
  '/schema-generator',

  // Routes that should redirect (legacy paths)
  '/roi', // → /calculators/roi
  '/pricing', // → /calculators/pricing
  '/calculator', // → /calculators
  '/tools/schema', // → /tools/json-ld
  '/json-ld', // → /tools/json-ld
  '/audit', // → /seo/audit
  '/scan', // → /aeo
  '/contact-us', // → /contact
  '/register', // → /signup
  '/login', // → /signin

  // Routes that should 404 (test 404 page)
  '/nonexistent-page',
  '/old/broken/link',
  '/missing-tool',
];

// Expected redirects mapping
const EXPECTED_REDIRECTS = {
  '/roi': '/calculators/roi',
  '/pricing': '/calculators/pricing',
  '/calculator': '/calculators',
  '/tools/schema': '/tools/json-ld',
  '/tools/schema-generator': '/tools/json-ld',
  '/json-ld': '/tools/json-ld',
  '/schema': '/tools/json-ld',
  '/audit': '/seo/audit',
  '/seo-audit': '/seo/audit',
  '/aeo-audit': '/aeo',
  '/scan': '/aeo',
  '/contact-us': '/contact',
  '/get-started': '/signup',
  '/register': '/signup',
  '/login': '/signin',
  '/local-seo': '/dallas',
  '/texas-seo': '/dallas',
};

class ValidationResults {
  constructor() {
    this.results = {
      totalTests: 0,
      passed: 0,
      failed: 0,
      redirects: [],
      errors: [],
      warnings: [],
    };
  }

  addTest(test, status, message) {
    this.results.totalTests++;
    if (status === 'PASS') {
      this.results.passed++;
    } else {
      this.results.failed++;
      this.results.errors.push({ test, message });
    }
    console.log(`${status === 'PASS' ? '✅' : '❌'} ${test}: ${message}`);
  }

  addRedirect(from, to, status) {
    this.results.redirects.push({ from, to, status });
    console.log(`🔄 REDIRECT: ${from} → ${to} (${status})`);
  }

  addWarning(message) {
    this.results.warnings.push(message);
    console.log(`⚠️  WARNING: ${message}`);
  }

  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('🔍 PLATFORM RELIABILITY VALIDATION REPORT');
    console.log('='.repeat(80));

    console.log(`\n📊 TEST SUMMARY`);
    console.log(`Total Tests: ${this.results.totalTests}`);
    console.log(`Passed: ${this.results.passed} ✅`);
    console.log(`Failed: ${this.results.failed} ❌`);
    console.log(
      `Success Rate: ${((this.results.passed / this.results.totalTests) * 100).toFixed(1)}%`
    );

    if (this.results.redirects.length > 0) {
      console.log(`\n🔄 REDIRECTS TESTED: ${this.results.redirects.length}`);
      this.results.redirects.forEach((redirect) => {
        console.log(`   ${redirect.from} → ${redirect.to} (${redirect.status})`);
      });
    }

    if (this.results.errors.length > 0) {
      console.log(`\n❌ FAILURES:`);
      this.results.errors.forEach((error) => {
        console.log(`   ${error.test}: ${error.message}`);
      });
    }

    if (this.results.warnings.length > 0) {
      console.log(`\n⚠️  WARNINGS:`);
      this.results.warnings.forEach((warning) => {
        console.log(`   ${warning}`);
      });
    }

    const allPassed = this.results.failed === 0;
    console.log(`\n🎯 PLATFORM READY: ${allPassed ? 'YES ✅' : 'NO ❌'}`);

    if (allPassed) {
      console.log('All tests passed! Platform reliability validated.');
    } else {
      console.log('Some tests failed. Review errors above before deployment.');
    }

    // Save detailed report
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: this.results.totalTests,
        passed: this.results.passed,
        failed: this.results.failed,
        successRate: ((this.results.passed / this.results.totalTests) * 100).toFixed(1),
      },
      redirects: this.results.redirects,
      errors: this.results.errors,
      warnings: this.results.warnings,
      platformReady: allPassed,
    };

    fs.writeFileSync('platform-validation-report.json', JSON.stringify(reportData, null, 2));
    console.log('\n📄 Detailed report saved to: platform-validation-report.json');
  }
}

async function testRoute(url, expectedStatus = 200, expectedRedirect = null) {
  return new Promise((resolve) => {
    const curl = spawn('curl', [
      '-s',
      '-o',
      '/dev/null',
      '-w',
      '%{http_code}:%{redirect_url}',
      '--max-redirs',
      '0',
      url,
    ]);

    let output = '';
    curl.stdout.on('data', (data) => {
      output += data.toString();
    });

    curl.on('close', () => {
      const [statusCode, redirectUrl] = output.trim().split(':');
      resolve({
        status: parseInt(statusCode),
        redirectUrl: redirectUrl || null,
        url,
      });
    });

    curl.on('error', () => {
      resolve({ status: 0, error: 'Connection failed', url });
    });
  });
}

async function validateFileStructure() {
  console.log('🔍 Validating file structure...\n');

  const criticalFiles = [
    'src/app/not-found.tsx',
    'src/app/calculators/page.tsx',
    'src/app/calculators/roi/page.tsx',
    'src/app/calculators/pricing/page.tsx',
    'src/app/tools/json-ld/page.tsx',
    'middleware.ts',
  ];

  const results = new ValidationResults();

  for (const file of criticalFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      results.addTest(`File Check: ${file}`, 'PASS', 'File exists');
    } else {
      results.addTest(`File Check: ${file}`, 'FAIL', 'File missing');
    }
  }

  return results;
}

async function main() {
  console.log('🚀 Starting Platform Reliability Validation...\n');

  // Step 1: Validate file structure
  const fileResults = await validateFileStructure();

  // Check if server is running
  console.log('\n🌐 Testing server connection...\n');
  const serverTest = await testRoute(BASE_URL);

  if (serverTest.status === 0) {
    console.log('❌ Server not running. Please start the development server:');
    console.log('   npm run dev');
    console.log('\nThen run this script again.');
    return;
  }

  fileResults.addTest('Server Connection', 'PASS', `Server responding (${serverTest.status})`);

  console.log('\n🔗 Testing routes and redirects...\n');

  // Test all routes
  for (const route of TEST_ROUTES) {
    const url = `${BASE_URL}${route}`;
    const result = await testRoute(url);

    // Check if this route should redirect
    const expectedRedirect = EXPECTED_REDIRECTS[route];

    if (expectedRedirect) {
      // This should be a redirect
      if (result.status === 301 || result.status === 302) {
        const redirectTarget = result.redirectUrl || 'unknown';
        const expectedTarget = `${BASE_URL}${expectedRedirect}`;

        if (redirectTarget === expectedTarget) {
          fileResults.addTest(
            `Redirect: ${route}`,
            'PASS',
            `Correctly redirects to ${expectedRedirect}`
          );
          fileResults.addRedirect(route, expectedRedirect, 'CORRECT');
        } else {
          fileResults.addTest(
            `Redirect: ${route}`,
            'FAIL',
            `Expected redirect to ${expectedRedirect}, got ${redirectTarget}`
          );
          fileResults.addRedirect(route, redirectTarget, 'INCORRECT');
        }
      } else {
        fileResults.addTest(
          `Redirect: ${route}`,
          'FAIL',
          `Expected redirect (301/302), got ${result.status}`
        );
      }
    } else {
      // This should be a direct page
      if (result.status === 200) {
        fileResults.addTest(`Route: ${route}`, 'PASS', 'Page loads successfully');
      } else if (result.status === 404) {
        if (
          route.startsWith('/nonexistent') ||
          route.includes('broken') ||
          route.includes('missing')
        ) {
          fileResults.addTest(`404 Test: ${route}`, 'PASS', '404 page should display');
        } else {
          fileResults.addTest(`Route: ${route}`, 'FAIL', `Unexpected 404 for valid route`);
        }
      } else {
        fileResults.addTest(`Route: ${route}`, 'FAIL', `Unexpected status: ${result.status}`);
      }
    }
  }

  // Generate final report
  fileResults.generateReport();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, ValidationResults };
