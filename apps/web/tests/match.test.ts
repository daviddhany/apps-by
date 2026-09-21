import { describe, expect, it } from "vitest";
import { matchToolDna } from "@needly/core";

describe("Tool DNA matching", () => {
  it("matches an expense-splitting need even without the word 'expense'", () => {
    const result = matchToolDna("Me and my friends want to keep track of who paid during our vacation.");
    expect(result.decision === "reuse" || result.decision === "remix").toBe(true);
    expect(result.matches[0]?.slug).toBe("expense-splitter");
  });

  it("matches a tournament need for FIFA/FC language", () => {
    const result = matchToolDna("We are organizing a knockout FC tournament for 16 players.");
    expect(result.matches[0]?.slug).toBe("knockout-tournament");
  });

  it("asks a clarifying question for very vague input instead of guessing", () => {
    const result = matchToolDna("hello");
    expect(result.decision).toBe("clarify");
  });

  it("does not offer a composite Tool DNA (trip-planner) as a direct single match", () => {
    const result = matchToolDna("We are 8 friends traveling together and want to split all expenses.");
    expect(result.matches.every((m) => m.slug !== "trip-planner")).toBe(true);
  });
});
