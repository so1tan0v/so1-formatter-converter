/**
 * Imports from domain
 */
import type { ConverterId } from '@domain/converter/types';
import type { FormatterId } from '@domain/formatter/types';

/**
 * Примеры исходного текста для каждого форматтера
 */
export const SAMPLE_SOURCES: Record<FormatterId, string> = {
  json: `{
  zeta: 'Привет',
  key: 'Value',
  empty: null,
  nested: { ok: true, count: 3 },
}`,
  yaml: `service: tonus
enabled: true
ports:
  - 8080
  - 8443`,
  sql: `select key, key2 as SOMEKEY, key3 as SOMEKEY2, key4,
if(key1 == 1, 1, 0),
if(key1 == 1, if(key1 == 1, 1, 0), 0)
from table a
inner join joinTABLE b on a.id = b.id and a.sex is null
where 1=1 and key1 = 'some'
group by key2, key3
order by key, key4
having SOMEKEY = 1 and key = 1`,
};

/**
 * Примеры исходного текста для доступных конвертеров
 */
export const CONVERT_SAMPLES: Partial<Record<ConverterId, string>> = {
  'markdown-jira': `# Release notes

Ship **Markdown** to Jira.

- Nested
  - lists
- [Docs](https://example.com)

\`\`\`ts
const ready = true;
\`\`\`

| Step | Status |
| --- | --- |
| Convert | **ok** |
`,
};
