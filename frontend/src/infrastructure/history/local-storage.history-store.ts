import type { HistoryStore } from '@domain/history/ports';
import type { HistoryEntry, HistoryScope } from '@domain/history/types';
import { HISTORY_LIMIT } from '@domain/history/types';
import type { KeyValueStorage } from '@domain/shared/key-value-storage';

const STORAGE_KEY = 'so1-fmt.history.v1';

type HistoryBag = Partial<Record<HistoryScope, HistoryEntry[]>>;

export class LocalStorageHistoryStore implements HistoryStore {
  private readonly storage: KeyValueStorage;

  constructor(storage: KeyValueStorage) {
    this.storage = storage;
  }

  list(scope: HistoryScope): HistoryEntry[] {
    return this.read()[scope] ?? [];
  }

  latest(scope: HistoryScope): HistoryEntry | undefined {
    return this.list(scope)[0];
  }

  remember(
    scope: HistoryScope,
    input: { source: string; output: string },
  ): HistoryEntry[] {
    const source = input.source.trim();

    if (!source) {
      return this.list(scope);
    }

    const bag = this.read();
    const current = bag[scope] ?? [];
    const withoutSame = current.filter(
      (entry) => entry.source.trim() !== source,
    );
    const next: HistoryEntry[] = [
      {
        id: createHistoryId(),
        source: input.source,
        output: input.output,
        savedAt: Date.now(),
      },
      ...withoutSame,
    ].slice(0, HISTORY_LIMIT);

    this.write({ ...bag, [scope]: next });

    return next;
  }

  private read(): HistoryBag {
    try {
      const raw = this.storage.getItem(STORAGE_KEY);

      if (!raw) {
        return {};
      }

      const parsed = JSON.parse(raw) as HistoryBag;

      if (!parsed || typeof parsed !== 'object') {
        return {};
      }

      return parsed;
    } catch {
      return {};
    }
  }

  private write(bag: HistoryBag): void {
    this.storage.setItem(STORAGE_KEY, JSON.stringify(bag));
  }
}

function createHistoryId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
