export const DIFFER_LANGUAGES = [
  'plaintext',
  'json',
  'json5',
  'yaml',
  'sql',
  'html',
  'markdown',
  'javascript',
  'typescript',
  'css',
  'xml',
] as const;

export type DifferLanguage = (typeof DIFFER_LANGUAGES)[number];

export const DIFFER_LANGUAGE_LABELS: Record<DifferLanguage, string> = {
  plaintext: 'Text',
  json: 'JSON',
  json5: 'JSON5',
  yaml: 'YAML',
  sql: 'SQL',
  html: 'HTML',
  markdown: 'Markdown',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  css: 'CSS',
  xml: 'XML',
};

const EXTENSIONS: Record<string, DifferLanguage> = {
  txt: 'plaintext',
  log: 'plaintext',
  json: 'json',
  json5: 'json5',
  yaml: 'yaml',
  yml: 'yaml',
  sql: 'sql',
  html: 'html',
  htm: 'html',
  md: 'markdown',
  markdown: 'markdown',
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  css: 'css',
  xml: 'xml',
  svg: 'xml',
};

/**
 * Проверяет, что строка является языком подсветки Differ
 *
 * @param value Произвольное значение из хранилища или select
 */
export function isDifferLanguage(value: unknown): value is DifferLanguage {
  return DIFFER_LANGUAGES.some((language) => language === value);
}

/**
 * Подбирает язык подсветки по имени файла
 *
 * @param name Имя файла или путь
 */
export function languageFromFileName(name: string): DifferLanguage | null {
  const base = name.split(/[/\\]/).pop() ?? name;
  const dot = base.lastIndexOf('.');

  if (dot <= 0 || dot === base.length - 1) {
    return null;
  }

  return EXTENSIONS[base.slice(dot + 1).toLowerCase()] ?? null;
}
