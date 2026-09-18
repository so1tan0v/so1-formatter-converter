/**
 * Imports from domain
 */
import type { Result } from '@domain/shared/result';

/**
 * Imports from relative
 */
import type { FormatterId, FormatterOptionsMap } from './types';

export interface TextFormatter<TId extends FormatterId = FormatterId> {
  /**
   * Идентификатор форматтера
   */
  readonly id: TId;

  /**
   * Подпись форматтера в интерфейсе
   */
  readonly label: string;

  /**
   * Форматирует исходный текст по заданным настройкам
   *
   * @param input Исходный текст
   * @param options Настройки форматирования для этого типа
   */
  format(input: string, options: FormatterOptionsMap[TId]): Result<string>;
}
