/**
 * Imports from relative
 */
import { CONVERTER_PAIRS, type ConverterPair } from './pairs';

export interface ConverterGroup {
  id: 'data' | 'query' | 'markup';
  pairs: ConverterPair[];
}

const GROUP_ORDER = {
  data: ['json-yaml', 'json-excel'],
  query: ['json-sql'],
  markup: ['markdown-html', 'markdown-jira'],
} as const;

/**
 * Группы конвертеров в шапке: данные, запрос и разметка
 */
export const CONVERTER_GROUPS: ConverterGroup[] = (
  Object.entries(GROUP_ORDER) as [ConverterGroup['id'], readonly string[]][]
).map(([id, forwards]) => ({
  id,
  pairs: forwards.map((forward) => {
    const pair = CONVERTER_PAIRS.find((item) => item.forward === forward);

    if (!pair) {
      throw new Error(`Missing converter pair ${forward}`);
    }

    return pair;
  }),
}));
