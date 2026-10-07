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
import { markdownToHtml } from './markdown-to-html';

export class MarkdownHtmlConverter implements TextConverter {
  /**
   * Идентификатор конвертера Markdown в HTML
   */
  readonly id = 'markdown-html' as const;

  /**
   * Подпись конвертера в интерфейсе
   */
  readonly label = 'Markdown → HTML';

  /**
   * Признак, что конвертер уже доступен пользователю
   */
  readonly available = true;

  /**
   * Формат исходного текста
   */
  readonly sourceFormat: ConverterFormat = 'markdown';

  /**
   * Формат результата
   */
  readonly targetFormat: ConverterFormat = 'html';

  /**
   * Подпись поля ввода
   */
  readonly sourceLabel = 'Markdown';

  /**
   * Подпись поля вывода
   */
  readonly targetLabel = 'HTML';

  /**
   * Преобразует Markdown в HTML
   *
   * @param input Исходный Markdown-текст
   */
  convert(input: string): Result<string> {
    return convertSource(input, markdownToHtml);
  }
}
