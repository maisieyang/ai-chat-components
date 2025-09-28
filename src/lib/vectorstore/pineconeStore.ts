import { PineconeClient, type IndexOperationsApi } from '@pinecone-database/pinecone';
import { File } from 'undici';
import { embedTexts, embedText } from '../embeddings';
import type { PageChunk } from '../confluence/chunk';

// Pinecone's client (via undici) expects a global File object when running under Node.
// Next.js edge runtime already provides it, but the Node runtime in development may not.
// Assign a polyfill from undici when needed.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
if (typeof globalThis.File === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  globalThis.File = File;
}

const INDEX_DIMENSION = 1536;
const UPSERT_BATCH_SIZE = 50;
const INDEX_METRIC = 'cosine';
const DEFAULT_NAMESPACE = process.env.PINECONE_NAMESPACE ?? 'default';

type ChunkMetadata = {
  title: string;
  url?: string;
  content: string;
  chunkId: string;
  pageId: string;
  chunkIndex: number;
};

type PineconeVector = {
  id: string;
  values: number[];
  metadata?: ChunkMetadata;
};

export interface RetrievedChunk {
  id: string;
  pageId: string;
  title: string;
  content: string;
  sourceUrl?: string;
  chunkIndex: number;
}

export interface SearchResult {
  chunk: RetrievedChunk;
  score: number;
}

async function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export class PineconeStore {
  private client: PineconeClient | null = null;
  private index: IndexOperationsApi | null = null;
  private readonly indexName: string;
  private readonly namespace: string;

  constructor() {
    const indexName = process.env.PINECONE_INDEX_NAME ?? process.env.PINECONE_INDEX;
    if (!indexName) {
      throw new Error('PINECONE_INDEX_NAME (or PINECONE_INDEX) environment variable is required.');
    }

    this.indexName = indexName;
    this.namespace = DEFAULT_NAMESPACE;
  }

  async ensureReady() {
    await this.getIndex();
  }

  async upsertChunks(chunks: PageChunk[]) {
    if (chunks.length === 0) {
      return;
    }

    const index = await this.getIndex();

    for (let start = 0; start < chunks.length; start += UPSERT_BATCH_SIZE) {
      const batch = chunks.slice(start, start + UPSERT_BATCH_SIZE);
      const embeddings = await embedTexts(batch.map((chunk) => chunk.content));

      const vectors: PineconeVector[] = embeddings.map((vector, idx) => {
        const chunk = batch[idx];
        return {
          id: chunk.id,
          values: vector,
          metadata: {
            title: chunk.title,
            url: chunk.sourceUrl ?? undefined,
            content: chunk.content,
            chunkId: chunk.id,
            pageId: chunk.pageId,
            chunkIndex: chunk.chunkIndex,
          },
        };
      });

      await index.upsert({
        upsertRequest: {
          vectors,
          namespace: this.namespace,
        },
      });
    }
  }

  async search(query: string, topK = 5): Promise<SearchResult[]> {
    const index = await this.getIndex();
    const queryEmbedding = await embedText(query);

    const response = await index.query({
      queryRequest: {
        vector: queryEmbedding,
        topK,
        includeMetadata: true,
        namespace: this.namespace,
      },
    });

    const matches = response.matches ?? [];

    return matches
      .filter((match) => match.metadata && typeof match.metadata === 'object')
      .map((match) => {
        const metadata = match.metadata as ChunkMetadata;
        return {
          chunk: {
            id: metadata.chunkId,
            pageId: metadata.pageId,
            title: metadata.title,
            content: metadata.content,
            sourceUrl: metadata.url,
            chunkIndex: metadata.chunkIndex,
          },
          score: match.score ?? 0,
        } as SearchResult;
      });
  }

  private async getIndex(): Promise<IndexOperationsApi> {
    if (this.index) {
      return this.index;
    }

    const client = await this.getClient();
    await this.ensureIndexExists(client);
    this.index = client.Index(this.indexName);
    return this.index;
  }

  private async getClient(): Promise<PineconeClient> {
    if (this.client) {
      return this.client;
    }

    const apiKey = process.env.PINECONE_API_KEY;
    const environment = process.env.PINECONE_ENVIRONMENT;

    if (!apiKey || !environment) {
      throw new Error('PINECONE_API_KEY and PINECONE_ENVIRONMENT environment variables are required.');
    }

    const client = new PineconeClient();
    await client.init({ apiKey, environment });
    this.client = client;

    return client;
  }

  private async ensureIndexExists(client: PineconeClient) {
    const existingIndexes = await client.listIndexes();
    if (existingIndexes.includes(this.indexName)) {
      return;
    }

    await client.createIndex({
      createRequest: {
        name: this.indexName,
        dimension: INDEX_DIMENSION,
        metric: INDEX_METRIC,
        pods: 1,
        replicas: 1,
        podType: 'p1.x1',
      },
    });

    for (let attempt = 0; attempt < 30; attempt += 1) {
      const description = await client.describeIndex({ indexName: this.indexName });
      if (description.status?.ready) {
        return;
      }
      await sleep(6000);
    }

    throw new Error(`Timed out waiting for Pinecone index "${this.indexName}" to be ready.`);
  }
}

let storePromise: Promise<PineconeStore> | null = null;

export async function getPineconeStore(): Promise<PineconeStore> {
  if (!storePromise) {
    const store = new PineconeStore();
    storePromise = (async () => {
      await store.ensureReady();
      return store;
    })();
  }

  return storePromise;
}

export type { PineconeStore };
