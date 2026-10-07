/**
 * Imports from domain
 */
import { failure } from '@domain/shared/result';
import type { Result } from '@domain/shared/result';
import type { TextViewer } from '@domain/viewer/ports';
import type { ViewerId } from '@domain/viewer/types';

export interface ViewerRegistry {
  /**
   * Возвращает список зарегистрированных просмотрщиков
   */
  list(): TextViewer[];

  /**
   * Возвращает просмотрщик по идентификатору
   *
   * @param id Идентификатор просмотрщика
   */
  get(id: ViewerId): TextViewer | undefined;
}

/**
 * Рендерит текст выбранным просмотрщиком из реестра
 *
 * @param registry Реестр доступных просмотрщиков
 * @param id Идентификатор просмотрщика
 * @param input Исходный текст документа
 */
export function viewText(
  registry: ViewerRegistry,
  id: ViewerId,
  input: string,
): Result<string> {
  const viewer = registry.get(id);

  if (!viewer) {
    return failure(`Viewer "${id}" is not registered`);
  }

  if (!viewer.available) {
    return failure(`Viewer "${viewer.label}" is not available yet`);
  }

  return viewer.render(input);
}
