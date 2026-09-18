import type { TextFormatter } from '@domain/formatter/ports';
import type { JsonFormatOptions } from '@domain/formatter/types';
import type { Result } from '@domain/shared/result';
import { failure, success, toErrorMessage } from '@domain/shared/result';

import { parseLooseJson } from './json.parser';
import { serializeJson } from './json.serialize';

export class JsonFormatter implements TextFormatter<'json'> {
  readonly id = 'json' as const;
  readonly label = 'JSON';

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
