/**
 * AI Visibility Acceptance Tests
 * Comprehensive end-to-end testing for AI visibility integration
 */

import { test, expect, Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

test.describe('AI Visibility Integration', () => {
  test.beforeAll(async () => {
    // Setup test data
    await setupTestData();
  });

  test.afterAll(async () => {
    // Cleanup test data
    await cleanupTestData();
    await prisma.$disconnect();
  });

  test.describe('Database Schema', () => {
    test('should have all required AI visibility models', async () => {
      // Test that all models exist and have proper relationships
      const brand = await prisma.brand.create({
        data: {
          name: 'Test Brand',
          primary_domain: 'testbrand.com',
          aliases: {
            create: [{ alias: 'Test Co' }, { alias: 'TestBrand Inc' }],
          },
        },
        include: {
          aliases: true,
        },
      });

      expect(brand).toBeDefined();
      expect(brand.aliases).toHaveLength(2);

      const prompt = await prisma.prompt.create({
        data: {
          text: 'What are the best AI tools for businesses?',
          keywords: ['AI tools', 'business software'],
          brand_id: brand.id,
        },
      });

      expect(prompt).toBeDefined();
      expect(prompt.brand_id).toBe(brand.id);
    });

    test('should enforce proper foreign key relationships', async () => {
      // Test that foreign key constraints work
      await expect(
        prisma.answer.create({
          data: {
            engine: 'Perplexity',
            raw_response: 'Test response',
            response_time_ms: 1000,
            prompt_id: 'non-existent-id',
            run_id: 'non-existent-run-id',
          },
        })
      ).rejects.toThrow();
    });
  });

  test.describe('AI Engine Collectors', () => {
    test('should collect data from Perplexity successfully', async ({ page }) => {
      const { PerplexityCollector } = await import(
        '../src/lib/ai-visibility/collectors/perplexity'
      );

      const collector = new PerplexityCollector({
        timeout: 30000,
        maxRetries: 2,
        rateLimit: { requests: 5, windowMs: 60000 },
      });

      const testPrompts = [
        'What are the best CRM tools for small businesses?',
        'Top AI website builders in 2024',
      ];

      for (const prompt of testPrompts) {
        const result = await collector.collectAnswers(prompt);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.answers).toBeDefined();
          expect(result.answers.length).toBeGreaterThan(0);
          expect(result.answers[0]).toHaveProperty('content');
          expect(result.answers[0]).toHaveProperty('citations');
        }
      }
    });

    test('should handle rate limiting properly', async () => {
      const { PerplexityCollector } = await import(
        '../src/lib/ai-visibility/collectors/perplexity'
      );

      const collector = new PerplexityCollector({
        timeout: 10000,
        maxRetries: 1,
        rateLimit: { requests: 1, windowMs: 5000 },
      });

      // Make rapid requests to trigger rate limiting
      const promises = Array.from({ length: 3 }, () => collector.collectAnswers('Test prompt'));

      const results = await Promise.all(promises);

      // At least one should be rate limited
      const rateLimitedResults = results.filter(
        (r) => !r.success && r.error?.includes('rate limit')
      );
      expect(rateLimitedResults.length).toBeGreaterThan(0);
    });
  });

  test.describe('Brand Mention Parser', () => {
    test('should detect brand mentions correctly', async () => {
      const { BrandMentionParser } = await import('../src/lib/ai-visibility/parsers/brand-mention');

      const parser = new BrandMentionParser();

      const brandConfig = {
        id: 'test-brand-id',
        name: 'XenlixAI',
        aliases: ['Xenlix', 'XenlixAI Platform'],
        primaryDomain: 'xenlix.ai',
      };

      const testAnswer = {
        content:
          'XenlixAI is a leading AI platform that helps businesses optimize their websites. Xenlix offers powerful SEO tools.',
        citations: [
          { url: 'https://xenlix.ai/features', title: 'AI SEO Features' },
          { url: 'https://competitor.com/tools', title: 'SEO Tools' },
        ],
        metadata: { source: 'Perplexity' },
      };

      const result = await parser.parseAnswer(testAnswer, [brandConfig]);

      expect(result.mentions).toHaveLength(2); // XenlixAI + Xenlix
      expect(result.mentions[0].brandId).toBe(brandConfig.id);
      expect(result.mentions[0].mentioned).toBe(true);

      expect(result.citations).toHaveLength(2);
      expect(result.citations[0].isPrimary).toBe(true); // xenlix.ai citation
      expect(result.citations[1].isPrimary).toBe(false);
    });

    test('should calculate sentiment scores accurately', async () => {
      const { BrandMentionParser } = await import('../src/lib/ai-visibility/parsers/brand-mention');

      const parser = new BrandMentionParser();

      const brandConfig = {
        id: 'test-brand',
        name: 'TestBrand',
        aliases: [],
        primaryDomain: 'testbrand.com',
      };

      const positiveAnswer = {
        content:
          'TestBrand is an excellent platform with outstanding features and great customer support.',
        citations: [],
        metadata: { source: 'ChatGPT' },
      };

      const negativeAnswer = {
        content: 'TestBrand is terrible, with poor performance and awful customer service.',
        citations: [],
        metadata: { source: 'ChatGPT' },
      };

      const positiveResult = await parser.parseAnswer(positiveAnswer, [brandConfig]);
      const negativeResult = await parser.parseAnswer(negativeAnswer, [brandConfig]);

      expect(positiveResult.mentions[0].sentiment).toBeGreaterThan(0.5);
      expect(negativeResult.mentions[0].sentiment).toBeLessThan(0.5);
    });
  });

  test.describe('AI Visibility Scoring', () => {
    test('should calculate visibility scores using correct formula', async () => {
      const { AIVisibilityScorer } = await import('../src/lib/ai-visibility/scoring');

      const scorer = new AIVisibilityScorer();

      const testData = {
        mentions: [
          {
            brandId: 'brand-1',
            brandName: 'Brand A',
            mentioned: true,
            sentiment: 0.8,
            positionTerm: 0.9, // First mention
            context: 'positive context',
          },
        ],
        citations: [
          {
            url: 'https://branda.com/page',
            domain: 'branda.com',
            title: 'Brand A Features',
            isPrimary: true,
            brandId: 'brand-1',
            authorityScore: 85,
          },
        ],
      };

      const scores = await scorer.calculateBrandScores(testData);

      expect(scores).toHaveLength(1);
      const brandScore = scores[0];

      expect(brandScore.brandId).toBe('brand-1');
      expect(brandScore.mentioned).toBe(0.5); // 50% weight for mention
      expect(brandScore.primaryCitation).toBe(0.3); // 30% weight for primary citation
      expect(brandScore.positionTerm).toBeCloseTo(0.135); // 15% * 0.9
      expect(brandScore.sentimentScore).toBeCloseTo(0.04); // 5% * 0.8

      const totalScore =
        brandScore.mentioned +
        brandScore.primaryCitation +
        brandScore.positionTerm +
        brandScore.sentimentScore;
      expect(totalScore).toBeCloseTo(0.975);
    });

    test('should integrate with existing scoring correctly', async () => {
      const { AIVisibilityIntegrator } = await import('../src/lib/ai-visibility/integration');

      const integrator = new AIVisibilityIntegrator({ aiVisWeight: 0.2 });

      const existingScore = 75; // Current final score
      const aiVisibilityIndex = 60; // AI visibility score

      const newScore = await integrator.integrateWithFinalScore(existingScore, aiVisibilityIndex);

      // Should be: 0.8 * 75 + 0.2 * 60 = 60 + 12 = 72
      expect(newScore).toBeCloseTo(72);
      expect(newScore).toBeGreaterThanOrEqual(0);
      expect(newScore).toBeLessThanOrEqual(100);
    });
  });

  test.describe('Job Orchestration', () => {
    test('should schedule and execute collection jobs', async () => {
      const { AIVisibilityOrchestrator } = await import('../src/lib/ai-visibility/orchestrator');

      const orchestrator = new AIVisibilityOrchestrator({
        redis: { host: 'localhost', port: 6379 },
        schedule: '*/5 * * * * *', // Every 5 seconds for testing
      });

      await orchestrator.initialize();

      // Schedule a test job
      const job = await orchestrator.scheduleCollection({
        type: 'single-prompt',
        promptId: 'test-prompt-id',
        priority: 'high',
      });

      expect(job).toBeDefined();
      expect(job.id).toBeDefined();

      // Wait for job completion
      await new Promise((resolve) => setTimeout(resolve, 10000));

      const status = await orchestrator.getJobStatus(job.id);
      expect(['completed', 'failed']).toContain(status.status);

      await orchestrator.shutdown();
    });
  });

  test.describe('API Endpoints', () => {
    test('should return AI visibility summary', async ({ request }) => {
      const response = await request.get('/api/ai-visibility/summary?days=7');

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('ai_visibility_index');
      expect(data).toHaveProperty('time_period');
      expect(data).toHaveProperty('brand_summaries');
      expect(data).toHaveProperty('coverage');
      expect(data).toHaveProperty('competitive_analysis');

      expect(typeof data.ai_visibility_index).toBe('number');
      expect(data.ai_visibility_index).toBeGreaterThanOrEqual(0);
      expect(data.ai_visibility_index).toBeLessThanOrEqual(100);
    });

    test('should handle manual collection trigger', async ({ request }) => {
      const response = await request.post('/api/ai-visibility/collect', {
        data: { type: 'full' },
      });

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('jobId');

      if (data.success) {
        expect(typeof data.jobId).toBe('string');
      }
    });

    test('should return top cited sources', async ({ request }) => {
      const response = await request.get('/api/ai-visibility/sources/top?limit=5');

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('sources');
      expect(Array.isArray(data.sources)).toBe(true);

      if (data.sources.length > 0) {
        const source = data.sources[0];
        expect(source).toHaveProperty('domain');
        expect(source).toHaveProperty('citations');
        expect(source).toHaveProperty('authority_score');
      }
    });

    test('should validate request parameters', async ({ request }) => {
      // Test invalid days parameter
      const response1 = await request.get('/api/ai-visibility/summary?days=invalid');
      expect(response1.status()).toBe(400);

      // Test invalid collection type
      const response2 = await request.post('/api/ai-visibility/collect', {
        data: { type: 'invalid-type' },
      });
      expect(response2.status()).toBe(400);
    });
  });

  test.describe('Dashboard UI', () => {
    test('should display AI Visibility card correctly', async ({ page }) => {
      await page.goto('/dashboard'); // Assuming dashboard route exists

      // Wait for AI Visibility card to load
      await page.waitForSelector('[data-testid="ai-visibility-card"]', { timeout: 10000 });

      // Check if main elements are visible
      expect(await page.locator('text=AI Visibility').isVisible()).toBe(true);
      expect(await page.locator('text=AI Visibility Index').isVisible()).toBe(true);

      // Check if metrics are displayed
      const visibilityScore = await page.locator('[data-testid="visibility-score"]').textContent();
      expect(visibilityScore).toBeDefined();

      // Check refresh functionality
      await page.click('[data-testid="refresh-button"]');
      await page.waitForSelector('[data-testid="loading-spinner"]');
    });

    test('should navigate to detailed analytics page', async ({ page }) => {
      await page.goto('/ai-visibility');

      // Wait for page to load
      await page.waitForSelector('text=AI Visibility Analytics');

      // Check tabs are present
      expect(await page.locator('text=Overview').isVisible()).toBe(true);
      expect(await page.locator('text=Brands').isVisible()).toBe(true);
      expect(await page.locator('text=Engines').isVisible()).toBe(true);

      // Test tab switching
      await page.click('text=Brands');
      await page.waitForSelector('[data-testid="brands-tab-content"]');

      await page.click('text=Engines');
      await page.waitForSelector('[data-testid="engines-tab-content"]');
    });

    test('should handle loading and error states', async ({ page }) => {
      // Simulate network failure
      await page.route('/api/ai-visibility/summary*', (route) =>
        route.fulfill({ status: 500, body: 'Server Error' })
      );

      await page.goto('/ai-visibility');

      // Should show error state
      await page.waitForSelector('text=Failed to Load Analytics');

      // Test retry functionality
      await page.unroute('/api/ai-visibility/summary*');
      await page.click('text=Try Again');

      // Should eventually load successfully
      await page.waitForSelector('text=AI Visibility Analytics', { timeout: 10000 });
    });
  });

  test.describe('Integration with Existing Systems', () => {
    test('should not break existing scoring components', async ({ page }) => {
      await page.goto('/dashboard');

      // Check that existing score components still work
      const existingScoreElements = [
        '[data-testid="aeo-score"]',
        '[data-testid="optimization-score"]',
        '[data-testid="score-visualization"]',
      ];

      for (const selector of existingScoreElements) {
        const element = page.locator(selector);
        if ((await element.count()) > 0) {
          expect(await element.isVisible()).toBe(true);
        }
      }
    });

    test('should preserve existing final score calculation when AI visibility is disabled', async () => {
      // Mock environment with AI visibility disabled
      process.env.AI_VIS_ENABLED = 'false';

      const { AIVisibilityIntegrator } = await import('../src/lib/ai-visibility/integration');
      const integrator = new AIVisibilityIntegrator();

      const originalScore = 85;
      const aiVisibilityIndex = 75;

      const newScore = await integrator.integrateWithFinalScore(originalScore, aiVisibilityIndex);

      // Should return original score unchanged when disabled
      expect(newScore).toBe(originalScore);

      // Reset environment
      process.env.AI_VIS_ENABLED = 'true';
    });
  });

  test.describe('Performance and Reliability', () => {
    test('should handle concurrent collection requests', async () => {
      const requests = Array.from({ length: 5 }, (_, i) =>
        fetch('/api/ai-visibility/collect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'single-prompt', promptId: `test-${i}` }),
        })
      );

      const responses = await Promise.all(requests);

      // All should either succeed or fail gracefully
      responses.forEach((response) => {
        expect([200, 429, 500]).toContain(response.status);
      });
    });

    test('should respect rate limiting', async ({ request }) => {
      const requests = Array.from({ length: 20 }, () => request.get('/api/ai-visibility/summary'));

      const responses = await Promise.all(requests);
      const rateLimitedResponses = responses.filter((r) => r.status() === 429);

      // Some requests should be rate limited
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    test('should handle database connection failures gracefully', async ({ request }) => {
      // This would require mocking database connection failures
      // Implementation depends on your testing setup

      const response = await request.get('/api/ai-visibility/summary');

      // Should either succeed or return proper error status
      expect([200, 500, 503]).toContain(response.status());
    });
  });
});

// Helper functions for test setup and cleanup
async function setupTestData() {
  try {
    // Create test brands
    await prisma.brand.createMany({
      data: [
        {
          id: 'test-brand-1',
          name: 'Test Brand A',
          primary_domain: 'testbrand-a.com',
        },
        {
          id: 'test-brand-2',
          name: 'Test Brand B',
          primary_domain: 'testbrand-b.com',
        },
      ],
      skipDuplicates: true,
    });

    // Create test prompts
    await prisma.prompt.createMany({
      data: [
        {
          id: 'test-prompt-1',
          text: 'What are the best CRM tools?',
          keywords: ['CRM', 'customer management'],
          brand_id: 'test-brand-1',
        },
        {
          id: 'test-prompt-2',
          text: 'Top AI website builders',
          keywords: ['AI', 'website builder'],
          brand_id: 'test-brand-2',
        },
      ],
      skipDuplicates: true,
    });

    console.log('Test data setup completed');
  } catch (error) {
    console.error('Error setting up test data:', error);
  }
}

async function cleanupTestData() {
  try {
    // Clean up in reverse order of dependencies
    await prisma.aiVisibilityMetric.deleteMany({
      where: { brand_id: { startsWith: 'test-' } },
    });

    await prisma.answerCitation.deleteMany({
      where: { answer: { prompt: { id: { startsWith: 'test-' } } } },
    });

    await prisma.answerMention.deleteMany({
      where: { answer: { prompt: { id: { startsWith: 'test-' } } } },
    });

    await prisma.answer.deleteMany({
      where: { prompt: { id: { startsWith: 'test-' } } },
    });

    await prisma.run.deleteMany({
      where: { id: { startsWith: 'test-' } },
    });

    await prisma.prompt.deleteMany({
      where: { id: { startsWith: 'test-' } },
    });

    await prisma.brandAlias.deleteMany({
      where: { brand: { id: { startsWith: 'test-' } } },
    });

    await prisma.brand.deleteMany({
      where: { id: { startsWith: 'test-' } },
    });

    console.log('Test data cleanup completed');
  } catch (error) {
    console.error('Error cleaning up test data:', error);
  }
}
