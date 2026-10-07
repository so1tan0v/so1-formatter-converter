/**
 * Imports from relative
 */
import { prettyPrintJsonFragment } from '@infrastructure/formatters/json/json.pretty-print';

/**
 * Форматирует YAML до первой поломки, сохраняя хвост как есть
 *
 * @param input Исходный YAML-текст
 * @param indent Строка отступа
 * @param compact Однострочный режим
 */
export function prettyPrintYamlFragment(
  input: string,
  indent: string,
  compact: boolean,
): string {
  const trimmed = input.trimStart();

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return prettyPrintJsonFragment(input, indent, compact);
  }

  if (compact) {
    return collapseYamlLines(input);
  }

  return formatYamlLines(input);
}

function formatYamlLines(input: string): string {
  const lines: string[] = [];
  let index = 0;

  while (index < input.length) {
    const newline = input.indexOf('\n', index);
    const line = newline === -1 ? input.slice(index) : input.slice(index, newline);
    const formatted = formatYamlLine(line);

    lines.push(formatted);

    if (hasUnclosedQuote(line)) {
      if (newline !== -1) {
        lines.push(input.slice(newline + 1));
      }

      return lines.join('\n');
    }

    if (newline === -1) {
      break;
    }

    index = newline + 1;
  }

  return lines.join('\n');
}

function formatYamlLine(line: string): string {
  const indent = line.match(/^\s*/)?.[0] ?? '';
  const body = line.slice(indent.length).replace(/\s+$/, '');

  if (!body || body.startsWith('#')) {
    return `${indent}${body}`;
  }

  const list = body.match(/^(- )(.*)$/);

  if (list) {
    return `${indent}- ${formatYamlValue(list[2])}`;
  }

  const mapping = body.match(/^([^:#\s][^:]*?)(:)(\s*)(.*)$/);

  if (!mapping) {
    return `${indent}${body}`;
  }

  const value = mapping[4];

  if (!value) {
    return `${indent}${mapping[1]}:`;
  }

  return `${indent}${mapping[1]}: ${value}`;
}

function formatYamlValue(value: string): string {
  const mapping = value.match(/^([^:#\s][^:]*?)(:)(\s*)(.*)$/);

  if (!mapping) {
    return value;
  }

  if (!mapping[4]) {
    return `${mapping[1]}:`;
  }

  return `${mapping[1]}: ${mapping[4]}`;
}

function collapseYamlLines(input: string): string {
  return input
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' ');
}

function hasUnclosedQuote(line: string): boolean {
  let quote: string | undefined;
  let escaped = false;

  for (const char of line) {
    if (escaped) {
      escaped = false;

      continue;
    }

    if (char === '\\' && quote) {
      escaped = true;

      continue;
    }

    if (char === '"' || char === "'") {
      if (!quote) {
        quote = char;
      } else if (char === quote) {
        quote = undefined;
      }
    }
  }

  return Boolean(quote);
}
