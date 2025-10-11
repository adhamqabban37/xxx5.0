'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const seo_engine_1 = require('./src/lib/seo-engine');
// Test business profile
const testBusiness = {
  businessName: 'Elite Auto Care',
  industry: 'automotive',
  services: ['car detailing', 'paint protection', 'ceramic coating'],
  city: 'Austin',
  state: 'Texas',
  description: 'Premium automotive detailing services with eco-friendly products',
  contact: {
    phone: '(512) 555-0123',
    email: 'info@eliteautocare.com',
    address: '123 Auto Way, Austin, TX 78701',
  },
};
async function testSEOEngine() {
  try {
    // Initialize the SEO engine with business profile
    const seoEngine = new seo_engine_1.SEORecommendationEngine(testBusiness);
    // Generate recommendations
    const recommendations = await seoEngine.generateRecommendations();
    console.log('📋 Business Profile:');
    console.log(JSON.stringify(testBusiness, null, 2));
    console.log('\n✨ SEO Recommendations Generated:');
    console.log(`🎯 Primary Title: ${recommendations.recommendations.metaTags.title.primary}`);
    console.log(
      `📝 Meta Description: ${recommendations.recommendations.metaTags.description.primary}`
    );
    console.log(`🏷️ H1 Heading: ${recommendations.recommendations.headings.h1.primary}`);
    console.log('\n🔑 Primary Keywords:');
    recommendations.recommendations.keywordStrategy.primary.forEach((kw, index) => {
      console.log(`  ${index + 1}. ${kw.keyword} (Difficulty: ${kw.difficulty})`);
    });
    console.log('\n📍 Local Content Ideas:');
    recommendations.recommendations.localContent.localTopics.slice(0, 5).forEach((topic, index) => {
      console.log(`  ${index + 1}. ${topic.topic} (Type: ${topic.contentType})`);
    });
    console.log('\n⚡ Immediate Action Plan:');
    recommendations.actionPlan.immediate.forEach((action, index) => {
      console.log(
        `  ${index + 1}. ${action.task} (Impact: ${action.impact}, Effort: ${action.effort}/10)`
      );
    });
    console.log('\n✅ SEO Engine Test Completed Successfully!');
  } catch (error) {
    console.error('❌ Error testing SEO engine:', error);
  }
}
// Run the test
testSEOEngine();
