'use client';

import React, { useRef, useEffect } from 'react';
import { ChatWindowProps } from './types';
import { useChat } from '../../hooks/useChat';
import { useAutoScroll } from '../../hooks/useAutoScroll';
import { MessageBubble } from '../MessageBubble';
import { ErrorMessage } from '../ErrorMessage';
import { ScrollToBottomButton } from '../ScrollToBottomButton';
import { ErrorBoundary } from '../ErrorBoundary';
import { ThemeToggle } from '../ThemeToggle';

export function ChatWindow({ 
  apiUrl, 
  placeholder = "Type your message...",
  className = ""
}: ChatWindowProps) {
  // 输入框引用
  const inputRef = useRef<HTMLTextAreaElement>(null);

      // 使用自定义 useChat Hook
      const {
        messages,
        input,
        setInput,
        sendMessage,
        isLoading,
        error,
        connectionStatus,
        retry,
        retryCount,
        clearMessages,
        metrics
      } = useChat({
    apiUrl,
    onError: (error) => {
      console.error('Chat error:', error);
    },
    onSuccess: (message) => {
      console.log('Message sent successfully:', message);
    },
    onComplete: () => {
      // 消息发送完成后，重新聚焦到输入框
      if (inputRef.current) {
        inputRef.current.focus();
      }
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

  // 页面加载时自动聚焦到输入框
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // 表单提交处理函数
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const messageToSend = input.trim();
    setInput(''); // 立即清除输入框
    await sendMessage(messageToSend);
  };

  // 反馈处理函数
  const handleFeedback = (messageId: string, feedback: 'like' | 'dislike') => {
    console.log(`Feedback for message ${messageId}: ${feedback}`);
    // 这里可以添加反馈收集逻辑
  };

  return (
    <ErrorBoundary>
      <div className={`flex flex-col h-screen bg-bg-primary transition-colors duration-200 ${className}`}>
            {/* 顶部工具栏 */}
            <div className="flex items-center justify-between p-4 bg-bg-primary">
              <div className="flex items-center space-x-3">
                <h1 className="text-xl font-semibold text-text-primary">
                  AI Chat Assistant
                </h1>
                {/* 连接状态指示器 */}
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    connectionStatus === 'connected' ? 'bg-success' :
                    connectionStatus === 'connecting' ? 'bg-warning animate-pulse' :
                    connectionStatus === 'error' ? 'bg-error' :
                    'bg-text-tertiary'
                  }`}></div>
                  <span className="text-sm text-text-tertiary">
                    {connectionStatus === 'connected' ? '已连接' :
                     connectionStatus === 'connecting' ? '连接中...' :
                     connectionStatus === 'error' ? '连接错误' :
                     '未连接'}
                  </span>
                </div>
              </div>
              <ThemeToggle />
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
          className="flex-1 overflow-y-auto px-4 py-6 bg-bg-primary"
        >
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-text-tertiary">
              <div className="text-center max-w-md">
                <div className="text-6xl mb-4">🤖</div>
                <h2 className="text-3xl font-semibold mb-2 text-text-primary">
                  AI Chat Assistant
                </h2>
                <p className="text-xl mb-6 text-text-secondary">
                  开始对话，获得智能回答
                </p>
                <div className="space-y-2 text-base text-text-tertiary">
                  <p>💡 尝试问："解释React Hooks的工作原理"</p>
                  <p>💡 或者："写一个Python函数来计算斐波那契数列"</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto px-4">
              {messages.map((message, index) => (
                <MessageBubble
                  key={index}
                  message={message}
                  onFeedback={handleFeedback}
                  isStreaming={isLoading && index === messages.length - 1 && message.role === 'assistant'}
                />
              ))}
              {isLoading && (
                <div className="flex justify-start mb-6">
                  <div className="max-w-[85%] lg:max-w-[70%]">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-bg-tertiary rounded-full flex items-center justify-center">
                        <span className="text-sm">🤖</span>
                      </div>
                      <div className="flex items-center text-base text-text-tertiary">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent mr-3"></div>
                        AI正在思考中...
                      </div>
                    </div>
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
        <div className="bg-bg-primary">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-4">
            <div className="flex items-end space-x-3">
              <div className="flex-1">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={placeholder}
                  disabled={isLoading}
                  rows={1}
                  className="w-full px-4 py-3 rounded-2xl bg-bg-tertiary text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent disabled:bg-bg-secondary disabled:cursor-not-allowed resize-none text-base leading-relaxed border-0 shadow-sm"
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (input.trim() && !isLoading) {
                        const messageToSend = input.trim();
                        setInput(''); // 立即清除输入框
                        sendMessage(messageToSend);
                      }
                    }
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-6 py-3 bg-interactive-primary text-text-inverted rounded-2xl hover:bg-interactive-primary-hover disabled:bg-bg-tertiary disabled:cursor-not-allowed transition-colors duration-200 font-medium text-base shadow-sm"
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
