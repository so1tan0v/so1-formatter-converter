/**
 * Imports from packages
 */
import { describe, expect, it } from 'vitest';

/**
 * Imports from relative
 */
import { JiraMarkdownConverter } from './jira-markdown.converter';
import { jiraToMarkdown } from './jira-to-markdown';
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
        'bq. quoted line',
        '',
        '{code:js}',
        'const n = 1;',
        '{code}',
        '|| A || B ||',
        '| 1 | *2* |',
      ].join('\n'),
    );
  });
});

describe('MarkdownJiraConverter', () => {
  it('rejects empty input', () => {
    const result = converter.convert('  ');

    expect(result.ok).toBe(false);
  });

  it('converts markdown to jira markup', () => {
    const result = converter.convert('## Hello');

    expect(result).toEqual({ ok: true, value: 'h2. Hello' });
  });
});

describe('markdown fences', () => {
  it('keeps language when a space separates the marker', () => {
    const input = ['``` sql', 'select 1;', '```'].join('\n');

    expect(markdownToJira(input)).toBe('{code:sql}\nselect 1;\n{code}');
  });

  it('normalizes fence language case', () => {
    const input = ['``` SQL', 'select 1;', '```'].join('\n');

    expect(markdownToJira(input)).toBe('{code:sql}\nselect 1;\n{code}');
  });
});

describe('jiraToMarkdown', () => {
  it('converts headings, emphasis, links and code back to markdown', () => {
    const input = [
      'h1. Title',
      '',
      'This is *bold*, _italic_, -gone- and {{code}}.',
      '',
      '[Docs|https://example.com]',
    ].join('\n');

    expect(jiraToMarkdown(input)).toBe(
      [
        '# Title',
        '',
        'This is **bold**, *italic*, ~~gone~~ and `code`.',
        '',
        '[Docs](https://example.com)',
      ].join('\n'),
    );
  });

  it('converts jira code blocks to markdown fences', () => {
    const input = ['{code:SQL}', 'select 1;', '{code}'].join('\n');

    expect(jiraToMarkdown(input)).toBe('```sql\nselect 1;\n```');
  });
});

describe('JiraMarkdownConverter', () => {
  it('converts jira markup to markdown', () => {
    const converter = new JiraMarkdownConverter();
    const result = converter.convert('h2. Hello');

    expect(result).toEqual({ ok: true, value: '## Hello' });
  });
});
