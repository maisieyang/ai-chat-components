'use client';

import React, { useState } from 'react';

interface MessageFeedbackProps {
  messageId: string;
  onFeedback?: (messageId: string, feedback: 'like' | 'dislike') => void;
  className?: string;
}

export function MessageFeedback({ messageId, onFeedback, className = '' }: MessageFeedbackProps) {
  const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(null);

  const handleFeedback = (type: 'like' | 'dislike') => {
    setFeedback(type);
    onFeedback?.(messageId, type);
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <button
        onClick={() => handleFeedback('like')}
        className={`p-2 rounded-md transition-colors duration-200 bg-bg-tertiary shadow-sm ${
          feedback === 'like'
            ? 'text-success bg-green-50 dark:bg-green-900/20'
            : 'text-text-tertiary hover:text-success hover:bg-green-50 dark:hover:bg-green-900/20'
        }`}
        title="有用"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.834a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
        </svg>
      </button>
      
      <button
        onClick={() => handleFeedback('dislike')}
        className={`p-2 rounded-md transition-colors duration-200 bg-bg-tertiary shadow-sm ${
          feedback === 'dislike'
            ? 'text-error bg-red-50 dark:bg-red-900/20'
            : 'text-text-tertiary hover:text-error hover:bg-red-50 dark:hover:bg-red-900/20'
        }`}
        title="无用"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.834a2 2 0 00-1.106-1.79l-.05-.025A4 4 0 0011.057 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
        </svg>
      </button>
    </div>
  );
}
