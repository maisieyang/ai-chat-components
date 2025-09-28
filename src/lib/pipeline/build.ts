import type { FetchConfluencePagesOptions } from '../confluence';
import {
  fetchConfluencePages,
  cleanConfluencePage,
  chunkPage,
  type CleanConfluencePage,
  type PageChunk,
} from '../confluence';
import { getPineconeStore, PineconeStore } from '../vectorstore';

export interface BuildKnowledgeBaseOptions extends FetchConfluencePagesOptions {
  chunkMinTokens?: number;
  chunkMaxTokens?: number;
}

export interface KnowledgeBase {
  store: PineconeStore;
  pages: CleanConfluencePage[];
  chunks: PageChunk[];
}

export async function buildKnowledgeBase(
  options: BuildKnowledgeBaseOptions = {}
): Promise<KnowledgeBase> {
  const { pages } = await fetchConfluencePages(options);

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
