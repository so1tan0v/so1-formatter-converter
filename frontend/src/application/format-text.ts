/**
 * Imports from domain
 */
import type { TextFormatter } from '@domain/formatter/ports';
import type { FormatterId, FormatterOptionsMap } from '@domain/formatter/types';
import { failure } from '@domain/shared/result';
import type { Result } from '@domain/shared/result';

export interface FormatterRegistry {
  /**
   * Возвращает список зарегистрированных форматтеров
   */
  list(): TextFormatter[];

  /**
   * Возвращает форматтер по идентификатору
   *
   * @param id Идентификатор форматтера
   */
  get(id: FormatterId): TextFormatter | undefined;
}

/**
 * Форматирует текст выбранным форматтером из реестра
 *
 * @param registry Реестр доступных форматтеров
 * @param id Идентификатор форматтера
 * @param input Исходный текст
 * @param options Настройки форматирования для выбранного типа
 */
export function formatText<TId extends FormatterId>(
  registry: FormatterRegistry,
  id: TId,
  input: string,
  options: FormatterOptionsMap[TId],
): Result<string> {
  const formatter = registry.get(id);

  if (!formatter) {
    return failure(`Formatter "${id}" is not registered`);
  }

  return formatter.format(
    input,
    options as FormatterOptionsMap[typeof formatter.id],
  );
}
