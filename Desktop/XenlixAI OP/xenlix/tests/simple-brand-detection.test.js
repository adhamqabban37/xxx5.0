/**
 * Simple Brand Detection Test - Validates core detection logic without full app dependencies
 */

// Simple brand detection logic extracted for testing
/**
 * @typedef {Object} Brand
 * @property {string} id
 * @property {string} name
 * @property {string[]=} aliases
 * @property {string[]=} negativeTerms
 * @property {string=} domain
 * @property {string=} locale
 */

/**
 * @typedef {Object} MentionResult
 * @property {string} brandId
 * @property {boolean} mentioned
 * @property {'exact'|'alias'|'fuzzy'=} matchType
 * @property {number=} confidence
 * @property {number=} sentiment
 * @property {number=} position
 * @property {string=} context
 */

/**
 * @typedef {Object} CitationResult
 * @property {string} url
 * @property {string} domain
 * @property {boolean} isPrimary
 * @property {number=} rank
 * @property {string=} title
 */

// Simplified detection logic for testing
class SimpleBrandDetector {
  /** @param {string} term */
  createTokenBoundaryRegex(term) {
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escapedTerm}\\b`, 'gi');
  }

  /** @param {string} text @param {Brand[]} brands @returns {MentionResult[]} */
  detectMentions(text, brands) {
    /** @type {MentionResult[]} */
    const results = [];

    for (const brand of brands) {
      // Check exact brand name
      const exactRegex = this.createTokenBoundaryRegex(brand.name);
      if (exactRegex.test(text)) {
        // Check for negative terms
        const hasNegativeContext =
          brand.negativeTerms?.some((term) => text.toLowerCase().includes(term.toLowerCase())) ||
          false;

        if (!hasNegativeContext) {
          results.push({
            brandId: brand.id,
            mentioned: true,
            matchType: 'exact',
            confidence: 0.95,
            sentiment: this.calculateSentiment(text, brand.name),
          });
        }
      }

      // Check aliases
      if (brand.aliases) {
        for (const alias of brand.aliases) {
          const aliasRegex = this.createTokenBoundaryRegex(alias);
          if (aliasRegex.test(text)) {
            const hasNegativeContext =
              brand.negativeTerms?.some((term) =>
                text.toLowerCase().includes(term.toLowerCase())
              ) || false;

            if (!hasNegativeContext) {
              results.push({
                brandId: brand.id,
                mentioned: true,
                matchType: 'alias',
                confidence: 0.85,
                sentiment: this.calculateSentiment(text, alias),
              });
            }
          }
        }
      }
    }

    return results;
  }

  /** @param {string} text @param {Brand[]} brands @returns {CitationResult[]} */
  extractCitations(text, brands) {
    const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
    const urls = text.match(urlRegex) || [];
    /** @type {CitationResult[]} */
    const results = [];

    urls.forEach((url, index) => {
      try {
        const parsedUrl = new URL(url);
        const domain = parsedUrl.hostname.replace(/^www\./, '');

        // Check if this domain belongs to any brand
        const ownerBrand = brands.find((b) => b.domain === domain);
        const isPrimary = !!ownerBrand;

        results.push({
          url: this.normalizeUrl(url),
          domain,
          isPrimary,
          rank: index + 1,
          title: `Page from ${domain}`,
        });
      } catch (error) {
        // Invalid URL, skip
      }
    });

    return results;
  }

  /** @param {string} url */
  normalizeUrl(url) {
    try {
      const parsed = new URL(url);
      // Remove UTM parameters and fragments
      parsed.search = '';
      parsed.hash = '';
      return parsed.toString();
    } catch {
      return url;
    }
  }

  /** @param {string} text @param {string} brandName */
  calculateSentiment(text, brandName) {
    const positiveWords = [
      'excellent',
      'great',
      'amazing',
      'best',
      'recommend',
      'love',
      'fantastic',
    ];
    const negativeWords = ['terrible', 'awful', 'bad', 'worst', 'hate', 'disappointing'];

    const textLower = text.toLowerCase();
    let score = 0;

    positiveWords.forEach((word) => {
      if (textLower.includes(word)) score += 0.1;
    });

    negativeWords.forEach((word) => {
      if (textLower.includes(word)) score -= 0.1;
    });

    return Math.max(-1, Math.min(1, score));
  }
}

// Test cases
const GOLD_STANDARD_TESTS = [
  // Positive cases
  {
    id: 'positive_1',
    text: 'XenlixAI is the best platform for SEO optimization.',
    brands: [
      { id: 'xenlix', name: 'XenlixAI', aliases: ['Xenlix'], negativeTerms: [], locale: 'en-US' },
    ],
    expected: { mentions: 1, citations: 0 },
  },
  {
    id: 'positive_2',
    text: 'Top 3 SEO tools: 1. XenlixAI 2. Semrush 3. Ahrefs',
    brands: [{ id: 'xenlix', name: 'XenlixAI', aliases: [], negativeTerms: [], locale: 'en-US' }],
    expected: { mentions: 1, citations: 0 },
  },
  {
    id: 'positive_3',
    text: 'I recommend Xenlix for small businesses looking to improve their search visibility.',
    brands: [
      { id: 'xenlix', name: 'XenlixAI', aliases: ['Xenlix'], negativeTerms: [], locale: 'en-US' },
    ],
    expected: { mentions: 1, citations: 0 },
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
    expected: { mentions: 0, citations: 1 },
  },

  // Negative cases
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
    expected: { mentions: 0, citations: 0 },
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
    expected: { mentions: 0, citations: 0 },
  },

  // Edge cases
  {
    id: 'edge_1',
    text: 'XenlixAI vs Semrush: which is better?',
    brands: [
      { id: 'xenlix', name: 'XenlixAI', aliases: [], negativeTerms: [], locale: 'en-US' },
      { id: 'semrush', name: 'Semrush', aliases: [], negativeTerms: [], locale: 'en-US' },
    ],
    expected: { mentions: 2, citations: 0 },
  },
  {
    id: 'edge_2',
    text: 'Multiple URLs: https://xenlix.ai/features, https://competitor.com/tools',
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
    expected: { mentions: 0, citations: 2 },
  },
];

// Run tests
function runTests() {
  const detector = new SimpleBrandDetector();
  let passed = 0;
  let failed = 0;
  const results = [];

  console.log('Running Enhanced Brand Detection Tests...\n');

  for (const testCase of GOLD_STANDARD_TESTS) {
    try {
      const mentions = detector.detectMentions(testCase.text, testCase.brands);
      const citations = detector.extractCitations(testCase.text, testCase.brands);

      const actualMentions = mentions.length;
      const actualCitations = citations.length;

      const mentionsPassed = actualMentions === testCase.expected.mentions;
      const citationsPassed = actualCitations === testCase.expected.citations;
      const testPassed = mentionsPassed && citationsPassed;

      if (testPassed) {
        passed++;
        console.log(`✅ ${testCase.id}: PASSED`);
      } else {
        failed++;
        console.log(`❌ ${testCase.id}: FAILED`);
        console.log(
          `   Expected: mentions=${testCase.expected.mentions}, citations=${testCase.expected.citations}`
        );
        console.log(`   Actual: mentions=${actualMentions}, citations=${actualCitations}`);
      }

      results.push({
        testId: testCase.id,
        passed: testPassed,
        expected: testCase.expected,
        actual: { mentions: actualMentions, citations: actualCitations },
        mentionDetails: mentions,
        citationDetails: citations,
      });
    } catch (error) {
      failed++;
      console.log(`❌ ${testCase.id}: ERROR - ${error.message}`);
      results.push({
        testId: testCase.id,
        passed: false,
        error: error.message,
      });
    }
  }

  console.log(`\n📊 Test Results:`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  // Calculate precision and recall metrics
  const metrics = calculatePrecisionRecall(results);
  console.log(`\n🎯 Performance Metrics:`);
  console.log(`🎯 Precision: ${(metrics.precision * 100).toFixed(1)}%`);
  console.log(`🎯 Recall: ${(metrics.recall * 100).toFixed(1)}%`);
  console.log(`🎯 F1 Score: ${(metrics.f1Score * 100).toFixed(1)}%`);

  const meetsRequirement = metrics.precision >= 0.95 && metrics.recall >= 0.95;
  console.log(
    `\n${meetsRequirement ? '✅' : '❌'} Meets ≥95% Precision/Recall Requirement: ${meetsRequirement}`
  );

  return results;
}

function calculatePrecisionRecall(results) {
  let truePositives = 0;
  let falsePositives = 0;
  let trueNegatives = 0;
  let falseNegatives = 0;

  for (const result of results) {
    if (result.error) continue;

    const expectedTotal = result.expected.mentions + result.expected.citations;
    const actualTotal = result.actual.mentions + result.actual.citations;

    if (expectedTotal > 0 && actualTotal > 0) {
      truePositives++;
    } else if (expectedTotal === 0 && actualTotal === 0) {
      trueNegatives++;
    } else if (expectedTotal === 0 && actualTotal > 0) {
      falsePositives++;
    } else if (expectedTotal > 0 && actualTotal === 0) {
      falseNegatives++;
    }
  }

  const precision = truePositives / (truePositives + falsePositives) || 0;
  const recall = truePositives / (truePositives + falseNegatives) || 0;
  const f1Score = precision + recall > 0 ? (2 * (precision * recall)) / (precision + recall) : 0;

  return {
    precision,
    recall,
    f1Score,
    truePositives,
    falsePositives,
    trueNegatives,
    falseNegatives,
  };
}

// Run the tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runTests, SimpleBrandDetector };
} else {
  runTests();
}
