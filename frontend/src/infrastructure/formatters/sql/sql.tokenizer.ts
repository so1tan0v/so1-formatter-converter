/**
 * Imports from relative
 */
import { isKeywordName, type Token } from './sql.keywords';

const THREE_CHAR_OPS = ['<=>'];
const TWO_CHAR_OPS = [
  '==',
  '!=',
  '<>',
  '<=',
  '>=',
  '||',
  '&&',
  '::',
  ':=',
  '!~',
  '>>',
  '<<',
];
const ONE_CHAR_OPS = new Set([
  '=',
  '<',
  '>',
  '+',
  '-',
  '*',
  '/',
  '%',
  '!',
  '~',
  '^',
  '&',
  '|',
]);
const PUNCT = new Set(['(', ')', ',', ';', '.']);
const FORMAT_SPEC = /[sdifurxXoegGcb%]/;

/**
 * Разбивает SQL-текст на токены
 *
 * @param input Исходный SQL-текст
 */
export function tokenizeSql(input: string): Token[] {
  const { tokens, rest } = tokenizeSqlRecovering(input);

  if (rest) {
    throw new Error(
      `Unexpected character "${rest[0]}" at position ${input.length - rest.length}`,
    );
  }

  return tokens;
}

/**
 * Токенизирует SQL, не падая на неизвестных символах: хвост возвращается как rest
 *
 * @param input Исходный SQL-текст
 */
export function tokenizeSqlRecovering(input: string): {
  tokens: Token[];
  rest: string;
} {
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

    if (char === '#' && !isIdentStart(input[i + 1] ?? '') && input[i + 1] !== '#') {
      i = skipLine(input, i);

      continue;
    }

    const placeholder = readPlaceholder(input, i);

    if (placeholder) {
      tokens.push(placeholder);
      i = placeholder.pos + placeholder.raw.length;

      continue;
    }

    if ((char === 'N' || char === 'n') && isQuote(input[i + 1] ?? '')) {
      const quoted = readQuoted(input, i + 1, input[i + 1]);

      if (!quoted) {
        return finish(tokens, input, i);
      }

      const raw = char + quoted.raw;

      tokens.push({ type: 'string', value: raw, raw, pos: i });
      i += raw.length;

      continue;
    }

    if (isQuote(char)) {
      const quoted = readQuoted(input, i, char);

      if (!quoted) {
        tokens.push({
          type: 'string',
          value: input.slice(i),
          raw: input.slice(i),
          pos: i,
        });

        return finish(tokens, input, input.length);
      }

      tokens.push(quoted);
      i = quoted.pos + quoted.raw.length;

      continue;
    }

    if (char === '[') {
      const ident = readWrappedIdent(input, i, ']');

      if (!ident) {
        tokens.push({
          type: 'ident',
          value: input.slice(i),
          raw: input.slice(i),
          pos: i,
        });

        return finish(tokens, input, input.length);
      }

      tokens.push(ident);
      i = ident.pos + ident.raw.length;

      continue;
    }

    if (char === '{') {
      const ident = readWrappedIdent(input, i, '}');

      if (!ident) {
        tokens.push({
          type: 'ident',
          value: input.slice(i),
          raw: input.slice(i),
          pos: i,
        });

        return finish(tokens, input, input.length);
      }

      tokens.push(ident);
      i = ident.pos + ident.raw.length;

      continue;
    }

    if (char === '@' || char === '#') {
      const ident = readSigilIdent(input, i, char);

      tokens.push(ident);
      i = ident.pos + ident.raw.length;

      continue;
    }

    if (isDigit(char) || (char === '.' && isDigit(input[i + 1] ?? ''))) {
      const token = readNumber(input, i);

      tokens.push(token);
      i = token.pos + token.raw.length;

      continue;
    }

    const three = input.slice(i, i + 3);

    if (THREE_CHAR_OPS.includes(three)) {
      tokens.push({ type: 'op', value: three, raw: three, pos: i });
      i += 3;

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

        tokens.push({ type: 'placeholder', value: raw, raw, pos: i });
        i = j;

        continue;
      }

      const dollar = readDollarQuote(input, i);

      if (!dollar) {
        return finish(tokens, input, i);
      }

      tokens.push(dollar);
      i = dollar.pos + dollar.raw.length;

      continue;
    }

    if (isIdentStart(char)) {
      const token = readIdent(input, i);

      tokens.push(token);
      i = token.pos + token.raw.length;

      continue;
    }

    return finish(tokens, input, i);
  }

  return finish(tokens, input, input.length);
}

function finish(
  tokens: Token[],
  input: string,
  index: number,
): { tokens: Token[]; rest: string } {
  tokens.push({ type: 'eof', value: '', raw: '', pos: index });

  return { tokens, rest: input.slice(index) };
}

function readPlaceholder(input: string, start: number): Token | undefined {
  const char = input[start];

  if (char === '?') {
    let index = start + 1;

    while (isDigit(input[index] ?? '')) {
      index += 1;
    }

    const raw = input.slice(start, index);

    return { type: 'placeholder', value: raw, raw, pos: start };
  }

  if (char === '%') {
    if (input[start + 1] === '(') {
      const close = input.indexOf(')', start + 2);
      const spec = close === -1 ? '' : input[close + 1] ?? '';

      if (close !== -1 && FORMAT_SPEC.test(spec)) {
        const raw = input.slice(start, close + 2);

        return { type: 'placeholder', value: raw, raw, pos: start };
      }
    }

    const spec = input[start + 1] ?? '';

    if (FORMAT_SPEC.test(spec) && !isIdentPart(input[start + 2] ?? '')) {
      const raw = input.slice(start, start + 2);

      return { type: 'placeholder', value: raw, raw, pos: start };
    }
  }

  if (char === ':' && input[start + 1] !== ':' && isIdentStart(input[start + 1] ?? '')) {
    let index = start + 1;

    while (isIdentPart(input[index] ?? '')) {
      index += 1;
    }

    const raw = input.slice(start, index);

    return { type: 'placeholder', value: raw, raw, pos: start };
  }

  return undefined;
}

function readDollarQuote(input: string, start: number): Token | undefined {
  let i = start + 1;

  while (i < input.length && isIdentPart(input[i])) {
    i += 1;
  }

  if (input[i] !== '$') {
    return undefined;
  }

  const tag = input.slice(start, i + 1);
  const closeAt = input.indexOf(tag, i + 1);

  if (closeAt === -1) {
    return {
      type: 'string',
      value: input.slice(start),
      raw: input.slice(start),
      pos: start,
    };
  }

  const raw = input.slice(start, closeAt + tag.length);

  return { type: 'string', value: raw, raw, pos: start };
}

function readQuoted(
  input: string,
  start: number,
  quote: string,
): Token | undefined {
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

  return undefined;
}

function readWrappedIdent(
  input: string,
  start: number,
  close: string,
): Token | undefined {
  const end = input.indexOf(close, start + 1);

  if (end === -1) {
    return undefined;
  }

  const raw = input.slice(start, end + 1);

  return { type: 'ident', value: raw, raw, pos: start };
}

function readSigilIdent(input: string, start: number, sigil: string): Token {
  let index = start + 1;

  if (input[index] === sigil) {
    index += 1;
  }

  while (isIdentPart(input[index] ?? '')) {
    index += 1;
  }

  const raw = input.slice(start, index);

  return { type: 'ident', value: raw, raw, pos: start };
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

function isQuote(char: string): boolean {
  return char === "'" || char === '"' || char === '`';
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
