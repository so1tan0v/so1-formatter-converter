/**
 * Imports from application
 */
import type { ViewerRegistry } from '@application/view-text';

/**
 * Imports from domain
 */
import type { TextViewer } from '@domain/viewer/ports';
import type { ViewerId } from '@domain/viewer/types';

/**
 * Imports from relative
 */
import { MarkdownViewer } from './markdown/markdown.viewer';

/**
 * Создает реестр просмотрщиков документов
 */
export function createViewerRegistry(): ViewerRegistry {
  const viewers: TextViewer[] = [new MarkdownViewer()];
  const byId = new Map(viewers.map((viewer) => [viewer.id, viewer]));

  return {
    list: () => viewers,
    get: (id: ViewerId) => byId.get(id),
  };
}
