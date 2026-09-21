"use client";

import { useState } from "react";
import type { ScreenComponentProps } from "../types";
import { canDo } from "../types";
import { RecordForm } from "../RecordForm";
import { BottomSheet } from "@/components/BottomSheet";

/**
 * Generic primitive proof-of-concept: propose a set of options, let members
 * pick one, tally, close. This is deliberately concept-free — every field
 * and collection name it touches comes from `screen.binding`, set entirely
 * by the app's own spec. It has no idea whether it's running a vote or a
 * meeting-availability check; two schemas differing only in binding/field
 * names (see apps/web/tests/primitives.test.ts) drive meaningfully
 * different apps through this one component. See the migration plan at
 * /root/.claude/plans/linked-drifting-popcorn.md.
 */
export function PollView({ appInstanceId, screen, records, allRecords, fields, actions, role, currentUserId, onMutate }: ScreenComponentProps) {
  const [adding, setAdding] = useState(false);
  const b = screen.binding ?? {};
  const titleField = b.titleField ?? "title";
  const optionsField = b.optionsField ?? "options";
  const statusField = b.statusField ?? "status";
  const votesCollection = b.votesCollection ?? "";
  const voteParentField = b.voteParentField ?? "parentId";
  const voteOptionField = b.voteOptionField ?? "optionId";
  const voterField = b.voterField ?? "voterId";

  const canCreate = canDo(actions, "add", role);
  const canVote = canDo(actions, "vote", role);
  const canClose = canDo(actions, "complete", role);
  const votes = allRecords.filter((r) => r.entityType === votesCollection);

  return (
    <div className="flex flex-col gap-3 pb-24">
      {records.length === 0 ? (
        <div className="card px-6 py-12 text-center text-sm text-on-surface-variant">Nothing here yet.</div>
      ) : (
        records.map((record) => {
          const options = (record.data[optionsField] as string[]) ?? [];
          const recordVotes = votes.filter((v) => v.data[voteParentField] === record.id);
          const mine = recordVotes.find((v) => v.data[voterField] === currentUserId);
          const closed = record.data[statusField] === "closed";
          const total = recordVotes.length;

          return (
            <div key={record.id} className="card p-4">
              <div className="mb-3 flex items-start justify-between gap-2">
                <p className="font-headline-sm text-headline-sm font-bold text-on-surface">{record.data[titleField] as string}</p>
                {closed ? <span className="pill bg-secondary-container px-2.5 py-1 font-label-sm text-label-sm font-bold text-on-secondary-container">Closed</span> : null}
              </div>

              <div className="flex flex-col gap-2">
                {options.map((opt) => {
                  const count = recordVotes.filter((v) => v.data[voteOptionField] === opt).length;
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  const isMine = mine?.data[voteOptionField] === opt;
                  return (
                    <button
                      key={opt}
                      aria-label={`Vote ${opt}`}
                      disabled={!canVote || closed}
                      onClick={() => onMutate({ action: "vote", entity: votesCollection, payload: { [voteParentField]: record.id, [voteOptionField]: opt } })}
                      className={`relative overflow-hidden rounded-xl border px-3 py-2 text-left font-body-md text-body-md transition-colors ${
                        isMine ? "border-primary bg-primary-fixed" : "border-on-surface/10"
                      } disabled:opacity-70`}
                    >
                      <div className="absolute inset-y-0 left-0 -z-10 bg-primary/10" style={{ width: `${pct}%` }} />
                      <span className="flex items-center justify-between">
                        <span>{opt}</span>
                        <span className="text-on-surface-variant">
                          {count}
                          {total > 0 ? ` (${pct}%)` : ""}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {canClose && !closed ? (
                <button
                  onClick={() => onMutate({ action: "complete", entity: screen.entity, payload: { id: record.id } })}
                  className="mt-3 text-xs font-medium text-on-surface-variant underline"
                >
                  Close
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
        <BottomSheet title="Create" onClose={() => setAdding(false)}>
          <RecordForm
            appInstanceId={appInstanceId}
            fields={fields.filter((f) => f.key !== statusField)}
            submitLabel="Create"
            onCancel={() => setAdding(false)}
            onSubmit={async (values) => {
              await onMutate({ action: "add", entity: screen.entity, payload: { ...values, [statusField]: "open" } });
              setAdding(false);
            }}
          />
        </BottomSheet>
      ) : null}
    </div>
  );
}
