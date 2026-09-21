import { describe, expect, it } from "vitest";
import {
  parseExpression,
  validateExpression,
  evaluateExpression,
  evaluateComputedFormula,
  planGenericAction,
  ActionEngineError,
  computeForSpec,
  MiniAppSpecificationSchema,
  checkActionAllowed,
  type ActionDef,
} from "@needly/core";
import { votingBoardPollSpec, meetingSchedulerPollSpec } from "./fixtures/pollSchemas";

describe("expression parser + evaluator", () => {
  it("evaluates arithmetic, comparison, and boolean logic", () => {
    expect(evaluateExpression("1 + 2 * 3", { collections: {} })).toBe(7);
    expect(evaluateExpression("(1 + 2) * 3", { collections: {} })).toBe(9);
    expect(evaluateExpression("5 > 3 && 2 < 1", { collections: {} })).toBe(false);
    expect(evaluateExpression("5 > 3 || 2 < 1", { collections: {} })).toBe(true);
    expect(evaluateExpression("!(1 == 2)", { collections: {} })).toBe(true);
  });

  it("evaluates member access on record/payload/actor", () => {
    const ctx = { record: { status: "open" }, payload: { optionText: "Paris" }, actor: { id: "u1" }, collections: {} };
    expect(evaluateExpression("record.status", ctx)).toBe("open");
    expect(evaluateExpression("payload.optionText", ctx)).toBe("Paris");
    expect(evaluateExpression("actor.id", ctx)).toBe("u1");
    expect(evaluateExpression("record.status == 'open'", ctx)).toBe(true);
  });

  it("resolves a dotted collection name as a single identifier, not member access", () => {
    const ctx = { collections: { "voting.selection": [{ id: "1", optionText: "A" }, { id: "2", optionText: "B" }] } };
    expect(evaluateExpression("count(voting.selection)", ctx)).toBe(2);
  });

  it("computes count/sum/groupCount over a collection", () => {
    const ctx = {
      collections: {
        selection: [
          { id: "1", optionText: "A", weight: 2 },
          { id: "2", optionText: "A", weight: 3 },
          { id: "3", optionText: "B", weight: 1 },
        ],
      },
    };
    expect(evaluateExpression("count(selection)", ctx)).toBe(3);
    expect(evaluateExpression("sum(selection, 'weight')", ctx)).toBe(6);
    expect(evaluateExpression("groupCount(selection, 'optionText')", ctx)).toEqual({ A: 2, B: 1 });
  });

  it("resolves a declared-but-empty collection as [] instead of an unknown identifier — a brand new app instance has no votes yet", () => {
    expect(evaluateComputedFormula("groupCount(selection, 'optionText')", [], ["selection"])).toEqual({});
    expect(() => evaluateComputedFormula("groupCount(selection, 'optionText')", [])).toThrow(/Unknown identifier/);
  });

  it("rejects invalid syntax", () => {
    expect(() => parseExpression("1 +")).toThrow();
    expect(() => parseExpression("(1 + 2")).toThrow();
  });

  it("validation rejects unknown identifiers and unknown functions", () => {
    const ctx = { collections: { poll: new Set(["title"]) } };
    expect(validateExpression("count(poll)", ctx)).toEqual([]);
    expect(validateExpression("count(unknownCollection)", ctx)).toEqual(["Unknown collection \"unknownCollection\""]);
    expect(validateExpression("madeUpFunction(poll)", ctx)).toEqual(['Unknown function "madeUpFunction"']);
  });

  it("validation rejects a field name that doesn't exist on the collection", () => {
    const ctx = { collections: { poll: new Set(["title"]) } };
    expect(validateExpression("sum(poll, 'doesNotExist')", ctx)).toEqual(['Collection "poll" has no field "doesNotExist"']);
  });

  it("validation enforces a max AST size/depth", () => {
    const huge = Array.from({ length: 300 }, () => "1").join(" + ");
    const errors = validateExpression(huge, { collections: {} });
    expect(errors.some((e) => e.includes("maximum size") || e.includes("maximum nesting depth"))).toBe(true);
  });
});

describe("planGenericAction", () => {
  const createVoteAction: ActionDef = {
    name: "vote",
    entity: "selection",
    label: "Vote",
    allowedRoles: ["participant"],
    verb: "create_record",
    effects: { voterId: "actor.id" },
  };
  const closeAction: ActionDef = {
    name: "complete",
    entity: "optionset",
    label: "Close",
    allowedRoles: ["owner"],
    verb: "update_record",
    effects: { status: "'closed'" },
  };

  it("plans a create_record with effects merged into the payload", () => {
    const plan = planGenericAction(createVoteAction, {
      actorId: "u1",
      actorRole: "participant",
      payload: { optionsetId: "poll1", optionText: "Paris" },
      allRecords: [],
    });
    expect(plan).toEqual({ op: "create", collection: "selection", data: { optionsetId: "poll1", optionText: "Paris", voterId: "u1" } });
  });

  it("plans an update_record against the existing record, dropping id from the payload data", () => {
    const plan = planGenericAction(closeAction, {
      actorId: "owner1",
      actorRole: "owner",
      payload: { id: "poll1" },
      allRecords: [{ id: "poll1", entityType: "optionset", data: { title: "Where?", status: "open" } }],
    });
    expect(plan).toEqual({ op: "update", collection: "optionset", recordId: "poll1", data: { status: "closed" } });
  });

  it("resolves knownCollections as [] for a guard/effect referencing a collection with no rows yet", () => {
    const guarded: ActionDef = { ...createVoteAction, guard: "count(selection) == 0" };
    const plan = planGenericAction(guarded, {
      actorId: "u1",
      actorRole: "participant",
      payload: { optionsetId: "poll1", optionText: "Paris" },
      allRecords: [],
      knownCollections: ["selection"],
    });
    expect(plan.op).toBe("create");
  });

  it("throws ActionEngineError for update_record with no matching record", () => {
    expect(() =>
      planGenericAction(closeAction, { actorId: "u1", actorRole: "owner", payload: { id: "missing" }, allRecords: [] })
    ).toThrow(ActionEngineError);
  });

  it("rejects the action when its guard evaluates falsy", () => {
    const guarded: ActionDef = { ...createVoteAction, guard: "payload.optionText == 'Paris'" };
    expect(() =>
      planGenericAction(guarded, { actorId: "u1", actorRole: "participant", payload: { optionText: "London" }, allRecords: [] })
    ).toThrow(ActionEngineError);
    expect(() =>
      planGenericAction(guarded, { actorId: "u1", actorRole: "participant", payload: { optionText: "Paris" }, allRecords: [] })
    ).not.toThrow();
  });
});

describe("the two hand-authored poll schemas validate cleanly", () => {
  it("Voting Board shape passes MiniAppSpecificationSchema", () => {
    const result = MiniAppSpecificationSchema.safeParse(votingBoardPollSpec);
    expect(result.success).toBe(true);
  });

  it("Meeting Scheduler shape passes MiniAppSpecificationSchema", () => {
    const result = MiniAppSpecificationSchema.safeParse(meetingSchedulerPollSpec);
    expect(result.success).toBe(true);
  });
});

// End-to-end proof, entirely in memory (no DB): create an option set, cast
// votes from two different members, tally via the exact same computeForSpec
// the real app uses, then close. Run twice against schemas that share
// nothing but the "poll" component, the three generic verbs, and the
// formula engine — proving the same primitive produces two meaningfully
// different, correctly-behaving apps.
describe.each([
  { label: "Voting Board", spec: votingBoardPollSpec, ns: "votingpoll" },
  { label: "Meeting Scheduler", spec: meetingSchedulerPollSpec, ns: "meetingpoll" },
])("generic poll primitive end-to-end: $label", ({ spec, ns }) => {
  it("creates an option set, records two selections, tallies, and closes — all through the generic engine", () => {
    const optionsetCollection = `${ns}.optionset`;
    const selectionCollection = `${ns}.selection`;

    // 1. "add" — create the option set (host action)
    const addAction = checkActionAllowed(spec, "add", optionsetCollection, "owner");
    const addPlan = planGenericAction(addAction, {
      actorId: "host1",
      actorRole: "owner",
      payload: { title: "Pick one", options: ["A", "B"], status: "open" },
      allRecords: [],
    });
    if (addPlan.op !== "create") throw new Error("expected create");
    const optionsetId = "optionset-1";
    let records = [{ id: optionsetId, entityType: optionsetCollection, data: addPlan.data }];

    // 2. two different members vote/mark availability for "A"
    const voteAction = checkActionAllowed(spec, "vote", selectionCollection, "participant");
    for (const [actorId, optionText] of [
      ["alice", "A"],
      ["bob", "A"],
      ["carol", "B"],
    ] as const) {
      const plan = planGenericAction(voteAction, {
        actorId,
        actorRole: "participant",
        payload: { optionsetId, optionText },
        allRecords: records,
      });
      if (plan.op !== "create") throw new Error("expected create");
      records = [...records, { id: `selection-${actorId}`, entityType: selectionCollection, data: plan.data }];
    }

    // 3. tally via the real computeForSpec path (formula-driven, no hardcoded case)
    const computed = computeForSpec(spec, records);
    expect(computed.tally).toEqual({ A: 2, B: 1 });

    // 4. close — update_record with an effect formula
    const closeAction = checkActionAllowed(spec, "complete", optionsetCollection, "owner");
    const closePlan = planGenericAction(closeAction, {
      actorId: "host1",
      actorRole: "owner",
      payload: { id: optionsetId },
      allRecords: records,
    });
    expect(closePlan).toMatchObject({ op: "update", recordId: optionsetId, data: { status: "closed" } });
  });
});
