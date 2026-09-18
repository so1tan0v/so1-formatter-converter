/**
 * Преобразует Markdown в разметку Jira
 *
 * @param input Исходный Markdown-текст
 */
export function markdownToJira(input: string): string {
  const lines = input.replace(/\r\n/g, '\n').split('\n');
  const output: string[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (/^\s*```/.test(line)) {
      const { block, next } = readFence(lines, index);

      output.push(block);
      index = next;

      continue;
    }

    if (isTableRow(line) && isTableRow(lines[index + 1] ?? '')) {
      const { block, next } = readTable(lines, index);

      output.push(block);
      index = next;

      continue;
    }

    if (isHorizontalRule(line)) {
      output.push('----');
      index += 1;

      continue;
    }

    const heading = readHeading(line, lines[index + 1]);

    if (heading) {
      output.push(`h${heading.level}. ${convertInlines(heading.text)}`);
      index += heading.consumed;

      continue;
    }

    if (/^\s*>/.test(line)) {
      const { block, next } = readQuote(lines, index);

      output.push(block);
      index = next;

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

function readFence(
  lines: string[],
  start: number,
): { block: string; next: number } {
  const marker = lines[start].match(/^\s*```(\w+)?\s*$/);
  const lang = marker?.[1];
  const body: string[] = [];
  let index = start + 1;

  while (index < lines.length && !/^\s*```/.test(lines[index])) {
    body.push(lines[index]);
    index += 1;
  }

  const header = lang ? `{code:${lang}}` : '{code}';

  return {
    block: [header, ...body, '{code}'].join('\n'),
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

  const [header, separator, ...body] = rows;
  const printed: string[] = [];

  if (separator && isSeparatorRow(separator)) {
    printed.push(toJiraRow(header, true));
    printed.push(...body.map((row) => toJiraRow(row, false)));
  } else {
    printed.push(...rows.map((row) => toJiraRow(row, false)));
  }

  return { block: printed.join('\n'), next: index };
}

function readQuote(
  lines: string[],
  start: number,
): { block: string; next: number } {
  const body: string[] = [];
  let index = start;

  while (index < lines.length && /^\s*>/.test(lines[index])) {
    body.push(convertInlines(lines[index].replace(/^\s*>\s?/, '')));
    index += 1;
  }

  return {
    block: ['{quote}', ...body, '{quote}'].join('\n'),
    next: index,
  };
}

function readList(
  lines: string[],
  start: number,
): { block: string; next: number } {
  const items: string[] = [];
  let index = start;

  while (index < lines.length && isListItem(lines[index])) {
    const match = lines[index].match(/^(\s*)([-*+]|\d+[.)])\s+(.*)$/);

    if (!match) {
      break;
    }

    const indent = match[1].replace(/\t/g, '  ').length;
    const level = Math.max(1, Math.floor(indent / 2) + 1);
    const ordered = /^\d+[.)]$/.test(match[2]);
    const marker = (ordered ? '#' : '*').repeat(level);

    items.push(`${marker} ${convertInlines(match[3])}`);
    index += 1;
  }

  return { block: items.join('\n'), next: index };
}

function readHeading(
  line: string,
  nextLine: string | undefined,
): { level: number; text: string; consumed: number } | undefined {
  const atx = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);

  if (atx) {
    return { level: atx[1].length, text: atx[2], consumed: 1 };
  }

  if (nextLine && /^=+\s*$/.test(nextLine) && line.trim()) {
    return { level: 1, text: line.trim(), consumed: 2 };
  }

  if (
    nextLine &&
    /^-+\s*$/.test(nextLine) &&
    line.trim() &&
    !isTableRow(line)
  ) {
    return { level: 2, text: line.trim(), consumed: 2 };
  }

  return undefined;
}

function convertInlines(text: string): string {
  const slots: string[] = [];

  const stash = (value: string): string => {
    slots.push(value);

    return `\0${slots.length - 1}\0`;
  };

  let next = text.replace(/`([^`]+)`/g, (_all, code: string) =>
    stash(`{{${code}}}`),
  );

  next = next.replace(
    /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
    (_all, alt: string, url: string) =>
      stash(alt ? `!${url}|alt=${alt}!` : `!${url}!`),
  );

  next = next.replace(
    /\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
    (_all, label: string, url: string) => stash(`[${label}|${url}]`),
  );

  next = next.replace(/\*\*(.+?)\*\*/g, (_all, text: string) =>
    stash(`*${text}*`),
  );
  next = next.replace(/__(.+?)__/g, (_all, text: string) => stash(`*${text}*`));
  next = next.replace(/~~(.+?)~~/g, (_all, text: string) => stash(`-${text}-`));
  next = next.replace(/\*(.+?)\*/g, '_$1_');

  return next.replace(
    /\0(\d+)\0/g,
    (_all, index: string) => slots[Number(index)],
  );
}

function isListItem(line: string): boolean {
  return /^\s*(?:[-*+]|\d+[.)])\s+\S/.test(line);
}

function isTableRow(line: string): boolean {
  return /^\s*\|.+\|\s*$/.test(line);
}

function isSeparatorRow(line: string): boolean {
  return /^\s*\|?(?:\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?\s*$/.test(line);
}

function isHorizontalRule(line: string): boolean {
  return /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line);
}

function toJiraRow(line: string, header: boolean): string {
  const cells = line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => convertInlines(cell.trim()));
  const glue = header ? '||' : '|';

  return `${glue}${cells.join(glue)}${glue}`;
}

function trimExtraBlankLines(value: string): string {
  return value.replace(/\n{3,}/g, '\n\n').replace(/^\n+|\n+$/g, '');
}
