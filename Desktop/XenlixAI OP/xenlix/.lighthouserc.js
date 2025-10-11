module.exports = {
  ci: {
    collect: {
      url: [process.env.TARGET_URL || 'http://localhost:3000'],
      startServerCommand: process.env.CI ? undefined : 'npm start',
      startServerReadyPattern: 'Ready on',
      startServerReadyTimeout: 30000,
      chromeFlags: [
        '--headless=new',
        '--no-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--no-default-browser-check',
        '--no-first-run',
      ],
    },
    assert: {
      assertions: {
        'categories:performance': [
          'error',
          { minScore: parseFloat(process.env.PERFORMANCE_THRESHOLD || '0.75') },
        ],
        'categories:accessibility': ['warn', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 4000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
      },
    },
    upload: {
      target: process.env.LHCI_TARGET || 'filesystem',
      outputDir: process.env.LH_OUTPUT_DIR || './lighthouse-reports',
      reportFilenamePattern: '%%PATHNAME%%-%%DATETIME%%-report.%%EXTENSION%%',
    },
    server: process.env.LHCI_SERVER_BASE_URL
      ? {
          baseURL: process.env.LHCI_SERVER_BASE_URL,
          token: process.env.LHCI_SERVER_TOKEN,
        }
      : undefined,
  },
};
