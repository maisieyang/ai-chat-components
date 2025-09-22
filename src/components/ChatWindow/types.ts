import { StructuredResponse } from '@/lib/schemas';

// ChatMessage 接口定义 - 与 Vercel AI SDK 对齐
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  structuredContent?: StructuredResponse; // 新增结构化内容字段
}

// ChatWindow 组件的 Props 接口
export interface ChatWindowProps {
  apiUrl: string;
  placeholder?: string;
  className?: string;
}
