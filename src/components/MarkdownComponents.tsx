'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { chatgptTheme, chatgptDarkTheme } from '../styles/chatgpt-syntax-theme';
import { CodeCopyButton } from './CodeCopyButton';
import { VisualSeparator } from './VisualSeparator';

interface MarkdownComponentsProps {
  isDarkMode: boolean;
}

export function createMarkdownComponents({ isDarkMode }: MarkdownComponentsProps) {
  // 代码块渲染器
  const renderCodeBlock = (props: any) => {
    const { children, className, ...rest } = props;
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';
    const code = String(children).replace(/\n$/, '');

    return (
      <div className="relative group my-6">
        <div 
          className="rounded-xl overflow-hidden border shadow-sm hover:shadow-md transition-all duration-300" 
          style={{ 
            backgroundColor: 'var(--main-surface-tertiary)',
            borderColor: 'var(--border-light)'
          }}
        >
          {language && (
            <div 
              className="flex items-center justify-between px-4 py-3 border-b" 
              style={{
                backgroundColor: 'var(--main-surface-secondary)',
                borderColor: 'var(--border-light)'
              }}
            >
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <span 
                  className="text-xs font-medium uppercase tracking-wide px-2 py-1 rounded" 
                  style={{ 
                    color: 'var(--text-tertiary)',
                    backgroundColor: 'var(--main-surface-tertiary)'
                  }}
                >
                  {language}
                </span>
              </div>
              <CodeCopyButton code={code} />
            </div>
          )}
          <div className="p-4 overflow-x-auto">
            <SyntaxHighlighter
              style={isDarkMode ? chatgptDarkTheme : chatgptTheme}
              language={language}
              PreTag="div"
              className="!bg-transparent !p-0 text-sm leading-relaxed"
              {...rest}
            >
              {code}
            </SyntaxHighlighter>
          </div>
        </div>
      </div>
    );
  };

  // 内联代码渲染器
  const renderInlineCode = (props: any) => (
    <code 
      className="px-2 py-1 rounded text-sm font-mono border" 
      style={{ 
        backgroundColor: 'var(--main-surface-tertiary)',
        color: 'var(--text-primary)',
        borderColor: 'var(--border-light)'
      }} 
      {...props}
    />
  );

  // 代码渲染器（统一处理内联和块级）
  const code = ({ children, className, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const isInline = !match;
    
    if (isInline) {
      return renderInlineCode({ children, ...props });
    }
    
    return renderCodeBlock({ children, className, ...props });
  };

  // 链接渲染器
  const link = ({ children, ...props }: any) => (
    <a 
      className="hover:underline inline-flex items-center gap-1 transition-colors duration-200" 
      target="_blank" 
      rel="noopener noreferrer"
      {...props}
    >
      {children}
      <svg className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  );

  // 表格渲染器
  const table = ({ children, ...props }: any) => (
    <div className="overflow-x-auto">
      <table {...props}>
        {children}
      </table>
    </div>
  );

  // 分隔线渲染器
  const hr = ({ ...props }: any) => <VisualSeparator {...props} />;

  return {
    code,
    a: link,
    table,
    hr,
  };
}
