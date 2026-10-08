/**
 * Imports from packages
 */
import J2M from 'jira2md';

/**
 * Преобразует разметку Jira в Markdown
 *
 * @param input Исходный текст в разметке Jira
 */
export function jiraToMarkdown(input: string): string {
  return J2M.to_markdown(normalizeCodeLanguage(input)).trim();
}

function normalizeCodeLanguage(markup: string): string {
  return markup.replace(
    /\{code:\s*([A-Za-z0-9_+#.-]+)\s*\}/g,
    (_match, language: string) => `{code:${language.toLowerCase()}}`,
  );
}
