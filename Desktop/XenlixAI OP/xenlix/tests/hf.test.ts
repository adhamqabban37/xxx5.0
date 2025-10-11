import { strict as assert } from 'assert';
import { hfEmbeddings, hfSentiment, hfEntities, hfSummarize } from '../src/lib/hf';

async function run() {
  process.env.HF_MOCK = '1';
  process.env.HUGGINGFACE_API_TOKEN =
    process.env.HUGGINGFACE_API_TOKEN || 'hf_mock_token_for_tests';
  const emb = await hfEmbeddings(['a', 'b']);
  assert.equal(emb.embeddings.length, 2);
  assert.ok(Array.isArray(emb.embeddings[0]));

  const sent = await hfSentiment('I love it');
  assert.ok(typeof sent.label === 'string');

  const ents = await hfEntities('John Doe works at Acme Corp.');
  assert.ok(Array.isArray(ents));

  const sum = await hfSummarize('This is a long text that should be summarized. '.repeat(10));
  assert.ok(typeof sum.summary_text === 'string');

  console.log('HF unit tests passed (mock mode)');
}

run().catch((e) => {
  console.error('HF unit tests failed', e);
  process.exit(1);
});
