/**
 * Imports from packages
 */
import { deflateRawSync } from 'node:zlib';

import { describe, expect, it } from 'vitest';

/**
 * Imports from relative
 */
import { excelToJson } from './excel-to-json';
import { excelTableText, jsonToExcel, jsonToExcelFile } from './json-to-excel';
import { xlsxBytesToTable } from './xlsx-read';

const ROWS =
  '[{"id":1,"name":"Ada","active":true},{"id":2,"name":"Grace","active":false}]';

describe('excel → json', () => {
  it('собирает объекты из таблицы превью', () => {
    expect(excelToJson(jsonToExcel(ROWS))).toBe(
      `${JSON.stringify(
        [
          { id: 1, name: 'Ada', active: true },
          { id: 2, name: 'Grace', active: false },
        ],
        null,
        2,
      )}\n`,
    );
  });

  it('читает TSV и CSV и оставляет первую строку данными', () => {
    expect(excelToJson('id\tname\n1\tAda\n', { header: false })).toBe(
      `${JSON.stringify(
        [
          ['id', 'name'],
          [1, 'Ada'],
        ],
        null,
        2,
      )}\n`,
    );
    expect(excelToJson('name,note\n"Ada, A","say ""hi"""\n')).toBe(
      `${JSON.stringify([{ name: 'Ada, A', note: 'say "hi"' }], null, 2)}\n`,
    );
  });

  it('читает книгу, которую собрал JSON → Excel', async () => {
    const table = await xlsxBytesToTable(jsonToExcelFile(ROWS));

    expect(table.rows).toEqual([
      ['id', 'name', 'active'],
      ['1', 'Ada', 'TRUE'],
      ['2', 'Grace', 'FALSE'],
    ]);
    expect(excelToJson(excelTableText(table))).toContain('"name": "Ada"');
  });

  it('читает сжатый лист с общими строками и датой', async () => {
    const table = await xlsxBytesToTable(
      workbook([
        {
          name: 'xl/sharedStrings.xml',
          xml: `<?xml version="1.0" encoding="UTF-8"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <si><t>name</t></si>
  <si><t>Ada &amp; Co</t></si>
</sst>`,
        },
        {
          name: 'xl/styles.xml',
          xml: `<?xml version="1.0" encoding="UTF-8"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cellXfs count="2">
    <xf numFmtId="0"/>
    <xf numFmtId="14"/>
  </cellXfs>
</styleSheet>`,
        },
        {
          name: 'xl/worksheets/sheet1.xml',
          xml: `<?xml version="1.0" encoding="UTF-8"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    <row r="1">
      <c r="A1" t="s"><v>0</v></c>
      <c r="B1" t="inlineStr"><is><t>when</t></is></c>
    </row>
    <row r="3">
      <c r="A3" t="s"><v>1</v></c>
      <c r="B3" s="1"><v>43831</v></c>
    </row>
  </sheetData>
</worksheet>`,
        },
      ]),
    );

    expect(table.rows).toEqual([
      ['name', 'when'],
      ['', ''],
      ['Ada & Co', '2020-01-01'],
    ]);
  });

  it('отклоняет текст, который не является таблицей', () => {
    expect(() => excelToJson('{"name":"Ada"}')).toThrow(
      'Excel → JSON expects a worksheet, TSV, or CSV',
    );
    expect(() => excelToJson('   ')).toThrow('Excel sheet is empty');
  });
});

function workbook(entries: { name: string; xml: string }[]): Uint8Array {
  const encoder = new TextEncoder();
  const files = entries.map((entry) => {
    const raw = encoder.encode(entry.xml);
    const data = new Uint8Array(deflateRawSync(raw));

    return {
      name: encoder.encode(entry.name),
      data,
      size: raw.length,
    };
  });
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const local = header(0x04034b50, file, 0);
    const central = header(0x02014b50, file, offset);

    locals.push(local, file.data);
    centrals.push(central);
    offset += local.length + file.data.length;
  }

  const centralSize = centrals.reduce((sum, part) => sum + part.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);

  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, files.length, true);
  endView.setUint16(10, files.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true);

  return concat([...locals, ...centrals, end]);
}

function header(
  signature: number,
  file: { name: Uint8Array; data: Uint8Array; size: number },
  localOffset: number,
): Uint8Array {
  const central = signature === 0x02014b50;
  const bytes = new Uint8Array((central ? 46 : 30) + file.name.length);
  const view = new DataView(bytes.buffer);

  view.setUint32(0, signature, true);
  view.setUint16(central ? 6 : 4, 20, true);
  view.setUint16(central ? 10 : 8, 8, true);
  view.setUint32(central ? 20 : 18, file.data.length, true);
  view.setUint32(central ? 24 : 22, file.size, true);
  view.setUint16(central ? 28 : 26, file.name.length, true);

  if (central) {
    view.setUint32(42, localOffset, true);
  }

  bytes.set(file.name, central ? 46 : 30);

  return bytes;
}

function concat(parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let cursor = 0;

  for (const part of parts) {
    out.set(part, cursor);
    cursor += part.length;
  }

  return out;
}
