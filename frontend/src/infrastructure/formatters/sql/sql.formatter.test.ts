/**
 * Imports from packages
 */
import { describe, expect, it } from 'vitest';

/**
 * Imports from domain
 */
import { DEFAULT_SQL_OPTIONS } from '@domain/formatter/types';

/**
 * Imports from relative
 */
import { SqlFormatter } from './sql.formatter';

const formatter = new SqlFormatter();

const messyQuery = `
select key, key2 as SOMEKEY, key3 as SOMEKEY2, key4,
if(key1 == 1, 1, 0),
if(key1 == 1, if(key1 == 1, 1, 0), 0)
from table a
inner join joinTABLE b on a.id = b.id and a.sex is null
where 1=1 and key1 = 'some'
group by key2, key3
order by key, key4
having SOMEKEY = 1 and key = 1
`;

const expectedQuery = `SELECT
    key,
    key2 AS SOMEKEY,
    key3 AS SOMEKEY2,
    key4,
    IF(key1 == 1,
        1,
        0
    ),
    IF(key1 == 1,
        IF(key1 == 1,
            1,
            0
        ),
        0
    )
FROM table a
INNER JOIN joinTABLE b
    ON a.id = b.id
    AND a.sex IS NULL
WHERE 1 = 1
    AND key1 = 'some'
GROUP BY key2,
         key3
ORDER BY key,
         key4
HAVING SOMEKEY = 1
    AND key = 1`;

describe('SqlFormatter', () => {
  it('formats a select query to the project style', () => {
    const result = formatter.format(messyQuery, DEFAULT_SQL_OPTIONS);

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value).toBe(expectedQuery);
    }
  });

  it('indents with the selected width', () => {
    const result = formatter.format('select a as A, bb as B from t', {
      indent: '2-space',
      keywordCase: 'upper',
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value).toContain('SELECT');
      expect(result.value).toContain('\n  a AS A');
      expect(result.value).toContain('\n  bb AS B');
      expect(result.value).toContain('FROM');
    }
  });

  it('rejects empty input', () => {
    const result = formatter.format(' ', DEFAULT_SQL_OPTIONS);

    expect(result.ok).toBe(false);
  });

  it('keeps ? and %s placeholders as values', () => {
    const result = formatter.format(
      'select * from users where id = ? and name = %s',
      DEFAULT_SQL_OPTIONS,
    );

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value).toContain('id = ?');
      expect(result.value).toContain('name = %s');
      expect(result.value).toContain('AND');
    }
  });

  it('formats mssql, clickhouse and sqlite dialect fragments', () => {
    const mssql = formatter.format(
      'select top 5 [id] from [dbo].[users] where [id] = @id',
      DEFAULT_SQL_OPTIONS,
    );
    const clickhouse = formatter.format(
      'select * from events final prewhere user_id = {user} limit 10, 20',
      DEFAULT_SQL_OPTIONS,
    );
    const sqlite = formatter.format(
      "select * from t where name glob 'A%' limit 1",
      DEFAULT_SQL_OPTIONS,
    );

    expect(mssql.ok).toBe(true);
    expect(clickhouse.ok).toBe(true);
    expect(sqlite.ok).toBe(true);

    if (mssql.ok) {
      expect(mssql.value).toContain('TOP 5');
      expect(mssql.value).toContain('[dbo].[users]');
      expect(mssql.value).toContain('@id');
    }

    if (clickhouse.ok) {
      expect(clickhouse.value.toUpperCase()).toContain('PREWHERE');
      expect(clickhouse.value).toContain('{user}');
      expect(clickhouse.value).toContain('10');
      expect(clickhouse.value).toContain('20');
    }

    if (sqlite.ok) {
      expect(sqlite.value.toUpperCase()).toContain('GLOB');
    }
  });

  it('formats incomplete sql instead of failing', () => {
    const result = formatter.format(
      'select a, b from t where',
      DEFAULT_SQL_OPTIONS,
    );

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.toUpperCase()).toContain('SELECT');
      expect(result.value.toUpperCase()).toContain('WHERE');
    }
  });

  it('formats postgres any-cast and exists subquery', () => {
    const result = formatter.format(
      "SELECT id FROM media WHERE upscale_status = ANY(CAST( '{in_progress}' AS text[])::upscale_status_enum[]) AND NOT EXISTS (SELECT 1 FROM upscale_task WHERE media_id = media.id)",
      DEFAULT_SQL_OPTIONS,
    );

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value).toContain('::');
      expect(result.value.toUpperCase()).toContain('EXISTS');
      expect(result.value).toContain('upscale_status_enum[]');
    }
  });

  it('formats postgres interval literals', () => {
    const result = formatter.format(
      "select now() - interval '4320 hours' from t",
      DEFAULT_SQL_OPTIONS,
    );

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.toUpperCase()).toContain("INTERVAL '4320 HOURS'");
      expect(result.value.toUpperCase()).toContain('FROM');
    }
  });

  it('formats a select with joins, interval and limit', () => {
    const result = formatter.format(
      `
SELECT h.bo_id AS bo_hotel_id
FROM __bucket__.provider_room_kind pr
JOIN __bucket__.hotel h ON h.id = pr.id
WHERE pr.last_received_at > now() - interval '4320 hours'
HAVING count(pr.id) >= 1
ORDER BY pr.last_received_at ASC
LIMIT 100;
      `,
      DEFAULT_SQL_OPTIONS,
    );

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.toUpperCase()).toContain('INTERVAL');
      expect(result.value).toContain('4320 hours');
      expect(result.value.toUpperCase()).toContain('LIMIT');
      expect(result.value).toContain('100');
      expect(result.value.toUpperCase()).toContain('HAVING');
    }
  });
});
