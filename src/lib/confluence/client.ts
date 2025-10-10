import { Buffer } from 'node:buffer';
import type { ConfluencePage, ConfluenceSearchResponse } from './types';

const DEFAULT_BASE_URL = 'https://cwiki.apache.org/confluence';
const DEFAULT_PAGE_LIMIT = 25;
const DEFAULT_MAX_RETRIES = Number(process.env.CONFLUENCE_REQUEST_RETRIES ?? '3');
const DEFAULT_RETRY_BASE_DELAY_MS = Number(process.env.CONFLUENCE_RETRY_BASE_DELAY_MS ?? '2000');

function sanitizeBaseUrl(value: string) {
  return value.replace(/#.*$/, '').replace(/\/+$/, '');
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function readResponseBody(response: Response) {
  try {
    return await response.text();
  } catch (error) {
    return `Unable to read response body: ${error instanceof Error ? error.message : String(error)}`;
  }
}

interface RetryOptions {
  maxRetries: number;
  baseDelayMs: number;
  authConfigured: boolean;
  context?: string;
}

async function fetchWithRetry(url: string, init: RequestInit, options: RetryOptions): Promise<Response> {
  const { maxRetries, baseDelayMs, authConfigured, context } = options;
  const safeBaseDelay = Number.isFinite(baseDelayMs) && baseDelayMs > 0 ? baseDelayMs : 2000;
  const retries = Number.isInteger(maxRetries) && maxRetries >= 0 ? maxRetries : 3;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    if (attempt > 0) {
      const waitMs = safeBaseDelay * 2 ** (attempt - 1) + Math.random() * 250;
      console.warn(
        `Confluence request retry ${attempt}/${retries}: waiting ${Math.round(waitMs)}ms before retrying${
          context ? ` (${context})` : ''
        }.`
      );
      await sleep(waitMs);
    }

    try {
      const response = await fetch(url, init);
      if (response.ok) {
        return response;
      }

      if (response.status === 401 || response.status === 403) {
        const body = await readResponseBody(response);
        const hint = authConfigured
          ? 'Verify CONFLUENCE_EMAIL and CONFLUENCE_API_TOKEN are correct and have access to the requested space.'
          : 'This endpoint requires authentication but no credentials were provided.';
        throw new Error(
          `Confluence authentication failed with status ${response.status}. ${hint} Response body: ${body}`
        );
      }

      const shouldRetry = response.status >= 500 || response.status === 429;
      if (!shouldRetry || attempt === retries) {
        const body = await readResponseBody(response);
        throw new Error(
          `Confluence request failed (${response.status})${context ? ` for ${context}` : ''}. Response body: ${body}`
        );
      }
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Confluence authentication failed')) {
        throw error;
      }

      if (attempt === retries) {
        throw error;
      }

      const waitMs = safeBaseDelay * 2 ** attempt + Math.random() * 250;
      console.warn(
        `Confluence fetch error (${error instanceof Error ? error.message : String(error)}). Retrying in ${Math.round(
          waitMs
        )}ms${context ? ` (${context})` : ''}.`
      );
      await sleep(waitMs);
    }
  }

  throw new Error('Exhausted retries fetching Confluence content.');
}

export interface ConfluenceClientOptions {
  baseUrl?: string;
  spaceKey?: string;
  email?: string;
  apiToken?: string;
  maxRetries?: number;
  retryBaseDelayMs?: number;
}

export interface FetchPagesResult {
  pages: ConfluencePage[];
  raw: ConfluenceSearchResponse;
  hasMore: boolean;
  nextStart?: number;
}

function parseNextStart(raw: ConfluenceSearchResponse, baseUrl: string): number | undefined {
  const nextLink = raw._links?.next;
  if (!nextLink) {
    return undefined;
  }

  try {
    const url = new URL(nextLink, raw._links?.base ?? `${baseUrl}/`);
    const startParam = url.searchParams.get('start');
    return startParam ? Number(startParam) : undefined;
  } catch {
    return undefined;
  }
}

export class ConfluenceClient {
  private readonly baseUrl: string;
  private readonly defaultSpaceKey?: string;
  private readonly authHeader?: string;
  private readonly maxRetries: number;
  private readonly retryBaseDelayMs: number;

  constructor(options: ConfluenceClientOptions = {}) {
    const rawBase = options.baseUrl ?? process.env.CONFLUENCE_BASE_URL ?? DEFAULT_BASE_URL;
    this.baseUrl = sanitizeBaseUrl(rawBase);
    this.defaultSpaceKey = options.spaceKey ?? process.env.CONFLUENCE_SPACE_KEY ?? undefined;

    const email = options.email ?? process.env.CONFLUENCE_EMAIL ?? process.env.CONFLUENCE_USERNAME;
    const apiToken = options.apiToken ?? process.env.CONFLUENCE_API_TOKEN;
    if (email && apiToken) {
      this.authHeader = `Basic ${Buffer.from(`${email}:${apiToken}`).toString('base64')}`;
    }

    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.retryBaseDelayMs = options.retryBaseDelayMs ?? DEFAULT_RETRY_BASE_DELAY_MS;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  getDefaultSpaceKey(): string | undefined {
    return this.defaultSpaceKey;
  }

  private buildUrl(path: string) {
    const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
    return new URL(normalizedPath, `${this.baseUrl}/`).toString();
  }

  private buildHeaders(headers?: HeadersInit) {
    const result = new Headers(headers ?? {});
    result.set('Accept', 'application/json');
    if (this.authHeader) {
      result.set('Authorization', this.authHeader);
    }
    return result;
  }

  private async request(path: string, init: RequestInit = {}, context?: string) {
    const url = this.buildUrl(path);
    const headers = this.buildHeaders(init.headers);
    return fetchWithRetry(
      url,
      {
        ...init,
        headers,
      },
      {
        maxRetries: this.maxRetries,
        baseDelayMs: this.retryBaseDelayMs,
        authConfigured: Boolean(this.authHeader),
        context,
      }
    );
  }

  async fetchPages(spaceKey?: string, start = 0, limit = DEFAULT_PAGE_LIMIT, signal?: AbortSignal): Promise<FetchPagesResult> {
    const params = new URLSearchParams({
      type: 'page',
      start: String(start),
      limit: String(limit),
    });
    params.set('expand', 'body.storage,version,space');

    const resolvedSpaceKey = spaceKey ?? this.defaultSpaceKey;
    if (resolvedSpaceKey) {
      params.set('spaceKey', resolvedSpaceKey);
    }

    const response = await this.request(
      `rest/api/content?${params.toString()}`,
      {
        method: 'GET',
        signal,
      },
      'GET /rest/api/content'
    );

    const raw = (await response.json()) as ConfluenceSearchResponse;
    const pages = Array.isArray(raw.results) ? raw.results : [];
    const hasMore = Boolean(raw._links?.next) && pages.length > 0;

    return {
      pages,
      raw,
      hasMore,
      nextStart: parseNextStart(raw, this.baseUrl),
    };
  }

  async fetchPageContent(pageId: string, signal?: AbortSignal): Promise<ConfluencePage> {
    const response = await this.request(
      `rest/api/content/${pageId}?expand=body.storage,version,space`,
      {
        method: 'GET',
        signal,
      },
      `GET /rest/api/content/${pageId}`
    );

    return (await response.json()) as ConfluencePage;
  }
}

export default ConfluenceClient;
