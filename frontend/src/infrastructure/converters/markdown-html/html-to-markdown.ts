/**
 * Imports from packages
 */
import { NodeHtmlMarkdown } from 'node-html-markdown';

/**
 * Преобразует HTML в Markdown
 *
 * @param input Исходный HTML
 */
export function htmlToMarkdown(input: string): string {
  ensureProcess();

  return NodeHtmlMarkdown.translate(input, {
    emDelimiter: '*',
    strongDelimiter: '**',
  }).trim();
}

function ensureProcess(): void {
  const target = globalThis as {
    process?: { env: Record<string, string | undefined> };
  };

  if (!target.process) {
    target.process = { env: {} };
  }
}
