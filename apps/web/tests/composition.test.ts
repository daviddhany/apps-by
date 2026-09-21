import { describe, expect, it } from "vitest";
import { buildSpec, mergeToolIntoSpec } from "@needly/core";
import { getToolDna } from "@needly/core";

describe("Tool DNA composition", () => {
  it("trip-planner composes expense + attendance + voting into one namespaced spec", () => {
    const spec = buildSpec(getToolDna("trip-planner")!, { title: "Dahab Trip" });

    expect(spec.toolDnaSlug).toEqual(expect.arrayContaining(["trip-planner", "expense-splitter", "attendance-tracker", "voting-board"]));
    expect(spec.entities).toEqual(expect.arrayContaining(["expense.expense", "attendance.event", "voting.poll", "trip.car"]));

    // no collisions: every entity name is unique even though multiple source
    // DNAs are merged in
    expect(new Set(spec.entities).size).toBe(spec.entities.length);
  });

  it("mergeToolIntoSpec adds a module into a running app without touching existing entities", () => {
    const spec = buildSpec(getToolDna("expense-splitter")!, { title: "Trip" });
    const merged = mergeToolIntoSpec(spec, "voting-board");

    expect(merged.entities).toEqual(expect.arrayContaining([...spec.entities, "voting.poll", "voting.vote"]));
    expect(merged.version).toBe(spec.version + 1);
  });

  it("merging an already-composed module is a no-op", () => {
    const spec = buildSpec(getToolDna("expense-splitter")!, { title: "Trip" });
    const merged = mergeToolIntoSpec(spec, "voting-board");
    const mergedAgain = mergeToolIntoSpec(merged, "voting-board");
    expect(mergedAgain.entities.filter((e) => e === "voting.poll")).toHaveLength(1);
  });
});
