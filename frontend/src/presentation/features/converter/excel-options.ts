/**
 * Imports from infrastructure
 */
import {
  DEFAULT_EXCEL_OPTIONS,
  excelBuildOptions,
  type ExcelBuildOptions,
} from '@infrastructure/converters/json-excel/json-to-excel';

const STORAGE_KEY = 'so1-fmt.excel-table.v1';

/**
 * Читает настройки таблицы Excel из localStorage
 */
export function loadExcelOptions(): ExcelBuildOptions {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return { ...DEFAULT_EXCEL_OPTIONS };
    }

    return excelBuildOptions(JSON.parse(raw) as ExcelBuildOptions);
  } catch {
    return { ...DEFAULT_EXCEL_OPTIONS };
  }
}

/**
 * Запоминает настройки таблицы Excel
 *
 * @param options Текущие параметры таблицы
 */
export function saveExcelOptions(options: ExcelBuildOptions): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(options));
  } catch {
    return;
  }
}
