// Markdown预处理工具函数

/**
 * 修复标题格式：确保#后面有空格
 */
function fixHeadings(text: string): string {
  return text.replace(/^(#{1,6})([^#\s\n])/gm, '$1 $2');
}

/**
 * 修复列表格式
 */
function fixLists(text: string): string {
  return text
    .replace(/^(\s*)([-*+])([^\s\n])/gm, '$1$2 $3')
    .replace(/^(\s*)(\d+)\.([^\s\n])/gm, '$1$2. $3');
}

/**
 * 修复标题后直接跟内容的问题
 */
function fixHeadingContentSeparation(text: string): string {
  return text.replace(/^(#{1,6}\s+[^\n]+)([^\n#\s])/gm, '$1\n\n$2');
}

/**
 * 清理多余空行
 */
function cleanExtraNewlines(text: string): string {
  return text.replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * 主要的Markdown预处理函数
 */
export function preprocessMarkdown(text: string): string {
  console.log('原始内容:', text.substring(0, 200));
  
  const processed = cleanExtraNewlines(
    fixLists(
      fixHeadingContentSeparation(
        fixHeadings(text)
      )
    )
  );
  
  console.log('处理后内容:', processed.substring(0, 200));
  return processed;
}

/**
 * 检测并处理可折叠的内容
 */
export function processCollapsibleContent(content: string) {
  // 检测代码示例部分，可以折叠
  const codeSectionRegex = /(## 代码示例[\s\S]*?)(?=##|$)/g;
  const sections: Array<{ type: 'normal' | 'collapsible'; content: string; title?: string }> = [];
  let lastIndex = 0;
  let match;

  while ((match = codeSectionRegex.exec(content)) !== null) {
    // 添加代码示例之前的内容
    if (match.index > lastIndex) {
      const beforeContent = content.slice(lastIndex, match.index).trim();
      if (beforeContent) {
        sections.push({ type: 'normal', content: beforeContent });
      }
    }

    // 添加可折叠的代码示例部分
    const codeContent = match[1].trim();
    const titleMatch = codeContent.match(/^## (.+)/);
    const title = titleMatch ? titleMatch[1] : '代码示例';
    
    sections.push({
      type: 'collapsible',
      content: codeContent,
      title
    });

    lastIndex = match.index + match[0].length;
  }

  // 添加剩余内容
  if (lastIndex < content.length) {
    const remainingContent = content.slice(lastIndex).trim();
    if (remainingContent) {
      sections.push({ type: 'normal', content: remainingContent });
    }
  }

  return sections.length > 0 ? sections : [{ type: 'normal', content }];
}
