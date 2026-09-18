/**
 * Imports from domain
 */
import type { TextConverter } from '@domain/converter/ports';
import type { ConverterOptions } from '@domain/converter/types';
import { failure, success } from '@domain/shared/result';
import type { Result } from '@domain/shared/result';

/**
 * Imports from relative
 */
import { markdownToJira } from './markdown-to-jira';

export class MarkdownJiraConverter implements TextConverter {
  /**
   * Идентификатор конвертера Markdown в Jira
   */
  readonly id = 'markdown-jira' as const;

  /**
   * Подпись конвертера в интерфейсе
   */
  readonly label = 'Markdown → Jira';

  /**
   * Признак, что конвертер уже доступен пользователю
   */
  readonly available = true;

  /**
   * Преобразует Markdown в разметку Jira
   *
   * @param input Исходный Markdown-текст
   * @param _options Настройки преобразования, сейчас не используются
   */
  convert(input: string, _options: ConverterOptions): Result<string> {
    const source = input.trim();

    if (!source) {
      return failure('Empty input');
    }

    return success(markdownToJira(input));
  }
}
