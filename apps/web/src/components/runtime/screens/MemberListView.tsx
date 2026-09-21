"use client";

import { useState } from "react";
import type { ScreenComponentProps } from "../types";
import { canDo } from "../types";
import { RecordForm } from "../RecordForm";
import { BottomSheet } from "@/components/BottomSheet";

export function MemberListView({ screen, records, fields, actions, role, members, onMutate }: ScreenComponentProps) {
  const [adding, setAdding] = useState(false);
  const canAdd = canDo(actions, "add", role);

  return (
    <div className="flex flex-col gap-4 pb-24">
      <section>
        <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-ink/40">App members</h3>
        <div className="card divide-y divide-white/5">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-4 py-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-light text-sm font-semibold text-primary">
                {m.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="flex-1">
                <span className="block text-sm font-medium">
                  {m.name} {m.isGuest ? <span className="text-xs text-ink/30">(guest)</span> : null}
                </span>
              </span>
              <span className="pill bg-white/5 px-2 py-0.5 text-xs text-ink/50">{m.role}</span>
            </div>
          ))}
        </div>
      </section>

      {records.length > 0 ? (
        <section>
          <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-ink/40">{screen.title}</h3>
          <div className="card divide-y divide-white/5">
            {records.map((r) => (
              <div key={r.id} className="px-4 py-3 text-sm font-medium">
                {(r.data.name as string) ?? "—"}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {canAdd ? (
        <button onClick={() => setAdding(true)} className="tap fixed bottom-24 right-5 z-30 h-14 w-14 rounded-full bg-primary text-2xl text-on-primary shadow-lg active:scale-95">
          +
        </button>
      ) : null}

      {adding ? (
        <BottomSheet title="Add person" onClose={() => setAdding(false)}>
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
