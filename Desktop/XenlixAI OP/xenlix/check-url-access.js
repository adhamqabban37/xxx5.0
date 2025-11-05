// URL Access Monitor for XenlixAI
// Run this to see what's currently accessing your URLs

console.log('🔍 Checking URL Access for XenlixAI...\n');

async function checkServices() {
  const services = [
    { name: 'Next.js App', url: 'http://localhost:3000/api/health' },
    { name: 'Crawl4AI Service', url: 'http://localhost:8000/health' },
    { name: 'Crawl4AI Service Alt', url: 'http://localhost:8001/health' },
    { name: 'Production Site', url: 'https://xenlix.ai/api/health' },
  ];

  for (const service of services) {
    try {
      console.log(`Checking ${service.name}...`);
      const response = await fetch(service.url, {
        method: 'GET',
        headers: {
          'User-Agent': 'XenlixAI-Monitor/1.0',
        },
        timeout: 5000,
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${service.name}: Online`);
        console.log(`   Status: ${data.status || 'OK'}`);
        console.log(`   Response time: ${response.headers.get('x-response-time') || 'N/A'}`);
      } else {
        console.log(`❌ ${service.name}: Error ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${service.name}: Offline - ${error.message}`);
    }
    console.log('');
  }
}

// Check what user agents are configured
console.log('📝 Configured User Agents:');
console.log('- XenlixAI-Bot/1.0 (+https://xenlix.ai/bot)');
console.log('- XenlixAI-SEO-Extractor/1.0');
console.log('- XenlixAI-Monitor/1.0');
console.log('- XenlixAI-AEO-Platform/1.0');
console.log('- XenlixAI-AEO-Validator/1.0');
console.log('');

checkServices();
