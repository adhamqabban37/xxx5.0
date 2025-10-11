import { z } from 'zod';
import { HfInference } from '@huggingface/inference';
import { assertServerOnly } from '@/env';

// Zod schema for server env
const HfEnvSchema = z
  .object({
    HUGGINGFACE_API_TOKEN: z.string().optional(),
    HF_EMBEDDINGS_MODEL: z.string().default('sentence-transformers/all-MiniLM-L6-v2'),
    HF_SENTIMENT_MODEL: z.string().default('cardiffnlp/twitter-roberta-base-sentiment-latest'),
    HF_NER_MODEL: z.string().default('dslim/bert-base-NER'),
    HF_SUMMARIZATION_MODEL: z.string().default('facebook/bart-large-cnn'),
    HF_MOCK: z.string().optional(),
  })
  .refine(
    (data) => {
      // If not in mock mode, token is required
      if (
        !data.HF_MOCK &&
        (!data.HUGGINGFACE_API_TOKEN || data.HUGGINGFACE_API_TOKEN.length < 10)
      ) {
        return false;
      }
      return true;
    },
    {
      message: 'HUGGINGFACE_API_TOKEN is required and must be valid (unless HF_MOCK is set)',
    }
  );

export class HfAuthError extends Error {
  status = 401 as const;
  constructor(message = 'HuggingFace token missing or invalid') {
    super(message);
    this.name = 'HfAuthError';
  }
}

type ParsedEnv = z.infer<typeof HfEnvSchema>;

let cachedEnv: ParsedEnv | null = null;
let cachedHf: HfInference | null = null;

export function loadHfEnv(): ParsedEnv {
  assertServerOnly();
  if (cachedEnv) return cachedEnv;

  const parsed = HfEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    // If token is missing and not in mock mode, surface a 401-like error
    const hasToken = !!process.env.HUGGINGFACE_API_TOKEN;
    const isMock = !!process.env.HF_MOCK;
    if (!hasToken && !isMock) throw new HfAuthError();
    // Otherwise, throw validation error
    throw new Error(`Invalid HF env: ${parsed.error.message}`);
  }
  cachedEnv = parsed.data;
  return cachedEnv;
}

export function getHfClient(): HfInference {
  assertServerOnly();
  if (cachedHf) return cachedHf;
  const env = loadHfEnv();
  cachedHf = new HfInference(env.HUGGINGFACE_API_TOKEN);
  return cachedHf;
}

// Helpers
export async function hfHealthCheck() {
  const env = loadHfEnv();
  const mock = env.HF_MOCK === '1';
  const start = Date.now();
  if (mock) {
    return { status: 'healthy', latency: 5, model: env.HF_EMBEDDINGS_MODEL } as const;
  }
  const hf = getHfClient();
  try {
    const res = await hf.featureExtraction({ model: env.HF_EMBEDDINGS_MODEL, inputs: 'ok' });
    const latency = Date.now() - start;
    if (!res) throw new Error('No response');
    return { status: 'healthy', latency, model: env.HF_EMBEDDINGS_MODEL } as const;
  } catch (e: any) {
    if (String(e?.message || '').includes('401')) throw new HfAuthError();
    return { status: 'unhealthy', error: e instanceof Error ? e.message : String(e) } as const;
  }
}

export async function hfEmbeddings(texts: string | string[]) {
  const env = loadHfEnv();
  const mock = env.HF_MOCK === '1';
  const inputs = Array.isArray(texts) ? texts : [texts];
  if (inputs.length === 0) throw new Error('No texts provided');
  if (mock) {
    // deterministic mock vectors (dim=384)
    const embeddings = inputs.map((t) => {
      const dim = 384;
      const out = new Array(dim).fill(0).map((_, i) => Math.sin((hash(t) + i) * 0.01) * 0.5);
      return out;
    });
    return { embeddings, model: `${env.HF_EMBEDDINGS_MODEL} (mock)` } as const;
  }
  const hf = getHfClient();
  const res = await hf.featureExtraction({ model: env.HF_EMBEDDINGS_MODEL, inputs });
  const embeddings =
    Array.isArray(inputs) && inputs.length === 1 ? [asVector(res)] : (res as number[][]);
  return { embeddings, model: env.HF_EMBEDDINGS_MODEL } as const;
}

export async function hfSentiment(text: string) {
  const env = loadHfEnv();
  if (env.HF_MOCK === '1') return { label: 'neutral', score: 0.5 } as const;
  const hf = getHfClient();
  const res = await hf.textClassification({
    model: env.HF_SENTIMENT_MODEL,
    inputs: text.slice(0, 512),
  });
  const top = Array.isArray(res) ? res[0] : (res as any);
  if (!top?.label || typeof top?.score !== 'number') throw new Error('Invalid sentiment response');
  return { label: String(top.label).toLowerCase(), score: top.score } as const;
}

export async function hfEntities(text: string) {
  const env = loadHfEnv();
  if (env.HF_MOCK === '1') return [] as const;
  const hf = getHfClient();
  const res = await hf.tokenClassification({
    model: env.HF_NER_MODEL,
    inputs: text.slice(0, 1024),
  });
  // Normalize output
  const arr = Array.isArray(res) ? res : [res];
  return arr.map((r: any) => ({
    entity: r.entity_group || r.entity || 'MISC',
    score: r.score,
    word: r.word,
  }));
}

export async function hfSummarize(text: string) {
  const env = loadHfEnv();
  if (env.HF_MOCK === '1')
    return { summary_text: text.slice(0, 120) + (text.length > 120 ? '...' : '') } as const;
  const hf = getHfClient();
  const res = await hf.summarization({
    model: env.HF_SUMMARIZATION_MODEL,
    inputs: text.slice(0, 2000),
  });
  const out = Array.isArray(res) ? res[0] : (res as any);
  if (!out?.summary_text) throw new Error('Invalid summarization response');
  return { summary_text: out.summary_text } as const;
}

function asVector(x: any): number[] {
  return Array.isArray(x?.[0]) ? (x[0] as number[]) : (x as number[]);
}

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}
