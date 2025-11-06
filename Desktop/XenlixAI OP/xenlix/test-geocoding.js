// Quick test script for geocoding functionality
import { geocodeAddress, extractDomain } from '../src/lib/geocoding';

async function testGeocoding() {
  console.log('Testing geocoding functionality...');

  // Test case 1: Simple address
  const testAddress = '1600 Amphitheatre Parkway, Mountain View, CA';
  const testDomain = 'google.com';

  console.log(`\nTesting address: ${testAddress}`);
  console.log(`Domain: ${testDomain}`);

  try {
    const result = await geocodeAddress(testAddress, testDomain);
    if (result) {
      console.log('✅ Geocoding successful!');
      console.log(`Coordinates: ${result.latitude}, ${result.longitude}`);
      console.log(`Provider: ${result.provider}`);
      console.log(`Accuracy: ${result.accuracy}`);
      console.log(`Formatted: ${result.formatted_address}`);
    } else {
      console.log('❌ Geocoding failed - no results');
    }
  } catch (error) {
    console.error('❌ Geocoding error:', error);
  }

  // Test domain extraction
  console.log('\nTesting domain extraction:');
  console.log('https://www.example.com/path ->', extractDomain('https://www.example.com/path'));
  console.log('example.com ->', extractDomain('example.com'));
}

// Run the test
testGeocoding().catch(console.error);
