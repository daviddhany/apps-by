import { describe, expect, it } from "vitest";
import { checkActionAllowed, PermissionError } from "@needly/core";
import { buildSpec } from "@needly/core";
import { getToolDna } from "@needly/core";

const def = getToolDna("expense-splitter")!;

describe("action permission checks", () => {
  it("allows a permitted role to perform an allowlisted action", () => {
    const spec = buildSpec(def, { title: "Trip" });
    expect(() => checkActionAllowed(spec, "add", "expense.expense", "participant")).not.toThrow();
  });

  it("rejects a role that isn't in the action's allowedRoles", () => {
    const spec = buildSpec(def, { title: "Trip" });
    expect(() => checkActionAllowed(spec, "delete", "expense.expense", "participant")).toThrow(PermissionError);
  });

  it("rejects an action name that doesn't exist on the spec at all (allowlist boundary)", () => {
    const spec = buildSpec(def, { title: "Trip" });
    // @ts-expect-error intentionally invalid action name to prove the allowlist rejects unknown actions
    expect(() => checkActionAllowed(spec, "drop_table", "expense.expense", "owner")).toThrow();
  });

  it("a restrict_action rule overrides the action's default allowedRoles", () => {
    const spec = buildSpec(def, { title: "Trip" });
    spec.rules.push({ id: "r1", type: "restrict_action", action: "add", value: ["owner"] });
    expect(() => checkActionAllowed(spec, "add", "expense.expense", "participant")).toThrow(PermissionError);
    expect(() => checkActionAllowed(spec, "add", "expense.expense", "owner")).not.toThrow();
  });
});
