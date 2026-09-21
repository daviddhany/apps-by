// Pure computation functions for each Tool DNA's `computed` values. Kept
// dependency-free (plain data in, plain data out) so they're directly unit
// testable (see tests/expense.test.ts, tests/tournament.test.ts).

export interface Participant {
  id: string;
  name: string;
  isCarOwner?: boolean;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  paidByParticipantId: string;
  splitAmong?: string[]; // participant ids; defaults to all participants
  splitMode?: "equal" | "exact" | "percentage";
  exactShares?: Record<string, number>;
}

export interface Balance {
  participantId: string;
  net: number; // positive = is owed money, negative = owes money
}

export interface Settlement {
  fromParticipantId: string;
  toParticipantId: string;
  amount: number;
}

/**
 * Computes each participant's net balance from a list of expenses, honoring
 * per-expense splitAmong/splitMode, then produces a minimal set of
 * settlement transfers that zero out all balances.
 */
export function computeBalances(participants: Participant[], expenses: Expense[]): { balances: Balance[]; settlements: Settlement[] } {
  const net = new Map<string, number>(participants.map((p) => [p.id, 0]));

  for (const exp of expenses) {
    const among = exp.splitAmong && exp.splitAmong.length > 0 ? exp.splitAmong : participants.map((p) => p.id);
    const shares = computeShares(exp, among);

    net.set(exp.paidByParticipantId, (net.get(exp.paidByParticipantId) ?? 0) + exp.amount);
    for (const [participantId, share] of shares) {
      net.set(participantId, (net.get(participantId) ?? 0) - share);
    }
  }

  const balances: Balance[] = [...net.entries()].map(([participantId, value]) => ({
    participantId,
    net: roundMoney(value),
  }));

  const settlements = computeSettlements(balances);
  return { balances, settlements };
}

function computeShares(exp: Expense, among: string[]): Map<string, number> {
  const shares = new Map<string, number>();
  if (exp.splitMode === "exact" && exp.exactShares) {
    for (const id of among) shares.set(id, exp.exactShares[id] ?? 0);
    return shares;
  }
  if (exp.splitMode === "percentage" && exp.exactShares) {
    for (const id of among) shares.set(id, (exp.amount * (exp.exactShares[id] ?? 0)) / 100);
    return shares;
  }
  const equalShare = exp.amount / among.length;
  for (const id of among) shares.set(id, equalShare);
  return shares;
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Greedy min-cash-flow settlement: largest debtor pays largest creditor, repeat. */
function computeSettlements(balances: Balance[]): Settlement[] {
  const creditors = balances.filter((b) => b.net > 0.01).map((b) => ({ ...b })).sort((a, b) => b.net - a.net);
  const debtors = balances.filter((b) => b.net < -0.01).map((b) => ({ ...b, net: -b.net })).sort((a, b) => b.net - a.net);
  const settlements: Settlement[] = [];

  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amount = roundMoney(Math.min(debtors[i].net, creditors[j].net));
    if (amount > 0) {
      settlements.push({ fromParticipantId: debtors[i].participantId, toParticipantId: creditors[j].participantId, amount });
    }
    debtors[i].net = roundMoney(debtors[i].net - amount);
    creditors[j].net = roundMoney(creditors[j].net - amount);
    if (debtors[i].net <= 0.01) i++;
    if (creditors[j].net <= 0.01) j++;
  }
  return settlements;
}

// --- Tournament bracket ---

export interface Match {
  id: string;
  round: number;
  slot: number;
  playerAId?: string;
  playerBId?: string;
  scoreA?: number;
  scoreB?: number;
  status: "pending" | "in_progress" | "done";
}

export function generateBracket(playerIds: string[]): Match[] {
  const size = nextPowerOfTwo(playerIds.length);
  const padded = [...playerIds];
  while (padded.length < size) padded.push(undefined as unknown as string); // byes

  const matches: Match[] = [];
  let matchIdCounter = 0;
  const round1: Match[] = [];
  for (let slot = 0; slot < size / 2; slot++) {
    round1.push({
      id: `m${matchIdCounter++}`,
      round: 1,
      slot,
      playerAId: padded[slot * 2],
      playerBId: padded[slot * 2 + 1],
      status: "pending",
    });
  }
  matches.push(...round1);

  let roundSize = size / 4;
  let round = 2;
  while (roundSize >= 1) {
    for (let slot = 0; slot < roundSize; slot++) {
      matches.push({ id: `m${matchIdCounter++}`, round, slot, status: "pending" });
    }
    roundSize = roundSize / 2;
    round++;
  }
  return matches;
}

function nextPowerOfTwo(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return Math.max(p, 2);
}

/** Applies a recorded score to a match and, if it decides a winner, advances
 * the winner into the correct slot of the next round's match. Returns the
 * updated matches array (does not mutate input). */
export function advanceBracket(matches: Match[], matchId: string, scoreA: number, scoreB: number): Match[] {
  const next = matches.map((m) => ({ ...m }));
  const match = next.find((m) => m.id === matchId);
  if (!match) throw new Error("Match not found");

  match.scoreA = scoreA;
  match.scoreB = scoreB;
  match.status = "done";
  const winnerId = scoreA > scoreB ? match.playerAId : match.playerBId;

  const nextRoundMatch = next.find((m) => m.round === match.round + 1 && m.slot === Math.floor(match.slot / 2));
  if (nextRoundMatch && winnerId) {
    if (match.slot % 2 === 0) nextRoundMatch.playerAId = winnerId;
    else nextRoundMatch.playerBId = winnerId;
  }
  return next;
}

export function computeStandings(matches: Match[]): Record<string, { wins: number; losses: number }> {
  const standings: Record<string, { wins: number; losses: number }> = {};
  for (const m of matches) {
    if (m.status !== "done" || m.scoreA === undefined || m.scoreB === undefined) continue;
    const winner = m.scoreA > m.scoreB ? m.playerAId : m.playerBId;
    const loser = m.scoreA > m.scoreB ? m.playerBId : m.playerAId;
    if (winner) standings[winner] = { wins: (standings[winner]?.wins ?? 0) + 1, losses: standings[winner]?.losses ?? 0 };
    if (loser) standings[loser] = { wins: standings[loser]?.wins ?? 0, losses: (standings[loser]?.losses ?? 0) + 1 };
  }
  return standings;
}

// --- Voting ---

export function tallyVotes(votes: { optionId: string }[]): Record<string, number> {
  const tally: Record<string, number> = {};
  for (const v of votes) tally[v.optionId] = (tally[v.optionId] ?? 0) + 1;
  return tally;
}

// --- Habit streaks ---

export function computeStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const sorted = [...new Set(dates)].sort().reverse();
  let streak = 1;
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = new Date(sorted[i]);
    const b = new Date(sorted[i + 1]);
    const diffDays = Math.round((a.getTime() - b.getTime()) / 86400000);
    if (diffDays === 1) streak++;
    else break;
  }
  return streak;
}
