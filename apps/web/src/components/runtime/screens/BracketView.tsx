"use client";

import { useState } from "react";
import type { ScreenComponentProps } from "../types";
import { canDo, labelFor } from "../types";

export function BracketView({ records, allRecords, actions, role, onMutate }: ScreenComponentProps) {
  const canRecord = canDo(actions, "record_score", role);
  const canRandomize = canDo(actions, "randomize", role);
  const players = allRecords.filter((r) => r.entityType === "tournament.player");
  const rounds = [...new Set(records.map((r) => r.data.round as number))].sort((a, b) => a - b);

  return (
    <div className="flex gap-4 overflow-x-auto pb-24 pt-1">
      {rounds.length === 0 ? (
        <div className="card flex w-full flex-col items-center gap-3 px-6 py-12 text-center text-sm text-ink/50">
          <p>{players.length < 2 ? "Add at least 2 players, then generate the bracket." : "Ready to generate the bracket."}</p>
          {canRandomize && players.length >= 2 ? (
            <button
              onClick={() => onMutate({ action: "randomize", entity: "tournament.match", payload: {} })}
              className="pill bg-primary px-4 py-2 text-sm font-medium text-on-primary"
            >
              Generate bracket
            </button>
          ) : null}
        </div>
      ) : (
        rounds.map((round) => (
          <div key={round} className="flex min-w-[220px] flex-col justify-around gap-3">
            <p className="text-center text-xs font-semibold uppercase tracking-wide text-ink/40">
              {round === Math.max(...rounds) ? "Final" : `Round ${round}`}
            </p>
            {records
              .filter((r) => r.data.round === round)
              .sort((a, b) => (a.data.slot as number) - (b.data.slot as number))
              .map((m) => (
                <MatchCard key={m.id} match={m} players={players} canRecord={canRecord} onMutate={onMutate} />
              ))}
          </div>
        ))
      )}
    </div>
  );
}

function MatchCard({
  match,
  players,
  canRecord,
  onMutate,
}: {
  match: ScreenComponentProps["records"][number];
  players: ScreenComponentProps["allRecords"];
  canRecord: boolean;
  onMutate: ScreenComponentProps["onMutate"];
}) {
  const [editing, setEditing] = useState(false);
  const [scoreA, setScoreA] = useState(String(match.data.scoreA ?? ""));
  const [scoreB, setScoreB] = useState(String(match.data.scoreB ?? ""));
  const playerAId = match.data.playerAId as string | undefined;
  const playerBId = match.data.playerBId as string | undefined;
  const done = match.data.status === "done";

  return (
    <div className="card p-3">
      <Row label={labelFor(players, playerAId, "TBD")} score={match.data.scoreA as number | undefined} won={done && (match.data.scoreA as number) > (match.data.scoreB as number)} />
      <Row label={labelFor(players, playerBId, "TBD")} score={match.data.scoreB as number | undefined} won={done && (match.data.scoreB as number) > (match.data.scoreA as number)} />

      {canRecord && playerAId && playerBId && !done ? (
        editing ? (
          <form
            className="mt-2 flex items-center gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              await onMutate({ action: "record_score", entity: "tournament.match", payload: { matchId: match.id, scoreA: Number(scoreA), scoreB: Number(scoreB) } });
              setEditing(false);
            }}
          >
            <input value={scoreA} onChange={(e) => setScoreA(e.target.value)} type="number" className="w-12 rounded-lg border border-white/10 px-2 py-1 text-center text-sm" />
            <span className="text-ink/30">–</span>
            <input value={scoreB} onChange={(e) => setScoreB(e.target.value)} type="number" className="w-12 rounded-lg border border-white/10 px-2 py-1 text-center text-sm" />
            <button type="submit" className="pill ml-auto bg-primary px-2 py-1 text-xs font-medium text-on-primary">
              Save
            </button>
          </form>
        ) : (
          <button onClick={() => setEditing(true)} className="mt-2 w-full rounded-lg bg-primary-light py-1.5 text-xs font-medium text-primary-dark">
            Enter score
          </button>
        )
      ) : null}
    </div>
  );
}

function Row({ label, score, won }: { label: string; score?: number; won: boolean }) {
  return (
    <div className={`flex items-center justify-between rounded-lg px-2 py-1 text-sm ${won ? "bg-good/10 font-semibold text-good" : ""}`}>
      <span>{label}</span>
      <span>{score ?? ""}</span>
    </div>
  );
}
