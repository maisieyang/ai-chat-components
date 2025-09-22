'use client';

import React from 'react';
import { ChatMessage } from '../components/ChatWindow/types';
import { EnhancedMarkdownRenderer } from './EnhancedMarkdownRenderer';

interface MessageBubbleProps {
  message: ChatMessage;
  className?: string;
}

export function MessageBubble({ message, className = '' }: MessageBubbleProps) {
  const formatTime = (timestamp?: Date) => {
    if (!timestamp) return '';
    return timestamp.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div 
      className={`mb-6 max-w-[90%] ${
        message.role === 'user' 
          ? 'ml-auto' 
          : 'mr-auto'
      } ${className}`}
    >
      {message.role === 'user' ? (
        // 用户消息保持简单样式
        <div className="bg-blue-500 text-white p-3 rounded-lg">
          <div className="text-sm whitespace-pre-wrap">
            {message.content}
          </div>
          {message.timestamp && (
            <div className="text-xs mt-1 text-blue-100">
              {formatTime(message.timestamp)}
            </div>
          )}
        </div>
      ) : (
        // AI消息使用增强的Markdown渲染器，支持交互式元素
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4">
            <EnhancedMarkdownRenderer content={message.content} />
          </div>
          {message.timestamp && (
            <div className="px-4 pb-3 text-xs text-gray-500 border-t border-gray-100">
              {formatTime(message.timestamp)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
