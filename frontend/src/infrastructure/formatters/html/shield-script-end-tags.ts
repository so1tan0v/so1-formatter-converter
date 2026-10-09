/**
 * Прячет последовательность `</script>` внутри JavaScript и JSON,
 * чтобы HTML-парсер js-beautify не закрыл тег script посередине строки,
 * комментария или регулярного выражения.
 *
 * В JavaScript и JSON `\/` — это обычный слэш, поэтому `<\/script>`
 * сохраняет значение литерала и больше не является закрывающим тегом.
 */

const RAW_TEXT_TAGS = ['textarea', 'title', 'style'] as const;

const JS_SCRIPT_TYPES = new Set([
  'module',
  'text/javascript',
  'text/ecmascript',
  'application/javascript',
  'application/ecmascript',
  'application/x-javascript',
  'text/jscript',
  'text/livescript',
]);

const JSON_SCRIPT_TYPES = new Set([
  'application/json',
  'application/ld+json',
  'importmap',
]);

const REGEX_AFTER_KEYWORD = new Set([
  'return',
  'typeof',
  'case',
  'throw',
  'delete',
  'void',
  'do',
  'else',
  'yield',
  'await',
  'in',
  'of',
  'instanceof',
  'new',
]);

const TWO_CHAR_OPERATORS = [
  '=>',
  '==',
  '!=',
  '<=',
  '>=',
  '&&',
  '||',
  '??',
  '++',
  '--',
  '+=',
  '-=',
  '*=',
  '/=',
  '%=',
  '**',
  '?.',
  '<<',
  '>>',
  '&=',
  '|=',
  '^=',
];

type ScriptKind = 'js' | 'json' | 'other';

interface Scan {
  text: string;
  next: number;
}

interface Writer {
  source: string;
  parts: string[];
  scriptEnded: boolean;
  next: number;
}

/**
 * Экранирует внутренние `</script>` в тегах script перед форматированием
 *
 * @param source Исходный HTML
 */
export function shieldScriptEndTags(source: string): string {
  let index = 0;
  let output = '';

  while (index < source.length) {
    if (source.startsWith('<!--', index)) {
      const commentEnd = source.indexOf('-->', index + 4);
      const next = commentEnd === -1 ? source.length : commentEnd + 3;

      output += source.slice(index, next);
      index = next;

      continue;
    }

    if (!isTagStart(source, index)) {
      output += source[index] ?? '';
      index += 1;

      continue;
    }

    const script = readOpenTag(source, index, 'script');

    if (script) {
      const scan = shieldScriptElement(
        source,
        script.end,
        scriptKind(script.attrs),
      );

      output += source.slice(index, script.end) + scan.text;
      index = scan.next;

      continue;
    }

    const rawName = RAW_TEXT_TAGS.find((name) =>
      readOpenTag(source, index, name),
    );

    if (rawName) {
      const open = readOpenTag(source, index, rawName);
      const end = open ? findEndTag(source, open.end, rawName) : index + 1;

      output += source.slice(index, end);
      index = end;

      continue;
    }

    const tagEnd = readTagEnd(source, index);

    if (tagEnd === null) {
      output += source[index] ?? '';
      index += 1;

      continue;
    }

    output += source.slice(index, tagEnd);
    index = tagEnd;
  }

  return output;
}

function shieldScriptElement(
  source: string,
  bodyStart: number,
  kind: ScriptKind,
): Scan {
  if (kind === 'other') {
    return copyUntilEndTag(source, bodyStart);
  }

  const writer: Writer = {
    source,
    parts: [],
    scriptEnded: false,
    next: bodyStart,
  };

  if (kind === 'json') {
    readJson(writer, bodyStart);
  } else {
    readCode(writer, bodyStart, false);
  }

  if (!writer.scriptEnded) {
    return copyUntilEndTag(source, bodyStart);
  }

  return { text: writer.parts.join(''), next: writer.next };
}

function copyUntilEndTag(source: string, bodyStart: number): Scan {
  const next = findEndTag(source, bodyStart, 'script');

  return { text: source.slice(bodyStart, next), next };
}

function readCode(writer: Writer, start: number, stopOnBrace: boolean): void {
  let index = start;
  let exprAllowed = true;
  let braceDepth = 0;

  while (index < writer.source.length && !writer.scriptEnded) {
    const ch = writer.source[index] ?? '';
    const next = writer.source[index + 1] ?? '';

    if (isScriptEnd(writer.source, index)) {
      finishScript(writer, index);

      return;
    }

    if (ch === "'" || ch === '"') {
      index = readQuoted(writer, index, ch);
      exprAllowed = false;

      continue;
    }

    if (ch === '`') {
      index = readTemplate(writer, index);
      exprAllowed = false;

      continue;
    }

    if (ch === '/' && next === '/') {
      index = readLineComment(writer, index);

      continue;
    }

    if (ch === '/' && next === '*') {
      index = readBlockComment(writer, index);

      continue;
    }

    const operator = TWO_CHAR_OPERATORS.find((token) =>
      writer.source.startsWith(token, index),
    );

    if (operator) {
      writer.parts.push(operator);
      index += operator.length;
      exprAllowed = operator !== '++' && operator !== '--';

      continue;
    }

    if (ch === '/' && exprAllowed) {
      index = readRegex(writer, index);
      exprAllowed = false;

      continue;
    }

    if (ch === '/') {
      writer.parts.push(ch);
      index += 1;
      exprAllowed = true;

      continue;
    }

    if (ch === '{') {
      writer.parts.push(ch);
      index += 1;
      braceDepth += 1;
      exprAllowed = true;

      continue;
    }

    if (ch === '}') {
      if (stopOnBrace && braceDepth === 0) {
        writer.parts.push(ch);
        writer.next = index + 1;

        return;
      }

      writer.parts.push(ch);
      index += 1;
      braceDepth = Math.max(0, braceDepth - 1);
      exprAllowed = true;

      continue;
    }

    if (isIdentifierStart(ch)) {
      const identStart = index;

      index += 1;

      while (isIdentifierPart(writer.source[index] ?? '')) {
        index += 1;
      }

      const word = writer.source.slice(identStart, index);

      writer.parts.push(word);
      exprAllowed = REGEX_AFTER_KEYWORD.has(word);

      continue;
    }

    if (isNumberStart(ch, next)) {
      const numberStart = index;

      index += 1;

      while (/[0-9A-Za-z._]/.test(writer.source[index] ?? '')) {
        index += 1;
      }

      writer.parts.push(writer.source.slice(numberStart, index));
      exprAllowed = false;

      continue;
    }

    writer.parts.push(ch);
    index += 1;

    if (/\s/.test(ch)) {
      continue;
    }

    exprAllowed = '([{=,:;!&|?~^%+-*^<>'.includes(ch);
  }

  writer.next = index;
}

function readQuoted(writer: Writer, start: number, quote: "'" | '"'): number {
  let index = start + 1;

  writer.parts.push(quote);

  while (index < writer.source.length) {
    const ch = writer.source[index] ?? '';

    if (ch === '\\') {
      index = pushEscape(writer, index);

      continue;
    }

    if (ch === '\n' || ch === '\r') {
      return index;
    }

    if (ch === quote) {
      writer.parts.push(ch);

      return index + 1;
    }

    const shielded = pushShield(writer, index);

    if (shielded !== null) {
      index = shielded;

      continue;
    }

    writer.parts.push(ch);
    index += 1;
  }

  return index;
}

function readTemplate(writer: Writer, start: number): number {
  let index = start + 1;

  writer.parts.push('`');

  while (index < writer.source.length && !writer.scriptEnded) {
    const ch = writer.source[index] ?? '';
    const next = writer.source[index + 1] ?? '';

    if (ch === '\\') {
      index = pushEscape(writer, index);

      continue;
    }

    if (ch === '`') {
      writer.parts.push(ch);

      return index + 1;
    }

    if (ch === '$' && next === '{') {
      writer.parts.push('${');
      readCode(writer, index + 2, true);
      index = writer.next;

      continue;
    }

    const shielded = pushShield(writer, index);

    if (shielded !== null) {
      index = shielded;

      continue;
    }

    writer.parts.push(ch);
    index += 1;
  }

  return index;
}

function readLineComment(writer: Writer, start: number): number {
  let index = start;

  while (index < writer.source.length) {
    const ch = writer.source[index] ?? '';

    if (ch === '\n') {
      writer.parts.push(ch);

      return index + 1;
    }

    const shielded = pushShield(writer, index);

    if (shielded !== null) {
      index = shielded;

      continue;
    }

    writer.parts.push(ch);
    index += 1;
  }

  return index;
}

function readBlockComment(writer: Writer, start: number): number {
  let index = start;

  while (index < writer.source.length) {
    const ch = writer.source[index] ?? '';
    const next = writer.source[index + 1] ?? '';

    if (ch === '*' && next === '/') {
      writer.parts.push('*/');

      return index + 2;
    }

    const shielded = pushShield(writer, index);

    if (shielded !== null) {
      index = shielded;

      continue;
    }

    writer.parts.push(ch);
    index += 1;
  }

  return index;
}

function readRegex(writer: Writer, start: number): number {
  let index = start + 1;
  let inClass = false;

  writer.parts.push('/');

  while (index < writer.source.length) {
    const ch = writer.source[index] ?? '';

    if (ch === '\\') {
      index = pushEscape(writer, index);

      continue;
    }

    if (ch === '\n') {
      return index;
    }

    const shielded = pushShield(writer, index);

    if (shielded !== null) {
      index = shielded;

      continue;
    }

    if (ch === '[' && !inClass) {
      inClass = true;
      writer.parts.push(ch);
      index += 1;

      continue;
    }

    if (ch === ']' && inClass) {
      inClass = false;
      writer.parts.push(ch);
      index += 1;

      continue;
    }

    if (ch === '/' && !inClass) {
      writer.parts.push(ch);
      index += 1;

      while (/[a-z]/i.test(writer.source[index] ?? '')) {
        writer.parts.push(writer.source[index] ?? '');
        index += 1;
      }

      return index;
    }

    writer.parts.push(ch);
    index += 1;
  }

  return index;
}

function readJson(writer: Writer, start: number): void {
  let index = start;
  let inString = false;

  while (index < writer.source.length) {
    const ch = writer.source[index] ?? '';

    if (inString) {
      if (ch === '\\') {
        index = pushEscape(writer, index);

        continue;
      }

      if (ch === '"') {
        inString = false;
        writer.parts.push(ch);
        index += 1;

        continue;
      }

      const shielded = pushShield(writer, index);

      if (shielded !== null) {
        index = shielded;

        continue;
      }

      writer.parts.push(ch);
      index += 1;

      continue;
    }

    if (isScriptEnd(writer.source, index)) {
      finishScript(writer, index);

      return;
    }

    if (ch === '"') {
      inString = true;
    }

    writer.parts.push(ch);
    index += 1;
  }

  writer.next = index;
}

function finishScript(writer: Writer, index: number): void {
  const end = readEndTag(writer.source, index);

  writer.parts.push(writer.source.slice(index, end));
  writer.scriptEnded = true;
  writer.next = end;
}

function pushEscape(writer: Writer, index: number): number {
  writer.parts.push(writer.source[index] ?? '');

  if (writer.source[index + 1] === undefined) {
    return index + 1;
  }

  writer.parts.push(writer.source[index + 1] ?? '');

  return index + 2;
}

function pushShield(writer: Writer, index: number): number | null {
  if (!isScriptEnd(writer.source, index)) {
    return null;
  }

  writer.parts.push('<\\/', writer.source.slice(index + 2, index + 9));

  return index + 9;
}

function scriptKind(attrs: string): ScriptKind {
  const match = attrs.match(
    /\btype\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/i,
  );

  if (!match) {
    return 'js';
  }

  const mime = (match[1] ?? match[2] ?? match[3] ?? '')
    .split(';')[0]
    .trim()
    .toLowerCase();

  if (mime === '' || JS_SCRIPT_TYPES.has(mime)) {
    return 'js';
  }

  if (JSON_SCRIPT_TYPES.has(mime)) {
    return 'json';
  }

  return 'other';
}

function readOpenTag(
  source: string,
  index: number,
  name: string,
): { end: number; attrs: string } | null {
  const head = `<${name}`;

  if (source.slice(index, index + head.length).toLowerCase() !== head) {
    return null;
  }

  const boundary = source[index + head.length];

  if (boundary !== undefined && /[A-Za-z0-9-]/.test(boundary)) {
    return null;
  }

  const end = readTagEnd(source, index);

  if (end === null) {
    return null;
  }

  return { end, attrs: source.slice(index + head.length, end - 1) };
}

function readTagEnd(source: string, index: number): number | null {
  let quote: '"' | "'" | null = null;

  for (let cursor = index + 1; cursor < source.length; cursor += 1) {
    const ch = source[cursor];

    if (quote) {
      if (ch === quote) {
        quote = null;
      }

      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;

      continue;
    }

    if (ch === '>') {
      return cursor + 1;
    }
  }

  return null;
}

function findEndTag(source: string, from: number, name: string): number {
  const lowerName = name.toLowerCase();

  for (let cursor = from; cursor < source.length; cursor += 1) {
    if (!isScriptEndAt(source, cursor, lowerName)) {
      continue;
    }

    const end = source.indexOf('>', cursor);

    return end === -1 ? source.length : end + 1;
  }

  return source.length;
}

function readEndTag(source: string, index: number): number {
  const end = source.indexOf('>', index);

  return end === -1 ? source.length : end + 1;
}

function isScriptEnd(source: string, index: number): boolean {
  return isScriptEndAt(source, index, 'script');
}

function isScriptEndAt(source: string, index: number, name: string): boolean {
  if (source[index] !== '<' || source[index + 1] !== '/') {
    return false;
  }

  const tag = source.slice(index + 2, index + 2 + name.length);

  if (tag.toLowerCase() !== name) {
    return false;
  }

  const boundary = source[index + 2 + name.length];

  return boundary === undefined || /[\s>/]/.test(boundary);
}

function isTagStart(source: string, index: number): boolean {
  if (source[index] !== '<') {
    return false;
  }

  const next = source[index + 1];

  if (!next) {
    return false;
  }

  if (next === '/') {
    return /[A-Za-z]/.test(source[index + 2] ?? '');
  }

  if (next === '!') {
    return true;
  }

  return /[A-Za-z]/.test(next);
}

function isIdentifierStart(ch: string): boolean {
  return /[A-Za-z_$]/.test(ch);
}

function isIdentifierPart(ch: string): boolean {
  return /[A-Za-z0-9_$]/.test(ch);
}

function isNumberStart(ch: string, next: string): boolean {
  return /[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(next));
}
