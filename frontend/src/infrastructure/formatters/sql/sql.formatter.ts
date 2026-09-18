import type { TextFormatter } from '@domain/formatter/ports';
import type { SqlFormatOptions } from '@domain/formatter/types';
import type { Result } from '@domain/shared/result';
import { failure, success, toErrorMessage } from '@domain/shared/result';

import { parseSql } from './sql.parser';
import { printSql } from './sql.printer';

export class SqlFormatter implements TextFormatter<'sql'> {
  readonly id = 'sql' as const;
  readonly label = 'SQL';

  format(input: string, options: SqlFormatOptions): Result<string> {
    const source = input.trim();

    if (!source) {
      return failure('Empty input');
    }

    try {
      const statements = parseSql(source);
      const output = printSql(statements, options);

      return success(output);
    } catch (error) {
      return failure(toErrorMessage(error));
    }
  }
}
