/**
 * Imports from packages
 */
import { format, type SqlLanguage } from 'sql-formatter';

/**
 * Imports from domain
 */
import type { TextFormatter } from '@domain/formatter/ports';
import type { SqlFormatOptions } from '@domain/formatter/types';
import { indentString } from '@domain/shared/indent';
import { failure, success, toErrorMessage } from '@domain/shared/result';
import type { Result } from '@domain/shared/result';

const SQL_LANGUAGES = [
  'postgresql',
  'mysql',
  'sqlite',
  'clickhouse',
  'transactsql',
  'sql',
] as const satisfies readonly SqlLanguage[];

export class SqlFormatter implements TextFormatter<'sql'> {
  /**
   * Идентификатор SQL-форматтера
   */
  readonly id = 'sql' as const;

  /**
   * Подпись SQL-форматтера в интерфейсе
   */
  readonly label = 'SQL';

  /**
   * Форматирует SQL через sql-formatter, подбирая диалект под синтаксис запроса
   *
   * @param input Исходный текст
   * @param options Настройки форматирования SQL
   */
  format(input: string, options: SqlFormatOptions): Result<string> {
    const source = input.trim();

    if (!source) {
      return failure('Empty input');
    }

    try {
      return success(formatSql(source, options));
    } catch (error) {
      return failure(toErrorMessage(error));
    }
  }
}

function formatSql(source: string, options: SqlFormatOptions): string {
  const keywordCase = options.keywordCase;
  const shared = {
    tabWidth:
      options.indent === 'tab' ? 4 : indentString(options.indent).length,
    useTabs: options.indent === 'tab',
    keywordCase: 'preserve' as const,
    identifierCase: 'preserve' as const,
    functionCase: 'preserve' as const,
    logicalOperatorNewline: 'before' as const,
    paramTypes: {
      positional: true,
      custom: [{ regex: '%s' }],
    },
  };
  let best: { output: string; score: number } | undefined;
  let lastError = 'Invalid SQL';

  for (const language of SQL_LANGUAGES) {
    try {
      const output = format(source, { ...shared, language }).trim();
      const score = scoreFormat(source, output, language);

      if (!best || score > best.score) {
        best = { output, score };
      }
    } catch (error) {
      lastError = toErrorMessage(error);
    }
  }

  if (!best) {
    throw new Error(lastError);
  }

  const indent = indentString(options.indent);

  return layoutIfCalls(
    layoutClauses(
      presentSql(best.output, keywordCase, source.includes('==')),
      indent,
    ),
    indent,
  );
}

function scoreFormat(
  source: string,
  output: string,
  language: SqlLanguage,
): number {
  let score = language === 'postgresql' ? 2 : language === 'sql' ? 1 : 0;

  if (source.includes('==') && output.includes('= =')) {
    score -= 100;
  }

  if (
    /\bprewhere\b/i.test(source) &&
    !hasKeyword(output, 'prewhere')
  ) {
    score -= 100;
  }

  if (source.includes('::') && !output.includes('::')) {
    score -= 50;
  }

  if (/\[[A-Za-z_][A-Za-z0-9_]*\]/.test(source) && !output.includes('[')) {
    score -= 50;
  }

  if (/\btop\s+\d+/i.test(source) && !hasKeyword(output, 'top')) {
    score -= 40;
  }

  if (
    /\binterval\b/i.test(source) &&
    !hasKeyword(output, 'interval')
  ) {
    score -= 50;
  }

  return score;
}

function hasKeyword(output: string, keyword: string): boolean {
  return new RegExp(`\\b${keyword}\\b`, 'i').test(output);
}

const SQL_KEYWORDS = new Set([
  'SELECT',
  'DISTINCT',
  'FROM',
  'WHERE',
  'JOIN',
  'INNER',
  'LEFT',
  'RIGHT',
  'FULL',
  'OUTER',
  'CROSS',
  'ON',
  'USING',
  'AND',
  'OR',
  'NOT',
  'GROUP',
  'BY',
  'ORDER',
  'HAVING',
  'LIMIT',
  'OFFSET',
  'AS',
  'CASE',
  'WHEN',
  'THEN',
  'ELSE',
  'END',
  'IN',
  'IS',
  'NULL',
  'LIKE',
  'ILIKE',
  'BETWEEN',
  'EXISTS',
  'UNION',
  'ALL',
  'ASC',
  'DESC',
  'WITH',
  'INSERT',
  'INTO',
  'VALUES',
  'UPDATE',
  'SET',
  'DELETE',
  'CREATE',
  'REPLACE',
  'FUNCTION',
  'PROCEDURE',
  'RETURNS',
  'LANGUAGE',
  'BEGIN',
  'RETURN',
  'CALL',
  'DEFAULT',
  'DETERMINISTIC',
  'INTERVAL',
  'TRUE',
  'FALSE',
  'TOP',
  'PREWHERE',
  'SETTINGS',
  'FORMAT',
  'FINAL',
  'SAMPLE',
  'APPLY',
  'LATERAL',
  'GLOBAL',
  'ASOF',
  'ARRAY',
  'SEMI',
  'ANTI',
  'ANY',
  'STRAIGHT_JOIN',
  'FETCH',
  'NEXT',
  'ROWS',
  'ONLY',
  'RETURNING',
  'GLOB',
  'IGNORE',
  'PARTITION',
  'OVER',
  'WINDOW',
  'FILTER',
  'NOLOCK',
]);

const SQL_FUNCTIONS = new Set([
  'IF',
  'IFNULL',
  'NULLIF',
  'COALESCE',
  'CAST',
  'COUNT',
  'SUM',
  'AVG',
  'MIN',
  'MAX',
  'ABS',
  'ROUND',
  'LENGTH',
  'LOWER',
  'UPPER',
  'TRIM',
  'CONCAT',
  'SUBSTRING',
  'NOW',
  'CURRENT_DATE',
  'CURRENT_TIMESTAMP',
]);

function presentSql(
  output: string,
  keywordCase: SqlFormatOptions['keywordCase'],
  collapseEquality: boolean,
): string {
  if (keywordCase === 'preserve' && !collapseEquality) {
    return output;
  }

  let result = '';
  let index = 0;

  while (index < output.length) {
    if (output.startsWith('--', index)) {
      const end = output.indexOf('\n', index);
      const stop = end === -1 ? output.length : end;

      result += output.slice(index, stop);
      index = stop;

      continue;
    }

    if (output.startsWith('/*', index)) {
      const end = output.indexOf('*/', index + 2);
      const stop = end === -1 ? output.length : end + 2;

      result += output.slice(index, stop);
      index = stop;

      continue;
    }

    const quote = output[index];

    if (quote === "'" || quote === '"' || quote === '`' || quote === '[') {
      const closer = quote === '[' ? ']' : quote;

      result += quote;
      index += 1;

      while (index < output.length) {
        result += output[index];

        if (output[index] === closer) {
          index += 1;

          if (closer !== ']' && output[index] === closer) {
            result += output[index];
            index += 1;

            continue;
          }

          break;
        }

        index += 1;
      }

      continue;
    }

    if (collapseEquality && output.startsWith('=', index)) {
      const match = /^=\s+=/.exec(output.slice(index));

      if (match) {
        result += '==';
        index += match[0].length;

        continue;
      }
    }

    if (quote !== undefined && /[A-Za-z_]/.test(quote)) {
      const start = index;

      index += 1;

      while (
        index < output.length &&
        /[A-Za-z0-9_]/.test(output[index] ?? '')
      ) {
        index += 1;
      }

      const word = output.slice(start, index);
      const upper = word.toUpperCase();
      const gap = /^\s+/.exec(output.slice(index))?.[0] ?? '';

      if (
        keywordCase !== 'preserve' &&
        SQL_FUNCTIONS.has(upper) &&
        output[index + gap.length] === '('
      ) {
        result += applyCase(upper, keywordCase);
        index += gap.length;

        continue;
      }

      result +=
        keywordCase !== 'preserve' && SQL_KEYWORDS.has(upper)
          ? applyCase(upper, keywordCase)
          : word;

      continue;
    }

    result += output[index];
    index += 1;
  }

  return result;
}

function applyCase(
  word: string,
  keywordCase: SqlFormatOptions['keywordCase'],
): string {
  return keywordCase === 'lower' ? word.toLowerCase() : word.toUpperCase();
}

const CLAUSE_LINE =
  /^(\s*)(FROM|WHERE|HAVING|PREWHERE|LIMIT|OFFSET|GROUP BY|ORDER BY)$/i;

const JOIN_START =
  /^(?:STRAIGHT_JOIN\b|(?:(?:NATURAL|CROSS|INNER|OUTER|LEFT|RIGHT|FULL|ANTI|SEMI|ASOF|GLOBAL|ANY)\s+)*JOIN\b)/i;

const HANGING_CLAUSE = /^(FROM|GROUP BY|ORDER BY)$/i;

/**
 * Сдвигает FROM, JOIN и соседние клаузы к раскладке прежнего принтера
 *
 * @param sql Уже отформатированный SQL
 * @param indent Строка одного уровня отступа
 */
function layoutClauses(sql: string, indent: string): string {
  const lines = sql.split('\n');
  const result: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? '';
    const clause = CLAUSE_LINE.exec(line);

    if (clause) {
      const lead = clause[1] ?? '';
      const keyword = clause[2] ?? '';
      const consumed = consumeClauseBody(lines, index, lead, keyword, indent);

      if (consumed) {
        result.push(...consumed.lines);
        index = consumed.nextIndex;

        continue;
      }
    }

    const join = liftJoin(line, indent);

    if (join) {
      result.push(...join);

      continue;
    }

    result.push(line);
  }

  return result.join('\n');
}

function consumeClauseBody(
  lines: string[],
  index: number,
  lead: string,
  keyword: string,
  indent: string,
): { lines: string[]; nextIndex: number } | undefined {
  const bodyIndent = lead + indent;
  const next = lines[index + 1] ?? '';

  if (!isBodyLine(next, bodyIndent, indent)) {
    return undefined;
  }

  const first = next.trim();

  if (isJoinStart(first)) {
    return undefined;
  }

  const items = [stripComma(first)];
  let cursor = index + 2;

  if (HANGING_CLAUSE.test(keyword) && first.endsWith(',')) {
    while (cursor < lines.length) {
      const candidate = lines[cursor] ?? '';

      if (!isBodyLine(candidate, bodyIndent, indent)) {
        break;
      }

      const text = candidate.trim();

      if (isJoinStart(text) || isClauseBreak(text)) {
        break;
      }

      items.push(stripComma(text));
      cursor += 1;

      if (!text.endsWith(',')) {
        break;
      }
    }
  }

  const prefix = `${lead}${keyword} `;
  const hang = ' '.repeat(prefix.length);

  return {
    lines: items.map((item, itemIndex) => {
      const comma = itemIndex === items.length - 1 ? '' : ',';

      return itemIndex === 0
        ? `${prefix}${item}${comma}`
        : `${hang}${item}${comma}`;
    }),
    nextIndex: cursor - 1,
  };
}

function liftJoin(line: string, indent: string): string[] | undefined {
  const text = line.trim();

  if (!isJoinStart(text)) {
    return undefined;
  }

  const lead = line.slice(0, line.length - text.length);

  if (!lead.endsWith(indent)) {
    return undefined;
  }

  const parent = lead.slice(0, lead.length - indent.length);
  const { header, tail } = splitJoinTail(text);
  const lines = [`${parent}${header}`];

  if (tail) {
    lines.push(`${parent}${indent}${tail}`);
  }

  return lines;
}

function isBodyLine(line: string, bodyIndent: string, indent: string): boolean {
  return (
    line.startsWith(bodyIndent) &&
    !line.startsWith(bodyIndent + indent) &&
    !line.trim().startsWith('(')
  );
}

function isJoinStart(text: string): boolean {
  return JOIN_START.test(text);
}

function isClauseBreak(text: string): boolean {
  return /^(AND|OR|ON|USING|WHERE|GROUP|ORDER|HAVING|LIMIT|OFFSET|UNION|SELECT|FROM|PREWHERE)\b/i.test(
    text,
  );
}

function stripComma(text: string): string {
  return text.endsWith(',') ? text.slice(0, -1) : text;
}

function splitJoinTail(text: string): { header: string; tail: string | null } {
  let depth = 0;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (char === '(') {
      depth += 1;

      continue;
    }

    if (char === ')') {
      depth = Math.max(0, depth - 1);

      continue;
    }

    if (depth !== 0 || (index > 0 && text[index - 1] !== ' ')) {
      continue;
    }

    const rest = text.slice(index);

    if (/^(ON|USING)\b/i.test(rest)) {
      return {
        header: text.slice(0, index).trimEnd(),
        tail: rest.trim(),
      };
    }
  }

  return { header: text, tail: null };
}

/**
 * Разворачивает IF так же, как прежний принтер: первый аргумент на строке вызова,
 * остальные — со следующим отступом, вложенный IF раскрывается ещё на уровень
 *
 * @param sql Уже отформатированный SQL
 * @param indent Строка одного уровня отступа
 */
function layoutIfCalls(sql: string, indent: string): string {
  let result = '';
  let index = 0;

  while (index < sql.length) {
    const found = findLineStartIf(sql, index);

    if (!found) {
      result += sql.slice(index);

      break;
    }

    const rendered = renderIf(sql, found.paren, found.name, found.pad, indent);

    if (!rendered || !callIsLineRoot(sql, rendered.end)) {
      result += sql.slice(index, found.nameEnd);
      index = found.nameEnd;

      continue;
    }

    result += sql.slice(index, found.lineStart);
    result += rendered.text;
    index = rendered.end;
  }

  return result;
}

function findLineStartIf(
  source: string,
  from: number,
): { lineStart: number; paren: number; name: string; nameEnd: number; pad: string } | undefined {
  let index = from;
  let quote: "'" | '"' | '`' | null = null;
  let lineStart = source.lastIndexOf('\n', from - 1) + 1;

  while (index < source.length) {
    const char = source[index];

    if (quote) {
      if (char === quote) {
        quote = source[index + 1] === quote ? quote : null;
        index += source[index + 1] === quote ? 2 : 1;

        continue;
      }

      if (char === '\n') {
        lineStart = index + 1;
      }

      index += 1;

      continue;
    }

    if (char === '\n') {
      lineStart = index + 1;
      index += 1;

      continue;
    }

    if (char === '-' && source[index + 1] === '-') {
      const end = source.indexOf('\n', index);

      index = end === -1 ? source.length : end;

      continue;
    }

    if (char === '/' && source[index + 1] === '*') {
      const end = source.indexOf('*/', index + 2);

      index = end === -1 ? source.length : end + 2;

      continue;
    }

    if (char === "'" || char === '"' || char === '`') {
      quote = char;
      index += 1;

      continue;
    }

    if (char !== undefined && /[A-Za-z_]/.test(char)) {
      const wordStart = index;

      index += 1;

      while (index < source.length && /[A-Za-z0-9_]/.test(source[index] ?? '')) {
        index += 1;
      }

      const name = source.slice(wordStart, index);
      const gap = /^\s*/.exec(source.slice(index))?.[0] ?? '';
      const paren = index + gap.length;
      const pad = source.slice(lineStart, wordStart);

      if (
        /^if$/i.test(name) &&
        source[paren] === '(' &&
        /^[ \t]*$/.test(pad) &&
        !gap.includes('\n')
      ) {
        return { lineStart, paren, name, nameEnd: index, pad };
      }

      continue;
    }

    index += 1;
  }

  return undefined;
}

function renderIf(
  source: string,
  paren: number,
  name: string,
  pad: string,
  indent: string,
): { text: string; end: number } | undefined {
  const parsed = parseCall(source, paren);

  if (!parsed) {
    return undefined;
  }

  if (parsed.args.length === 0) {
    return { text: `${pad}${name}()`, end: parsed.end };
  }

  const [first = '', ...rest] = parsed.args;
  const lines = [
    `${pad}${name}(${first.trim()}${rest.length > 0 ? ',' : ''}`,
  ];

  rest.forEach((arg, argIndex) => {
    const comma = argIndex === rest.length - 1 ? '' : ',';
    const nested = renderNestedIf(arg, `${pad}${indent}`, indent);

    lines.push(`${nested}${comma}`);
  });
  lines.push(`${pad})`);

  return {
    text: lines.join('\n'),
    end: parsed.end,
  };
}

function callIsLineRoot(source: string, end: number): boolean {
  return /^(\s+AS\s+\S+)?\s*,?\s*;?\s*(?:\n|$)/i.test(source.slice(end));
}

function renderNestedIf(arg: string, pad: string, indent: string): string {
  const trimmed = arg.trim();
  const header = /^if\s*\(/i.exec(trimmed);

  if (!header) {
    return `${pad}${trimmed}`;
  }

  const name = /^if/i.exec(trimmed)?.[0] ?? 'IF';
  const rendered = renderIf(trimmed, header[0].length - 1, name, pad, indent);

  if (!rendered || rendered.end !== trimmed.length) {
    return `${pad}${trimmed}`;
  }

  return rendered.text;
}

function parseCall(
  source: string,
  openParen: number,
): { args: string[]; end: number } | undefined {
  let depth = 0;
  let quote: "'" | '"' | '`' | null = null;
  let argStart = openParen + 1;
  const args: string[] = [];

  for (let index = openParen; index < source.length; index += 1) {
    const char = source[index];

    if (quote) {
      if (char === quote) {
        if (source[index + 1] === quote) {
          index += 1;
        } else {
          quote = null;
        }
      }

      continue;
    }

    if (char === "'" || char === '"' || char === '`') {
      quote = char;

      continue;
    }

    if (char === '(') {
      depth += 1;

      continue;
    }

    if (char === ')') {
      depth -= 1;

      if (depth === 0) {
        args.push(source.slice(argStart, index));

        if (args.length === 1 && args[0]?.trim() === '') {
          return { args: [], end: index + 1 };
        }

        return { args, end: index + 1 };
      }

      continue;
    }

    if (char === ',' && depth === 1) {
      args.push(source.slice(argStart, index));
      argStart = index + 1;
    }
  }

  return undefined;
}
