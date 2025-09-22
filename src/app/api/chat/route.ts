import { NextRequest, NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StructuredResponseSchema } from "@/lib/schemas";
import { zodToJsonSchema } from "zod-to-json-schema";

export const runtime = "edge";

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

const formatMessage = (message: ChatMessage) => {
  return `${message.role}: ${message.content}`;
};

const TEMPLATE = `你是一个技术写作助手。请根据用户的输入，生成一个清晰、结构化的技术回答。

要求：
1. 使用Markdown格式组织内容，就像Cursor那样清晰
2. 使用 # ## ### 等标题层级来组织内容
3. 代码块使用 \`\`\`语言 格式，确保语法高亮正确
4. 表格使用标准Markdown表格语法
5. 列表使用 - 或 1. 格式
6. 引用使用 > 格式
7. 内联代码使用 \`code\` 格式
8. 提供完整的、可运行的代码示例
9. 包含相关的引用和参考资料
10. 根据内容复杂度设置合适的难度级别

当前对话:
{chat_history}

用户输入: {input}

请直接输出Markdown格式的内容，不需要JSON包装：`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = body.messages ?? [];
    const formattedPreviousMessages = messages.slice(0, -1).map(formatMessage);
    const currentMessageContent = messages[messages.length - 1].content;
    const prompt = PromptTemplate.fromTemplate(TEMPLATE);

    // 检查API密钥
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file.' }, 
        { status: 500 }
      );
    }

    const model = new ChatOpenAI({
      model: "gpt-4o-mini",
      temperature: 0.7,
    });

    /**
     * 直接使用普通模型，输出纯净的Markdown
     */
    const chain = prompt.pipe(model);

    const result = await chain.invoke({
      chat_history: formattedPreviousMessages.join("\n"),
      input: currentMessageContent,
    });

    // 直接返回Markdown内容，就像Cursor那样
    const markdownContent = typeof result === 'string' ? result : result.content || result.toString();
    
    return NextResponse.json({ 
      content: markdownContent,
      format: "markdown"
    }, { status: 200 });
    
  } catch (e: unknown) {
    console.error('API Error:', e);
    const error = e as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}