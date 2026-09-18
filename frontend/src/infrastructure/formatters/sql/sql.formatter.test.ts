import { describe, expect, it } from 'vitest';

import { DEFAULT_SQL_OPTIONS } from '@domain/formatter/types';

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

    if (!result.ok) {
      throw new Error(result.error);
    }

    expect(result.value).toBe(expectedQuery);
  });

  it('aligns aliases using the selected indent', () => {
    const result = formatter.format('select a as A, bb as B from t', {
      indent: '2-space',
      keywordCase: 'upper',
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value).toBe(
        ['SELECT', '  a  AS A,', '  bb AS B', 'FROM t'].join('\n'),
      );
    }
  });

  it('rejects empty input', () => {
    const result = formatter.format(' ', DEFAULT_SQL_OPTIONS);

    expect(result.ok).toBe(false);
  });

  it('formats postgres interval literals', () => {
    const result = formatter.format(
      "select now() - interval '4320 hours' from t",
      DEFAULT_SQL_OPTIONS,
    );

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value).toBe(
        ['SELECT', "    NOW() - INTERVAL '4320 hours'", 'FROM t'].join('\n'),
      );
    }
  });

  it('formats a select with joins, interval and limit', () => {
    const result = formatter.format(
      `
SELECT
      h.bo_id                        AS bo_hotel_id,           -- -> поле bo_hotel_id
      pr.room_kind_id                AS room_kind_id,
      pr.id                          AS main_card_id,
      p_main.name                    AS main_gds,
      pr.last_received_at            AS main_last_received
  FROM __bucket__.provider_room_kind pr
  JOIN __bucket__.provider_hotel ph_main  ON ph_main.id  = pr.provider_hotel_id
  JOIN __bucket__.providers p_main        ON p_main.id   = ph_main.provider_id
  JOIN __bucket__.room_kind rk            ON rk.id       = pr.room_kind_id
  JOIN __bucket__.hotel h                 ON h.id        = rk.hotel_id
  JOIN __bucket__.provider_room_kind pr_other
       ON pr_other.room_kind_id = pr.room_kind_id
      AND pr_other.id <> pr.id
      AND pr_other.deleted_at IS NULL
      AND pr_other.is_temp = false
      AND pr_other.temp_room_kind_id = 0
  JOIN __bucket__.provider_hotel ph_other ON ph_other.id = pr_other.provider_hotel_id
  JOIN __bucket__.providers p_other       ON p_other.id  = ph_other.provider_id
  WHERE pr.is_main
    AND pr.deleted_at IS NULL
    AND pr.is_temp = false
    AND pr.temp_room_kind_id = 0
    AND pr.last_received_at > now() - interval '4320 hours'
  GROUP BY h.bo_id, pr.room_kind_id, pr.id, p_main.name, pr.last_received_at
  HAVING count(pr_other.id) >= 1
  ORDER BY pr.last_received_at ASC
  LIMIT 100;
      `,
      DEFAULT_SQL_OPTIONS,
    );

    if (!result.ok) {
      throw new Error(result.error);
    }

    expect(result.value).toContain("NOW() - INTERVAL '4320 hours'");
    expect(result.value).toContain('LIMIT 100');
    expect(result.value).toContain('HAVING COUNT(pr_other.id) >= 1');
  });
});
