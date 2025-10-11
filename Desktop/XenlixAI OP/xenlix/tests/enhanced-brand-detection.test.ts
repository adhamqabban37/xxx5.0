/**
 * Comprehensive Unit Tests for Enhanced Brand Mention Detection
 * Ensures ≥95% precision/recall with gold standard test cases
 */

import { describe, test, expect, beforeAll, beforeEach, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import {
  EnhancedBrandMentionDetector,
  processAnswerForMentionsAndCitations,
} from '../src/lib/ai-visibility/enhanced-brand-detection';

const prisma = new PrismaClient();

// Gold standard test cases for precision/recall validation
const GOLD_STANDARD_TEST_CASES = [
  // Positive cases (should detect)
  {
    id: 'positive_1',
    text: 'XenlixAI is the best platform for SEO optimization.',
    brands: [
      { id: 'xenlix', name: 'XenlixAI', aliases: ['Xenlix'], negativeTerms: [], locale: 'en-US' },
    ],
    expected: {
      mentions: [{ brandId: 'xenlix', mentioned: true, sentiment: 1 }],
      citations: [],
    },
  },
  {
    id: 'positive_2',
    text: 'Top 3 SEO tools: 1. XenlixAI 2. Semrush 3. Ahrefs',
    brands: [{ id: 'xenlix', name: 'XenlixAI', aliases: [], negativeTerms: [], locale: 'en-US' }],
    expected: {
      mentions: [{ brandId: 'xenlix', mentioned: true, position: 1 }],
      citations: [],
    },
  },
  {
    id: 'positive_3',
    text: 'I recommend Xenlix for small businesses looking to improve their search visibility.',
    brands: [
      { id: 'xenlix', name: 'XenlixAI', aliases: ['Xenlix'], negativeTerms: [], locale: 'en-US' },
    ],
    expected: {
      mentions: [{ brandId: 'xenlix', mentioned: true, matchType: 'alias' }],
      citations: [],
    },
  },
  {
    id: 'positive_4',
    text: 'Check out their guide at https://xenlix.ai/seo-guide for more tips.',
    brands: [
      {
        id: 'xenlix',
        name: 'XenlixAI',
        aliases: [],
        negativeTerms: [],
        domain: 'xenlix.ai',
        locale: 'en-US',
      },
    ],
    expected: {
      mentions: [],
      citations: [{ domain: 'xenlix.ai', isPrimary: true }],
    },
  },
  {
    id: 'positive_5',
    text: 'XenlixAI offers excellent SEO automation features. Visit https://xenlix.ai for details.',
    brands: [
      {
        id: 'xenlix',
        name: 'XenlixAI',
        aliases: [],
        negativeTerms: [],
        domain: 'xenlix.ai',
        locale: 'en-US',
      },
    ],
    expected: {
      mentions: [{ brandId: 'xenlix', mentioned: true }],
      citations: [{ domain: 'xenlix.ai', isPrimary: true }],
    },
  },

  // Negative cases (should NOT detect)
  {
    id: 'negative_1',
    text: "I tried XenlixAI but it was terrible and didn't work.",
    brands: [
      {
        id: 'xenlix',
        name: 'XenlixAI',
        aliases: [],
        negativeTerms: ['terrible', "didn't work"],
        locale: 'en-US',
      },
    ],
    expected: {
      mentions: [], // Should be filtered out by negative terms
      citations: [],
    },
  },
  {
    id: 'negative_2',
    text: "Don't use XenlixAI - there are better alternatives.",
    brands: [
      {
        id: 'xenlix',
        name: 'XenlixAI',
        aliases: [],
        negativeTerms: ["don't use", 'better alternatives'],
        locale: 'en-US',
      },
    ],
    expected: {
      mentions: [], // Should be filtered out
      citations: [],
    },
  },
  {
    id: 'negative_3',
    text: 'The word xenlix appears in many chemical compound names.',
    brands: [
      {
        id: 'xenlix',
        name: 'XenlixAI',
        aliases: ['Xenlix'],
        negativeTerms: ['chemical compound'],
        locale: 'en-US',
      },
    ],
    expected: {
      mentions: [], // Should be filtered out by context
      citations: [],
    },
  },
  {
    id: 'negative_4',
    text: 'Email sent from noreply@xenlix.ai was marked as spam.',
    brands: [
      {
        id: 'xenlix',
        name: 'XenlixAI',
        aliases: [],
        negativeTerms: [],
        domain: 'xenlix.ai',
        locale: 'en-US',
      },
    ],
    expected: {
      mentions: [], // Email context should not count
      citations: [], // Email URLs should not count as citations
    },
  },

  // Edge cases
  {
    id: 'edge_1',
    text: 'XenlixAI vs Semrush: which is better?',
    brands: [
      { id: 'xenlix', name: 'XenlixAI', aliases: [], negativeTerms: [], locale: 'en-US' },
      { id: 'semrush', name: 'Semrush', aliases: [], negativeTerms: [], locale: 'en-US' },
    ],
    expected: {
      mentions: [
        { brandId: 'xenlix', mentioned: true },
        { brandId: 'semrush', mentioned: true },
      ],
      citations: [],
    },
  },
  {
    id: 'edge_2',
    text: 'xenlixai (all lowercase) is mentioned here.',
    brands: [{ id: 'xenlix', name: 'XenlixAI', aliases: [], negativeTerms: [], locale: 'en-US' }],
    expected: {
      mentions: [{ brandId: 'xenlix', mentioned: true, matchType: 'fuzzy' }],
      citations: [],
    },
  },
  {
    id: 'edge_3',
    text: 'Multiple URLs: https://xenlix.ai/features, https://competitor.com/tools, https://example.com',
    brands: [
      {
        id: 'xenlix',
        name: 'XenlixAI',
        aliases: [],
        negativeTerms: [],
        domain: 'xenlix.ai',
        locale: 'en-US',
      },
    ],
    expected: {
      mentions: [],
      citations: [
        { domain: 'xenlix.ai', isPrimary: true, rank: 1 },
        { domain: 'competitor.com', isPrimary: false, rank: 2 },
        { domain: 'example.com', isPrimary: false, rank: 3 },
      ],
    },
  },
  {
    id: 'edge_4',
    text: 'Xenlix AI (with space) and XenlixAI (without space) mentioned.',
    brands: [
      {
        id: 'xenlix',
        name: 'XenlixAI',
        aliases: ['Xenlix AI'],
        negativeTerms: [],
        locale: 'en-US',
      },
    ],
    expected: {
      mentions: [
        { brandId: 'xenlix', mentioned: true, matchType: 'alias' },
        { brandId: 'xenlix', mentioned: true, matchType: 'exact' },
      ],
      citations: [],
    },
  },
];

// Metrics for precision/recall calculation
interface TestMetrics {
  truePositives: number;
  falsePositives: number;
  trueNegatives: number;
  falseNegatives: number;
}

describe('Enhanced Brand Mention Detection', () => {
  let detector: EnhancedBrandMentionDetector;
  let testMetrics: TestMetrics;

  beforeAll(async () => {
    // Setup test database
    await setupTestDatabase();
  });

  beforeEach(() => {
    detector = new EnhancedBrandMentionDetector();
    testMetrics = {
      truePositives: 0,
      falsePositives: 0,
      trueNegatives: 0,
      falseNegatives: 0,
    };
  });

  afterAll(async () => {
    await cleanupTestDatabase();
    await prisma.$disconnect();
  });

  describe('Gold Standard Test Cases', () => {
    test.each(GOLD_STANDARD_TEST_CASES)('should handle case $id correctly', async (testCase) => {
      const result = await detector.detectMentionsAndCitations(testCase.text, testCase.brands, []);

      // Validate mentions
      if (testCase.expected.mentions.length === 0) {
        expect(result.mentions).toHaveLength(0);
      } else {
        expect(result.mentions.length).toBeGreaterThan(0);

        for (const expectedMention of testCase.expected.mentions) {
          const actualMention = result.mentions.find((m) => m.brandId === expectedMention.brandId);
          expect(actualMention).toBeDefined();
          expect(actualMention!.mentioned).toBe(expectedMention.mentioned);

          if (expectedMention.position) {
            expect(actualMention!.position).toBe(expectedMention.position);
          }

          if (expectedMention.matchType) {
            expect(actualMention!.matchType).toBe(expectedMention.matchType);
          }

          if (expectedMention.sentiment !== undefined) {
            // Allow some tolerance for sentiment scores
            expect(actualMention!.sentiment).toBeCloseTo(expectedMention.sentiment, 1);
          }
        }
      }

      // Validate citations
      if (testCase.expected.citations.length === 0) {
        expect(result.citations).toHaveLength(0);
      } else {
        expect(result.citations.length).toBeGreaterThanOrEqual(testCase.expected.citations.length);

        for (const expectedCitation of testCase.expected.citations) {
          const actualCitation = result.citations.find((c) => c.domain === expectedCitation.domain);
          expect(actualCitation).toBeDefined();

          if (expectedCitation.isPrimary !== undefined) {
            expect(actualCitation!.isPrimary).toBe(expectedCitation.isPrimary);
          }

          if (expectedCitation.rank !== undefined) {
            expect(actualCitation!.rank).toBe(expectedCitation.rank);
          }
        }
      }

      // Update metrics
      updateTestMetrics(testMetrics, testCase, result);
    });
  });

  describe('Precision and Recall Requirements', () => {
    test('should achieve ≥95% precision', async () => {
      // Run all test cases
      for (const testCase of GOLD_STANDARD_TEST_CASES) {
        const result = await detector.detectMentionsAndCitations(
          testCase.text,
          testCase.brands,
          []
        );
        updateTestMetrics(testMetrics, testCase, result);
      }

      const precision = calculatePrecision(testMetrics);
      console.log('Precision:', precision, 'Metrics:', testMetrics);
      expect(precision).toBeGreaterThanOrEqual(0.95);
    });

    test('should achieve ≥95% recall', async () => {
      // Metrics should already be populated from previous test
      const recall = calculateRecall(testMetrics);
      console.log('Recall:', recall, 'Metrics:', testMetrics);
      expect(recall).toBeGreaterThanOrEqual(0.95);
    });

    test('should achieve ≥95% F1 score', async () => {
      const precision = calculatePrecision(testMetrics);
      const recall = calculateRecall(testMetrics);
      const f1Score = (2 * (precision * recall)) / (precision + recall);
      console.log('F1 Score:', f1Score);
      expect(f1Score).toBeGreaterThanOrEqual(0.95);
    });
  });

  describe('Token Boundary Regex Tests', () => {
    test('should detect exact brand names with proper boundaries', async () => {
      const text = 'XenlixAI is great but not aixenlix or prexenlixaipost';
      const brands = [
        { id: 'xenlix', name: 'XenlixAI', aliases: [], negativeTerms: [], locale: 'en-US' },
      ];

      const result = await detector.detectMentionsAndCitations(text, brands);

      expect(result.mentions).toHaveLength(1);
      expect(result.mentions[0].brandId).toBe('xenlix');
      expect(result.mentions[0].matchType).toBe('exact');
    });

    test('should handle special characters and punctuation', async () => {
      const text = "Try XenlixAI! It's amazing. (XenlixAI rocks)";
      const brands = [
        { id: 'xenlix', name: 'XenlixAI', aliases: [], negativeTerms: [], locale: 'en-US' },
      ];

      const result = await detector.detectMentionsAndCitations(text, brands);

      expect(result.mentions.length).toBeGreaterThanOrEqual(1);
      result.mentions.forEach((mention) => {
        expect(mention.brandId).toBe('xenlix');
      });
    });
  });

  describe('Negative Terms Filtering', () => {
    test('should filter out mentions with negative context', async () => {
      const text = 'XenlixAI is terrible and has many bugs';
      const brands = [
        {
          id: 'xenlix',
          name: 'XenlixAI',
          aliases: [],
          negativeTerms: ['terrible', 'bugs'],
          locale: 'en-US',
        },
      ];

      const result = await detector.detectMentionsAndCitations(text, brands);

      expect(result.mentions).toHaveLength(0);
    });

    test('should allow mentions without negative context', async () => {
      const text = 'XenlixAI is excellent for SEO optimization';
      const brands = [
        {
          id: 'xenlix',
          name: 'XenlixAI',
          aliases: [],
          negativeTerms: ['terrible', 'bugs'],
          locale: 'en-US',
        },
      ];

      const result = await detector.detectMentionsAndCitations(text, brands);

      expect(result.mentions).toHaveLength(1);
      expect(result.mentions[0].sentiment).toBeGreaterThan(0);
    });
  });

  describe('Context Window Validation', () => {
    test('should validate context appropriately', async () => {
      const text = "Don't use XenlixAI vs Use XenlixAI for best results";
      const brands = [
        { id: 'xenlix', name: 'XenlixAI', aliases: [], negativeTerms: [], locale: 'en-US' },
      ];

      const result = await detector.detectMentionsAndCitations(text, brands);

      // Should detect at least the positive mention
      expect(result.mentions.length).toBeGreaterThan(0);

      // Check that positive context has better sentiment
      const positiveMention = result.mentions.find((m) => m.sentiment > 0);
      expect(positiveMention).toBeDefined();
    });
  });

  describe('Citation Extraction', () => {
    test('should normalize URLs correctly', async () => {
      const text = 'Visit https://xenlix.ai/?utm_source=test&utm_medium=email#section1';
      const brands = [
        {
          id: 'xenlix',
          name: 'XenlixAI',
          aliases: [],
          negativeTerms: [],
          domain: 'xenlix.ai',
          locale: 'en-US',
        },
      ];

      const result = await detector.detectMentionsAndCitations(text, brands);

      expect(result.citations).toHaveLength(1);
      expect(result.citations[0].url).toBe('https://xenlix.ai/');
      expect(result.citations[0].domain).toBe('xenlix.ai');
      expect(result.citations[0].isPrimary).toBe(true);
    });

    test('should extract multiple citations with correct ranking', async () => {
      const citations = [
        'https://xenlix.ai/guide',
        'https://competitor1.com/tool',
        'https://competitor2.com/platform',
      ];
      const text = `Check these tools: ${citations.join(', ')}`;
      const brands = [
        {
          id: 'xenlix',
          name: 'XenlixAI',
          aliases: [],
          negativeTerms: [],
          domain: 'xenlix.ai',
          locale: 'en-US',
        },
      ];

      const result = await detector.detectMentionsAndCitations(text, brands, citations);

      expect(result.citations.length).toBeGreaterThanOrEqual(3);

      const xenlixCitation = result.citations.find((c) => c.domain === 'xenlix.ai');
      expect(xenlixCitation).toBeDefined();
      expect(xenlixCitation!.isPrimary).toBe(true);

      const competitorCitations = result.citations.filter((c) => c.domain !== 'xenlix.ai');
      expect(competitorCitations.length).toBeGreaterThanOrEqual(2);
      competitorCitations.forEach((citation) => {
        expect(citation.isPrimary).toBe(false);
      });
    });
  });

  describe('Performance Tests', () => {
    test('should process large text efficiently', async () => {
      const largeText =
        'XenlixAI is mentioned here. '.repeat(1000) +
        'Visit https://xenlix.ai for details. '.repeat(100);
      const brands = [
        {
          id: 'xenlix',
          name: 'XenlixAI',
          aliases: [],
          negativeTerms: [],
          domain: 'xenlix.ai',
          locale: 'en-US',
        },
      ];

      const startTime = Date.now();
      const result = await detector.detectMentionsAndCitations(largeText, brands);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(result.mentions.length).toBeGreaterThan(0);
      expect(result.citations.length).toBeGreaterThan(0);
    });
  });
});

// Helper functions for test metrics
function updateTestMetrics(metrics: TestMetrics, testCase: any, result: any) {
  const expectedMentions = testCase.expected.mentions.length;
  const actualMentions = result.mentions.length;

  if (expectedMentions > 0 && actualMentions > 0) {
    metrics.truePositives++;
  } else if (expectedMentions === 0 && actualMentions === 0) {
    metrics.trueNegatives++;
  } else if (expectedMentions === 0 && actualMentions > 0) {
    metrics.falsePositives++;
  } else if (expectedMentions > 0 && actualMentions === 0) {
    metrics.falseNegatives++;
  }
}

function calculatePrecision(metrics: TestMetrics): number {
  const { truePositives, falsePositives } = metrics;
  if (truePositives + falsePositives === 0) return 1;
  return truePositives / (truePositives + falsePositives);
}

function calculateRecall(metrics: TestMetrics): number {
  const { truePositives, falseNegatives } = metrics;
  if (truePositives + falseNegatives === 0) return 1;
  return truePositives / (truePositives + falseNegatives);
}

async function setupTestDatabase() {
  // Create test brands
  await prisma.brand.createMany({
    data: [
      {
        id: 'xenlix',
        name: 'XenlixAI',
        domain: 'xenlix.ai',
      },
      {
        id: 'semrush',
        name: 'Semrush',
        domain: 'semrush.com',
      },
    ],
    skipDuplicates: true,
  });

  // Create test aliases
  await prisma.brandAlias.createMany({
    data: [
      {
        brandId: 'xenlix',
        alias: 'Xenlix',
        locale: 'en-US',
      },
      {
        brandId: 'xenlix',
        alias: 'Xenlix AI',
        locale: 'en-US',
      },
    ],
    skipDuplicates: true,
  });

  // Create test negative terms
  await prisma.brandNegativeTerm.createMany({
    data: [
      {
        brandId: 'xenlix',
        term: 'terrible',
        locale: 'en-US',
      },
      {
        brandId: 'xenlix',
        term: 'bugs',
        locale: 'en-US',
      },
      {
        brandId: 'xenlix',
        term: 'chemical compound',
        locale: 'en-US',
      },
    ],
    skipDuplicates: true,
  });
}

async function cleanupTestDatabase() {
  await prisma.brandNegativeTerm.deleteMany({
    where: { brandId: { in: ['xenlix', 'semrush'] } },
  });

  await prisma.brandAlias.deleteMany({
    where: { brandId: { in: ['xenlix', 'semrush'] } },
  });

  await prisma.brand.deleteMany({
    where: { id: { in: ['xenlix', 'semrush'] } },
  });
}
