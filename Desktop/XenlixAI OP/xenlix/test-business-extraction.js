/**
 * Test script for enhanced business profile extraction
 */

// Import the business profile extractor
import { getBusinessProfileFromUrl } from './src/lib/business-profile-extractor.js';

/**
 * Test the enhanced business profile extraction
 */
async function testBusinessExtraction() {
  console.log('🚀 Testing Enhanced Business Profile Extraction\n');

  // Test URLs with different structures
  const testUrls = [
    'https://www.apple.com',
    'https://www.starbucks.com',
    'https://www.nike.com',
    'https://www.tesla.com',
  ];

  for (const url of testUrls) {
    try {
      console.log(`\n📋 Testing: ${url}`);
      console.log('═'.repeat(50));

      const startTime = Date.now();
      const profile = await getBusinessProfileFromUrl(url);
      const endTime = Date.now();

      console.log(`⏱️  Extraction took: ${endTime - startTime}ms`);
      console.log('\n📊 Results:');
      console.log(`  🏢 Business Name: ${profile.businessName || 'Not found'}`);
      console.log(`  📍 Address: ${profile.address || 'Not found'}`);
      console.log(`  📞 Phone: ${profile.phone || 'Not found'}`);
      console.log(`  ⭐ Google Rating: ${profile.googleRating || 'Not found'}`);
      console.log(`  📝 Review Count: ${profile.googleReviewCount || 'Not found'}`);
      console.log(`  🖼️  Logo URL: ${profile.logoUrl || 'Not found'}`);

      if (Object.keys(profile.socialProfiles).length > 0) {
        console.log(`  🔗 Social Profiles:`);
        for (const [platform, url] of Object.entries(profile.socialProfiles)) {
          console.log(`    ${platform}: ${url}`);
        }
      } else {
        console.log(`  🔗 Social Profiles: None found`);
      }
    } catch (error) {
      console.error(`❌ Error testing ${url}:`, error.message);
    }
  }

  console.log('\n✅ Testing complete!');
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testBusinessExtraction().catch(console.error);
}

export { testBusinessExtraction };
