"use client";

import { useState } from "react";
import type { ScreenComponentProps } from "../types";
import { canDo, labelFor } from "../types";
import { RecordForm } from "../RecordForm";
import { BottomSheet } from "@/components/BottomSheet";

// Simplified calendar: groups records by date and lists them chronologically
// rather than a full month grid — sufficient for the MVP's event/reservation
// volumes and still mobile-first (a scrolling agenda, not a cramped grid).
export function CalendarView({ screen, records, allRecords, fields, actions, role, onMutate }: ScreenComponentProps) {
  const [adding, setAdding] = useState(false);
  const canAdd = canDo(actions, "add", role) || canDo(actions, "reserve", role);
  const dateField = fields.find((f) => f.type === "date")?.key ?? "date";

  const grouped = new Map<string, typeof records>();
  for (const r of records) {
    const key = (r.data[dateField] as string) ?? (r.data.start as string) ?? "Undated";
    grouped.set(key, [...(grouped.get(key) ?? []), r]);
  }
  const sortedKeys = [...grouped.keys()].sort();

  return (
    <div className="flex flex-col gap-3 pb-24">
      {sortedKeys.length === 0 ? (
        <div className="card px-6 py-12 text-center text-sm text-ink/50">Nothing scheduled yet.</div>
      ) : (
        sortedKeys.map((key) => (
          <div key={key}>
            <p className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-ink/40">{formatDate(key)}</p>
            <div className="card divide-y divide-white/5">
              {grouped.get(key)!.map((r) => (
                <div key={r.id} className="px-4 py-3 text-sm">
                  <p className="font-medium">{(r.data.title as string) ?? (r.data.resourceId ? labelFor(allRecords, r.data.resourceId as string, "Resource") : "Event")}</p>
                  {r.data.participantId ? <p className="text-xs text-ink/40">by {labelFor(allRecords, r.data.participantId as string)}</p> : null}
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {canAdd ? (
        <button onClick={() => setAdding(true)} className="tap fixed bottom-24 right-5 z-30 h-14 w-14 rounded-full bg-primary text-2xl text-on-primary shadow-lg active:scale-95">
          +
        </button>
      ) : null}

      {adding ? (
        <BottomSheet title={`Add ${screen.title.replace(/s$/, "")}`} onClose={() => setAdding(false)}>
          <RecordForm
            fields={fields}
            submitLabel="Add"
            onCancel={() => setAdding(false)}
            onSubmit={async (values) => {
              const addAction = actions.find((a) => a.name === "add" || a.name === "reserve");
              const payload = addAction?.payloadSchemaKey === "generic.add" ? { entityType: screen.entity, fields: values } : values;
              await onMutate({ action: addAction?.name ?? "add", entity: screen.entity, payload });
              setAdding(false);
            }}
          />
        </BottomSheet>
      ) : null}
    </div>
  );
}

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}
