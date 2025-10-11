import { NextRequest, NextResponse } from "next/server";
import {
  chatCompletionStream,
  resolveProvider,
} from '@/lib/providers/modelProvider';
import { buildProviderMessages, tracePrompt } from '@/lib/prompts/unifiedPrompt';

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

const CHAT_USER_PROMPT_INSTRUCTIONS = `### Task
- Follow the system guidelines above.
- Use the conversation history for additional context when crafting your response.`;

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
    const chatHistory = formattedPreviousMessages.join('\n');
    const currentMessageContent = messages[messages.length - 1].content;

    const { messages: providerMessages } = buildProviderMessages({
      question: currentMessageContent,
      chatHistory: chatHistory || undefined,
      instructions: CHAT_USER_PROMPT_INSTRUCTIONS,
    });

    tracePrompt({ label: 'chat.prompt', requestId: metrics.requestId }, providerMessages);

    const { stream, model } = await chatCompletionStream({
      messages: providerMessages,
      temperature: 0.4,
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
            const token = chunk?.choices?.[0]?.delta?.content;

            if (typeof token !== 'string') {
              continue;
            }

            metrics.messageCount++;
            controller.enqueue(encoder.encode(
              buildSSEMessage(
                SSEEventType.CONTENT,
                token,
                `${metrics.requestId}-${metrics.messageCount}`
              )
            ));
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
