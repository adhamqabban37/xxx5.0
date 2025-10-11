// Server-only environment accessor for service URLs and secrets
// Do not import this in client components

export const env = {
  CRAWL4AI_URL:
    process.env.CRAWL4AI_URL || process.env.CRAWL4AI_SERVICE_URL || 'http://localhost:8001',
};

export function assertServerOnly() {
  if (typeof window !== 'undefined') {
    throw new Error('env.ts must not be used in the browser. Import only from server code.');
  }
}
