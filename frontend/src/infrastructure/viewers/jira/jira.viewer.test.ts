/**
 * Imports from packages
 */
import { describe, expect, it } from 'vitest';

/**
 * Imports from relative
 */
import { JiraViewer } from './jira.viewer';

const viewer = new JiraViewer();

describe('JiraViewer', () => {
  it('renders headings, emphasis, links and code', () => {
    const result = viewer.render(
      [
        'h1. Release notes',
        '',
        'Ship *bold* text.',
        '',
        '[Docs|https://example.com]',
        '',
        '{code:ts}',
        'const ready = true;',
        '{code}',
      ].join('\n'),
    );

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value).toContain('<h1>Release notes</h1>');
      expect(result.value).toContain('<strong>bold</strong>');
      expect(result.value).toContain('<a href="https://example.com">Docs</a>');
      expect(result.value).toContain('class="md-code"');
      expect(result.value).toContain('hljs-keyword');
    }
  });

  it('rejects empty input', () => {
    expect(viewer.render('  ').ok).toBe(false);
  });
});
