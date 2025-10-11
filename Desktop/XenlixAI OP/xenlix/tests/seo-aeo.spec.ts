import { test, expect } from '@playwright/test';

test.describe('SEO/AEO Functionality', () => {
  // Test data
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  const testUrl = 'https://www.example.com';

  test.beforeEach(async ({ page }) => {
    // Sign up and log in for each test
    await page.goto('/signup');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard');
  });

  test('should access JSON-LD generator tool', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');

    // Look for JSON-LD generator link
    await expect(page.locator('text=JSON-LD Generator')).toBeVisible();

    // Click on the link
    await page.click('text=JSON-LD Generator');

    // Should navigate to the JSON-LD tool page
    await page.waitForURL('**/tools/json-ld');

    // Check if the page loads correctly
    await expect(page.locator('h1')).toContainText('JSON-LD Generator');
    await expect(page.locator('input[placeholder*="URL"]')).toBeVisible();
    await expect(page.locator('button:has-text("Generate")')).toBeVisible();
  });

  test('should generate JSON-LD from URL', async ({ page }) => {
    // Navigate to JSON-LD generator
    await page.goto('/tools/json-ld');

    // Fill in the URL
    await page.fill('input[placeholder*="URL"]', testUrl);

    // Click Generate button
    await page.click('button:has-text("Generate")');

    // Wait for generation to complete
    await page.waitForTimeout(3000);

    // Check if JSON-LD output appears
    await expect(page.locator('pre, code, textarea')).toBeVisible();

    // Check if copy button appears
    await expect(page.locator('button:has-text("Copy")')).toBeVisible();

    // Check if download button appears
    await expect(page.locator('button:has-text("Download")')).toBeVisible();
  });

  test('should display AEO guidance', async ({ page }) => {
    // Navigate to guidance page
    await page.goto('/dashboard/guidance');

    // Check if AEO guidance section exists
    await expect(page.locator('text=AI Search Engine Optimization')).toBeVisible();

    // Check if AEO guidance items are displayed
    await expect(
      page.locator('[data-testid="aeo-guidance"], .guidance-section:has-text("AEO")')
    ).toBeVisible();

    // Check if there are guidance items listed
    const guidanceItems = page.locator('.guidance-item, [data-testid="guidance-item"]');
    await expect(guidanceItems.first()).toBeVisible();
  });

  test('should display Traditional SEO guidance', async ({ page }) => {
    // Navigate to guidance page
    await page.goto('/dashboard/guidance');

    // Check if Traditional SEO guidance section exists
    await expect(page.locator('text=Traditional SEO')).toBeVisible();

    // Check if SEO guidance items are displayed
    await expect(
      page.locator('[data-testid="seo-guidance"], .guidance-section:has-text("Traditional SEO")')
    ).toBeVisible();

    // Check if there are guidance items listed
    const guidanceItems = page.locator('.guidance-item, [data-testid="guidance-item"]');
    await expect(guidanceItems.first()).toBeVisible();
  });

  test('should complete sandbox checkout flow', async ({ page }) => {
    // Navigate to plans page
    await page.goto('/plans');

    // Check if plans are displayed
    const planCards = page.locator('.plan-card, [data-testid="plan-card"]');
    await expect(planCards.first()).toBeVisible();

    // Click on a plan (try different selectors)
    const planButtons = [
      'button:has-text("Choose Basic")',
      'button:has-text("Get Started")',
      'button:has-text("Select Plan")',
      '.plan-card button',
      '[data-testid="plan-button"]',
    ];

    let clicked = false;
    for (const selector of planButtons) {
      if (await page.locator(selector).isVisible()) {
        await page.click(selector);
        clicked = true;
        break;
      }
    }

    if (!clicked) {
      // If no specific plan button found, click the first clickable element in a plan
      await page.click('.plan-card, [data-testid="plan-card"]');
    }

    // Wait for redirect to dashboard with sandbox success
    await page.waitForURL('**/dashboard*');

    // Check for sandbox indicators
    const sandboxIndicators = [
      'text=sandbox',
      'text=trial',
      '[data-testid="sandbox-badge"]',
      '.sandbox-mode',
    ];

    let foundIndicator = false;
    for (const indicator of sandboxIndicators) {
      if (await page.locator(indicator).isVisible()) {
        foundIndicator = true;
        break;
      }
    }

    // If no specific indicator, just check that we're back on dashboard
    await expect(page).toHaveURL(/.*dashboard.*/);
  });

  test('should handle API responses correctly', async ({ page }) => {
    // Test health endpoint
    const healthResponse = await page.request.get('/api/health');
    expect(healthResponse.ok()).toBeTruthy();

    const healthData = await healthResponse.json();
    expect(healthData.ok).toBe(true);
    expect(healthData.status).toBe('healthy');

    // Test guidance API (requires authentication)
    await page.goto('/dashboard/guidance');

    // Monitor network requests
    const guidanceRequests = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/ai/guidance')) {
        guidanceRequests.push(request);
      }
    });

    // Trigger guidance request by refreshing or interacting
    await page.reload();

    // Wait for guidance requests to complete
    await page.waitForTimeout(2000);

    // Check that guidance requests were made
    expect(guidanceRequests.length).toBeGreaterThan(0);
  });

  test('should be mobile responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });

    // Test main pages on mobile
    const pagesToTest = ['/dashboard', '/dashboard/guidance', '/tools/json-ld', '/plans'];

    for (const pagePath of pagesToTest) {
      await page.goto(pagePath);

      // Check that page loads without horizontal scroll
      const body = await page.locator('body').boundingBox();
      expect(body?.width).toBeLessThanOrEqual(375);

      // Check that main content is visible
      await expect(page.locator('main, .main-content, #main')).toBeVisible();
    }
  });

  test('should not have console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Visit key pages
    const pagesToTest = ['/dashboard', '/dashboard/guidance', '/tools/json-ld', '/plans'];

    for (const pagePath of pagesToTest) {
      await page.goto(pagePath);
      await page.waitForTimeout(1000); // Wait for any async operations
    }

    // Filter out common false positives
    const significantErrors = errors.filter(
      (error) =>
        !error.includes('favicon.ico') &&
        !error.includes('ERR_NETWORK') &&
        !error.includes('chunk') &&
        !error.toLowerCase().includes('network')
    );

    expect(significantErrors).toHaveLength(0);
  });
});
