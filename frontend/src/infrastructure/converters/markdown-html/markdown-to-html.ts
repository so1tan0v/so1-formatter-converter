/**
 * Преобразует Markdown в HTML
 *
 * @param input Исходный Markdown-текст
 */
export function markdownToHtml(input: string): string {
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
      output.push('<hr />');
      index += 1;

      continue;
    }

    const heading = readHeading(line, lines[index + 1]);

    if (heading) {
      output.push(
        `<h${heading.level}>${convertInlines(heading.text)}</h${heading.level}>`,
      );
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

    if (!line.trim()) {
      index += 1;

      continue;
    }

    const paragraph: string[] = [convertInlines(line)];

    index += 1;

    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^\s*```/.test(lines[index]) &&
      !isListItem(lines[index]) &&
      !/^\s*>/.test(lines[index]) &&
      !isHorizontalRule(lines[index]) &&
      !readHeading(lines[index], lines[index + 1]) &&
      !(isTableRow(lines[index]) && isTableRow(lines[index + 1] ?? ''))
    ) {
      paragraph.push(convertInlines(lines[index]));
      index += 1;
    }

    output.push(`<p>${paragraph.join('<br />\n')}</p>`);
  }

  return output.join('\n');
}

function readFence(
  lines: string[],
  start: number,
): { block: string; next: number } {
  const marker = lines[start].match(/^\s*```\s*([^\s`]+)?\s*$/);
  const lang = marker?.[1]?.toLowerCase();
  const body: string[] = [];
  let index = start + 1;

  while (index < lines.length && !/^\s*```/.test(lines[index])) {
    body.push(escapeHtml(lines[index]));
    index += 1;
  }

  const className = lang ? ` class="language-${escapeHtml(lang)}"` : '';

  return {
    block: `<pre><code${className}>${body.join('\n')}</code></pre>`,
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
  const hasHeader = Boolean(separator && isSeparatorRow(separator));
  const headCells = splitCells(hasHeader ? header : '');
  const bodyRows = hasHeader ? body : rows;
  const thead = hasHeader
    ? `<thead><tr>${headCells.map((cell) => `<th>${convertInlines(cell)}</th>`).join('')}</tr></thead>`
    : '';
  const tbody = `<tbody>${bodyRows
    .map(
      (row) =>
        `<tr>${splitCells(row)
          .map((cell) => `<td>${convertInlines(cell)}</td>`)
          .join('')}</tr>`,
    )
    .join('')}</tbody>`;

  return { block: `<table>${thead}${tbody}</table>`, next: index };
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
    block: `<blockquote>${body.join('<br />\n')}</blockquote>`,
    next: index,
  };
}

function readList(
  lines: string[],
  start: number,
): { block: string; next: number } {
  type Item = { ordered: boolean; level: number; html: string };

  const items: Item[] = [];
  let index = start;

  while (index < lines.length && isListItem(lines[index])) {
    const match = lines[index].match(/^(\s*)([-*+]|\d+[.)])\s+(.*)$/);

    if (!match) {
      break;
    }

    const indent = match[1].replace(/\t/g, '  ').length;
    const level = Math.max(1, Math.floor(indent / 2) + 1);

    items.push({
      ordered: /^\d+[.)]$/.test(match[2]),
      level,
      html: convertInlines(match[3]),
    });
    index += 1;
  }

  return { block: printList(items), next: index };
}

function printList(items: ItemLike[]): string {
  if (!items.length) {
    return '';
  }

  const ordered = items[0].ordered;
  const tag = ordered ? 'ol' : 'ul';
  const parts: string[] = [`<${tag}>`];
  let cursor = 0;

  while (cursor < items.length) {
    const current = items[cursor];
    let nestedEnd = cursor + 1;

    while (nestedEnd < items.length && items[nestedEnd].level > current.level) {
      nestedEnd += 1;
    }

    const nested = printList(items.slice(cursor + 1, nestedEnd));

    parts.push(`<li>${current.html}${nested}</li>`);
    cursor = nestedEnd;
  }

  parts.push(`</${tag}>`);

  return parts.join('');
}

interface ItemLike {
  ordered: boolean;
  level: number;
  html: string;
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

  let next = text;

  next = next.replace(/`([^`]+)`/g, (_all, code: string) =>
    stash(`<code>${escapeHtml(code)}</code>`),
  );
  next = next.replace(
    /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
    (_all, alt: string, url: string) =>
      stash(
        `<img src="${escapeHtml(safeUrl(url))}" alt="${escapeHtml(alt)}" />`,
      ),
  );
  next = next.replace(
    /\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
    (_all, label: string, url: string) =>
      stash(`<a href="${escapeHtml(safeUrl(url))}">${escapeHtml(label)}</a>`),
  );

  next = escapeHtml(next);
  next = next.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  next = next.replace(/__(.+?)__/g, '<strong>$1</strong>');
  next = next.replace(/~~(.+?)~~/g, '<del>$1</del>');
  next = next.replace(/\*(.+?)\*/g, '<em>$1</em>');

  return next.replace(
    /\0(\d+)\0/g,
    (_all, index: string) => slots[Number(index)],
  );
}

function splitCells(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function safeUrl(value: string): string {
  const url = value.trim();

  if (!url || /[\u0000-\u001F\u007F\s]/.test(url)) {
    return '#';
  }

  if (url.startsWith('#')) {
    return url;
  }

  if (isSameDocumentPath(url)) {
    return url;
  }

  try {
    const parsed = new URL(url);

    if (
      parsed.protocol === 'http:' ||
      parsed.protocol === 'https:' ||
      parsed.protocol === 'mailto:'
    ) {
      return url;
    }
  } catch {
    return '#';
  }

  return '#';
}

function isSameDocumentPath(url: string): boolean {
  return url.startsWith('/') && !url.startsWith('//') && !url.includes('\\');
}
