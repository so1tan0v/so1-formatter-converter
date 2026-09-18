import { useCallback, useMemo, useState } from 'react';

import { historyStore } from '@app/composition';
import type { HistoryEntry, HistoryScope } from '@domain/history/types';

export function useInputHistory(scope: HistoryScope): {
  entries: HistoryEntry[];
  latest: HistoryEntry | undefined;
  remember: (source: string, output: string) => void;
} {
  const [revision, setRevision] = useState(0);
  const entries = useMemo(
    () => historyStore.list(scope),
    [scope, revision],
  );
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
