type FragmentToken = {
  kind:
    | 'lbrace'
    | 'rbrace'
    | 'lbracket'
    | 'rbracket'
    | 'colon'
    | 'comma'
    | 'value';
  raw: string;
};

/**
 * Форматирует JSON-подобный фрагмент до первой поломки, не закрывая скобки
 *
 * @param input Исходный текст
 * @param indent Строка отступа
 * @param compact Однострочный режим
 */
export function prettyPrintJsonFragment(
  input: string,
  indent: string,
  compact: boolean,
): string {
  const tokens = scanJsonFragment(input);
  let output = '';
  let depth = 0;

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    const previous = tokens[index - 1];
    const next = tokens[index + 1];

    if (isOpen(token)) {
      output += token.raw;
      depth += 1;

      if (next && !isClose(next) && !compact) {
        output += `\n${indent.repeat(depth)}`;
      }

      continue;
    }

    if (isClose(token)) {
      const empty = previous !== undefined && isOpen(previous);

      depth = Math.max(0, depth - 1);

      if (!empty && !compact) {
        output += `\n${indent.repeat(depth)}`;
      }

      output += token.raw;

      continue;
    }

    if (token.kind === 'colon') {
      output += ': ';

      continue;
    }

    if (token.kind === 'comma') {
      output += ',';
      output += compact ? ' ' : `\n${indent.repeat(depth)}`;

      continue;
    }

    output += token.raw;
  }

  return output;
}

function isOpen(token: FragmentToken): boolean {
  return token.kind === 'lbrace' || token.kind === 'lbracket';
}

function isClose(token: FragmentToken): boolean {
  return token.kind === 'rbrace' || token.kind === 'rbracket';
}

function scanJsonFragment(input: string): FragmentToken[] {
  const tokens: FragmentToken[] = [];
  let index = 0;

  while (index < input.length) {
    const char = input[index];

    if (/\s/.test(char)) {
      index += 1;

      continue;
    }

    if (char === '/' && input[index + 1] === '/') {
      const end = input.indexOf('\n', index);
      const raw = end === -1 ? input.slice(index) : input.slice(index, end);

      tokens.push({ kind: 'value', raw });
      index += raw.length;

      if (end === -1) {
        break;
      }

      continue;
    }

    if (char === '/' && input[index + 1] === '*') {
      const end = input.indexOf('*/', index + 2);
      const raw = end === -1 ? input.slice(index) : input.slice(index, end + 2);

      tokens.push({ kind: 'value', raw });
      index += raw.length;

      if (end === -1) {
        break;
      }

      continue;
    }

    if (char === '"' || char === "'") {
      const raw = readQuoted(input, index, char);

      tokens.push({ kind: 'value', raw });
      index += raw.length;

      if (!raw.endsWith(char) || raw.length === 1) {
        break;
      }

      continue;
    }

    const punct = readPunct(char);

    if (punct) {
      tokens.push(punct);
      index += 1;

      continue;
    }

    if (isIdentStart(char) || isNumberStart(char, input[index + 1] ?? '')) {
      const raw = readAtom(input, index);

      tokens.push({ kind: 'value', raw });
      index += raw.length;

      continue;
    }

    tokens.push({ kind: 'value', raw: char });
    index += 1;
  }

  return tokens;
}

function readPunct(char: string): FragmentToken | undefined {
  switch (char) {
    case '{':
      return { kind: 'lbrace', raw: char };
    case '}':
      return { kind: 'rbrace', raw: char };
    case '[':
      return { kind: 'lbracket', raw: char };
    case ']':
      return { kind: 'rbracket', raw: char };
    case ':':
      return { kind: 'colon', raw: char };
    case ',':
      return { kind: 'comma', raw: char };
    default:
      return undefined;
  }
}

function readQuoted(input: string, start: number, quote: string): string {
  let index = start + 1;
  let raw = quote;

  while (index < input.length) {
    const char = input[index];

    raw += char;
    index += 1;

    if (char === '\\' && index < input.length) {
      raw += input[index];
      index += 1;

      continue;
    }

    if (char === quote) {
      return raw;
    }
  }

  return raw;
}

function readAtom(input: string, start: number): string {
  let index = start + 1;

  while (index < input.length && isAtomChar(input[index])) {
    index += 1;
  }

  return input.slice(start, index);
}

function isIdentStart(char: string): boolean {
  return /[A-Za-z_]/.test(char);
}

function isNumberStart(char: string, next: string): boolean {
  return /[0-9]/.test(char) || (char === '-' && /[0-9.]/.test(next));
}

function isAtomChar(char: string): boolean {
  return /[A-Za-z0-9_.+\\-]/.test(char);
}
