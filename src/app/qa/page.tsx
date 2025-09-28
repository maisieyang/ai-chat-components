'use client';

import { useCallback } from 'react';
import { ChatWindow } from '@/components/ChatWindow';
import { MessageBubble } from '@/components/MessageBubble';
import { QAReferenceList } from '@/components/QAReferenceList';
import type { RenderMessageParams } from '@/components/ChatWindow/types';

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

  return (
    <div className="h-screen bg-bg-primary transition-colors duration-200">
      <ChatWindow
        apiUrl="/api/qa"
        placeholder="询问 Confluence 的使用、配置或集成问题..."
        className="h-full"
        title="Confluence QA Assistant"
        emptyState={QA_EMPTY_STATE}
        renderMessage={renderMessage}
      />
    </div>
  );
}
