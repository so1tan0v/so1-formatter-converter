/**
 * Imports from domain
 */
import type { TextFormatter } from '@domain/formatter/ports';
import type { SqlFormatOptions } from '@domain/formatter/types';
import { failure, success } from '@domain/shared/result';
import type { Result } from '@domain/shared/result';

/**
 * Imports from relative
 */
import { parseSqlRecovering } from './sql.parser';
import { prettyPrintSqlFragment } from './sql.pretty-print';
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

    const { statements, rest } = parseSqlRecovering(source);
    const chunks: string[] = [];

    if (statements.length > 0) {
      chunks.push(printSql(statements, options));
    }

    if (rest.trim()) {
      chunks.push(prettyPrintSqlFragment(rest, options));
    }

    if (chunks.length === 0) {
      return success(prettyPrintSqlFragment(source, options));
    }

    return success(chunks.join('\n'));
  }
}
