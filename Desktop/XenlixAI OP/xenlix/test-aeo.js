const testAEOAnalysis = async () => {
  try {
    console.log('🧪 Testing AEO Analysis...');

    const response = await fetch('http://localhost:3000/api/aeo-analyzer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://example.com',
        queries: ['what is example', 'how does example work', 'example benefits'],
      }),
    });

    const result = await response.json();

    console.log('AEO Analysis Status:', response.status);
    console.log('AEO Analysis Result:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log('✅ AEO Analysis successful!');
    } else {
      console.log('❌ AEO Analysis failed:', result.error);
    }
  } catch (error) {
    console.error('❌ AEO Analysis test failed:', error);
  }
};

testAEOAnalysis();
