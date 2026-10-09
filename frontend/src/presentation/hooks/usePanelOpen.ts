/**
 * Imports from packages
 */
import { useCallback, useState } from 'react';

const STORAGE_KEY = 'so1-fmt.panel-open.v1';

/**
 * Помнит, открыта ли панель настроек
 *
 * @param id Имя панели, например formatter или differ
 */
export function usePanelOpen(id: string): {
  open: boolean;
  setOpen: (open: boolean) => void;
} {
  const [open, setOpenState] = useState(() => readOpen(id));
  const setOpen = useCallback(
    (next: boolean) => {
      setOpenState(next);
      writeOpen(id, next);
    },
    [id],
  );

  return { open, setOpen };
}

function readOpen(id: string): boolean {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return true;
    }

    const parsed: unknown = JSON.parse(raw);

    if (!isRecord(parsed) || typeof parsed[id] !== 'boolean') {
      return true;
    }

    return parsed[id];
  } catch {
    return true;
  }
}

function writeOpen(id: string, open: boolean): void {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    const bag = isRecord(parsed) ? { ...parsed } : {};

    bag[id] = open;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bag));
  } catch {
    return;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
