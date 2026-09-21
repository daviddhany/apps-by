"use client";

import { useState } from "react";
import type { ScreenComponentProps } from "../types";
import { canDo } from "../types";
import { RecordForm } from "../RecordForm";
import { BottomSheet } from "@/components/BottomSheet";

export function VotingView({ appInstanceId, screen, records, allRecords, fields, actions, role, currentUserId, onMutate }: ScreenComponentProps) {
  const [adding, setAdding] = useState(false);
  const canCreate = canDo(actions, "add", role);
  const canVote = canDo(actions, "vote", role);
  const canClose = canDo(actions, "complete", role);
  const votes = allRecords.filter((r) => r.entityType === "voting.vote");

  return (
    <div className="flex flex-col gap-3 pb-24">
      {records.length === 0 ? (
        <div className="card px-6 py-12 text-center text-sm text-ink/50">No polls yet.</div>
      ) : (
        records.map((poll) => {
          const options = (poll.data.options as string[]) ?? [];
          const pollVotes = votes.filter((v) => v.data.pollId === poll.id);
          const myVote = pollVotes.find((v) => v.data.participantId === currentUserId);
          const closed = poll.data.status === "closed";
          const total = pollVotes.length;

          return (
            <div key={poll.id} className="card p-4">
              <div className="mb-3 flex items-start justify-between">
                <p className="font-medium">{poll.data.question as string}</p>
                {closed ? <span className="pill bg-white/5 px-2 py-0.5 text-xs text-ink/50">Closed</span> : null}
              </div>
              <div className="flex flex-col gap-2">
                {options.map((opt) => {
                  const count = pollVotes.filter((v) => v.data.optionId === opt).length;
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  const mine = myVote?.data.optionId === opt;
                  return (
                    <button
                      key={opt}
                      disabled={!canVote || closed}
                      onClick={() => onMutate({ action: "vote", entity: "voting.vote", payload: { pollId: poll.id, optionId: opt } })}
                      className={`relative overflow-hidden rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                        mine ? "border-primary bg-primary-light" : "border-white/10"
                      } disabled:opacity-70`}
                    >
                      <div className="absolute inset-y-0 left-0 -z-10 bg-primary/10" style={{ width: `${pct}%` }} />
                      <span className="flex items-center justify-between">
                        <span>{opt}</span>
                        <span className="text-ink/40">
                          {count} {total > 0 ? `(${pct}%)` : ""}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
              {canClose && !closed ? (
                <button
                  onClick={() => onMutate({ action: "complete", entity: "voting.poll", payload: { pollId: poll.id } })}
                  className="mt-3 text-xs font-medium text-ink/40 underline"
                >
                  Close voting
                </button>
              ) : null}
            </div>
          );
        })
      )}

      {canCreate ? (
        <button onClick={() => setAdding(true)} className="tap fixed bottom-24 right-5 z-30 h-14 w-14 rounded-full bg-primary text-2xl text-on-primary shadow-lg active:scale-95">
          +
        </button>
      ) : null}

      {adding ? (
        <BottomSheet title="New poll" onClose={() => setAdding(false)}>
          <RecordForm
            appInstanceId={appInstanceId}
            fields={fields}
            submitLabel="Create"
            onCancel={() => setAdding(false)}
            onSubmit={async (values) => {
              await onMutate({ action: "add", entity: screen.entity, payload: { entityType: screen.entity, fields: { ...values, status: "open" } } });
              setAdding(false);
            }}
          />
        </BottomSheet>
      ) : null}
    </div>
  );
}
