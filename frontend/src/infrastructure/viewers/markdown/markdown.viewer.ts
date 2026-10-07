/**
 * Imports from domain
 */
import type { Result } from '@domain/shared/result';
import type { TextViewer } from '@domain/viewer/ports';

/**
 * Imports from infrastructure
 */
import { convertSource } from '@infrastructure/converters/convert-source';
import { markdownToHtml } from '@infrastructure/converters/markdown-html/markdown-to-html';
import { decorateCodeBlocks } from '@infrastructure/viewers/markdown/decorate-code-blocks';

export class MarkdownViewer implements TextViewer {
  /**
   * Идентификатор просмотрщика Markdown
   */
  readonly id = 'markdown' as const;

  /**
   * Подпись просмотрщика в интерфейсе
   */
  readonly label = 'Markdown';

  /**
   * Признак, что просмотрщик уже доступен пользователю
   */
  readonly available = true;

  /**
   * Подпись поля ввода
   */
  readonly sourceLabel = 'Markdown';

  /**
   * Рендерит Markdown в HTML
   *
   * @param input Исходный Markdown-текст
   */
  render(input: string): Result<string> {
    return convertSource(input, (source) =>
      decorateCodeBlocks(markdownToHtml(source)),
    );
  }
}
