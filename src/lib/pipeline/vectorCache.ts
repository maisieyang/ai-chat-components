import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { CleanConfluencePage } from '../confluence';
import type { PageChunk } from '../confluence/chunk';

const CURRENT_CACHE_VERSION = 1;
const CACHE_FILENAME = 'vector-cache.json';
const CACHE_DIR = path.join(process.cwd(), 'data');
const CACHE_PATH = path.join(CACHE_DIR, CACHE_FILENAME);

export interface PageCacheEntry {
  pageId: string;
  pageTitle: string;
  spaceKey?: string;
  etag?: string;
  updatedAt?: string;
  embedVersion: string;
  chunkCount: number;
  chunkIds: string[];
  lastEmbeddedAt?: string;
}

export interface VectorCacheFile {
  version: number;
  pages: Record<string, PageCacheEntry>;
}

const EMPTY_CACHE: VectorCacheFile = {
  version: CURRENT_CACHE_VERSION,
  pages: {},
};

function upgradeCache(cache: VectorCacheFile): VectorCacheFile {
  if (!cache || typeof cache !== 'object') {
    return { ...EMPTY_CACHE };
  }

  if (cache.version === CURRENT_CACHE_VERSION) {
    return cache;
  }

  return {
    version: CURRENT_CACHE_VERSION,
    pages: cache.pages ?? {},
  };
}

export async function loadVectorCache(): Promise<VectorCacheFile> {
  try {
    const raw = await fs.readFile(CACHE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as VectorCacheFile;
    return upgradeCache(parsed);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { ...EMPTY_CACHE };
    }

    console.warn('Failed to read vector cache. Rebuilding from scratch.', error);
    return { ...EMPTY_CACHE };
  }
}

export async function saveVectorCache(cache: VectorCacheFile): Promise<void> {
  await fs.mkdir(CACHE_DIR, { recursive: true });
  await fs.writeFile(CACHE_PATH, `${JSON.stringify(cache, null, 2)}\n`, 'utf8');
}

export interface PageChangeResult {
  changed: boolean;
  reasons: string[];
}

export function evaluatePageChange(
  page: CleanConfluencePage,
  embedVersion: string,
  cached?: PageCacheEntry
): PageChangeResult {
  if (!cached) {
    return {
      changed: true,
      reasons: ['no existing cache entry'],
    };
  }

  const reasons: string[] = [];

  if (cached.etag !== page.etag) {
    reasons.push(`etag changed (${cached.etag ?? 'none'} → ${page.etag ?? 'none'})`);
  }

  if (cached.updatedAt !== page.updatedAt) {
    reasons.push(`updated_at changed (${cached.updatedAt ?? 'none'} → ${page.updatedAt ?? 'none'})`);
  }

  if (cached.embedVersion !== embedVersion) {
    reasons.push(`embedding version changed (${cached.embedVersion} → ${embedVersion})`);
  }

  return {
    changed: reasons.length > 0,
    reasons,
  };
}

export function buildCacheEntry(
  page: CleanConfluencePage,
  embedVersion: string,
  chunks: PageChunk[],
  embeddedAt: string
): PageCacheEntry {
  return {
    pageId: page.pageId,
    pageTitle: page.title,
    spaceKey: page.spaceKey,
    etag: page.etag,
    updatedAt: page.updatedAt,
    embedVersion,
    chunkCount: chunks.length,
    chunkIds: chunks.map((chunk) => chunk.nodeId),
    lastEmbeddedAt: embeddedAt,
  };
}

export async function clearVectorCache(): Promise<void> {
  try {
    await fs.unlink(CACHE_PATH);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return;
    }

    throw error;
  }
}

