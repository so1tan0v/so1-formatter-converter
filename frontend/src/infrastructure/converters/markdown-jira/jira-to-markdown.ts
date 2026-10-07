/**
 * Преобразует разметку Jira в Markdown
 *
 * @param input Исходный текст в разметке Jira
 */
export function jiraToMarkdown(input: string): string {
  const lines = input.replace(/\r\n/g, '\n').split('\n');
  const output: string[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (isCodeOpen(line)) {
      const { block, next } = readCode(lines, index);

      output.push(block);
      index = next;

      continue;
    }

    if (isNamedBlockOpen(line, 'quote')) {
      const { block, next } = readNamedBlock(lines, index, 'quote', (body) =>
        body.map((item) => `> ${convertInlines(item)}`).join('\n'),
      );

      output.push(block);
      index = next;

      continue;
    }

    if (isNamedBlockOpen(line, 'noformat')) {
      const { block, next } = readNamedBlock(lines, index, 'noformat', (body) =>
        ['```', ...body, '```'].join('\n'),
      );

      output.push(block);
      index = next;

      continue;
    }

    if (isHorizontalRule(line)) {
      output.push('---');
      index += 1;

      continue;
    }

    if (isTableRow(line)) {
      const { block, next } = readTable(lines, index);

      output.push(block);
      index = next;

      continue;
    }

    const heading = line.match(/^h([1-6])\.\s+(.*)$/i);

    if (heading) {
      output.push(
        `${'#'.repeat(Number(heading[1]))} ${convertInlines(heading[2])}`,
      );
      index += 1;

      continue;
    }

    if (isListItem(line)) {
      const { block, next } = readList(lines, index);

      output.push(block);
      index = next;

      continue;
    }

    output.push(convertInlines(line));
    index += 1;
  }

  return trimExtraBlankLines(output.join('\n'));
}

function readCode(
  lines: string[],
  start: number,
): { block: string; next: number } {
  const lang = readCodeLanguage(lines[start]);
  const body: string[] = [];
  let index = start + 1;

  while (index < lines.length && !isCodeClose(lines[index])) {
    body.push(lines[index]);
    index += 1;
  }

  const open = lang ? `\`\`\`${lang}` : '```';

  return {
    block: [open, ...body, '```'].join('\n'),
    next: Math.min(index + 1, lines.length),
  };
}

function readNamedBlock(
  lines: string[],
  start: number,
  name: string,
  print: (body: string[]) => string,
): { block: string; next: number } {
  const body: string[] = [];
  let index = start + 1;

  while (index < lines.length && !isNamedBlockClose(lines[index], name)) {
    body.push(lines[index]);
    index += 1;
  }

  return {
    block: print(body),
    next: Math.min(index + 1, lines.length),
  };
}

function readTable(
  lines: string[],
  start: number,
): { block: string; next: number } {
  const rows: string[] = [];
  let index = start;

  while (index < lines.length && isTableRow(lines[index])) {
    rows.push(lines[index]);
    index += 1;
  }

  const markdownRows = rows.map((row, rowIndex) => {
    const header = row.trimStart().startsWith('||');
    const cells = splitJiraCells(row).map((cell) => convertInlines(cell));
    const printed = `| ${cells.join(' | ')} |`;

    if (header && rowIndex === 0) {
      const separator = `| ${cells.map(() => '---').join(' | ')} |`;

      return `${printed}\n${separator}`;
    }

    return printed;
  });

  return { block: markdownRows.join('\n'), next: index };
}

function readList(
  lines: string[],
  start: number,
): { block: string; next: number } {
  const items: string[] = [];
  let index = start;

  while (index < lines.length && isListItem(lines[index])) {
    const match = lines[index].match(/^([*#]+)\s+(.*)$/);

    if (!match) {
      break;
    }

    const level = match[1].length;
    const ordered = match[1].includes('#');
    const indent = '  '.repeat(level - 1);
    const marker = ordered ? '1.' : '-';

    items.push(`${indent}${marker} ${convertInlines(match[2])}`);
    index += 1;
  }

  return { block: items.join('\n'), next: index };
}

function convertInlines(text: string): string {
  const slots: string[] = [];

  const stash = (value: string): string => {
    slots.push(value);

    return `\0${slots.length - 1}\0`;
  };

  let next = text.replace(/\{\{([^}]+)\}\}/g, (_all, code: string) =>
    stash(`\`${code}\``),
  );

  next = next.replace(
    /!([^|\n!]+)(?:\|([^!]*))?!/g,
    (_all, url: string, options: string | undefined) => {
      const alt = options?.match(/(?:^|\|)alt=([^|]*)/i)?.[1] ?? '';

      return stash(`![${alt}](${url})`);
    },
  );

  next = next.replace(/\[([^\]\n]+)]/g, (_all, body: string) => {
    const [label, url] = splitLink(body);

    if (!url) {
      return stash(`[${label}](${label})`);
    }

    return stash(`[${label}](${url})`);
  });

  next = next.replace(/\*([^*\n]+)\*/g, (_all, value: string) =>
    stash(`**${value}**`),
  );
  next = next.replace(/_([^_\n]+)_/g, '*$1*');
  next = next.replace(/-([^\-\n]+)-/g, '~~$1~~');
  next = next.replace(/\+([^+]+)\+/g, '$1');

  return next.replace(
    /\0(\d+)\0/g,
    (_all, index: string) => slots[Number(index)],
  );
}

function splitLink(body: string): [string, string | undefined] {
  const parts = body.split('|');

  if (parts.length === 1) {
    return [parts[0], undefined];
  }

  return [parts[0], parts[1]];
}

function isCodeOpen(line: string): boolean {
  return /^\s*\{code(?::[^}]*)?\}\s*$/i.test(line);
}

function isCodeClose(line: string): boolean {
  return /^\s*\{code\}\s*$/i.test(line);
}

function readCodeLanguage(line: string): string | undefined {
  const match = line.match(/^\s*\{code(?::([^}]*))?\}\s*$/i);
  const spec = match?.[1]?.trim();

  if (!spec) {
    return undefined;
  }

  const named = spec.match(/(?:^|\|)language=([^\s|]+)/i)?.[1];
  const lang = (named ?? spec).trim();

  if (!lang || lang.includes('=')) {
    return undefined;
  }

  return lang.toLowerCase();
}

function isNamedBlockOpen(line: string, name: string): boolean {
  return new RegExp(`^\\s*\\{${name}\\}\\s*$`, 'i').test(line);
}

function isNamedBlockClose(line: string, name: string): boolean {
  return isNamedBlockOpen(line, name);
}

function isListItem(line: string): boolean {
  return /^[*#]+\s+\S/.test(line);
}

function isTableRow(line: string): boolean {
  return /^\s*\|.+\|\s*$/.test(line);
}

function isHorizontalRule(line: string): boolean {
  return /^\s*-{4,}\s*$/.test(line);
}

function splitJiraCells(line: string): string[] {
  const header = line.trimStart().startsWith('||');
  const glue = header ? '||' : '|';
  const trimmed = line
    .trim()
    .replace(/^\|{1,2}/, '')
    .replace(/\|{1,2}$/, '');

  return trimmed.split(glue).map((cell) => cell.trim());
}

function trimExtraBlankLines(value: string): string {
  return value.replace(/\n{3,}/g, '\n\n').replace(/^\n+|\n+$/g, '');
}
