import { describe, expect, it } from "vitest";
import { applySpecPatch } from "@needly/core";
import { buildSpec } from "@needly/core";
import { getToolDna } from "@needly/core";

const def = getToolDna("expense-splitter")!;

describe("spec patching", () => {
  it("adds a field additively without touching existing fields", () => {
    const spec = buildSpec(def, { title: "Trip" });
    const originalFieldCount = spec.fields["expense.participant"].length;

    const patched = applySpecPatch(spec, [{ op: "add_field", entity: "expense.participant", field: { key: "phone", label: "Phone", type: "text" } }]);

    expect(patched.fields["expense.participant"]).toHaveLength(originalFieldCount + 1);
    expect(patched.version).toBe(spec.version + 1);
    // original spec object must not be mutated
    expect(spec.fields["expense.participant"]).toHaveLength(originalFieldCount);
  });

  it("is idempotent when adding a field that already exists", () => {
    const spec = buildSpec(def, { title: "Trip" });
    const once = applySpecPatch(spec, [{ op: "add_field", entity: "expense.participant", field: { key: "phone", label: "Phone", type: "text" } }]);
    const twice = applySpecPatch(once, [{ op: "add_field", entity: "expense.participant", field: { key: "phone", label: "Phone", type: "text" } }]);
    expect(twice.fields["expense.participant"].filter((f) => f.key === "phone")).toHaveLength(1);
  });

  it("remove_screen hides the screen without deleting any data model", () => {
    const spec = buildSpec(def, { title: "Trip" });
    const patched = applySpecPatch(spec, [{ op: "remove_screen", screenId: spec.screens[0].id }]);
    expect(patched.screens).toHaveLength(spec.screens.length - 1);
    expect(patched.entities).toEqual(spec.entities); // entities/data model untouched
  });

  it("add_rule restricts an action to specific roles", () => {
    const spec = buildSpec(def, { title: "Trip" });
    const patched = applySpecPatch(spec, [{ op: "add_rule", rule: { id: "r1", type: "restrict_action", action: "delete", value: ["owner"] } }]);
    expect(patched.rules).toHaveLength(1);
  });
});
