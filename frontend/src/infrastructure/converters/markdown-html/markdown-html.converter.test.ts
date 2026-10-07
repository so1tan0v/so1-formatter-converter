/**
 * Imports from packages
 */
import { describe, expect, it } from 'vitest';

/**
 * Imports from relative
 */
import { htmlToMarkdown } from './html-to-markdown';
import { markdownToHtml } from './markdown-to-html';

describe('markdownToHtml', () => {
  it('renders headings, emphasis and links', () => {
    const html = markdownToHtml(
      '# Title\n\nThis is **bold**, *italic* and [Docs](https://example.com).',
    );

    expect(html).toContain('<h1>Title</h1>');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<em>italic</em>');
    expect(html).toContain('<a href="https://example.com">Docs</a>');
  });

  it('drops unsafe link targets', () => {
    const html = markdownToHtml(
      [
        '[ok](https://example.com)',
        '[mail](mailto:dev@example.com)',
        '[local](/docs)',
        '[anchor](#section)',
        '[js](javascript:alert(1))',
        '[proto](//evil.example)',
        '[quote](https://example.com"onclick="alert(1))',
        '<img src=x onerror=alert(1)>',
      ].join('\n\n'),
    );

    expect(html).toContain('<a href="https://example.com">ok</a>');
    expect(html).toContain('<a href="mailto:dev@example.com">mail</a>');
    expect(html).toContain('<a href="/docs">local</a>');
    expect(html).toContain('<a href="#section">anchor</a>');
    expect(html).toContain('<a href="#">js</a>');
    expect(html).toContain('<a href="#">proto</a>');
    expect(html).toContain(
      'href="https://example.com&quot;onclick=&quot;alert(1"',
    );
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).not.toMatch(/<a\s[^>]*\son[a-z]+=/i);
    expect(html).not.toMatch(/<img\s/i);
  });

  it('renders fenced code with a spaced language marker', () => {
    const html = markdownToHtml(['``` SQL', 'select 1;', '```'].join('\n'));

    expect(html).toBe('<pre><code class="language-sql">select 1;</code></pre>');
  });
});

describe('htmlToMarkdown', () => {
  it('converts common tags back to markdown', () => {
    const markdown = htmlToMarkdown(
      '<h1>Title</h1><p>This is <strong>bold</strong> and <em>italic</em>.</p><p><a href="https://example.com">Docs</a></p>',
    );

    expect(markdown).toContain('# Title');
    expect(markdown).toContain('**bold**');
    expect(markdown).toContain('*italic*');
    expect(markdown).toContain('[Docs](https://example.com)');
  });
});
