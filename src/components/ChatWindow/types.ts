// ChatMessage 接口定义
export interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  timestamp?: Date;
}

// ChatWindow 组件的 Props 接口
export interface ChatWindowProps {
  apiUrl: string;
  placeholder?: string;
  className?: string;
}
