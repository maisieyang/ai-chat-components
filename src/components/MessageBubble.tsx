'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
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
        // AI消息直接渲染Markdown，就像Cursor那样
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 prose prose-lg max-w-none">
            <ReactMarkdown
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={tomorrow}
                      language={match[1]}
                      PreTag="div"
                      className="rounded-md"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono" {...props}>
                      {children}
                    </code>
                  );
                },
                h1: ({ node, ...props }) => <h1 className="text-3xl font-bold mt-6 mb-4 text-gray-900" {...props} />,
                h2: ({ node, ...props }) => <h2 className="text-2xl font-bold mt-5 mb-3 text-gray-900" {...props} />,
                h3: ({ node, ...props }) => <h3 className="text-xl font-semibold mt-4 mb-2 text-gray-900" {...props} />,
                h4: ({ node, ...props }) => <h4 className="text-lg font-semibold mt-3 mb-2 text-gray-900" {...props} />,
                p: ({ node, ...props }) => <p className="mb-3 leading-relaxed text-gray-800" {...props} />,
                ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-3 ml-4 space-y-1" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-3 ml-4 space-y-1" {...props} />,
                li: ({ node, ...props }) => <li className="text-gray-800" {...props} />,
                a: ({ node, ...props }) => <a className="text-blue-600 hover:text-blue-800 hover:underline" {...props} />,
                blockquote: ({ node, ...props }) => (
                  <blockquote className="border-l-4 border-blue-400 pl-4 italic text-gray-600 my-4 bg-blue-50 py-2" {...props} />
                ),
                table: ({ node, ...props }) => (
                  <div className="overflow-x-auto my-4">
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg" {...props} />
                  </div>
                ),
                thead: ({ node, ...props }) => <thead className="bg-gray-50" {...props} />,
                th: ({ node, ...props }) => (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" {...props} />
                ),
                tbody: ({ node, ...props }) => <tbody className="bg-white divide-y divide-gray-200" {...props} />,
                td: ({ node, ...props }) => (
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900" {...props} />
                ),
                hr: ({ node, ...props }) => <hr className="my-6 border-gray-200" {...props} />,
                strong: ({ node, ...props }) => <strong className="font-semibold text-gray-900" {...props} />,
                em: ({ node, ...props }) => <em className="italic text-gray-700" {...props} />,
              }}
            >
              {message.content}
            </ReactMarkdown>
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
