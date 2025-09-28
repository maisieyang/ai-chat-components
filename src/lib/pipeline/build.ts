import type { FetchConfluencePagesOptions } from '../confluence';
import {
  fetchConfluencePages,
  cleanConfluencePage,
  chunkPage,
  type CleanConfluencePage,
  type PageChunk,
} from '../confluence';
import { FaissVectorStore } from '../vectorstore';

export interface BuildKnowledgeBaseOptions extends FetchConfluencePagesOptions {
  chunkMinTokens?: number;
  chunkMaxTokens?: number;
}

export interface KnowledgeBase {
  store: FaissVectorStore;
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

  const store = new FaissVectorStore();
  await store.addChunks(allChunks);

  return {
    store,
    pages: cleanedPages,
    chunks: allChunks,
  };
}

