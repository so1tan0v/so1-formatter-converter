/**
 * Imports from packages
 */
import { describe, expect, it } from 'vitest';

/**
 * Imports from relative
 */
import { shieldScriptEndTags } from './shield-script-end-tags';

describe('shieldScriptEndTags', () => {
  it('escapes a closing sequence inside a string and keeps the real tag', () => {
    const source = [
      '<script>',
      'const html = "</script>";',
      'console.log(html);',
      '</script>',
      '<p>after</p>',
    ].join('\n');

    const shielded = shieldScriptEndTags(source);

    expect(shielded).toContain('const html = "<\\/script>";');
    expect(shielded).toContain('console.log(html);');
    expect(shielded.match(/<\/script>/g)).toHaveLength(1);
  });

  it('escapes a closing sequence inside a template literal', () => {
    const source = [
      '<script>',
      'const html = `</script>${"</script>"}`;',
      'const ok = 1;',
      '</script>',
    ].join('\n');

    const shielded = shieldScriptEndTags(source);

    expect(shielded).toContain('`<\\/script>${"<\\/script>"}`');
    expect(shielded).toContain('const ok = 1;');
    expect(shielded.match(/<\/script>/g)).toHaveLength(1);
  });

  it('escapes a closing sequence inside a regular expression', () => {
    const source = [
      '<script>',
      'const pattern = /</script>/;',
      'const ok = 1;',
      '</script>',
    ].join('\n');

    const shielded = shieldScriptEndTags(source);

    expect(shielded).toContain('const pattern = /<\\/script>/;');
    expect(shielded).toContain('const ok = 1;');
  });

  it('leaves a non-javascript script body untouched', () => {
    const source = '<script type="text/template"><div></script></div></script>';

    expect(shieldScriptEndTags(source)).toBe(source);
  });

  it('escapes a closing sequence inside a json script', () => {
    const source = [
      '<script type="application/ld+json">',
      '{"html": "</script>"}',
      '</script>',
    ].join('\n');

    const shielded = shieldScriptEndTags(source);

    expect(shielded).toContain('"html": "<\\/script>"');
    expect(shielded.match(/<\/script>/g)).toHaveLength(1);
  });

  it('does not rewrite a script that is only textarea text', () => {
    const source =
      '<textarea><script>const html = "</script>";</script></textarea>';

    expect(shieldScriptEndTags(source)).toBe(source);
  });

  it('does not treat a closing sequence inside an attribute as a script', () => {
    const source = '<div title="</script>"></div>';

    expect(shieldScriptEndTags(source)).toBe(source);
  });

  it('leaves an unclosed string unchanged when no real script end follows', () => {
    const source = '<script>\nconst a = "oops </script>\n';

    expect(shieldScriptEndTags(source)).toBe(source);
  });
});
