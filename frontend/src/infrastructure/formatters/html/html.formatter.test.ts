/**
 * Imports from packages
 */
import { describe, expect, it } from 'vitest';

/**
 * Imports from domain
 */
import { DEFAULT_HTML_OPTIONS } from '@domain/formatter/types';

/**
 * Imports from relative
 */
import { HtmlFormatter } from './html.formatter';

const formatter = new HtmlFormatter();

const messyHtml = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Release notes</title></head><body><h1 class="title" id="top" data-ready="true">Release notes</h1><p>Ship <strong>HTML</strong>.</p><pre>  keep   me </pre></body></html>`;

describe('HtmlFormatter', () => {
  it('formats a document with the default layout', () => {
    const result = formatter.format(messyHtml, DEFAULT_HTML_OPTIONS);

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value).toContain('<!DOCTYPE html>');
      expect(result.value).toContain('\n<head>');
      expect(result.value).toContain('\n  <meta charset="utf-8">');
      expect(result.value).toContain('\n<body>');
      expect(result.value).toContain('<pre>  keep   me </pre>');
      expect(result.value.endsWith('\n')).toBe(false);
    }
  });

  it('puts each attribute on its own line', () => {
    const result = formatter.format(
      '<img src="a.png" alt="A" class="hero" width="10">',
      { ...DEFAULT_HTML_OPTIONS, wrapAttributes: 'force' },
    );

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value).toBe(
        ['<img src="a.png"', '  alt="A"', '  class="hero"', '  width="10">'].join(
          '\n',
        ),
      );
    }
  });

  it('indents with the selected width', () => {
    const spaces = formatter.format('<div><p>a</p></div>', {
      ...DEFAULT_HTML_OPTIONS,
      indent: '4-space',
      extraLiners: false,
    });
    const tabs = formatter.format('<div><p>a</p></div>', {
      ...DEFAULT_HTML_OPTIONS,
      indent: 'tab',
      extraLiners: false,
    });

    expect(spaces.ok && spaces.value).toContain('\n    <p>a</p>');
    expect(tabs.ok && tabs.value).toContain('\n\t<p>a</p>');
  });

  it('collapses blank lines when newlines are not preserved', () => {
    const result = formatter.format('<div>\n\n\n<p>a</p>\n\n\n</div>', {
      ...DEFAULT_HTML_OPTIONS,
      preserveNewlines: false,
      extraLiners: false,
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value).toBe('<div>\n  <p>a</p>\n</div>');
    }
  });

  it('keeps a trailing newline when asked', () => {
    const result = formatter.format('<p>a</p>', {
      ...DEFAULT_HTML_OPTIONS,
      endWithNewline: true,
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value).toBe('<p>a</p>\n');
    }
  });

  it('formats pre content only when that option is on', () => {
    const source = '<pre>\n<div>a</div>\n<div>b</div>\n</pre>';
    const kept = formatter.format(source, DEFAULT_HTML_OPTIONS);
    const formatted = formatter.format(source, {
      ...DEFAULT_HTML_OPTIONS,
      formatPre: true,
    });

    expect(kept.ok && kept.value).toBe(source);
    expect(formatted.ok && formatted.value).toContain('\n  <div>a</div>');
  });

  it('can leave script contents at the first column', () => {
    const result = formatter.format('<div><script>\nvar a = 1;\n</script></div>', {
      ...DEFAULT_HTML_OPTIONS,
      indentScripts: 'separate',
      extraLiners: false,
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value).toContain('\n  <script>\nvar a = 1;\n  </script>');
    }
  });

  it('rejects empty input', () => {
    const result = formatter.format('   ', DEFAULT_HTML_OPTIONS);

    expect(result.ok).toBe(false);
  });
});
