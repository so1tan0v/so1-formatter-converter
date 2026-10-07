const JS_KEYWORDS = new Set([
  'abstract',
  'async',
  'await',
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'else',
  'enum',
  'export',
  'extends',
  'false',
  'finally',
  'for',
  'from',
  'function',
  'if',
  'implements',
  'import',
  'in',
  'instanceof',
  'interface',
  'let',
  'new',
  'null',
  'of',
  'package',
  'private',
  'protected',
  'public',
  'return',
  'static',
  'super',
  'switch',
  'this',
  'throw',
  'true',
  'try',
  'typeof',
  'undefined',
  'var',
  'void',
  'while',
  'with',
  'yield',
  'type',
  'as',
]);

const GO_KEYWORDS = new Set([
  'break',
  'case',
  'chan',
  'const',
  'continue',
  'default',
  'defer',
  'else',
  'fallthrough',
  'false',
  'for',
  'func',
  'go',
  'goto',
  'if',
  'import',
  'interface',
  'iota',
  'map',
  'nil',
  'package',
  'range',
  'return',
  'select',
  'struct',
  'switch',
  'true',
  'type',
  'var',
]);

const PYTHON_KEYWORDS = new Set([
  'and',
  'as',
  'assert',
  'async',
  'await',
  'break',
  'class',
  'continue',
  'def',
  'del',
  'elif',
  'else',
  'except',
  'false',
  'finally',
  'for',
  'from',
  'global',
  'if',
  'import',
  'in',
  'is',
  'lambda',
  'none',
  'nonlocal',
  'not',
  'or',
  'pass',
  'raise',
  'return',
  'true',
  'try',
  'while',
  'with',
  'yield',
]);

const BASH_KEYWORDS = new Set([
  'case',
  'coproc',
  'do',
  'done',
  'elif',
  'else',
  'esac',
  'export',
  'fi',
  'for',
  'function',
  'if',
  'in',
  'local',
  'return',
  'select',
  'shift',
  'then',
  'time',
  'until',
  'while',
]);

const SQL_KEYWORDS = new Set([
  'select',
  'from',
  'where',
  'and',
  'or',
  'not',
  'insert',
  'into',
  'values',
  'update',
  'set',
  'delete',
  'join',
  'inner',
  'left',
  'right',
  'full',
  'outer',
  'on',
  'as',
  'group',
  'by',
  'order',
  'having',
  'limit',
  'offset',
  'union',
  'all',
  'case',
  'when',
  'then',
  'else',
  'end',
  'null',
  'is',
  'in',
  'like',
  'between',
  'exists',
  'create',
  'table',
  'index',
  'view',
  'with',
  'distinct',
  'top',
  'returning',
]);

type TokenKind = 'comment' | 'string' | 'keyword' | 'number' | 'plain';

/**
 * Подсвечивает исходник fenced-блока и оборачивает токены в span
 *
 * @param source Текст блока (уже без markdown-ограждения)
 * @param language Язык из метки ```ts
 */
export function highlightFence(source: string, language?: string): string {
  const lang = normalizeLanguage(language);
  const tokens = tokenize(source, lang);

  return tokens
    .map((token) => {
      const text = escapeHtml(token.value);

      if (token.kind === 'plain') {
        return text;
      }

      return `<span class="md-tok md-tok--${token.kind}">${text}</span>`;
    })
    .join('');
}

function normalizeLanguage(language?: string): string {
  const lang = language?.toLowerCase() ?? '';

  switch (lang) {
    case 'ts':
    case 'tsx':
    case 'js':
    case 'jsx':
    case 'javascript':
    case 'typescript':
      return 'js';
    case 'yml':
    case 'yaml':
      return 'yaml';
    case 'json':
    case 'json5':
    case 'jsonc':
      return 'json';
    case 'sql':
      return 'sql';
    case 'go':
      return 'go';
    case 'py':
    case 'python':
      return 'python';
    case 'bash':
    case 'sh':
    case 'shell':
    case 'zsh':
      return 'bash';
    default:
      return lang;
  }
}

function tokenize(
  source: string,
  lang: string,
): { kind: TokenKind; value: string }[] {
  if (lang === 'js') {
    return tokenizeCode(source, {
      keywords: JS_KEYWORDS,
      lineComment: '//',
      blockComments: true,
    });
  }

  if (lang === 'go') {
    return tokenizeCode(source, {
      keywords: GO_KEYWORDS,
      lineComment: '//',
      blockComments: true,
    });
  }

  if (lang === 'python') {
    return tokenizeCode(source, {
      keywords: PYTHON_KEYWORDS,
      lineComment: '#',
      tripleQuotes: true,
    });
  }

  if (lang === 'bash') {
    return tokenizeCode(source, {
      keywords: BASH_KEYWORDS,
      lineComment: '#',
    });
  }

  if (lang === 'sql') {
    return tokenizeCode(source, {
      keywords: SQL_KEYWORDS,
      lineComment: '--',
    });
  }

  if (lang === 'json' || lang === 'yaml') {
    return tokenizeCode(source, {
      keywords: new Set(['true', 'false', 'null']),
      lineComment: '//',
      blockComments: true,
    });
  }

  return [{ kind: 'plain', value: source }];
}

interface TokenizeOptions {
  keywords: Set<string>;
  lineComment?: string;
  blockComments?: boolean;
  tripleQuotes?: boolean;
}

function tokenizeCode(
  source: string,
  options: TokenizeOptions,
): { kind: TokenKind; value: string }[] {
  const tokens: { kind: TokenKind; value: string }[] = [];
  let index = 0;

  while (index < source.length) {
    if (
      options.lineComment &&
      source.startsWith(options.lineComment, index)
    ) {
      const end = source.indexOf('\n', index);
      const stop = end === -1 ? source.length : end;

      tokens.push({ kind: 'comment', value: source.slice(index, stop) });
      index = stop;

      continue;
    }

    if (options.blockComments && source.startsWith('/*', index)) {
      const end = source.indexOf('*/', index + 2);
      const stop = end === -1 ? source.length : end + 2;

      tokens.push({ kind: 'comment', value: source.slice(index, stop) });
      index = stop;

      continue;
    }

    if (options.tripleQuotes) {
      let triple: string | undefined;

      if (source.startsWith('"""', index)) {
        triple = '"""';
      } else if (source.startsWith("'''", index)) {
        triple = "'''";
      }

      if (triple) {
        const end = source.indexOf(triple, index + 3);
        const stop = end === -1 ? source.length : end + 3;

        tokens.push({ kind: 'string', value: source.slice(index, stop) });
        index = stop;

        continue;
      }
    }

    const quote = source[index];

    if (quote === '"' || quote === "'" || quote === '`') {
      const raw = readQuoted(source, index, quote);

      tokens.push({ kind: 'string', value: raw });
      index += raw.length;

      continue;
    }

    if (/[0-9]/.test(source[index])) {
      const match = source.slice(index).match(/^[0-9]+(?:\.[0-9]+)?/);
      const raw = match?.[0] ?? source[index];

      tokens.push({ kind: 'number', value: raw });
      index += raw.length;

      continue;
    }

    if (/[A-Za-z_]/.test(source[index])) {
      const match = source.slice(index).match(/^[A-Za-z_][\w]*/);
      const raw = match?.[0] ?? source[index];
      const kind = options.keywords.has(raw.toLowerCase())
        ? 'keyword'
        : 'plain';

      tokens.push({ kind, value: raw });
      index += raw.length;

      continue;
    }

    tokens.push({ kind: 'plain', value: source[index] });
    index += 1;
  }

  return tokens;
}

function readQuoted(source: string, start: number, quote: string): string {
  let index = start + 1;

  while (index < source.length) {
    if (source[index] === '\\' && index + 1 < source.length) {
      index += 2;

      continue;
    }

    if (source[index] === quote) {
      return source.slice(start, index + 1);
    }

    index += 1;
  }

  return source.slice(start);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
