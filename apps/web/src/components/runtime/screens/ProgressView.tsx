"use client";

import { useState } from "react";
import type { ScreenComponentProps } from "../types";
import { canDo, labelFor } from "../types";
import { RecordForm } from "../RecordForm";
import { BottomSheet } from "@/components/BottomSheet";

export function ProgressView({ appInstanceId, screen, records, allRecords, fields, actions, spec, role, computed, onMutate }: ScreenComponentProps) {
  const [adding, setAdding] = useState(false);
  const canAdd = canDo(actions, "add", role);
  const goal = Number(spec.settings.goalAmount ?? 0);
  const total = Number(computed["savings.totalProgress"] ?? 0);
  const pct = goal > 0 ? Math.min(100, Math.round((total / goal) * 100)) : 0;
  const participants = allRecords.filter((r) => r.entityType === "savings.participant");

  return (
    <div className="flex flex-col gap-4 pb-24">
      <div className="card p-5 text-center">
        <p className="text-xs uppercase tracking-wide text-ink/40">Progress toward goal</p>
        <p className="mt-1 text-2xl font-semibold">
          ${total.toFixed(2)} <span className="text-base text-ink/40">/ ${goal.toFixed(2)}</span>
        </p>
        <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-white/5">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="card divide-y divide-white/5">
        {records
          .slice()
          .reverse()
          .map((r) => (
            <div key={r.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <span>{labelFor(participants, r.data.participantId as string)}</span>
              <span className="font-semibold text-good">+${Number(r.data.amount).toFixed(2)}</span>
            </div>
          ))}
        {records.length === 0 ? <p className="px-4 py-8 text-center text-sm text-ink/40">No contributions yet.</p> : null}
      </div>

      {canAdd ? (
        <button onClick={() => setAdding(true)} className="tap fixed bottom-24 right-5 z-30 h-14 w-14 rounded-full bg-primary text-2xl text-on-primary shadow-lg active:scale-95">
          +
        </button>
      ) : null}

      {adding ? (
        <BottomSheet title="Add contribution" onClose={() => setAdding(false)}>
          <RecordForm
            appInstanceId={appInstanceId}
            fields={fields}
            submitLabel="Add"
            onCancel={() => setAdding(false)}
            onSubmit={async (values) => {
              await onMutate({ action: "add", entity: screen.entity, payload: { participantId: values.participantId, amount: Number(values.amount) } });
              setAdding(false);
            }}
          />
        </BottomSheet>
      ) : null}
    </div>
  );
}
