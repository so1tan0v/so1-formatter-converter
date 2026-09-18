/**
 * Imports from domain
 */
import type { TextFormatter } from '@domain/formatter/ports';
import type { JsonFormatOptions } from '@domain/formatter/types';
import { failure, success, toErrorMessage } from '@domain/shared/result';
import type { Result } from '@domain/shared/result';

/**
 * Imports from relative
 */
import { parseLooseJson } from './json.parser';
import { serializeJson } from './json.serialize';

export class JsonFormatter implements TextFormatter<'json'> {
  /**
   * Идентификатор JSON-форматтера
   */
  readonly id = 'json' as const;

  /**
   * Подпись JSON-форматтера в интерфейсе
   */
  readonly label = 'JSON';

  /**
   * Форматирует JSON, в том числе упрощенный объектный синтаксис
   *
   * @param input Исходный текст
   * @param options Настройки форматирования JSON
   */
  format(input: string, options: JsonFormatOptions): Result<string> {
    const source = input.trim();

    if (!source) {
      return failure('Empty input');
    }

    try {
      const value = parseLooseJson(source);
      const output = serializeJson(value, options);

      return success(output);
    } catch (error) {
      return failure(toErrorMessage(error));
    }
  }
}
