/**
 * Imports from infrastructure
 */
import { parseLooseJson } from '@infrastructure/formatters/json/json.parser';

/**
 * Преобразует JSON-объект или массив объектов в SQL INSERT
 *
 * @param input Исходный JSON-текст
 */
export function jsonToSql(input: string): string {
  const value = parseLooseJson(input);
  const rows = normalizeRows(value);
  const columns = collectColumns(rows);
  const table = 'data';
  const columnList = columns.map(quoteIdentifier).join(', ');
  const values = rows
    .map(
      (row) =>
        `(${columns.map((column) => toSqlValue(row[column])).join(', ')})`,
    )
    .join(',\n  ');

  return `INSERT INTO ${quoteIdentifier(table)} (${columnList})\nVALUES\n  ${values};`;
}

function normalizeRows(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    if (!value.length) {
      throw new Error('JSON array is empty');
    }

    if (!value.every(isPlainObject)) {
      throw new Error('JSON → SQL expects an object or an array of objects');
    }

    return value;
  }

  if (isPlainObject(value)) {
    return [value];
  }

  throw new Error('JSON → SQL expects an object or an array of objects');
}

function collectColumns(rows: Record<string, unknown>[]): string[] {
  const columns: string[] = [];

  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!columns.includes(key)) {
        columns.push(key);
      }
    }
  }

  if (!columns.length) {
    throw new Error('JSON objects have no fields');
  }

  return columns;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function quoteIdentifier(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function toSqlValue(value: unknown): string {
  if (typeof value === 'undefined' || value === null) {
    return 'NULL';
  }

  if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE';
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error('SQL cannot contain Infinity or NaN');
    }

    return String(value);
  }

  if (typeof value === 'string') {
    return `'${value.replace(/'/g, "''")}'`;
  }

  return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
}
