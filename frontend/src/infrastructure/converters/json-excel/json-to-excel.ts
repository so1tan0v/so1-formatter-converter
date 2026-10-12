/**
 * Imports from domain
 */
import type { ConverterOptions } from '@domain/converter/types';

/**
 * Imports from infrastructure
 */
import { parseLooseJson } from '@infrastructure/formatters/json/json.parser';

const EXCEL_MAX_ROWS = 1_048_576;
const EXCEL_MAX_COLUMNS = 16_384;
const EXCEL_MAX_EXPANDED_ROWS = 10_000;

type ExcelCell = string | number | null;

export type ExcelNullStyle = 'empty' | 'null';
export type ExcelBooleanStyle = 'true-false' | 'one-zero';
export type ExcelArrayStyle = 'json' | 'join' | 'expand';

export interface ExcelBuildOptions {
  flatten: boolean;
  keyColumn: boolean;
  header: boolean;
  nulls: ExcelNullStyle;
  booleans: ExcelBooleanStyle;
  arrays: ExcelArrayStyle;
}

export const DEFAULT_EXCEL_OPTIONS: ExcelBuildOptions = {
  flatten: false,
  keyColumn: false,
  header: true,
  nulls: 'empty',
  booleans: 'true-false',
  arrays: 'json',
};

export interface ExcelTable {
  header: boolean;
  rows: string[][];
}

/**
 * Собирает настройки таблицы из произвольного набора параметров
 *
 * @param options Параметры конвертера
 */
export function excelBuildOptions(
  options: ConverterOptions | ExcelBuildOptions | undefined,
): ExcelBuildOptions {
  const arrays = options?.arrays;

  return {
    flatten: options?.flatten === true,
    keyColumn: options?.keyColumn === true,
    header: options?.header !== false,
    nulls: options?.nulls === 'null' ? 'null' : 'empty',
    booleans: options?.booleans === 'one-zero' ? 'one-zero' : 'true-false',
    arrays: arrays === 'join' || arrays === 'expand' ? arrays : 'json',
  };
}

/**
 * Сохраняет таблицу для превью: первая строка объектов — заголовок колонок
 *
 * @param input Исходный JSON-текст
 * @param options Параметры таблицы
 */
export function jsonToExcel(
  input: string,
  options: ConverterOptions | ExcelBuildOptions = {},
): string {
  return JSON.stringify(excelTable(input, options));
}

/**
 * Читает таблицу, сохранённую для превью
 *
 * @param output Текст результата конвертера
 */
export function readExcelTable(output: string): ExcelTable | null {
  try {
    const value: unknown = JSON.parse(output);

    if (!isExcelTable(value)) {
      return null;
    }

    return value;
  } catch {
    return null;
  }
}

/**
 * Собирает текст таблицы для копирования
 *
 * @param table Разобранное превью
 */
export function excelTableText(table: ExcelTable): string {
  return table.rows.map((row) => row.map(tsvCell).join('\t')).join('\n');
}

/**
 * Собирает книгу .xlsx из JSON-таблицы
 *
 * @param input Исходный JSON-текст
 * @param options Параметры таблицы
 */
export function jsonToExcelFile(
  input: string,
  options: ConverterOptions | ExcelBuildOptions = {},
): Uint8Array {
  return workbookBytes(excelSheet(input, options).rows);
}

function excelTable(
  input: string,
  options: ConverterOptions | ExcelBuildOptions,
): ExcelTable {
  const sheet = excelSheet(input, options);

  return {
    header: sheet.header,
    rows: sheet.rows.map((row) => row.map(displayCell)),
  };
}

function excelSheet(
  input: string,
  options: ConverterOptions | ExcelBuildOptions,
): { header: boolean; rows: ExcelCell[][] } {
  const sheet = toSheet(parseLooseJson(input), excelBuildOptions(options));

  if (sheet.rows.length > EXCEL_MAX_ROWS) {
    throw new Error(`Excel allows at most ${EXCEL_MAX_ROWS} rows`);
  }

  const width = sheet.rows.reduce((max, row) => Math.max(max, row.length), 0);

  if (width > EXCEL_MAX_COLUMNS) {
    throw new Error(`Excel allows at most ${EXCEL_MAX_COLUMNS} columns`);
  }

  return sheet;
}

function toSheet(
  value: unknown,
  options: ExcelBuildOptions,
): { header: boolean; rows: ExcelCell[][] } {
  if (Array.isArray(value)) {
    if (!value.length) {
      throw new Error('JSON array is empty');
    }

    if (value.every(isPlainObject)) {
      return sheetFromObjects(value, options);
    }

    if (value.every(Array.isArray)) {
      return { header: false, rows: rowsFromMatrix(value, options) };
    }

    if (value.every(isScalar)) {
      return {
        header: options.header,
        rows: withHeader(
          ['value'],
          value.map((item) => [cellValue(item, options, true)]),
          options,
        ),
      };
    }

    throw new Error(
      'JSON → Excel expects an object, an array of objects, or a table of rows',
    );
  }

  if (isPlainObject(value)) {
    return sheetFromObjects(objectRecords(value, options), options);
  }

  throw new Error(
    'JSON → Excel expects an object, an array of objects, or a table of rows',
  );
}

function sheetFromObjects(
  records: Record<string, unknown>[],
  options: ExcelBuildOptions,
): { header: boolean; rows: ExcelCell[][] } {
  const rows = expandRecords(records, options);
  const columns = collectColumns(rows);

  return {
    header: options.header,
    rows: withHeader(
      columns,
      rows.map((row) =>
        columns.map((column) =>
          cellValue(row[column], options, Object.hasOwn(row, column)),
        ),
      ),
      options,
    ),
  };
}

function withHeader(
  columns: string[],
  body: ExcelCell[][],
  options: ExcelBuildOptions,
): ExcelCell[][] {
  if (!options.header) {
    return body;
  }

  return [columns, ...body];
}

function objectRecords(
  value: Record<string, unknown>,
  options: ExcelBuildOptions,
): Record<string, unknown>[] {
  const entries = Object.entries(value);

  if (
    !options.keyColumn ||
    !entries.length ||
    !entries.every(([, child]) => isPlainObject(child))
  ) {
    return [value];
  }

  return entries.map(([key, child]) => {
    const row: Record<string, unknown> = { key };

    if (!isPlainObject(child)) {
      return row;
    }

    for (const [field, fieldValue] of Object.entries(child)) {
      if (field === 'key') {
        continue;
      }

      row[field] = fieldValue;
    }

    return row;
  });
}

function expandRecords(
  records: Record<string, unknown>[],
  options: ExcelBuildOptions,
): Record<string, unknown>[] {
  const budget = { left: EXCEL_MAX_EXPANDED_ROWS };

  return records.flatMap((record) => expandRecord(record, options, budget));
}

function expandRecord(
  record: Record<string, unknown>,
  options: ExcelBuildOptions,
  budget: { left: number },
): Record<string, unknown>[] {
  if (options.flatten) {
    const flat = flattenRecord(record, options);

    return options.arrays === 'expand'
      ? explodeRows(flat, options, budget)
      : [flat];
  }

  if (options.arrays === 'expand') {
    return explodeRows(record, options, budget);
  }

  if (options.arrays === 'join') {
    return [mapJoin(record, options)];
  }

  return [record];
}

function flattenRecord(
  record: Record<string, unknown>,
  options: ExcelBuildOptions,
  prefix = '',
): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(record)) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (isPlainObject(value)) {
      const nested = flattenRecord(value, options, path);

      if (Object.keys(nested).length) {
        Object.assign(out, nested);
      } else {
        out[path] = null;
      }

      continue;
    }

    if (Array.isArray(value) && options.arrays === 'join') {
      if (value.every(isPlainObject)) {
        if (!value.length) {
          out[path] = null;

          continue;
        }

        value.forEach((item, index) => {
          Object.assign(out, flattenRecord(item, options, `${path}.${index}`));
        });

        continue;
      }

      out[path] = joinArray(value, options);

      continue;
    }

    out[path] = value;
  }

  return out;
}

function mapJoin(
  record: Record<string, unknown>,
  options: ExcelBuildOptions,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(record)) {
    out[key] = Array.isArray(value) ? joinArray(value, options) : value;
  }

  return out;
}

function explodeRows(
  record: Record<string, unknown>,
  options: ExcelBuildOptions,
  budget: { left: number },
): Record<string, unknown>[] {
  const key = Object.keys(record).find(
    (name) =>
      Array.isArray(record[name]) && (record[name] as unknown[]).length > 0,
  );

  if (!key) {
    budget.left -= 1;

    if (budget.left < 0) {
      throw new Error(
        `JSON expands to more than ${EXCEL_MAX_EXPANDED_ROWS} rows`,
      );
    }

    return [emptyArrays(record)];
  }

  const items = record[key] as unknown[];
  const rest = { ...record };

  delete rest[key];
  const rows: Record<string, unknown>[] = [];

  for (const item of items) {
    const child = childFields(key, item, options);
    const next = options.flatten
      ? { ...rest, ...child }
      : mergeChild(rest, key, child);

    rows.push(...explodeRows(next, options, budget));
  }

  return rows;
}

function childFields(
  key: string,
  item: unknown,
  options: ExcelBuildOptions,
): Record<string, unknown> {
  if (isPlainObject(item)) {
    if (options.flatten) {
      return flattenRecord(item, options, key);
    }

    return item;
  }

  if (Array.isArray(item)) {
    return { [key]: JSON.stringify(item) };
  }

  return { [key]: item };
}

function mergeChild(
  parent: Record<string, unknown>,
  key: string,
  child: Record<string, unknown>,
): Record<string, unknown> {
  const next = { ...parent };

  for (const [field, value] of Object.entries(child)) {
    if (!Object.hasOwn(next, field)) {
      next[field] = value;

      continue;
    }

    next[`${key}.${field}`] = value;
  }

  return next;
}

function emptyArrays(record: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(record)) {
    out[key] = Array.isArray(value) ? null : value;
  }

  return out;
}

function joinArray(items: unknown[], options: ExcelBuildOptions): string {
  return items.map((item) => joinItem(item, options)).join(', ');
}

function joinItem(item: unknown, options: ExcelBuildOptions): string {
  if (item === null || typeof item === 'undefined') {
    return options.nulls === 'null' ? 'null' : '';
  }

  if (typeof item === 'boolean') {
    if (options.booleans === 'one-zero') {
      return item ? '1' : '0';
    }

    return item ? 'TRUE' : 'FALSE';
  }

  if (typeof item === 'number') {
    if (!Number.isFinite(item)) {
      throw new Error('Excel cannot contain Infinity or NaN');
    }

    return String(item);
  }

  if (typeof item === 'string') {
    return item;
  }

  return JSON.stringify(item);
}

function rowsFromMatrix(
  rows: unknown[][],
  options: ExcelBuildOptions,
): ExcelCell[][] {
  const width = rows.reduce((max, row) => Math.max(max, row.length), 0);

  if (!width) {
    throw new Error('JSON rows are empty');
  }

  return rows.map((row) =>
    Array.from({ length: width }, (_, index) =>
      cellValue(row[index], options, index < row.length),
    ),
  );
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

function cellValue(
  value: unknown,
  options: ExcelBuildOptions,
  present: boolean,
): ExcelCell {
  if (!present || typeof value === 'undefined') {
    return null;
  }

  if (value === null) {
    return options.nulls === 'null' ? 'null' : null;
  }

  if (value === '') {
    return null;
  }

  if (typeof value === 'boolean') {
    if (options.booleans === 'one-zero') {
      return value ? 1 : 0;
    }

    return value ? 'TRUE' : 'FALSE';
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error('Excel cannot contain Infinity or NaN');
    }

    return value;
  }

  if (typeof value === 'string') {
    return value;
  }

  return JSON.stringify(value);
}

function displayCell(cell: ExcelCell): string {
  if (cell === null) {
    return '';
  }

  if (typeof cell === 'number') {
    return String(cell);
  }

  return cell;
}

function tsvCell(cell: string): string {
  if (/[\t\r\n]/.test(cell)) {
    return JSON.stringify(cell);
  }

  return cell;
}

function isExcelTable(value: unknown): value is ExcelTable {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record.header === 'boolean' &&
    Array.isArray(record.rows) &&
    record.rows.every(
      (row) =>
        Array.isArray(row) && row.every((cell) => typeof cell === 'string'),
    )
  );
}

function workbookBytes(rows: ExcelCell[][]): Uint8Array {
  const encoder = new TextEncoder();

  return zipStore([
    {
      name: '[Content_Types].xml',
      data: encoder.encode(contentTypesXml()),
    },
    {
      name: '_rels/.rels',
      data: encoder.encode(rootRelsXml()),
    },
    {
      name: 'xl/workbook.xml',
      data: encoder.encode(workbookXml()),
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      data: encoder.encode(workbookRelsXml()),
    },
    {
      name: 'xl/worksheets/sheet1.xml',
      data: encoder.encode(worksheetXml(rows)),
    },
  ]);
}

function contentTypesXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`;
}

function rootRelsXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;
}

function workbookXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Sheet1" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`;
}

function workbookRelsXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`;
}

function worksheetXml(rows: ExcelCell[][]): string {
  const body = rows
    .map((row, rowIndex) => {
      const cells = row
        .map((cell, columnIndex) =>
          cellXml(cellReference(columnIndex, rowIndex), cell),
        )
        .join('');

      return `<row r="${rowIndex + 1}">${cells}</row>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>${body}</sheetData>
</worksheet>`;
}

function cellXml(reference: string, cell: ExcelCell): string {
  if (cell === null) {
    return '';
  }

  if (typeof cell === 'number') {
    return `<c r="${reference}"><v>${cell}</v></c>`;
  }

  return `<c r="${reference}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(cell)}</t></is></c>`;
}

function cellReference(column: number, row: number): string {
  return `${columnName(column)}${row + 1}`;
}

function columnName(index: number): string {
  let current = index + 1;
  let name = '';

  while (current > 0) {
    const remainder = (current - 1) % 26;

    name = String.fromCharCode(65 + remainder) + name;
    current = Math.floor((current - 1) / 26);
  }

  return name;
}

function escapeXml(text: string): string {
  return [...text]
    .filter((char) => !isForbiddenXmlChar(char))
    .join('')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function isForbiddenXmlChar(char: string): boolean {
  const code = char.charCodeAt(0);

  return code <= 8 || code === 11 || code === 12 || (code >= 14 && code <= 31);
}

interface ZipEntry {
  name: string;
  data: Uint8Array;
}

function zipStore(entries: ZipEntry[]): Uint8Array {
  const encoder = new TextEncoder();
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const crc = crc32(entry.data);
    const local = new Uint8Array(30 + name.length);
    const localView = new DataView(local.buffer);

    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(8, 0, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, entry.data.length, true);
    localView.setUint32(22, entry.data.length, true);
    localView.setUint16(26, name.length, true);
    local.set(name, 30);

    const central = new Uint8Array(46 + name.length);
    const centralView = new DataView(central.buffer);

    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, entry.data.length, true);
    centralView.setUint32(24, entry.data.length, true);
    centralView.setUint16(28, name.length, true);
    centralView.setUint32(42, offset, true);
    central.set(name, 46);

    locals.push(local, entry.data);
    centrals.push(central);
    offset += local.length + entry.data.length;
  }

  const centralSize = centrals.reduce((sum, part) => sum + part.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);

  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, entries.length, true);
  endView.setUint16(10, entries.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true);

  return concatBytes([...locals, ...centrals, end]);
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const size = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(size);
  let cursor = 0;

  for (const part of parts) {
    out.set(part, cursor);
    cursor += part.length;
  }

  return out;
}

const CRC_TABLE = new Uint32Array(256);

for (let index = 0; index < CRC_TABLE.length; index += 1) {
  let value = index;

  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }

  CRC_TABLE[index] = value >>> 0;
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;

  for (const byte of data) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function isScalar(value: unknown): boolean {
  return (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
