import type { TextFormatter } from '@domain/formatter/ports';
import type { YamlFormatOptions } from '@domain/formatter/types';
import type { Result } from '@domain/shared/result';
import { failure, success, toErrorMessage } from '@domain/shared/result';

import { parseLooseYaml } from './yaml.parser';
import { serializeYaml } from './yaml.serialize';

export class YamlFormatter implements TextFormatter<'yaml'> {
  readonly id = 'yaml' as const;
  readonly label = 'YAML';

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
