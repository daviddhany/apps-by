"use client";

import { useState } from "react";
import type { FieldDef } from "@needly/core";

interface Props {
  fields: FieldDef[];
  submitLabel: string;
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}

export function RecordForm({ fields, submitLabel, onSubmit, onCancel }: Props) {
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const initial: Record<string, unknown> = {};
    for (const f of fields) if (f.default !== undefined) initial[f.key] = f.default;
    return initial;
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
          await onSubmit(values);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed");
        } finally {
          setBusy(false);
        }
      }}
      className="flex flex-col gap-space-sm"
    >
      {fields
        .filter((f) => f.key !== "createdAt")
        .map((field) => (
          <FieldInput
            key={field.key}
            field={field}
            value={values[field.key]}
            onChange={(v) => setValues((prev) => ({ ...prev, [field.key]: v }))}
          />
        ))}
      {error ? <p className="font-body-sm text-body-sm text-error">{error}</p> : null}
      <div className="mt-1 flex gap-2">
        <button type="button" onClick={onCancel} className="tap flex-1 rounded-full border border-on-surface/10 py-3 font-label-lg text-label-lg text-on-surface-variant">
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy}
          className="tap flex-1 rounded-full bg-primary py-3 font-label-lg text-label-lg text-on-primary shadow-md transition-transform active:scale-[0.98] disabled:opacity-50"
        >
          {busy ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

function FieldInput({ field, value, onChange }: { field: FieldDef; value: unknown; onChange: (v: unknown) => void }) {
  const base =
    "tap w-full rounded-DEFAULT bg-surface-container-low px-3.5 py-2.5 outline-none border border-transparent transition-all font-body-md text-body-md text-on-surface focus:border-primary focus:shadow-[0_0_0_3px_rgba(37,99,235,0.15)]";

  // Receipt/photo upload isn't wired into the MVP form (see ARCHITECTURE.md
  // limitations); skip rendering a misleading text input for it.
  if (field.type === "image" || field.type === "location" || field.type === "rating" || field.type === "status") {
    return null;
  }

  if (field.type === "boolean") {
    return (
      <label className="flex items-center justify-between rounded-DEFAULT bg-surface-container-low px-3.5 py-3">
        <span className="font-body-sm text-body-sm text-on-surface">{field.label}</span>
        <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5 accent-primary" />
      </label>
    );
  }

  if (field.type === "select" && field.options) {
    return (
      <label className="flex flex-col gap-1 font-label-sm text-label-sm text-on-surface-variant">
        {field.label}
        <select value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} className={base}>
          <option value="" disabled>
            Choose…
          </option>
          {field.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (field.type === "multiselect" || field.type === "person") {
    return (
      <label className="flex flex-col gap-1 font-label-sm text-label-sm text-on-surface-variant">
        {field.label}
        <input
          className={base}
          placeholder={field.type === "multiselect" ? "Comma-separated names" : "Name"}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(field.type === "multiselect" ? e.target.value.split(",").map((s) => s.trim()).filter(Boolean) : e.target.value)}
        />
      </label>
    );
  }

  return (
    <label className="flex flex-col gap-1 font-label-sm text-label-sm text-on-surface-variant">
      {field.label}
      <input
        required={field.required}
        type={field.type === "number" || field.type === "money" ? "number" : field.type === "date" ? "date" : "text"}
        step={field.type === "money" ? "0.01" : undefined}
        className={base}
        value={(value as string | number) ?? ""}
        onChange={(e) => onChange(field.type === "number" || field.type === "money" ? Number(e.target.value) : e.target.value)}
      />
    </label>
  );
}
