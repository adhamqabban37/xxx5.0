import { test, expect } from '@playwright/test';

// Simple API test for anonymous AEO scan fallback
// Verifies endpoint returns auditId and basic preview metrics

test.describe('AEO Scan API', () => {
  test('POST /api/aeo-scan returns auditId', async ({ request }) => {
    const res = await request.post('/api/aeo-scan', {
      data: {
        websiteUrl: 'https://example.com',
        businessName: 'Example Co',
        businessDescription: 'We provide example services for testing.',
        industry: 'Testing',
      },
    });
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBeTruthy();
    expect(typeof json.auditId).toBe('string');
    expect(json.previewResults).toBeDefined();
  });
});
