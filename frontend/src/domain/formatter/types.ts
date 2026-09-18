import type { IndentStyle } from '@domain/shared/indent';

export const FORMATTER_IDS = ['json', 'yaml', 'sql'] as const;

export type FormatterId = (typeof FORMATTER_IDS)[number];

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

export const SQL_KEYWORD_CASES = ['upper', 'lower', 'preserve'] as const;

export type SqlKeywordCase = (typeof SQL_KEYWORD_CASES)[number];

export interface SqlFormatOptions {
  indent: IndentStyle;
  keywordCase: SqlKeywordCase;
}

export type FormatterOptionsMap = {
  json: JsonFormatOptions;
  yaml: YamlFormatOptions;
  sql: SqlFormatOptions;
};

export type FormatterOptions = FormatterOptionsMap[FormatterId];

export const DEFAULT_JSON_OPTIONS: JsonFormatOptions = {
  indent: '2-space',
  mode: 'pretty',
  sortKeys: false,
  dropNulls: false,
  escapeUnicode: false,
  trailingNewline: false,
};

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

export const DEFAULT_SQL_OPTIONS: SqlFormatOptions = {
  indent: '4-space',
  keywordCase: 'upper',
};

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
  }
}
