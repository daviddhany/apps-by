// A small, safe expression language for the generic primitive runtime's
// formulas (computed values) and action effects. This is NOT a general-
// purpose scripting language: it is a hand-written tokenizer + recursive-
// descent parser producing a plain-data AST, evaluated by a pure-function
// interpreter that never touches `eval`/`new Function`/a VM sandbox. Every
// identifier and function call is checked against a whitelist derived from
// the app's own spec (see validateExpression) BEFORE a formula is ever
// stored — a formula that references an unknown collection/field or an
// unlisted function fails schema validation outright, it never reaches
// execution. Execution itself is additionally bounded (AST size/depth), so
// even a validated formula can't blow up evaluation cost.

export type Expr =
  | { type: "num"; value: number }
  | { type: "str"; value: string }
  | { type: "bool"; value: boolean }
  | { type: "ident"; name: string }
  | { type: "member"; object: Expr; property: string }
  | { type: "call"; name: string; args: Expr[] }
  | { type: "unary"; op: "!" | "-"; operand: Expr }
  | { type: "binary"; op: string; left: Expr; right: Expr };

export class ExpressionError extends Error {}

// --- Tokenizer ---------------------------------------------------------

type TokenType = "num" | "str" | "ident" | "op" | "lparen" | "rparen" | "comma" | "dot" | "eof";
interface Token {
  type: TokenType;
  value: string;
}

const MULTI_CHAR_OPS = ["==", "!=", "<=", ">=", "&&", "||"];
const SINGLE_CHAR_OPS = "+-*/%<>!";
const CONTEXT_WORDS = new Set(["record", "payload", "actor"]);

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < source.length) {
    const ch = source[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (ch === "(") {
      tokens.push({ type: "lparen", value: ch });
      i++;
      continue;
    }
    if (ch === ")") {
      tokens.push({ type: "rparen", value: ch });
      i++;
      continue;
    }
    if (ch === ",") {
      tokens.push({ type: "comma", value: ch });
      i++;
      continue;
    }
    if (ch === ".") {
      tokens.push({ type: "dot", value: ch });
      i++;
      continue;
    }
    if (ch === '"' || ch === "'") {
      const quote = ch;
      let j = i + 1;
      let value = "";
      while (j < source.length && source[j] !== quote) {
        value += source[j];
        j++;
      }
      if (j >= source.length) throw new ExpressionError(`Unterminated string literal at position ${i}`);
      tokens.push({ type: "str", value });
      i = j + 1;
      continue;
    }
    if (/[0-9]/.test(ch)) {
      let j = i;
      while (j < source.length && /[0-9.]/.test(source[j])) j++;
      tokens.push({ type: "num", value: source.slice(i, j) });
      i = j;
      continue;
    }
    if (/[A-Za-z_]/.test(ch)) {
      let j = i;
      while (j < source.length && /[A-Za-z0-9_]/.test(source[j])) j++;
      let name = source.slice(i, j);
      // Collection names are namespaced with dots (e.g. "voting.poll"), which
      // would otherwise collide with member-access syntax (record.field).
      // Fold trailing ".segment" runs into the identifier itself, UNLESS the
      // base name is one of the three reserved context words — there, a
      // dot really is member access, handled by the `dot` token below.
      while (!CONTEXT_WORDS.has(name) && source[j] === "." && /[A-Za-z_]/.test(source[j + 1] ?? "")) {
        let k = j + 1;
        while (k < source.length && /[A-Za-z0-9_]/.test(source[k])) k++;
        name = source.slice(i, k);
        j = k;
      }
      tokens.push({ type: "ident", value: name });
      i = j;
      continue;
    }
    const two = source.slice(i, i + 2);
    if (MULTI_CHAR_OPS.includes(two)) {
      tokens.push({ type: "op", value: two });
      i += 2;
      continue;
    }
    if (SINGLE_CHAR_OPS.includes(ch)) {
      tokens.push({ type: "op", value: ch });
      i++;
      continue;
    }
    throw new ExpressionError(`Unexpected character "${ch}" at position ${i}`);
  }
  tokens.push({ type: "eof", value: "" });
  return tokens;
}

// --- Parser (recursive descent, standard precedence climbing) ---------
// || < && < equality < relational < additive < multiplicative < unary < primary

class Parser {
  private pos = 0;
  constructor(private tokens: Token[]) {}

  private peek(): Token {
    return this.tokens[this.pos];
  }
  private next(): Token {
    return this.tokens[this.pos++];
  }
  private expect(type: TokenType, value?: string): Token {
    const t = this.next();
    if (t.type !== type || (value !== undefined && t.value !== value)) {
      throw new ExpressionError(`Expected ${value ?? type} but got "${t.value}"`);
    }
    return t;
  }

  parse(): Expr {
    const expr = this.parseOr();
    this.expect("eof");
    return expr;
  }

  private parseOr(): Expr {
    let left = this.parseAnd();
    while (this.peek().type === "op" && this.peek().value === "||") {
      this.next();
      left = { type: "binary", op: "||", left, right: this.parseAnd() };
    }
    return left;
  }

  private parseAnd(): Expr {
    let left = this.parseEquality();
    while (this.peek().type === "op" && this.peek().value === "&&") {
      this.next();
      left = { type: "binary", op: "&&", left, right: this.parseEquality() };
    }
    return left;
  }

  private parseEquality(): Expr {
    let left = this.parseRelational();
    while (this.peek().type === "op" && ["==", "!="].includes(this.peek().value)) {
      const op = this.next().value;
      left = { type: "binary", op, left, right: this.parseRelational() };
    }
    return left;
  }

  private parseRelational(): Expr {
    let left = this.parseAdditive();
    while (this.peek().type === "op" && ["<", ">", "<=", ">="].includes(this.peek().value)) {
      const op = this.next().value;
      left = { type: "binary", op, left, right: this.parseAdditive() };
    }
    return left;
  }

  private parseAdditive(): Expr {
    let left = this.parseMultiplicative();
    while (this.peek().type === "op" && ["+", "-"].includes(this.peek().value)) {
      const op = this.next().value;
      left = { type: "binary", op, left, right: this.parseMultiplicative() };
    }
    return left;
  }

  private parseMultiplicative(): Expr {
    let left = this.parseUnary();
    while (this.peek().type === "op" && ["*", "/", "%"].includes(this.peek().value)) {
      const op = this.next().value;
      left = { type: "binary", op, left, right: this.parseUnary() };
    }
    return left;
  }

  private parseUnary(): Expr {
    if (this.peek().type === "op" && (this.peek().value === "!" || this.peek().value === "-")) {
      const op = this.next().value as "!" | "-";
      return { type: "unary", op, operand: this.parseUnary() };
    }
    return this.parsePrimary();
  }

  private parsePrimary(): Expr {
    const t = this.peek();
    if (t.type === "num") {
      this.next();
      return { type: "num", value: Number(t.value) };
    }
    if (t.type === "str") {
      this.next();
      return { type: "str", value: t.value };
    }
    if (t.type === "lparen") {
      this.next();
      const expr = this.parseOr();
      this.expect("rparen");
      return expr;
    }
    if (t.type === "ident") {
      this.next();
      if (t.value === "true") return { type: "bool", value: true };
      if (t.value === "false") return { type: "bool", value: false };
      let expr: Expr = { type: "ident", name: t.value };
      if (this.peek().type === "lparen") {
        this.next();
        const args: Expr[] = [];
        if (this.peek().type !== "rparen") {
          args.push(this.parseOr());
          while (this.peek().type === "comma") {
            this.next();
            args.push(this.parseOr());
          }
        }
        this.expect("rparen");
        return { type: "call", name: t.value, args };
      }
      while (this.peek().type === "dot") {
        this.next();
        const prop = this.expect("ident");
        expr = { type: "member", object: expr, property: prop.value };
      }
      return expr;
    }
    throw new ExpressionError(`Unexpected token "${t.value}"`);
  }
}

export function parseExpression(source: string): Expr {
  return new Parser(tokenize(source)).parse();
}

// --- Whitelisted function library --------------------------------------
// Every function here operates on already-materialized, in-memory record
// lists for one app instance — bounded by that app's own data, not by
// anything the formula itself controls (no loops/recursion in the
// language), so there's no unbounded-work vector through this surface.

type CollectionRow = { id: string } & Record<string, unknown>;

export const EXPRESSION_FUNCTIONS = {
  count(list: unknown): number {
    if (!Array.isArray(list)) throw new ExpressionError("count() expects a collection");
    return list.length;
  },
  sum(list: unknown, field: unknown): number {
    if (!Array.isArray(list)) throw new ExpressionError("sum() expects a collection");
    if (typeof field !== "string") throw new ExpressionError("sum() expects a field name string");
    return (list as CollectionRow[]).reduce((total, row) => total + (Number(row[field]) || 0), 0);
  },
  groupCount(list: unknown, field: unknown): Record<string, number> {
    if (!Array.isArray(list)) throw new ExpressionError("groupCount() expects a collection");
    if (typeof field !== "string") throw new ExpressionError("groupCount() expects a field name string");
    const out: Record<string, number> = {};
    for (const row of list as CollectionRow[]) {
      const key = String((row as Record<string, unknown>)[field]);
      out[key] = (out[key] ?? 0) + 1;
    }
    return out;
  },
  // filter(list, field, value): rows where row[field] === value. Composes
  // with count/sum/groupCount for free (e.g. a "one vote per person" guard:
  // count(filter(votes, 'voterId', actor.id)) == 0) — general-purpose, not
  // tied to any one concept.
  filter(list: unknown, field: unknown, value: unknown): CollectionRow[] {
    if (!Array.isArray(list)) throw new ExpressionError("filter() expects a collection");
    if (typeof field !== "string") throw new ExpressionError("filter() expects a field name string");
    return (list as CollectionRow[]).filter((row) => row[field] === value);
  },
  // groupSum(list, groupField, valueField): sum of valueField per distinct
  // groupField value — generalizes groupCount from counting to summing
  // (e.g. points-based standings).
  groupSum(list: unknown, groupField: unknown, valueField: unknown): Record<string, number> {
    if (!Array.isArray(list)) throw new ExpressionError("groupSum() expects a collection");
    if (typeof groupField !== "string") throw new ExpressionError("groupSum() expects a group field name string");
    if (typeof valueField !== "string") throw new ExpressionError("groupSum() expects a value field name string");
    const out: Record<string, number> = {};
    for (const row of list as CollectionRow[]) {
      const key = String(row[groupField]);
      out[key] = (out[key] ?? 0) + (Number(row[valueField]) || 0);
    }
    return out;
  },
  // topNByGroup(list, groupField, n): the n most-frequent groupField values,
  // ranked by count, as a string array.
  topNByGroup(list: unknown, groupField: unknown, n: unknown): string[] {
    if (!Array.isArray(list)) throw new ExpressionError("topNByGroup() expects a collection");
    if (typeof groupField !== "string") throw new ExpressionError("topNByGroup() expects a field name string");
    const limit = Number(n);
    if (!Number.isFinite(limit) || limit < 0) throw new ExpressionError("topNByGroup() expects a non-negative count");
    const counts: Record<string, number> = {};
    for (const row of list as CollectionRow[]) {
      const key = String(row[groupField]);
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([key]) => key);
  },
  // The three sampling functions below are non-deterministic and are only
  // permitted in an action's `effects` (evaluated once, at write time, with
  // the result persisted) — never in a `guard` or a `computed.formula`,
  // which must stay pure. Enforced by validateExpression via
  // NONDETERMINISTIC_FUNCTIONS + ExpressionSchemaContext.allowNonDeterministic.
  random(): number {
    return Math.random();
  },
  pickRandom(list: unknown): unknown {
    if (!Array.isArray(list)) throw new ExpressionError("pickRandom() expects a collection");
    if (list.length === 0) return null;
    return list[Math.floor(Math.random() * list.length)];
  },
  pickRandomField(list: unknown, field: unknown): unknown {
    if (!Array.isArray(list)) throw new ExpressionError("pickRandomField() expects a collection");
    if (typeof field !== "string") throw new ExpressionError("pickRandomField() expects a field name string");
    if (list.length === 0) return null;
    const row = (list as CollectionRow[])[Math.floor(Math.random() * list.length)];
    return row[field];
  },
} as const;

export type ExpressionFunctionName = keyof typeof EXPRESSION_FUNCTIONS;
export const EXPRESSION_FUNCTION_NAMES = Object.keys(EXPRESSION_FUNCTIONS) as ExpressionFunctionName[];

export const NONDETERMINISTIC_FUNCTIONS: ReadonlySet<ExpressionFunctionName> = new Set(["random", "pickRandom", "pickRandomField"]);

// Which argument positions (0-based) of each function are a "field name"
// referring to a field on the collection named in a sibling argument —
// used by validateExpression to check the field actually exists on that
// collection, and by nothing else (the interpreter itself just reads the
// string literal value at that position).
const FIELD_NAME_ARG_INDEX: Partial<Record<ExpressionFunctionName, number[]>> = {
  sum: [1],
  groupCount: [1],
  filter: [1],
  groupSum: [1, 2],
  topNByGroup: [1],
  pickRandomField: [1],
};
const COLLECTION_ARG_INDEX: Partial<Record<ExpressionFunctionName, number>> = {
  count: 0,
  sum: 0,
  groupCount: 0,
  filter: 0,
  groupSum: 0,
  topNByGroup: 0,
  pickRandom: 0,
  pickRandomField: 0,
};

// --- Validation (schema-authoring time, never at execution time) -------

export interface ExpressionSchemaContext {
  // collection name -> set of its declared field names
  collections: Record<string, Set<string>>;
  // Only true when validating an action's `effects` formulas — the one place
  // the non-deterministic sampling functions (random/pickRandom/
  // pickRandomField) are allowed. Defaults to false (guard/computed.formula).
  allowNonDeterministic?: boolean;
}

const MAX_NODES = 200;
const MAX_DEPTH = 20;

export function validateExpression(source: string, ctx: ExpressionSchemaContext): string[] {
  let expr: Expr;
  try {
    expr = parseExpression(source);
  } catch (err) {
    return [err instanceof Error ? err.message : "Invalid expression syntax"];
  }

  const errors: string[] = [];
  let nodeCount = 0;

  function walk(node: Expr, depth: number, asCall?: { name: ExpressionFunctionName; argIndex: number }) {
    nodeCount++;
    if (nodeCount > MAX_NODES) {
      errors.push(`Expression exceeds the maximum size (${MAX_NODES} nodes)`);
      return;
    }
    if (depth > MAX_DEPTH) {
      errors.push(`Expression exceeds the maximum nesting depth (${MAX_DEPTH})`);
      return;
    }

    switch (node.type) {
      case "num":
      case "str":
      case "bool":
        return;
      case "ident": {
        if (CONTEXT_WORDS.has(node.name)) return;
        if (asCall && COLLECTION_ARG_INDEX[asCall.name] === asCall.argIndex) {
          if (!(node.name in ctx.collections)) {
            errors.push(`Unknown collection "${node.name}"`);
          }
          return;
        }
        if (node.name in ctx.collections) return; // a bare collection reference is always valid
        errors.push(`Unknown identifier "${node.name}"`);
        return;
      }
      case "member":
        walk(node.object, depth + 1);
        return;
      case "call": {
        if (!(EXPRESSION_FUNCTION_NAMES as string[]).includes(node.name)) {
          errors.push(`Unknown function "${node.name}"`);
          return;
        }
        const fnName = node.name as ExpressionFunctionName;
        if (NONDETERMINISTIC_FUNCTIONS.has(fnName) && !ctx.allowNonDeterministic) {
          errors.push(`${fnName}() is only allowed in an action's effects, not in a guard or computed formula`);
          return;
        }
        node.args.forEach((arg, argIndex) => {
          if (FIELD_NAME_ARG_INDEX[fnName]?.includes(argIndex)) {
            if (arg.type !== "str") {
              errors.push(`${fnName}() argument ${argIndex + 1} must be a field name string literal`);
              return;
            }
            const collectionArg = node.args[COLLECTION_ARG_INDEX[fnName] ?? -1];
            if (collectionArg?.type === "ident") {
              const fields = ctx.collections[collectionArg.name];
              if (fields && !fields.has(arg.value)) {
                errors.push(`Collection "${collectionArg.name}" has no field "${arg.value}"`);
              }
            }
            return;
          }
          walk(arg, depth + 1, { name: fnName, argIndex });
        });
        return;
      }
      case "unary":
        walk(node.operand, depth + 1);
        return;
      case "binary":
        walk(node.left, depth + 1);
        walk(node.right, depth + 1);
        return;
    }
  }

  walk(expr, 0);
  return errors;
}

// --- Evaluation ----------------------------------------------------------

export interface ExpressionEvalContext {
  record?: Record<string, unknown>;
  payload?: Record<string, unknown>;
  actor?: Record<string, unknown>;
  // collection name -> flattened records ({id, ...data})
  collections: Record<string, CollectionRow[]>;
}

export function evaluateExpression(source: string, ctx: ExpressionEvalContext): unknown {
  const expr = parseExpression(source);
  return evalNode(expr, ctx);
}

function evalNode(node: Expr, ctx: ExpressionEvalContext): unknown {
  switch (node.type) {
    case "num":
    case "str":
    case "bool":
      return node.value;
    case "ident": {
      if (node.name in ctx.collections) return ctx.collections[node.name];
      if (node.name === "record") return ctx.record ?? {};
      if (node.name === "payload") return ctx.payload ?? {};
      if (node.name === "actor") return ctx.actor ?? {};
      throw new ExpressionError(`Unknown identifier "${node.name}"`);
    }
    case "member": {
      const obj = evalNode(node.object, ctx);
      if (obj === null || typeof obj !== "object") return undefined;
      return (obj as Record<string, unknown>)[node.property];
    }
    case "call": {
      const fn = EXPRESSION_FUNCTIONS[node.name as ExpressionFunctionName];
      if (!fn) throw new ExpressionError(`Unknown function "${node.name}"`);
      const args = node.args.map((a) => evalNode(a, ctx));
      return (fn as (...a: unknown[]) => unknown)(...args);
    }
    case "unary": {
      const v = evalNode(node.operand, ctx);
      if (node.op === "!") return !v;
      return -(Number(v));
    }
    case "binary": {
      const l = evalNode(node.left, ctx);
      const r = evalNode(node.right, ctx);
      switch (node.op) {
        case "+":
          return typeof l === "string" || typeof r === "string" ? String(l) + String(r) : Number(l) + Number(r);
        case "-":
          return Number(l) - Number(r);
        case "*":
          return Number(l) * Number(r);
        case "/":
          return Number(l) / Number(r);
        case "%":
          return Number(l) % Number(r);
        case "==":
          return l === r;
        case "!=":
          return l !== r;
        case "<":
          return (l as number) < (r as number);
        case ">":
          return (l as number) > (r as number);
        case "<=":
          return (l as number) <= (r as number);
        case ">=":
          return (l as number) >= (r as number);
        case "&&":
          return Boolean(l) && Boolean(r);
        case "||":
          return Boolean(l) || Boolean(r);
        default:
          throw new ExpressionError(`Unknown operator "${node.op}"`);
      }
    }
  }
}
