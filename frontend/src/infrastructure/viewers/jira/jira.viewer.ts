/**
 * Imports from domain
 */
import type { Result } from '@domain/shared/result';
import type { TextViewer } from '@domain/viewer/ports';

/**
 * Imports from infrastructure
 */
import { convertSource } from '@infrastructure/converters/convert-source';
import { jiraToMarkdown } from '@infrastructure/converters/markdown-jira/jira-to-markdown';
import { markdownToHtml } from '@infrastructure/converters/markdown-html/markdown-to-html';
import { decorateCodeBlocks } from '@infrastructure/viewers/markdown/decorate-code-blocks';

export class JiraViewer implements TextViewer {
  /**
   * Идентификатор просмотрщика Jira
   */
  readonly id = 'jira' as const;

  /**
   * Подпись просмотрщика в интерфейсе
   */
  readonly label = 'Jira';

  /**
   * Признак, что просмотрщик уже доступен пользователю
   */
  readonly available = true;

  /**
   * Подпись поля ввода
   */
  readonly sourceLabel = 'Jira Markup';

  /**
   * Язык подсветки поля ввода
   */
  readonly editorLanguage = 'plaintext' as const;

  /**
   * Рендерит разметку Jira в HTML
   *
   * @param input Исходный текст в разметке Jira
   */
  render(input: string): Result<string> {
    return convertSource(input, (source) =>
      decorateCodeBlocks(markdownToHtml(jiraToMarkdown(source))),
    );
  }
}
