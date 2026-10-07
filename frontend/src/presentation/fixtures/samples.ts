/**
 * Imports from domain
 */
import type { ConverterId } from '@domain/converter/types';
import type { FormatterId } from '@domain/formatter/types';
import type { ViewerId } from '@domain/viewer/types';

const MARKDOWN_SAMPLE = `# Release notes

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
`;

const JSON_SAMPLE = `[
  { "id": 1, "name": "Ada", "active": true },
  { "id": 2, "name": "Grace", "active": false }
]`;

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
 * Примеры исходного текста для конвертеров
 */
export const CONVERT_SAMPLES: Record<ConverterId, string> = {
  'markdown-jira': MARKDOWN_SAMPLE,
  'jira-markdown': `h1. Release notes

Ship *Markdown* to Jira.

* Nested
** lists
* [Docs|https://example.com]

{code:ts}
const ready = true;
{code}

||Step||Status||
|Convert|*ok*|
`,
  'markdown-html': MARKDOWN_SAMPLE,
  'html-markdown': `<h1>Release notes</h1>
<p>Ship <strong>Markdown</strong> to HTML.</p>
<ul>
  <li>Nested
    <ul>
      <li>lists</li>
    </ul>
  </li>
  <li><a href="https://example.com">Docs</a></li>
</ul>
<pre><code class="language-ts">const ready = true;</code></pre>
`,
  'json-yaml': JSON_SAMPLE,
  'yaml-json': `users:
  - id: 1
    name: Ada
    active: true
  - id: 2
    name: Grace
    active: false
`,
  'json-sql': JSON_SAMPLE,
  'sql-json': `INSERT INTO "data" ("id", "name", "active")
VALUES
  (1, 'Ada', TRUE),
  (2, 'Grace', FALSE);
`,
};

/**
 * Примеры исходного текста для просмотрщиков
 */
export const VIEW_SAMPLES: Record<ViewerId, string> = {
  markdown: `# Release notes

## Shipping

### Status

Ship **Markdown** to the preview.

- Nested
  - lists
- [Docs](https://example.com)

\`\`\`ts
const ready = true;
\`\`\`

| Step | Status |
| --- | --- |
| Render | **ok** |
`,
};
