import { load } from 'cheerio';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import type { ConfluencePage } from './types';

const REMOVABLE_SELECTORS = [
  'header',
  'footer',
  'nav',
  '.global-nav',
  '.navigation',
  '.conf-quick-nav',
  '.page-metadata',
  '.breadcrumbs',
  '.children-navigation',
  '.aui-message',
  '.footer-comment',
  '.confluence-information-macro',
  '.label-list',
  '.page-metadata-override',
];

const turndown = new TurndownService({
  codeBlockStyle: 'fenced',
  headingStyle: 'atx',
  bulletListMarker: '-',
});

turndown.use(gfm);

turndown.addRule('preserveCodeLanguage', {
  filter: (node) => node.nodeName === 'CODE' && !!(node as Element).parentElement,
  replacement: (content, node) => {
    const element = node as HTMLElement;
    const parent = element.parentElement;
    const language =
      element.getAttribute('data-language') ||
      element.getAttribute('class')?.split(' ').find((cls) => cls.startsWith('language-'))?.replace('language-', '') ||
      parent?.getAttribute('data-language') ||
      parent?.getAttribute('class')?.split(' ').find((cls) => cls.startsWith('language-'))?.replace('language-', '');

    const fence = '```';
    const langSuffix = language ? `${language}` : '';
    const normalized = content.replace(/\n{3,}/g, '\n\n');

    if (parent && parent.nodeName === 'PRE') {
      return `\n${fence}${langSuffix}\n${normalized}\n${fence}\n`;
    }

    return `\`${content}\``;
  },
});

function normaliseWhitespace(markdown: string): string {
  return markdown
    .split('\n')
    .map((line) => line.replace(/[\t ]+$/g, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export interface CleanConfluencePage {
  pageId: string;
  title: string;
  url?: string;
  markdown: string;
  spaceKey?: string;
  updatedAt?: string;
  etag?: string;
  versionNumber?: number;
}

export function htmlToCleanMarkdown(title: string, html: string): string {
  const $ = load(html);

  REMOVABLE_SELECTORS.forEach((selector) => {
    $(selector).remove();
  });

  $('[data-navigation=true]').remove();

  $('code').each((_, element) => {
    const $element = $(element);
    const lang =
      $element.attr('data-language') ||
      $element.attr('class')?.split(' ').find((cls) => cls.startsWith('language-'))?.replace('language-', '') ||
      $element.parent('pre').attr('data-language');

    if (lang && !$element.hasClass(`language-${lang}`)) {
      $element.addClass(`language-${lang}`);
    }
  });

  $('table').each((_, table) => {
    const $table = $(table);
    if (!$table.find('thead').length) {
      const firstRow = $table.find('tr').first();
      if (firstRow.length) {
        const header = $('<thead></thead>');
        header.append(firstRow.clone());
        firstRow.remove();
        $table.prepend(header);
      }
    }
  });

  $('script, style').remove();

  const mainContent = $('body').length ? $('body').html() ?? '' : $.root().html() ?? '';
  let markdown: string;

  try {
    markdown = turndown.turndown(mainContent);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('Failed to convert Confluence HTML to markdown:', message);
    markdown = $('body').text() ?? $.root().text() ?? '';
  }

  const titleHeading = title ? `# ${title}\n\n` : '';
  return normaliseWhitespace(`${titleHeading}${markdown}`);
}

export function cleanConfluencePage(page: ConfluencePage): CleanConfluencePage | null {
  const html = page.body?.storage?.value;
  if (!html) {
    return null;
  }

  const markdown = htmlToCleanMarkdown(page.title, html);
  const spaceKey = page.space?.key?.trim() || undefined;
  const versionNumber = typeof page.version?.number === 'number' ? page.version.number : undefined;
  const updatedAt = page.version?.when?.trim() || undefined;
  const etag = versionNumber != null ? String(versionNumber) : updatedAt;

  return {
    pageId: page.id,
    title: page.title,
    url: page._links?.webui ? `${process.env.CONFLUENCE_BASE_URL ?? 'https://cwiki.apache.org/confluence'}${page._links.webui}` : undefined,
    markdown,
    spaceKey,
    updatedAt,
    etag,
    versionNumber,
  };
}
