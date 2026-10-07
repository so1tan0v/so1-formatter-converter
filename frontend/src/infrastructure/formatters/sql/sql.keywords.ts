/**
 * Зарезервированные SQL-ключевые слова
 */
export const SQL_KEYWORDS = new Set([
  'SELECT',
  'DISTINCT',
  'FROM',
  'WHERE',
  'JOIN',
  'INNER',
  'LEFT',
  'RIGHT',
  'FULL',
  'OUTER',
  'CROSS',
  'ON',
  'USING',
  'AND',
  'OR',
  'NOT',
  'GROUP',
  'BY',
  'ORDER',
  'HAVING',
  'LIMIT',
  'OFFSET',
  'AS',
  'CASE',
  'WHEN',
  'THEN',
  'ELSE',
  'END',
  'IN',
  'OUT',
  'INOUT',
  'IS',
  'NULL',
  'LIKE',
  'ILIKE',
  'BETWEEN',
  'EXISTS',
  'UNION',
  'ALL',
  'ASC',
  'DESC',
  'WITH',
  'INSERT',
  'INTO',
  'VALUES',
  'UPDATE',
  'SET',
  'DELETE',
  'CAST',
  'CREATE',
  'OR',
  'REPLACE',
  'FUNCTION',
  'PROCEDURE',
  'RETURNS',
  'LANGUAGE',
  'BEGIN',
  'RETURN',
  'CALL',
  'DEFAULT',
  'DETERMINISTIC',
  'INTERVAL',
  'TRUE',
  'FALSE',
  'TOP',
  'PREWHERE',
  'SETTINGS',
  'FORMAT',
  'FINAL',
  'SAMPLE',
  'APPLY',
  'LATERAL',
  'GLOBAL',
  'ASOF',
  'ARRAY',
  'SEMI',
  'ANTI',
  'ANY',
  'STRAIGHT_JOIN',
  'FETCH',
  'NEXT',
  'ROWS',
  'ONLY',
  'RETURNING',
  'GLOB',
  'REPLACE',
  'IGNORE',
  'PARTITION',
  'OVER',
  'WINDOW',
  'FILTER',
  'NOLOCK',
]);

/**
 * Слова, с которых может начинаться новая SQL-клауза
 */
export const CLAUSE_STARTERS = new Set([
  'SELECT',
  'FROM',
  'WHERE',
  'JOIN',
  'INNER',
  'LEFT',
  'RIGHT',
  'FULL',
  'CROSS',
  'GROUP',
  'ORDER',
  'HAVING',
  'LIMIT',
  'OFFSET',
  'UNION',
  'ON',
  'USING',
  'VALUES',
  'SET',
  'INSERT',
  'UPDATE',
  'DELETE',
  'INTO',
  'BEGIN',
  'END',
  'CALL',
  'RETURN',
  'CREATE',
  'PREWHERE',
  'APPLY',
  'RETURNING',
  'SETTINGS',
  'FORMAT',
]);

/**
 * Имена встроенных SQL-функций, которые печатаются как вызовы
 */
export const SQL_FUNCTIONS = new Set([
  'IF',
  'IFNULL',
  'NULLIF',
  'COALESCE',
  'CAST',
  'COUNT',
  'SUM',
  'AVG',
  'MIN',
  'MAX',
  'ABS',
  'ROUND',
  'LENGTH',
  'LOWER',
  'UPPER',
  'TRIM',
  'CONCAT',
  'SUBSTRING',
  'NOW',
  'CURRENT_DATE',
  'CURRENT_TIMESTAMP',
]);

export type TokenType =
  | 'ident'
  | 'number'
  | 'string'
  | 'punct'
  | 'op'
  | 'keyword'
  | 'placeholder'
  | 'eof';

export interface Token {
  type: TokenType;
  value: string;
  raw: string;
  pos: number;
}

/**
 * Проверяет, является ли слово зарезервированным SQL-ключевым словом
 *
 * @param value Проверяемое слово
 */
export function isKeywordName(value: string): boolean {
  return SQL_KEYWORDS.has(value.toUpperCase());
}
