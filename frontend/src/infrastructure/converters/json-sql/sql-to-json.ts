/**
 * Преобразует SQL INSERT в JSON-массив объектов
 *
 * @param input Исходный SQL-текст
 */
export function sqlToJson(input: string): string {
  const statements = splitStatements(input);
  const rows: Record<string, unknown>[] = [];

  for (const statement of statements) {
    const parsed = parseInsert(statement);

    if (!parsed) {
      continue;
    }

    rows.push(...parsed);
  }

  if (!rows.length) {
    throw new Error('No INSERT statements found');
  }

  return JSON.stringify(rows, null, 2);
}

function splitStatements(input: string): string[] {
  return input
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseInsert(statement: string): Record<string, unknown>[] | undefined {
  const match = statement.match(
    /^insert\s+into\s+([^\s(]+)\s*(?:\(([^)]*)\))?\s*values\s*([\s\S]+)$/i,
  );

  if (!match) {
    return undefined;
  }

  const columns = match[2]
    ? splitCsv(match[2]).map(unquoteIdentifier)
    : undefined;
  const tuples = splitTuples(match[3]);

  return tuples.map((tuple, index) => {
    const values = splitCsv(tuple.slice(1, -1));

    if (columns && columns.length !== values.length) {
      throw new Error(
        `INSERT column count does not match values in row ${index + 1}`,
      );
    }

    const keys =
      columns ?? values.map((_value, columnIndex) => `col${columnIndex + 1}`);
    const row: Record<string, unknown> = {};

    keys.forEach((key, columnIndex) => {
      row[key] = parseSqlValue(values[columnIndex] ?? 'NULL');
    });

    return row;
  });
}

function splitTuples(source: string): string[] {
  const tuples: string[] = [];
  let depth = 0;
  let start = -1;
  let quote: string | undefined;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];

    if (quote) {
      if (char === quote) {
        if (source[index + 1] === quote) {
          index += 1;
        } else {
          quote = undefined;
        }
      }

      continue;
    }

    if (char === "'" || char === '"') {
      quote = char;

      continue;
    }

    if (char === '(') {
      if (depth === 0) {
        start = index;
      }

      depth += 1;

      continue;
    }

    if (char === ')' && depth > 0) {
      depth -= 1;

      if (depth === 0 && start !== -1) {
        tuples.push(source.slice(start, index + 1));
        start = -1;
      }
    }
  }

  if (!tuples.length) {
    throw new Error('INSERT statement has no VALUES');
  }

  return tuples;
}

function splitCsv(source: string): string[] {
  const items: string[] = [];
  let current = '';
  let quote: string | undefined;
  let depth = 0;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];

    if (quote) {
      current += char;

      if (char === quote) {
        if (source[index + 1] === quote) {
          current += source[index + 1];
          index += 1;
        } else {
          quote = undefined;
        }
      }

      continue;
    }

    if (char === "'" || char === '"') {
      quote = char;
      current += char;

      continue;
    }

    if (char === '(') {
      depth += 1;
      current += char;

      continue;
    }

    if (char === ')' && depth > 0) {
      depth -= 1;
      current += char;

      continue;
    }

    if (char === ',' && depth === 0) {
      items.push(current.trim());
      current = '';

      continue;
    }

    current += char;
  }

  if (current.trim()) {
    items.push(current.trim());
  }

  return items;
}

function unquoteIdentifier(value: string): string {
  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith('`') && trimmed.endsWith('`')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    return trimmed.slice(1, -1).replace(/""/g, '"');
  }

  return trimmed;
}

function parseSqlValue(token: string): unknown {
  const value = token.trim();

  if (/^null$/i.test(value)) {
    return null;
  }

  if (/^true$/i.test(value)) {
    return true;
  }

  if (/^false$/i.test(value)) {
    return false;
  }

  if (/^-?\d+(?:\.\d+)?$/.test(value)) {
    return Number(value);
  }

  if (
    (value.startsWith("'") && value.endsWith("'")) ||
    (value.startsWith('"') && value.endsWith('"'))
  ) {
    const inner = value.slice(1, -1).replace(/''/g, "'").replace(/""/g, '"');

    try {
      return JSON.parse(inner);
    } catch {
      return inner;
    }
  }

  return value;
}
