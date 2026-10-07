/**
 * Imports from domain
 */
import type { TextConverter } from '@domain/converter/ports';
import type { ConverterFormat } from '@domain/converter/types';
import type { Result } from '@domain/shared/result';

/**
 * Imports from relative
 */
import { convertSource } from '../convert-source';
import { htmlToMarkdown } from './html-to-markdown';

export class HtmlMarkdownConverter implements TextConverter {
  /**
   * Идентификатор конвертера HTML в Markdown
   */
  readonly id = 'html-markdown' as const;

  /**
   * Подпись конвертера в интерфейсе
   */
  readonly label = 'HTML → Markdown';

  /**
   * Признак, что конвертер уже доступен пользователю
   */
  readonly available = true;

  /**
   * Формат исходного текста
   */
  readonly sourceFormat: ConverterFormat = 'html';

  /**
   * Формат результата
   */
  readonly targetFormat: ConverterFormat = 'markdown';

  /**
   * Подпись поля ввода
   */
  readonly sourceLabel = 'HTML';

  /**
   * Подпись поля вывода
   */
  readonly targetLabel = 'Markdown';

  /**
   * Преобразует HTML в Markdown
   *
   * @param input Исходный HTML
   */
  convert(input: string): Result<string> {
    return convertSource(input, htmlToMarkdown);
  }
}
