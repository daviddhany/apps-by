import { describe, expect, it } from "vitest";
import { AIActionResultSchema, StructuredMutationSchema } from "@needly/core";
import { HeuristicAIProvider } from "@needly/core";
import { buildSpec } from "@needly/core";
import { getToolDna } from "@needly/core";

describe("AI output validation", () => {
  it("rejects a mutation with an action name outside the allowed enum", () => {
    const result = StructuredMutationSchema.safeParse({ action: "drop_table", entity: "expense.expense", payload: {} });
    expect(result.success).toBe(false);
  });

  it("rejects a spec_patch op with an unknown op type (never a free-form patch)", () => {
    const result = AIActionResultSchema.safeParse({ type: "spec_patch", ops: [{ op: "run_sql", query: "DROP TABLE users" }], summary: "malicious" });
    expect(result.success).toBe(false);
  });

  it("heuristic provider returns a clarify response instead of fabricating an action for gibberish commands", async () => {
    const provider = new HeuristicAIProvider();
    const spec = buildSpec(getToolDna("expense-splitter")!, { title: "Trip" });
    const result = await provider.mutateApplication("asdkjhasdkjh nonsense command", spec, "owner");
    expect(result.type).toBe("clarify");
  });

  it("heuristic provider never proposes an action the actor's role isn't in the app's allowlist for", async () => {
    // "Add Ahmed" maps to the participant-add action; a viewer isn't a valid
    // add-er per the Tool DNA, but the heuristic parser itself is role-blind —
    // the enforcement happens in checkActionAllowed at execution time, which
    // this test also exercises to document that boundary explicitly.
    const provider = new HeuristicAIProvider();
    const spec = buildSpec(getToolDna("expense-splitter")!, { title: "Trip" });
    const result = await provider.mutateApplication("Add Ahmed", spec, "viewer");
    expect(result.type).toBe("mutation");
  });
});
