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
  const selectParts = [kw(statement.selectKw, ctx)];

  if (statement.distinctKw) {
    selectParts.push(kw(statement.distinctKw, ctx));
  }

  if (statement.topKw && statement.top) {
    selectParts.push(
      `${kw(statement.topKw, ctx)} ${printInline(statement.top, ctx)}`,
    );
  }

  lines.push(selectParts.join(' '));
  lines.push(...printSelectList(statement.columns, ctx));

  if (statement.from && statement.fromKw) {
    lines.push(`${kw(statement.fromKw, ctx)} ${printTable(statement.from)}`);
  }

  for (const join of statement.joins) {
    lines.push(printJoinHeader(join, ctx));
    lines.push(...printJoinOn(join, ctx));
  }

  if (statement.prewhere && statement.prewhereKw) {
    lines.push(
      ...printLeadingBool(statement.prewhereKw, statement.prewhere, ctx),
    );
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
    const limitValue =
      statement.limitComma && statement.offset
        ? `${printInline(statement.limit, ctx)}, ${printInline(statement.offset, ctx)}`
        : printInline(statement.limit, ctx);

    lines.push(`${kw(statement.limitKw, ctx)} ${limitValue}`);
  }

  if (statement.offset && statement.offsetKw && !statement.limitComma) {
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
  if (join.usingKw && join.using && join.using.length > 0) {
    return [`${ctx.indent}${kw(join.usingKw, ctx)} (${join.using.join(', ')})`];
  }

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
    const lines = attachClause(
      `${kw(keyword, ctx)} `,
      printClauseItem(first, ctx, ''),
    );

    for (const item of rest) {
      lines.push(
        ...attachClause(
          `${ctx.indent}${kw(expr.op, ctx)} `,
          printClauseItem(item, ctx, ctx.indent),
        ),
      );
    }

    return lines;
  }

  return attachClause(`${kw(keyword, ctx)} `, printClauseItem(expr, ctx, ''));
}

function attachClause(prefix: string, lines: string[]): string[] {
  const [first, ...rest] = lines;

  return [`${prefix}${first ?? ''}`, ...rest];
}

function printClauseItem(
  expr: SqlExpr,
  ctx: PrintContext,
  pad: string,
): string[] {
  if (!containsSubquery(expr)) {
    return [printInline(expr, ctx)];
  }

  return layoutExpr(expr, ctx, pad);
}

function layoutExpr(expr: SqlExpr, ctx: PrintContext, pad: string): string[] {
  if (expr.type === 'paren') {
    const inner = layoutExpr(expr.expr, ctx, `${pad}${ctx.indent}`);

    return ['(', ...inner, `${pad})`];
  }

  if (expr.type === 'bool') {
    const lines: string[] = [];

    expr.items.forEach((item, index) => {
      const itemLines = layoutExpr(item, ctx, pad);
      const op = index === 0 ? '' : `${kw(expr.op, ctx)} `;

      lines.push(`${pad}${op}${itemLines[0] ?? ''}`, ...itemLines.slice(1));
    });

    return lines;
  }

  if (expr.type === 'unary' && containsSubquery(expr.expr)) {
    const inner = layoutExpr(expr.expr, ctx, pad);

    return [`${kw(expr.op, ctx)} ${inner[0] ?? ''}`, ...inner.slice(1)];
  }

  if (expr.type === 'exists') {
    const body = printSelect(expr.select, ctx)
      .split('\n')
      .map((line) => `${pad}${ctx.indent}${line}`);

    return [`${kw(expr.existsKw, ctx)} (`, ...body, `${pad})`];
  }

  return [printInline(expr, ctx)];
}

function containsSubquery(expr: SqlExpr): boolean {
  switch (expr.type) {
    case 'subquery':
    case 'exists':
      return true;
    case 'paren':
    case 'unary':
    case 'cast-pg':
      return containsSubquery(expr.expr);
    case 'bool':
      return expr.items.some(containsSubquery);
    case 'binary':
      return containsSubquery(expr.left) || containsSubquery(expr.right);
    case 'call':
      return expr.args.some(containsSubquery);
    case 'in':
      return containsSubquery(expr.expr) || expr.values.some(containsSubquery);
    case 'between':
      return (
        containsSubquery(expr.expr) ||
        containsSubquery(expr.from) ||
        containsSubquery(expr.to)
      );
    case 'case':
      return (
        (expr.discriminant ? containsSubquery(expr.discriminant) : false) ||
        expr.whens.some(
          (item) => containsSubquery(item.when) || containsSubquery(item.then),
        ) ||
        (expr.elseExpr ? containsSubquery(expr.elseExpr) : false)
      );
    default:
      return false;
  }
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

  if (expr.type === 'exists') {
    const inner = printSelect(expr.select, ctx);
    const innerLines = inner
      .split('\n')
      .map((line) => `${pad}${ctx.indent}${line}`);

    return `${pad}${kw(expr.existsKw, ctx)} (\n${innerLines.join('\n')}\n${pad})`;
  }

  if (expr.type === 'unary' && isMultiline(expr.expr)) {
    const inner = printBlockExpr(expr.expr, depth, ctx);
    const [first, ...rest] = inner.split('\n');
    const body = first.startsWith(pad) ? first.slice(pad.length) : first;

    return [`${pad}${kw(expr.op, ctx)} ${body}`, ...rest].join('\n');
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
    case 'placeholder':
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

      if (isQuantifiedSubquery(expr)) {
        const arg = expr.args[0];

        if (arg.type === 'subquery') {
          return `${formatFunctionName(expr.name, ctx)}(${printInlineSelect(arg.select, ctx)})`;
        }
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
    case 'exists':
      return `${kw(expr.existsKw, ctx)} (${printInlineSelect(expr.select, ctx)})`;
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
  if (
    expr.type === 'case' ||
    expr.type === 'subquery' ||
    expr.type === 'exists'
  ) {
    return true;
  }

  if (expr.type === 'call') {
    return isMultilineCall(expr);
  }

  if (expr.type === 'paren' || expr.type === 'unary') {
    return isMultiline(expr.expr);
  }

  return false;
}

function isMultilineCall(expr: CallExpr): boolean {
  if (isQuantifiedSubquery(expr)) {
    return false;
  }

  if (expr.name.toUpperCase() === 'IF') {
    return true;
  }

  return expr.args.some(isMultiline);
}

function isQuantifiedSubquery(expr: CallExpr): boolean {
  const name = expr.name.toUpperCase();
  const arg = expr.args[0];

  return (
    (name === 'ANY' || name === 'ALL' || name === 'SOME') &&
    expr.args.length === 1 &&
    arg?.type === 'subquery'
  );
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
