'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { StructuredResponse } from '@/lib/schemas';

interface MarkdownRendererProps {
  response: StructuredResponse;
}

export function MarkdownRenderer({ response }: MarkdownRendererProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 主要内容 */}
      <div className="prose prose-lg max-w-none">
        <ReactMarkdown
          components={{
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <SyntaxHighlighter
                  style={tomorrow}
                  language={match[1]}
                  PreTag="div"
                  className="rounded-lg"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
          }}
        >
          {response.content}
        </ReactMarkdown>
      </div>

      {/* 代码块 */}
      {response.codeBlocks && response.codeBlocks.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800">代码示例</h3>
          {response.codeBlocks.map((block, index) => (
            <div key={index} className="bg-gray-900 rounded-lg overflow-hidden shadow-lg">
              <div className="bg-gray-800 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-300 font-mono">
                    {block.language}
                  </span>
                  {block.filename && (
                    <span className="text-xs text-gray-400 font-mono">
                      {block.filename}
                    </span>
                  )}
                </div>
                <button 
                  className="text-xs text-gray-400 hover:text-white transition-colors"
                  onClick={() => copyToClipboard(block.code)}
                >
                  复制代码
                </button>
              </div>
              <SyntaxHighlighter
                style={tomorrow}
                language={block.language}
                showLineNumbers={block.lineNumbers}
                className="!m-0 !p-4"
              >
                {block.code}
              </SyntaxHighlighter>
              {block.description && (
                <div className="bg-gray-800 px-4 py-2 text-sm text-gray-300 border-t border-gray-700">
                  <p className="mb-0">{block.description}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 引用块 */}
      {response.quotes && response.quotes.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800">引用</h3>
          {response.quotes.map((quote, index) => (
            <blockquote 
              key={index} 
              className="border-l-4 border-blue-500 pl-4 italic text-gray-700 bg-gray-50 py-4 rounded-r-lg"
            >
              <p className="mb-2">"{quote.text}"</p>
              {(quote.author || quote.source) && (
                <footer className="text-sm text-gray-500">
                  {quote.author && <span>— {quote.author}</span>}
                  {quote.source && <span> ({quote.source})</span>}
                </footer>
              )}
            </blockquote>
          ))}
        </div>
      )}

      {/* 列表 */}
      {response.lists && response.lists.length > 0 && (
        <div className="space-y-4">
          {response.lists.map((list, index) => (
            <div key={index}>
              {list.type === 'ordered' ? (
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  {list.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="pl-2">
                      {item}
                    </li>
                  ))}
                </ol>
              ) : (
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  {list.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="pl-2">
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 表格 */}
      {response.tables && response.tables.length > 0 && (
        <div className="space-y-4">
          {response.tables.map((table, index) => (
            <div key={index} className="overflow-x-auto">
              {table.caption && (
                <h4 className="text-lg font-medium mb-2 text-gray-800">{table.caption}</h4>
              )}
              <table className="min-w-full border-collapse border border-gray-300 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-gray-100">
                    {table.headers.map((header, headerIndex) => (
                      <th 
                        key={headerIndex} 
                        className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-800"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
                      {row.map((cell, cellIndex) => (
                        <td 
                          key={cellIndex} 
                          className="border border-gray-300 px-4 py-2 text-gray-700"
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* 元数据 */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h3 className="text-lg font-semibold mb-3 text-gray-800">内容信息</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex flex-col">
            <span className="font-medium text-gray-600">字数:</span> 
            <span className="text-gray-800">{response.metadata.wordCount}</span>
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-gray-600">阅读时间:</span> 
            <span className="text-gray-800">{response.metadata.readingTime}分钟</span>
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-gray-600">难度:</span> 
            <span className={`px-2 py-1 rounded text-xs ${
              response.metadata.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
              response.metadata.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {response.metadata.difficulty === 'beginner' ? '初级' :
               response.metadata.difficulty === 'intermediate' ? '中级' : '高级'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-gray-600">主题:</span> 
            <div className="flex flex-wrap gap-1 mt-1">
              {response.metadata.topics.map((topic, topicIndex) => (
                <span 
                  key={topicIndex}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 辅助函数
function copyToClipboard(text: string): void {
  navigator.clipboard.writeText(text).then(() => {
    // 可以添加toast通知
    console.log('代码已复制到剪贴板');
  }).catch(err => {
    console.error('复制失败:', err);
  });
}
