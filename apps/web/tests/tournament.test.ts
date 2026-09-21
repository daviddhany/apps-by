import { describe, expect, it } from "vitest";
import { generateBracket, advanceBracket, computeStandings } from "@needly/core";

describe("tournament bracket", () => {
  it("generates a full bracket for a power-of-two player count", () => {
    const players = ["p1", "p2", "p3", "p4"];
    const matches = generateBracket(players);
    expect(matches.filter((m) => m.round === 1)).toHaveLength(2);
    expect(matches.filter((m) => m.round === 2)).toHaveLength(1);
  });

  it("pads a non-power-of-two count with byes", () => {
    const players = ["p1", "p2", "p3"];
    const matches = generateBracket(players);
    // rounds up to 4-player bracket: 2 round-1 matches, 1 final
    expect(matches.filter((m) => m.round === 1)).toHaveLength(2);
    const withBye = matches.find((m) => m.round === 1 && (!m.playerAId || !m.playerBId));
    expect(withBye).toBeTruthy();
  });

  it("advances the winner into the correct next-round slot", () => {
    const matches = generateBracket(["p1", "p2", "p3", "p4"]);
    const round1MatchA = matches.find((m) => m.round === 1 && m.slot === 0)!;
    const updated = advanceBracket(matches, round1MatchA.id, 3, 1);
    const final = updated.find((m) => m.round === 2)!;
    expect(final.playerAId).toBe(round1MatchA.playerAId);
  });

  it("computes win/loss standings from completed matches", () => {
    let matches = generateBracket(["p1", "p2", "p3", "p4"]);
    const m0 = matches.find((m) => m.slot === 0 && m.round === 1)!;
    const m1 = matches.find((m) => m.slot === 1 && m.round === 1)!;
    matches = advanceBracket(matches, m0.id, 2, 0);
    matches = advanceBracket(matches, m1.id, 1, 3);
    const standings = computeStandings(matches);
    expect(standings["p1"]).toEqual({ wins: 1, losses: 0 });
    expect(standings["p2"]).toEqual({ wins: 0, losses: 1 });
    expect(standings["p4"]).toEqual({ wins: 1, losses: 0 });
  });
});
