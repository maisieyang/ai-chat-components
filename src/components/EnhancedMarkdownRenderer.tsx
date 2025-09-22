'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CodeCopyButton } from './CodeCopyButton';
import { CollapsibleSection } from './CollapsibleSection';

interface EnhancedMarkdownRendererProps {
  content: string;
}

export function EnhancedMarkdownRenderer({ content }: EnhancedMarkdownRendererProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // 检测代码块并添加复制按钮
  const renderCodeBlock = (props: any) => {
    const { children, className, ...rest } = props;
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';
    const code = String(children).replace(/\n$/, '');

    return (
      <div className="relative group">
        <SyntaxHighlighter
          style={tomorrow as any}
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
    <div className="prose prose-lg max-w-none">
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
                  h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mt-4 mb-3 text-gray-900" {...props} />,
                  h2: ({ node, ...props }) => <h2 className="text-xl font-semibold mt-4 mb-2 text-gray-900" {...props} />,
                  h3: ({ node, ...props }) => <h3 className="text-lg font-semibold mt-3 mb-2 text-gray-900" {...props} />,
                  p: ({ node, ...props }) => <p className="mb-2 leading-relaxed text-gray-800" {...props} />,
                  ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-2 ml-4 space-y-1" {...props} />,
                  ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-2 ml-4 space-y-1" {...props} />,
                  li: ({ node, ...props }) => <li className="text-gray-800" {...props} />,
                  a: ({ node, ...props }: any) => (
                    <a 
                      className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1" 
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
                  blockquote: ({ node, ...props }) => (
                    <blockquote className="border-l-4 border-blue-400 pl-4 italic text-gray-600 my-4 bg-blue-50 py-2 rounded-r" {...props} />
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
                {section.content}
              </ReactMarkdown>
            </CollapsibleSection>
          );
        } else {
          return (
            <ReactMarkdown
              key={index}
              components={{
                code({ node, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  const isInline = !match;
                  
                  if (isInline) {
                    return (
                      <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono" {...props}>
                        {children}
                      </code>
                    );
                  }
                  
                  return (
                    <div className="relative group">
                      <SyntaxHighlighter
                        style={tomorrow as any}
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
                h1: ({ node, ...props }) => <h1 className="text-3xl font-bold mt-6 mb-4 text-gray-900" {...props} />,
                h2: ({ node, ...props }) => <h2 className="text-2xl font-bold mt-5 mb-3 text-gray-900" {...props} />,
                h3: ({ node, ...props }) => <h3 className="text-xl font-semibold mt-4 mb-2 text-gray-900" {...props} />,
                h4: ({ node, ...props }) => <h4 className="text-lg font-semibold mt-3 mb-2 text-gray-900" {...props} />,
                p: ({ node, ...props }) => <p className="mb-3 leading-relaxed text-gray-800" {...props} />,
                ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-3 ml-4 space-y-1" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-3 ml-4 space-y-1" {...props} />,
                li: ({ node, ...props }) => <li className="text-gray-800" {...props} />,
                a: ({ node, ...props }) => (
                  <a 
                    className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1" 
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
                blockquote: ({ node, ...props }) => (
                  <blockquote className="border-l-4 border-blue-400 pl-4 italic text-gray-600 my-4 bg-blue-50 py-2 rounded-r" {...props} />
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
              {section.content}
            </ReactMarkdown>
          );
        }
      })}
    </div>
  );
}
