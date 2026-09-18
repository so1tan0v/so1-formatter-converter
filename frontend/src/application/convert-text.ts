/**
 * Imports from domain
 */
import type { TextConverter } from '@domain/converter/ports';
import type { ConverterId, ConverterOptions } from '@domain/converter/types';
import { failure } from '@domain/shared/result';
import type { Result } from '@domain/shared/result';

export interface ConverterRegistry {
  /**
   * Возвращает список зарегистрированных конвертеров
   */
  list(): TextConverter[];

  /**
   * Возвращает конвертер по идентификатору
   *
   * @param id Идентификатор конвертера
   */
  get(id: ConverterId): TextConverter | undefined;
}

/**
 * Преобразует текст выбранным конвертером из реестра
 *
 * @param registry Реестр доступных конвертеров
 * @param id Идентификатор конвертера
 * @param input Исходный текст
 * @param options Настройки преобразования
 */
export function convertText(
  registry: ConverterRegistry,
  id: ConverterId,
  input: string,
  options: ConverterOptions,
): Result<string> {
  const converter = registry.get(id);

  if (!converter) {
    return failure(`Converter "${id}" is not registered`);
  }

  if (!converter.available) {
    return failure(`Converter "${converter.label}" is not available yet`);
  }

  return converter.convert(input, options);
}
