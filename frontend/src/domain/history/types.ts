/**
 * Максимальное число записей истории на одну область
 */
export const HISTORY_LIMIT = 5;

export type HistoryScope =
  `formatter:${string}` | `converter:${string}` | `viewer:${string}`;

export interface HistoryEntry {
  id: string;
  source: string;
  output: string;
  savedAt: number;
}
