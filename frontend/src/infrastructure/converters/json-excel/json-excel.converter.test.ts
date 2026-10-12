/**
 * Imports from packages
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Imports from relative
 */
import {
  excelTableText,
  jsonToExcel,
  jsonToExcelFile,
  readExcelTable,
} from './json-to-excel';

const ROWS =
  '[{"id":1,"name":"Ada","active":true},{"id":2,"name":"Grace","active":false}]';

describe('json → excel', () => {
  it('показывает таблицу с заголовком колонок', () => {
    const table = readExcelTable(jsonToExcel(ROWS));

    expect(table).toEqual({
      header: true,
      rows: [
        ['id', 'name', 'active'],
        ['1', 'Ada', 'TRUE'],
        ['2', 'Grace', 'FALSE'],
      ],
    });
    expect(table ? excelTableText(table) : '').toBe(
      'id\tname\tactive\n1\tAda\tTRUE\n2\tGrace\tFALSE',
    );
  });

  it('не считает первую строку массива заголовком', () => {
    expect(readExcelTable(jsonToExcel('[[1,"a"],[2]]'))).toEqual({
      header: false,
      rows: [
        ['1', 'a'],
        ['2', ''],
      ],
    });
  });

  it('собирает книгу xlsx и пишет логические значения как TRUE и FALSE', () => {
    const xml = workbookText(jsonToExcelFile(ROWS));

    expect(xml.startsWith('PK')).toBe(true);
    expect(xml).toContain('xl/worksheets/sheet1.xml');
    expect(xml).toContain('name="Sheet1"');
    expect(xml).toContain('<c r="A2"><v>1</v></c>');
    expect(xml).toContain(
      '<c r="B2" t="inlineStr"><is><t xml:space="preserve">Ada</t></is></c>',
    );
    expect(xml).toContain(
      '<c r="C2" t="inlineStr"><is><t xml:space="preserve">TRUE</t></is></c>',
    );
    expect(xml).toContain(
      '<c r="C3" t="inlineStr"><is><t xml:space="preserve">FALSE</t></is></c>',
    );
    expect(xml).not.toContain('t="b"');
    expect(xml).not.toContain('<f>');
  });

  it('оставляет пустую ячейку, если поля нет', () => {
    const xml = workbookText(jsonToExcelFile('[{"id":1},{"name":"Ada"}]'));

    expect(xml).toContain('<row r="2"><c r="A2"><v>1</v></c></row>');
    expect(xml).toContain(
      '<row r="3"><c r="B3" t="inlineStr"><is><t xml:space="preserve">Ada</t></is></c></row>',
    );
  });

  it('пишет вложенное значение текстом и экранирует разметку', () => {
    const xml = workbookText(
      jsonToExcelFile('{"name":"Ada & \\"A\\"","tags":["a","b"]}'),
    );

    expect(xml).toContain('Ada &amp; "A"');
    expect(xml).toContain('["a","b"]');
  });

  it('кладёт текст формулы в ячейку, а не в формулу', () => {
    const xml = workbookText(jsonToExcelFile('{"cmd":"=1+1"}'));

    expect(xml).toContain(
      '<c r="A2" t="inlineStr"><is><t xml:space="preserve">=1+1</t></is></c>',
    );
    expect(xml).not.toContain('<f>');
  });

  it('кладёт таблицу массивов как есть', () => {
    const xml = workbookText(jsonToExcelFile('[[1,"a"],[2]]'));

    expect(xml).toContain('<c r="A1"><v>1</v></c>');
    expect(xml).toContain(
      '<c r="B1" t="inlineStr"><is><t xml:space="preserve">a</t></is></c>',
    );
    expect(xml).toContain('<row r="2"><c r="A2"><v>2</v></c></row>');
  });

  it('отклоняет пустой массив', () => {
    expect(() => jsonToExcelFile('[]')).toThrow('JSON array is empty');
  });

  it('упаковывает книгу так, что unzip читает лист', () => {
    const file = join(mkdtempSync(join(tmpdir(), 'xlsx-')), 'book.xlsx');

    writeFileSync(file, jsonToExcelFile(ROWS));

    expect(execFileSync('unzip', ['-t', file], { encoding: 'utf8' })).toContain(
      'OK',
    );
    expect(
      execFileSync('unzip', ['-p', file, 'xl/worksheets/sheet1.xml'], {
        encoding: 'utf8',
      }),
    ).toContain(
      '<c r="B2" t="inlineStr"><is><t xml:space="preserve">Ada</t></is></c>',
    );
  });
});

function workbookText(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}
