import { describe, expect, it } from 'vitest';

import { MarkdownJiraConverter } from './markdown-jira.converter';
import { markdownToJira } from './markdown-to-jira';

const converter = new MarkdownJiraConverter();

describe('markdownToJira', () => {
  it('converts headings, emphasis, links and code', () => {
    const input = [
      '# Title',
      '',
      'This is **bold**, *italic*, ~~gone~~ and `code`.',
      '',
      '[Docs](https://example.com)',
    ].join('\n');

    expect(markdownToJira(input)).toBe(
      [
        'h1. Title',
        '',
        'This is *bold*, _italic_, -gone- and {{code}}.',
        '',
        '[Docs|https://example.com]',
      ].join('\n'),
    );
  });

  it('converts lists, quotes, fences and tables', () => {
    const input = [
      '- one',
      '  - nested',
      '1. first',
      '',
      '> quoted line',
      '',
      '```js',
      'const n = 1;',
      '```',
      '',
      '| A | B |',
      '| --- | --- |',
      '| 1 | **2** |',
    ].join('\n');

    expect(markdownToJira(input)).toBe(
      [
        '* one',
        '** nested',
        '# first',
        '',
        '{quote}',
        'quoted line',
        '{quote}',
        '',
        '{code:js}',
        'const n = 1;',
        '{code}',
        '',
        '||A||B||',
        '|1|*2*|',
      ].join('\n'),
    );
  });
});

describe('MarkdownJiraConverter', () => {
  it('rejects empty input', () => {
    const result = converter.convert('  ', {});

    expect(result.ok).toBe(false);
  });

  it('converts markdown to jira markup', () => {
    const result = converter.convert('## Hello', {});

    expect(result).toEqual({ ok: true, value: 'h2. Hello' });
  });
});
