
import { ChatWindow } from '../components/ChatWindow';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              🤖 AI Chat with Cursor-style Output
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              体验像Cursor一样清晰优雅的Markdown输出，包含代码高亮、表格、列表等丰富内容
            </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
            <h3 className="font-semibold text-blue-800 mb-2">💡 试试这些提示：</h3>
            <ul className="text-sm text-blue-700 text-left space-y-1">
              <li>• "解释React Hooks的工作原理"</li>
              <li>• "写一个Python函数来计算斐波那契数列"</li>
              <li>• "比较TypeScript和JavaScript的优缺点"</li>
              <li>• "创建一个简单的Express.js API"</li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto">
              <ChatWindow 
                apiUrl="/api/chat"
                placeholder="输入您的问题，AI将提供像Cursor一样清晰优雅的Markdown回答..."
                className="mx-auto"
              />
        </div>
      </div>
    </div>
  );
}
