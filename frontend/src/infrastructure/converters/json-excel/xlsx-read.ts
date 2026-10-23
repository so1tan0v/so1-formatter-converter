/**
 * Imports from relative
 */
import type { ExcelTable } from './json-to-excel';

const BUILTIN_DATE_FORMATS = new Set<number>([
  14, 15, 16, 17, 18, 19, 20, 21, 22, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36,
  45, 46, 47, 50, 51, 52, 53, 54, 55, 56, 57, 58,
]);

/**
 * Читает первый лист книги .xlsx в таблицу строк
 *
 * @param bytes Содержимое файла .xlsx
 */
export async function xlsxBytesToTable(bytes: Uint8Array): Promise<ExcelTable> {
  const files = await unzip(bytes);
  const sheetName = worksheetName(files);

  if (!sheetName) {
    throw new Error('Excel file is not a workbook');
  }

  const shared = sharedStrings(xmlOf(files, 'xl/sharedStrings.xml'));
  const dates = dateStyleIndexes(xmlOf(files, 'xl/styles.xml'));
  const rows = parseSheet(xmlOf(files, sheetName), shared, dates);

  if (!rows.length) {
    throw new Error('Excel sheet is empty');
  }

  return { header: true, rows };
}

/**
 * Проверяет, что имя файла похоже на книгу Excel
 *
 * @param name Имя выбранного файла
 */
export function isWorkbookName(name: string): boolean {
  return /\.xlsx$/i.test(name);
}

async function unzip(bytes: Uint8Array): Promise<Map<string, Uint8Array>> {
  const eocd = findEocd(bytes);
  const files = new Map<string, Uint8Array>();
  let offset = eocd.offset;

  for (let index = 0; index < eocd.count; index += 1) {
    if (u32(bytes, offset) !== 0x02014b50) {
      throw new Error('Excel file is not a workbook');
    }

    const method = u16(bytes, offset + 10);
    const compressedSize = u32(bytes, offset + 20);
    const uncompressedSize = u32(bytes, offset + 24);
    const nameLength = u16(bytes, offset + 28);
    const extraLength = u16(bytes, offset + 30);
    const commentLength = u16(bytes, offset + 32);
    const localOffset = u32(bytes, offset + 42);
    const name = decodeText(bytes.subarray(offset + 46, offset + 46 + nameLength));

    if (
      compressedSize === 0xffffffff ||
      uncompressedSize === 0xffffffff ||
      localOffset === 0xffffffff
    ) {
      throw new Error('Excel file is too large');
    }

    const dataStart =
      localOffset + 30 + u16(bytes, localOffset + 26) + u16(bytes, localOffset + 28);
    const compressed = bytes.subarray(dataStart, dataStart + compressedSize);

    files.set(name, await inflateEntry(method, compressed));
    offset += 46 + nameLength + extraLength + commentLength;
  }

  return files;
}

function findEocd(bytes: Uint8Array): { count: number; offset: number } {
  const min = Math.max(0, bytes.length - 22 - 65535);

  for (let index = bytes.length - 22; index >= min; index -= 1) {
    if (u32(bytes, index) !== 0x06054b50) {
      continue;
    }

    return {
      count: u16(bytes, index + 10),
      offset: u32(bytes, index + 16),
    };
  }

  throw new Error('Excel file is not a workbook');
}

async function inflateEntry(
  method: number,
  compressed: Uint8Array,
): Promise<Uint8Array> {
  if (method === 0) {
    return compressed.slice();
  }

  if (method !== 8) {
    throw new Error('Excel file is not a workbook');
  }

  const stream = new Blob([compressed.slice()]).stream().pipeThrough(
    new DecompressionStream('deflate-raw'),
  );

  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function worksheetName(files: Map<string, Uint8Array>): string | null {
  const names = [...files.keys()]
    .filter((name) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(name))
    .sort();

  return names[0] ?? null;
}

function xmlOf(files: Map<string, Uint8Array>, name: string): string {
  const bytes = files.get(name);

  if (!bytes) {
    return '';
  }

  const text = decodeText(bytes);

  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function sharedStrings(xml: string): string[] {
  const items: string[] = [];
  const pattern = /<si\b[^>]*>([\s\S]*?)<\/si>/g;

  for (const match of xml.matchAll(pattern)) {
    items.push(inlineText(match[1] ?? ''));
  }

  return items;
}

function dateStyleIndexes(xml: string): Set<number> {
  const indexes = new Set<number>();
  const section = /<cellXfs\b[^>]*>([\s\S]*?)<\/cellXfs>/.exec(xml)?.[1];

  if (!section) {
    return indexes;
  }

  const custom = customFormats(xml);
  let index = 0;

  for (const match of section.matchAll(/<xf\b([^>]*)\/?>/g)) {
    const formatId = Number(attribute(match[1] ?? '', 'numFmtId') ?? '0');

    if (isDateFormat(formatId, custom.get(formatId))) {
      indexes.add(index);
    }

    index += 1;
  }

  return indexes;
}

function customFormats(xml: string): Map<number, string> {
  const formats = new Map<number, string>();

  for (const match of xml.matchAll(/<numFmt\b([^>]*)\/?>/g)) {
    const id = attribute(match[1] ?? '', 'numFmtId');
    const code = attribute(match[1] ?? '', 'formatCode');

    if (id && code) {
      formats.set(Number(id), code);
    }
  }

  return formats;
}

function isDateFormat(id: number, code: string | undefined): boolean {
  if (BUILTIN_DATE_FORMATS.has(id)) {
    return true;
  }

  if (!code) {
    return false;
  }

  return /[dyhs]/i.test(code.replace(/\[[^\]]*\]/g, ''));
}

function parseSheet(
  xml: string,
  shared: string[],
  dates: Set<number>,
): string[][] {
  const grid = new Map<number, Map<number, string>>();
  let maxRow = -1;
  let maxColumn = -1;

  for (const rowMatch of xml.matchAll(/<row\b([^>]*)>([\s\S]*?)<\/row>/g)) {
    const fallbackRow = Number(attribute(rowMatch[1] ?? '', 'r') ?? '0') - 1;

    for (const cellMatch of (rowMatch[2] ?? '').matchAll(
      /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g,
    )) {
      const attrs = cellMatch[1] ?? '';
      const ref = parseRef(attribute(attrs, 'r'));
      const row = ref?.row ?? (fallbackRow >= 0 ? fallbackRow : maxRow + 1);
      const column = ref?.column ?? 0;
      const value = cellText(attrs, cellMatch[2] ?? '', shared, dates);

      const line = grid.get(row) ?? new Map<number, string>();

      line.set(column, value);
      grid.set(row, line);
      maxRow = Math.max(maxRow, row);
      maxColumn = Math.max(maxColumn, column);
    }
  }

  if (maxRow < 0 || maxColumn < 0) {
    return [];
  }

  const rows: string[][] = [];

  for (let row = 0; row <= maxRow; row += 1) {
    const line = grid.get(row);
    const cells: string[] = [];

    for (let column = 0; column <= maxColumn; column += 1) {
      cells.push(line?.get(column) ?? '');
    }

    rows.push(cells);
  }

  while (rows.length && rows[0]?.every((cell) => cell === '')) {
    rows.shift();
  }

  while (rows.length && rows.at(-1)?.every((cell) => cell === '')) {
    rows.pop();
  }

  return rows;
}

function cellText(
  attrs: string,
  body: string,
  shared: string[],
  dates: Set<number>,
): string {
  const type = attribute(attrs, 't') ?? 'n';

  if (type === 'inlineStr') {
    return inlineText(body);
  }

  if (type === 's') {
    return shared[Number(tagText(body, 'v'))] ?? '';
  }

  if (type === 'b') {
    return tagText(body, 'v') === '1' ? 'TRUE' : 'FALSE';
  }

  if (type === 'str' || type === 'e') {
    return tagText(body, 'v');
  }

  const raw = tagText(body, 'v').trim();

  if (!raw) {
    return '';
  }

  const numeric = Number(raw);
  const style = Number(attribute(attrs, 's') ?? '-1');

  if (dates.has(style) && Number.isFinite(numeric)) {
    return excelSerialToIso(numeric);
  }

  if (Number.isFinite(numeric)) {
    return String(numeric);
  }

  return raw;
}

function excelSerialToIso(serial: number): string {
  const whole = Math.floor(serial);
  const date = new Date(Math.round((serial - 25569) * 86400000));

  if (Number.isNaN(date.getTime())) {
    return String(serial);
  }

  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');

  if (whole <= 0) {
    return `${hours}:${minutes}:${seconds}`;
  }

  const year = String(date.getUTCFullYear());
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  if (serial - whole < 1e-8) {
    return `${year}-${month}-${day}`;
  }

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`;
}

function inlineText(xml: string): string {
  return [...xml.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)]
    .map((match) => decodeXml(match[1] ?? ''))
    .join('');
}

function tagText(xml: string, tag: string): string {
  const match = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`).exec(xml);

  return match ? decodeXml(match[1] ?? '') : '';
}

function attribute(source: string, name: string): string | null {
  const match = new RegExp(`(?:^|\\s)${name}="([^"]*)"`).exec(source);

  return match ? decodeXml(match[1] ?? '') : null;
}

function parseRef(
  ref: string | null,
): { column: number; row: number } | null {
  const match = /^([A-Z]+)(\d+)$/.exec(ref ?? '');

  if (!match) {
    return null;
  }

  let column = 0;

  for (const char of match[1] ?? '') {
    column = column * 26 + (char.charCodeAt(0) - 64);
  }

  return { column: column - 1, row: Number(match[2]) - 1 };
}

function decodeXml(text: string): string {
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec: string) =>
      String.fromCodePoint(Number(dec)),
    )
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function decodeText(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

function u16(bytes: Uint8Array, offset: number): number {
  return bytes[offset]! | (bytes[offset + 1]! << 8);
}

function u32(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset]! |
      (bytes[offset + 1]! << 8) |
      (bytes[offset + 2]! << 16) |
      (bytes[offset + 3]! << 24)) >>>
    0
  );
}
