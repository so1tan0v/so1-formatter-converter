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
}
