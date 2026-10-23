/**
 * Imports from domain
 */
import type { ConverterOptions } from '@domain/converter/types';

/**
 * Imports from relative
 */
import { readExcelTable } from './json-to-excel';

/**
 * Превращает таблицу, TSV или CSV в JSON
 *
 * @param input Текст листа, TSV, CSV или таблица превью JSON → Excel
 * @param options Параметры чтения: первая строка может быть заголовком
 */
export function excelToJson(
  input: string,
  options: ConverterOptions = {},
): string {
  const header = options.header !== false;
  const rows = rowsFrom(input);

  if (!rows.length) {
    throw new Error('Excel sheet is empty');
  }

  return `${JSON.stringify(toJson(rows, header), null, 2)}\n`;
}

function rowsFrom(input: string): unknown[][] {
  const trimmed = input.trim();

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    const table = readExcelTable(trimmed);

    if (!table) {
      throw new Error('Excel → JSON expects a worksheet, TSV, or CSV');
    }

    return table.rows.map((row) => row.map(coerceCell));
  }

  return parseDelimited(trimmed);
}

function toJson(rows: unknown[][], header: boolean): unknown {
  if (!header) {
    return rows;
  }

  const keys = (rows[0] ?? []).map((cell, index) =>
    cell === null || cell === '' ? `column${index + 1}` : String(cell),
  );

  return rows.slice(1).map((row) => {
    const record: Record<string, unknown> = {};

    keys.forEach((key, index) => {
      record[key] = index < row.length ? row[index] : null;
    });

    return record;
  });
}

function parseDelimited(input: string): unknown[][] {
  const text = input.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  if (!text.trim()) {
    return [];
  }

  const delimiter = detectDelimiter(text);
  const rows: unknown[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (quoted) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += char;
      }

      continue;
    }

    if (char === '"' && cell === '') {
      quoted = true;

      continue;
    }

    if (char === delimiter) {
      row.push(cell);
      cell = '';

      continue;
    }

    if (char === '\n') {
      row.push(cell);
      rows.push(row.map(coerceCell));
      row = [];
      cell = '';

      continue;
    }

    cell += char;
  }

  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row.map(coerceCell));
  }

  return rows;
}

function detectDelimiter(text: string): '\t' | ',' | ';' {
  const line = text.split('\n', 1)[0] ?? '';
  const counts = { '\t': 0, ',': 0, ';': 0 };
  let quoted = false;

  for (const char of line) {
    if (char === '"') {
      quoted = !quoted;

      continue;
    }

    if (!quoted && (char === '\t' || char === ',' || char === ';')) {
      counts[char] += 1;
    }
  }

  if (counts['\t'] >= counts[','] && counts['\t'] >= counts[';'] && counts['\t'] > 0) {
    return '\t';
  }

  if (counts[';'] > counts[',']) {
    return ';';
  }

  return ',';
}

function coerceCell(value: string): unknown {
  const text = value.trim();

  if (text === '' || text.toLowerCase() === 'null') {
    return null;
  }

  if (text === 'TRUE' || text === 'true' || text === 'FALSE' || text === 'false') {
    return text.toLowerCase() === 'true';
  }

  if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(text)) {
    const numeric = Number(text);

    if (Number.isFinite(numeric)) {
      return numeric;
    }
  }

  return value;
}
