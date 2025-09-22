import { test, expect } from '@playwright/test';

// UI test: submits AEO form while unauthenticated => should fallback to /api/aeo-scan and redirect to results page

test.describe('AEO UI anonymous fallback', () => {
  test('unauthenticated submit redirects to results', async ({ page }) => {
    await page.goto('/aeo');

    // Fill minimal required fields
    await page.fill('input[placeholder="https://yourwebsite.com"]', 'https://example.com');
    await page.fill('input[placeholder="Your Business Name"]', 'Example Co');
    await page.fill('textarea[placeholder="Describe what your business does and who it serves"]', 'We help people test example flows quickly.');
    await page.fill('input[placeholder="e.g., Marketing, SaaS, Healthcare"]', 'Testing');

    // Submit
    await Promise.all([
      page.waitForURL(/\/aeo\/results\?id=.*/),
      page.click('button:has-text("Start Free AEO Audit")')
    ]);

    // Assert on results page basic element presence (headline or similar)
    expect(page.url()).toMatch(/\/aeo\/results\?id=.*/);
  });
});
