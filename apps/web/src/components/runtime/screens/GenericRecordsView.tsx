"use client";

import { useState } from "react";
import type { ScreenComponentProps } from "../types";
import { canDo, labelFor } from "../types";
import { RecordForm } from "../RecordForm";
import { BottomSheet } from "@/components/BottomSheet";

/** Renders as cards, a table, or a plain list depending on screen.component —
 * shared because all three are "records of one entity, optionally addable". */
export function GenericRecordsView({ appInstanceId, spec, screen, records, allRecords, fields, actions, role, currentUserId, onMutate }: ScreenComponentProps) {
  const [adding, setAdding] = useState(false);
  const addAction = actions.find((a) => a.name === "add");
  const canAdd = canDo(actions, "add", role);
  const layout = screen.component; // "cards" | "table" | "list"

  return (
    <div className="flex flex-col gap-3 pb-24">
      {records.length === 0 ? (
        <EmptyState canAdd={canAdd} onAdd={() => setAdding(true)} />
      ) : layout === "table" ? (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-primary-light/60 text-left text-xs uppercase text-ink/40">
              <tr>
                {fields.slice(0, 4).map((f) => (
                  <th key={f.key} className="px-3 py-2">
                    {f.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-t border-white/5">
                  {fields.slice(0, 4).map((f) => (
                    <td key={f.key} className="px-3 py-2">
                      {renderCell(r.data[f.key], f.type, allRecords)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        records.map((r) => (
          <div key={r.id} className="card p-4">
            {fields.slice(0, 4).map((f) => (
              <div key={f.key} className="flex items-baseline justify-between py-0.5 text-sm">
                <span className="text-ink/40">{f.label}</span>
                <span className="font-medium">{renderCell(r.data[f.key], f.type, allRecords)}</span>
              </div>
            ))}
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
            appInstanceId={appInstanceId}
            fields={fields}
            submitLabel="Add"
            onCancel={() => setAdding(false)}
            onSubmit={async (values) => {
              const payload = addAction?.payloadSchemaKey === "generic.add" ? { entityType: screen.entity, fields: values } : values;
              await onMutate({ action: "add", entity: screen.entity, payload });
              setAdding(false);
            }}
          />
        </BottomSheet>
      ) : null}
    </div>
  );
}

function renderCell(value: unknown, type: string, allRecords: ScreenComponentProps["allRecords"]) {
  if (value === undefined || value === null || value === "") return "—";
  if (type === "money") return `$${Number(value).toFixed(2)}`;
  if (type === "boolean") return value ? "Yes" : "No";
  if (type === "person" && typeof value === "string") return labelFor(allRecords, value, value);
  if (type === "multiselect" && Array.isArray(value)) return value.map((v) => labelFor(allRecords, String(v), String(v))).join(", ");
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

function EmptyState({ canAdd, onAdd }: { canAdd: boolean; onAdd: () => void }) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-12 text-center">
      <span className="text-3xl">📭</span>
      <p className="font-medium">Nothing here yet</p>
      {canAdd ? (
        <button onClick={onAdd} className="pill mt-2 bg-primary px-4 py-2 text-sm font-medium text-on-primary">
          Add the first one
        </button>
      ) : (
        <p className="text-sm text-ink/40">Check back soon.</p>
      )}
    </div>
  );
}
