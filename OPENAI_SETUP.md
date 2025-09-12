# LangChain + OpenAI API 配置说明

## 1. 获取 OpenAI API Key

1. 访问 [OpenAI Platform](https://platform.openai.com/)
2. 注册或登录账户
3. 进入 API Keys 页面
4. 创建新的 API Key

## 2. 配置环境变量

编辑 `.env.local` 文件，将 `YOUR_API_KEY` 替换为你的实际 API Key：

```bash
# OpenAI API Configuration
OPENAI_API_KEY="YOUR_API_KEY"
LANGCHAIN_CALLBACKS_BACKGROUND=false

# Optional: For Tracing with LangSmith
# LANGCHAIN_TRACING_V2=true
# LANGCHAIN_API_KEY=YOUR_API_KEY
# LANGCHAIN_PROJECT=ai-chat-components
```

## 3. 技术栈

- **LangChain**: 用于构建AI应用框架
- **@langchain/openai**: OpenAI模型集成
- **@langchain/core**: 核心功能
- **Vercel AI SDK**: 流式响应处理

## 4. 功能特性

- **流式响应**: 实时显示AI回复
- **对话历史**: 保持上下文对话
- **错误处理**: 完善的错误提示
- **类型安全**: 完整的TypeScript支持

## 5. 重启开发服务器

配置完成后，重启开发服务器：

```bash
npm run dev
```

## 6. 测试

在浏览器中访问 `http://localhost:3000`，输入消息测试 LangChain + OpenAI 集成。

## 注意事项

- 请妥善保管你的 API Key，不要提交到版本控制系统
- OpenAI API 按使用量收费，请注意控制成本
- 如果遇到 API 限制，请检查账户余额和配额
- 项目使用 LangChain 框架，支持更高级的AI功能扩展
