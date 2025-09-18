'use client';

import React from 'react';
import { ChatWindowProps } from './types';
import { useChat } from '../../hooks/useChat';
import { useAutoScroll } from '../../hooks/useAutoScroll';
import { MessageBubble } from '../MessageBubble';
import { ErrorMessage } from '../ErrorMessage';
import { ScrollToBottomButton } from '../ScrollToBottomButton';
import { ErrorBoundary } from '../ErrorBoundary';

export function ChatWindow({ 
  apiUrl, 
  placeholder = "Type your message...",
  className = ""
}: ChatWindowProps) {
  // 使用自定义 useChat Hook
  const {
    messages,
    input,
    setInput,
    sendMessage,
    isLoading,
    error,
    retry,
    retryCount,
    clearMessages
  } = useChat({
    apiUrl,
    onError: (error) => {
      console.error('Chat error:', error);
    },
    onSuccess: (message) => {
      console.log('Message sent successfully:', message);
    },
    maxRetries: 3,
    retryDelay: 1000
  });

  // 使用自动滚动 Hook
  const { scrollRef, scrollToBottom, isAtBottom } = useAutoScroll({
    enabled: true,
    behavior: 'smooth',
    threshold: 100
  });

  // 表单提交处理函数
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    await sendMessage(input.trim());
    setInput('');
  };

  return (
    <ErrorBoundary>
      <div className={`flex flex-col h-[500px] border border-gray-300 rounded-lg overflow-hidden bg-white shadow-lg ${className}`}>
        {/* 错误信息显示 */}
        <ErrorMessage
          error={error}
          onRetry={retry}
          onDismiss={() => {}} // 可以添加清除错误的功能
          retryCount={retryCount}
          maxRetries={3}
        />

        {/* 聊天对话展示区域 */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 bg-gray-50"
        >
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <p className="text-lg mb-2">🤖 AI Chat</p>
                <p>Start a conversation by typing a message below!</p>
                <button
                  onClick={clearMessages}
                  className="mt-4 px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                >
                  Clear History
                </button>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <MessageBubble
                key={index}
                message={message}
              />
            ))
          )}
          {isLoading && (
            <div className="mb-3 p-3 rounded-lg max-w-[80%] bg-white border border-gray-200 mr-auto">
              <div className="flex items-center text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                Assistant is thinking...
              </div>
            </div>
          )}
        </div>

        {/* 滚动到底部按钮 */}
        <ScrollToBottomButton
          onClick={scrollToBottom}
          isVisible={!isAtBottom && messages.length > 0}
        />

        {/* 输入表单区域 */}
        <form onSubmit={handleSubmit} className="flex p-4 bg-white border-t border-gray-200">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            disabled={isLoading}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md mr-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </ErrorBoundary>
  );
}
