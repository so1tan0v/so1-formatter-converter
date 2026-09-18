export const HISTORY_LIMIT = 5;

export type HistoryScope = `formatter:${string}` | `converter:${string}`;

export interface HistoryEntry {
  id: string;
  source: string;
  output: string;
  savedAt: number;
}
