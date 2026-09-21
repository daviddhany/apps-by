import type { MiniAppSpecification, SpecPatchOp } from "../types";

/**
 * Applies a list of additive spec-patch ops to a spec, returning a new spec
 * object (never mutates the input) with version+1. Existing AppData rows are
 * never touched — adding a field/screen/rule is schema-additive by design
 * (ARCHITECTURE.md §4), and remove_screen only hides a screen, it does not
 * delete the underlying entity's data.
 */
export function applySpecPatch(spec: MiniAppSpecification, ops: SpecPatchOp[]): MiniAppSpecification {
  let next: MiniAppSpecification = structuredClone(spec);

  for (const op of ops) {
    switch (op.op) {
      case "add_field": {
        const existing = next.fields[op.entity] ?? [];
        if (!existing.some((f) => f.key === op.field.key)) {
          next.fields = { ...next.fields, [op.entity]: [...existing, op.field] };
        }
        break;
      }
      case "add_screen": {
        if (!next.screens.some((s) => s.id === op.screen.id)) {
          next.screens = [...next.screens, op.screen];
        }
        break;
      }
      case "remove_screen": {
        next.screens = next.screens.filter((s) => s.id !== op.screenId);
        break;
      }
      case "add_rule": {
        next.rules = [...next.rules.filter((r) => r.id !== op.rule.id), op.rule];
        break;
      }
      case "update_setting": {
        next.settings = { ...next.settings, [op.key]: op.value };
        break;
      }
    }
  }

  next.version = spec.version + 1;
  return next;
}
