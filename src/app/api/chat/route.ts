import { NextRequest, NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";

export const runtime = "edge";

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

const formatMessage = (message: VercelChatMessage) => {
  return `${message.role}: ${message.content}`;
};

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

const TEMPLATE = `你是一个技术写作助手。请根据用户的输入，生成一个清晰、结构化的技术回答，就像Cursor那样优雅。

要求：
1. 使用Markdown格式组织内容，结构清晰
2. 使用 # ## ### 等标题层级来组织内容
3. 代码块使用 \`\`\`语言 格式，确保语法高亮正确
4. 表格使用标准Markdown表格语法
5. 列表使用 - 或 1. 格式
6. 引用使用 > 格式
7. 内联代码使用 \`code\` 格式
8. 提供完整的、可运行的代码示例
9. 包含相关的引用和参考资料，使用外部链接图标
10. 根据内容复杂度设置合适的难度级别

特别要求：
- 对于代码相关内容，使用 "## 代码示例" 作为标题，这样可以被自动识别为可折叠区域
- 提供多个代码示例时，每个示例都要有清晰的说明
- 链接要包含描述性文本，不要只是URL
- 使用表情符号来增强可读性（如 📝 代码示例，🔗 参考资料等）

当前对话:
{chat_history}

用户输入: {input}

请直接输出Markdown格式的内容，不需要JSON包装：`;

export async function POST(req: NextRequest) {
  const metrics = createPerformanceMetrics();
  
  try {
    const body = await req.json();
    const messages: VercelChatMessage[] = body.messages ?? [];
    
    // 输入验证
    if (!messages.length || !messages[messages.length - 1]?.content) {
      metrics.errorCount++;
      return NextResponse.json(
        { error: 'Invalid request: missing messages or content' }, 
        { status: 400 }
      );
    }

    const formattedPreviousMessages = messages.slice(0, -1).map(formatMessage);
    const currentMessageContent = messages[messages.length - 1].content;
    const prompt = PromptTemplate.fromTemplate(TEMPLATE);

    // 检查API密钥
    if (!process.env.OPENAI_API_KEY) {
      metrics.errorCount++;
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file.' }, 
        { status: 500 }
      );
    }

    const model = new ChatOpenAI({
      model: "gpt-4o-mini",
      temperature: 0.7,
      streaming: true,
      maxTokens: 4000,
      timeout: 30000, // 30秒超时
    });

    const chain = prompt.pipe(model);
    const stream = await chain.stream({
      chat_history: formattedPreviousMessages.join("\n"),
      input: currentMessageContent,
    });

    // 创建标准SSE流式响应
    const encoder = new TextEncoder();
    
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          // 发送开始元数据
          controller.enqueue(encoder.encode(
            buildSSEMessage(SSEEventType.METADATA, JSON.stringify({
              requestId: metrics.requestId,
              timestamp: new Date().toISOString(),
              model: 'gpt-4o-mini'
            }), metrics.requestId)
          ));

          for await (const chunk of stream) {
            // 处理LangChain的AIMessageChunk
            let content = '';
            if (chunk && typeof chunk === 'object' && 'content' in chunk) {
              content = (chunk as { content: string }).content;
            } else if (typeof chunk === 'string') {
              content = chunk;
            }
            
            if (content && content.trim()) {
              metrics.messageCount++;
              controller.enqueue(encoder.encode(
                buildSSEMessage(SSEEventType.CONTENT, content, `${metrics.requestId}-${metrics.messageCount}`)
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
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
    
  } catch (e: unknown) {
    metrics.errorCount++;
    const error = e as Error;
    logPerformanceMetrics(metrics, error);
    
    return NextResponse.json({ 
      error: error.message,
      requestId: metrics.requestId 
    }, { status: 500 });
  }
}