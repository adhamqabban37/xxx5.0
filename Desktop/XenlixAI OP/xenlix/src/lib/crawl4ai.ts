import { env, assertServerOnly } from '../env';

assertServerOnly();

export interface CrawlResult {
  url: string;
  status: string;
  timestamp: string;
  title?: string;
  meta_description?: string;
  canonical_url?: string;
  word_count: number;
  headings: Record<string, string[]>;
  json_ld_schemas: unknown[];
  schema_types: string[];
  has_faq_schema: boolean;
  has_local_business_schema: boolean;
  has_article_schema: boolean;
  open_graph: Record<string, string | undefined>;
  twitter_card: Record<string, string | undefined>;
  content_analysis: Record<string, unknown>;
  raw_html?: string;
  extracted_content?: string;
}

const DEFAULT_TIMEOUT_MS = 15000;

async function fetchWithTimeout(url: string, init: RequestInit & { timeout?: number } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), init.timeout ?? DEFAULT_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

async function withRetry<T>(fn: () => Promise<T>, retries = 2, backoffMs = 300): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i === retries) break;
      await new Promise((r) => setTimeout(r, backoffMs * (i + 1)));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('Unknown error');
}

export async function healthCheck(): Promise<boolean> {
  const url = `${env.CRAWL4AI_URL}/health`;
  const res = await withRetry(() => fetchWithTimeout(url, { method: 'GET', timeout: 5000 }));
  if (!res.ok) return false;
  try {
    const data = await res.json();
    return data?.status === 'ok';
  } catch {
    return false;
  }
}

export async function crawl(urlToCrawl: string): Promise<CrawlResult> {
  const url = `${env.CRAWL4AI_URL}/crawl?url=${encodeURIComponent(urlToCrawl)}`;
  const res = await withRetry(() => fetchWithTimeout(url, { method: 'GET' }));
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Crawl4AI error: ${res.status} ${text}`);
  }
  return res.json();
}
