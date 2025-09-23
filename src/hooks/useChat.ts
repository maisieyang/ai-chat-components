'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { ChatMessage } from '../components/ChatWindow/types';

// SSE事件类型
enum SSEEventType {
  CONTENT = 'content',
  DONE = 'done',
  ERROR = 'error', 
  METADATA = 'metadata'
}

// SSE消息接口
interface SSEMessage {
  type: SSEEventType;
  data: string;
  id?: string;
  retry?: number;
}

// 连接状态
enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error'
}

// 性能指标
interface PerformanceMetrics {
  requestId?: string;
  startTime: number;
  messageCount: number;
  errorCount: number;
  latency: number[];
}

interface UseChatOptions {
  apiUrl: string;
  onError?: (error: Error) => void;
  onSuccess?: (message: ChatMessage) => void;
  onStart?: () => void;
  onComplete?: () => void;
  onConnectionChange?: (status: ConnectionStatus) => void;
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
  connectionStatus: ConnectionStatus;
  retry: () => Promise<void>;
  retryCount: number;
  clearMessages: () => void;
  metrics: PerformanceMetrics;
}

export function useChat(options: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    startTime: 0,
    messageCount: 0,
    errorCount: 0,
    latency: []
  });

  // 使用 ref 来避免循环依赖
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // 清除消息
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setRetryCount(0);
  }, []);

  // 更新连接状态
  const updateConnectionStatus = useCallback((status: ConnectionStatus) => {
    setConnectionStatus(status);
    optionsRef.current.onConnectionChange?.(status);
  }, []);

  // 处理标准SSE流式响应
  const handleStreamingResponse = useCallback(async (response: Response) => {
    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let aiMessage: ChatMessage = {
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };

    // 添加空的AI消息到消息列表
    setMessages(prev => [...prev, aiMessage]);
    updateConnectionStatus(ConnectionStatus.CONNECTED);

    const startTime = Date.now();
    let messageCount = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (!data.trim()) continue;

            try {
              const sseMessage: SSEMessage = JSON.parse(data);
              
              switch (sseMessage.type) {
                case SSEEventType.METADATA:
                  // 处理元数据
                  const metadata = JSON.parse(sseMessage.data);
                  setMetrics(prev => ({
                    ...prev,
                    requestId: metadata.requestId,
                    startTime: Date.now()
                  }));
                  break;

                case SSEEventType.CONTENT:
                  // 处理内容块
                  messageCount++;
                  aiMessage.content += sseMessage.data;
                  
                  setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = { ...aiMessage };
                    return newMessages;
                  });
                  
                  // 更新性能指标
                  setMetrics(prev => ({
                    ...prev,
                    messageCount: prev.messageCount + 1,
                    latency: [...prev.latency.slice(-9), Date.now() - startTime]
                  }));
                  break;

                case SSEEventType.DONE:
                  // 流式响应完成
                  updateConnectionStatus(ConnectionStatus.DISCONNECTED);
                  optionsRef.current.onComplete?.();
                  return;

                case SSEEventType.ERROR:
                  // 处理错误
                  const errorMessage = sseMessage.data;
                  setError(errorMessage);
                  setMetrics(prev => ({ ...prev, errorCount: prev.errorCount + 1 }));
                  updateConnectionStatus(ConnectionStatus.ERROR);
                  optionsRef.current.onError?.(new Error(errorMessage));
                  return;
              }
            } catch (e) {
              console.warn('Failed to parse SSE message:', data, e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
      updateConnectionStatus(ConnectionStatus.DISCONNECTED);
    }
  }, [updateConnectionStatus]);

  // 发送消息的核心逻辑
  const sendMessageCore = useCallback(async (content: string, currentMessages: ChatMessage[]) => {
    if (!content.trim() || isLoading) return;

    // 调用开始回调
    optionsRef.current.onStart?.();
    setError(null);
    updateConnectionStatus(ConnectionStatus.CONNECTING);

    // 重置性能指标
    setMetrics({
      startTime: Date.now(),
      messageCount: 0,
      errorCount: 0,
      latency: []
    });

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

      // 3. 处理流式响应
      await handleStreamingResponse(response);

      // 调用成功回调
      const lastMessage = newMessages[newMessages.length - 1];
      if (lastMessage) {
        optionsRef.current.onSuccess?.(lastMessage);
      }
      
    } catch (error) {
      console.error('Chat Error:', error);
      const errorObj = error as Error;
      setError(errorObj.message);
      updateConnectionStatus(ConnectionStatus.ERROR);
      
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
    }
  }, [isLoading, handleStreamingResponse, updateConnectionStatus]);

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
    connectionStatus,
    retry,
    retryCount,
    clearMessages,
    metrics
  };
}