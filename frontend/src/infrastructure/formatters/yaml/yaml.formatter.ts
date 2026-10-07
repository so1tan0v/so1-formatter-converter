/**
 * Imports from domain
 */
import type { TextFormatter } from '@domain/formatter/ports';
import type { YamlFormatOptions } from '@domain/formatter/types';
import { indentString } from '@domain/shared/indent';
import { failure, success } from '@domain/shared/result';
import type { Result } from '@domain/shared/result';

/**
 * Imports from relative
 */
import { parseLooseYaml } from './yaml.parser';
import { prettyPrintYamlFragment } from './yaml.pretty-print';
import { serializeYaml } from './yaml.serialize';

export class YamlFormatter implements TextFormatter<'yaml'> {
  /**
   * Идентификатор YAML-форматтера
   */
  readonly id = 'yaml' as const;

  /**
   * Подпись YAML-форматтера в интерфейсе
   */
  readonly label = 'YAML';

  /**
   * Форматирует YAML-документ
   *
   * @param input Исходный текст
   * @param options Настройки форматирования YAML
   */
  format(input: string, options: YamlFormatOptions): Result<string> {
    const source = input.trim();

    if (!source) {
      return failure('Empty input');
    }

    try {
      const value = parseLooseYaml(source);

      return success(serializeYaml(value, options));
    } catch {
      let output = prettyPrintYamlFragment(
        source,
        indentString(options.indent),
        options.mode === 'compact',
      );

      if (options.mode === 'escaped') {
        output = JSON.stringify(output);
      }

      return success(output);
    }
  }
}
