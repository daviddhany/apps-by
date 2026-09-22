import { describe, expect, it, vi } from "vitest";
import { runGenerativePlanner, type PlannerContext } from "@needly/core";

const ctx: PlannerContext = { hasExistingApps: false };

const VALID_SPEC = {
  version: 1,
  toolDnaSlug: ["restaurant-picker"],
  title: "Restaurant Picker",
  icon: "sparkles",
  entities: ["idea"],
  fields: { idea: [{ key: "name", label: "Name", type: "text" }] },
  screens: [{ id: "main", title: "Ideas", component: "list", entity: "idea" }],
  features: [],
  settings: {},
  rules: [],
  roles: [{ role: "owner" }],
  actions: [{ name: "add", entity: "idea", label: "Add", allowedRoles: ["owner"], verb: "create_record" }],
  computed: [],
};

const DEDICATED_COMPONENT_SPEC = {
  ...VALID_SPEC,
  screens: [{ id: "main", title: "Ideas", component: "voting", entity: "idea" }],
};

// planGenericAction/computeForSpec exercise the runtime end-to-end elsewhere
// (see the "generic poll primitive end-to-end" suite above); this suite
// exercises the planner's own logic in isolation against a mocked
// `complete()` — no network access, so it runs in every environment
// regardless of whether a real GEMINI_API_KEY/ANTHROPIC_API_KEY is set.
describe("runGenerativePlanner", () => {
  it("returns ok on a valid first response, calling complete once", async () => {
    const complete = vi.fn().mockResolvedValue(JSON.stringify(VALID_SPEC));
    const result = await runGenerativePlanner(complete, "pick a restaurant", ctx);
    expect(result).toEqual({ status: "ok", spec: VALID_SPEC });
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it("repairs an invalid first response and succeeds on the second attempt", async () => {
    const complete = vi
      .fn()
      .mockResolvedValueOnce("{ not valid json")
      .mockResolvedValueOnce(JSON.stringify(VALID_SPEC));
    const result = await runGenerativePlanner(complete, "pick a restaurant", ctx);
    expect(result).toEqual({ status: "ok", spec: VALID_SPEC });
    expect(complete).toHaveBeenCalledTimes(2);
    // the repair prompt must include the original failure so the model can fix it
    expect(complete.mock.calls[1][0]).toContain("failed validation");
  });

  it("returns unsupported_capability if the response is still invalid after one repair", async () => {
    const complete = vi.fn().mockResolvedValue("{ still not valid json");
    const result = await runGenerativePlanner(complete, "pick a restaurant", ctx);
    expect(result.status).toBe("unsupported_capability");
    expect(complete).toHaveBeenCalledTimes(2);
  });

  it("passes through a direct unsupported_capability response without retrying", async () => {
    const complete = vi
      .fn()
      .mockResolvedValue(JSON.stringify({ unsupported: { missing: "live video chat", explanation: "no realtime video primitive exists" } }));
    const result = await runGenerativePlanner(complete, "video call with friends", ctx);
    expect(result).toEqual({ status: "unsupported_capability", missing: "live video chat", explanation: "no realtime video primitive exists" });
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it("passes through a direct clarify response without retrying", async () => {
    const complete = vi.fn().mockResolvedValue(JSON.stringify({ clarify: "What should we track for your football group?" }));
    const result = await runGenerativePlanner(complete, "make something for my football group", ctx);
    expect(result).toEqual({ status: "clarify", question: "What should we track for your football group?" });
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it("rejects a Tool-DNA-dedicated component (e.g. 'voting') in a generated spec, even though it's schema-valid", async () => {
    const complete = vi.fn().mockResolvedValue(JSON.stringify(DEDICATED_COMPONENT_SPEC));
    const result = await runGenerativePlanner(complete, "vote on something", ctx);
    expect(result.status).toBe("unsupported_capability");
    if (result.status === "unsupported_capability") {
      expect(result.explanation).toContain("reserved for a hand-built Tool DNA");
    }
    expect(complete).toHaveBeenCalledTimes(2);
  });
});
