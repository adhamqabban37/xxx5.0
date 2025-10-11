/**
 * Example usage of the analyzeQuestionGaps function
 * This demonstrates how to identify question gaps for content optimization
 */

import * as cheerio from 'cheerio';
import { analyzeQuestionGaps } from '@/lib/question-gap-analyzer';

/**
 * Example 1: Analyzing a basic webpage for question gaps
 */
export async function exampleBasicQuestionGapAnalysis() {
  // Sample HTML content with some questions covered
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>AI Engine Optimization Guide</title>
    </head>
    <body>
      <h1>Complete Guide to AEO</h1>
      
      <h2>What is AEO?</h2>
      <p>AI Engine Optimization (AEO) is the process of optimizing content for AI-powered search engines.</p>
      
      <h2>How is AEO different from SEO?</h2>
      <p>AEO focuses on conversational queries and structured data for AI consumption.</p>
      
      <h2>The future of search</h2>
      <p>Search is evolving with AI integration and voice interfaces.</p>
      
      <h3>Benefits of implementing AEO</h3>
      <p>AEO can improve visibility in AI-powered search results.</p>
    </body>
    </html>
  `;

  const $ = cheerio.load(htmlContent);
  const result = await analyzeQuestionGaps($, 'AEO optimization');

  console.log('=== Basic Question Gap Analysis ===');
  console.log('Answered Questions:', result.answeredQuestions);
  console.log('Missing Questions:', result.missingQuestions);
  console.log('Analysis Metrics:', result.analysisMetrics);

  return result;
}

/**
 * Example 2: Analyzing a marketing blog for question gaps
 */
export async function exampleMarketingBlogAnalysis() {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Digital Marketing Strategies 2025</title>
    </head>
    <body>
      <h1>Digital Marketing Strategies for 2025</h1>
      
      <h2>What is digital marketing?</h2>
      <p>Digital marketing encompasses all marketing efforts that use digital channels.</p>
      
      <h2>Social media marketing trends</h2>
      <p>Social media continues to evolve with new platforms and features.</p>
      
      <h2>Content marketing best practices</h2>
      <p>Quality content remains crucial for digital marketing success.</p>
      
      <div class="faq">
        <h3>How do you measure marketing ROI?</h3>
        <p>Marketing ROI can be measured through various metrics and analytics tools.</p>
      </div>
    </body>
    </html>
  `;

  const $ = cheerio.load(htmlContent);
  const result = await analyzeQuestionGaps($, 'digital marketing');

  console.log('=== Marketing Blog Analysis ===');
  console.log('Coverage Percentage:', result.analysisMetrics.coveragePercentage + '%');
  console.log('Opportunity Score:', result.analysisMetrics.opportunityScore);
  console.log('Top Missing Questions:', result.missingQuestions.slice(0, 5));

  return result;
}

/**
 * Example 3: Analyzing a comprehensive FAQ page
 */
export async function exampleComprehensiveFAQAnalysis() {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Business Growth FAQ</title>
    </head>
    <body>
      <h1>Frequently Asked Questions About Business Growth</h1>
      
      <div class="faq-section">
        <h2>How to start a business?</h2>
        <p>Starting a business requires planning, funding, and legal setup.</p>
        
        <h2>What are business growth strategies?</h2>
        <p>Growth strategies include market expansion, product development, and partnerships.</p>
        
        <h2>How to improve business efficiency?</h2>
        <p>Efficiency can be improved through automation and process optimization.</p>
        
        <h2>What is competitive analysis?</h2>
        <p>Competitive analysis involves studying competitors' strengths and weaknesses.</p>
        
        <h2>How to scale a business?</h2>
        <p>Scaling requires systems, processes, and strategic planning.</p>
        
        <h2>How to manage business finances?</h2>
        <p>Financial management includes budgeting, forecasting, and cash flow monitoring.</p>
      </div>
    </body>
    </html>
  `;

  const $ = cheerio.load(htmlContent);
  const result = await analyzeQuestionGaps($, 'business growth');

  console.log('=== Comprehensive FAQ Analysis ===');
  console.log('Total Answered:', result.analysisMetrics.totalAnsweredQuestions);
  console.log('Total Missing:', result.analysisMetrics.totalMissingQuestions);
  console.log('Coverage:', result.analysisMetrics.coveragePercentage + '%');
  console.log('Remaining Opportunities:', result.missingQuestions);

  return result;
}

/**
 * Example 4: Testing different keyword types
 */
export async function exampleKeywordVariationTesting() {
  const basicHTML = `
    <html>
    <body>
      <h1>Technology Solutions</h1>
      <h2>What is cloud computing?</h2>
      <p>Cloud computing delivers computing services over the internet.</p>
      <h2>Benefits of automation</h2>
      <p>Automation can increase efficiency and reduce costs.</p>
    </body>
    </html>
  `;

  const keywords = ['technology', 'cloud computing', 'software', 'automation'];
  const results = [];

  for (const keyword of keywords) {
    const $ = cheerio.load(basicHTML);
    const result = await analyzeQuestionGaps($, keyword);

    results.push({
      keyword,
      answeredCount: result.analysisMetrics.totalAnsweredQuestions,
      missingCount: result.analysisMetrics.totalMissingQuestions,
      coveragePercentage: result.analysisMetrics.coveragePercentage,
      opportunityScore: result.analysisMetrics.opportunityScore,
      topMissingQuestions: result.missingQuestions.slice(0, 3),
    });
  }

  console.log('=== Keyword Variation Testing ===');
  results.forEach((result) => {
    console.log(`\nKeyword: ${result.keyword}`);
    console.log(`Coverage: ${result.coveragePercentage}%`);
    console.log(`Opportunity Score: ${result.opportunityScore}`);
    console.log(`Top Missing: ${result.topMissingQuestions.join(', ')}`);
  });

  return results;
}

/**
 * Example 5: Real-world API integration example
 */
export async function exampleAPIIntegration(url: string) {
  try {
    // This would typically be called from within the /api/analyze-content route
    // const response = await fetch(url);
    // const html = await response.text();

    // For demo purposes, using sample content
    const html = `
      <html>
      <body>
        <h1>Sample Business Guide</h1>
        <h2>What is business planning?</h2>
        <p>Business planning involves creating a roadmap for your business.</p>
        <h2>How to find customers?</h2>
        <p>Customer acquisition requires marketing and networking strategies.</p>
      </body>
      </html>
    `;

    const $ = cheerio.load(html);
    const primaryKeyword = 'business planning'; // This would be extracted from content

    const questionGaps = await analyzeQuestionGaps($, primaryKeyword);

    // Return in API response format
    return {
      url,
      questionGaps: {
        answeredQuestions: questionGaps.answeredQuestions,
        missingQuestions: questionGaps.missingQuestions,
        analysisMetrics: questionGaps.analysisMetrics,
      },
      contentOptimizationSuggestions: [
        ...questionGaps.missingQuestions
          .slice(0, 5)
          .map((question) => `Consider adding a section answering: "${question}"`),
        questionGaps.analysisMetrics.opportunityScore > 70
          ? 'High opportunity for content expansion with question-focused sections'
          : 'Good question coverage, focus on optimizing existing content',
      ],
    };
  } catch (error) {
    console.error('Error in API integration example:', error);
    return {
      url,
      questionGaps: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Example 6: Performance testing with different content sizes
 */
export async function examplePerformanceTesting() {
  const generateHTML = (questionCount: number) => {
    let html = '<html><body><h1>Test Content</h1>';

    for (let i = 1; i <= questionCount; i++) {
      html += `<h2>Question ${i}: What is topic ${i}?</h2>`;
      html += `<p>Answer to question ${i} about topic ${i}.</p>`;
    }

    html += '</body></html>';
    return html;
  };

  const testSizes = [5, 10, 25, 50];
  const performanceResults = [];

  for (const size of testSizes) {
    const startTime = Date.now();

    const html = generateHTML(size);
    const $ = cheerio.load(html);
    const result = await analyzeQuestionGaps($, 'test topic');

    const endTime = Date.now();
    const duration = endTime - startTime;

    performanceResults.push({
      questionCount: size,
      processingTime: duration,
      answeredQuestions: result.analysisMetrics.totalAnsweredQuestions,
      missingQuestions: result.analysisMetrics.totalMissingQuestions,
      coveragePercentage: result.analysisMetrics.coveragePercentage,
    });
  }

  console.log('=== Performance Testing Results ===');
  performanceResults.forEach((result) => {
    console.log(
      `Questions: ${result.questionCount}, Time: ${result.processingTime}ms, Coverage: ${result.coveragePercentage}%`
    );
  });

  return performanceResults;
}

// Export all examples for easy testing
export const questionGapExamples = {
  basic: exampleBasicQuestionGapAnalysis,
  marketing: exampleMarketingBlogAnalysis,
  comprehensive: exampleComprehensiveFAQAnalysis,
  keywordVariation: exampleKeywordVariationTesting,
  apiIntegration: exampleAPIIntegration,
  performance: examplePerformanceTesting,
};
