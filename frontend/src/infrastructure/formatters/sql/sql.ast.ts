export type IdentExpr = {
  type: 'ident';
  parts: string[];
};

export type NumberExpr = {
  type: 'number';
  value: string;
};

export type PlaceholderExpr = {
  type: 'placeholder';
  value: string;
};

export type StringExpr = {
  type: 'string';
  value: string;
};

export type StarExpr = {
  type: 'star';
};

export type IntervalExpr = {
  type: 'interval';
  intervalKw: string;
  value: SqlExpr;
  unit?: string;
};

export type NullExpr = {
  type: 'null';
  raw: string;
};

export type CallExpr = {
  type: 'call';
  name: string;
  args: SqlExpr[];
};

export type BinaryExpr = {
  type: 'binary';
  op: string;
  left: SqlExpr;
  right: SqlExpr;
};

export type UnaryExpr = {
  type: 'unary';
  op: string;
  expr: SqlExpr;
};

export type BoolExpr = {
  type: 'bool';
  op: string;
  items: SqlExpr[];
};

export type InExpr = {
  type: 'in';
  notKw?: string;
  inKw: string;
  expr: SqlExpr;
  values: SqlExpr[];
};

export type BetweenExpr = {
  type: 'between';
  notKw?: string;
  betweenKw: string;
  andKw: string;
  expr: SqlExpr;
  from: SqlExpr;
  to: SqlExpr;
};

export type IsNullExpr = {
  type: 'is-null';
  isKw: string;
  notKw?: string;
  nullKw: string;
  expr: SqlExpr;
};

export type CaseWhen = {
  whenKw: string;
  thenKw: string;
  when: SqlExpr;
  then: SqlExpr;
};

export type CaseExpr = {
  type: 'case';
  caseKw: string;
  discriminant?: SqlExpr;
  whens: CaseWhen[];
  elseKw?: string;
  elseExpr?: SqlExpr;
  endKw: string;
};

export type SubqueryExpr = {
  type: 'subquery';
  select: SelectStatement;
};

export type ParenExpr = {
  type: 'paren';
  expr: SqlExpr;
};

export type PgCastExpr = {
  type: 'cast-pg';
  expr: SqlExpr;
  typeName: string[];
};

export type SqlExpr =
  | IdentExpr
  | NumberExpr
  | StringExpr
  | StarExpr
  | NullExpr
  | CallExpr
  | BinaryExpr
  | UnaryExpr
  | BoolExpr
  | InExpr
  | BetweenExpr
  | IsNullExpr
  | CaseExpr
  | SubqueryExpr
  | ParenExpr
  | IntervalExpr
  | PgCastExpr
  | PlaceholderExpr;

export type SelectItem = {
  expr: SqlExpr;
  alias?: string;
  asKw?: string;
};

export type TableRef = {
  name: string[];
  alias?: string;
};

export type JoinClause = {
  kind: string;
  table: TableRef;
  onKw?: string;
  on?: SqlExpr;
  usingKw?: string;
  using?: string[];
};

export type OrderItem = {
  expr: SqlExpr;
  directionKw?: string;
};

export type Assignment = {
  target: IdentExpr;
  value: SqlExpr;
};

export type SelectStatement = {
  type: 'select';
  selectKw: string;
  distinctKw?: string;
  topKw?: string;
  top?: SqlExpr;
  columns: SelectItem[];
  fromKw?: string;
  from?: TableRef;
  joins: JoinClause[];
  prewhereKw?: string;
  prewhere?: SqlExpr;
  whereKw?: string;
  where?: SqlExpr;
  groupByKw?: [string, string];
  groupBy: SqlExpr[];
  havingKw?: string;
  having?: SqlExpr;
  orderByKw?: [string, string];
  orderBy: OrderItem[];
  limitKw?: string;
  limit?: SqlExpr;
  limitComma?: boolean;
  offsetKw?: string;
  offset?: SqlExpr;
};

export type InsertStatement = {
  type: 'insert';
  insertKw: string;
  intoKw?: string;
  table: TableRef;
  columns: string[];
  valuesKw?: string;
  values?: SqlExpr[][];
  select?: SelectStatement;
};

export type UpdateStatement = {
  type: 'update';
  updateKw: string;
  table: TableRef;
  joins: JoinClause[];
  fromKw?: string;
  from?: TableRef;
  setKw: string;
  set: Assignment[];
  whereKw?: string;
  where?: SqlExpr;
};

export type DeleteStatement = {
  type: 'delete';
  deleteKw: string;
  fromKw: string;
  table: TableRef;
  whereKw?: string;
  where?: SqlExpr;
};

export type RoutineParamMode = 'IN' | 'OUT' | 'INOUT';

export type RoutineParam = {
  modeKw?: string;
  name: string;
  dataType: string;
};

export type RoutineBody =
  | BlockStatement
  | {
      type: 'string';
      asKw: string;
      delimiter: string;
      source: string;
      statements?: SqlStatement[];
    };

export type CreateRoutineStatement = {
  type: 'create-routine';
  createKw: string;
  orKw?: string;
  replaceKw?: string;
  kindKw: string;
  kind: 'FUNCTION' | 'PROCEDURE';
  name: string[];
  params: RoutineParam[];
  returnsKw?: string;
  returns?: string;
  languageKw?: string;
  language?: string;
  body?: RoutineBody;
};

export type CallStatement = {
  type: 'call-stmt';
  callKw: string;
  name: string[];
  args: SqlExpr[];
};

export type ReturnStatement = {
  type: 'return';
  returnKw: string;
  expr?: SqlExpr;
};

export type BlockStatement = {
  type: 'block';
  beginKw: string;
  statements: SqlStatement[];
  endKw: string;
};

export type SqlStatement =
  | SelectStatement
  | InsertStatement
  | UpdateStatement
  | DeleteStatement
  | CreateRoutineStatement
  | CallStatement
  | ReturnStatement
  | BlockStatement;
