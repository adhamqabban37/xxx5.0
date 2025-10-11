/**
 * Test script for the getBusinessProfileFromUrl function
 * Run with: node test-business-profile.js
 */

import { getBusinessProfileFromUrl } from './src/lib/business-profile-extractor.ts';

async function testBusinessProfile() {
  console.log('🧪 Testing Business Profile Extraction...\n');

  // Test with a sample URL
  const testUrl = 'https://example.com';

  try {
    console.log(`Testing URL: ${testUrl}`);
    const profile = await getBusinessProfileFromUrl(testUrl);

    console.log('\n📊 Extraction Results:');
    console.log('='.repeat(50));
    console.log(`Business Name: ${profile.businessName || 'Not found'}`);
    console.log(`Address: ${profile.address || 'Not found'}`);
    console.log(`Phone: ${profile.phone || 'Not found'}`);
    console.log(`Google Reviews: ${profile.googleReviewCount || 'Not found'}`);
    console.log(`Google Rating: ${profile.googleRating || 'Not found'}`);
    console.log(`Logo URL: ${profile.logoUrl || 'Not found'}`);

    console.log('\n🔗 Social Profiles:');
    if (Object.keys(profile.socialProfiles).length > 0) {
      Object.entries(profile.socialProfiles).forEach(([platform, url]) => {
        console.log(`  ${platform}: ${url}`);
      });
    } else {
      console.log('  No social profiles found');
    }

    console.log('\n✅ Test completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testBusinessProfile();
