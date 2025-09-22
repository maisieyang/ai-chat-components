
import { ChatWindow } from '../components/ChatWindow';

export default function Home() {
  return (
    <div className="h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      <ChatWindow 
        apiUrl="/api/chat"
        placeholder="输入您的问题，AI将提供像Cursor一样清晰优雅的Markdown回答..."
        className="h-full"
      />
    </div>
  );
}
