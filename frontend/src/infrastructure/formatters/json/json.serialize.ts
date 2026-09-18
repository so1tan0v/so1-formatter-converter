/**
 * Imports from domain
 */
import type { JsonFormatOptions } from '@domain/formatter/types';
import { indentString } from '@domain/shared/indent';

/**
 * Сериализует значение в JSON-строку по выбранным настройкам
 *
 * @param value Разобранное JSON-значение
 * @param options Настройки форматирования JSON
 */
export function serializeJson(
  value: unknown,
  options: JsonFormatOptions,
): string {
  const prepared = prepareJson(value, options);
  const compact = stringifyCompact(prepared);
  let output: string;

  switch (options.mode) {
    case 'pretty':
      output = JSON.stringify(prepared, null, indentString(options.indent));

      break;
    case 'compact':
      output = compact;

      break;
    case 'escaped':
      output = JSON.stringify(compact);

      break;
  }

  if (options.escapeUnicode) {
    output = escapeNonAscii(output);
  }

  if (options.trailingNewline && !output.endsWith('\n')) {
    output += '\n';
  }

  return output;
}

function prepareJson(value: unknown, options: JsonFormatOptions): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => prepareJson(item, options));
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).filter(
      ([, item]) => typeof item !== 'undefined',
    );
    const kept = options.dropNulls
      ? entries.filter(([, item]) => item !== null)
      : entries;

    if (options.sortKeys) {
      kept.sort(([left], [right]) => left.localeCompare(right));
    }

    const next: Record<string, unknown> = {};

    for (const [key, item] of kept) {
      next[key] = prepareJson(item, options);
    }

    return next;
  }

  return value;
}

function stringifyCompact(value: unknown): string {
  if (value === null) {
    return 'null';
  }

  if (typeof value === 'string') {
    return JSON.stringify(value);
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error('JSON cannot contain Infinity or NaN');
    }

    return JSON.stringify(value);
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  if (Array.isArray(value)) {
    const items = value.map((item) => stringifyCompact(item));

    return `[${items.join(', ')}]`;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    const fields = entries.map(
      ([key, item]) => `${JSON.stringify(key)}: ${stringifyCompact(item)}`,
    );

    return `{${fields.join(', ')}}`;
  }

  throw new Error(`Unsupported JSON value: ${typeof value}`);
}

function escapeNonAscii(json: string): string {
  return json.replace(/[^\t\n\r\x20-\x7E]/g, (char) => {
    const code = char.charCodeAt(0);

    return `\\u${code.toString(16).padStart(4, '0')}`;
  });
}
