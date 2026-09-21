"use client";

import type { ScreenComponentProps } from "../types";
import { labelFor } from "../types";

export function LeaderboardView({ screen, allRecords, computed, spec }: ScreenComponentProps) {
  const namespace = screen.entity?.split(".")[0] ?? spec.toolDnaSlug[0];
  const players = allRecords.filter((r) => r.entityType === screen.entity);

  if (namespace === "tournament") {
    const standings = (computed["tournament.standings"] ?? {}) as Record<string, { wins: number; losses: number }>;
    const rows = players
      .map((p) => ({ id: p.id, name: p.data.name as string, ...(standings[p.id] ?? { wins: 0, losses: 0 }) }))
      .sort((a, b) => b.wins - a.wins);
    return (
      <div className="card divide-y divide-white/5 pb-24">
        {rows.map((r, i) => (
          <div key={r.id} className="flex items-center gap-3 px-4 py-3">
            <span className="w-5 text-center text-sm font-semibold text-ink/30">{i + 1}</span>
            <span className="flex-1 text-sm font-medium">{r.name}</span>
            <span className="text-sm text-ink/50">
              {r.wins}W – {r.losses}L
            </span>
          </div>
        ))}
        {rows.length === 0 ? <p className="px-4 py-8 text-center text-sm text-ink/40">No results yet.</p> : null}
      </div>
    );
  }

  const streaks = (computed["habit.streaks"] ?? {}) as Record<string, number>;
  const rows = players
    .map((p) => ({ id: p.id, name: p.data.name as string, streak: streaks[p.id] ?? 0 }))
    .sort((a, b) => b.streak - a.streak);

  return (
    <div className="card divide-y divide-white/5 pb-24">
      {rows.map((r, i) => (
        <div key={r.id} className="flex items-center gap-3 px-4 py-3">
          <span className="w-5 text-center text-sm font-semibold text-ink/30">{i + 1}</span>
          <span className="flex-1 text-sm font-medium">{r.name}</span>
          <span className="text-sm text-accent">🔥 {r.streak}</span>
        </div>
      ))}
      {rows.length === 0 ? <p className="px-4 py-8 text-center text-sm text-ink/40">No check-ins yet.</p> : null}
    </div>
  );
}
