'use client';

import React from 'react';
import { ChatMessage } from '../components/ChatWindow/types';
import { MarkdownRenderer } from './MarkdownRenderer';

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
        // AI消息支持结构化内容
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          {message.structuredContent ? (
            // 如果有结构化内容，使用MarkdownRenderer
            <div className="p-4">
              <MarkdownRenderer response={message.structuredContent} />
            </div>
          ) : (
            // 否则显示普通文本
            <div className="p-3">
              <div className="text-sm whitespace-pre-wrap text-gray-800">
                {message.content}
              </div>
            </div>
          )}
          {message.timestamp && (
            <div className="px-3 pb-2 text-xs text-gray-500">
              {formatTime(message.timestamp)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
