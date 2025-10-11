// ChatGPT风格的语法高亮主题
export const chatgptTheme = {
  'code[class*="language-"]': {
    color: '#24292e',
    background: 'none',
    fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
    fontSize: '0.875rem',
    lineHeight: '1.5',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    wordWrap: 'normal',
    MozTabSize: '4',
    OTabSize: '4',
    tabSize: '4',
    WebkitHyphens: 'none',
    MozHyphens: 'none',
    msHyphens: 'none',
    hyphens: 'none',
  },
  'pre[class*="language-"]': {
    color: '#24292e',
    background: 'transparent',
    fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
    fontSize: '0.875rem',
    lineHeight: '1.5',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    wordWrap: 'normal',
    MozTabSize: '4',
    OTabSize: '4',
    tabSize: '4',
    WebkitHyphens: 'none',
    MozHyphens: 'none',
    msHyphens: 'none',
    hyphens: 'none',
    padding: '0',
    margin: '0',
    overflow: 'auto',
  },
  ':not(pre) > code[class*="language-"]': {
    padding: '0.2em 0.4em',
    borderRadius: '0.25rem',
    fontSize: '0.875rem',
    backgroundColor: '#f6f8fa',
    color: '#24292e',
  },
  '.token.comment': {
    color: '#6a737d',
    fontStyle: 'italic',
  },
  '.token.prolog': {
    color: '#6a737d',
  },
  '.token.doctype': {
    color: '#6a737d',
  },
  '.token.cdata': {
    color: '#6a737d',
  },
  '.token.punctuation': {
    color: '#24292e',
  },
  '.token.property': {
    color: '#005cc5',
  },
  '.token.tag': {
    color: '#22863a',
  },
  '.token.boolean': {
    color: '#005cc5',
  },
  '.token.number': {
    color: '#005cc5',
  },
  '.token.constant': {
    color: '#005cc5',
  },
  '.token.symbol': {
    color: '#005cc5',
  },
  '.token.deleted': {
    color: '#d73a49',
  },
  '.token.selector': {
    color: '#6f42c1',
  },
  '.token.attr-name': {
    color: '#6f42c1',
  },
  '.token.string': {
    color: '#032f62',
  },
  '.token.char': {
    color: '#032f62',
  },
  '.token.builtin': {
    color: '#005cc5',
  },
  '.token.inserted': {
    color: '#22863a',
  },
  '.token.operator': {
    color: '#d73a49',
  },
  '.token.entity': {
    color: '#6f42c1',
  },
  '.token.url': {
    color: '#032f62',
  },
  '.token.variable': {
    color: '#e36209',
  },
  '.token.atrule': {
    color: '#6f42c1',
  },
  '.token.attr-value': {
    color: '#032f62',
  },
  '.token.function': {
    color: '#6f42c1',
  },
  '.token.class-name': {
    color: '#6f42c1',
  },
  '.token.keyword': {
    color: '#d73a49',
  },
  '.token.regex': {
    color: '#032f62',
  },
  '.token.important': {
    color: '#d73a49',
    fontWeight: 'bold',
  },
  '.token.bold': {
    fontWeight: 'bold',
  },
  '.token.italic': {
    fontStyle: 'italic',
  },
};

// 暗色主题
export const chatgptDarkTheme = {
  'code[class*="language-"]': {
    color: '#e6edf3',
    background: 'none',
    fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
    fontSize: '0.875rem',
    lineHeight: '1.5',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    wordWrap: 'normal',
    MozTabSize: '4',
    OTabSize: '4',
    tabSize: '4',
    WebkitHyphens: 'none',
    MozHyphens: 'none',
    msHyphens: 'none',
    hyphens: 'none',
  },
  'pre[class*="language-"]': {
    color: '#e6edf3',
    background: 'transparent',
    fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
    fontSize: '0.875rem',
    lineHeight: '1.5',
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    wordWrap: 'normal',
    MozTabSize: '4',
    OTabSize: '4',
    tabSize: '4',
    WebkitHyphens: 'none',
    MozHyphens: 'none',
    msHyphens: 'none',
    hyphens: 'none',
    padding: '0',
    margin: '0',
    overflow: 'auto',
  },
  ':not(pre) > code[class*="language-"]': {
    padding: '0.2em 0.4em',
    borderRadius: '0.25rem',
    fontSize: '0.875rem',
    backgroundColor: '#21262d',
    color: '#e6edf3',
  },
  '.token.comment': {
    color: '#8b949e',
    fontStyle: 'italic',
  },
  '.token.prolog': {
    color: '#8b949e',
  },
  '.token.doctype': {
    color: '#8b949e',
  },
  '.token.cdata': {
    color: '#8b949e',
  },
  '.token.punctuation': {
    color: '#e6edf3',
  },
  '.token.property': {
    color: '#79c0ff',
  },
  '.token.tag': {
    color: '#7ee787',
  },
  '.token.boolean': {
    color: '#79c0ff',
  },
  '.token.number': {
    color: '#79c0ff',
  },
  '.token.constant': {
    color: '#79c0ff',
  },
  '.token.symbol': {
    color: '#79c0ff',
  },
  '.token.deleted': {
    color: '#ffa198',
  },
  '.token.selector': {
    color: '#d2a8ff',
  },
  '.token.attr-name': {
    color: '#d2a8ff',
  },
  '.token.string': {
    color: '#a5d6ff',
  },
  '.token.char': {
    color: '#a5d6ff',
  },
  '.token.builtin': {
    color: '#79c0ff',
  },
  '.token.inserted': {
    color: '#7ee787',
  },
  '.token.operator': {
    color: '#ff7b72',
  },
  '.token.entity': {
    color: '#d2a8ff',
  },
  '.token.url': {
    color: '#a5d6ff',
  },
  '.token.variable': {
    color: '#ffa657',
  },
  '.token.atrule': {
    color: '#d2a8ff',
  },
  '.token.attr-value': {
    color: '#a5d6ff',
  },
  '.token.function': {
    color: '#d2a8ff',
  },
  '.token.class-name': {
    color: '#d2a8ff',
  },
  '.token.keyword': {
    color: '#ff7b72',
  },
  '.token.regex': {
    color: '#a5d6ff',
  },
  '.token.important': {
    color: '#ff7b72',
    fontWeight: 'bold',
  },
  '.token.bold': {
    fontWeight: 'bold',
  },
  '.token.italic': {
    fontStyle: 'italic',
  },
};
