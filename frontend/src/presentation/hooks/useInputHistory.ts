/**
 * Imports from packages
 */
import { useCallback, useMemo, useState } from 'react';

/**
 * Imports from app
 */
import { historyStore } from '@app/composition';

/**
 * Imports from domain
 */
import type { HistoryEntry, HistoryScope } from '@domain/history/types';

/**
 * Читает и обновляет историю ввода для указанной области
 *
 * @param scope Область истории, например тип форматтера или конвертера
 */
export function useInputHistory(scope: HistoryScope): {
  entries: HistoryEntry[];
  latest: HistoryEntry | undefined;
  remember: (source: string, output: string) => void;
} {
  const [revision, setRevision] = useState(0);
  const entries = useMemo(() => {
    void revision;

    return historyStore.list(scope);
  }, [scope, revision]);
  const latest = entries[0];

  const remember = useCallback(
    (source: string, output: string) => {
      historyStore.remember(scope, { source, output });
      setRevision((value) => value + 1);
    },
    [scope],
  );

  return { entries, latest, remember };
}
