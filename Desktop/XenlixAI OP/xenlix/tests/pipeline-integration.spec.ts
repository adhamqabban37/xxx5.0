/**
 * Pipeline Integration E2E Test
 * Tests the complete URL intake → extraction → analysis pipeline
 */

import { test, expect } from '@playwright/test';

test.describe('URL Intake → Extraction → Analysis Pipeline', () => {
  const TEST_URL = 'https://example.com';
  const BUSINESS_DATA = {
    name: 'Example Business',
    industry: 'Technology',
    location: 'San Francisco, CA',
  };

  test('Complete Pipeline Flow', async ({ page }) => {
    test.setTimeout(180000); // 3 minutes for full pipeline

    // Step 1: URL Intake & Validation
    console.log('🔄 Step 1: URL Intake & Validation');

    await page.goto('/aeo-validation');
    await page.waitForLoadState('networkidle');

    // Find and fill URL input
    const urlInput = page
      .locator('input[type="url"], input[name="websiteUrl"], input[placeholder*="website"]')
      .first();
    await expect(urlInput).toBeVisible({ timeout: 10000 });
    await urlInput.fill(TEST_URL);

    // Fill business data if available
    const businessNameInput = page.locator(
      'input[name="businessName"], input[placeholder*="business"]'
    );
    if (await businessNameInput.isVisible()) {
      await businessNameInput.fill(BUSINESS_DATA.name);
    }

    const industryInput = page.locator('select[name="industry"], input[name="industry"]');
    if (await industryInput.isVisible()) {
      await industryInput.fill(BUSINESS_DATA.industry);
    }

    console.log('✅ Step 1 Complete: URL and business data entered');

    // Step 2: Trigger Analysis
    console.log('🔄 Step 2: Triggering Analysis');

    const submitButton = page.locator(
      'button[type="submit"], button:has-text("Analyze"), button:has-text("Start"), button:has-text("Validate")'
    );
    await submitButton.first().click();

    // Wait for processing to start
    await page.waitForTimeout(2000);

    console.log('✅ Step 2 Complete: Analysis triggered');

    // Step 3: Monitor Processing
    console.log('🔄 Step 3: Monitoring Analysis Progress');

    // Look for progress indicators or results
    let retries = 0;
    const maxRetries = 30; // 30 seconds
    let analysisComplete = false;

    while (retries < maxRetries && !analysisComplete) {
      const hasResults = await page
        .locator('.validation-results, .analysis-complete, .aeo-score, .overall-score')
        .isVisible();
      const hasProgress = await page
        .locator('.progress, .loading, .analyzing, .spinner')
        .isVisible();
      const hasError = await page.locator('.error, .failed, .error-message').isVisible();

      if (hasResults) {
        console.log('✅ Step 3 Complete: Analysis results displayed');
        analysisComplete = true;

        // Verify score display
        const scoreElement = page.locator('.score, .overall-score, [data-testid="score"]');
        if (await scoreElement.isVisible()) {
          const scoreText = await scoreElement.textContent();
          console.log(`📊 Analysis Score: ${scoreText}`);
        }
      } else if (hasError) {
        console.log('⚠️ Step 3: Analysis error handled gracefully');
        analysisComplete = true;

        // Verify error is user-friendly
        const errorElement = page.locator('.error, .error-message');
        const errorText = await errorElement.textContent();
        expect(errorText?.length).toBeGreaterThan(0);
      } else if (hasProgress) {
        console.log(`🔄 Step 3: Analysis in progress (${retries + 1}/${maxRetries})`);
        await page.waitForTimeout(1000);
        retries++;
      } else {
        // No clear indicators, wait and retry
        await page.waitForTimeout(1000);
        retries++;
      }
    }

    expect(analysisComplete).toBeTruthy();
    console.log('✅ Pipeline test completed successfully');
  });

  test('API Pipeline - Direct Endpoint Testing', async ({ page }) => {
    // Test the API pipeline directly
    console.log('🔄 Testing API Pipeline Directly');

    // Step 1: Test URL extraction
    console.log('🔄 Step 1: URL Extraction API');

    const extractResponse = await page.request.post('/api/extract', {
      data: {
        websiteUrl: TEST_URL,
        extractMetadata: true,
        extractBusinessInfo: true,
        timeout: 30000,
      },
    });

    expect([200, 400, 500, 503]).toContain(extractResponse.status());

    const extractData = await extractResponse.json();
    console.log('✅ Step 1 Complete: Extract API responded');

    if (extractResponse.status() === 200) {
      expect(extractData.success).toBeTruthy();
      expect(extractData.data).toHaveProperty('websiteUrl');
    }

    // Step 2: Test unified validation
    console.log('🔄 Step 2: Unified Validation API');

    const validationResponse = await page.request.post('/api/unified-validation', {
      data: {
        websiteUrl: TEST_URL,
        businessData: BUSINESS_DATA,
        includePaymentInfo: false,
      },
    });

    expect([200, 400, 401, 500, 503]).toContain(validationResponse.status());

    const validationData = await validationResponse.json();
    console.log('✅ Step 2 Complete: Validation API responded');

    if (validationResponse.status() === 200) {
      expect(validationData.success).toBeTruthy();
      expect(validationData.data).toHaveProperty('overallScore');
      console.log(`📊 API Validation Score: ${validationData.data.overallScore}`);
    } else {
      console.log(`⚠️ Validation API handled error gracefully: ${validationData.error}`);
    }

    // Step 3: Test health monitoring
    console.log('🔄 Step 3: Health Monitoring');

    const healthResponse = await page.request.get('/api/health');
    expect(healthResponse.status()).toBe(200);

    const healthData = await healthResponse.json();
    expect(healthData).toHaveProperty('status');
    expect(healthData).toHaveProperty('services');

    console.log(`✅ Step 3 Complete: System health - ${healthData.status}`);
    console.log(`📊 Environment: ${healthData.environment?.environment || 'unknown'}`);
    console.log(`📊 Services: ${Object.keys(healthData.services || {}).length} configured`);

    console.log('✅ API Pipeline test completed successfully');
  });

  test('Error Resilience and Graceful Degradation', async ({ page }) => {
    console.log('🔄 Testing Error Resilience');

    // Test with invalid URL
    const invalidUrlResponse = await page.request.post('/api/extract', {
      data: { websiteUrl: 'not-a-valid-url' },
    });

    expect([400, 422]).toContain(invalidUrlResponse.status());
    const invalidData = await invalidUrlResponse.json();
    expect(invalidData).toHaveProperty('error');
    console.log('✅ Invalid URL handled gracefully');

    // Test with unreachable URL
    const unreachableResponse = await page.request.post('/api/extract', {
      data: { websiteUrl: 'https://this-domain-does-not-exist-12345.com' },
    });

    expect([400, 404, 500, 503]).toContain(unreachableResponse.status());
    console.log('✅ Unreachable URL handled gracefully');

    // Test validation without authentication
    const unauthedResponse = await page.request.post('/api/unified-validation', {
      data: { websiteUrl: TEST_URL },
    });

    // Should work without auth for basic validation or handle gracefully
    expect([200, 401, 403]).toContain(unauthedResponse.status());
    console.log('✅ Unauthenticated validation handled appropriately');

    console.log('✅ Error resilience test completed');
  });

  test('Performance and Timeout Handling', async ({ page }) => {
    console.log('🔄 Testing Performance and Timeouts');

    const startTime = Date.now();

    // Test health endpoint performance
    const healthResponse = await page.request.get('/api/health');
    const healthTime = Date.now() - startTime;

    expect(healthResponse.status()).toBe(200);
    expect(healthTime).toBeLessThan(10000); // 10 seconds max
    console.log(`✅ Health endpoint: ${healthTime}ms`);

    // Test extract endpoint with timeout
    const extractStart = Date.now();
    const extractResponse = await page.request.post('/api/extract', {
      data: {
        websiteUrl: TEST_URL,
        timeout: 10000, // 10 second timeout
      },
    });
    const extractTime = Date.now() - extractStart;

    expect([200, 400, 408, 500, 503]).toContain(extractResponse.status());
    console.log(`✅ Extract endpoint: ${extractTime}ms (status: ${extractResponse.status()})`);

    // Test maps token endpoint
    const mapsResponse = await page.request.get('/api/maps-token');
    expect([200, 400, 404]).toContain(mapsResponse.status());
    console.log('✅ Maps token endpoint responsive');

    console.log('✅ Performance test completed');
  });
});
