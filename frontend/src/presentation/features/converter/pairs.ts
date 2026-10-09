/**
 * Imports from domain
 */
import type { ConverterId } from '@domain/converter/types';

export interface ConverterPair {
  label: string;
  forward: ConverterId;
  reverse: ConverterId;
}

/**
 * Пары конвертеров: одно направление и обратное
 */
export const CONVERTER_PAIRS: ConverterPair[] = [
  {
    label: 'Markdown ↔ Jira',
    forward: 'markdown-jira',
    reverse: 'jira-markdown',
  },
  {
    label: 'Markdown ↔ HTML',
    forward: 'markdown-html',
    reverse: 'html-markdown',
  },
  {
    label: 'JSON ↔ YAML',
    forward: 'json-yaml',
    reverse: 'yaml-json',
  },
  {
    label: 'JSON ↔ SQL',
    forward: 'json-sql',
    reverse: 'sql-json',
  },
];

/**
 * Возвращает пару, в которую входит конвертер
 *
 * @param id Идентификатор конвертера
 */
export function pairForConverter(id: ConverterId): ConverterPair | undefined {
  return CONVERTER_PAIRS.find(
    (pair) => pair.forward === id || pair.reverse === id,
  );
}

/**
 * Возвращает конвертер противоположного направления
 *
 * @param id Идентификатор текущего конвертера
 */
export function oppositeConverter(id: ConverterId): ConverterId | undefined {
  const pair = pairForConverter(id);

  if (!pair) {
    return undefined;
  }

  return pair.forward === id ? pair.reverse : pair.forward;
}

export interface ConverterHandoff {
  converterId: ConverterId;
  source: string;
}

/**
 * Читает текст, переданный при смене направления
 *
 * @param state Состояние навигации
 * @param converterId Конвертер, который сейчас открыт
 */
export function readConverterHandoff(
  state: unknown,
  converterId: ConverterId,
): string | null {
  if (typeof state !== 'object' || state === null) {
    return null;
  }

  const record = state as Record<string, unknown>;

  if (record.converterId !== converterId || typeof record.source !== 'string') {
    return null;
  }

  return record.source;
}
