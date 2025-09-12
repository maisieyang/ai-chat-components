

import { ChatWindow } from '../components/ChatWindow';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          AI Chat Components Demo
        </h1>
        <div className="max-w-4xl mx-auto">
          <ChatWindow 
            apiUrl="/api/chat"
            placeholder="Type your message..."
            className="mx-auto"
          />
        </div>
      </div>
    </div>
  );
}
