// Generic computed-value engine: evaluates a ComputedDef's `formula` (see
// types/index.ts) against an app instance's records. Thin wrapper around
// the expression evaluator — the one place computeForSpec.ts calls into
// for any computed entry that carries a formula instead of relying on its
// legacy hardcoded switch(key).

import { evaluateExpression, type ExpressionEvalContext } from "./expression";

export interface ComputeRuntimeRecord {
  id: string;
  entityType: string;
  data: Record<string, unknown>;
}

export function evaluateComputedFormula(formula: string, allRecords: ComputeRuntimeRecord[], knownCollections: string[] = []): unknown {
  const collections: ExpressionEvalContext["collections"] = {};
  // A collection with zero records so far is still a valid, known
  // identifier (an empty array), not an "unknown identifier" — a brand new
  // app instance with no votes yet must still be able to evaluate
  // `groupCount(votes, 'optionId')` as `{}`, not throw.
  for (const name of knownCollections) collections[name] = [];
  for (const r of allRecords) {
    (collections[r.entityType] ??= []).push({ id: r.id, ...r.data });
  }
  return evaluateExpression(formula, { collections });
}
