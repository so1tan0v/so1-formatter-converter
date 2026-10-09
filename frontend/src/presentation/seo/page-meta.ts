export interface PageMeta {
  path: string;
  title: string;
  description: string;
}

export const SITE_NAME = 'so1tan0v@fmt';

const SITE_DESCRIPTION =
  'Format JSON, YAML, SQL and HTML. Diff text and files. Convert and preview Markdown, Jira markup, HTML, JSON and YAML in the browser.';

/**
 * Страницы, которые должны попадать в поиск отдельными результатами
 */
export const INDEXABLE_PAGES: PageMeta[] = [
  {
    path: '/formatter/json',
    title: 'JSON formatter',
    description:
      'Pretty-print, compact and escape JSON, including JavaScript object literals.',
  },
  {
    path: '/formatter/yaml',
    title: 'YAML formatter',
    description: 'Format and compact YAML in the browser.',
  },
  {
    path: '/formatter/sql',
    title: 'SQL formatter',
    description: 'Format SQL with consistent keywords and indentation.',
  },
  {
    path: '/formatter/html',
    title: 'HTML formatter',
    description:
      'Format HTML with attribute wrapping, indentation and template-aware layout.',
  },
  {
    path: '/converter/markdown-jira',
    title: 'Markdown to Jira',
    description: 'Convert Markdown to Jira wiki markup.',
  },
  {
    path: '/converter/jira-markdown',
    title: 'Jira to Markdown',
    description: 'Convert Jira wiki markup to Markdown.',
  },
  {
    path: '/converter/markdown-html',
    title: 'Markdown to HTML',
    description: 'Convert Markdown to HTML.',
  },
  {
    path: '/converter/html-markdown',
    title: 'HTML to Markdown',
    description: 'Convert HTML to Markdown.',
  },
  {
    path: '/converter/json-yaml',
    title: 'JSON to YAML',
    description: 'Convert JSON to YAML.',
  },
  {
    path: '/converter/yaml-json',
    title: 'YAML to JSON',
    description: 'Convert YAML to JSON.',
  },
  {
    path: '/converter/json-sql',
    title: 'JSON to SQL',
    description: 'Convert JSON rows to SQL INSERT statements.',
  },
  {
    path: '/converter/sql-json',
    title: 'SQL to JSON',
    description: 'Convert SQL INSERT statements to JSON.',
  },
  {
    path: '/viewer/markdown',
    title: 'Markdown viewer',
    description: 'Preview Markdown with highlighted code blocks.',
  },
  {
    path: '/viewer/jira',
    title: 'Jira viewer',
    description: 'Preview Jira wiki markup as HTML.',
  },
  {
    path: '/differ',
    title: 'Text diff',
    description:
      'Compare two texts or files side by side, with synchronized scrolling.',
  },
];

const FALLBACK_PAGE: PageMeta = {
  path: '/formatter/json',
  title: 'JSON, YAML, SQL and HTML formatter',
  description: SITE_DESCRIPTION,
};

/**
 * Возвращает заголовок и описание страницы для поиска и вкладки браузера
 *
 * @param pathname Путь без query и hash
 */
export function pageMetaForPath(pathname: string): PageMeta {
  return (
    INDEXABLE_PAGES.find((page) => page.path === pathname) ?? FALLBACK_PAGE
  );
}

/**
 * Собирает заголовок документа из названия инструмента и имени сайта
 *
 * @param page Метаданные страницы
 */
export function documentTitle(page: PageMeta): string {
  return `${page.title} — ${SITE_NAME}`;
}
