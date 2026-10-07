/**
 * Imports from domain
 */
import type { TextConverter } from '@domain/converter/ports';
import type { ConverterFormat, ConverterId } from '@domain/converter/types';

/**
 * Imports from relative
 */
import { convertSource } from './convert-source';

/**
 * Собирает конвертер из описания форматов и функции преобразования
 *
 * @param id Идентификатор конвертера
 * @param label Подпись в интерфейсе
 * @param sourceFormat Формат исходного текста
 * @param targetFormat Формат результата
 * @param sourceLabel Подпись поля ввода
 * @param targetLabel Подпись поля вывода
 * @param transform Функция преобразования
 */
export function defineConverter(
  id: ConverterId,
  label: string,
  sourceFormat: ConverterFormat,
  targetFormat: ConverterFormat,
  sourceLabel: string,
  targetLabel: string,
  transform: (input: string) => string,
): TextConverter {
  return {
    id,
    label,
    available: true,
    sourceFormat,
    targetFormat,
    sourceLabel,
    targetLabel,
    convert: (input) => convertSource(input, transform),
  };
}
