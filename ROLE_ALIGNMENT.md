# Role 对齐文档

## 与 LangChain NextJS Template 的角色对齐

### 更新前 vs 更新后

| 方面 | 更新前 | 更新后 | LangChain 模板 |
|------|--------|--------|----------------|
| **用户角色** | `'user'` | `'user'` | `'user'` ✅ |
| **AI 角色** | `'ai'` | `'assistant'` | `'assistant'` ✅ |
| **系统角色** | 无 | `'system'` | `'system'` ✅ |

### 具体更改

#### 1. ChatMessage 接口更新
```typescript
// 更新前
export interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  timestamp?: Date;
}

// 更新后 - 与 Vercel AI SDK 对齐
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}
```

#### 2. API 路由更新
```typescript
// 更新前
interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  timestamp?: Date;
}

// 更新后
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}
```

#### 3. useChat Hook 更新
```typescript
// 更新前
const aiMessage: ChatMessage = {
  role: 'ai',
  content: '',
  timestamp: new Date()
};

// 更新后
const aiMessage: ChatMessage = {
  role: 'assistant',
  content: '',
  timestamp: new Date()
};
```

#### 4. 流式处理更新
```typescript
// 更新前
index === prev.length - 1 && msg.role === 'ai'

// 更新后
index === prev.length - 1 && msg.role === 'assistant'
```

#### 5. UI 文本更新
```typescript
// 更新前
"AI is thinking..."

// 更新后
"Assistant is thinking..."
```

### 对齐的好处

1. **兼容性**：与 Vercel AI SDK 完全兼容
2. **标准化**：遵循 OpenAI API 和 LangChain 的标准
3. **扩展性**：支持 `system` 角色，为未来功能扩展做准备
4. **一致性**：与 LangChain 模板保持完全一致

### 支持的角色类型

- `'user'`：用户消息
- `'assistant'`：AI 助手消息
- `'system'`：系统消息（用于系统提示等）

### 验证结果

- ✅ 构建成功
- ✅ 类型检查通过
- ✅ ESLint 检查通过
- ✅ 与 LangChain 模板完全对齐
