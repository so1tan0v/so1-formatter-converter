/**
 * Imports from domain
 */
import { failure, success } from '@domain/shared/result';
import type { Result } from '@domain/shared/result';

/**
 * Достает значение по пути вида user.profile.name или items[0].id
 *
 * @param value Разобранный JSON
 * @param path Путь от корня. Пустая строка возвращает само значение
 */
export function selectJsonPath(value: unknown, path: string): Result<unknown> {
  const parsed = parseJsonPath(path);

  if (!parsed.ok) {
    return parsed;
  }

  let current = value;
  const walked: string[] = [];

  for (const token of parsed.value) {
    walked.push(token);

    if (Array.isArray(current)) {
      if (!/^\d+$/.test(token) || Number(token) >= current.length) {
        return failure(`Nothing at ${walked.join('.')}`);
      }

      current = current[Number(token)];

      continue;
    }

    if (current === null || typeof current !== 'object') {
      return failure(`Nothing at ${walked.join('.')}`);
    }

    const record = current as Record<string, unknown>;

    if (!Object.prototype.hasOwnProperty.call(record, token)) {
      return failure(`Nothing at ${walked.join('.')}`);
    }

    current = record[token];
  }

  return success(current);
}

/**
 * Разбирает путь на ключи и индексы
 *
 * @param path Путь от корня JSON
 */
export function parseJsonPath(path: string): Result<string[]> {
  const source = path.trim();

  if (!source) {
    return success([]);
  }

  const tokens: string[] = [];
  let index = 0;

  while (index < source.length) {
    if (source[index] === '.') {
      index += 1;

      if (index >= source.length) {
        return failure(`Invalid path "${source}"`);
      }

      continue;
    }

    if (source[index] === '[') {
      const bracket = readBracket(source, index);

      if (!bracket) {
        return failure(`Invalid path "${source}"`);
      }

      tokens.push(bracket.token);
      index = bracket.next;

      continue;
    }

    const start = index;

    while (
      index < source.length &&
      source[index] !== '.' &&
      source[index] !== '['
    ) {
      index += 1;
    }

    const token = source.slice(start, index);

    if (!token) {
      return failure(`Invalid path "${source}"`);
    }

    tokens.push(token);
  }

  return tokens.length > 0
    ? success(tokens)
    : failure(`Invalid path "${source}"`);
}

function readBracket(
  source: string,
  start: number,
): { token: string; next: number } | null {
  const end = source.indexOf(']', start + 1);

  if (end === -1) {
    return null;
  }

  let inner = source.slice(start + 1, end).trim();

  if (
    (inner.startsWith('"') && inner.endsWith('"')) ||
    (inner.startsWith("'") && inner.endsWith("'"))
  ) {
    inner = inner.slice(1, -1);
  }

  if (!inner) {
    return null;
  }

  return { token: inner, next: end + 1 };
}
