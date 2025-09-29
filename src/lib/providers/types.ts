export type ProviderName = 'openai' | 'qwen';

export const PROVIDER_OPTIONS: ProviderName[] = ['openai', 'qwen'];

export function normalizeProviderName(value?: string | null): ProviderName {
  const normalized = (value ?? '').toLowerCase().trim();
  if (normalized === 'qwen' || normalized === 'qwen-plus' || normalized === 'tongyi' || normalized === '通义千问') {
    return 'qwen';
  }
  if (normalized === 'openai' || normalized === 'gpt' || normalized === 'chatgpt') {
    return 'openai';
  }
  return 'qwen';
}
