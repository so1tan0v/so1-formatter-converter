/**
 * Imports from domain
 */
import type { ConverterFormat } from '@domain/converter/types';
import type { FormatterId } from '@domain/formatter/types';

export type EditorLanguage =
  'json' | 'json5' | 'yaml' | 'sql' | 'markdown' | 'html' | 'plaintext';

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
    case 'html':
      return 'html';
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
    case 'html':
      return 'html';
  }
}

/**
 * Возвращает язык подсветки редактора для формата конвертера
 *
 * @param format Формат исходного или результирующего текста
 * @param role Роль поля: ввод допускает ослабленный JSON
 */
export function languageForFormat(
  format: ConverterFormat,
  role: 'input' | 'output',
): EditorLanguage {
  switch (format) {
    case 'json':
      return role === 'input' ? 'json5' : 'json';
    case 'yaml':
      return 'yaml';
    case 'sql':
      return 'sql';
    case 'markdown':
      return 'markdown';
    case 'html':
      return 'html';
    case 'jira':
    case 'plaintext':
      return 'plaintext';
  }
}
