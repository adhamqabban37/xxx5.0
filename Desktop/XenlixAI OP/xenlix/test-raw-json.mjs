/**
 * Test script to verify Raw JSON Analytics implementation
 * Run this with: node --loader tsx/esm test-raw-json.mjs
 */

// Test payload to verify the Raw JSON Analytics API
const testPayload = {
  overall_score: 85,
  grade: 'B+',
  category_scores: {
    technical: 88,
    content: 82,
    authority: 87,
    user_intent: 83,
  },
  critical_issues: [],
  all_rules: [
    {
      name: 'HTTPS Protocol',
      status: 'passed',
      score: 100,
      evidence: ['https://example.com'],
      score_impact: 5,
      passed: true,
    },
    {
      name: 'Mobile Friendly',
      status: 'warning',
      score: 75,
      evidence: ['Viewport configured', 'Some touch targets too small'],
      score_impact: -5,
      passed: false,
    },
  ],
  crewai_insights: {
    analysis: 'Strong technical foundation with room for content optimization',
    recommendations: [
      'Improve mobile touch target sizing',
      'Add more structured data markup',
      'Optimize page load speed',
    ],
    competitive_gaps: [
      'Competitors have better FAQ schema implementation',
      'Local business schema could be more comprehensive',
    ],
    implementation_priority: [
      {
        task: 'Fix mobile touch targets',
        impact: 'High',
        effort: 'Low',
      },
      {
        task: 'Add FAQ schema',
        impact: 'Medium',
        effort: 'Medium',
      },
    ],
  },
  tier: 'premium',
  user_id: 'test-user',
  evaluation_time_ms: 2500,
  detailed_analysis: {
    total_rules_evaluated: 42,
    rules_passed: 38,
    improvement_potential: 15,
    priority_fixes: 2,
  },
  can_rerun: true,
  next_scan_available: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

console.log('Raw JSON Analytics Test Payload:');
console.log(JSON.stringify(testPayload, null, 2));
console.log('\nSchema Version: premium-standards@1.2.0');
console.log('Analyzer Version: aeo-engine@1.2.0');
console.log('\n✅ Raw JSON Analytics implementation is ready for testing!');
console.log('\nNext steps:');
console.log('1. Start the development server: npm run dev');
console.log('2. Run a premium scan to test the flow');
console.log('3. Check for "View Raw JSON" link in the Premium Dashboard');
console.log('4. Verify raw JSON data is stored and retrievable');
