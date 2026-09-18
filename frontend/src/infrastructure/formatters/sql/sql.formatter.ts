/**
 * Imports from domain
 */
import type { TextFormatter } from '@domain/formatter/ports';
import type { SqlFormatOptions } from '@domain/formatter/types';
import { failure, success, toErrorMessage } from '@domain/shared/result';
import type { Result } from '@domain/shared/result';

/**
 * Imports from relative
 */
import { parseSql } from './sql.parser';
import { printSql } from './sql.printer';

export class SqlFormatter implements TextFormatter<'sql'> {
  /**
   * Идентификатор SQL-форматтера
   */
  readonly id = 'sql' as const;

  /**
   * Подпись SQL-форматтера в интерфейсе
   */
  readonly label = 'SQL';

  /**
   * Форматирует SQL-скрипт
   *
   * @param input Исходный текст
   * @param options Настройки форматирования SQL
   */
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
