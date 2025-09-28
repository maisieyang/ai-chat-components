/* eslint-disable @typescript-eslint/no-explicit-any */
import { remark } from 'remark';
import { visit } from 'unist-util-visit';
import type { Root, Heading, Code } from 'mdast';

/**
 * ChatGPT风格的AST-based Markdown处理器
 */

interface ProcessedBlock {
  type: 'normal' | 'collapsible' | 'code-example';
  content: string;
  title?: string;
  metadata?: {
    language?: string;
    isCodeBlock?: boolean;
    isImportant?: boolean;
  };
}

/**
 * ChatGPT风格的AST节点访问器 - 保持Markdown结构完整性
 */
function createBlockDetector() {
  const blocks: ProcessedBlock[] = [];
  let currentBlock: ProcessedBlock | null = null;
  let currentMarkdownContent: string[] = [];

  return {
    blocks,
    visitor: (node: any) => {
      // 检测标题节点
      if (node.type === 'heading') {
        // 保存之前的块
        if (currentBlock && currentMarkdownContent.length > 0) {
          // 确保块内容之间有适当的空行分隔
          const content = currentMarkdownContent
            .join('\n')
            .replace(/\n{3,}/g, '\n\n') // 清理多余空行
            .trim();
          currentBlock.content = content;
          blocks.push(currentBlock);
        }

        // 保持标题的Markdown格式
        const headingMarkdown = convertNodeToMarkdown(node);
        const headingText = extractTextFromNode(node);
        
        // 检测特殊标题
        if (headingText.includes('代码示例') || headingText.includes('Code Example')) {
          currentBlock = {
            type: 'code-example',
            title: headingText,
            content: '',
            metadata: { isCodeBlock: true }
          };
        } else if (headingText.includes('重要') || headingText.includes('注意')) {
          currentBlock = {
            type: 'collapsible',
            title: headingText,
            content: '',
            metadata: { isImportant: true }
          };
        } else {
          currentBlock = {
            type: 'normal',
            content: '',
            metadata: {}
          };
        }
        
        // 保存标题的Markdown格式，确保有换行
        currentMarkdownContent = [headingMarkdown.trim()];
      } else {
        // 收集其他内容，保持Markdown格式
        if (currentBlock) {
          const nodeMarkdown = convertNodeToMarkdown(node);
          if (nodeMarkdown.trim()) {
            currentMarkdownContent.push(nodeMarkdown);
          }
        }
      }
    },
    finalize: () => {
      // 保存最后一个块
      if (currentBlock && currentMarkdownContent.length > 0) {
        // 确保块内容之间有适当的空行分隔
        const content = currentMarkdownContent
          .join('\n')
          .replace(/\n{3,}/g, '\n\n') // 清理多余空行
          .trim();
        currentBlock.content = content;
        blocks.push(currentBlock);
      }
      return blocks;
    }
  };
}

/**
 * 从AST节点提取文本内容
 */
function extractTextFromNode(node: any): string {
  if (node.type === 'text') {
    return node.value;
  }
  
  if (node.children) {
    return node.children.map((child: any) => extractTextFromNode(child)).join('');
  }
  
  return '';
}

/**
 * 将AST节点转换回Markdown格式 - ChatGPT风格
 */
function convertNodeToMarkdown(node: any): string {
  switch (node.type) {
    case 'heading':
      const level = '#'.repeat(node.depth);
      const text = extractTextFromNode(node);
      return `${level} ${text}\n`;
    
    case 'paragraph':
      if (node.children) {
        const content = node.children.map((child: any) => convertNodeToMarkdown(child)).join('');
        return `${content}\n`;
      }
      return '';
    
    case 'text':
      return node.value || '';
    
    case 'strong':
      if (node.children) {
        const text = node.children.map((child: any) => convertNodeToMarkdown(child)).join('');
        return `**${text}**`;
      }
      return '';
    
    case 'emphasis':
      if (node.children) {
        const text = node.children.map((child: any) => convertNodeToMarkdown(child)).join('');
        return `*${text}*`;
      }
      return '';
    
    case 'inlineCode':
      return `\`${node.value || ''}\``;
    
    case 'list':
      const listItems = node.children?.map((item: any) => convertNodeToMarkdown(item)).join('\n') || '';
      return listItems;
    
    case 'listItem':
      const itemContent = node.children?.map((child: any) => convertNodeToMarkdown(child)).join('') || '';
      const marker = node.ordered ? '1.' : '-';
      return `${marker} ${itemContent}`;
    
    case 'blockquote':
      if (node.children) {
        const content = node.children.map((child: any) => convertNodeToMarkdown(child)).join('\n');
        return content.split('\n').map((line: string) => `> ${line}`).join('\n');
      }
      return '';
    
    case 'link':
      const linkText = node.children?.map((child: any) => convertNodeToMarkdown(child)).join('') || '';
      return `[${linkText}](${node.url})`;
    
    case 'image':
      return `![${node.alt || ''}](${node.url})`;

    case 'code': {
      const language = node.lang ? node.lang : '';
      const openingFence = language ? '```' + language + '\n' : '```\n';
      const value = node.value ?? '';
      return openingFence + value + '\n```';
    }
    
    case 'hr':
      return '---';
    
    case 'table': {
      const processor = remark();
      const tableMarkdown = processor.stringify({
        type: 'root',
        children: [node],
      } as Root);
      return tableMarkdown.trimEnd();
    }
    
    default:
      // 对于其他节点类型，尝试提取文本内容
      if (node.children) {
        return node.children.map((child: any) => convertNodeToMarkdown(child)).join('');
      }
      return '';
  }
}

/**
 * AST-based Markdown预处理
 */
export function processMarkdownWithAST(markdown: string): ProcessedBlock[] {
  try {
    // 1. 解析Markdown为AST
    const processor = remark();
    const ast = processor.parse(markdown) as Root;

    // 2. 创建块检测器
    const detector = createBlockDetector();

    // 3. 遍历AST节点
    visit(ast, detector.visitor);

    // 4. 获取处理后的块
    const blocks = detector.finalize();

    // 5. 如果没有检测到特殊块，返回单个普通块
    if (blocks.length === 0) {
      return [{
        type: 'normal',
        content: markdown,
        metadata: {}
      }];
    }

    return blocks;
  } catch (error) {
    console.error('AST processing failed, falling back to regex:', error);
    // 降级到正则处理
    return [{
      type: 'normal',
      content: markdown,
      metadata: {}
    }];
  }
}

/**
 * 规范化Markdown文本（ChatGPT风格）
 */
export function normalizeMarkdown(markdown: string): string {
  const processor = remark();
  
  try {
    // 解析为AST
    const ast = processor.parse(markdown);
    
    // 规范化处理
    const normalizedAst = processor
      .use(() => (tree: Root) => {
        visit(tree, 'heading', (node: Heading) => {
          // 确保标题格式正确
          if (node.children && node.children.length > 0) {
            const firstChild = node.children[0];
            if (firstChild.type === 'text') {
              // 确保标题文本前后没有多余空格
              firstChild.value = firstChild.value.trim();
            }
          }
        });

        visit(tree, 'list', (node) => {
          // 规范化列表项
          if (node.children) {
            node.children.forEach((item: any) => {
              if (item.children && item.children.length > 0) {
                const firstChild = item.children[0];
                if (firstChild.type === 'paragraph' && firstChild.children) {
                  const textChild = firstChild.children[0];
                  if (textChild.type === 'text') {
                    textChild.value = textChild.value.trim();
                  }
                }
              }
            });
          }
        });

        visit(tree, 'paragraph', (node) => {
          // 规范化段落
          if (node.children && node.children.length > 0) {
            const firstChild = node.children[0];
            const lastChild = node.children[node.children.length - 1];
            
            if (firstChild.type === 'text') {
              firstChild.value = firstChild.value.trimStart();
            }
            if (lastChild.type === 'text') {
              lastChild.value = lastChild.value.trimEnd();
            }
          }
        });
      })
      .runSync(ast);

    // 转换回Markdown
    return processor.stringify(normalizedAst as Root);
  } catch (error) {
    console.error('Normalization failed, returning original:', error);
    return markdown;
  }
}

/**
 * 检测代码块语言
 */
export function detectCodeBlockLanguage(content: string): string | null {
  const processor = remark();
  const ast = processor.parse(content);
  
  let detectedLanguage: string | null = null;
  
  visit(ast, 'code', (node: Code) => {
    if (node.lang) {
      detectedLanguage = node.lang;
    }
  });
  
  return detectedLanguage;
}

/**
 * 提取重要信息（ChatGPT风格）
 */
export function extractImportantInfo(content: string): {
  hasCodeBlocks: boolean;
  hasTables: boolean;
  hasLinks: boolean;
  languages: string[];
} {
  const processor = remark();
  const ast = processor.parse(content);
  
  const info = {
    hasCodeBlocks: false,
    hasTables: false,
    hasLinks: false,
    languages: [] as string[]
  };
  
  visit(ast, 'code', (node: Code) => {
    info.hasCodeBlocks = true;
    if (node.lang) {
      info.languages.push(node.lang);
    }
  });
  
  visit(ast, 'table', () => {
    info.hasTables = true;
  });
  
  visit(ast, 'link', () => {
    info.hasLinks = true;
  });
  
  return info;
}
