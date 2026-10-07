/**
 * Imports from relative
 */
import { highlightFence } from './highlight-fence';

const FENCE_BLOCK =
  /<pre><code(?: class="language-([^"]*)")?>([\s\S]*?)<\/code><\/pre>/g;

/**
 * Превращает fenced-блоки в привычные code block с языком и подсветкой
 *
 * @param html HTML, полученный из markdownToHtml
 */
export function decorateCodeBlocks(html: string): string {
  return html.replace(FENCE_BLOCK, (_all, language: string | undefined, body: string) => {
    const source = decodeHtml(body);
    const lang = language?.trim();
    const highlighted = highlightFence(source, lang || undefined);
    const className = lang ? ` class="language-${lang}"` : '';
    const label = lang
      ? `<div class="md-code__lang">${escapeText(lang)}</div>`
      : '';

    return `<div class="md-code">${label}<pre><code${className}>${highlighted}</code></pre></div>`;
  });
}

function decodeHtml(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');
}

function escapeText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
