/**
 * Imports from domain
 */
import type { HistoryEntry } from '@domain/history/types';

interface HistorySelectProps {
  entries: HistoryEntry[];
  currentSource: string;
  onSelect: (entry: HistoryEntry) => void;
}

/**
 * Список недавних вводов для выбранного типа
 *
 * @param entries Список записей истории
 * @param currentSource Текущий исходный текст в редакторе
 * @param onSelect Обработчик выбора записи из списка
 */
export function HistorySelect({
  entries,
  currentSource,
  onSelect,
}: HistorySelectProps) {
  if (entries.length === 0) {
    return null;
  }

  const activeId =
    entries.find((entry) => entry.source === currentSource)?.id ?? '';

  return (
    <label className="tui-history">
      <span className="tui-history__label">Recent</span>
      <select
        className="tui-select tui-select--history"
        aria-label="Recent inputs"
        value={activeId}
        onChange={(event) => {
          const entry = entries.find((item) => item.id === event.target.value);

          if (entry) {
            onSelect(entry);
          }
        }}
      >
        {activeId === '' ? (
          <option value="" disabled>
            pick
          </option>
        ) : null}
        {entries.map((entry, index) => (
          <option key={entry.id} value={entry.id}>
            {index + 1}. {previewHistory(entry.source)}
          </option>
        ))}
      </select>
    </label>
  );
}

function previewHistory(source: string): string {
  const compact = source.replace(/\s+/g, ' ').trim() || 'empty';

  return compact.length > 56 ? `${compact.slice(0, 56)}…` : compact;
}
