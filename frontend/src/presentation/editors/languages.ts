/**
 * Imports from domain
 */
import type { FormatterId } from '@domain/formatter/types';

export type EditorLanguage =
  'json' | 'json5' | 'yaml' | 'sql' | 'markdown' | 'plaintext';

/**
 * Возвращает язык подсветки для поля ввода форматтера
 *
 * @param id Идентификатор форматтера
 */
export function inputLanguageFor(id: FormatterId): EditorLanguage {
  switch (id) {
    case 'json':
      return 'json5';
    case 'yaml':
      return 'yaml';
    case 'sql':
      return 'sql';
  }
}

/**
 * Возвращает язык подсветки для поля вывода форматтера
 *
 * @param id Идентификатор форматтера
 * @param hasError Признак ошибки форматирования
 */
export function outputLanguageFor(
  id: FormatterId,
  hasError: boolean,
): EditorLanguage {
  if (hasError) {
    return 'plaintext';
  }

  switch (id) {
    case 'json':
      return 'json';
    case 'yaml':
      return 'yaml';
    case 'sql':
      return 'sql';
  }
}
