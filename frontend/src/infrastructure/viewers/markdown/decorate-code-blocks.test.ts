/**
 * Imports from packages
 */
import { describe, expect, it } from 'vitest';

/**
 * Imports from relative
 */
import { decorateCodeBlocks } from './decorate-code-blocks';

describe('decorateCodeBlocks', () => {
  it('wraps a fenced typescript block with a language label and highlight', () => {
    const html = decorateCodeBlocks(
      '<pre><code class="language-ts">const ready = true;</code></pre>',
    );

    expect(html).toContain('class="md-code"');
    expect(html).toContain('md-code__lang');
    expect(html).toContain('ts');
    expect(html).toContain('hljs-keyword');
    expect(html).toContain('const');
    expect(html).toContain('true');
  });

  it('highlights go, python and bash fences', () => {
    const go = decorateCodeBlocks(
      '<pre><code class="language-go">func main() {}</code></pre>',
    );
    const python = decorateCodeBlocks(
      '<pre><code class="language-python">def ready():\n    return True</code></pre>',
    );
    const bash = decorateCodeBlocks(
      '<pre><code class="language-bash">if true; then echo hi; fi</code></pre>',
    );

    expect(go).toContain('hljs-keyword');
    expect(go).toContain('func');
    expect(python).toContain('hljs-keyword');
    expect(python).toContain('def');
    expect(bash).toContain('hljs-keyword');
    expect(bash).toContain('if');
  });
});
