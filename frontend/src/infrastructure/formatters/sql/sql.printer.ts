/**
 * Imports from domain
 */
import type { SqlFormatOptions } from '@domain/formatter/types';
import { indentString } from '@domain/shared/indent';

/**
 * Imports from relative
 */
import type {
  Assignment,
  BlockStatement,
  CallExpr,
  CallStatement,
  CreateRoutineStatement,
  DeleteStatement,
  InsertStatement,
  JoinClause,
  RoutineBody,
  SelectItem,
  SelectStatement,
  SqlExpr,
  SqlStatement,
  TableRef,
  UpdateStatement,
} from './sql.ast';
import { SQL_FUNCTIONS } from './sql.keywords';

type PrintContext = {
  indent: string;
  options: SqlFormatOptions;
};

/**
 * Печатает разобранные SQL-выражения в каноническом виде
 *
 * @param statements Список разобранных SQL-выражений
 * @param options Настройки форматирования SQL
 */
export function printSql(
  statements: SqlStatement[],
  options: SqlFormatOptions,
): string {
  const ctx: PrintContext = {
    indent: indentString(options.indent),
    options,
  };

  return statements
    .map((statement) => printStatement(statement, ctx))
    .join(';\n\n');
}

function printStatement(statement: SqlStatement, ctx: PrintContext): string {
  switch (statement.type) {
    case 'select':
      return printSelect(statement, ctx);
    case 'insert':
      return printInsert(statement, ctx);
    case 'update':
      return printUpdate(statement, ctx);
    case 'delete':
      return printDelete(statement, ctx);
    case 'create-routine':
      return printCreateRoutine(statement, ctx);
    case 'call-stmt':
      return printCall(statement, ctx);
    case 'return':
      return statement.expr
        ? `${kw(statement.returnKw, ctx)} ${printInline(statement.expr, ctx)}`
        : kw(statement.returnKw, ctx);
    case 'block':
      return printBlock(statement, ctx);
  }
}

function printSelect(statement: SelectStatement, ctx: PrintContext): string {
  const lines: string[] = [];
  const select = statement.distinctKw
    ? `${kw(statement.selectKw, ctx)} ${kw(statement.distinctKw, ctx)}`
    : kw(statement.selectKw, ctx);

  lines.push(select);
  lines.push(...printSelectList(statement.columns, ctx));

  if (statement.from && statement.fromKw) {
    lines.push(`${kw(statement.fromKw, ctx)} ${printTable(statement.from)}`);
  }

  for (const join of statement.joins) {
    lines.push(printJoinHeader(join, ctx));
    lines.push(...printJoinOn(join, ctx));
  }

  if (statement.where && statement.whereKw) {
    lines.push(...printLeadingBool(statement.whereKw, statement.where, ctx));
  }

  if (statement.groupBy.length > 0 && statement.groupByKw) {
    lines.push(
      ...printHangingList(
        `${kw(statement.groupByKw[0], ctx)} ${kw(statement.groupByKw[1], ctx)}`,
        statement.groupBy,
        ctx,
      ),
    );
  }

  if (statement.orderBy.length > 0 && statement.orderByKw) {
    const orderExprs = statement.orderBy.map((item) => {
      const direction = item.directionKw ? ` ${kw(item.directionKw, ctx)}` : '';

      return `${printInline(item.expr, ctx)}${direction}`;
    });

    lines.push(
      ...printHangingText(
        `${kw(statement.orderByKw[0], ctx)} ${kw(statement.orderByKw[1], ctx)}`,
        orderExprs,
      ),
    );
  }

  if (statement.having && statement.havingKw) {
    lines.push(...printLeadingBool(statement.havingKw, statement.having, ctx));
  }

  if (statement.limit && statement.limitKw) {
    lines.push(
      `${kw(statement.limitKw, ctx)} ${printInline(statement.limit, ctx)}`,
    );
  }

  if (statement.offset && statement.offsetKw) {
    lines.push(
      `${kw(statement.offsetKw, ctx)} ${printInline(statement.offset, ctx)}`,
    );
  }

  return lines.join('\n');
}

function printInsert(statement: InsertStatement, ctx: PrintContext): string {
  const into = statement.intoKw ? ` ${kw(statement.intoKw, ctx)}` : '';
  const columns =
    statement.columns.length > 0 ? ` (${statement.columns.join(', ')})` : '';
  const lines = [
    `${kw(statement.insertKw, ctx)}${into} ${printTable(statement.table)}${columns}`,
  ];

  if (statement.select) {
    lines.push(printSelect(statement.select, ctx));

    return lines.join('\n');
  }

  if (statement.values && statement.valuesKw) {
    lines.push(...printValues(statement.valuesKw, statement.values, ctx));
  }

  return lines.join('\n');
}

function printUpdate(statement: UpdateStatement, ctx: PrintContext): string {
  const lines = [
    `${kw(statement.updateKw, ctx)} ${printTable(statement.table)}`,
  ];

  for (const join of statement.joins) {
    lines.push(printJoinHeader(join, ctx));
    lines.push(...printJoinOn(join, ctx));
  }

  if (statement.from && statement.fromKw) {
    lines.push(`${kw(statement.fromKw, ctx)} ${printTable(statement.from)}`);
  }

  lines.push(...printAssignments(statement.setKw, statement.set, ctx));

  if (statement.where && statement.whereKw) {
    lines.push(...printLeadingBool(statement.whereKw, statement.where, ctx));
  }

  return lines.join('\n');
}

function printDelete(statement: DeleteStatement, ctx: PrintContext): string {
  const lines = [
    `${kw(statement.deleteKw, ctx)} ${kw(statement.fromKw, ctx)} ${printTable(statement.table)}`,
  ];

  if (statement.where && statement.whereKw) {
    lines.push(...printLeadingBool(statement.whereKw, statement.where, ctx));
  }

  return lines.join('\n');
}

function printCall(statement: CallStatement, ctx: PrintContext): string {
  const args = statement.args.map((arg) => printInline(arg, ctx)).join(', ');

  return `${kw(statement.callKw, ctx)} ${statement.name.join('.')}(${args})`;
}

function printCreateRoutine(
  statement: CreateRoutineStatement,
  ctx: PrintContext,
): string {
  const head = [
    kw(statement.createKw, ctx),
    statement.orKw ? kw(statement.orKw, ctx) : '',
    statement.replaceKw ? kw(statement.replaceKw, ctx) : '',
    kw(statement.kindKw, ctx),
    statement.name.join('.'),
  ]
    .filter(Boolean)
    .join(' ');

  const lines = [`${head}(${printRoutineParams(statement.params, ctx)})`];

  if (statement.returns && statement.returnsKw) {
    lines.push(`${kw(statement.returnsKw, ctx)} ${statement.returns}`);
  }

  if (statement.language && statement.languageKw) {
    lines.push(`${kw(statement.languageKw, ctx)} ${statement.language}`);
  }

  if (statement.body) {
    lines.push(printRoutineBody(statement.body, ctx));
  }

  return lines.join('\n');
}

function printRoutineParams(
  params: CreateRoutineStatement['params'],
  ctx: PrintContext,
): string {
  if (params.length === 0) {
    return '';
  }

  const printed = params.map((param) => {
    const mode = param.modeKw ? `${kw(param.modeKw, ctx)} ` : '';

    return `${mode}${param.name} ${param.dataType}`;
  });

  if (params.length === 1) {
    return printed[0];
  }

  const inner = printed.map((line) => `${ctx.indent}${line}`).join(',\n');

  return `\n${inner}\n`;
}

function printRoutineBody(body: RoutineBody, ctx: PrintContext): string {
  if (body.type === 'block') {
    return printBlock(body, ctx);
  }

  const inner = body.statements
    ? indentLines(printSql(body.statements, ctx.options), ctx.indent)
    : indentLines(body.source.trim(), ctx.indent);

  if (body.delimiter === "'" || body.delimiter === '"') {
    return `${kw(body.asKw, ctx)} ${body.delimiter}${body.source}${body.delimiter}`;
  }

  return `${kw(body.asKw, ctx)} ${body.delimiter}\n${inner}\n${body.delimiter}`;
}

function printBlock(statement: BlockStatement, ctx: PrintContext): string {
  if (statement.statements.length === 0) {
    return `${kw(statement.beginKw, ctx)}\n${kw(statement.endKw, ctx)}`;
  }

  const inner = statement.statements
    .map((item) => printStatement(item, ctx))
    .join(';\n');

  return `${kw(statement.beginKw, ctx)}\n${indentLines(inner, ctx.indent)}\n${kw(statement.endKw, ctx)}`;
}

function printSelectList(columns: SelectItem[], ctx: PrintContext): string[] {
  const inlineBodies = columns.map((column) =>
    isMultiline(column.expr) ? null : printInline(column.expr, ctx),
  );
  const aliasWidth = Math.max(
    0,
    ...columns.map((column, index) => {
      const body = inlineBodies[index];

      if (!column.alias || body === null) {
        return 0;
      }

      return body.length;
    }),
  );

  return columns.map((column, index) => {
    const comma = index === columns.length - 1 ? '' : ',';
    const asKw = column.asKw ?? 'AS';

    if (inlineBodies[index] === null) {
      const block = printBlockExpr(column.expr, 1, ctx);
      const alias = column.alias ? ` ${kw(asKw, ctx)} ${column.alias}` : '';

      return `${block}${alias}${comma}`;
    }

    const body = inlineBodies[index] ?? '';
    const alias = column.alias
      ? `${body.padEnd(aliasWidth)} ${kw(asKw, ctx)} ${column.alias}`
      : body;

    return `${ctx.indent}${alias}${comma}`;
  });
}

function printJoinHeader(join: JoinClause, ctx: PrintContext): string {
  const kind = join.kind
    .split(' ')
    .map((part) => kw(part, ctx))
    .join(' ');

  return `${kind} ${printTable(join.table)}`;
}

function printJoinOn(join: JoinClause, ctx: PrintContext): string[] {
  if (!join.on || !join.onKw) {
    return [];
  }

  return printLeadingBool(join.onKw, join.on, ctx).map((line, index) =>
    index === 0 ? `${ctx.indent}${line}` : line,
  );
}

function printLeadingBool(
  keyword: string,
  expr: SqlExpr,
  ctx: PrintContext,
): string[] {
  if (expr.type === 'bool') {
    const [first, ...rest] = expr.items;
    const lines = [`${kw(keyword, ctx)} ${printInline(first, ctx)}`];

    for (const item of rest) {
      lines.push(`${ctx.indent}${kw(expr.op, ctx)} ${printInline(item, ctx)}`);
    }

    return lines;
  }

  return [`${kw(keyword, ctx)} ${printInline(expr, ctx)}`];
}

function printHangingList(
  keyword: string,
  items: SqlExpr[],
  ctx: PrintContext,
): string[] {
  return printHangingText(
    keyword,
    items.map((item) => printInline(item, ctx)),
  );
}

function printHangingText(keyword: string, items: string[]): string[] {
  if (items.length === 0) {
    return [];
  }

  const prefix = `${keyword} `;
  const hang = ' '.repeat(prefix.length);
  const [first, ...rest] = items;
  const lines = [`${prefix}${first}${rest.length > 0 ? ',' : ''}`];

  rest.forEach((item, index) => {
    const comma = index === rest.length - 1 ? '' : ',';

    lines.push(`${hang}${item}${comma}`);
  });

  return lines;
}

function printValues(
  valuesKw: string,
  rows: SqlExpr[][],
  ctx: PrintContext,
): string[] {
  const prefix = `${kw(valuesKw, ctx)} `;
  const hang = ' '.repeat(prefix.length);

  return rows.map((row, index) => {
    const comma = index === rows.length - 1 ? '' : ',';
    const body = printValueRow(row, ctx);

    if (index === 0) {
      return `${prefix}${body}${comma}`;
    }

    return `${hang}${body}${comma}`;
  });
}

function printValueRow(row: SqlExpr[], ctx: PrintContext): string {
  if (row.some(isMultiline)) {
    const inner = row
      .map((item, index) => {
        const comma = index === row.length - 1 ? '' : ',';

        if (isMultiline(item)) {
          return `${printBlockExpr(item, 1, ctx)}${comma}`;
        }

        return `${ctx.indent}${printInline(item, ctx)}${comma}`;
      })
      .join('\n');

    return `(\n${inner}\n)`;
  }

  return `(${row.map((item) => printInline(item, ctx)).join(', ')})`;
}

function printAssignments(
  setKw: string,
  items: Assignment[],
  ctx: PrintContext,
): string[] {
  const printed = items.map((item) => {
    const target = item.target.parts.join('.');

    if (isMultiline(item.value)) {
      const value = printBlockExpr(item.value, 1, ctx).replace(
        new RegExp(`^${ctx.indent}`),
        '',
      );

      return `${target} = ${value}`;
    }

    return `${target} = ${printInline(item.value, ctx)}`;
  });

  return printHangingText(kw(setKw, ctx), printed);
}

function printTable(table: TableRef): string {
  const name = table.name.join('.');

  return table.alias ? `${name} ${table.alias}` : name;
}

function printBlockExpr(
  expr: SqlExpr,
  depth: number,
  ctx: PrintContext,
): string {
  const pad = ctx.indent.repeat(depth);

  if (expr.type === 'call' && isMultilineCall(expr)) {
    return printMultilineCall(expr, depth, ctx);
  }

  if (expr.type === 'case') {
    const lines = [
      `${pad}${kw(expr.caseKw, ctx)}${expr.discriminant ? ` ${printInline(expr.discriminant, ctx)}` : ''}`,
    ];

    for (const item of expr.whens) {
      lines.push(
        `${pad}${ctx.indent}${kw(item.whenKw, ctx)} ${printInline(item.when, ctx)} ${kw(item.thenKw, ctx)} ${printInline(item.then, ctx)}`,
      );
    }

    if (expr.elseExpr && expr.elseKw) {
      lines.push(
        `${pad}${ctx.indent}${kw(expr.elseKw, ctx)} ${printInline(expr.elseExpr, ctx)}`,
      );
    }

    lines.push(`${pad}${kw(expr.endKw, ctx)}`);

    return lines.join('\n');
  }

  if (expr.type === 'subquery') {
    const inner = printSelect(expr.select, ctx);
    const innerLines = inner
      .split('\n')
      .map((line) => `${pad}${ctx.indent}${line}`);

    return `${pad}(\n${innerLines.join('\n')}\n${pad})`;
  }

  return `${pad}${printInline(expr, ctx)}`;
}

function printMultilineCall(
  expr: CallExpr,
  depth: number,
  ctx: PrintContext,
): string {
  const pad = ctx.indent.repeat(depth);
  const name = formatFunctionName(expr.name, ctx);
  const [first, ...rest] = expr.args;
  const lines = [
    `${pad}${name}(${first ? printInline(first, ctx) : ''}${rest.length > 0 ? ',' : ''}`,
  ];

  rest.forEach((arg, index) => {
    const comma = index === rest.length - 1 ? '' : ',';

    if (isMultiline(arg)) {
      lines.push(`${printBlockExpr(arg, depth + 1, ctx)}${comma}`);

      return;
    }

    lines.push(
      `${ctx.indent.repeat(depth + 1)}${printInline(arg, ctx)}${comma}`,
    );
  });

  lines.push(`${pad})`);

  return lines.join('\n');
}

function printInline(expr: SqlExpr, ctx: PrintContext): string {
  switch (expr.type) {
    case 'ident':
      return expr.parts.join('.');
    case 'number':
      return expr.value;
    case 'string':
      return expr.value;
    case 'star':
      return '*';
    case 'null':
      return kw(expr.raw, ctx);
    case 'call':
      if (expr.name.toUpperCase() === 'CAST' && expr.args.length === 2) {
        return `${formatFunctionName(expr.name, ctx)}(${printInline(expr.args[0], ctx)} ${kw('AS', ctx)} ${printInline(expr.args[1], ctx)})`;
      }

      return `${formatFunctionName(expr.name, ctx)}(${expr.args.map((arg) => printInline(arg, ctx)).join(', ')})`;
    case 'binary':
      return `${printInline(expr.left, ctx)} ${printWordOp(expr.op, ctx)} ${printInline(expr.right, ctx)}`;
    case 'unary':
      return isWordOp(expr.op)
        ? `${kw(expr.op, ctx)} ${printInline(expr.expr, ctx)}`
        : `${expr.op}${printInline(expr.expr, ctx)}`;
    case 'bool':
      return expr.items
        .map((item) => printInline(item, ctx))
        .join(` ${kw(expr.op, ctx)} `);
    case 'in':
      return `${printInline(expr.expr, ctx)} ${expr.notKw ? `${kw(expr.notKw, ctx)} ` : ''}${kw(expr.inKw, ctx)} (${expr.values.map((item) => printInline(item, ctx)).join(', ')})`;
    case 'between':
      return `${printInline(expr.expr, ctx)} ${expr.notKw ? `${kw(expr.notKw, ctx)} ` : ''}${kw(expr.betweenKw, ctx)} ${printInline(expr.from, ctx)} ${kw(expr.andKw, ctx)} ${printInline(expr.to, ctx)}`;
    case 'is-null':
      return `${printInline(expr.expr, ctx)} ${kw(expr.isKw, ctx)}${expr.notKw ? ` ${kw(expr.notKw, ctx)}` : ''} ${kw(expr.nullKw, ctx)}`;
    case 'case':
      return [
        `${kw(expr.caseKw, ctx)}${expr.discriminant ? ` ${printInline(expr.discriminant, ctx)}` : ''}`,
        ...expr.whens.map(
          (item) =>
            `${kw(item.whenKw, ctx)} ${printInline(item.when, ctx)} ${kw(item.thenKw, ctx)} ${printInline(item.then, ctx)}`,
        ),
        expr.elseExpr && expr.elseKw
          ? `${kw(expr.elseKw, ctx)} ${printInline(expr.elseExpr, ctx)}`
          : '',
        kw(expr.endKw, ctx),
      ]
        .filter(Boolean)
        .join(' ');
    case 'subquery':
      return `(${printInlineSelect(expr.select, ctx)})`;
    case 'paren':
      return `(${printInline(expr.expr, ctx)})`;
    case 'interval':
      return `${kw(expr.intervalKw, ctx)} ${printInline(expr.value, ctx)}${expr.unit ? ` ${kw(expr.unit, ctx)}` : ''}`;
    case 'cast-pg':
      return `${printInline(expr.expr, ctx)}::${expr.typeName.join('.')}`;
  }
}

function printInlineSelect(select: SelectStatement, ctx: PrintContext): string {
  const columns = select.columns
    .map((item) =>
      item.alias
        ? `${printInline(item.expr, ctx)} ${kw(item.asKw ?? 'AS', ctx)} ${item.alias}`
        : printInline(item.expr, ctx),
    )
    .join(', ');
  const from =
    select.from && select.fromKw
      ? ` ${kw(select.fromKw, ctx)} ${printTable(select.from)}`
      : '';

  return `${kw(select.selectKw, ctx)} ${columns}${from}`;
}

function isMultiline(expr: SqlExpr): boolean {
  if (expr.type === 'case' || expr.type === 'subquery') {
    return true;
  }

  if (expr.type === 'call') {
    return isMultilineCall(expr);
  }

  if (expr.type === 'paren') {
    return isMultiline(expr.expr);
  }

  return false;
}

function isMultilineCall(expr: CallExpr): boolean {
  if (expr.name.toUpperCase() === 'IF') {
    return true;
  }

  return expr.args.some(isMultiline);
}

function formatFunctionName(name: string, ctx: PrintContext): string {
  const upper = name.toUpperCase();

  if (!SQL_FUNCTIONS.has(upper)) {
    return name;
  }

  return kw(name, ctx);
}

function printWordOp(op: string, ctx: PrintContext): string {
  return isWordOp(op) ? kw(op, ctx) : op;
}

function isWordOp(op: string): boolean {
  return /^[A-Za-z]+$/.test(op);
}

function kw(raw: string, ctx: PrintContext): string {
  switch (ctx.options.keywordCase) {
    case 'lower':
      return raw.toLowerCase();
    case 'preserve':
      return raw;
    default:
      return raw.toUpperCase();
  }
}

function indentLines(text: string, pad: string): string {
  return text
    .split('\n')
    .map((line) => (line.length > 0 ? `${pad}${line}` : line))
    .join('\n');
}
