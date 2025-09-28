import type { ConfluencePage } from '../confluence';
import {
  ConfluenceClient,
  type ConfluenceClientOptions,
  cleanConfluencePage,
  chunkPage,
  type CleanConfluencePage,
  type PageChunk,
} from '../confluence';
import { getPineconeStore, PineconeStore } from '../vectorstore';

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

export interface KnowledgeBase {
  store: PineconeStore;
  pages: CleanConfluencePage[];
  chunks: PageChunk[];
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
        if (page.body?.storage?.value) {
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

export async function buildKnowledgeBase(
  options: BuildKnowledgeBaseOptions = {}
): Promise<KnowledgeBase> {
  const client = options.client ?? new ConfluenceClient(options.clientOptions);
  const pageLimit = options.pageLimit ?? DEFAULT_PAGE_LIMIT;
  const maxPages = options.maxPages ?? DEFAULT_MAX_PAGES;
  const spaceKey = options.spaceKey ?? client.getDefaultSpaceKey();

  const pages = await fetchPagesWithContent(client, spaceKey, pageLimit, maxPages, options.signal);

  const cleanedPages = pages
    .map(cleanConfluencePage)
    .filter((page): page is CleanConfluencePage => page !== null);

  const allChunks = cleanedPages.flatMap((page) =>
    chunkPage(page, {
      minTokens: options.chunkMinTokens,
      maxTokens: options.chunkMaxTokens,
    })
  );

  const store = await getPineconeStore();
  if (allChunks.length > 0) {
    await store.upsertChunks(allChunks);
  }

  return {
    store,
    pages: cleanedPages,
    chunks: allChunks,
  };
}
