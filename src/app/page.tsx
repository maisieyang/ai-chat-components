'use client';

import { useState, useMemo } from 'react';
import { ChatWindow } from '@/components/ChatWindow';
import { PROVIDER_OPTIONS, type ProviderName, normalizeProviderName } from '@/lib/providers/types';

const DEFAULT_PROVIDER = normalizeProviderName(process.env.NEXT_PUBLIC_PROVIDER as ProviderName | undefined);

export default function Home() {
  const [provider, setProvider] = useState<ProviderName>(DEFAULT_PROVIDER);
  const requestMetadata = useMemo(() => ({ provider }), [provider]);

  const toolbarActions = (
    <div className="flex items-center space-x-2">
      <label htmlFor="chat-provider" className="text-sm text-text-tertiary">
        模型
      </label>
      <select
        id="chat-provider"
        value={provider}
        onChange={(event) => setProvider(event.target.value as ProviderName)}
        className="rounded-md border border-border-subtle bg-bg-secondary px-2 py-1 text-sm text-text-primary focus:border-accent focus:outline-none"
      >
        {PROVIDER_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option === 'openai' ? 'OpenAI' : 'Qwen (通义千问)'}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="h-screen bg-bg-primary transition-colors duration-200">
      <ChatWindow
        apiUrl="/api/chat"
        placeholder="输入您的问题，AI将提供像Cursor一样清晰优雅的Markdown回答..."
        className="h-full"
        requestMetadata={requestMetadata}
        toolbarActions={toolbarActions}
      />
    </div>
  );
}
