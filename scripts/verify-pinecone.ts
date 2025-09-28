/* eslint-disable no-console */
import 'dotenv/config';
import { PineconeClient } from '@pinecone-database/pinecone';
import { File } from 'undici';
import { getPineconeStore } from '../src/lib/vectorstore';

// Polyfill File when the Node runtime does not provide it (e.g. dev server)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
if (typeof globalThis.File === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  globalThis.File = File;
}

const REQUIRED_ENV_VARS = [
  'OPENAI_API_KEY',
  'PINECONE_API_KEY',
  'PINECONE_ENVIRONMENT',
  'PINECONE_INDEX_NAME',
];

function validateEnv() {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

function formatNumber(value: number | undefined) {
  if (typeof value !== 'number') {
    return 'n/a';
  }
  return value.toLocaleString();
}

async function printIndexStats(client: PineconeClient, indexName: string) {
  console.log('\nFetching Pinecone index statistics...');
  const description = await client.describeIndex({ indexName });
  console.log(`Index state: ${description.status?.ready ? 'ready' : 'initialising'}`);
  console.log(`Index pods: ${description.database?.pods ?? 'unknown'}`);

  const index = client.Index(indexName);
  const stats = await index.describeIndexStats({
    describeIndexStatsRequest: {},
  });

  console.log('\nIndex statistics:');
  console.log(`- Dimension: ${stats.dimension}`);
  console.log(`- Total vector count: ${formatNumber(stats.totalVectorCount)}`);
  console.log(`- Namespaces:`);
  const namespaces = stats.namespaces ?? {};
  if (Object.keys(namespaces).length === 0) {
    console.log('  (none)');
  } else {
    Object.entries(namespaces).forEach(([namespace, info]) => {
      console.log(`  • ${namespace || '(default)'} -> vectors: ${formatNumber(info.vectorCount)}`);
    });
  }
}

async function runSampleQuery(sampleQuery: string) {
  console.log('\nRunning sample semantic search...');
  console.log(`Query: ${sampleQuery}`);

  const store = await getPineconeStore();
  const results = await store.search(sampleQuery, 5);

  if (!results.length) {
    console.log('No matching vectors were retrieved.');
    return;
  }

  results.forEach((result, idx) => {
    console.log(`
Result #${idx + 1}`);
    console.log(`  Score: ${result.score.toFixed(4)}`);
    console.log(`  Title: ${result.chunk.title}`);
    console.log(`  Chunk ID: ${result.chunk.id}`);
    console.log(`  Source URL: ${result.chunk.sourceUrl ?? 'n/a'}`);
    console.log(`  Preview: ${result.chunk.content.slice(0, 160).replace(/\s+/g, ' ')}...`);
  });
}

async function main() {
  validateEnv();

  const apiKey = process.env.PINECONE_API_KEY as string;
  const environment = process.env.PINECONE_ENVIRONMENT as string;
  const indexName = (process.env.PINECONE_INDEX_NAME ?? process.env.PINECONE_INDEX) as string;

  console.log('Connecting to Pinecone...');
  const client = new PineconeClient();
  await client.init({ apiKey, environment });
  console.log('Connection established.');

  await printIndexStats(client, indexName);

  const sampleQuery = process.argv.slice(2).join(' ') || process.env.PINECONE_SAMPLE_QUERY || 'Confluence 的权限模型是什么？';
  await runSampleQuery(sampleQuery);

  console.log('\nVerification complete ✅');
}

main().catch((error) => {
  console.error('Verification failed ❌', error);
  process.exit(1);
});
