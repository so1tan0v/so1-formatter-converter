/**
 * Imports from domain
 */
import type { TextFormatter } from '@domain/formatter/ports';
import type { JsonFormatOptions } from '@domain/formatter/types';
import { indentString } from '@domain/shared/indent';
import { failure, success, toErrorMessage } from '@domain/shared/result';
import type { Result } from '@domain/shared/result';

/**
 * Imports from relative
 */
import { selectJsonPath } from './json.path';
import { parseLooseJson } from './json.parser';
import { prettyPrintJsonFragment } from './json.pretty-print';
import { applyJsonTextOptions, serializeJson } from './json.serialize';

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
      const selected = options.query.trim()
        ? selectJsonPath(value, options.query)
        : success(value);

      if (!selected.ok) {
        return selected;
      }

      return success(serializeJson(selected.value, options));
    } catch (error) {
      if (options.query.trim()) {
        return failure(toErrorMessage(error));
      }

      const indent = indentString(options.indent);

      let output = prettyPrintJsonFragment(
        source,
        indent,
        options.mode === 'compact',
      );

      if (options.mode === 'escaped') {
        output = JSON.stringify(output);
      }

      return success(applyJsonTextOptions(output, options));
    }
  }
}
