'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CodeCopyButton } from './CodeCopyButton';
import { CollapsibleSection } from './CollapsibleSection';

interface EnhancedMarkdownRendererProps {
  content: string;
}

export function EnhancedMarkdownRenderer({ content }: EnhancedMarkdownRendererProps) {

  // 检测代码块并添加复制按钮
  const renderCodeBlock = (props: any) => {
    const { children, className, ...rest } = props;
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';
    const code = String(children).replace(/\n$/, '');

    return (
      <div className="relative group">
        <SyntaxHighlighter
          style={tomorrow}
          language={language}
          PreTag="div"
          className="rounded-md"
          {...rest}
        >
          {code}
        </SyntaxHighlighter>
        <CodeCopyButton code={code} />
      </div>
    );
  };

  // 检测并处理可折叠的内容
  const processContent = (content: string) => {
    // 检测代码示例部分，可以折叠
    const codeSectionRegex = /(## 代码示例[\s\S]*?)(?=##|$)/g;
    const sections = [];
    let lastIndex = 0;
    let match;

    while ((match = codeSectionRegex.exec(content)) !== null) {
      // 添加前面的内容
      if (match.index > lastIndex) {
        sections.push({
          type: 'normal',
          content: content.slice(lastIndex, match.index)
        });
      }
      
      // 添加可折叠的代码部分
      sections.push({
        type: 'collapsible',
        title: '📝 代码示例',
        content: match[1]
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // 添加剩余内容
    if (lastIndex < content.length) {
      sections.push({
        type: 'normal',
        content: content.slice(lastIndex)
      });
    }
    
    return sections.length > 0 ? sections : [{ type: 'normal', content }];
  };

  const sections = processContent(content);

  return (
    <div className="prose prose-lg max-w-none text-base leading-relaxed">
      {sections.map((section, index) => {
        if (section.type === 'collapsible') {
          return (
            <CollapsibleSection
              key={index}
              title={section.title || '代码示例'}
              defaultOpen={true}
              className="my-4"
            >
              <ReactMarkdown
                components={{
                  code: renderCodeBlock,
                  h1: ({ ...props }) => <h1 className="text-2xl font-bold mt-4 mb-3 text-text-primary" {...props} />,
                  h2: ({ ...props }) => <h2 className="text-xl font-semibold mt-4 mb-2 text-text-primary" {...props} />,
                  h3: ({ ...props }) => <h3 className="text-lg font-semibold mt-3 mb-2 text-text-primary" {...props} />,
                  p: ({ ...props }) => <p className="mb-2 leading-relaxed text-text-primary" {...props} />,
                  ul: ({ ...props }) => <ul className="list-disc list-inside mb-2 ml-4 space-y-1" {...props} />,
                  ol: ({ ...props }) => <ol className="list-decimal list-inside mb-2 ml-4 space-y-1" {...props} />,
                  li: ({ ...props }) => <li className="text-text-primary" {...props} />,
                  a: ({ ...props }: any) => (
                    <a 
                      className="text-accent hover:text-accent hover:underline inline-flex items-center gap-1" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      {...props}
                    >
                      {props.children}
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  ),
                  blockquote: ({ ...props }) => (
                    <blockquote className="border-l-4 border-accent pl-4 italic text-text-secondary my-4 bg-bg-tertiary py-2 rounded-r" {...props} />
                  ),
                  table: ({ ...props }) => (
                    <div className="overflow-x-auto my-4">
                      <table className="min-w-full divide-y divide-border-default border border-border-default rounded-lg" {...props} />
                    </div>
                  ),
                  thead: ({ ...props }) => <thead className="bg-bg-secondary" {...props} />,
                  th: ({ ...props }) => (
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider" {...props} />
                  ),
                  tbody: ({ ...props }) => <tbody className="bg-bg-primary divide-y divide-border-default" {...props} />,
                  td: ({ ...props }) => (
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-text-primary" {...props} />
                  ),
                  hr: ({ ...props }) => <hr className="my-6 border-border-default" {...props} />,
                  strong: ({ ...props }) => <strong className="font-semibold text-text-primary" {...props} />,
                  em: ({ ...props }) => <em className="italic text-text-secondary" {...props} />,
                }}
              >
                {section.content}
              </ReactMarkdown>
            </CollapsibleSection>
          );
        } else {
          return (
            <ReactMarkdown
              key={index}
              components={{
                code({ className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  const isInline = !match;
                  
                  if (isInline) {
                    return (
                      <code className="bg-bg-tertiary px-1 py-0.5 rounded text-sm font-mono text-text-primary" {...props}>
                        {children}
                      </code>
                    );
                  }
                  
                  return (
                    <div className="relative group">
                      <SyntaxHighlighter
                        style={tomorrow}
                        language={match[1]}
                        PreTag="div"
                        className="rounded-md"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                      <CodeCopyButton code={String(children).replace(/\n$/, '')} />
                    </div>
                  );
                },
                h1: ({ ...props }) => <h1 className="text-3xl font-bold mt-6 mb-4 text-text-primary" {...props} />,
                h2: ({ ...props }) => <h2 className="text-2xl font-bold mt-5 mb-3 text-text-primary" {...props} />,
                h3: ({ ...props }) => <h3 className="text-xl font-semibold mt-4 mb-2 text-text-primary" {...props} />,
                h4: ({ ...props }) => <h4 className="text-lg font-semibold mt-3 mb-2 text-text-primary" {...props} />,
                p: ({ ...props }) => <p className="mb-3 leading-relaxed text-text-primary" {...props} />,
                ul: ({ ...props }) => <ul className="list-disc list-inside mb-3 ml-4 space-y-1" {...props} />,
                ol: ({ ...props }) => <ol className="list-decimal list-inside mb-3 ml-4 space-y-1" {...props} />,
                li: ({ ...props }) => <li className="text-text-primary" {...props} />,
                a: ({ ...props }) => (
                  <a 
                    className="text-accent hover:text-accent hover:underline inline-flex items-center gap-1" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    {...props}
                  >
                    {props.children}
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ),
                blockquote: ({ ...props }) => (
                  <blockquote className="border-l-4 border-accent pl-4 italic text-text-secondary my-4 bg-bg-tertiary py-2 rounded-r" {...props} />
                ),
                table: ({ ...props }) => (
                  <div className="overflow-x-auto my-4">
                    <table className="min-w-full divide-y divide-border-default border border-border-default rounded-lg" {...props} />
                  </div>
                ),
                thead: ({ ...props }) => <thead className="bg-bg-secondary" {...props} />,
                th: ({ ...props }) => (
                  <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider" {...props} />
                ),
                tbody: ({ ...props }) => <tbody className="bg-bg-primary divide-y divide-border-default" {...props} />,
                td: ({ ...props }) => (
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-text-primary" {...props} />
                ),
                hr: ({ ...props }) => <hr className="my-6 border-border-default" {...props} />,
                strong: ({ ...props }) => <strong className="font-semibold text-text-primary" {...props} />,
                em: ({ ...props }) => <em className="italic text-text-secondary" {...props} />,
              }}
            >
              {section.content}
            </ReactMarkdown>
          );
        }
      })}
    </div>
  );
}
