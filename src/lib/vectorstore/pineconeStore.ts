import { Pinecone, type Index } from '@pinecone-database/pinecone';
import { File as NodeFile } from 'node:buffer';
import { embedTexts, embedText } from '../embeddings';
import type { PageChunk } from '../confluence/chunk';

// Pinecone's client (via undici) expects a global File object when running under Node.
// Next.js edge runtime already provides it, but the Node runtime in development may not.
// Assign a polyfill from undici when needed.
const globalWithFile = globalThis as unknown as { File?: typeof NodeFile };
if (typeof globalWithFile.File === 'undefined') {
  globalWithFile.File = NodeFile;
}

const UPSERT_BATCH_SIZE = 50;
const DEFAULT_NAMESPACE = process.env.PINECONE_NAMESPACE ?? 'default';

interface ParsedHost {
  environment: string;
  projectId?: string;
}

function parsePineconeHost(indexName: string, host: string): ParsedHost {
  try {
    const normalizedHost = host.startsWith('http') ? host : `https://${host}`;
    const url = new URL(normalizedHost);
    const hostname = url.hostname;

    const svcSplit = hostname.split('.svc.');
    if (svcSplit.length !== 2) {
      throw new Error('Host must include a ".svc." segment, e.g. my-index.svc.region.pinecone.io');
    }

    const [leftPart, rightPart] = svcSplit;
    const environment = rightPart.replace(/\.pinecone\.io$/i, '');

    if (!environment) {
      throw new Error('Could not derive environment from host.');
    }

    const expectedPrefix = `${indexName}-`;
    const projectId = leftPart.startsWith(expectedPrefix) ? leftPart.slice(expectedPrefix.length) : undefined;

    return { environment, projectId };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid PINECONE_HOST value: ${message}`);
  }
}

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

export class PineconeStore {
  private pinecone: Pinecone | null = null;
  private index: Index | null = null;
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
    const target = this.namespace ? index.namespace(this.namespace) : index;

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

      await target.upsert(vectors);
    }
  }

  async search(query: string, topK = 5): Promise<SearchResult[]> {
    const index = await this.getIndex();
    const target = this.namespace ? index.namespace(this.namespace) : index;
    const queryEmbedding = await embedText(query);

    const response = await target.query({
      vector: queryEmbedding,
      topK,
      includeMetadata: true,
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

  private async getIndex(): Promise<Index> {
    if (this.index) {
      return this.index;
    }

    const pinecone = await this.getPinecone();
    this.index = pinecone.index(this.indexName);
    return this.index;
  }

  private async getPinecone(): Promise<Pinecone> {
    if (this.pinecone) {
      return this.pinecone;
    }

    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) {
      throw new Error('PINECONE_API_KEY environment variable is required.');
    }

    const host = process.env.PINECONE_HOST?.trim();
    const environment = process.env.PINECONE_ENVIRONMENT?.trim();

    if (!host && !environment) {
      throw new Error('Set PINECONE_HOST for serverless indexes or PINECONE_ENVIRONMENT for legacy indexes.');
    }

    let resolvedEnvironment = environment;
    let resolvedProjectId: string | undefined;

    if (host) {
      const parsed = parsePineconeHost(this.indexName, host);
      resolvedEnvironment = parsed.environment;
      resolvedProjectId = parsed.projectId;
    }

    if (!resolvedEnvironment) {
      throw new Error('Unable to determine Pinecone environment. Check PINECONE_HOST or PINECONE_ENVIRONMENT.');
    }

    this.pinecone = new Pinecone({
      apiKey,
      environment: resolvedEnvironment,
      ...(resolvedProjectId ? { projectId: resolvedProjectId } : {}),
    });

    return this.pinecone;
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
