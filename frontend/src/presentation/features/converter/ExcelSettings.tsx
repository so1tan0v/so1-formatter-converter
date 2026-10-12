/**
 * Imports from infrastructure
 */
import {
  DEFAULT_EXCEL_OPTIONS,
  type ExcelBuildOptions,
} from '@infrastructure/converters/json-excel/json-to-excel';

/**
 * Imports from presentation
 */
import { AsciiFrame } from '@presentation/components/AsciiFrame';
import { usePanelOpen } from '@presentation/hooks/usePanelOpen';

interface ExcelSettingsProps {
  options: ExcelBuildOptions;
  onChange: (options: ExcelBuildOptions) => void;
}

/**
 * Параметры сборки таблицы JSON → Excel
 *
 * @param options Текущие параметры
 * @param onChange Сохраняет измененные параметры
 */
export function ExcelSettings({ options, onChange }: ExcelSettingsProps) {
  const panel = usePanelOpen('excel');

  const patch = <Key extends keyof ExcelBuildOptions>(
    key: Key,
    value: ExcelBuildOptions[Key],
  ) => {
    onChange({ ...options, [key]: value });
  };

  return (
    <AsciiFrame
      title="Settings"
      hint="Excel"
      collapsed={!panel.open}
      actions={
        <>
          <button
            type="button"
            className="tui-inline-cmd"
            aria-expanded={panel.open}
            onClick={() => panel.setOpen(!panel.open)}
          >
            {panel.open ? '"Hide"' : '"Show"'}
          </button>
          <button
            type="button"
            className="tui-inline-cmd"
            onClick={() => onChange({ ...DEFAULT_EXCEL_OPTIONS })}
          >
            &quot;Reset&quot;
          </button>
        </>
      }
    >
      <div className="tui-fields">
        <label className="tui-check">
          <input
            type="checkbox"
            checked={options.flatten}
            onChange={(event) => patch('flatten', event.target.checked)}
          />
          <span>Flatten nested</span>
        </label>
        <label className="tui-check">
          <input
            type="checkbox"
            checked={options.keyColumn}
            onChange={(event) => patch('keyColumn', event.target.checked)}
          />
          <span>Key column</span>
        </label>
        <label className="tui-check">
          <input
            type="checkbox"
            checked={options.header}
            onChange={(event) => patch('header', event.target.checked)}
          />
          <span>Header row</span>
        </label>
        <label className="tui-field">
          <span className="tui-field__name">Nulls</span>
          <select
            className="tui-select"
            value={options.nulls}
            onChange={(event) =>
              patch('nulls', event.target.value === 'null' ? 'null' : 'empty')
            }
          >
            <option value="empty">Empty</option>
            <option value="null">null</option>
          </select>
        </label>
        <label className="tui-field">
          <span className="tui-field__name">Booleans</span>
          <select
            className="tui-select"
            value={options.booleans}
            onChange={(event) =>
              patch(
                'booleans',
                event.target.value === 'one-zero' ? 'one-zero' : 'true-false',
              )
            }
          >
            <option value="true-false">TRUE / FALSE</option>
            <option value="one-zero">1 / 0</option>
          </select>
        </label>
        <label className="tui-field">
          <span className="tui-field__name">Arrays</span>
          <select
            className="tui-select"
            value={options.arrays}
            onChange={(event) =>
              patch('arrays', arrayStyle(event.target.value))
            }
          >
            <option value="json">JSON</option>
            <option value="join">Join</option>
            <option value="expand">Expand</option>
          </select>
        </label>
      </div>
    </AsciiFrame>
  );
}

function arrayStyle(value: string): ExcelBuildOptions['arrays'] {
  if (value === 'join' || value === 'expand') {
    return value;
  }

  return 'json';
}
