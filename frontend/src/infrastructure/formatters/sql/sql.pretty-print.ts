/**
 * Imports from domain
 */
import type { SqlFormatOptions } from '@domain/formatter/types';

/**
 * Imports from relative
 */
import { CLAUSE_STARTERS, type Token } from './sql.keywords';
import { tokenizeSqlRecovering } from './sql.tokenizer';

const JOIN_PREFIX = new Set([
  'INNER',
  'LEFT',
  'RIGHT',
  'FULL',
  'CROSS',
  'OUTER',
  'GLOBAL',
  'ASOF',
  'ARRAY',
  'SEMI',
  'ANTI',
  'ANY',
  'LATERAL',
]);

const BREAK_BEFORE = new Set([
  ...CLAUSE_STARTERS,
  'PREWHERE',
  'APPLY',
  'RETURNING',
  'SETTINGS',
  'FORMAT',
  'FINAL',
]);

/**
 * Форматирует SQL-фрагмент по токенам, не падая на обрыве
 *
 * @param input Исходный SQL-текст
 * @param options Настройки форматирования SQL
 */
export function prettyPrintSqlFragment(
  input: string,
  options: SqlFormatOptions,
): string {
  const { tokens, rest } = tokenizeSqlRecovering(input);
  const parts: string[] = [];
  let previous: Token | undefined;

  for (const token of tokens) {
    if (token.type === 'eof') {
      continue;
    }

    const text = formatToken(token, options);

    if (shouldBreak(previous, token)) {
      parts.push('\n');
    } else if (previous && !omitSpace(previous, token)) {
      parts.push(' ');
    }

    parts.push(text);
    previous = token;
  }

  return `${parts.join('')}${rest}`;
}

function formatToken(token: Token, options: SqlFormatOptions): string {
  if (token.type !== 'keyword') {
    return token.raw;
  }

  switch (options.keywordCase) {
    case 'lower':
      return token.raw.toLowerCase();
    case 'preserve':
      return token.raw;
    default:
      return token.raw.toUpperCase();
  }
}

function shouldBreak(previous: Token | undefined, token: Token): boolean {
  if (!previous || token.type !== 'keyword' || !BREAK_BEFORE.has(token.value)) {
    return false;
  }

  if (
    previous.type === 'keyword' &&
    JOIN_PREFIX.has(previous.value) &&
    (token.value === 'JOIN' ||
      token.value === 'APPLY' ||
      JOIN_PREFIX.has(token.value))
  ) {
    return false;
  }

  return true;
}

function omitSpace(previous: Token, token: Token): boolean {
  const left = previous.raw;
  const right = token.raw;

  return (
    left === '.' ||
    right === '.' ||
    right === ',' ||
    right === ')' ||
    right === ';' ||
    left === '(' ||
    left === '@'
  );
}
