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
      <figure className="code-block-shell group">
        <div className="code-block-toolbar">
          <div className="flex items-center gap-2 text-[0.7rem] tracking-[0.3em]">
            <span className="code-window-dots">
              <span className="code-window-dot dot-red" />
              <span className="code-window-dot dot-yellow" />
              <span className="code-window-dot dot-green" />
            </span>
            <span className="code-language-tag">{language || 'code'}</span>
          </div>
          <CodeCopyButton code={code} className="code-copy-button" />
        </div>
        <SyntaxHighlighter
          style={isDarkMode ? chatgptDarkTheme : chatgptTheme}
          language={language || undefined}
          PreTag="pre"
          CodeTag="code"
          className="code-block"
          wrapLongLines
          {...rest}
        >
          {code}
        </SyntaxHighlighter>
      </figure>
    );
  };

  // 内联代码渲染器
  const renderInlineCode = ({ children, ...props }: any) => (
    <code className="inline-code" {...props}>
      {children}
    </code>
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
