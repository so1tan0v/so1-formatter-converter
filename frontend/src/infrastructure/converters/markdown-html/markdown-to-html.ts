/**
 * Imports from packages
 */
import { Marked } from 'marked';

const parser = new Marked({
  gfm: true,
  renderer: {
    html({ text }) {
      return escapeHtml(text);
    },
    link({ href, text }) {
      return `<a href="${escapeHtml(safeUrl(href))}">${escapeHtml(text)}</a>`;
    },
    image({ href, text }) {
      return `<img src="${escapeHtml(safeUrl(href))}" alt="${escapeHtml(text)}" />`;
    },
    code({ text, lang }) {
      const language = lang?.trim().toLowerCase();
      const className = language
        ? ` class="language-${escapeHtml(language)}"`
        : '';
      const body = text.replace(/\n$/, '');

      return `<pre><code${className}>${escapeHtml(body)}</code></pre>`;
    },
  },
});

/**
 * Преобразует Markdown в HTML
 *
 * @param input Исходный Markdown-текст
 */
export function markdownToHtml(input: string): string {
  const html = parser.parse(input.replace(/\r\n/g, '\n'), { async: false });

  return html.trim();
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

  if (!url || /\s/.test(url) || hasAsciiControl(url)) {
    return '#';
  }

  if (url.startsWith('#')) {
    return url;
  }

  if (url.startsWith('/') && !url.startsWith('//') && !url.includes('\\')) {
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

function hasAsciiControl(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);

    if (code <= 31 || code === 127) {
      return true;
    }
  }

  return false;
}
