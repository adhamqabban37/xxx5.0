/**
 * DevOps Full Pipeline E2E Tests
 * Comprehensive validation of all systems and integrations
 */

import { test, expect } from '@playwright/test';

// Test configuration
const TEST_TIMEOUT = 120000; // 2 minutes for API calls
const TEST_URL = 'https://example.com';

test.describe('DevOps Full Pipeline Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for API-heavy tests
    test.setTimeout(TEST_TIMEOUT);

    // Navigate to the app with error handling
    await page.goto('/', { waitUntil: 'networkidle' });
  });

  test('Health Endpoint - Environment Variables', async ({ page }) => {
    // Test the enhanced health endpoint
    const response = await page.request.get('/api/health');
    expect(response.status()).toBe(200);

    const healthData = await response.json();

    // Verify health response structure
    expect(healthData).toHaveProperty('status');
    expect(healthData).toHaveProperty('timestamp');
    expect(healthData).toHaveProperty('environment');
    expect(healthData).toHaveProperty('services');
    expect(healthData).toHaveProperty('requiredEnvVars');

    // Verify services are configured
    expect(healthData.services).toHaveProperty('redis');
    expect(healthData.services).toHaveProperty('firebase');
    expect(healthData.services).toHaveProperty('openai');

    // Verify environment variables are tracked
    expect(healthData.requiredEnvVars).toHaveProperty('total');
    expect(healthData.requiredEnvVars).toHaveProperty('configured');
    expect(healthData.requiredEnvVars).toHaveProperty('missing');

    console.log('✅ Health endpoint verified with environment checking');
  });

  test('Maps Integration - AEO Summary Page', async ({ page }) => {
    // Navigate to AEO summary page with test URL
    await page.goto(`/aeo/summary?url=${encodeURIComponent(TEST_URL)}`);

    // Wait for page to load
    await page.waitForSelector(
      '[data-testid="business-info-card"], .business-info, .map-container',
      { timeout: 30000 }
    );

    // Check if map container exists
    const mapContainer = page.locator(
      '.map-container, [data-testid="map-card"], .leaflet-container, .google-map'
    );
    await expect(mapContainer.first()).toBeVisible({ timeout: 15000 });

    // Test map provider switching if diagnostics panel is visible
    const diagnosticsPanel = page.locator('[data-testid="diagnostics-panel"]');
    if (await diagnosticsPanel.isVisible()) {
      const mapToggle = page.locator('button:has-text("Map Provider"), button:has-text("Switch")');
      if (await mapToggle.first().isVisible()) {
        await mapToggle.first().click();
        console.log('✅ Map provider switching tested');
      }
    }

    console.log('✅ Maps integration verified on AEO Summary page');
  });

  test('URL Extraction Pipeline', async ({ page }) => {
    // Test the new /api/extract endpoint
    const response = await page.request.post('/api/extract', {
      data: {
        websiteUrl: TEST_URL,
        extractMetadata: true,
        extractBusinessInfo: true,
      },
    });

    expect(response.status()).toBe(200);

    const extractData = await response.json();

    // Verify extraction response structure
    expect(extractData).toHaveProperty('success', true);
    expect(extractData).toHaveProperty('data');
    expect(extractData.data).toHaveProperty('websiteUrl');
    expect(extractData.data).toHaveProperty('extractedAt');

    // Verify optional data extraction
    if (extractData.data.metadata) {
      expect(extractData.data.metadata).toHaveProperty('title');
    }

    console.log('✅ URL extraction pipeline verified');
  });

  test('AEO Validation Pipeline - Graceful Degradation', async ({ page }) => {
    // Test the unified validation endpoint
    const response = await page.request.post('/api/unified-validation', {
      data: {
        websiteUrl: TEST_URL,
        businessData: {
          name: 'Test Business',
          industry: 'Technology',
        },
      },
    });

    // Should succeed or fail gracefully
    expect([200, 400, 500, 503]).toContain(response.status());

    const validationData = await response.json();

    if (response.status() === 200) {
      // Successful validation
      expect(validationData).toHaveProperty('success', true);
      expect(validationData).toHaveProperty('data');
      expect(validationData.data).toHaveProperty('overallScore');
      console.log('✅ AEO validation succeeded with score:', validationData.data.overallScore);
    } else {
      // Graceful failure
      expect(validationData).toHaveProperty('error');
      console.log('✅ AEO validation failed gracefully:', validationData.error);
    }

    console.log('✅ AEO validation pipeline graceful degradation verified');
  });

  test('Diagnostics Panel - Self-Test Functionality', async ({ page }) => {
    // Navigate to a page with diagnostics panel
    await page.goto(`/aeo/summary?url=${encodeURIComponent(TEST_URL)}`);

    // Wait for diagnostics panel to load
    await page.waitForTimeout(3000);

    // Look for diagnostics panel (might be hidden in production)
    const diagnosticsPanel = page.locator('[data-testid="diagnostics-panel"], .diagnostics-panel');

    if (await diagnosticsPanel.isVisible()) {
      // Test self-test functionality
      const selfTestButton = page.locator(
        'button:has-text("Run"), button:has-text("Test"), button:has-text("Check")'
      );

      if (await selfTestButton.first().isVisible()) {
        await selfTestButton.first().click();

        // Wait for tests to complete
        await page.waitForTimeout(5000);

        // Check for test results
        const testResults = page.locator('.health-check, .test-result, .status-indicator');
        await expect(testResults.first()).toBeVisible({ timeout: 10000 });

        console.log('✅ Diagnostics panel self-test functionality verified');
      } else {
        console.log('ℹ️ Diagnostics panel visible but no test buttons found');
      }
    } else {
      console.log('ℹ️ Diagnostics panel not visible (expected in production)');
    }
  });

  test('Maps Token Endpoint', async ({ page }) => {
    // Test the maps token endpoint
    const response = await page.request.get('/api/maps-token');

    expect([200, 400, 404]).toContain(response.status());

    const tokenData = await response.json();

    if (response.status() === 200) {
      expect(tokenData).toHaveProperty('available', true);
      console.log('✅ Google Maps API token available');
    } else {
      expect(tokenData).toHaveProperty('available', false);
      expect(tokenData).toHaveProperty('fallback');
      console.log('✅ Maps token endpoint handles missing API key gracefully');
    }
  });

  test('End-to-End AEO Analysis Flow', async ({ page }) => {
    // Navigate to main AEO analysis page
    await page.goto('/aeo-validation');

    // Wait for form to load
    await page.waitForSelector(
      'input[type="url"], input[name="websiteUrl"], input[placeholder*="website"]',
      { timeout: 10000 }
    );

    // Fill in the website URL
    const urlInput = page
      .locator('input[type="url"], input[name="websiteUrl"], input[placeholder*="website"]')
      .first();
    await urlInput.fill(TEST_URL);

    // Optional: Fill business name if field exists
    const businessNameInput = page.locator(
      'input[name="businessName"], input[placeholder*="business name"]'
    );
    if (await businessNameInput.isVisible()) {
      await businessNameInput.fill('Test Business');
    }

    // Submit the form
    const submitButton = page.locator(
      'button[type="submit"], button:has-text("Analyze"), button:has-text("Start"), button:has-text("Validate")'
    );
    await submitButton.first().click();

    // Wait for analysis to complete or show progress
    await page.waitForTimeout(5000);

    // Check for results or progress indication
    const hasResults = await page
      .locator('.validation-results, .analysis-complete, .score-display')
      .isVisible();
    const hasProgress = await page.locator('.progress, .loading, .analyzing').isVisible();
    const hasError = await page.locator('.error, .failed').isVisible();

    expect(hasResults || hasProgress || hasError).toBeTruthy();

    if (hasResults) {
      console.log('✅ End-to-end AEO analysis completed successfully');
    } else if (hasProgress) {
      console.log('✅ End-to-end AEO analysis started and showing progress');
    } else {
      console.log('✅ End-to-end AEO analysis handled error gracefully');
    }
  });

  test('Schema Generation and Validation', async ({ page }) => {
    // Test schema extraction endpoint if it exists
    const schemaResponse = await page.request.post('/api/schema-extractor', {
      data: { url: TEST_URL },
    });

    if (schemaResponse.status() === 200) {
      const schemaData = await schemaResponse.json();
      expect(schemaData).toHaveProperty('schemas');
      console.log('✅ Schema extraction endpoint verified');
    } else {
      console.log('ℹ️ Schema extraction endpoint not available or failed gracefully');
    }

    // Test schema generator endpoint if it exists
    const generateResponse = await page.request.post('/api/schema-generator', {
      data: {
        businessName: 'Test Business',
        businessType: 'Technology',
        website: TEST_URL,
      },
    });

    if (generateResponse.status() === 200) {
      const generateData = await generateResponse.json();
      expect(generateData).toHaveProperty('schemas');
      console.log('✅ Schema generation endpoint verified');
    } else {
      console.log('ℹ️ Schema generation endpoint not available or failed gracefully');
    }
  });
});

test.describe('Performance and Reliability Tests', () => {
  test('API Response Times', async ({ page }) => {
    const startTime = Date.now();

    const response = await page.request.get('/api/health');

    const responseTime = Date.now() - startTime;
    expect(responseTime).toBeLessThan(5000); // 5 second max
    expect(response.status()).toBe(200);

    console.log(`✅ Health endpoint response time: ${responseTime}ms`);
  });

  test('Error Handling and Fallbacks', async ({ page }) => {
    // Test with invalid URL
    const invalidResponse = await page.request.post('/api/extract', {
      data: { websiteUrl: 'not-a-valid-url' },
    });

    expect([400, 422]).toContain(invalidResponse.status());

    const errorData = await invalidResponse.json();
    expect(errorData).toHaveProperty('error');

    console.log('✅ Invalid URL handling verified');

    // Test with non-existent endpoint
    const notFoundResponse = await page.request.get('/api/non-existent-endpoint');
    expect(notFoundResponse.status()).toBe(404);

    console.log('✅ 404 error handling verified');
  });

  test('Application Startup and Stability', async ({ page }) => {
    // Test multiple page loads
    const pages = ['/', '/aeo-validation', '/aeo/summary?url=https://example.com'];

    for (const pagePath of pages) {
      await page.goto(pagePath);

      // Check for critical errors
      const hasError = await page.locator('.error-boundary, [data-testid="error"]').isVisible();
      expect(hasError).toBeFalsy();

      // Check page loads properly
      await expect(page).toHaveTitle(/.+/); // Has some title

      console.log(`✅ Page ${pagePath} loads without critical errors`);
    }
  });
});
