/*
  Crawl4AI smoke test:
  - checks /health
  - calls /crawl?url=https://example.com
  - asserts response shape minimally
*/
import { healthCheck, crawl } from '../../src/lib/crawl4ai';

async function main() {
  const ok = await healthCheck();
  if (!ok) {
    console.error(
      '❌ Crawl4AI /health not ok. Ensure docker is running: docker compose up -d crawl4ai'
    );
    process.exit(1);
  }
  console.log('✅ /health ok');

  const res = await crawl('https://example.com');
  if (!res || res.status !== 'success' || !res.url || !res.timestamp) {
    console.error('❌ /crawl result missing required fields');
    process.exit(1);
  }
  console.log('✅ /crawl ok:', {
    url: res.url,
    title: res.title,
    word_count: res.word_count,
    h1_count: Array.isArray(res.headings?.h1) ? res.headings.h1.length : 0,
  });
}

main().catch((e) => {
  console.error('❌ Smoke test failed:', e);
  process.exit(1);
});
