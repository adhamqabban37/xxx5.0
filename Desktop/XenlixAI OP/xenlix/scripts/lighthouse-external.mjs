#!/usr/bin/env node

/**
 * External Lighthouse runner - runs completely separate from Next.js bundling
 * This avoids any Turbopack issues by running as a standalone Node.js process
 */

import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';
import { writeFileSync } from 'node:fs';

// Get URL from command line args
const url = process.argv[2];

if (!url) {
  console.error('Usage: node scripts/lighthouse-external.mjs <url>');
  process.exit(1);
}

// Configuration
const chromePath = process.env.CHROME_PATH;
const chromeFlags = [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--disable-dev-shm-usage',
  '--disable-background-timer-throttling',
  '--disable-backgrounding-occluded-windows',
  '--disable-renderer-backgrounding',
  '--no-default-browser-check',
  '--no-first-run',
];

const lighthouseConfig = {
  extends: 'lighthouse:default',
  settings: {
    onlyCategories: ['performance', 'accessibility', 'seo', 'best-practices'],
    output: ['json'],
    throttling: {
      rttMs: 40,
      throughputKbps: 10240,
      cpuSlowdownMultiplier: 1,
    },
  },
};

let chrome;

try {
  console.error(`🚀 Launching Chrome for ${url}...`);

  chrome = await launch({
    chromePath,
    chromeFlags,
    logLevel: 'silent',
  });

  console.error(`✅ Chrome launched on port ${chrome.port}`);

  const result = await lighthouse(
    url,
    {
      port: chrome.port,
      output: 'json',
      logLevel: 'error',
      onlyCategories: ['performance', 'accessibility', 'seo', 'best-practices'],
    },
    lighthouseConfig
  );

  if (!result || !result.report) {
    throw new Error('Lighthouse audit failed to generate report');
  }

  // Output JSON report to stdout
  process.stdout.write(result.report);

  console.error('✅ Lighthouse audit completed successfully');
} catch (error) {
  console.error(`❌ Lighthouse audit failed: ${error.message}`);

  if (error.message.includes('Chrome')) {
    console.error('🔧 Chrome installation issue. Check CHROME_PATH or install Chrome/Chromium.');
  }

  process.exit(1);
} finally {
  if (chrome && chrome.kill) {
    try {
      await chrome.kill();
    } catch (err) {
      console.error(`Warning: Failed to kill Chrome: ${err.message}`);
    }
  }
}
