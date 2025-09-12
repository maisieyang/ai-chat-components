'use client';

import React, { useState } from 'react';
import { ChatMessage, ChatWindowProps } from './types';

export function ChatWindow({ 
  apiUrl, 
  placeholder = "Type your message...",
  className = ""
}: ChatWindowProps) {
  // 核心状态：聊天历史列表
  const [chatHistoryList, setChatHistoryList] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 表单提交处理函数
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // 1. 添加用户消息到历史记录
    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim()
    };
    
    setChatHistoryList(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // 2. 发送到服务端
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...chatHistoryList, userMessage]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // 3. 处理流式响应
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      // 创建AI消息
      const aiMessage: ChatMessage = {
        role: 'ai',
        content: '',
        timestamp: new Date()
      };

      setChatHistoryList(prev => [...prev, aiMessage]);

      // 读取流式数据
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        setChatHistoryList(prev => 
          prev.map((msg, index) => 
            index === prev.length - 1 && msg.role === 'ai'
              ? { ...msg, content: msg.content + chunk }
              : msg
          )
        );
      }
      
    } catch (error) {
      console.error('Error:', error);
      // 添加错误消息
      const errorMessage: ChatMessage = {
        role: 'ai',
        content: 'Sorry, there was an error processing your request.',
        timestamp: new Date()
      };
      setChatHistoryList(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex flex-col h-[500px] border border-gray-300 rounded-lg overflow-hidden bg-white shadow-lg ${className}`}>
      {/* 聊天对话展示区域 */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {chatHistoryList.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            Start a conversation by typing a message below!
          </div>
        ) : (
          chatHistoryList.map((message, index) => (
            <div 
              key={index} 
              className={`mb-3 p-3 rounded-lg max-w-[80%] ${
                message.role === 'user' 
                  ? 'bg-blue-500 text-white ml-auto' 
                  : 'bg-white border border-gray-200 mr-auto'
              }`}
            >
              <div className="text-sm">{message.content}</div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="mb-3 p-3 rounded-lg max-w-[80%] bg-white border border-gray-200 mr-auto">
            <div className="text-sm text-gray-500">AI is thinking...</div>
          </div>
        )}
      </div>

      {/* 输入表单区域 */}
      <form onSubmit={handleSubmit} className="flex p-4 bg-white border-t border-gray-200">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          disabled={isLoading}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md mr-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
