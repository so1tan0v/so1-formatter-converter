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
import { useLocale } from '@presentation/i18n/useLocale';

interface ExcelSettingsProps {
  options: ExcelBuildOptions;
  onChange: (options: ExcelBuildOptions) => void;
  mode?: 'write' | 'read';
}

/**
 * Параметры сборки таблицы JSON → Excel
 *
 * @param options Текущие параметры
 * @param onChange Сохраняет измененные параметры
 */
export function ExcelSettings({
  options,
  onChange,
  mode = 'write',
}: ExcelSettingsProps) {
  const { t } = useLocale();
  const panel = usePanelOpen(mode === 'read' ? 'excel-read' : 'excel');

  const patch = <Key extends keyof ExcelBuildOptions>(
    key: Key,
    value: ExcelBuildOptions[Key],
  ) => {
    onChange({ ...options, [key]: value });
  };

  return (
    <AsciiFrame
      title={t('settings')}
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
            {`"${panel.open ? t('hide') : t('show')}"`}
          </button>
          <button
            type="button"
            className="tui-inline-cmd"
            onClick={() => onChange({ ...DEFAULT_EXCEL_OPTIONS })}
          >
            {`"${t('reset')}"`}
          </button>
        </>
      }
    >
      <div className="tui-fields">
        {mode === 'write' ? (
          <>
            <label className="tui-check">
              <input
                type="checkbox"
                checked={options.flatten}
                onChange={(event) => patch('flatten', event.target.checked)}
              />
              <span>{t('excel.flatten')}</span>
            </label>
            <label className="tui-check">
              <input
                type="checkbox"
                checked={options.keyColumn}
                onChange={(event) => patch('keyColumn', event.target.checked)}
              />
              <span>{t('excel.keyColumn')}</span>
            </label>
          </>
        ) : null}
        <label className="tui-check">
          <input
            type="checkbox"
            checked={options.header}
            onChange={(event) => patch('header', event.target.checked)}
          />
          <span>{t('excel.header')}</span>
        </label>
        {mode === 'write' ? (
          <>
            <label className="tui-field">
              <span className="tui-field__name">{t('excel.nulls')}</span>
              <select
                className="tui-select"
                value={options.nulls}
                onChange={(event) =>
                  patch(
                    'nulls',
                    event.target.value === 'null' ? 'null' : 'empty',
                  )
                }
              >
                <option value="empty">{t('excel.empty')}</option>
                <option value="null">null</option>
              </select>
            </label>
            <label className="tui-field">
              <span className="tui-field__name">{t('excel.booleans')}</span>
              <select
                className="tui-select"
                value={options.booleans}
                onChange={(event) =>
                  patch(
                    'booleans',
                    event.target.value === 'one-zero'
                      ? 'one-zero'
                      : 'true-false',
                  )
                }
              >
                <option value="true-false">TRUE / FALSE</option>
                <option value="one-zero">1 / 0</option>
              </select>
            </label>
            <label className="tui-field">
              <span className="tui-field__name">{t('excel.arrays')}</span>
              <select
                className="tui-select"
                value={options.arrays}
                onChange={(event) =>
                  patch('arrays', arrayStyle(event.target.value))
                }
              >
                <option value="json">JSON</option>
                <option value="join">{t('excel.join')}</option>
                <option value="expand">{t('excel.expand')}</option>
              </select>
            </label>
          </>
        ) : null}
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
