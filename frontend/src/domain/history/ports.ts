/**
 * Imports from relative
 */
import type { HistoryEntry, HistoryScope } from './types';

export interface HistoryStore {
  /**
   * Возвращает сохраненные записи для указанной области
   *
   * @param scope Область истории, например тип форматтера или конвертера
   */
  list(scope: HistoryScope): HistoryEntry[];

  /**
   * Возвращает самую свежую запись для указанной области
   *
   * @param scope Область истории, например тип форматтера или конвертера
   */
  latest(scope: HistoryScope): HistoryEntry | undefined;

  /**
   * Сохраняет успешный ввод и вывод в начало истории области
   *
   * @param scope Область истории, например тип форматтера или конвертера
   * @param input Исходный текст и полученный результат
   */
  remember(
    scope: HistoryScope,
    input: { source: string; output: string },
  ): HistoryEntry[];
}
