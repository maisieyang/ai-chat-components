const baseTheme = {
  'code[class*="language-"]': {
    color: 'var(--code-fg)',
    background: 'transparent',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.9rem',
    lineHeight: '1.55',
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
    color: 'var(--code-fg)',
    background: 'var(--code-bg)',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.9rem',
    lineHeight: '1.55',
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
    padding: '1rem',
    margin: '0',
    border: '1px solid var(--code-border)',
    borderRadius: '0.75rem',
    boxShadow: 'var(--code-shadow)',
    overflow: 'auto',
  },
  ':not(pre) > code[class*="language-"]': {
    padding: '0.2em 0.45em',
    borderRadius: '0.45rem',
    backgroundColor: 'var(--inline-bg)',
    color: 'var(--inline-fg)',
    border: '1px solid var(--code-border)',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.95em',
  },
  '.token.comment': {
    color: 'var(--token-comment)',
    fontStyle: 'italic',
  },
  '.token.prolog': {
    color: 'var(--token-comment)',
  },
  '.token.doctype': {
    color: 'var(--token-comment)',
  },
  '.token.cdata': {
    color: 'var(--token-comment)',
  },
  '.token.punctuation': {
    color: 'var(--token-operator)',
  },
  '.token.operator': {
    color: 'var(--token-operator)',
  },
  '.token.keyword': {
    color: 'var(--token-keyword)',
  },
  '.token.boolean': {
    color: 'var(--token-number)',
  },
  '.token.number': {
    color: 'var(--token-number)',
  },
  '.token.constant': {
    color: 'var(--token-number)',
  },
  '.token.symbol': {
    color: 'var(--token-number)',
  },
  '.token.string': {
    color: 'var(--token-string)',
  },
  '.token.char': {
    color: 'var(--token-string)',
  },
  '.token.attr-name': {
    color: 'var(--token-function)',
  },
  '.token.inserted': {
    color: 'var(--token-function)',
  },
  '.token.property': {
    color: 'var(--token-function)',
  },
  '.token.function': {
    color: 'var(--token-function)',
  },
  '.token.class-name': {
    color: 'var(--token-function)',
    fontWeight: '600',
  },
  '.token.variable': {
    color: 'var(--token-default)',
  },
  '.token.tag': {
    color: 'var(--token-keyword)',
  },
  '.token.atrule': {
    color: 'var(--token-keyword)',
  },
  '.token.attr-value': {
    color: 'var(--token-string)',
  },
  '.token.regex': {
    color: 'var(--token-string)',
  },
  '.token.important': {
    color: 'var(--token-keyword)',
    fontWeight: '700',
  },
  '.token.deleted': {
    color: 'var(--token-keyword)',
  },
  '.token.bold': {
    fontWeight: 'bold',
  },
  '.token.italic': {
    fontStyle: 'italic',
  },
};

export const chatgptTheme = baseTheme;
export const chatgptDarkTheme = baseTheme;
