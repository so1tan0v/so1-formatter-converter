/**
 * Идентификаторы доступных и планируемых конвертеров
 */
export const CONVERTER_IDS = [
  'markdown-jira',
  'json-yaml',
  'json-sql',
] as const;

export type ConverterId = (typeof CONVERTER_IDS)[number];

export interface ConverterOptions {
  [key: string]: unknown;
}
