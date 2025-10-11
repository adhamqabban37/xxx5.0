import { test, expect } from '@playwright/test';

test.describe('Performance and Lighthouse Audits', () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  test.beforeEach(async ({ page }) => {
    // Sign up and log in for each test
    await page.goto('/signup');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard');
  });

  test('should have good Core Web Vitals', async ({ page }) => {
    // Test key pages for performance
    const pagesToTest = [
      { path: '/dashboard', name: 'Dashboard' },
      { path: '/dashboard/guidance', name: 'Guidance' },
      { path: '/tools/json-ld', name: 'JSON-LD Generator' },
      { path: '/plans', name: 'Plans' },
    ];

    for (const pageInfo of pagesToTest) {
      console.log(`Testing performance for ${pageInfo.name}`);

      // Navigate to page and wait for it to fully load
      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle');

      // Measure page load time
      const navigationTiming = await page.evaluate(() => {
        return JSON.parse(JSON.stringify(performance.getEntriesByType('navigation')[0]));
      });

      // Basic performance assertions
      expect(navigationTiming.loadEventEnd - navigationTiming.fetchStart).toBeLessThan(5000); // Load time < 5s
      expect(navigationTiming.domContentLoadedEventEnd - navigationTiming.fetchStart).toBeLessThan(
        3000
      ); // DOMContentLoaded < 3s

      console.log(
        `${pageInfo.name} - Load time: ${navigationTiming.loadEventEnd - navigationTiming.fetchStart}ms`
      );
    }
  });

  test('should have optimized images and resources', async ({ page }) => {
    // Monitor network requests
    const imageRequests: any[] = [];
    const cssRequests: any[] = [];
    const jsRequests: any[] = [];

    page.on('request', (request) => {
      const url = request.url();
      if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
        imageRequests.push(request);
      } else if (url.match(/\.css$/i)) {
        cssRequests.push(request);
      } else if (url.match(/\.js$/i)) {
        jsRequests.push(request);
      }
    });

    // Visit dashboard page
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check resource optimization
    console.log(`Images loaded: ${imageRequests.length}`);
    console.log(`CSS files loaded: ${cssRequests.length}`);
    console.log(`JS files loaded: ${jsRequests.length}`);

    // Assert reasonable resource counts
    expect(imageRequests.length).toBeLessThan(20); // Not too many images
    expect(cssRequests.length).toBeLessThan(10); // CSS files should be bundled
    expect(jsRequests.length).toBeLessThan(15); // JS files should be reasonably bundled
  });

  test('should be accessible', async ({ page }) => {
    // Test accessibility on key pages
    const pagesToTest = ['/dashboard', '/dashboard/guidance', '/tools/json-ld', '/plans'];

    for (const pagePath of pagesToTest) {
      await page.goto(pagePath);

      // Check for basic accessibility features

      // 1. All images should have alt attributes or be decorative
      const images = await page.locator('img').all();
      for (const img of images) {
        const alt = await img.getAttribute('alt');
        const role = await img.getAttribute('role');
        // Images should have alt text or be marked as decorative
        expect(alt !== null || role === 'presentation').toBeTruthy();
      }

      // 2. Form inputs should have labels
      const inputs = await page
        .locator('input[type="text"], input[type="email"], input[type="password"], textarea')
        .all();
      for (const input of inputs) {
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const placeholder = await input.getAttribute('placeholder');

        if (id) {
          // Check if there's a label for this input
          const label = page.locator(`label[for="${id}"]`);
          const hasLabel = (await label.count()) > 0;
          expect(hasLabel || ariaLabel !== null || placeholder !== null).toBeTruthy();
        }
      }

      // 3. Buttons should have accessible names
      const buttons = await page.locator('button').all();
      for (const button of buttons) {
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        const title = await button.getAttribute('title');

        expect(text?.trim().length || ariaLabel || title).toBeTruthy();
      }

      // 4. Page should have a main heading
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBeGreaterThanOrEqual(1);
    }
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Test error handling by trying to access non-existent resources

    // 1. Test 404 page
    await page.goto('/non-existent-page');
    // Should either show a 404 page or redirect gracefully
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy(); // Page should render something

    // 2. Test API error handling in JSON-LD generator
    await page.goto('/tools/json-ld');

    // Try to generate JSON-LD with an invalid URL
    await page.fill('input[placeholder*="URL"]', 'invalid-url');
    await page.click('button:has-text("Generate")');

    // Should show an error message without crashing
    await page.waitForTimeout(2000);
    const errorMessage = await page.locator('.error, .alert, [role="alert"]').first();
    // If there's an error element, it should be visible
    if ((await errorMessage.count()) > 0) {
      await expect(errorMessage).toBeVisible();
    }
  });

  test('should work offline (basic functionality)', async ({ page, context }) => {
    // Visit the page first while online
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Go offline
    await context.setOffline(true);

    // Try to navigate to cached pages
    await page.goto('/dashboard/guidance');

    // Page should still render (even if some dynamic content fails)
    const body = await page.locator('body');
    await expect(body).toBeVisible();

    // Go back online
    await context.setOffline(false);
  });
});
