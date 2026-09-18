/**
 * Идентификаторы доступных и планируемых просмотрщиков
 */
export const VIEWER_IDS = ['markdown'] as const;

export type ViewerId = (typeof VIEWER_IDS)[number];
