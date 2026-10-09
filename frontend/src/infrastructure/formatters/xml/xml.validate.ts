/**
 * Проверяет, что текст является одним корректным XML-документом
 *
 * @param source Исходный XML без краевых пробелов
 */
export function xmlError(source: string): string | null {
  const parser = new XmlParser(source);

  return parser.parse();
}

class XmlParser {
  private readonly source: string;
  private index = 0;
  private line = 1;
  private column = 1;
  private readonly stack: string[] = [];
  private rooted = false;

  constructor(source: string) {
    this.source = source;
  }

  parse(): string | null {
    while (this.index < this.source.length) {
      if (this.source[this.index] !== '<') {
        if (this.stack.length === 0 && !this.isSpace()) {
          return this.fail(
            this.rooted
              ? 'Junk after the root element'
              : 'Junk before the root element',
          );
        }

        this.bump();

        continue;
      }

      const error = this.readMarkup();

      if (error) {
        return error;
      }
    }

    const open = this.stack.at(-1);

    if (open) {
      return this.fail(`Unclosed element ${open}`);
    }

    if (!this.rooted) {
      return this.fail('Document has no root element');
    }

    return null;
  }

  private readMarkup(): string | null {
    const startLine = this.line;
    const startColumn = this.column;

    if (this.startsWith('<!--')) {
      return this.skipUntil('-->', 'Unclosed comment', startLine, startColumn);
    }

    if (this.startsWith('<![CDATA[')) {
      return this.skipUntil(']]>', 'Unclosed CDATA', startLine, startColumn);
    }

    if (this.startsWith('<?')) {
      return this.skipUntil(
        '?>',
        'Unclosed declaration',
        startLine,
        startColumn,
      );
    }

    if (this.startsWith('<!')) {
      return this.skipDoctype(startLine, startColumn);
    }

    if (this.startsWith('</')) {
      return this.readEndTag(startLine, startColumn);
    }

    return this.readStartTag(startLine, startColumn);
  }

  private readStartTag(startLine: number, startColumn: number): string | null {
    this.bump();

    const name = this.readName();

    if (!name) {
      return this.fail('Invalid element name', startLine, startColumn);
    }

    const attributes = this.readAttributes();

    if (attributes) {
      return attributes;
    }

    const selfClosing = this.source[this.index] === '/';

    if (selfClosing) {
      this.bump();
    }

    if (this.source[this.index] !== '>') {
      return this.fail('Element is not closed', startLine, startColumn);
    }

    this.bump();

    if (this.stack.length === 0) {
      if (this.rooted) {
        return this.fail(
          'Document has more than one root element',
          startLine,
          startColumn,
        );
      }

      this.rooted = true;
    }

    if (!selfClosing) {
      this.stack.push(name);
    }

    return null;
  }

  private readEndTag(startLine: number, startColumn: number): string | null {
    this.bump();
    this.bump();

    const name = this.readName();

    if (!name) {
      return this.fail('Invalid closing tag', startLine, startColumn);
    }

    this.skipSpaces();

    if (this.source[this.index] !== '>') {
      return this.fail('Closing tag is not closed', startLine, startColumn);
    }

    this.bump();

    const open = this.stack.pop();

    if (!open) {
      return this.fail(
        `Unexpected closing tag ${name}`,
        startLine,
        startColumn,
      );
    }

    if (open !== name) {
      return this.fail(
        `Closing tag ${name} does not match ${open}`,
        startLine,
        startColumn,
      );
    }

    return null;
  }

  private readAttributes(): string | null {
    while (this.index < this.source.length) {
      this.skipSpaces();

      const next = this.source[this.index];

      if (next === '>' || next === '/' || next === undefined) {
        return null;
      }

      const nameLine = this.line;
      const nameColumn = this.column;
      const name = this.readName();

      if (!name) {
        return this.fail('Invalid attribute name', nameLine, nameColumn);
      }

      this.skipSpaces();

      if (this.source[this.index] !== '=') {
        return this.fail(
          `Attribute ${name} has no value`,
          nameLine,
          nameColumn,
        );
      }

      this.bump();
      this.skipSpaces();

      const quote = this.source[this.index];

      if (quote !== '"' && quote !== "'") {
        return this.fail(
          `Attribute ${name} must be quoted`,
          nameLine,
          nameColumn,
        );
      }

      this.bump();

      while (
        this.index < this.source.length &&
        this.source[this.index] !== quote
      ) {
        this.bump();
      }

      if (this.source[this.index] !== quote) {
        return this.fail(
          `Attribute ${name} is not closed`,
          nameLine,
          nameColumn,
        );
      }

      this.bump();
    }

    return this.fail('Element is not closed');
  }

  private skipDoctype(startLine: number, startColumn: number): string | null {
    let depth = 0;

    while (this.index < this.source.length) {
      const char = this.source[this.index];

      if (char === '[') {
        depth += 1;
      }

      if (char === ']') {
        depth -= 1;
      }

      this.bump();

      if (char === '>' && depth <= 0) {
        return null;
      }
    }

    return this.fail('Unclosed declaration', startLine, startColumn);
  }

  private skipUntil(
    marker: string,
    message: string,
    startLine: number,
    startColumn: number,
  ): string | null {
    const end = this.source.indexOf(marker, this.index + marker.length);

    if (end === -1) {
      return this.fail(message, startLine, startColumn);
    }

    while (this.index < end + marker.length) {
      this.bump();
    }

    return null;
  }

  private readName(): string {
    const start = this.index;

    if (!this.isNameStart(this.source[this.index] ?? '')) {
      return '';
    }

    this.bump();

    while (this.isNamePart(this.source[this.index] ?? '')) {
      this.bump();
    }

    return this.source.slice(start, this.index);
  }

  private skipSpaces(): void {
    while (this.isSpace()) {
      this.bump();
    }
  }

  private startsWith(text: string): boolean {
    return this.source.startsWith(text, this.index);
  }

  private isSpace(): boolean {
    const char = this.source[this.index];

    return char === ' ' || char === '\n' || char === '\r' || char === '\t';
  }

  private isNameStart(char: string): boolean {
    return /[A-Za-z_:]/.test(char);
  }

  private isNamePart(char: string): boolean {
    return /[A-Za-z0-9_:.-]/.test(char);
  }

  private bump(): void {
    if (this.source[this.index] === '\n') {
      this.line += 1;
      this.column = 1;
    } else {
      this.column += 1;
    }

    this.index += 1;
  }

  private fail(
    message: string,
    line = this.line,
    column = this.column,
  ): string {
    return `Invalid XML: ${message} at line ${line}, column ${column}`;
  }
}
