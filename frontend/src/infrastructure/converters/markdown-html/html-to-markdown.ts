interface HtmlTextNode {
  type: 'text';
  value: string;
}

interface HtmlElementNode {
  type: 'element';
  tag: string;
  attrs: Record<string, string>;
  children: HtmlNode[];
}

type HtmlNode = HtmlTextNode | HtmlElementNode;

const VOID_TAGS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

/**
 * Преобразует HTML в Markdown
 *
 * @param input Исходный HTML
 */
export function htmlToMarkdown(input: string): string {
  const nodes = parseHtml(unwrapDocument(input));

  return normalizeMarkdown(nodes.map((node) => renderNode(node, 0)).join(''));
}

function unwrapDocument(input: string): string {
  const withoutComments = input.replace(/<!--[\s\S]*?-->/g, '');
  const body = withoutComments.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1];

  return body ?? withoutComments;
}

function parseHtml(input: string): HtmlNode[] {
  const root: HtmlElementNode = {
    type: 'element',
    tag: 'root',
    attrs: {},
    children: [],
  };
  const stack: HtmlElementNode[] = [root];
  let cursor = 0;

  while (cursor < input.length) {
    if (input.startsWith('<', cursor)) {
      const parsed = readTag(input, cursor);

      if (!parsed) {
        appendText(stack[stack.length - 1], input[cursor]);
        cursor += 1;

        continue;
      }

      cursor = parsed.next;

      if (parsed.kind === 'close') {
        closeTag(stack, parsed.tag);

        continue;
      }

      const element: HtmlElementNode = {
        type: 'element',
        tag: parsed.tag,
        attrs: parsed.attrs,
        children: [],
      };

      stack[stack.length - 1].children.push(element);

      if (parsed.tag === 'script' || parsed.tag === 'style') {
        const close = input.toLowerCase().indexOf(`</${parsed.tag}>`, cursor);

        cursor = close === -1 ? input.length : close + parsed.tag.length + 3;

        continue;
      }

      if (!parsed.selfClosing && !VOID_TAGS.has(parsed.tag)) {
        stack.push(element);
      }

      continue;
    }

    const nextTag = input.indexOf('<', cursor);
    const text = input.slice(cursor, nextTag === -1 ? input.length : nextTag);

    appendText(stack[stack.length - 1], decodeEntities(text));
    cursor += text.length;
  }

  return root.children;
}

function readTag(
  input: string,
  start: number,
):
  | {
      kind: 'open' | 'close';
      tag: string;
      attrs: Record<string, string>;
      selfClosing: boolean;
      next: number;
    }
  | undefined {
  const close = input.indexOf('>', start);

  if (close === -1) {
    return undefined;
  }

  const raw = input.slice(start + 1, close).trim();

  if (!raw || raw.startsWith('!') || raw.startsWith('?')) {
    return {
      kind: 'close',
      tag: '',
      attrs: {},
      selfClosing: true,
      next: close + 1,
    };
  }

  if (raw.startsWith('/')) {
    return {
      kind: 'close',
      tag: raw.slice(1).trim().split(/\s+/)[0]?.toLowerCase() ?? '',
      attrs: {},
      selfClosing: true,
      next: close + 1,
    };
  }

  const selfClosing = raw.endsWith('/');
  const body = selfClosing ? raw.slice(0, -1).trim() : raw;
  const match = body.match(/^([^\s/>]+)([\s\S]*)$/);

  if (!match) {
    return undefined;
  }

  return {
    kind: 'open',
    tag: match[1].toLowerCase(),
    attrs: parseAttrs(match[2] ?? ''),
    selfClosing,
    next: close + 1,
  };
}

function parseAttrs(source: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const pattern = /([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"']+)))?/g;
  let match: RegExpExecArray | null = pattern.exec(source);

  while (match) {
    attrs[match[1].toLowerCase()] = decodeEntities(
      match[2] ?? match[3] ?? match[4] ?? '',
    );
    match = pattern.exec(source);
  }

  return attrs;
}

function closeTag(stack: HtmlElementNode[], tag: string): void {
  if (!tag || stack.length === 1) {
    return;
  }

  for (let index = stack.length - 1; index > 0; index -= 1) {
    if (stack[index].tag === tag) {
      stack.length = index;

      return;
    }
  }
}

function appendText(parent: HtmlElementNode, value: string): void {
  if (!value) {
    return;
  }

  const last = parent.children[parent.children.length - 1];

  if (last?.type === 'text') {
    last.value += value;

    return;
  }

  parent.children.push({ type: 'text', value });
}

function renderNode(node: HtmlNode, listLevel: number): string {
  if (node.type === 'text') {
    return collapseText(node.value);
  }

  if (node.tag === 'script' || node.tag === 'style') {
    return '';
  }

  const inner = node.children
    .map((child) => renderNode(child, listLevel))
    .join('');

  switch (node.tag) {
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6':
      return `\n\n${'#'.repeat(Number(node.tag[1]))} ${inner.trim()}\n\n`;
    case 'p':
      return `\n\n${inner.trim()}\n\n`;
    case 'br':
      return '  \n';
    case 'hr':
      return '\n\n---\n\n';
    case 'strong':
    case 'b':
      return inner ? `**${inner}**` : '';
    case 'em':
    case 'i':
      return inner ? `*${inner}*` : '';
    case 'del':
    case 's':
    case 'strike':
      return inner ? `~~${inner}~~` : '';
    case 'code':
      return inner ? `\`${inner}\`` : '';
    case 'pre':
      return `\n\n\`\`\`\n${codeText(node).replace(/\n$/, '')}\n\`\`\`\n\n`;

    case 'a': {
      const href = node.attrs.href ?? '';

      return href ? `[${inner.trim() || href}](${href})` : inner;
    }

    case 'img': {
      const src = node.attrs.src ?? '';
      const alt = node.attrs.alt ?? '';

      return src ? `![${alt}](${src})` : '';
    }

    case 'blockquote':
      return `\n\n${inner
        .trim()
        .split('\n')
        .map((line) => `> ${line}`)
        .join('\n')}\n\n`;
    case 'ul':
      return `\n\n${renderList(node, false, listLevel)}\n\n`;
    case 'ol':
      return `\n\n${renderList(node, true, listLevel)}\n\n`;
    case 'li':
      return inner.trim();
    case 'table':
      return `\n\n${renderTable(node)}\n\n`;
    case 'div':
    case 'section':
    case 'article':
    case 'main':
    case 'header':
    case 'footer':
      return `\n\n${inner.trim()}\n\n`;
    default:
      return inner;
  }
}

function renderList(
  node: HtmlElementNode,
  ordered: boolean,
  listLevel: number,
): string {
  const items = node.children.filter(
    (child): child is HtmlElementNode =>
      child.type === 'element' && child.tag === 'li',
  );

  return items
    .map((item, index) => {
      const indent = '  '.repeat(listLevel);
      const marker = ordered ? `${index + 1}.` : '-';
      const content = renderNode(item, listLevel + 1).trim();
      const [first, ...rest] = content.split('\n');

      return [
        `${indent}${marker} ${first}`,
        ...rest.map((line) => (line.trim() ? `${indent}  ${line.trim()}` : '')),
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');
}

function renderTable(node: HtmlElementNode): string {
  const rows = collectTags(node, 'tr');

  if (!rows.length) {
    return '';
  }

  const printed = rows.map((row) => {
    const cells = row.children.filter(
      (child): child is HtmlElementNode =>
        child.type === 'element' && (child.tag === 'th' || child.tag === 'td'),
    );

    return `| ${cells
      .map((cell) => renderNode(cell, 0).replace(/\n+/g, ' ').trim())
      .join(' | ')} |`;
  });

  const header = rows[0].children.some(
    (child) => child.type === 'element' && child.tag === 'th',
  );

  if (header) {
    const count = (printed[0].match(/\|/g) ?? []).length - 1;

    printed.splice(
      1,
      0,
      `| ${Array.from({ length: count }, () => '---').join(' | ')} |`,
    );
  }

  return printed.join('\n');
}

function collectTags(node: HtmlElementNode, tag: string): HtmlElementNode[] {
  const found: HtmlElementNode[] = [];

  const walk = (current: HtmlNode) => {
    if (current.type !== 'element') {
      return;
    }

    if (current.tag === tag) {
      found.push(current);

      return;
    }

    current.children.forEach(walk);
  };

  node.children.forEach(walk);

  return found;
}

function codeText(node: HtmlElementNode): string {
  return node.children
    .map((child) => {
      if (child.type === 'text') {
        return child.value;
      }

      if (child.tag === 'code' || child.tag === 'span') {
        return codeText(child);
      }

      return renderNode(child, 0);
    })
    .join('');
}

function collapseText(value: string): string {
  return value.replace(/\s+/g, ' ');
}

function normalizeMarkdown(value: string): string {
  return value
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_all, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_all, dec: string) =>
      String.fromCodePoint(Number.parseInt(dec, 10)),
    );
}
