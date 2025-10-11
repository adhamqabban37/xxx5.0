#!/usr/bin/env node

/**
 * Windows-Compatible HTTPS Security Audit Script
 * Checks for mixed content, validates HTTPS enforcement, and runs Safe Browsing checks
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://xenlix.ai';
const GOOGLE_SAFE_BROWSING_API_KEY = process.env.GOOGLE_SAFE_BROWSING_API_KEY;

class SecurityAudit {
  constructor() {
    this.results = {
      httpsEnforcement: [],
      mixedContent: [],
      securityHeaders: [],
      safeBrowsing: [],
      errors: [],
      warnings: [],
      passed: 0,
      failed: 0,
    };
  }

  log(status, category, message, details = null) {
    const timestamp = new Date().toISOString();
    const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';

    console.log(`${icon} [${category}] ${message}`);
    if (details) console.log(`   Details: ${details}`);

    if (status === 'PASS') {
      this.results.passed++;
    } else if (status === 'FAIL') {
      this.results.failed++;
      this.results.errors.push({ category, message, details, timestamp });
    } else {
      this.results.warnings.push({ category, message, details, timestamp });
    }
  }

  async scanDirectoryForMixedContent(dir) {
    const mixedContentPatterns = [
      /http:\/\/(?!localhost|127\.0\.0\.1|0\.0\.0\.0|www\.sitemaps\.org|www\.w3\.org)/g,
      /src=['"\s]*http:\/\/(?!localhost)/g,
      /href=['"\s]*http:\/\/(?!localhost)/g,
      /url\(['"\s]*http:\/\/(?!localhost)/g,
    ];

    try {
      const files = this.getAllFiles(dir, ['.tsx', '.ts', '.js', '.jsx', '.css', '.html']);

      for (const file of files) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          const lines = content.split('\n');

          lines.forEach((line, index) => {
            for (const pattern of mixedContentPatterns) {
              const matches = line.match(pattern);
              if (matches) {
                // Skip valid cases
                if (
                  line.includes('localhost') ||
                  line.includes('127.0.0.1') ||
                  line.includes('schemas/sitemap') ||
                  line.includes('www.w3.org') ||
                  line.includes('xmlns') ||
                  line.includes('example.com') ||
                  line.includes('yourdomain.com')
                ) {
                  continue;
                }

                const relativePath = path.relative(process.cwd(), file);
                const issueDescription = `${relativePath}:${index + 1} - ${line.trim()}`;
                this.log('FAIL', 'Mixed Content', `HTTP reference found: ${issueDescription}`);
                this.results.mixedContent.push(issueDescription);
              }
            }
          });
        } catch (err) {
          this.log('WARN', 'Mixed Content', `Could not read file ${file}: ${err.message}`);
        }
      }
    } catch (err) {
      this.log('WARN', 'Mixed Content', `Could not scan directory ${dir}: ${err.message}`);
    }
  }

  getAllFiles(dir, extensions) {
    const files = [];

    try {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          // Skip node_modules and .next directories
          if (item !== 'node_modules' && item !== '.next' && !item.startsWith('.')) {
            files.push(...this.getAllFiles(fullPath, extensions));
          }
        } else if (stat.isFile()) {
          const ext = path.extname(fullPath);
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch (err) {
      // Directory doesn't exist or can't be read
    }

    return files;
  }

  async checkHTTPSRedirect(url) {
    return new Promise((resolve) => {
      const httpUrl = url.replace('https://', 'http://');

      const req = http.get(httpUrl, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          const location = res.headers.location;
          if (location && location.startsWith('https://')) {
            resolve({ redirects: true, location, status: res.statusCode });
          } else {
            resolve({ redirects: false, location, status: res.statusCode });
          }
        } else {
          resolve({ redirects: false, status: res.statusCode });
        }
      });

      req.on('error', (err) => {
        resolve({ error: err.message });
      });

      req.setTimeout(5000, () => {
        req.destroy();
        resolve({ error: 'Timeout' });
      });
    });
  }

  async checkSecurityHeaders(url) {
    return new Promise((resolve) => {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (SecurityBot/1.0; +https://xenlix.ai/security-audit)',
        },
      };

      const client = urlObj.protocol === 'https:' ? https : http;

      const req = client.request(options, (res) => {
        const headers = res.headers;
        resolve({
          status: res.statusCode,
          headers: {
            'strict-transport-security': headers['strict-transport-security'],
            'content-security-policy': headers['content-security-policy'],
            'x-content-type-options': headers['x-content-type-options'],
            'x-frame-options': headers['x-frame-options'],
            'x-xss-protection': headers['x-xss-protection'],
            'referrer-policy': headers['referrer-policy'],
          },
        });
      });

      req.on('error', (err) => {
        resolve({ error: err.message });
      });

      req.setTimeout(10000, () => {
        req.destroy();
        resolve({ error: 'Timeout' });
      });

      req.end();
    });
  }

  async checkSafeBrowsing(url) {
    if (!GOOGLE_SAFE_BROWSING_API_KEY) {
      return {
        warning:
          'Google Safe Browsing API key not configured. Set GOOGLE_SAFE_BROWSING_API_KEY environment variable.',
      };
    }

    const payload = {
      client: {
        clientId: 'xenlix-security-audit',
        clientVersion: '1.0.0',
      },
      threatInfo: {
        threatTypes: [
          'MALWARE',
          'SOCIAL_ENGINEERING',
          'UNWANTED_SOFTWARE',
          'POTENTIALLY_HARMFUL_APPLICATION',
        ],
        platformTypes: ['ANY_PLATFORM'],
        threatEntryTypes: ['URL'],
        threatEntries: [{ url }],
      },
    };

    return new Promise((resolve) => {
      const postData = JSON.stringify(payload);

      const options = {
        hostname: 'safebrowsing.googleapis.com',
        port: 443,
        path: `/v4/threatMatches:find?key=${GOOGLE_SAFE_BROWSING_API_KEY}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            resolve({
              safe: !response.matches || response.matches.length === 0,
              matches: response.matches || [],
              status: res.statusCode,
            });
          } catch (err) {
            resolve({ error: 'Failed to parse response', data });
          }
        });
      });

      req.on('error', (err) => {
        resolve({ error: err.message });
      });

      req.write(postData);
      req.end();
    });
  }

  async scanCodeForMixedContent() {
    console.log('\n🔍 Scanning codebase for mixed content vulnerabilities...\n');

    // Scan source directory
    await this.scanDirectoryForMixedContent(path.join(process.cwd(), 'src'));

    // Scan public directory
    await this.scanDirectoryForMixedContent(path.join(process.cwd(), 'public'));

    if (this.results.mixedContent.length === 0) {
      this.log('PASS', 'Mixed Content', 'No mixed content vulnerabilities found in codebase');
    } else {
      this.log(
        'FAIL',
        'Mixed Content',
        `Found ${this.results.mixedContent.length} mixed content issues`
      );
    }
  }

  async auditHTTPSEnforcement() {
    console.log('\n🔒 Testing HTTPS enforcement...\n');

    const prodResult = await this.checkHTTPSRedirect(BASE_URL);
    if (prodResult.error) {
      this.log('WARN', 'HTTPS', `Could not test production redirect: ${prodResult.error}`);
    } else if (prodResult.redirects) {
      this.log('PASS', 'HTTPS', `Production HTTP redirects to HTTPS (${prodResult.status})`);
      this.results.httpsEnforcement.push({
        url: BASE_URL,
        redirects: true,
        status: prodResult.status,
      });
    } else {
      this.log(
        'FAIL',
        'HTTPS',
        `Production does not redirect HTTP to HTTPS (${prodResult.status})`
      );
      this.results.httpsEnforcement.push({
        url: BASE_URL,
        redirects: false,
        status: prodResult.status,
      });
    }
  }

  async auditSecurityHeaders() {
    console.log('\n🛡️ Checking security headers...\n');

    const headerChecks = [
      { name: 'strict-transport-security', required: true, description: 'HSTS header' },
      { name: 'content-security-policy', required: true, description: 'CSP header' },
      { name: 'x-content-type-options', required: true, description: 'Content type options' },
      { name: 'x-frame-options', required: true, description: 'Frame options' },
      { name: 'x-xss-protection', required: false, description: 'XSS protection' },
      { name: 'referrer-policy', required: true, description: 'Referrer policy' },
    ];

    const headerResult = await this.checkSecurityHeaders(BASE_URL);

    if (headerResult.error) {
      this.log('FAIL', 'Security Headers', `Could not check headers: ${headerResult.error}`);
      return;
    }

    for (const check of headerChecks) {
      const headerValue = headerResult.headers[check.name];

      if (headerValue) {
        this.log(
          'PASS',
          'Security Headers',
          `${check.description} present: ${headerValue.substring(0, 100)}${headerValue.length > 100 ? '...' : ''}`
        );
        this.results.securityHeaders.push({
          header: check.name,
          present: true,
          value: headerValue,
        });
      } else if (check.required) {
        this.log('FAIL', 'Security Headers', `Missing required ${check.description}`);
        this.results.securityHeaders.push({ header: check.name, present: false, required: true });
      } else {
        this.log('WARN', 'Security Headers', `Optional ${check.description} not present`);
        this.results.securityHeaders.push({ header: check.name, present: false, required: false });
      }
    }
  }

  async auditSafeBrowsing() {
    console.log('\n🔍 Running Google Safe Browsing check...\n');

    const safeBrowsingResult = await this.checkSafeBrowsing(BASE_URL);

    if (safeBrowsingResult.error) {
      this.log(
        'WARN',
        'Safe Browsing',
        `Could not check Safe Browsing: ${safeBrowsingResult.error}`
      );
    } else if (safeBrowsingResult.warning) {
      this.log('WARN', 'Safe Browsing', safeBrowsingResult.warning);
    } else if (safeBrowsingResult.safe) {
      this.log('PASS', 'Safe Browsing', 'No threats detected - site is SAFE');
      this.results.safeBrowsing.push({ safe: true, matches: [] });
    } else {
      this.log(
        'FAIL',
        'Safe Browsing',
        `Threats detected: ${safeBrowsingResult.matches.length} matches`
      );
      this.results.safeBrowsing.push({ safe: false, matches: safeBrowsingResult.matches });

      for (const match of safeBrowsingResult.matches) {
        this.log('FAIL', 'Safe Browsing', `Threat: ${match.threatType} on ${match.platform}`);
      }
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('🔒 HTTPS SECURITY & SAFE BROWSING AUDIT REPORT');
    console.log('='.repeat(80));

    console.log(`\n📊 SUMMARY`);
    console.log(`Total Checks: ${this.results.passed + this.results.failed}`);
    console.log(`Passed: ${this.results.passed} ✅`);
    console.log(`Failed: ${this.results.failed} ❌`);
    console.log(`Warnings: ${this.results.warnings.length} ⚠️`);

    const securityScore =
      this.results.failed === 0
        ? 100
        : Math.max(
            0,
            Math.round((this.results.passed / (this.results.passed + this.results.failed)) * 100)
          );

    console.log(`Security Score: ${securityScore}%`);

    // Mixed Content
    if (this.results.mixedContent.length > 0) {
      console.log(`\n⚠️ MIXED CONTENT ISSUES (${this.results.mixedContent.length})`);
      this.results.mixedContent.slice(0, 10).forEach((issue) => {
        console.log(`   ❌ ${issue}`);
      });
      if (this.results.mixedContent.length > 10) {
        console.log(`   ... and ${this.results.mixedContent.length - 10} more`);
      }
    } else {
      console.log(`\n✅ MIXED CONTENT: Clean - No issues found`);
    }

    // HTTPS Enforcement
    if (this.results.httpsEnforcement.length > 0) {
      console.log(`\n🔒 HTTPS ENFORCEMENT`);
      this.results.httpsEnforcement.forEach((result) => {
        console.log(
          `   ${result.redirects ? '✅' : '❌'} ${result.url} - Status: ${result.status}`
        );
      });
    }

    // Security Headers
    if (this.results.securityHeaders.length > 0) {
      console.log(`\n🛡️ SECURITY HEADERS`);
      this.results.securityHeaders.forEach((header) => {
        const status = header.present ? '✅' : header.required ? '❌' : '⚠️';
        const value = header.present
          ? header.value.length > 50
            ? header.value.substring(0, 50) + '...'
            : header.value
          : 'Missing';
        console.log(`   ${status} ${header.header}: ${value}`);
      });
    }

    // Safe Browsing
    if (this.results.safeBrowsing.length > 0) {
      console.log(`\n🔍 SAFE BROWSING STATUS`);
      this.results.safeBrowsing.forEach((result) => {
        if (result.safe) {
          console.log(`   ✅ Site is SAFE - No threats detected`);
        } else {
          console.log(`   ❌ Threats detected: ${result.matches.length}`);
          result.matches.forEach((match) => {
            console.log(`      - ${match.threatType} on ${match.platform}`);
          });
        }
      });
    }

    // Errors & Warnings
    if (this.results.errors.length > 0) {
      console.log(`\n❌ CRITICAL ISSUES`);
      this.results.errors.slice(0, 5).forEach((error) => {
        console.log(`   [${error.category}] ${error.message}`);
        if (error.details) console.log(`      Details: ${error.details}`);
      });
      if (this.results.errors.length > 5) {
        console.log(`   ... and ${this.results.errors.length - 5} more errors`);
      }
    }

    if (this.results.warnings.length > 0) {
      console.log(`\n⚠️ WARNINGS`);
      this.results.warnings.slice(0, 5).forEach((warning) => {
        console.log(`   [${warning.category}] ${warning.message}`);
      });
      if (this.results.warnings.length > 5) {
        console.log(`   ... and ${this.results.warnings.length - 5} more warnings`);
      }
    }

    // Final assessment
    const isSecure = this.results.failed === 0 && this.results.mixedContent.length === 0;
    console.log(`\n🎯 SECURITY STATUS: ${isSecure ? 'SECURE ✅' : 'NEEDS ATTENTION ❌'}`);

    if (isSecure) {
      console.log('All security checks passed! Site is ready for production.');
    } else {
      console.log('Security issues found. Review and fix before deployment.');
    }

    // Save detailed report
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        passed: this.results.passed,
        failed: this.results.failed,
        warnings: this.results.warnings.length,
        securityScore,
        isSecure,
      },
      httpsEnforcement: this.results.httpsEnforcement,
      securityHeaders: this.results.securityHeaders,
      mixedContent: this.results.mixedContent,
      safeBrowsing: this.results.safeBrowsing,
      errors: this.results.errors,
      warnings: this.results.warnings,
    };

    fs.writeFileSync('security-audit-report.json', JSON.stringify(reportData, null, 2));
    console.log('\n📄 Detailed report saved to: security-audit-report.json');
  }

  async run() {
    console.log('🔒 Starting HTTPS Security & Safe Browsing Audit...\n');
    console.log(`Target URL: ${BASE_URL}\n`);

    try {
      await this.scanCodeForMixedContent();
      await this.auditHTTPSEnforcement();
      await this.auditSecurityHeaders();
      await this.auditSafeBrowsing();
    } catch (error) {
      this.log('FAIL', 'System', `Audit failed: ${error.message}`);
    }

    this.generateReport();
  }
}

// Run the audit
if (require.main === module) {
  const audit = new SecurityAudit();
  audit.run().catch(console.error);
}

module.exports = SecurityAudit;
