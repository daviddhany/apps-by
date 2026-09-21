import { describe, expect, it } from "vitest";
import { computeBalances } from "@needly/core";

describe("expense balances", () => {
  it("splits equally among all participants by default", () => {
    const participants = [{ id: "a", name: "A" }, { id: "b", name: "B" }, { id: "c", name: "C" }];
    const expenses = [{ id: "e1", description: "Dinner", amount: 90, paidByParticipantId: "a" }];

    const { balances } = computeBalances(participants, expenses);
    expect(balances.find((b) => b.participantId === "a")?.net).toBe(60); // paid 90, owes 30
    expect(balances.find((b) => b.participantId === "b")?.net).toBe(-30);
    expect(balances.find((b) => b.participantId === "c")?.net).toBe(-30);
  });

  it("excludes participants from splitAmong when specified (uneven split rule)", () => {
    const participants = [{ id: "a", name: "A" }, { id: "b", name: "B", isCarOwner: false }, { id: "c", name: "C", isCarOwner: true }];
    const expenses = [{ id: "e1", description: "Fuel", amount: 100, paidByParticipantId: "c", splitAmong: ["a", "c"] }];

    const { balances } = computeBalances(participants, expenses);
    expect(balances.find((b) => b.participantId === "b")?.net).toBe(0); // excluded entirely
    expect(balances.find((b) => b.participantId === "a")?.net).toBe(-50);
    expect(balances.find((b) => b.participantId === "c")?.net).toBe(50);
  });

  it("honors exact shares", () => {
    const participants = [{ id: "a", name: "A" }, { id: "b", name: "B" }];
    const expenses = [
      { id: "e1", description: "Split unevenly", amount: 100, paidByParticipantId: "a", splitMode: "exact" as const, exactShares: { a: 20, b: 80 }, splitAmong: ["a", "b"] },
    ];
    const { balances } = computeBalances(participants, expenses);
    expect(balances.find((b) => b.participantId === "a")?.net).toBe(80);
    expect(balances.find((b) => b.participantId === "b")?.net).toBe(-80);
  });

  it("produces a minimal settlement plan that zeroes all balances", () => {
    const participants = [{ id: "a", name: "A" }, { id: "b", name: "B" }, { id: "c", name: "C" }];
    const expenses = [
      { id: "e1", description: "Hotel", amount: 300, paidByParticipantId: "a" },
      { id: "e2", description: "Food", amount: 60, paidByParticipantId: "b" },
    ];
    const { balances, settlements } = computeBalances(participants, expenses);
    const totalTransferred = settlements.reduce((sum, s) => sum + s.amount, 0);
    const totalOwed = balances.filter((b) => b.net < 0).reduce((sum, b) => sum - b.net, 0);
    expect(totalTransferred).toBeCloseTo(totalOwed, 2);
  });
});
