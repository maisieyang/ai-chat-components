'use client';

import React from 'react';
import { ChatMessage } from '../components/ChatWindow/types';

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
      className={`mb-3 p-3 rounded-lg max-w-[80%] ${
        message.role === 'user' 
          ? 'bg-blue-500 text-white ml-auto' 
          : 'bg-white border border-gray-200 mr-auto'
      } ${className}`}
    >
      <div className="text-sm whitespace-pre-wrap">
        {message.content}
      </div>
      {message.timestamp && (
        <div className={`text-xs mt-1 ${
          message.role === 'user' 
            ? 'text-blue-100' 
            : 'text-gray-500'
        }`}>
          {formatTime(message.timestamp)}
        </div>
      )}
    </div>
  );
}
