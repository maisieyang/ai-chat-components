import { config as loadEnv } from 'dotenv';
import { File as NodeFile } from 'node:buffer';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { clearVectorCache, loadVectorCache } from '../src/lib/pipeline/vectorCache';
import { getPineconeStore } from '../src/lib/vectorstore';

const globalWithFile = globalThis as unknown as { File?: typeof NodeFile };
if (typeof globalWithFile.File === 'undefined') {
  globalWithFile.File = NodeFile;
}

loadEnv();
loadEnv({ path: '.env.local', override: true });

const REQUIRED_ENV_VARS = ['PINECONE_API_KEY'];

function ensureEnv() {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const hasHost = Boolean(process.env.PINECONE_HOST || process.env.PINECONE_INDEX_HOST);
  const hasEnvironment = Boolean(process.env.PINECONE_ENVIRONMENT);

  if (!hasHost && !hasEnvironment) {
    throw new Error(
      'Set PINECONE_HOST (or PINECONE_INDEX_HOST) for serverless indexes, or PINECONE_ENVIRONMENT for legacy indexes.'
    );
  }
}

function flagEnabled(name: string) {
  return process.argv.includes(name);
}

function envToggle(name: string): boolean {
  const value = process.env[name];
  if (!value) {
    return false;
  }
  return ['1', 'true', 'yes', 'y'].includes(value.trim().toLowerCase());
}

async function confirmAction(summary: string): Promise<boolean> {
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const answer = await rl.question(`${summary}\nProceed? (y/N) `);
    return ['y', 'yes'].includes(answer.trim().toLowerCase());
  } finally {
    rl.close();
  }
}

async function main() {
  ensureEnv();

  const force = flagEnabled('--force') || flagEnabled('--yes') || envToggle('CLEAR_EMBEDDINGS_FORCE');
  const dryRun = flagEnabled('--dry-run');
  const skipPinecone = flagEnabled('--skip-pinecone');
  const keepCache = flagEnabled('--keep-cache');

  const cacheSnapshot = await loadVectorCache();
  const cachedPages = Object.keys(cacheSnapshot.pages).length;

  const store = skipPinecone ? null : await getPineconeStore();
  const namespace = store?.getNamespace();

  const tasks: string[] = [];
  if (!skipPinecone) {
    tasks.push(`delete all vectors from Pinecone namespace "${namespace}"`);
  }
  if (!keepCache) {
    tasks.push('remove local data/vector-cache.json snapshot');
  }

  if (tasks.length === 0) {
    console.log('No clearing operations requested. Use --skip-pinecone/--keep-cache wisely.');
    return;
  }

  const summary = `About to ${tasks.join(' and ')}. Cached pages tracked locally: ${cachedPages}.`;

  if (!force && !dryRun) {
    const confirmed = await confirmAction(summary);
    if (!confirmed) {
      console.log('Aborted. No changes made.');
      return;
    }
  } else {
    console.log(summary);
  }

  if (dryRun) {
    console.log('Dry run complete. No changes were applied.');
    return;
  }

  if (!skipPinecone && store) {
    console.log(`Clearing Pinecone namespace "${namespace}"...`);
    await store.clearNamespace();
    console.log('Pinecone namespace cleared.');
  }

  if (!keepCache) {
    console.log('Removing local vector cache...');
    await clearVectorCache();
    console.log('Local vector cache removed.');
  }

  console.log('Embedding storage cleared successfully. You can now rerun the vectorization script.');
}

main().catch((error) => {
  console.error('Failed to clear embeddings:', error);
  process.exit(1);
});

