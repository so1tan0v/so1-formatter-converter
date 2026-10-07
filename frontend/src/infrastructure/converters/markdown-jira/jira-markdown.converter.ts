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
import { jiraToMarkdown } from './jira-to-markdown';

export class JiraMarkdownConverter implements TextConverter {
  /**
   * Идентификатор конвертера Jira в Markdown
   */
  readonly id = 'jira-markdown' as const;

  /**
   * Подпись конвертера в интерфейсе
   */
  readonly label = 'Jira → Markdown';

  /**
   * Признак, что конвертер уже доступен пользователю
   */
  readonly available = true;

  /**
   * Формат исходного текста
   */
  readonly sourceFormat: ConverterFormat = 'jira';

  /**
   * Формат результата
   */
  readonly targetFormat: ConverterFormat = 'markdown';

  /**
   * Подпись поля ввода
   */
  readonly sourceLabel = 'Jira Markup';

  /**
   * Подпись поля вывода
   */
  readonly targetLabel = 'Markdown';

  /**
   * Преобразует разметку Jira в Markdown
   *
   * @param input Исходный текст Jira
   */
  convert(input: string): Result<string> {
    return convertSource(input, jiraToMarkdown);
  }
}
