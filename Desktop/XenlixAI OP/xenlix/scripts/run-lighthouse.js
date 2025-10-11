// Use dynamic imports to prevent bundling issues when run from different contexts
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const url = process.env.TARGET_URL || 'http://localhost:3000';
const chromePath = process.env.CHROME_PATH || undefined;
const outputFormat = process.env.LH_OUTPUT || 'json,html';
const outputDir = process.env.LH_OUTPUT_DIR || join(__dirname, '..', 'reports');

// Chrome flags for headless operation (especially in CI/Docker)
const chromeFlags = [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--disable-dev-shm-usage',
  '--disable-background-timer-throttling',
  '--disable-backgrounding-occluded-windows',
  '--disable-renderer-backgrounding',
  '--disable-features=TranslateUI',
  '--disable-component-extensions-with-background-pages',
  '--no-default-browser-check',
  '--no-first-run',
];

// Lighthouse configuration
const lighthouseConfig = {
  logLevel: process.env.NODE_ENV === 'development' ? 'info' : 'error',
  output: outputFormat.split(','),
  onlyCategories: ['performance', 'accessibility', 'seo', 'best-practices', 'pwa'],
  chromeFlags,
  // Additional settings for consistent results
  throttling: {
    rttMs: 40,
    throughputKbps: 10240,
    cpuSlowdownMultiplier: 1,
    requestLatencyMs: 0,
    downloadThroughputKbps: 0,
    uploadThroughputKbps: 0,
  },
  // Skip PWA if we're just doing basic auditing
  skipAudits:
    process.env.SKIP_PWA === 'true'
      ? ['installable-manifest', 'splash-screen', 'themed-omnibox']
      : [],
};

console.log('🚀 Lighthouse Performance Audit');
console.log('================================');
console.log(`📊 Target URL: ${url}`);
console.log(`🌐 Chrome Path: ${chromePath || 'auto-detected'}`);
console.log(`📁 Output Directory: ${outputDir}`);
console.log(`📋 Output Formats: ${outputFormat}`);

async function runLighthouse() {
  try {
    // Dynamic imports to prevent bundling issues
    console.log('\n📦 Loading Lighthouse...');
    const [{ default: lighthouse }, { launch: chromeLaunch }] = await Promise.all([
      import('lighthouse'),
      import('chrome-launcher'),
    ]);

    let chrome;

    try {
      // Launch Chrome
      console.log('\n🔄 Launching Chrome...');
      chrome = await chromeLaunch({
        chromePath,
        chromeFlags,
        logLevel: process.env.NODE_ENV === 'development' ? 'info' : 'silent',
      });

      console.log(`✅ Chrome launched on port ${chrome.port}`);

      // Run Lighthouse audit
      console.log('\n🔍 Running Lighthouse audit...');
      const startTime = Date.now();

      const result = await lighthouse(url, {
        port: chrome.port,
        ...lighthouseConfig,
      });

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ Audit completed in ${duration}s`);

      // Ensure output directory exists
      mkdirSync(outputDir, { recursive: true });

      // Save reports
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const formats = outputFormat.split(',');

      formats.forEach((format, index) => {
        const extension = format.trim().toLowerCase();
        const filename = `lighthouse-${timestamp}.${extension}`;
        const filepath = join(outputDir, filename);

        writeFileSync(filepath, result.report[index]);
        console.log(`💾 Saved ${extension.toUpperCase()} report: ${filename}`);
      });

      // Extract and display key metrics
      if (result.lhr) {
        console.log('\n📈 Performance Summary:');
        console.log('=======================');

        const categories = result.lhr.categories;
        Object.entries(categories).forEach(([key, category]) => {
          const score = Math.round(category.score * 100);
          const emoji = score >= 90 ? '🟢' : score >= 50 ? '🟡' : '🔴';
          console.log(`${emoji} ${category.title}: ${score}/100`);
        });

        // Core Web Vitals
        const audits = result.lhr.audits;
        if (
          audits['first-contentful-paint'] ||
          audits['largest-contentful-paint'] ||
          audits['cumulative-layout-shift']
        ) {
          console.log('\n⚡ Core Web Vitals:');
          console.log('==================');

          if (audits['first-contentful-paint']) {
            console.log(
              `🎨 First Contentful Paint: ${audits['first-contentful-paint'].displayValue || 'N/A'}`
            );
          }
          if (audits['largest-contentful-paint']) {
            console.log(
              `🖼️  Largest Contentful Paint: ${audits['largest-contentful-paint'].displayValue || 'N/A'}`
            );
          }
          if (audits['cumulative-layout-shift']) {
            console.log(
              `📐 Cumulative Layout Shift: ${audits['cumulative-layout-shift'].displayValue || 'N/A'}`
            );
          }
          if (audits['speed-index']) {
            console.log(`🏃 Speed Index: ${audits['speed-index'].displayValue || 'N/A'}`);
          }
        }
      }

      console.log(`\n✅ Lighthouse audit completed successfully!`);
      console.log(`📁 Reports saved to: ${outputDir}`);

      // Exit with performance score for CI
      if (process.env.CI === 'true' && result.lhr?.categories?.performance?.score) {
        const performanceScore = Math.round(result.lhr.categories.performance.score * 100);
        const threshold = parseInt(process.env.PERFORMANCE_THRESHOLD || '75');

        if (performanceScore < threshold) {
          console.error(`❌ Performance score ${performanceScore} is below threshold ${threshold}`);
          process.exit(1);
        }
      }
    } finally {
      if (chrome) {
        console.log('\n🔄 Closing Chrome...');
        await chrome.kill();
      }
    }
  } catch (error) {
    console.error('\n❌ Lighthouse audit failed:');
    console.error(error.message);

    if (error.message.includes('CHROME_PATH')) {
      console.error('\n🔧 Chrome not found. Run: scripts/check-chrome.sh');
    } else if (error.message.includes('lighthouse')) {
      console.error(
        '\n� Lighthouse import failed. Ensure dependencies are installed: npm install lighthouse chrome-launcher'
      );
    }

    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', async () => {
  console.log('\n⚠️  Received SIGINT, shutting down...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⚠️  Received SIGTERM, shutting down...');
  process.exit(0);
});

// Run the audit
runLighthouse().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
