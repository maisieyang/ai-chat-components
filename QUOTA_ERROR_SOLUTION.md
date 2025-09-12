# OpenAI API 配额错误解决方案

## 错误信息
```
429 You exceeded your current quota, please check your plan and billing details.
```

## 解决步骤

### 1. 检查 OpenAI 账户余额
1. 访问 [OpenAI Platform](https://platform.openai.com/)
2. 登录您的账户
3. 进入 "Usage" 页面查看当前余额
4. 如果余额不足，需要添加付款方式

### 2. 添加付款方式
1. 在 OpenAI Platform 中进入 "Settings" > "Billing"
2. 添加信用卡或其他付款方式
3. 设置使用限制（可选）

### 3. 检查 API 使用情况
1. 查看 "Usage" 页面了解当前使用量
2. 检查是否有异常使用情况
3. 考虑设置使用限制

### 4. 临时解决方案 - 使用 Mock 模式

如果暂时无法解决配额问题，可以临时切换回 Mock 模式：

```typescript
// 在 src/app/api/chat/route.ts 中
// 临时注释掉 OpenAI 调用，使用 Mock 响应
```

### 5. 长期解决方案
- 升级到付费计划
- 优化 API 调用频率
- 使用更便宜的模型（如 gpt-3.5-turbo）
- 实现缓存机制减少 API 调用

## 当前状态
项目已成功集成 LangChain + OpenAI，只需要解决 API 配额问题即可正常使用。
