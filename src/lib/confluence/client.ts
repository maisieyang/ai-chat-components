import { promises as fs } from 'fs';
import path from 'path';
import { FetchConfluencePagesOptions, ConfluenceSearchResponse, ConfluencePage } from './types';

const DEFAULT_BASE_URL = 'https://cwiki.apache.org/confluence';
const DEFAULT_PAGE_LIMIT = 25;
const DEFAULT_MAX_PAGES = 5;

interface FetchResult {
  pages: ConfluencePage[];
  rawResponses: ConfluenceSearchResponse[];
}

function getBaseUrl() {
  return process.env.CONFLUENCE_BASE_URL?.replace(/\/$/, '') ?? DEFAULT_BASE_URL;
}

function buildRequestUrl(
  baseUrl: string,
  start: number,
  limit: number,
  opts: FetchConfluencePagesOptions
) {
  const params = new URLSearchParams({
    type: 'page',
    expand: 'body.storage,version',
    start: String(start),
    limit: String(limit),
  });

  if (opts.spaceKey) {
    params.set('spaceKey', opts.spaceKey);
  }

  if (opts.cql) {
    params.set('cql', opts.cql);
  }

  return `${baseUrl}/rest/api/content?${params.toString()}`;
}

async function ensureDebugDirectory() {
  const debugDir = path.join(process.cwd(), 'data', 'raw');
  await fs.mkdir(debugDir, { recursive: true });
  return debugDir;
}

async function persistRawResponse(debugDir: string, payload: ConfluenceSearchResponse, start: number) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = path.join(debugDir, `confluence-page-${start}-${timestamp}.json`);
  await fs.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf8');
}

export async function fetchConfluencePages(
  options: FetchConfluencePagesOptions = {}
): Promise<FetchResult> {
  const baseUrl = getBaseUrl();
  const pageLimit = options.pageLimit ?? DEFAULT_PAGE_LIMIT;
  const maxPages = options.maxPages ?? DEFAULT_MAX_PAGES;

  const pages: ConfluencePage[] = [];
  const rawResponses: ConfluenceSearchResponse[] = [];
  const debugDir = await ensureDebugDirectory();

  let start = 0;
  let pageCount = 0;
  let hasMore = true;

  while (hasMore && pageCount < maxPages) {
    const url = buildRequestUrl(baseUrl, start, pageLimit, options);
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
      signal: options.signal,
    });

    if (!response.ok) {
      throw new Error(`Confluence request failed (${response.status}): ${await response.text()}`);
    }

    const payload = (await response.json()) as ConfluenceSearchResponse;
    rawResponses.push(payload);
    await persistRawResponse(debugDir, payload, start);

    if (Array.isArray(payload.results)) {
      pages.push(...payload.results);
    }

    pageCount += 1;

    const nextLink = payload._links?.next;
    if (!nextLink || payload.results.length === 0) {
      hasMore = false;
    } else {
      start += payload.limit ?? pageLimit;
    }
  }

  return { pages, rawResponses };
}

export type { ConfluencePage } from './types';
