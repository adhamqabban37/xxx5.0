import { hfHealthCheck, hfEmbeddings } from '../../src/lib/hf';

async function main() {
  try {
    const health = await hfHealthCheck();
    if ((health as any).status !== 'healthy') {
      console.error('HF health failed:', health);
      process.exit(2);
    }
    console.log('HF health OK:', health);

    const { embeddings, model } = await hfEmbeddings('hello world');
    console.log('Embeddings length:', embeddings[0]?.length, 'model:', model);
    if (!embeddings || !Array.isArray(embeddings[0]) || embeddings[0].length < 128) {
      console.error('Unexpected embedding shape');
      process.exit(3);
    }
    console.log('HF smoke passed');
    process.exit(0);
  } catch (e) {
    console.error('HF smoke error:', e);
    process.exit(1);
  }
}

main();
