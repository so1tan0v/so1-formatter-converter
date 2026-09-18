import type { ViewerId } from './types';

export interface TextViewer {
  readonly id: ViewerId;
  readonly label: string;
  readonly available: boolean;
}
