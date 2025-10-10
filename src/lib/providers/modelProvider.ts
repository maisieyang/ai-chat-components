import OpenAI from 'openai';
import type { ChatCompletionChunk } from 'openai/resources/chat/completions';
import { normalizeProviderName, type ProviderName } from './types';

interface ProviderConfig {
  apiKeyEnv: string;
  baseUrlEnv: string;
  defaultBaseUrl: string;
  chatModelEnv: string;
  embeddingModelEnv: string;
  fallbackChatModel: string;
  fallbackEmbeddingModel: string;
  displayName: string;
}

interface ResolvedProviderConfig {
  provider: ProviderName;
  apiKey: string;
  baseURL: string;
  chatModel: string;
  embeddingModel: string;
}

const PROVIDER_CONFIGS: Record<ProviderName, ProviderConfig> = {
  openai: {
    apiKeyEnv: 'OPENAI_API_KEY',
    baseUrlEnv: 'OPENAI_API_URL',
    defaultBaseUrl: 'https://api.openai.com/v1',
    chatModelEnv: 'OPENAI_MODEL',
    embeddingModelEnv: 'OPENAI_EMBEDDING_MODEL',
    fallbackChatModel: 'gpt-4o-mini',
    fallbackEmbeddingModel: 'text-embedding-3-small',
    displayName: 'OpenAI',
  },
  qwen: {
    apiKeyEnv: 'QWEN_API_KEY',
    baseUrlEnv: 'QWEN_API_URL',
    defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    chatModelEnv: 'QWEN_MODEL',
    embeddingModelEnv: 'QWEN_EMBEDDING_MODEL',
    fallbackChatModel: 'qwen-max',
    fallbackEmbeddingModel: 'text-embedding-v4',
    displayName: 'Qwen',
  },
};

const clientCache = new Map<ProviderName, { client: OpenAI; config: ResolvedProviderConfig }>();

function sanitizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

function resolveConfig(provider: ProviderName): ResolvedProviderConfig {
  const definition = PROVIDER_CONFIGS[provider];
  const apiKey = process.env[definition.apiKeyEnv];

  if (!apiKey) {
    throw new Error(
      `${definition.displayName} API key not configured. Please set ${definition.apiKeyEnv} in your environment.`
    );
  }

  const baseURL = sanitizeBaseUrl(process.env[definition.baseUrlEnv] ?? definition.defaultBaseUrl);
  const chatModel = process.env[definition.chatModelEnv] ?? definition.fallbackChatModel;
  const embeddingModel = process.env[definition.embeddingModelEnv] ?? definition.fallbackEmbeddingModel;

  return {
    provider,
    apiKey,
    baseURL,
    chatModel,
    embeddingModel,
  };
}

function getClient(provider: ProviderName): { client: OpenAI; config: ResolvedProviderConfig } {
  const cached = clientCache.get(provider);
  if (cached) {
    return cached;
  }

  const resolved = resolveConfig(provider);
  const client = new OpenAI({
    apiKey: resolved.apiKey,
    baseURL: resolved.baseURL,
  });

  const entry = { client, config: resolved };
  clientCache.set(provider, entry);
  return entry;
}

export interface ProviderChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionParams {
  messages: ProviderChatMessage[];
  temperature?: number;
  model?: string;
  provider?: ProviderName | string | null;
}

export type ChatCompletionStream = AsyncIterable<ChatCompletionChunk>;

export function resolveProvider(provider?: string | ProviderName | null): ProviderName {
  if (provider) {
    return normalizeProviderName(typeof provider === 'string' ? provider : String(provider));
  }

  return normalizeProviderName(process.env.PROVIDER);
}

export async function embedTexts(
  texts: string[],
  provider?: string | ProviderName | null,
): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }

  const targetProvider = resolveProvider(provider);
  const { client, config } = getClient(targetProvider);
  const batchSize = targetProvider === 'qwen' ? 10 : texts.length;
  const embeddings: number[][] = [];

  for (let start = 0; start < texts.length; start += batchSize) {
    const batch = texts.slice(start, start + batchSize);
    const response = await client.embeddings.create({
      model: config.embeddingModel,
      input: batch,
    });
    embeddings.push(...response.data.map((item) => item.embedding));
  }

  return embeddings;
}
export function getEmbeddingModelInfo(provider?: string | ProviderName | null): { provider: ProviderName; model: string } {
  const targetProvider = resolveProvider(provider ?? null);
  const { config } = getClient(targetProvider);
  return { provider: targetProvider, model: config.embeddingModel };
}

export function getEmbeddingModelVersion(provider?: string | ProviderName | null): string {
  const info = getEmbeddingModelInfo(provider);
  return `${info.provider}:${info.model}`;
}


export async function embedText(text: string, provider?: string | ProviderName | null): Promise<number[]> {
  const [embedding] = await embedTexts([text], provider);
  return embedding;
}

export async function chatCompletion(
  params: ChatCompletionParams,
): Promise<{ text: string; provider: ProviderName; model: string }> {
  const targetProvider = resolveProvider(params.provider ?? null);
  const { client, config } = getClient(targetProvider);
  const model = params.model ?? config.chatModel;

  const completion = await client.chat.completions.create({
    model,
    messages: params.messages,
    temperature: params.temperature ?? 0.2,
  });

  const text = completion.choices[0]?.message?.content?.trim() ?? '';
  return { text, provider: targetProvider, model };
}

export async function chatCompletionStream(
  params: ChatCompletionParams,
): Promise<{ stream: ChatCompletionStream; provider: ProviderName; model: string }> {
  const targetProvider = resolveProvider(params.provider ?? null);
  const { client, config } = getClient(targetProvider);
  const model = params.model ?? config.chatModel;

  const stream = await client.chat.completions.create({
    model,
    messages: params.messages,
    temperature: params.temperature ?? 0.2,
    stream: true,
  });

  return { stream, provider: targetProvider, model };
}

export type { ProviderName } from './types';
export type { ChatCompletionChunk } from 'openai/resources/chat/completions';
