'use client';

import React from 'react';
import { ChatMessage } from '../components/ChatWindow/types';
import { EnhancedMarkdownRenderer } from './EnhancedMarkdownRenderer';
import { MessageFeedback } from './MessageFeedback';

interface MessageBubbleProps {
  message: ChatMessage;
  className?: string;
  onFeedback?: (messageId: string, feedback: 'like' | 'dislike') => void;
}

export function MessageBubble({ message, className = '', onFeedback }: MessageBubbleProps) {
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
        // 用户消息 - 更自然的样式
        <div className="bg-blue-500 text-white p-4 rounded-2xl rounded-br-md shadow-sm">
          <div className="text-base whitespace-pre-wrap leading-relaxed">
            {message.content}
          </div>
          {message.timestamp && (
            <div className="text-sm mt-2 text-blue-100 opacity-80">
              {formatTime(message.timestamp)}
            </div>
          )}
        </div>
      ) : (
        // AI消息 - 无边框，更自然的文档阅读体验
        <div className="group">
          <div className="prose prose-lg max-w-none dark:prose-invert text-base leading-relaxed">
            <EnhancedMarkdownRenderer content={message.content} />
          </div>
          
          {/* 消息操作栏 */}
          <div className="flex items-center justify-between mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="flex items-center space-x-2">
              {message.timestamp && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {formatTime(message.timestamp)}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <MessageFeedback 
                messageId={message.timestamp?.getTime().toString() || 'unknown'}
                onFeedback={onFeedback}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
