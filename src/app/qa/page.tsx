'use client';

import { useCallback, useMemo, useState } from 'react';
import { ChatWindow } from '@/components/ChatWindow';
import { MessageBubble } from '@/components/MessageBubble';
import { QAReferenceList } from '@/components/QAReferenceList';
import type { RenderMessageParams } from '@/components/ChatWindow/types';
import { PROVIDER_OPTIONS, type ProviderName } from '@/lib/providers/types';

const QA_EMPTY_STATE = {
  icon: '📚',
  headline: 'Confluence QA Assistant',
  description: '提出关于 Apache Confluence 文档的问题，系统会结合知识库给出带引用的答案。',
  suggestions: [
    '💡 “如何在 Confluence 中配置空间权限？”',
    '💡 “Confluence 支持哪些身份验证方式？”',
    '💡 “怎样编写包含宏的页面模板？”',
  ],
};

export default function QAPage() {
  const [provider, setProvider] = useState<ProviderName>(
    (process.env.NEXT_PUBLIC_PROVIDER as ProviderName) ?? 'openai'
  );

  const requestMetadata = useMemo(() => ({ provider }), [provider]);

  const renderMessage = useCallback(({ message, isStreaming, onFeedback }: RenderMessageParams) => {
    return (
      <div className="space-y-3">
        <MessageBubble
          message={message}
          onFeedback={onFeedback}
          isStreaming={isStreaming && message.role === 'assistant'}
        />
        {message.role === 'assistant' && message.references?.length ? (
          <QAReferenceList references={message.references} />
        ) : null}
      </div>
    );
  }, []);

  const toolbarActions = (
    <div className="flex items-center space-x-2">
      <label htmlFor="qa-provider" className="text-sm text-text-tertiary">
        模型
      </label>
      <select
        id="qa-provider"
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
        apiUrl="/api/qa"
        placeholder="询问 Confluence 的使用、配置或集成问题..."
        className="h-full"
        title="Confluence QA Assistant"
        emptyState={QA_EMPTY_STATE}
        renderMessage={renderMessage}
        requestMetadata={requestMetadata}
        toolbarActions={toolbarActions}
      />
    </div>
  );
}
