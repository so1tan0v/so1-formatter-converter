/**
 * Imports from packages
 */
import J2M from 'jira2md';

/**
 * Преобразует Markdown в разметку Jira
 *
 * @param input Исходный Markdown-текст
 */
export function markdownToJira(input: string): string {
  const source = markdownBullets(input);
  const padded = source.startsWith('\n') ? source : `\n${source}`;
  const withTrailingNewline = padded.endsWith('\n') ? padded : `${padded}\n`;

  return normalizeCodeLanguage(J2M.to_jira(withTrailingNewline)).trim();
}

function markdownBullets(input: string): string {
  let fence = false;

  return input
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => {
      if (/^\s*```/.test(line)) {
        fence = !fence;

        return line;
      }

      if (fence) {
        return line;
      }

      return line.replace(/^([ \t]*)[-+]\s+/, '$1* ');
    })
    .join('\n');
}

function normalizeCodeLanguage(markup: string): string {
  return markup.replace(
    /\{code:\s*([A-Za-z0-9_+#.-]+)\s*\}/g,
    (_match, language: string) => `{code:${language.toLowerCase()}}`,
  );
}
