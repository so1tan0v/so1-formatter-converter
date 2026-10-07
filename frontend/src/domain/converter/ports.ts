/**
 * Imports from domain
 */
import type { Result } from '@domain/shared/result';

/**
 * Imports from relative
 */
import type { ConverterFormat, ConverterId, ConverterOptions } from './types';

export interface TextConverter {
  /**
   * Идентификатор конвертера
   */
  readonly id: ConverterId;

  /**
   * Подпись конвертера в интерфейсе
   */
  readonly label: string;

  /**
   * Признак, что конвертер уже доступен пользователю
   */
  readonly available: boolean;

  /**
   * Формат исходного текста
   */
  readonly sourceFormat: ConverterFormat;

  /**
   * Формат результата
   */
  readonly targetFormat: ConverterFormat;

  /**
   * Подпись поля ввода
   */
  readonly sourceLabel: string;

  /**
   * Подпись поля вывода
   */
  readonly targetLabel: string;

  /**
   * Преобразует исходный текст в целевой формат
   *
   * @param input Исходный текст
   * @param options Настройки преобразования
   */
  convert(input: string, options: ConverterOptions): Result<string>;
}
