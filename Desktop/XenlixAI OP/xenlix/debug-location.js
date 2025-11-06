// Debug script to test location extraction
const fetch = require('node-fetch');

async function debugLocationExtraction() {
  try {
    // Test with a business that should have address information
    const testUrls = [
      'https://www.starbucks.com/store-locator/store/1008552/pike-place-1912-pike-pl-seattle-wa-98101-us',
      'https://www.mcdonalds.com',
      'https://www.apple.com/retail/fifthavenue/',
    ];

    for (const url of testUrls) {
      console.log(`\n=== Testing: ${url} ===`);

      const response = await fetch('http://localhost:3000/api/analyze/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Business Info:', {
          name: data.businessInfo?.name,
          address: data.businessInfo?.address,
          lat: data.businessInfo?.lat,
          lng: data.businessInfo?.lng,
          phone: data.businessInfo?.phone,
        });

        console.log('Location Status:', {
          hasAddress: !!data.businessInfo?.address,
          hasCoordinates: !!(data.businessInfo?.lat && data.businessInfo?.lng),
          coordinatesValid:
            typeof data.businessInfo?.lat === 'number' &&
            typeof data.businessInfo?.lng === 'number',
        });
      } else {
        console.log('API Error:', response.status, response.statusText);
      }
    }
  } catch (error) {
    console.error('Debug failed:', error);
  }
}

debugLocationExtraction();
