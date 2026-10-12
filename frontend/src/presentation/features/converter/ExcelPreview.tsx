/**
 * Imports from infrastructure
 */
import type { ExcelTable } from '@infrastructure/converters/json-excel/json-to-excel';

interface ExcelPreviewProps {
  table: ExcelTable;
}

/**
 * Рисует лист Excel в панели результата
 *
 * @param table Строки превью, первая может быть заголовком колонок
 */
export function ExcelPreview({ table }: ExcelPreviewProps) {
  const width = table.rows.reduce((max, row) => Math.max(max, row.length), 0);
  const header = table.header ? (table.rows[0] ?? []) : null;
  const body = table.header ? table.rows.slice(1) : table.rows;

  return (
    <div className="excel-preview">
      <table>
        {header ? (
          <thead>
            <tr>
              {Array.from({ length: width }, (_, index) => (
                <th key={index} scope="col">
                  {header[index] ?? ''}
                </th>
              ))}
            </tr>
          </thead>
        ) : null}
        <tbody>
          {body.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: width }, (_, index) => {
                const value = row[index] ?? '';

                return (
                  <td
                    key={index}
                    className={isNumberCell(value) ? 'is-number' : undefined}
                  >
                    {value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function isNumberCell(value: string): boolean {
  return /^-?\d+(?:\.\d+)?$/.test(value);
}
