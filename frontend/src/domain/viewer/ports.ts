/**
 * Imports from domain
 */
import type { Result } from '@domain/shared/result';

/**
 * Imports from relative
 */
import type { ViewerId } from './types';

export interface TextViewer {
  /**
   * Идентификатор просмотрщика
   */
  readonly id: ViewerId;

  /**
   * Подпись просмотрщика в интерфейсе
   */
  readonly label: string;

  /**
   * Признак, что просмотрщик уже доступен пользователю
   */
  readonly available: boolean;

  /**
   * Подпись поля ввода
   */
  readonly sourceLabel: string;

  /**
   * Язык подсветки поля ввода
   */
  readonly editorLanguage: 'markdown' | 'plaintext';

  /**
   * Рендерит исходный текст в HTML для предпросмотра
   *
   * @param input Исходный текст документа
   */
  render(input: string): Result<string>;
}
