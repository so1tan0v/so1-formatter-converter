/**
 * Imports from packages
 */
import { describe, expect, it } from 'vitest';

/**
 * Imports from relative
 */
import { jsonToSql } from './json-to-sql';
import { sqlToJson } from './sql-to-json';

describe('json ↔ sql', () => {
  it('converts an array of objects to insert statements', () => {
    const sql = jsonToSql(
      '[{"id":1,"name":"Ada","active":true},{"id":2,"name":"Grace","active":false}]',
    );

    expect(sql).toContain('INSERT INTO "data"');
    expect(sql).toContain('"id", "name", "active"');
    expect(sql).toContain("(1, 'Ada', TRUE)");
    expect(sql).toContain("(2, 'Grace', FALSE)");
  });

  it('parses insert statements back to json', () => {
    const json = sqlToJson(
      `INSERT INTO "data" ("id", "name", "active")
VALUES
  (1, 'Ada', TRUE),
  (2, 'Grace', FALSE);`,
    );

    expect(JSON.parse(json)).toEqual([
      { id: 1, name: 'Ada', active: true },
      { id: 2, name: 'Grace', active: false },
    ]);
  });
});
