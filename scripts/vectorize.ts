import { config as loadEnv } from 'dotenv';
import { File as NodeFile } from 'node:buffer';
import { buildKnowledgeBase } from '../src/lib/pipeline/build';

const globalWithFile = globalThis as unknown as { File?: typeof NodeFile };
if (typeof globalWithFile.File === 'undefined') {
  globalWithFile.File = NodeFile;
}

loadEnv();
loadEnv({ path: '.env.local', override: true });

const REQUIRED_ENV_VARS = [
  'OPENAI_API_KEY',
  'PINECONE_API_KEY',
  'PINECONE_INDEX_NAME',
];

const MAX_RETRIES = Number(process.env.VECTORIZE_MAX_RETRIES ?? '3');
const RETRY_DELAY_MS = Number(process.env.VECTORIZE_RETRY_DELAY_MS ?? '5000');

function validateEnv() {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const hasHost = Boolean(process.env.PINECONE_HOST || process.env.PINECONE_INDEX_HOST);
  const hasEnvironment = Boolean(process.env.PINECONE_ENVIRONMENT);

  if (!hasHost && !hasEnvironment) {
    throw new Error('Set PINECONE_HOST (or PINECONE_INDEX_HOST) for serverless indexes, or PINECONE_ENVIRONMENT for legacy indexes.');
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runVectorization() {
  validateEnv();

  const maxPages = Number(process.env.CONFLUENCE_MAX_PAGES ?? '5');
  const pageLimit = Number(process.env.CONFLUENCE_PAGE_LIMIT ?? '25');
  const chunkMinTokens = Number(process.env.CHUNK_MIN_TOKENS ?? '300');
  const chunkMaxTokens = Number(process.env.CHUNK_MAX_TOKENS ?? '800');

  console.log('Starting Confluence vectorization job');
  console.log('--------------------------------------');
  console.log(`Max pages: ${maxPages}`);
  console.log(`Page limit per request: ${pageLimit}`);
  console.log(`Chunk token range: ${chunkMinTokens}-${chunkMaxTokens}`);

  const start = Date.now();

  const knowledgeBase = await buildKnowledgeBase({
    maxPages,
    pageLimit,
    chunkMinTokens,
    chunkMaxTokens,
  });

  const duration = (Date.now() - start) / 1000;

  console.log('Vectorization completed successfully.');
  console.log(`Embedding model version: ${knowledgeBase.stats.embedVersion}`);
  console.log(`Pages scanned: ${knowledgeBase.stats.totalPages}`);
  console.log(`Pages embedded: ${knowledgeBase.stats.embeddedPages}`);
  console.log(`Pages skipped: ${knowledgeBase.stats.skippedPages}`);
  console.log(`Chunks upserted: ${knowledgeBase.stats.embeddedChunks}`);
  console.log(`Elapsed time: ${duration.toFixed(2)}s`);
  console.log('Metadata log written to logs/vectorize-last-run.json');
}

async function main() {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      console.log(`Attempt ${attempt}/${MAX_RETRIES}`);
      await runVectorization();
      console.log('Vectorization job finished ✅');
      process.exit(0);
    } catch (error) {
      console.error(`Vectorization failed on attempt ${attempt}:`, error);
      if (attempt === MAX_RETRIES) {
        console.error('Max retries reached. Exiting with failure ❌');
        process.exit(1);
      }
      console.log(`Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      await sleep(RETRY_DELAY_MS);
    }
  }
}

main().catch((error) => {
  console.error('Unexpected vectorization error:', error);
  process.exit(1);
});
