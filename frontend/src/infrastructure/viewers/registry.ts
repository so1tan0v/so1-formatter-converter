import type { TextViewer } from '@domain/viewer/ports';
import type { ViewerId } from '@domain/viewer/types';

export interface ViewerRegistry {
  list(): TextViewer[];
  get(id: ViewerId): TextViewer | undefined;
}

const VIEWERS: TextViewer[] = [
  {
    id: 'markdown',
    label: 'Markdown',
    available: false,
  },
];

export function createViewerRegistry(): ViewerRegistry {
  const byId = new Map(VIEWERS.map((viewer) => [viewer.id, viewer]));

  return {
    list: () => VIEWERS,
    get: (id: ViewerId) => byId.get(id),
  };
}
