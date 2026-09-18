/**
 * Imports from domain
 */
import type { TextFormatter } from '@domain/formatter/ports';
import type { YamlFormatOptions } from '@domain/formatter/types';
import { failure, success, toErrorMessage } from '@domain/shared/result';
import type { Result } from '@domain/shared/result';

/**
 * Imports from relative
 */
import { parseLooseYaml } from './yaml.parser';
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
      const output = serializeYaml(value, options);

      return success(output);
    } catch (error) {
      return failure(toErrorMessage(error));
    }
  }
}
