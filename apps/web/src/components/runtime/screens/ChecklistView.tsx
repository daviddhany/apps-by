"use client";

import { useState } from "react";
import type { ScreenComponentProps } from "../types";
import { canDo, labelFor } from "../types";
import { RecordForm } from "../RecordForm";
import { BottomSheet } from "@/components/BottomSheet";

export function ChecklistView({ screen, records, allRecords, fields, actions, role, onMutate }: ScreenComponentProps) {
  const [adding, setAdding] = useState(false);
  const canAdd = canDo(actions, "add", role);
  const canComplete = canDo(actions, "complete", role) || canDo(actions, "checkin", role);
  const done = records.filter((r) => Boolean(r.data.done ?? r.data.present)).length;

  return (
    <div className="flex flex-col gap-3 pb-24">
      {records.length > 0 ? (
        <div className="px-1 text-sm text-ink/40">
          {done} / {records.length} done
        </div>
      ) : null}

      {records.length === 0 ? (
        <div className="card px-6 py-12 text-center text-sm text-ink/50">Nothing to check off yet.</div>
      ) : (
        <div className="card divide-y divide-white/5">
          {records.map((r) => {
            const isDone = Boolean(r.data.done ?? r.data.present);
            const title = (r.data.title as string) ?? labelFor(allRecords, r.data.participantId as string, "Item");
            return (
              <label key={r.id} className="tap flex items-center gap-3 px-4 py-3">
                <input
                  type="checkbox"
                  checked={isDone}
                  disabled={!canComplete}
                  onChange={(e) =>
                    onMutate({
                      action: r.data.title !== undefined ? "complete" : "checkin",
                      entity: screen.entity,
                      payload: r.data.title !== undefined ? { itemId: r.id, done: e.target.checked } : { participantId: r.data.participantId, present: e.target.checked },
                    })
                  }
                  className="h-5 w-5 accent-primary"
                />
                <span className={isDone ? "flex-1 text-ink/40 line-through" : "flex-1"}>{title}</span>
              </label>
            );
          })}
        </div>
      )}

      {canAdd ? (
        <button onClick={() => setAdding(true)} className="tap fixed bottom-24 right-5 z-30 h-14 w-14 rounded-full bg-primary text-2xl text-on-primary shadow-lg active:scale-95">
          +
        </button>
      ) : null}

      {adding ? (
        <BottomSheet title="Add item" onClose={() => setAdding(false)}>
          <RecordForm
            fields={fields}
            submitLabel="Add"
            onCancel={() => setAdding(false)}
            onSubmit={async (values) => {
              await onMutate({ action: "add", entity: screen.entity, payload: { entityType: screen.entity, fields: values } });
              setAdding(false);
            }}
          />
        </BottomSheet>
      ) : null}
    </div>
  );
}
