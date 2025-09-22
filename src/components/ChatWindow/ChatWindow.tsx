'use client';

import React from 'react';
import { ChatWindowProps } from './types';
import { useChat } from '../../hooks/useChat';
import { useAutoScroll } from '../../hooks/useAutoScroll';
import { MessageBubble } from '../MessageBubble';
import { ErrorMessage } from '../ErrorMessage';
import { ScrollToBottomButton } from '../ScrollToBottomButton';
import { ErrorBoundary } from '../ErrorBoundary';
import { ThemeToggle } from '../ThemeToggle';
import { ThemeTest } from '../ThemeTest';

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

  // 反馈处理函数
  const handleFeedback = (messageId: string, feedback: 'like' | 'dislike') => {
    console.log(`Feedback for message ${messageId}: ${feedback}`);
    // 这里可以添加反馈收集逻辑
  };

  return (
    <ErrorBoundary>
      <div className={`flex flex-col h-screen bg-white dark:bg-gray-900 transition-colors duration-200 ${className}`}>
        {/* 顶部工具栏 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            AI Chat Assistant
          </h1>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <ThemeTest />
          </div>
        </div>

        {/* 错误信息显示 */}
        <ErrorMessage
          error={error}
          onRetry={retry}
          onDismiss={() => {}} // 可以添加清除错误的功能
          retryCount={retryCount}
          maxRetries={3}
        />

        {/* 聊天对话展示区域 - 全屏阅读体验 */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-6 bg-white dark:bg-gray-900"
        >
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <div className="text-center max-w-md">
                <div className="text-6xl mb-4">🤖</div>
                <h2 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-white">
                  AI Chat Assistant
                </h2>
                <p className="text-lg mb-6 text-gray-600 dark:text-gray-300">
                  开始对话，获得智能回答
                </p>
                <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                  <p>💡 尝试问："解释React Hooks的工作原理"</p>
                  <p>💡 或者："写一个Python函数来计算斐波那契数列"</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              {messages.map((message, index) => (
                <MessageBubble
                  key={index}
                  message={message}
                  onFeedback={handleFeedback}
                />
              ))}
              {isLoading && (
                <div className="mb-6 max-w-[90%] mr-auto">
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                    AI正在思考中...
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 滚动到底部按钮 */}
        <ScrollToBottomButton
          onClick={scrollToBottom}
          isVisible={!isAtBottom && messages.length > 0}
        />

        {/* 输入表单区域 - 全屏宽度 */}
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-4">
            <div className="flex items-end space-x-3">
              <div className="flex-1">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={placeholder}
                  disabled={isLoading}
                  rows={1}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed resize-none"
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-6 py-3 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
              >
                {isLoading ? '发送中...' : '发送'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ErrorBoundary>
  );
}
