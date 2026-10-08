/**
 * Imports from domain
 */
import type { IndentStyle } from '@domain/shared/indent';

/**
 * Идентификаторы доступных форматтеров
 */
export const FORMATTER_IDS = ['json', 'yaml', 'sql', 'html'] as const;

export type FormatterId = (typeof FORMATTER_IDS)[number];

/**
 * Режимы вывода JSON и YAML: многострочный, однострочный и экранированная строка
 */
export const OUTPUT_MODES = ['pretty', 'compact', 'escaped'] as const;

export type OutputMode = (typeof OUTPUT_MODES)[number];

export interface JsonFormatOptions {
  indent: IndentStyle;
  mode: OutputMode;
  sortKeys: boolean;
  dropNulls: boolean;
  escapeUnicode: boolean;
  trailingNewline: boolean;
}

export type YamlNullStyle = 'null' | 'tilde' | 'empty';
export type YamlQuoting = 'auto' | 'single' | 'double';

export interface YamlFormatOptions {
  indent: IndentStyle;
  mode: OutputMode;
  sortKeys: boolean;
  quoting: YamlQuoting;
  forceQuotes: boolean;
  documentStart: boolean;
  documentEnd: boolean;
  lineWidth: number;
  nullStyle: YamlNullStyle;
}

/**
 * Варианты регистра SQL-ключевых слов: верхний, нижний или как в исходнике
 */
export const SQL_KEYWORD_CASES = ['upper', 'lower', 'preserve'] as const;

export type SqlKeywordCase = (typeof SQL_KEYWORD_CASES)[number];

export interface SqlFormatOptions {
  indent: IndentStyle;
  keywordCase: SqlKeywordCase;
}

/**
 * Как переносить атрибуты HTML-тега
 */
export const HTML_WRAP_ATTRIBUTES = [
  'auto',
  'force',
  'force-aligned',
  'force-expand-multiline',
  'aligned-multiple',
  'preserve',
  'preserve-aligned',
] as const;

export type HtmlWrapAttributes = (typeof HTML_WRAP_ATTRIBUTES)[number];

/**
 * Как отступать содержимое script
 */
export const HTML_SCRIPT_INDENTS = ['normal', 'keep', 'separate'] as const;

export type HtmlScriptIndent = (typeof HTML_SCRIPT_INDENTS)[number];

/**
 * Как обрабатывать шаблонные вставки в HTML
 */
export const HTML_TEMPLATING = ['auto', 'none'] as const;

export type HtmlTemplating = (typeof HTML_TEMPLATING)[number];

export interface HtmlFormatOptions {
  indent: IndentStyle;
  wrapAttributes: HtmlWrapAttributes;
  wrapAttributesMin: number;
  wrapLineLength: number;
  indentInnerHtml: boolean;
  indentHead: boolean;
  indentBody: boolean;
  preserveNewlines: boolean;
  maxPreserveNewlines: number;
  endWithNewline: boolean;
  indentScripts: HtmlScriptIndent;
  extraLiners: boolean;
  indentHandlebars: boolean;
  inlineCustomElements: boolean;
  templating: HtmlTemplating;
  formatPre: boolean;
}

export type FormatterOptionsMap = {
  json: JsonFormatOptions;
  yaml: YamlFormatOptions;
  sql: SqlFormatOptions;
  html: HtmlFormatOptions;
};

export type FormatterOptions = FormatterOptionsMap[FormatterId];

/**
 * Настройки JSON-форматтера по умолчанию
 */
export const DEFAULT_JSON_OPTIONS: JsonFormatOptions = {
  indent: '2-space',
  mode: 'pretty',
  sortKeys: false,
  dropNulls: false,
  escapeUnicode: false,
  trailingNewline: false,
};

/**
 * Настройки YAML-форматтера по умолчанию
 */
export const DEFAULT_YAML_OPTIONS: YamlFormatOptions = {
  indent: '2-space',
  mode: 'pretty',
  sortKeys: false,
  quoting: 'auto',
  forceQuotes: false,
  documentStart: false,
  documentEnd: false,
  lineWidth: 80,
  nullStyle: 'null',
};

/**
 * Настройки SQL-форматтера по умолчанию
 */
export const DEFAULT_SQL_OPTIONS: SqlFormatOptions = {
  indent: '4-space',
  keywordCase: 'upper',
};

/**
 * Настройки HTML-форматтера по умолчанию
 */
export const DEFAULT_HTML_OPTIONS: HtmlFormatOptions = {
  indent: '2-space',
  wrapAttributes: 'auto',
  wrapAttributesMin: 2,
  wrapLineLength: 0,
  indentInnerHtml: false,
  indentHead: true,
  indentBody: true,
  preserveNewlines: true,
  maxPreserveNewlines: 2,
  endWithNewline: false,
  indentScripts: 'normal',
  extraLiners: true,
  indentHandlebars: true,
  inlineCustomElements: true,
  templating: 'auto',
  formatPre: false,
};

/**
 * Возвращает настройки форматирования по умолчанию для выбранного типа
 *
 * @param id Идентификатор форматтера
 */
export function defaultOptionsFor(
  id: FormatterId,
): FormatterOptionsMap[FormatterId] {
  switch (id) {
    case 'json':
      return { ...DEFAULT_JSON_OPTIONS };
    case 'yaml':
      return { ...DEFAULT_YAML_OPTIONS };
    case 'sql':
      return { ...DEFAULT_SQL_OPTIONS };
    case 'html':
      return { ...DEFAULT_HTML_OPTIONS };
  }
}
