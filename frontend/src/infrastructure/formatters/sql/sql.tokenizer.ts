/**
 * Imports from relative
 */
import { isKeywordName, type Token } from './sql.keywords';

const TWO_CHAR_OPS = ['==', '!=', '<>', '<=', '>=', '||', '&&', '::'];
const ONE_CHAR_OPS = new Set(['=', '<', '>', '+', '-', '*', '/', '%', '!']);
const PUNCT = new Set(['(', ')', ',', ';', '.']);

/**
 * Разбивает SQL-текст на токены
 *
 * @param input Исходный SQL-текст
 */
export function tokenizeSql(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const char = input[i];

    if (isWhitespace(char)) {
      i += 1;

      continue;
    }

    if (char === '-' && input[i + 1] === '-') {
      i = skipLine(input, i);

      continue;
    }

    if (char === '/' && input[i + 1] === '*') {
      i = skipBlockComment(input, i);

      continue;
    }

    if (char === "'" || char === '"' || char === '`') {
      const token = readQuoted(input, i, char);

      tokens.push(token);
      i = token.pos + token.raw.length;

      continue;
    }

    if (isDigit(char) || (char === '.' && isDigit(input[i + 1] ?? ''))) {
      const token = readNumber(input, i);

      tokens.push(token);
      i = token.pos + token.raw.length;

      continue;
    }

    const two = input.slice(i, i + 2);

    if (TWO_CHAR_OPS.includes(two)) {
      tokens.push({ type: 'op', value: two, raw: two, pos: i });
      i += 2;

      continue;
    }

    if (ONE_CHAR_OPS.has(char)) {
      tokens.push({ type: 'op', value: char, raw: char, pos: i });
      i += 1;

      continue;
    }

    if (PUNCT.has(char)) {
      tokens.push({ type: 'punct', value: char, raw: char, pos: i });
      i += 1;

      continue;
    }

    if (char === '$') {
      if (isDigit(input[i + 1] ?? '')) {
        let j = i + 1;

        while (isDigit(input[j] ?? '')) {
          j += 1;
        }

        const raw = input.slice(i, j);

        tokens.push({ type: 'ident', value: raw, raw, pos: i });
        i = j;

        continue;
      }

      const token = readDollarQuote(input, i);

      tokens.push(token);
      i = token.pos + token.raw.length;

      continue;
    }

    if (isIdentStart(char)) {
      const token = readIdent(input, i);

      tokens.push(token);
      i = token.pos + token.raw.length;

      continue;
    }

    throw new Error(`Unexpected character "${char}" at position ${i}`);
  }

  tokens.push({ type: 'eof', value: '', raw: '', pos: input.length });

  return tokens;
}

function readDollarQuote(input: string, start: number): Token {
  let i = start + 1;

  while (i < input.length && isIdentPart(input[i])) {
    i += 1;
  }

  if (input[i] !== '$') {
    throw new Error(`Unexpected character "$" at position ${start}`);
  }

  const tag = input.slice(start, i + 1);
  const closeAt = input.indexOf(tag, i + 1);

  if (closeAt === -1) {
    throw new Error(
      `Unterminated dollar-quoted string starting at position ${start}`,
    );
  }

  const raw = input.slice(start, closeAt + tag.length);

  return { type: 'string', value: raw, raw, pos: start };
}

function readQuoted(input: string, start: number, quote: string): Token {
  let i = start + 1;
  let raw = quote;

  while (i < input.length) {
    const char = input[i];

    raw += char;
    i += 1;

    if (char === quote) {
      if (input[i] === quote) {
        raw += input[i];
        i += 1;

        continue;
      }

      const type = quote === "'" ? 'string' : 'ident';

      return { type, value: raw, raw, pos: start };
    }

    if (char === '\\' && i < input.length) {
      raw += input[i];
      i += 1;
    }
  }

  throw new Error(`Unterminated string starting at position ${start}`);
}

function readNumber(input: string, start: number): Token {
  let i = start;

  while (i < input.length && /[0-9.]/.test(input[i])) {
    i += 1;
  }

  const raw = input.slice(start, i);

  return { type: 'number', value: raw, raw, pos: start };
}

function readIdent(input: string, start: number): Token {
  let i = start;

  while (i < input.length && isIdentPart(input[i])) {
    i += 1;
  }

  const raw = input.slice(start, i);
  const upper = raw.toUpperCase();

  if (isKeywordName(upper)) {
    return { type: 'keyword', value: upper, raw, pos: start };
  }

  return { type: 'ident', value: raw, raw, pos: start };
}

function skipLine(input: string, start: number): number {
  let i = start;

  while (i < input.length && input[i] !== '\n') {
    i += 1;
  }

  return i;
}

function skipBlockComment(input: string, start: number): number {
  let i = start + 2;

  while (i < input.length && !(input[i] === '*' && input[i + 1] === '/')) {
    i += 1;
  }

  return Math.min(i + 2, input.length);
}

function isWhitespace(char: string): boolean {
  return /\s/.test(char);
}

function isDigit(char: string): boolean {
  return /[0-9]/.test(char);
}

function isIdentStart(char: string): boolean {
  return /[A-Za-z_]/.test(char);
}

function isIdentPart(char: string): boolean {
  return /[A-Za-z0-9_]/.test(char);
}
