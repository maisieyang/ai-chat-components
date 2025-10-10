import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import type { Root, Content, Heading } from 'mdast';
import type { CleanConfluencePage } from './clean';

const DEFAULT_MIN_TOKENS = 300;
const DEFAULT_MAX_TOKENS = 800;

export interface ChunkOptions {
  minTokens?: number;
  maxTokens?: number;
  embedVersion: string;
}

export interface PageChunk {
  id: string;
  nodeId: string;
  pageId: string;
  chunkIndex: number;
  content: string;
  tokenEstimate: number;
  title: string;
  heading?: string;
  headingPath: string[];
  headingPathString: string;
  sourceUrl?: string;
  spaceKey?: string;
  updatedAt?: string;
  etag?: string;
  embedVersion: string;
  piiFlag: boolean;
}

type SectionType = 'content' | 'code' | 'table';

type Section = {
  nodes: Content[];
  heading?: string;
  headingPath: string[];
  headingDepth: number;
  type: SectionType;
};

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

function nodeToPlainText(node: Content): string {
  if ('value' in node && typeof node.value === 'string') {
    return node.value;
  }

  if ('children' in node && Array.isArray(node.children)) {
    return node.children.map((child) => nodeToPlainText(child as Content)).join('');
  }

  return '';
}

function headingToPlainText(heading: Heading): string {
  const text = heading.children.map((child) => nodeToPlainText(child as Content)).join('').trim();
  return text || `Heading level ${heading.depth ?? 1}`;
}

function buildSections(page: CleanConfluencePage, tree: Root): Section[] {
  const sections: Section[] = [];
  const headingStack: { depth: number; text: string }[] = [];
  let currentSection: Section | null = null;

  const fallbackHeadingPath = page.title ? [page.title] : [];

  for (const node of tree.children) {
    if (node.type === 'heading') {
      const headingNode = node as Heading;
      const depth = headingNode.depth ?? 1;
      while (headingStack.length && headingStack[headingStack.length - 1]?.depth >= depth) {
        headingStack.pop();
      }

      const text = headingToPlainText(headingNode);
      headingStack.push({ depth, text });

      currentSection = {
        nodes: [node as Content],
        heading: text,
        headingPath: headingStack.map((entry) => entry.text),
        headingDepth: depth,
        type: 'content',
      };
      sections.push(currentSection);
      continue;
    }

    if (node.type === 'code' || node.type === 'table') {
      const headingPath = headingStack.length ? headingStack.map((entry) => entry.text) : fallbackHeadingPath;
      const heading = headingStack.length ? headingStack[headingStack.length - 1]?.text : fallbackHeadingPath[0];
      sections.push({
        nodes: [node as Content],
        heading,
        headingPath,
        headingDepth: headingStack.length ? headingStack[headingStack.length - 1]?.depth ?? 1 : 1,
        type: node.type,
      });
      currentSection = null;
      continue;
    }

    if (!currentSection) {
      const heading = headingStack.length ? headingStack[headingStack.length - 1]?.text : fallbackHeadingPath[0];
      const headingPath = headingStack.length ? headingStack.map((entry) => entry.text) : fallbackHeadingPath;
      currentSection = {
        nodes: [],
        heading,
        headingPath,
        headingDepth: headingStack.length ? headingStack[headingStack.length - 1]?.depth ?? 1 : 1,
        type: 'content',
      };
      sections.push(currentSection);
    }

    currentSection.nodes.push(node as Content);
  }

  return sections.filter((section) => section.nodes.length > 0);
}

function splitSectionNodes(section: Section, minTokens: number, maxTokens: number): Content[][] {
  if (section.type !== 'content') {
    return [section.nodes];
  }

  const result: Content[][] = [];
  let buffer: Content[] = [];
  let bufferTokens = 0;

  const flush = () => {
    if (buffer.length === 0) {
      return;
    }
    result.push(buffer);
    buffer = [];
    bufferTokens = 0;
  };

  for (const node of section.nodes) {
    const nodeMarkdown = nodesToMarkdown([node]);
    const nodeTokens = estimateTokens(nodeMarkdown);
    const wouldExceed = bufferTokens + nodeTokens > maxTokens;

    if (wouldExceed && bufferTokens >= minTokens) {
      flush();
    }

    if (wouldExceed && bufferTokens === 0) {
      result.push([node]);
      continue;
    }

    buffer.push(node as Content);
    bufferTokens += nodeTokens;

    if (bufferTokens >= maxTokens) {
      flush();
    }
  }

  flush();

  return result;
}

export function chunkPage(page: CleanConfluencePage, options: ChunkOptions): PageChunk[] {
  const minTokens = options.minTokens ?? DEFAULT_MIN_TOKENS;
  const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
  const tree = parser.parse(page.markdown) as Root;
  const sections = buildSections(page, tree);

  const chunks: PageChunk[] = [];
  let chunkIndex = 0;

  for (const section of sections) {
    const nodeGroups = splitSectionNodes(section, minTokens, maxTokens);
    for (const nodes of nodeGroups) {
      const content = nodesToMarkdown(nodes);
      if (!content) {
        continue;
      }

      const headingPath = section.headingPath.length ? section.headingPath : (page.title ? [page.title] : []);
      const headingPathString = headingPath.join(' > ');
      const heading = section.heading ?? headingPath[headingPath.length - 1];
      const nodeId = `${page.pageId}-${chunkIndex}`;
      const tokenEstimate = estimateTokens(content);

      chunks.push({
        id: nodeId,
        nodeId,
        pageId: page.pageId,
        chunkIndex,
        content,
        tokenEstimate,
        title: page.title,
        heading,
        headingPath,
        headingPathString,
        sourceUrl: page.url,
        spaceKey: page.spaceKey,
        updatedAt: page.updatedAt,
        etag: page.etag,
        embedVersion: options.embedVersion,
        piiFlag: false,
      });

      chunkIndex += 1;
    }
  }

  return chunks;
}

