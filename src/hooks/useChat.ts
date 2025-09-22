'use client';

import { useState, useCallback, useRef } from 'react';
import { ChatMessage } from '../components/ChatWindow/types';

interface UseChatOptions {
  apiUrl: string;
  onError?: (error: Error) => void;
  onSuccess?: (message: ChatMessage) => void;
  onStart?: () => void;
  onComplete?: () => void;
  maxRetries?: number;
  retryDelay?: number;
}

interface UseChatReturn {
  messages: ChatMessage[];
  input: string;
  setInput: (input: string) => void;
  sendMessage: (content: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  retry: () => Promise<void>;
  retryCount: number;
  clearMessages: () => void;
}

export function useChat(options: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // 使用 ref 来避免循环依赖
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // 清除消息
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setRetryCount(0);
  }, []);

  // 处理结构化响应
  const handleStructuredResponse = useCallback(async (response: Response) => {
    const data = await response.json();
    
    // 创建AI消息，包含结构化内容
    const aiMessage: ChatMessage = {
      role: 'assistant',
      content: data.content || 'No content received',
      timestamp: new Date(),
      structuredContent: data // 将整个响应作为结构化内容
    };

    setMessages(prev => [...prev, aiMessage]);
  }, []);

  // 发送消息的核心逻辑
  const sendMessageCore = useCallback(async (content: string, currentMessages: ChatMessage[]) => {
    if (!content.trim() || isLoading) return;

    // 调用开始回调
    optionsRef.current.onStart?.();
    setError(null);

    // 1. 添加用户消息
    const userMessage: ChatMessage = {
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };
    
    const newMessages = [...currentMessages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // 2. 发送API请求
      const response = await fetch(optionsRef.current.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // 3. 处理结构化响应
      await handleStructuredResponse(response);

      // 调用成功回调
      const lastMessage = newMessages[newMessages.length - 1];
      if (lastMessage) {
        optionsRef.current.onSuccess?.(lastMessage);
      }
      
    } catch (error) {
      console.error('Chat Error:', error);
      const errorObj = error as Error;
      setError(errorObj.message);
      
      // 调用错误回调
      optionsRef.current.onError?.(errorObj);
      
      // 添加错误消息
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, there was an error processing your request.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      // 调用完成回调
      optionsRef.current.onComplete?.();
    }
  }, [isLoading, handleStructuredResponse]);

  // 发送消息
  const sendMessage = useCallback(async (content: string) => {
    await sendMessageCore(content, messages);
  }, [sendMessageCore, messages]);

  // 重试机制
  const retry = useCallback(async () => {
    if (retryCount >= (optionsRef.current.maxRetries || 3)) {
      setError('Maximum retry attempts reached');
      return;
    }
    
    setRetryCount(prev => prev + 1);
    setError(null);
    
    // 重新发送最后一条用户消息
    const lastUserMessage = messages[messages.length - 1];
    if (lastUserMessage && lastUserMessage.role === 'user') {
      await sendMessageCore(lastUserMessage.content, messages.slice(0, -1));
    }
  }, [retryCount, messages, sendMessageCore]);

  return {
    messages,
    input,
    setInput,
    sendMessage,
    isLoading,
    error,
    retry,
    retryCount,
    clearMessages
  };
}