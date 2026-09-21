"use client";

import { useState } from "react";
import type { FieldDef } from "@needly/core";
import { Icon } from "../Icon";

interface Props {
  appInstanceId: string;
  fields: FieldDef[];
  submitLabel: string;
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}

export function RecordForm({ appInstanceId, fields, submitLabel, onSubmit, onCancel }: Props) {
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
            appInstanceId={appInstanceId}
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

function FieldInput({
  appInstanceId,
  field,
  value,
  onChange,
}: {
  appInstanceId: string;
  field: FieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const base =
    "tap w-full rounded-DEFAULT bg-surface-container-low px-3.5 py-2.5 outline-none border border-transparent transition-all font-body-md text-body-md text-on-surface focus:border-primary focus:shadow-[0_0_0_3px_rgba(37,99,235,0.15)]";

  if (field.type === "image") {
    return <ImageUploadInput appInstanceId={appInstanceId} label={field.label} value={(value as string) ?? ""} onChange={onChange} />;
  }

  // Location/rating/status pickers aren't wired into the MVP form yet (see
  // ARCHITECTURE.md limitations); skip rendering a misleading text input.
  if (field.type === "location" || field.type === "rating" || field.type === "status") {
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

  if (field.type === "multiselect") {
    return <ChipListInput label={field.label} value={Array.isArray(value) ? (value as string[]) : []} onChange={onChange} />;
  }

  if (field.type === "person") {
    return (
      <label className="flex flex-col gap-1 font-label-sm text-label-sm text-on-surface-variant">
        {field.label}
        <input className={base} placeholder="Name" value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />
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

function ImageUploadInput({
  appInstanceId,
  label,
  value,
  onChange,
}: {
  appInstanceId: string;
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/apps/${appInstanceId}/upload`, { method: "POST", body: form });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Upload failed");
      onChange(body.url as string);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5 font-label-sm text-label-sm text-on-surface-variant">
      {label}
      {value ? (
        <div className="relative overflow-hidden rounded-DEFAULT bg-surface-container-low">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt={label} className="h-40 w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Remove photo"
            className="tap absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white"
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      ) : (
        <label className="tap flex cursor-pointer items-center justify-center gap-2 rounded-DEFAULT border border-dashed border-on-surface/20 bg-surface-container-low py-6 font-label-md text-label-md font-medium text-on-surface-variant">
          {uploading ? (
            "Uploading…"
          ) : (
            <>
              <Icon name="add_a_photo" size={20} />
              <span>Add a photo</span>
            </>
          )}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            disabled={uploading}
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </label>
      )}
      {error ? <span className="font-body-sm text-body-sm text-error">{error}</span> : null}
    </div>
  );
}

/** "Add <name>" chip entry, one at a time, instead of a fiddly
 * comma-separated text box — used for voting options, split-among names,
 * passenger lists, etc. */
function ChipListInput({ label, value, onChange }: { label: string; value: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState("");

  function commit() {
    const trimmed = draft.trim();
    if (!trimmed || value.includes(trimmed)) {
      setDraft("");
      return;
    }
    onChange([...value, trimmed]);
    setDraft("");
  }

  return (
    <div className="flex flex-col gap-1.5 font-label-sm text-label-sm text-on-surface-variant">
      {label}
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
          }}
          placeholder="Type a name and press Enter"
          className="tap w-full rounded-DEFAULT bg-surface-container-low px-3.5 py-2.5 font-body-md text-body-md text-on-surface outline-none focus:shadow-[0_0_0_3px_rgba(37,99,235,0.15)]"
        />
        <button
          type="button"
          onClick={commit}
          className="tap shrink-0 rounded-DEFAULT bg-surface-container-high px-3.5 font-label-md text-label-md font-semibold text-on-surface"
        >
          Add
        </button>
      </div>
      {value.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {value.map((item) => (
            <span key={item} className="flex items-center gap-1 rounded-full bg-primary-fixed py-1 pl-3 pr-1.5 font-label-sm text-label-sm text-on-primary-fixed">
              {item}
              <button
                type="button"
                onClick={() => onChange(value.filter((v) => v !== item))}
                aria-label={`Remove ${item}`}
                className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-black/10"
              >
                <Icon name="close" size={12} />
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
