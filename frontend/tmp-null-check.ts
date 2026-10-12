import {
  jsonToExcel,
  readExcelTable,
} from './src/infrastructure/converters/json-excel/json-to-excel';

const source = `[
  {
    "zeta": "Привет",
    "key": "Value",
    "empty_Case": null,
    "nested": { "ok": true, "count": 3 },
    "true": true,
    "false": false
  }
]`;

console.log(readExcelTable(jsonToExcel(source)));
console.log(readExcelTable(jsonToExcel(source, { nulls: 'empty' })));
