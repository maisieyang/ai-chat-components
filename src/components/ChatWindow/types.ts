// ChatMessage 接口定义 - 与 Vercel AI SDK 对齐
export interface ReferenceLink {
  index: number;
  title: string;
  url?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  references?: ReferenceLink[];
  metadata?: Record<string, unknown>;
}

export interface RenderMessageParams {
  message: ChatMessage;
  index: number;
  messages: ChatMessage[];
  isStreaming: boolean;
  onFeedback: (messageId: string, feedback: 'like' | 'dislike') => void;
}

export interface EmptyStateConfig {
  icon?: string;
  headline: string;
  description?: string;
  suggestions?: string[];
}

// ChatWindow 组件的 Props 接口
export interface ChatWindowProps {
  apiUrl: string;
  placeholder?: string;
  className?: string;
  title?: string;
  emptyState?: EmptyStateConfig;
  renderMessage?: (params: RenderMessageParams) => React.ReactNode;
}
