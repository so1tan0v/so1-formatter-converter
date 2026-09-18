import type {
  Assignment,
  BlockStatement,
  CallExpr,
  CallStatement,
  CreateRoutineStatement,
  DeleteStatement,
  InsertStatement,
  JoinClause,
  OrderItem,
  ReturnStatement,
  RoutineBody,
  RoutineParam,
  SelectItem,
  SelectStatement,
  SqlExpr,
  SqlStatement,
  TableRef,
  UpdateStatement,
} from './sql.ast';
import { CLAUSE_STARTERS } from './sql.keywords';
import type { Token } from './sql.keywords';
import { tokenizeSql } from './sql.tokenizer';

const INTERVAL_UNITS = new Set([
  'YEAR',
  'YEARS',
  'MONTH',
  'MONTHS',
  'WEEK',
  'WEEKS',
  'DAY',
  'DAYS',
  'HOUR',
  'HOURS',
  'MINUTE',
  'MINUTES',
  'SECOND',
  'SECONDS',
]);

export function parseSql(input: string): SqlStatement[] {
  const tokens = tokenizeSql(input);
  const parser = new SqlParser(tokens);
  const statements = parser.parseScript();

  parser.expectEof();

  return statements;
}

export function tryParseSql(input: string): SqlStatement[] | undefined {
  const source = input.trim();

  if (!source) {
    return undefined;
  }

  try {
    return parseSql(source);
  } catch {
    return undefined;
  }
}

class SqlParser {
  private index = 0;
  private readonly tokens: Token[];

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parseScript(): SqlStatement[] {
    const statements: SqlStatement[] = [];

    while (!this.at('eof') && !this.atKeyword('END')) {
      this.skipSemicolon();

      if (this.at('eof') || this.atKeyword('END')) {
        break;
      }

      statements.push(this.parseStatement());
      this.skipSemicolon();
    }

    if (statements.length === 0) {
      throw new Error('Expected SQL statement');
    }

    return statements;
  }

  parseSelect(): SelectStatement {
    const selectKw = this.expectKeyword('SELECT');
    const distinctKw = this.matchKeyword('DISTINCT');
    const columns = this.parseSelectList();

    let fromKw: string | undefined;
    let from: TableRef | undefined;
    const joins: JoinClause[] = [];

    if (this.atKeyword('FROM')) {
      fromKw = this.expectKeyword('FROM');
      from = this.parseTable();

      while (this.isJoinStart()) {
        joins.push(this.parseJoin());
      }
    }

    let whereKw: string | undefined;
    let where: SqlExpr | undefined;
    let groupByKw: [string, string] | undefined;
    let groupBy: SqlExpr[] = [];
    let havingKw: string | undefined;
    let having: SqlExpr | undefined;
    let orderByKw: [string, string] | undefined;
    const orderBy: OrderItem[] = [];
    let limitKw: string | undefined;
    let limit: SqlExpr | undefined;
    let offsetKw: string | undefined;
    let offset: SqlExpr | undefined;
    let parsingClauses = true;

    while (parsingClauses) {
      if (!where && this.atKeyword('WHERE')) {
        whereKw = this.expectKeyword('WHERE');
        where = this.parseExpr();
        continue;
      }

      if (groupBy.length === 0 && this.atKeyword('GROUP')) {
        const groupKw = this.expectKeyword('GROUP');
        const byKw = this.expectKeyword('BY');
        groupByKw = [groupKw, byKw];
        groupBy = this.parseExprList();
        continue;
      }

      if (!having && this.atKeyword('HAVING')) {
        havingKw = this.expectKeyword('HAVING');
        having = this.parseExpr();
        continue;
      }

      if (orderBy.length === 0 && this.atKeyword('ORDER')) {
        const orderKw = this.expectKeyword('ORDER');
        const byKw = this.expectKeyword('BY');
        orderByKw = [orderKw, byKw];
        orderBy.push(...this.parseOrderList());
        continue;
      }

      if (!limit && this.atKeyword('LIMIT')) {
        limitKw = this.expectKeyword('LIMIT');
        limit = this.parseExpr();
        continue;
      }

      if (!offset && this.atKeyword('OFFSET')) {
        offsetKw = this.expectKeyword('OFFSET');
        offset = this.parseExpr();
        continue;
      }

      parsingClauses = false;
    }

    return {
      type: 'select',
      selectKw,
      distinctKw,
      columns,
      fromKw,
      from,
      joins,
      whereKw,
      where,
      groupByKw,
      groupBy,
      havingKw,
      having,
      orderByKw,
      orderBy,
      limitKw,
      limit,
      offsetKw,
      offset,
    };
  }

  skipSemicolon(): void {
    this.matchPunct(';');
  }

  expectEof(): void {
    if (!this.at('eof')) {
      const token = this.peek();
      throw new Error(
        `Unexpected token "${token.raw}" at position ${token.pos}`,
      );
    }
  }

  private parseStatement(): SqlStatement {
    if (this.atKeyword('SELECT')) {
      return this.parseSelect();
    }

    if (this.atKeyword('INSERT')) {
      return this.parseInsert();
    }

    if (this.atKeyword('UPDATE')) {
      return this.parseUpdate();
    }

    if (this.atKeyword('DELETE')) {
      return this.parseDelete();
    }

    if (this.atKeyword('CREATE')) {
      return this.parseCreateRoutine();
    }

    if (this.atKeyword('CALL')) {
      return this.parseCall();
    }

    if (this.atKeyword('RETURN')) {
      return this.parseReturn();
    }

    if (this.atKeyword('BEGIN')) {
      return this.parseBlock();
    }

    const token = this.peek();
    throw new Error(
      `Unexpected token "${token.raw}" at position ${token.pos}`,
    );
  }

  private parseInsert(): InsertStatement {
    const insertKw = this.expectKeyword('INSERT');
    const intoKw = this.matchKeyword('INTO');
    const table = this.parseTable();
    const columns: string[] = [];

    if (this.matchPunct('(')) {
      do {
        columns.push(this.expectIdentOrQuoted());
      } while (this.matchPunct(','));

      this.expectPunct(')');
    }

    if (this.atKeyword('SELECT')) {
      return {
        type: 'insert',
        insertKw,
        intoKw,
        table,
        columns,
        select: this.parseSelect(),
      };
    }

    const valuesKw = this.expectKeyword('VALUES');
    const values: SqlExpr[][] = [];

    do {
      this.expectPunct('(');
      values.push(this.parseExprList());
      this.expectPunct(')');
    } while (this.matchPunct(','));

    return {
      type: 'insert',
      insertKw,
      intoKw,
      table,
      columns,
      valuesKw,
      values,
    };
  }

  private parseUpdate(): UpdateStatement {
    const updateKw = this.expectKeyword('UPDATE');
    const table = this.parseTable();
    const joins: JoinClause[] = [];
    let fromKw: string | undefined;
    let from: TableRef | undefined;
    let setKw: string | undefined;
    let set: Assignment[] = [];
    let whereKw: string | undefined;
    let where: SqlExpr | undefined;
    let parsing = true;

    while (parsing) {
      if (set.length === 0 && this.atKeyword('SET')) {
        setKw = this.expectKeyword('SET');
        set = this.parseAssignments();
        continue;
      }

      if (!from && this.atKeyword('FROM')) {
        fromKw = this.expectKeyword('FROM');
        from = this.parseTable();

        while (this.isJoinStart()) {
          joins.push(this.parseJoin());
        }

        continue;
      }

      if (this.isJoinStart()) {
        joins.push(this.parseJoin());
        continue;
      }

      if (!where && this.atKeyword('WHERE')) {
        whereKw = this.expectKeyword('WHERE');
        where = this.parseExpr();
        continue;
      }

      parsing = false;
    }

    if (!setKw || set.length === 0) {
      const token = this.peek();
      throw new Error(`Expected SET at position ${token.pos}`);
    }

    return {
      type: 'update',
      updateKw,
      table,
      joins,
      fromKw,
      from,
      setKw,
      set,
      whereKw,
      where,
    };
  }

  private parseDelete(): DeleteStatement {
    const deleteKw = this.expectKeyword('DELETE');
    const fromKw = this.expectKeyword('FROM');
    const table = this.parseTable();
    let whereKw: string | undefined;
    let where: SqlExpr | undefined;

    if (this.atKeyword('WHERE')) {
      whereKw = this.expectKeyword('WHERE');
      where = this.parseExpr();
    }

    return {
      type: 'delete',
      deleteKw,
      fromKw,
      table,
      whereKw,
      where,
    };
  }

  private parseCall(): CallStatement {
    const callKw = this.expectKeyword('CALL');
    const name = this.parseIdentPath();
    this.expectPunct('(');
    const args = this.atPunct(')') ? [] : this.parseExprList();
    this.expectPunct(')');

    return { type: 'call-stmt', callKw, name, args };
  }

  private parseReturn(): ReturnStatement {
    const returnKw = this.expectKeyword('RETURN');
    const expr = this.atStatementBoundary() ? undefined : this.parseExpr();

    return { type: 'return', returnKw, expr };
  }

  private parseBlock(): BlockStatement {
    const beginKw = this.expectKeyword('BEGIN');
    const statements: SqlStatement[] = [];

    while (!this.at('eof') && !this.atKeyword('END')) {
      this.skipSemicolon();

      if (this.at('eof') || this.atKeyword('END')) {
        break;
      }

      statements.push(this.parseStatement());
      this.skipSemicolon();
    }

    const endKw = this.expectKeyword('END');

    return { type: 'block', beginKw, statements, endKw };
  }

  private parseCreateRoutine(): CreateRoutineStatement {
    const createKw = this.expectKeyword('CREATE');
    const orKw = this.atKeyword('OR') ? this.expectKeyword('OR') : undefined;
    const replaceKw = orKw ? this.expectKeyword('REPLACE') : undefined;

    let kind: 'FUNCTION' | 'PROCEDURE';
    let kindKw: string;

    if (this.atKeyword('FUNCTION')) {
      kind = 'FUNCTION';
      kindKw = this.expectKeyword('FUNCTION');
    } else if (this.atKeyword('PROCEDURE')) {
      kind = 'PROCEDURE';
      kindKw = this.expectKeyword('PROCEDURE');
    } else {
      const token = this.peek();
      throw new Error(
        `Expected FUNCTION or PROCEDURE at position ${token.pos}, got "${token.raw}"`,
      );
    }

    const name = this.parseIdentPath();
    this.expectPunct('(');
    const params = this.parseRoutineParams();
    this.expectPunct(')');

    let returnsKw: string | undefined;
    let returns: string | undefined;
    let languageKw: string | undefined;
    let language: string | undefined;
    let body: RoutineBody | undefined;
    let parsing = true;

    while (parsing) {
      if (!returns && this.atKeyword('RETURNS')) {
        returnsKw = this.expectKeyword('RETURNS');
        returns = this.parseDataType();
        continue;
      }

      if (!language && this.atKeyword('LANGUAGE')) {
        languageKw = this.expectKeyword('LANGUAGE');
        language = this.expectIdentOrQuoted();
        continue;
      }

      if (this.matchKeyword('DETERMINISTIC')) {
        continue;
      }

      if (this.matchSequence(['NOT', 'DETERMINISTIC'])) {
        continue;
      }

      if (!body && this.atKeyword('AS')) {
        body = this.parseRoutineStringBody();
        continue;
      }

      if (!body && this.atKeyword('BEGIN')) {
        body = this.parseBlock();
        continue;
      }

      parsing = false;
    }

    return {
      type: 'create-routine',
      createKw,
      orKw,
      replaceKw,
      kindKw,
      kind,
      name,
      params,
      returnsKw,
      returns,
      languageKw,
      language,
      body,
    };
  }

  private parseRoutineStringBody(): Extract<RoutineBody, { type: 'string' }> {
    const asKw = this.expectKeyword('AS');
    const token = this.peek();

    if (token.type !== 'string') {
      throw new Error(
        `Expected function body string at position ${token.pos}, got "${token.raw}"`,
      );
    }

    this.eat();
    const { delimiter, source } = splitRoutineString(token.raw);

    return {
      type: 'string',
      asKw,
      delimiter,
      source,
      statements: tryParseSql(source),
    };
  }

  private parseRoutineParams(): RoutineParam[] {
    if (this.atPunct(')')) {
      return [];
    }

    const params: RoutineParam[] = [];

    do {
      params.push(this.parseRoutineParam());
    } while (this.matchPunct(','));

    return params;
  }

  private parseRoutineParam(): RoutineParam {
    const modeKw = this.matchParamMode();
    const name = this.expectIdentOrQuoted();
    const dataType = this.parseDataType();

    return { modeKw, name, dataType };
  }

  private matchParamMode(): string | undefined {
    if (this.atKeyword('INOUT') || this.atKeyword('OUT')) {
      return this.eat().raw;
    }

    if (!this.atKeyword('IN')) {
      return undefined;
    }

    const next = this.tokens[this.index + 1];
    const after = this.tokens[this.index + 2];

    if (!next || !this.isIdentLikeToken(next)) {
      return undefined;
    }

    if (
      after &&
      (this.isIdentLikeToken(after) ||
        (after.type === 'punct' && after.value === '('))
    ) {
      return this.eat().raw;
    }

    return undefined;
  }

  private parseDataType(): string {
    const parts = [this.expectIdentOrQuoted()];

    while (
      this.atIdentLike() &&
      !this.atRoutineClause() &&
      !this.atPunct(',') &&
      !this.atPunct(')')
    ) {
      parts.push(this.expectIdentOrQuoted());
    }

    let dataType = parts.join(' ');

    if (this.matchPunct('(')) {
      const args: string[] = [];

      do {
        args.push(this.eat().raw);
      } while (this.matchPunct(','));

      this.expectPunct(')');
      dataType += `(${args.join(', ')})`;
    }

    return dataType;
  }

  private parseAssignments(): Assignment[] {
    const items: Assignment[] = [];

    do {
      const parts = this.parseIdentPath();

      if (!this.matchOp('=')) {
        const token = this.peek();
        throw new Error(
          `Expected "=" at position ${token.pos}, got "${token.raw}"`,
        );
      }

      items.push({
        target: { type: 'ident', parts },
        value: this.parseExpr(),
      });
    } while (this.matchPunct(','));

    return items;
  }

  private parseSelectList(): SelectItem[] {
    const items: SelectItem[] = [];

    do {
      const expr = this.parseExpr();
      items.push({ expr, ...this.parseOptionalAlias() });
    } while (this.matchPunct(','));

    return items;
  }

  private parseOptionalAlias(): { alias?: string; asKw?: string } {
    const asKw = this.matchKeyword('AS');

    if (asKw) {
      return { asKw, alias: this.expectIdentOrQuoted() };
    }

    if (this.atIdentLike() && !this.atClauseStarter()) {
      return { alias: this.expectIdentOrQuoted() };
    }

    return {};
  }

  private parseTable(): TableRef {
    const name = this.parseIdentPath();
    const alias = this.parseOptionalAlias().alias;

    return { name, alias };
  }

  private parseJoin(): JoinClause {
    const kindParts: string[] = [];

    while (
      this.matchKeyword('INNER') ||
      this.matchKeyword('LEFT') ||
      this.matchKeyword('RIGHT') ||
      this.matchKeyword('FULL') ||
      this.matchKeyword('CROSS') ||
      this.matchKeyword('OUTER')
    ) {
      kindParts.push(this.prev().raw);
    }

    kindParts.push(this.expectKeyword('JOIN'));

    const table = this.parseTable();
    const onKw = this.matchKeyword('ON');
    const on = onKw ? this.parseExpr() : undefined;

    if (this.matchKeyword('USING')) {
      throw new Error('USING joins are not supported yet');
    }

    return {
      kind: kindParts.join(' '),
      table,
      onKw,
      on,
    };
  }

  private parseOrderList(): OrderItem[] {
    const items: OrderItem[] = [];

    do {
      const expr = this.parseExpr();
      const directionKw =
        this.matchKeyword('ASC') ?? this.matchKeyword('DESC');

      items.push({ expr, directionKw });
    } while (this.matchPunct(','));

    return items;
  }

  private parseExprList(): SqlExpr[] {
    const items: SqlExpr[] = [];

    do {
      items.push(this.parseExpr());
    } while (this.matchPunct(','));

    return items;
  }

  private parseExpr(): SqlExpr {
    return this.parseOr();
  }

  private parseOr(): SqlExpr {
    const items = [this.parseAnd()];
    let op = '';

    while (this.atKeyword('OR')) {
      op = this.expectKeyword('OR');
      items.push(this.parseAnd());
    }

    if (items.length === 1) {
      return items[0];
    }

    return { type: 'bool', op, items };
  }

  private parseAnd(): SqlExpr {
    const items = [this.parseNot()];
    let op = '';

    while (this.atKeyword('AND')) {
      op = this.expectKeyword('AND');
      items.push(this.parseNot());
    }

    if (items.length === 1) {
      return items[0];
    }

    return { type: 'bool', op, items };
  }

  private parseNot(): SqlExpr {
    const op = this.matchKeyword('NOT');

    if (op) {
      return { type: 'unary', op, expr: this.parseNot() };
    }

    return this.parseComparison();
  }

  private parseComparison(): SqlExpr {
    const left = this.parseConcat();

    if (this.atKeyword('IS')) {
      const isKw = this.expectKeyword('IS');
      const notKw = this.matchKeyword('NOT');
      const nullKw = this.expectKeyword('NULL');

      return { type: 'is-null', isKw, notKw, nullKw, expr: left };
    }

    if (this.atKeyword('NOT') && this.tokens[this.index + 1]?.value === 'IN') {
      const notKw = this.expectKeyword('NOT');
      const inKw = this.expectKeyword('IN');

      return this.parseInList(left, inKw, notKw);
    }

    if (this.atKeyword('IN')) {
      return this.parseInList(left, this.expectKeyword('IN'));
    }

    if (
      this.atKeyword('NOT') &&
      this.tokens[this.index + 1]?.value === 'BETWEEN'
    ) {
      const notKw = this.expectKeyword('NOT');
      const betweenKw = this.expectKeyword('BETWEEN');

      return this.parseBetween(left, betweenKw, notKw);
    }

    if (this.atKeyword('BETWEEN')) {
      return this.parseBetween(left, this.expectKeyword('BETWEEN'));
    }

    if (this.matchKeyword('LIKE') || this.matchKeyword('ILIKE')) {
      return {
        type: 'binary',
        op: this.prev().raw,
        left,
        right: this.parseConcat(),
      };
    }

    if (
      this.matchOp('=') ||
      this.matchOp('==') ||
      this.matchOp('!=') ||
      this.matchOp('<>') ||
      this.matchOp('<') ||
      this.matchOp('>') ||
      this.matchOp('<=') ||
      this.matchOp('>=')
    ) {
      return {
        type: 'binary',
        op: this.prev().value,
        left,
        right: this.parseConcat(),
      };
    }

    return left;
  }

  private parseConcat(): SqlExpr {
    let left = this.parseAdd();

    while (this.matchOp('||')) {
      left = { type: 'binary', op: '||', left, right: this.parseAdd() };
    }

    return left;
  }

  private parseAdd(): SqlExpr {
    let left = this.parseMul();

    while (this.matchOp('+') || this.matchOp('-')) {
      const op = this.prev().value;
      left = { type: 'binary', op, left, right: this.parseMul() };
    }

    return left;
  }

  private parseMul(): SqlExpr {
    let left = this.parseUnary();

    while (this.matchOp('*') || this.matchOp('/') || this.matchOp('%')) {
      const op = this.prev().value;
      left = { type: 'binary', op, left, right: this.parseUnary() };
    }

    return left;
  }

  private parseUnary(): SqlExpr {
    if (this.matchOp('+') || this.matchOp('-')) {
      return { type: 'unary', op: this.prev().value, expr: this.parseUnary() };
    }

    return this.parsePostfix();
  }

  private parsePostfix(): SqlExpr {
    let expr = this.parsePrimary();

    while (this.matchOp('::')) {
      expr = {
        type: 'cast-pg',
        expr,
        typeName: this.parseIdentPath(),
      };
    }

    return expr;
  }

  private parsePrimary(): SqlExpr {
    if (this.atKeyword('NULL')) {
      return { type: 'null', raw: this.expectKeyword('NULL') };
    }

    if (this.atKeyword('TRUE') || this.atKeyword('FALSE')) {
      return { type: 'ident', parts: [this.eat().raw] };
    }

    if (this.atKeyword('INTERVAL')) {
      return this.parseInterval();
    }

    if (this.atKeyword('CASE')) {
      return this.parseCase(this.expectKeyword('CASE'));
    }

    if (this.matchOp('*')) {
      return { type: 'star' };
    }

    if (this.matchPunct('(')) {
      if (this.atKeyword('SELECT')) {
        const select = this.parseSelect();
        this.expectPunct(')');

        return { type: 'subquery', select };
      }

      const expr = this.parseExpr();
      this.expectPunct(')');

      return { type: 'paren', expr };
    }

    if (this.at('number')) {
      return { type: 'number', value: this.eat().value };
    }

    if (this.at('string')) {
      return { type: 'string', value: this.eat().raw };
    }

    if (this.atIdentLike() || this.atKeyword('CAST')) {
      return this.parseIdentOrCall();
    }

    const token = this.peek();
    throw new Error(`Unexpected token "${token.raw}" at position ${token.pos}`);
  }

  private parseInterval(): SqlExpr {
    const intervalKw = this.expectKeyword('INTERVAL');
    let value: SqlExpr;

    if (this.at('string')) {
      value = { type: 'string', value: this.eat().raw };
    } else if (this.at('number')) {
      value = { type: 'number', value: this.eat().value };
    } else {
      const token = this.peek();
      throw new Error(
        `Expected interval value at position ${token.pos}, got "${token.raw}"`,
      );
    }

    const unit = this.atIntervalUnit() ? this.eat().raw : undefined;

    return { type: 'interval', intervalKw, value, unit };
  }

  private atIntervalUnit(): boolean {
    const token = this.peek();
    const raw = token.type === 'ident' || token.type === 'keyword' ? token.raw : '';

    return INTERVAL_UNITS.has(raw.toUpperCase());
  }

  private parseInList(expr: SqlExpr, inKw: string, notKw?: string): SqlExpr {
    this.expectPunct('(');
    const values = this.parseExprList();
    this.expectPunct(')');

    return { type: 'in', notKw, inKw, expr, values };
  }

  private parseBetween(
    expr: SqlExpr,
    betweenKw: string,
    notKw?: string,
  ): SqlExpr {
    const from = this.parseConcat();
    const andKw = this.expectKeyword('AND');
    const to = this.parseConcat();

    return { type: 'between', notKw, betweenKw, andKw, expr, from, to };
  }

  private parseIdentOrCall(): SqlExpr {
    const nameParts = this.parseIdentPath();
    const name = nameParts.join('.');

    if (!this.matchPunct('(')) {
      return { type: 'ident', parts: nameParts };
    }

    if (name.toUpperCase() === 'CAST') {
      const expr = this.parseExpr();
      this.expectKeyword('AS');
      const typeName = this.parseIdentPath();
      this.expectPunct(')');

      return {
        type: 'call',
        name,
        args: [expr, { type: 'ident', parts: typeName }],
      };
    }

    const args: SqlExpr[] = [];

    if (!this.atPunct(')')) {
      if (this.matchOp('*')) {
        args.push({ type: 'star' });
      } else {
        args.push(...this.parseExprList());
      }
    }

    this.expectPunct(')');

    const call: CallExpr = { type: 'call', name, args };

    return call;
  }

  private parseCase(caseKw: string): SqlExpr {
    const discriminant = this.atKeyword('WHEN') ? undefined : this.parseExpr();
    const whens = [];

    while (this.atKeyword('WHEN')) {
      const whenKw = this.expectKeyword('WHEN');
      const when = this.parseExpr();
      const thenKw = this.expectKeyword('THEN');
      const then = this.parseExpr();
      whens.push({ whenKw, thenKw, when, then });
    }

    const elseKw = this.matchKeyword('ELSE');
    const elseExpr = elseKw ? this.parseExpr() : undefined;
    const endKw = this.expectKeyword('END');

    return {
      type: 'case',
      caseKw,
      discriminant,
      whens,
      elseKw,
      elseExpr,
      endKw,
    };
  }

  private parseIdentPath(): string[] {
    const parts = [this.expectIdentOrQuoted()];

    while (this.matchPunct('.')) {
      if (this.matchOp('*')) {
        parts.push('*');
        break;
      }

      parts.push(this.expectIdentOrQuoted());
    }

    return parts;
  }

  private expectIdentOrQuoted(): string {
    const token = this.peek();

    if (token.type === 'ident') {
      return this.eat().value;
    }

    if (token.type === 'keyword') {
      return this.eat().raw;
    }

    throw new Error(
      `Expected identifier at position ${token.pos}, got "${token.raw}"`,
    );
  }

  private isJoinStart(): boolean {
    return (
      this.atKeyword('JOIN') ||
      this.atKeyword('INNER') ||
      this.atKeyword('LEFT') ||
      this.atKeyword('RIGHT') ||
      this.atKeyword('FULL') ||
      this.atKeyword('CROSS')
    );
  }

  private atClauseStarter(): boolean {
    const token = this.peek();

    return token.type === 'keyword' && CLAUSE_STARTERS.has(token.value);
  }

  private atRoutineClause(): boolean {
    return (
      this.atKeyword('RETURNS') ||
      this.atKeyword('LANGUAGE') ||
      this.atKeyword('AS') ||
      this.atKeyword('BEGIN') ||
      this.atKeyword('DETERMINISTIC') ||
      this.atKeyword('NOT')
    );
  }

  private atStatementBoundary(): boolean {
    return (
      this.at('eof') ||
      this.atPunct(';') ||
      this.atKeyword('END') ||
      this.atKeyword('BEGIN') ||
      this.atKeyword('SELECT') ||
      this.atKeyword('INSERT') ||
      this.atKeyword('UPDATE') ||
      this.atKeyword('DELETE') ||
      this.atKeyword('RETURN') ||
      this.atKeyword('CALL') ||
      this.atKeyword('CREATE')
    );
  }

  private atIdentLike(): boolean {
    return this.at('ident') || (this.at('keyword') && !this.atClauseStarter());
  }

  private isIdentLikeToken(token: Token): boolean {
    return (
      token.type === 'ident' ||
      (token.type === 'keyword' && !CLAUSE_STARTERS.has(token.value))
    );
  }

  private matchSequence(keywords: string[]): boolean {
    for (let offset = 0; offset < keywords.length; offset += 1) {
      const token = this.tokens[this.index + offset];

      if (
        !token ||
        token.type !== 'keyword' ||
        token.value !== keywords[offset]
      ) {
        return false;
      }
    }

    this.index += keywords.length;

    return true;
  }

  private atKeyword(keyword: string): boolean {
    const token = this.peek();

    return token.type === 'keyword' && token.value === keyword;
  }

  private atPunct(value: string): boolean {
    const token = this.peek();

    return token.type === 'punct' && token.value === value;
  }

  private matchKeyword(keyword: string): string | undefined {
    if (this.atKeyword(keyword)) {
      return this.eat().raw;
    }

    return undefined;
  }

  private matchPunct(value: string): boolean {
    if (this.atPunct(value)) {
      this.eat();
      return true;
    }

    return false;
  }

  private matchOp(value: string): boolean {
    const token = this.peek();

    if (token.type === 'op' && token.value === value) {
      this.eat();
      return true;
    }

    return false;
  }

  private expectKeyword(keyword: string): string {
    const raw = this.matchKeyword(keyword);

    if (raw === undefined) {
      const token = this.peek();
      throw new Error(
        `Expected ${keyword} at position ${token.pos}, got "${token.raw}"`,
      );
    }

    return raw;
  }

  private expectPunct(value: string): void {
    if (!this.matchPunct(value)) {
      const token = this.peek();
      throw new Error(
        `Expected "${value}" at position ${token.pos}, got "${token.raw}"`,
      );
    }
  }

  private at(type: Token['type']): boolean {
    return this.peek().type === type;
  }

  private peek(): Token {
    return this.tokens[this.index];
  }

  private eat(): Token {
    const token = this.peek();
    this.index += 1;

    return token;
  }

  private prev(): Token {
    return this.tokens[this.index - 1];
  }
}

function splitRoutineString(raw: string): { delimiter: string; source: string } {
  if (raw.startsWith('$')) {
    const end = raw.indexOf('$', 1);
    const delimiter = raw.slice(0, end + 1);

    return {
      delimiter,
      source: raw.slice(delimiter.length, raw.length - delimiter.length),
    };
  }

  const delimiter = raw[0];

  return {
    delimiter,
    source: raw.slice(1, -1),
  };
}
