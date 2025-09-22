import { z } from 'zod';

// 定义代码块模式
export const CodeBlockSchema = z.object({
  language: z.string().describe("编程语言"),
  code: z.string().describe("代码内容"),
  filename: z.string().optional().describe("文件名"),
  description: z.string().optional().describe("代码说明"),
  lineNumbers: z.boolean().default(true).describe("是否显示行号")
});

// 定义引用模式
export const QuoteSchema = z.object({
  text: z.string().describe("引用内容"),
  author: z.string().optional().describe("作者"),
  source: z.string().optional().describe("来源")
});

// 定义列表模式
export const ListSchema = z.object({
  type: z.enum(['ordered', 'unordered']).describe("列表类型"),
  items: z.array(z.string()).describe("列表项")
});

// 定义表格模式
export const TableSchema = z.object({
  headers: z.array(z.string()).describe("表头"),
  rows: z.array(z.array(z.string())).describe("表格行数据"),
  caption: z.string().optional().describe("表格标题")
});

// 定义元数据模式
export const MetadataSchema = z.object({
  wordCount: z.number().describe("字数统计"),
  readingTime: z.number().describe("预计阅读时间（分钟）"),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).describe("难度级别"),
  topics: z.array(z.string()).describe("相关主题")
});

// 定义主要的结构化响应模式 - 最简版本，避免optional字段
export const StructuredResponseSchema = z.object({
  // 主要内容
  content: z.string().describe("主要回答内容，使用Markdown格式"),
  
  // 格式类型
  format: z.enum(['markdown', 'plain', 'html']).describe("内容格式"),
  
  // 代码块数组 - 无optional字段
  codeBlocks: z.array(z.object({
    language: z.string().describe("编程语言"),
    code: z.string().describe("代码内容"),
    filename: z.string().describe("文件名"),
    description: z.string().describe("代码说明")
  })).describe("代码块列表"),
  
  // 引用块 - 无optional字段
  quotes: z.array(z.object({
    text: z.string().describe("引用内容"),
    author: z.string().describe("作者"),
    source: z.string().describe("来源")
  })).describe("引用列表"),
  
  // 列表项 - 无optional字段
  lists: z.array(z.object({
    type: z.enum(['ordered', 'unordered']).describe("列表类型"),
    items: z.array(z.string()).describe("列表项")
  })).describe("列表"),
  
  // 表格数据 - 无optional字段
  tables: z.array(z.object({
    headers: z.array(z.string()).describe("表头"),
    rows: z.array(z.array(z.string())).describe("表格行数据"),
    caption: z.string().describe("表格标题")
  })).describe("表格数据"),
  
  // 元数据
  metadata: z.object({
    wordCount: z.number().describe("字数统计"),
    readingTime: z.number().describe("预计阅读时间（分钟）"),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).describe("难度级别"),
    topics: z.array(z.string()).describe("相关主题")
  }).describe("内容元数据")
});

// 导出类型
export type CodeBlock = z.infer<typeof CodeBlockSchema>;
export type Quote = z.infer<typeof QuoteSchema>;
export type List = z.infer<typeof ListSchema>;
export type Table = z.infer<typeof TableSchema>;
export type Metadata = z.infer<typeof MetadataSchema>;
export type StructuredResponse = z.infer<typeof StructuredResponseSchema>;
