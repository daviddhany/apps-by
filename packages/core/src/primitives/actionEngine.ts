// Generic action engine: turns a verb-based ActionDef (see types/index.ts)
// plus a mutation payload into a plain, DB-agnostic write descriptor. This
// is the "no per-concept executeAction.ts case needed" half of the
// migration — apps/web/src/runtime/executeAction.ts calls this for any
// action carrying a `verb`, and performs the actual Prisma read/write
// itself (this module has zero DB dependency, matching computeForSpec's
// existing pure-function shape).

import type { ActionDef, Role } from "../types";
import { evaluateExpression, type ExpressionEvalContext } from "./expression";

export interface GenericActionRuntimeRecord {
  id: string;
  entityType: string;
  data: Record<string, unknown>;
}

export interface GenericActionContext {
  actorId: string;
  actorRole: Role;
  payload: Record<string, unknown>;
  allRecords: GenericActionRuntimeRecord[];
  // Every collection declared in the app's spec (spec.entities), so a
  // guard/effect formula can reference one that has zero records so far
  // (a fresh app instance) without it looking like an unknown identifier.
  knownCollections?: string[];
}

export type GenericActionResult =
  | { op: "create"; collection: string; data: Record<string, unknown> }
  | { op: "update"; collection: string; recordId: string; data: Record<string, unknown> }
  | { op: "delete"; collection: string; recordId: string };

export class ActionEngineError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function collectionsFrom(allRecords: GenericActionRuntimeRecord[], knownCollections: string[] = []): ExpressionEvalContext["collections"] {
  const out: ExpressionEvalContext["collections"] = {};
  for (const name of knownCollections) out[name] = [];
  for (const r of allRecords) {
    (out[r.entityType] ??= []).push({ id: r.id, ...r.data });
  }
  return out;
}

export function planGenericAction(action: ActionDef, ctx: GenericActionContext): GenericActionResult {
  if (!action.verb) throw new ActionEngineError(`Action "${action.name}" has no generic verb`, 500);
  const collection = action.entity;
  if (!collection) throw new ActionEngineError(`Action "${action.name}" has no target collection`, 500);

  let targetRecord: GenericActionRuntimeRecord | undefined;
  let recordId: string | undefined;
  if (action.verb === "update_record" || action.verb === "delete_record") {
    recordId = typeof ctx.payload.id === "string" ? ctx.payload.id : undefined;
    if (!recordId) throw new ActionEngineError(`"${action.name}" requires an "id" in its payload`, 400);
    targetRecord = ctx.allRecords.find((r) => r.id === recordId && r.entityType === collection);
    if (!targetRecord) throw new ActionEngineError(`No "${collection}" record with id "${recordId}"`, 404);
  }

  const evalCtx: ExpressionEvalContext = {
    record: targetRecord?.data,
    payload: ctx.payload,
    actor: { id: ctx.actorId, role: ctx.actorRole },
    collections: collectionsFrom(ctx.allRecords, ctx.knownCollections),
  };

  if (action.guard && !evaluateExpression(action.guard, evalCtx)) {
    throw new ActionEngineError(`Action "${action.name}" was rejected by its guard`, 409);
  }

  const effects: Record<string, unknown> = {};
  if (action.effects) {
    for (const [field, formula] of Object.entries(action.effects)) {
      effects[field] = evaluateExpression(formula, evalCtx);
    }
  }

  const { id: _payloadId, ...payloadFields } = ctx.payload;

  switch (action.verb) {
    case "create_record":
      return { op: "create", collection, data: { ...payloadFields, ...effects } };
    case "update_record":
      return { op: "update", collection, recordId: recordId!, data: { ...payloadFields, ...effects } };
    case "delete_record":
      return { op: "delete", collection, recordId: recordId! };
  }
}
