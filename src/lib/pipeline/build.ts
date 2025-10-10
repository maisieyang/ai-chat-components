import type { ConfluencePage } from '../confluence';
import {
  ConfluenceClient,
  type ConfluenceClientOptions,
  cleanConfluencePage,
  chunkPage,
  type CleanConfluencePage,
  type PageChunk,
} from '../confluence';
import { getEmbeddingModelVersion } from '../providers/modelProvider';
import { getPineconeStore, PineconeStore } from '../vectorstore';
import {
  loadVectorCache,
  saveVectorCache,
  evaluatePageChange,
  buildCacheEntry,
  type VectorCacheFile,
} from './vectorCache';
import {
  writeVectorizationLog,
  type VectorizationLog,
  type EmbeddedPageLog,
  type SkippedPageLog,
  type ChunkLogEntry,
} from './vectorLog';

const DEFAULT_MAX_PAGES = Number(process.env.CONFLUENCE_MAX_PAGES ?? '5');
const DEFAULT_PAGE_LIMIT = Number(process.env.CONFLUENCE_PAGE_LIMIT ?? '25');

export interface BuildKnowledgeBaseOptions {
  spaceKey?: string;
  pageLimit?: number;
  maxPages?: number;
  chunkMinTokens?: number;
  chunkMaxTokens?: number;
  signal?: AbortSignal;
  client?: ConfluenceClient;
  clientOptions?: ConfluenceClientOptions;
}

export interface KnowledgeBaseStats {
  embedVersion: string;
  totalPages: number;
  embeddedPages: number;
  skippedPages: number;
  embeddedChunks: number;
}

export interface KnowledgeBase {
  store: PineconeStore;
  pages: CleanConfluencePage[];
  chunks: PageChunk[];
  embeddedPages: CleanConfluencePage[];
  skippedPages: CleanConfluencePage[];
  stats: KnowledgeBaseStats;
}

async function fetchPagesWithContent(
  client: ConfluenceClient,
  spaceKey: string | undefined,
  pageLimit: number,
  maxPages: number,
  signal?: AbortSignal
): Promise<ConfluencePage[]> {
  const pagesWithContent: ConfluencePage[] = [];
  let start = 0;
  let batchesFetched = 0;
  let hasMore = true;

  while (hasMore && batchesFetched < maxPages) {
    const { pages, hasMore: batchHasMore, nextStart } = await client.fetchPages(spaceKey, start, pageLimit, signal);

    if (pages.length === 0) {
      break;
    }

    const expandedPages = await Promise.all(
      pages.map(async (page) => {
        if (page.body?.storage?.value && page.version?.number != null) {
          return page;
        }

        try {
          return await client.fetchPageContent(page.id, signal);
        } catch (error) {
          console.warn(
            `Failed to fetch content for Confluence page ${page.id} (${page.title ?? 'untitled'}): ${
              error instanceof Error ? error.message : String(error)
            }`
          );
          return null;
        }
      })
    );

    pagesWithContent.push(
      ...expandedPages.filter((page): page is ConfluencePage => page !== null && !!page.body?.storage?.value)
    );

    batchesFetched += 1;
    hasMore = batchHasMore && typeof nextStart === 'number';
    start = typeof nextStart === 'number' ? nextStart : start + pageLimit;
  }

  return pagesWithContent;
}

function buildChunkLogEntries(chunks: PageChunk[]): ChunkLogEntry[] {
  return chunks.map((chunk) => ({
    chunkId: chunk.id,
    nodeId: chunk.nodeId,
    pageId: chunk.pageId,
    pageTitle: chunk.title,
    heading: chunk.heading,
    headingPath: chunk.headingPathString,
    updatedAt: chunk.updatedAt,
    etag: chunk.etag,
    spaceKey: chunk.spaceKey,
    embedVersion: chunk.embedVersion,
    tokenEstimate: chunk.tokenEstimate,
    piiFlag: chunk.piiFlag,
  }));
}

function buildEmbeddedPageLog(page: CleanConfluencePage, chunkCount: number): EmbeddedPageLog {
  return {
    pageId: page.pageId,
    pageTitle: page.title,
    spaceKey: page.spaceKey,
    etag: page.etag,
    updatedAt: page.updatedAt,
    chunkCount,
  };
}

function buildSkippedPageLog(page: CleanConfluencePage, reasons: string[]): SkippedPageLog {
  return {
    pageId: page.pageId,
    pageTitle: page.title,
    reasons: reasons.length > 0 ? reasons : ['no changes detected'],
    etag: page.etag,
    updatedAt: page.updatedAt,
  };
}

function updateCacheEntry(
  cache: VectorCacheFile,
  page: CleanConfluencePage,
  embedVersion: string,
  chunks: PageChunk[],
  embeddedAt: string
) {
  cache.pages[page.pageId] = buildCacheEntry(page, embedVersion, chunks, embeddedAt);
}

export async function buildKnowledgeBase(
  options: BuildKnowledgeBaseOptions = {}
): Promise<KnowledgeBase> {
  const client = options.client ?? new ConfluenceClient(options.clientOptions);
  const pageLimit = options.pageLimit ?? DEFAULT_PAGE_LIMIT;
  const maxPages = options.maxPages ?? DEFAULT_MAX_PAGES;
  const spaceKey = options.spaceKey ?? client.getDefaultSpaceKey();

  const embedVersion = getEmbeddingModelVersion();
  const cache = await loadVectorCache();

  const pages = await fetchPagesWithContent(client, spaceKey, pageLimit, maxPages, options.signal);
  const cleanedPages = pages
    .map(cleanConfluencePage)
    .filter((page): page is CleanConfluencePage => page !== null);

  const store = await getPineconeStore();

  const embeddedPages: CleanConfluencePage[] = [];
  const skippedPages: CleanConfluencePage[] = [];
  const embeddedChunks: PageChunk[] = [];
  const embeddedPageLogs: EmbeddedPageLog[] = [];
  const skippedPageLogs: SkippedPageLog[] = [];
  const chunkLogEntries: ChunkLogEntry[] = [];

  for (const page of cleanedPages) {
    const cached = cache.pages[page.pageId];
    const { changed, reasons } = evaluatePageChange(page, embedVersion, cached);

    if (!changed) {
      console.log(`Skipping ${page.title} — unchanged`);
      skippedPages.push(page);
      skippedPageLogs.push(buildSkippedPageLog(page, reasons));
      continue;
    }

    const chunks = chunkPage(page, {
      minTokens: options.chunkMinTokens,
      maxTokens: options.chunkMaxTokens,
      embedVersion,
    });

    if (chunks.length === 0) {
      console.log(`Skipping ${page.title} — no content after chunking`);
      skippedPages.push(page);
      skippedPageLogs.push(buildSkippedPageLog(page, ['no content after chunking']));
      continue;
    }

    const reasonText = reasons.length > 0 ? reasons.join(', ') : 're-embedding requested';
    console.log(
      `Embedding ${page.title} — ${chunks.length} chunk${chunks.length === 1 ? '' : 's'} (${reasonText})`
    );

    await store.deletePageChunks(page.pageId);
    await store.upsertChunks(chunks);

    embeddedPages.push(page);
    embeddedChunks.push(...chunks);
    embeddedPageLogs.push(buildEmbeddedPageLog(page, chunks.length));
    chunkLogEntries.push(...buildChunkLogEntries(chunks));

    const embeddedAt = new Date().toISOString();
    updateCacheEntry(cache, page, embedVersion, chunks, embeddedAt);
  }

  await saveVectorCache(cache);

  const logPayload: VectorizationLog = {
    generatedAt: new Date().toISOString(),
    embedVersion,
    embeddedPages: embeddedPageLogs,
    skippedPages: skippedPageLogs,
    chunks: chunkLogEntries,
  };

  await writeVectorizationLog(logPayload);

  return {
    store,
    pages: cleanedPages,
    chunks: embeddedChunks,
    embeddedPages,
    skippedPages,
    stats: {
      embedVersion,
      totalPages: cleanedPages.length,
      embeddedPages: embeddedPages.length,
      skippedPages: skippedPages.length,
      embeddedChunks: embeddedChunks.length,
    },
  };
}

