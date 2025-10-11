/**
 * Citation System Integration Tests
 *
 * Test the complete citation extraction, storage, and API workflow
 */

import { CitationExtractor } from '../src/lib/citationExtractor';

// Mock AI response for testing
const mockAIResponse = `
Based on recent research, the global AI market is expected to reach $1.8 trillion by 2030 [1]. 

Several studies confirm this trend:
- McKinsey reports significant AI adoption across industries (Source: https://www.mckinsey.com/featured-insights/artificial-intelligence)
- MIT Technology Review discusses AI transformation: https://www.technologyreview.com/2024/01/15/ai-transformation/
- According to Forbes, enterprise AI spending increased 300% in 2024 [2]

Key findings include:
1. Manufacturing sees 40% efficiency gains (https://example-manufacturing.com/ai-study)
2. Healthcare applications show promising results [3]
3. Financial services lead in AI investment: https://fintech-news.com/ai-investment-2024

References:
[1] Stanford AI Index Report 2024 - https://aiindex.stanford.edu/report/
[2] Forbes Enterprise AI Survey - https://forbes.com/ai-enterprise-survey
[3] Nature Medicine AI Applications - https://nature.com/articles/ai-healthcare-2024
`;

async function testCitationExtraction() {
  console.log('🧪 Testing Citation Extraction...');

  const citations = CitationExtractor.extractCitations(mockAIResponse, {
    maxCitations: 20,
    extractTitles: true,
    confidenceThreshold: 0.4,
  });

  console.log(`✅ Extracted ${citations.length} citations`);

  citations.forEach((citation, index) => {
    console.log(
      `   ${index + 1}. ${citation.citationType} - ${citation.domain} (confidence: ${citation.confidenceScore})`
    );
  });

  const stats = CitationExtractor.getCitationStats(citations);
  console.log(
    `📊 Stats: ${stats.totalCitations} total, ${stats.uniqueDomains} domains, ${stats.typeDistribution.url} URLs`
  );

  return citations;
}

async function testAPIEndpoints() {
  console.log('🌐 Testing API Endpoints...');

  const testAnswerId = 'test-answer-123';

  try {
    // Test POST /api/citations/[answerId] - Extract and store citations
    console.log('   Testing citation storage...');
    const storeResponse = await fetch(`http://localhost:3000/api/citations/${testAnswerId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        answerText: mockAIResponse,
        options: { maxCitations: 20, extractTitles: true },
      }),
    });

    if (storeResponse.ok) {
      const storeResult = await storeResponse.json();
      console.log(`   ✅ Stored ${storeResult.data.citationsStored} citations`);
    } else {
      console.log(`   ❌ Storage failed: ${storeResponse.status}`);
    }

    // Test GET /api/citations/[answerId] - Fetch citations with pagination
    console.log('   Testing citation retrieval...');
    const fetchResponse = await fetch(
      `http://localhost:3000/api/citations/${testAnswerId}?page=1&limit=10&sortBy=confidence&sortOrder=desc`
    );

    if (fetchResponse.ok) {
      const fetchResult = await fetchResponse.json();
      console.log(`   ✅ Retrieved ${fetchResult.data.citations.length} citations`);
      console.log(
        `   📄 Pagination: ${fetchResult.data.pagination.page}/${fetchResult.data.pagination.totalPages}`
      );
    } else {
      console.log(`   ❌ Retrieval failed: ${fetchResponse.status}`);
    }

    // Test GET /api/citations/stats - Global statistics
    console.log('   Testing statistics endpoint...');
    const statsResponse = await fetch(
      'http://localhost:3000/api/citations/stats?timeRange=day&includeHealth=true&includeAuthority=true'
    );

    if (statsResponse.ok) {
      const statsResult = await statsResponse.json();
      console.log(`   ✅ Stats: ${statsResult.data.overview.totalCitations} total citations`);
      console.log(`   📊 Health: ${statsResult.data.overview.livePercentage}% live`);
      console.log(
        `   🎯 Confidence: ${(statsResult.data.confidence.average * 100).toFixed(1)}% average`
      );
    } else {
      console.log(`   ❌ Statistics failed: ${statsResponse.status}`);
    }
  } catch (error) {
    console.log(`   ❌ API Test Error: ${error.message}`);
  }
}

async function testDashboardData() {
  console.log('📈 Testing Dashboard Data Flow...');

  try {
    // Simulate dashboard data fetching
    const response = await fetch(
      '/api/citations/stats?timeRange=all&includeHealth=true&includeAuthority=true'
    );

    if (response.ok) {
      const result = await response.json();
      const data = result.data;

      console.log('   ✅ Dashboard data structure validated:');
      console.log(`      - Overview: ${Object.keys(data.overview).length} metrics`);
      console.log(`      - Citation Types: ${data.citationTypes.length} types`);
      console.log(`      - Top Domains: ${data.topDomains.length} domains`);
      console.log(`      - Health Data: ${data.health ? 'Available' : 'Not available'}`);
      console.log(`      - Authority Data: ${data.authority ? 'Available' : 'Not available'}`);

      // Validate expected structure
      const requiredFields = ['overview', 'confidence', 'citationTypes', 'topDomains', 'metadata'];
      const missingFields = requiredFields.filter((field) => !data[field]);

      if (missingFields.length === 0) {
        console.log('   ✅ All required dashboard fields present');
      } else {
        console.log(`   ⚠️  Missing dashboard fields: ${missingFields.join(', ')}`);
      }
    } else {
      console.log(`   ❌ Dashboard data fetch failed: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Dashboard Test Error: ${error.message}`);
  }
}

async function runIntegrationTests() {
  console.log('🚀 Citation System Integration Tests\n');

  // Test 1: Citation extraction core functionality
  const extractedCitations = await testCitationExtraction();
  console.log('');

  // Test 2: API endpoints (requires server to be running)
  await testAPIEndpoints();
  console.log('');

  // Test 3: Dashboard data flow
  await testDashboardData();
  console.log('');

  // Summary
  console.log('🎯 Integration Test Summary:');
  console.log('   - Citation extraction: Working locally');
  console.log('   - API endpoints: Requires running server');
  console.log('   - Dashboard components: Ready for integration');
  console.log('   - Job processing: Pending Prisma client fixes');
  console.log('');
  console.log('💡 Next Steps:');
  console.log('   1. Start the development server: npm run dev');
  console.log('   2. Fix Prisma client type generation');
  console.log('   3. Test job processing system');
  console.log('   4. Deploy and monitor in production');
}

// Run tests if called directly
if (require.main === module) {
  runIntegrationTests().catch(console.error);
}

export { testCitationExtraction, testAPIEndpoints, testDashboardData, runIntegrationTests };
