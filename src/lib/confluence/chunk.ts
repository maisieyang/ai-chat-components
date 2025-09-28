import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import type { Root, Content } from 'mdast';
import type { CleanConfluencePage } from './clean';

const DEFAULT_MIN_TOKENS = 300;
const DEFAULT_MAX_TOKENS = 800;

export interface PageChunk {
  id: string;
  pageId: string;
  title: string;
  chunkIndex: number;
  content: string;
  tokenEstimate: number;
  sourceUrl?: string;
}

const parser = unified().use(remarkParse);
const stringifier = unified().use(remarkStringify, {
  fences: true,
  bullet: '-',
  listItemIndent: 'one',
});

function estimateTokens(text: string): number {
  return text.split(/\s+/g).filter(Boolean).length;
}

function nodesToMarkdown(nodes: Content[]): string {
  const tree: Root = {
    type: 'root',
    children: nodes,
  };

  return stringifier.stringify(tree).trim();
}

function flushChunk(
  accumulator: Content[],
  meta: CleanConfluencePage,
  chunkIndex: number
): PageChunk | null {
  if (accumulator.length === 0) {
    return null;
  }

  const content = nodesToMarkdown(accumulator);
  return {
    id: `${meta.pageId}-${chunkIndex}`,
    pageId: meta.pageId,
    title: meta.title,
    chunkIndex,
    content,
    tokenEstimate: estimateTokens(content),
    sourceUrl: meta.url,
  };
}

export interface ChunkOptions {
  minTokens?: number;
  maxTokens?: number;
}

export function chunkPage(
  page: CleanConfluencePage,
  options: ChunkOptions = {}
): PageChunk[] {
  const minTokens = options.minTokens ?? DEFAULT_MIN_TOKENS;
  const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;

  const tree = parser.parse(page.markdown) as Root;
  const chunks: PageChunk[] = [];
  let workingNodes: Content[] = [];
  let workingTokens = 0;
  let chunkIndex = 0;

  for (const node of tree.children) {
    const nodeMarkdown = nodesToMarkdown([node as Content]);
    const nodeTokens = estimateTokens(nodeMarkdown);

    const isHeading = node.type === 'heading';

    const wouldExceed = workingTokens + nodeTokens > maxTokens;
    const shouldFlush = workingNodes.length > 0 && (wouldExceed || (isHeading && workingTokens >= minTokens));

    if (shouldFlush) {
      const chunk = flushChunk(workingNodes, page, chunkIndex);
      if (chunk) {
        chunks.push(chunk);
        chunkIndex += 1;
      }
      workingNodes = [];
      workingTokens = 0;
    }

    workingNodes.push(node as Content);
    workingTokens += nodeTokens;

    if (workingTokens >= maxTokens) {
      const chunk = flushChunk(workingNodes, page, chunkIndex);
      if (chunk) {
        chunks.push(chunk);
        chunkIndex += 1;
      }
      workingNodes = [];
      workingTokens = 0;
    }
  }

  const finalChunk = flushChunk(workingNodes, page, chunkIndex);
  if (finalChunk) {
    chunks.push(finalChunk);
  }

  return chunks;
}

