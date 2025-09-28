import { NextRequest } from 'next/server';
import { getKnowledgeBase, QAEngine } from '@/lib/pipeline';
import type { ChatMessage } from '@/components/ChatWindow/types';

export const runtime = 'nodejs';

enum SSEEventType {
  CONTENT = 'content',
  DONE = 'done',
  ERROR = 'error',
  METADATA = 'metadata',
}

interface SSEMessage {
  type: SSEEventType;
  data: string;
  id?: string;
  retry?: number;
}

interface PerformanceMetrics {
  requestId: string;
  startTime: number;
  messageCount: number;
  errorCount: number;
}

const DEFAULT_MAX_PAGES = Number(process.env.CONFLUENCE_MAX_PAGES ?? '1');
const DEFAULT_PAGE_LIMIT = Number(process.env.CONFLUENCE_PAGE_LIMIT ?? '10');

const buildSSEMessage = (type: SSEEventType, data: string, id?: string): string => {
  const message: SSEMessage = { type, data };
  if (id) {
    message.id = id;
  }
  return `data: ${JSON.stringify(message)}\n\n`;
};

const createPerformanceMetrics = (): PerformanceMetrics => ({
  requestId: crypto.randomUUID(),
  startTime: Date.now(),
  messageCount: 0,
  errorCount: 0,
});

const logPerformanceMetrics = (metrics: PerformanceMetrics, error?: Error) => {
  const duration = Date.now() - metrics.startTime;
  console.log(JSON.stringify({
    type: 'qa_performance_metrics',
    requestId: metrics.requestId,
    duration,
    messageCount: metrics.messageCount,
    errorCount: metrics.errorCount,
    error: error?.message,
    timestamp: new Date().toISOString(),
  }));
};

const formatChatHistory = (messages: ChatMessage[]) =>
  messages
    .map((message) => `${message.role}: ${message.content}`)
    .join('\n');

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  const metrics = createPerformanceMetrics();

  try {
    const body = await req.json();
    const messages: ChatMessage[] = body?.messages ?? [];

    if (!messages.length || !messages[messages.length - 1]?.content?.trim()) {
      throw new Error('Invalid request: missing messages or content.');
    }

    const latestMessage = messages[messages.length - 1];
    const chatHistory = formatChatHistory(messages.slice(0, -1));

    const knowledgeBase = await getKnowledgeBase({
      maxPages: DEFAULT_MAX_PAGES,
      pageLimit: DEFAULT_PAGE_LIMIT,
    });

    const qa = new QAEngine(knowledgeBase.store);
    const { references, stream } = await qa.createStreamingCompletion(latestMessage.content, chatHistory);

    const readableStream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (type: SSEEventType, data: string, id?: string) => {
          controller.enqueue(encoder.encode(buildSSEMessage(type, data, id)));
        };

        try {
          send(
            SSEEventType.METADATA,
            JSON.stringify({ requestId: metrics.requestId, references })
          );

          let chunkIndex = 0;
          for await (const chunk of stream) {
            const token = chunk.choices?.[0]?.delta?.content ?? '';
            if (!token) {
              continue;
            }

            metrics.messageCount += 1;
            send(
              SSEEventType.CONTENT,
              token,
              `${metrics.requestId}-chunk-${chunkIndex}`
            );
            chunkIndex += 1;
          }

          send(SSEEventType.DONE, '', `${metrics.requestId}-done`);
          controller.close();
          logPerformanceMetrics(metrics);
        } catch (error) {
          metrics.errorCount += 1;
          send(
            SSEEventType.ERROR,
            (error as Error).message ?? 'Unknown error',
            `${metrics.requestId}-error`
          );
          controller.close();
          logPerformanceMetrics(metrics, error as Error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    metrics.errorCount += 1;
    logPerformanceMetrics(metrics, error as Error);

    const readableStream = new ReadableStream<Uint8Array>({
      start(controller) {
        const send = (type: SSEEventType, data: string, id?: string) => {
          controller.enqueue(encoder.encode(buildSSEMessage(type, data, id)));
        };

        const errorMessage = (error as Error)?.message ?? 'Unable to answer the question at this time.';
        send(
          SSEEventType.ERROR,
          errorMessage,
          `${metrics.requestId}-error`
        );
        send(SSEEventType.DONE, '', `${metrics.requestId}-done`);
        controller.close();
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
