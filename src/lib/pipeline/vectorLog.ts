import { promises as fs } from 'node:fs';
import path from 'node:path';

const LOG_DIR = path.join(process.cwd(), 'logs');
const LOG_PATH = path.join(LOG_DIR, 'vectorize-last-run.json');

export interface EmbeddedPageLog {
  pageId: string;
  pageTitle: string;
  spaceKey?: string;
  etag?: string;
  updatedAt?: string;
  chunkCount: number;
}

export interface SkippedPageLog {
  pageId: string;
  pageTitle: string;
  reasons: string[];
  etag?: string;
  updatedAt?: string;
}

export interface ChunkLogEntry {
  chunkId: string;
  nodeId: string;
  pageId: string;
  pageTitle: string;
  heading?: string;
  headingPath?: string;
  updatedAt?: string;
  etag?: string;
  spaceKey?: string;
  embedVersion: string;
  tokenEstimate: number;
  piiFlag: boolean;
}

export interface VectorizationLog {
  generatedAt: string;
  embedVersion: string;
  embeddedPages: EmbeddedPageLog[];
  skippedPages: SkippedPageLog[];
  chunks: ChunkLogEntry[];
}

export async function writeVectorizationLog(log: VectorizationLog): Promise<void> {
  await fs.mkdir(LOG_DIR, { recursive: true });
  await fs.writeFile(LOG_PATH, `${JSON.stringify(log, null, 2)}\n`, 'utf8');
}

