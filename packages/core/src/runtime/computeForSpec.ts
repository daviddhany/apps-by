import type { MiniAppSpecification } from "../types";
import { computeBalances, computeStandings, tallyVotes, computeStreak, type Participant, type Expense, type Match } from "./compute";

export interface AppDataRecord {
  id: string;
  entityType: string;
  data: Record<string, unknown>;
}

function byType(records: AppDataRecord[], entityType: string) {
  return records.filter((r) => r.entityType === entityType);
}

/** Computes every `computed` value declared in the spec from the raw AppData
 * records. Keyed by the same namespaced key as spec.computed[].key. */
export function computeForSpec(spec: MiniAppSpecification, records: AppDataRecord[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  for (const c of spec.computed) {
    switch (c.key) {
      case "expense.balances": {
        const participants = byType(records, "expense.participant").map((r) => ({ id: r.id, ...r.data })) as Participant[];
        const expenses = byType(records, "expense.expense").map((r) => ({ id: r.id, ...r.data })) as Expense[];
        out[c.key] = computeBalances(participants, expenses);
        break;
      }
      case "tournament.standings": {
        const matches = byType(records, "tournament.match").map((r) => ({ id: r.id, ...r.data })) as Match[];
        out[c.key] = computeStandings(matches);
        break;
      }
      case "voting.tally": {
        const votes = byType(records, "voting.vote").map((r) => r.data as { optionId: string });
        out[c.key] = tallyVotes(votes);
        break;
      }
      case "meeting.tally": {
        const availability = byType(records, "meeting.availability").map((r) => r.data as { optionId: string });
        out[c.key] = tallyVotes(availability);
        break;
      }
      case "journal.streaks": {
        const entries = byType(records, "journal.entry").map((r) => r.data as { authorId: string; date: string });
        const byAuthor = new Map<string, string[]>();
        for (const e of entries) {
          const arr = byAuthor.get(e.authorId) ?? [];
          arr.push(e.date);
          byAuthor.set(e.authorId, arr);
        }
        out[c.key] = Object.fromEntries([...byAuthor.entries()].map(([id, dates]) => [id, computeStreak(dates)]));
        break;
      }
      case "quiz.leaderboard": {
        const answers = byType(records, "quiz.answer").map((r) => r.data as { playerId: string; correct: boolean; points: number });
        const board: Record<string, { points: number; correct: number }> = {};
        for (const a of answers) {
          const entry = board[a.playerId] ?? { points: 0, correct: 0 };
          entry.points += a.points ?? 0;
          if (a.correct) entry.correct += 1;
          board[a.playerId] = entry;
        }
        out[c.key] = board;
        break;
      }
      case "habit.streaks": {
        const checkins = byType(records, "habit.checkin");
        const byParticipant = new Map<string, string[]>();
        for (const c2 of checkins) {
          const d = c2.data as { participantId: string; date: string; done: boolean };
          if (!d.done) continue;
          const arr = byParticipant.get(d.participantId) ?? [];
          arr.push(d.date);
          byParticipant.set(d.participantId, arr);
        }
        out[c.key] = Object.fromEntries([...byParticipant.entries()].map(([id, dates]) => [id, computeStreak(dates)]));
        break;
      }
      case "savings.totalProgress": {
        const contributions = byType(records, "savings.contribution").map((r) => r.data as { amount: number });
        out[c.key] = contributions.reduce((sum, c2) => sum + c2.amount, 0);
        break;
      }
      case "order.totalsByPerson": {
        const items = byType(records, "order.orderItem").map((r) => r.data as { participantId: string; price: number });
        const totals: Record<string, number> = {};
        for (const item of items) totals[item.participantId] = (totals[item.participantId] ?? 0) + item.price;
        out[c.key] = totals;
        break;
      }
      case "attendance.attendanceRate": {
        const checkins = byType(records, "attendance.checkin").map((r) => r.data as { present: boolean });
        const present = checkins.filter((c2) => c2.present).length;
        out[c.key] = checkins.length ? present / checkins.length : 0;
        break;
      }
      case "checklist.progress": {
        const items = byType(records, "checklist.item").map((r) => r.data as { done: boolean });
        const done = items.filter((i) => i.done).length;
        out[c.key] = items.length ? done / items.length : 0;
        break;
      }
      default:
        out[c.key] = null;
    }
  }

  return out;
}
