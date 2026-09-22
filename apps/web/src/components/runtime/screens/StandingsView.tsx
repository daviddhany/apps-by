"use client";

import type { ScreenComponentProps } from "../types";

/**
 * Generic primitive: renders a ranked table from a computed {string: number}
 * map (typically produced by the groupSum/groupCount expression functions —
 * see packages/core/src/primitives/expression.ts). Zero concept-specific
 * logic — every collection/field name comes from `screen.binding`. Sibling
 * of PollView.tsx, which this mirrors in structure and design tokens.
 */
export function StandingsView({ screen, allRecords, computed }: ScreenComponentProps) {
  const b = screen.binding ?? {};
  const computedKey = b.computedKey ?? "";
  const labelCollection = b.labelCollection;
  const labelField = b.labelField ?? "name";

  const standings = (computed[computedKey] ?? {}) as Record<string, number>;
  const labelRecords = labelCollection ? allRecords.filter((r) => r.entityType === labelCollection) : [];

  const rows = Object.entries(standings)
    .map(([key, value]) => {
      const labelRecord = labelRecords.find((r) => r.id === key);
      const label = (labelRecord?.data[labelField] as string | undefined) ?? key;
      return { key, label, value };
    })
    .sort((a, b2) => b2.value - a.value);

  return (
    <div className="flex flex-col gap-3 pb-24">
      {rows.length === 0 ? (
        <div className="card px-6 py-12 text-center text-sm text-on-surface-variant">Nothing here yet.</div>
      ) : (
        <div className="card divide-y divide-on-surface/10">
          {rows.map((row, i) => (
            <div key={row.key} className="flex items-center gap-3 px-4 py-3">
              <span className="w-6 text-center font-label-md text-label-md font-bold text-on-surface-variant">{i + 1}</span>
              <span className="flex-1 truncate font-body-md text-body-md font-medium text-on-surface">{row.label}</span>
              <span className="font-label-lg text-label-lg font-bold text-primary">{row.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
