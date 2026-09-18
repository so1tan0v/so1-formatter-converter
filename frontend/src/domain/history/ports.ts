import type { HistoryEntry, HistoryScope } from './types';

export interface HistoryStore {
  list(scope: HistoryScope): HistoryEntry[];
  latest(scope: HistoryScope): HistoryEntry | undefined;
  remember(
    scope: HistoryScope,
    input: { source: string; output: string },
  ): HistoryEntry[];
}
