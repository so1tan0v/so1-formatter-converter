/**
 * Идентификаторы доступных конвертеров
 */
export const CONVERTER_IDS = [
  'markdown-jira',
  'jira-markdown',
  'markdown-html',
  'html-markdown',
  'json-yaml',
  'yaml-json',
  'json-sql',
  'sql-json',
] as const;

export type ConverterId = (typeof CONVERTER_IDS)[number];

/**
 * Форматы текста, которые конвертеры принимают и возвращают
 */
export const CONVERTER_FORMATS = [
  'json',
  'yaml',
  'sql',
  'markdown',
  'jira',
  'html',
  'plaintext',
] as const;

export type ConverterFormat = (typeof CONVERTER_FORMATS)[number];

export interface ConverterOptions {
  [key: string]: unknown;
}
