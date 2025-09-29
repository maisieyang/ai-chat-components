import { NextRequest, NextResponse } from "next/server";
import { PromptTemplate } from "@langchain/core/prompts";
import {
  chatCompletionStream,
  resolveProvider,
  type ProviderChatMessage,
} from '@/lib/providers/modelProvider';

export const runtime = "nodejs";

// 标准SSE事件类型
enum SSEEventType {
  CONTENT = 'content',
  DONE = 'done', 
  ERROR = 'error',
  METADATA = 'metadata'
}

// 标准SSE消息格式
interface SSEMessage {
  type: SSEEventType;
  data: string;
  id?: string;
  retry?: number;
}

// 性能监控指标
interface PerformanceMetrics {
  requestId: string;
  startTime: number;
  messageCount: number;
  errorCount: number;
}

interface VercelChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const formatMessage = (message: VercelChatMessage) => `${message.role}: ${message.content}`;

// SSE消息构建函数
const buildSSEMessage = (type: SSEEventType, data: string, id?: string): string => {
  const message: SSEMessage = { type, data };
  if (id) message.id = id;
  
  return `data: ${JSON.stringify(message)}\n\n`;
};

// 性能监控函数
const createPerformanceMetrics = (): PerformanceMetrics => ({
  requestId: crypto.randomUUID(),
  startTime: Date.now(),
  messageCount: 0,
  errorCount: 0
});

const logPerformanceMetrics = (metrics: PerformanceMetrics, error?: Error) => {
  const duration = Date.now() - metrics.startTime;
  console.log(JSON.stringify({
    type: 'performance_metrics',
    requestId: metrics.requestId,
    duration,
    messageCount: metrics.messageCount,
    errorCount: metrics.errorCount,
    error: error?.message,
    timestamp: new Date().toISOString()
  }));
};

const TEMPLATE = `You are a technical writing assistant. Generate clear, well-structured technical responses using ChatGPT-style formatting.

## Formatting Requirements

Use standard Markdown syntax with proper spacing:

- Headers: # Header, ## Subheader, ### Section
- Lists: - Item or 1. Item (with space after marker)
- Code: inline code and language blocks
- Links: [text](url) with descriptive text
- Tables: Standard Markdown table syntax

## ChatGPT-Style Elements

Include these visual elements for better readability:

- **Emoji anchors**: Use 👉, ⚠️, ✅, 🔵, 📝, 🔗 for visual anchors
- **Callout boxes**: Use > for important notes and warnings
- **Visual separators**: Use --- between major sections
- **Progressive disclosure**: Start with overview, then dive into details
- **Interactive elements**: End with questions like "Would you like me to explain [specific aspect]?"

## Response Structure

Organize content with clear hierarchy:
1. **Title + Background** → Set user expectations
2. **Core content blocks** → Break down into digestible sections
3. **Examples/Code** → Minimal runnable examples
4. **Visual elements** → Use emojis and callouts for emphasis
5. **Summary + Interaction** → Consolidate knowledge & guide next steps

## Example Format

# Main Topic

Brief introduction with context.

## Key Concepts

👉 **Core Concept 1**: Brief explanation
👉 **Core Concept 2**: Brief explanation

### Implementation

\`\`\`javascript
// Minimal runnable example
console.log('Hello World');
\`\`\`

> ⚠️ **Important**: Key takeaway or warning

---

## Summary

✅ **Key Points**:
- Point 1
- Point 2

🔗 **References**: [Documentation](https://example.com)

Would you like me to dive deeper into [specific aspect]?

---

Chat History:
{chat_history}

User Input: {input}

Provide a comprehensive technical response in ChatGPT-style Markdown format:`;

const SYSTEM_PROMPT = 'You are a technical writing assistant. Produce clear technical answers, follow any formatting instructions provided by the user prompt, and keep responses concise yet complete.';

export async function POST(req: NextRequest) {
  const metrics = createPerformanceMetrics();
  const baseOrigins = ['https://intranet.bank.local'];
  const envOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()).filter(Boolean)
    : [];
  const devOrigins = process.env.NODE_ENV !== 'production'
    ? ['http://localhost:3000', 'http://127.0.0.1:3000']
    : [];

  const allowedOrigins = [...new Set([...baseOrigins, ...envOrigins, ...devOrigins])];

  const origin = req.headers.get('origin');
  const effectiveOrigin = origin && allowedOrigins.includes(origin)
    ? origin
    : allowedOrigins[0];

  if (origin && !allowedOrigins.includes(origin)) {
    return NextResponse.json(
      { error: 'Origin not allowed.' },
      {
        status: 403,
        headers: {
          'Access-Control-Allow-Origin': allowedOrigins[0],
          Vary: 'Origin',
        },
      }
    );
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const headerUserId = req.headers.get('x-internal-user-id');
  const headerTenantId = req.headers.get('x-tenant-id');
  const fallbackUserId = process.env.DEFAULT_INTERNAL_USER_ID || 'dev-user';
  const fallbackTenantId = process.env.DEFAULT_TENANT_ID || 'dev-tenant';

  const userId = headerUserId ?? (isProduction ? null : fallbackUserId);
  const tenantId = headerTenantId ?? (isProduction ? null : fallbackTenantId);

  if (!userId || !tenantId) {
    return NextResponse.json(
      { error: 'Missing authentication context.' },
      {
        status: 401,
        headers: {
          'Access-Control-Allow-Origin': effectiveOrigin,
          Vary: 'Origin',
        },
      }
    );
  }
  
  try {
    const body = await req.json();
    const messages: VercelChatMessage[] = body.messages ?? [];
    const requestedProvider = typeof body.provider === 'string' ? body.provider : undefined;
    const provider = resolveProvider(requestedProvider);
    
    // 输入验证
    if (!messages.length || !messages[messages.length - 1]?.content) {
      metrics.errorCount++;
      return NextResponse.json(
        { error: 'Invalid request: missing messages or content' }, 
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': effectiveOrigin,
            Vary: 'Origin',
          }
        }
      );
    }

    const formattedPreviousMessages = messages.slice(0, -1).map(formatMessage);
    const currentMessageContent = messages[messages.length - 1].content;
    const prompt = PromptTemplate.fromTemplate(TEMPLATE);

    const promptContext = await prompt.format({
      chat_history: formattedPreviousMessages.join("\n"),
      input: currentMessageContent,
    });

    const providerMessages: ProviderChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: promptContext },
    ];

    const { stream, model } = await chatCompletionStream({
      messages: providerMessages,
      temperature: 0.7,
      provider,
    });

    // 创建标准SSE流式响应
    const encoder = new TextEncoder();
    
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          // 发送开始元数据
          controller.enqueue(encoder.encode(
            buildSSEMessage(
              SSEEventType.METADATA,
              JSON.stringify({
                requestId: metrics.requestId,
                timestamp: new Date().toISOString(),
                model,
                provider,
              }),
              metrics.requestId
            )
          ));

          for await (const chunk of stream) {
            const token = chunk?.choices?.[0]?.delta?.content ?? '';

            if (token && token.trim()) {
              metrics.messageCount++;
              controller.enqueue(encoder.encode(
                buildSSEMessage(
                  SSEEventType.CONTENT,
                  token,
                  `${metrics.requestId}-${metrics.messageCount}`
                )
              ));
            }
          }
          
          // 发送完成信号
          controller.enqueue(encoder.encode(
            buildSSEMessage(SSEEventType.DONE, '', `${metrics.requestId}-done`)
          ));
          
          controller.close();
          logPerformanceMetrics(metrics);
          
        } catch (error) {
          metrics.errorCount++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          controller.enqueue(encoder.encode(
            buildSSEMessage(SSEEventType.ERROR, errorMessage, `${metrics.requestId}-error`)
          ));
          
          controller.close();
          logPerformanceMetrics(metrics, error as Error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // 禁用Nginx缓冲
        'Access-Control-Allow-Origin': effectiveOrigin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Internal-User-Id, X-Tenant-Id',
        Vary: 'Origin',
      },
    });
    
  } catch (e: unknown) {
    metrics.errorCount++;
    const error = e as Error;
    logPerformanceMetrics(metrics, error);
    
    return NextResponse.json({ 
      error: error.message,
      requestId: metrics.requestId 
    }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': effectiveOrigin,
        Vary: 'Origin',
      }
    });
  }
}
