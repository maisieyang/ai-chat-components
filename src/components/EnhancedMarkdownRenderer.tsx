'use client';

import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { useDarkMode } from '../hooks/useDarkMode';
import { createMarkdownComponents } from './MarkdownComponents';
import { processMarkdownWithAST, normalizeMarkdown, extractImportantInfo } from '../utils/astMarkdownProcessor';
import { CollapsibleSection } from './CollapsibleSection';

interface EnhancedMarkdownRendererProps {
  content: string;
}

export function EnhancedMarkdownRenderer({ content }: EnhancedMarkdownRendererProps) {
  // 使用自定义Hook检测主题
  const { isDarkMode, isLoaded } = useDarkMode();
  
  // ChatGPT风格的AST-based处理
  const processedData = useMemo(() => {
    // 1. 规范化Markdown
    const normalizedContent = normalizeMarkdown(content);
    
    // 2. AST-based块检测和处理
    const astBlocks = processMarkdownWithAST(normalizedContent);
    
    // 3. 提取重要信息
    const importantInfo = extractImportantInfo(normalizedContent);
    
    return {
      normalizedContent,
      astBlocks,
      importantInfo
    };
  }, [content]);
  
  // 性能优化：缓存Markdown组件
  const markdownComponents = useMemo(() => {
    return createMarkdownComponents({ isDarkMode });
  }, [isDarkMode]);
  
  // 如果主题还未加载，显示加载状态
  if (!isLoaded) {
    return (
      <div className="prose prose-lg max-w-none">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="prose prose-lg max-w-[70ch] mx-auto">
      {processedData.astBlocks.map((block, index) => {
        // ChatGPT风格的块渲染
        if (block.type === 'code-example' || block.type === 'collapsible') {
          return (
            <CollapsibleSection
              key={index}
              title={block.title || '代码示例'}
              defaultOpen={true}
              className="my-4"
            >
              <ReactMarkdown components={markdownComponents}>
                {block.content}
              </ReactMarkdown>
            </CollapsibleSection>
          );
        }

        // 普通块渲染
        return (
          <ReactMarkdown
            key={index}
            components={markdownComponents}
          >
            {block.content}
          </ReactMarkdown>
        );
      })}
    </div>
  );
}
