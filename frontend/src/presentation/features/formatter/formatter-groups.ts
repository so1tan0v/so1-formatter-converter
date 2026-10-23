/**
 * Imports from domain
 */
import type { FormatterId } from '@domain/formatter/types';

export interface FormatterGroup {
  id: 'data' | 'query' | 'markup';
  label: string;
  ids: FormatterId[];
}

/**
 * Группы типов форматтера в шапке: данные, запрос и разметка
 */
export const FORMATTER_GROUPS: FormatterGroup[] = [
  { id: 'data', label: 'Data', ids: ['json', 'yaml'] },
  { id: 'query', label: 'Query', ids: ['sql'] },
  { id: 'markup', label: 'Markup', ids: ['html', 'xml'] },
];

/**
 * У типа есть редкие настройки, которые прячутся за Options
 *
 * @param id Идентификатор форматтера
 */
export function formatterHasAdvancedOptions(id: FormatterId): boolean {
  return id === 'json' || id === 'yaml' || id === 'html' || id === 'xml';
}
