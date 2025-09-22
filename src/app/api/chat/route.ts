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

const TEMPLATE = `你是一个技术写作助手。请根据用户的输入，生成一个结构化的技术回答。

要求：
1. 如果涉及代码，请提供完整的、可运行的代码示例
2. 使用Markdown格式组织内容
3. 为代码块指定正确的编程语言
4. 提供相关的引用和参考资料
5. 根据内容复杂度设置合适的难度级别
6. 包含表格、列表等丰富的内容格式

请以JSON格式回答，包含以下字段：
- content: 主要回答内容（Markdown格式）
- format: "markdown"
- codeBlocks: 代码块数组（包含language, code, filename, description）
- quotes: 引用数组（包含text, author, source）
- lists: 列表数组（包含type, items）
- tables: 表格数组（包含headers, rows, caption）
- metadata: 元数据对象（包含wordCount, readingTime, difficulty, topics）

当前对话:
{chat_history}

用户输入: {input}

请按照上述JSON格式回答:`;

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
     * 直接使用普通模型，在提示中要求JSON输出
     */
    const chain = prompt.pipe(model);

    const result = await chain.invoke({
      chat_history: formattedPreviousMessages.join("\n"),
      input: currentMessageContent,
    });

    // 提取JSON内容
    const extractJson = (output: string) => {
      const text = typeof output === 'string' ? output : output.content || output.toString();
      
      // 首先尝试匹配```json代码块
      const codeBlockPattern = /```json\s*([\s\S]*?)\s*```/g;
      const codeBlockMatches = text.match(codeBlockPattern);
      
      if (codeBlockMatches && codeBlockMatches.length > 0) {
        try {
          const jsonStr = codeBlockMatches[0].replace(/```json|```/g, "").trim();
          return JSON.parse(jsonStr);
        } catch (error) {
          console.error('Failed to parse JSON from code block:', error);
        }
      }
      
      // 如果没有找到代码块，尝试匹配纯JSON（以{开头，以}结尾）
      const jsonPattern = /\{[\s\S]*\}/g;
      const jsonMatches = text.match(jsonPattern);
      
      if (jsonMatches && jsonMatches.length > 0) {
        try {
          // 找到最长的JSON匹配（通常是完整的JSON）
          const longestMatch = jsonMatches.reduce((a, b) => a.length > b.length ? a : b);
          return JSON.parse(longestMatch);
        } catch (error) {
          console.error('Failed to parse JSON from text:', error);
        }
      }
      
      // 最后尝试直接解析整个文本
      try {
        return JSON.parse(text);
      } catch (error) {
        console.error('Failed to parse as JSON:', error);
        return null;
      }
    };

    const structuredData = extractJson(result);
    
    if (structuredData) {
      // 验证数据是否符合我们的模式
      try {
        const validatedResult = StructuredResponseSchema.parse(structuredData);
        return NextResponse.json(validatedResult, { status: 200 });
      } catch (validationError) {
        console.error('Validation error:', validationError);
        // 即使验证失败，也返回原始数据
        return NextResponse.json(structuredData, { status: 200 });
      }
    } else {
      // 如果无法解析JSON，返回基本响应
      const fallbackResponse = {
        content: typeof result === 'string' ? result : result.content || result.toString(),
        format: "markdown" as const,
        codeBlocks: [],
        quotes: [],
        lists: [],
        tables: [],
        metadata: {
          wordCount: (typeof result === 'string' ? result : result.content || result.toString()).length,
          readingTime: Math.ceil((typeof result === 'string' ? result : result.content || result.toString()).length / 200),
          difficulty: "intermediate" as const,
          topics: ["AI Response"]
        }
      };
      return NextResponse.json(fallbackResponse, { status: 200 });
    }
    
  } catch (e: unknown) {
    console.error('API Error:', e);
    const error = e as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}