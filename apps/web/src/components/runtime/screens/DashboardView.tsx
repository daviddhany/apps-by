"use client";

import type { ScreenComponentProps } from "../types";
import { labelFor } from "../types";

export function DashboardView({ screen, allRecords, computed, spec }: ScreenComponentProps) {
  const computedKey = (screen.config?.computed as string | undefined) ?? "";
  const namespace = screen.entity?.split(".")[0] ?? spec.toolDnaSlug[0];
  const fullKey = `${namespace}.${computedKey}`;
  const value = computed[fullKey];

  if (fullKey === "expense.balances" && value) {
    const { balances, settlements } = value as { balances: { participantId: string; net: number }[]; settlements: { fromParticipantId: string; toParticipantId: string; amount: number }[] };
    const participants = allRecords.filter((r) => r.entityType === "expense.participant");
    return (
      <div className="flex flex-col gap-4 pb-24">
        <section className="card p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink/40">Balances</h3>
          <div className="flex flex-col gap-2">
            {balances.map((b) => (
              <div key={b.participantId} className="flex items-center justify-between text-sm">
                <span>{labelFor(participants, b.participantId)}</span>
                <span className={b.net >= 0 ? "font-semibold text-good" : "font-semibold text-danger"}>
                  {b.net >= 0 ? "+" : ""}
                  ${b.net.toFixed(2)}
                </span>
              </div>
            ))}
            {balances.length === 0 ? <p className="text-sm text-ink/40">Add an expense to see balances.</p> : null}
          </div>
        </section>

        {settlements.length > 0 ? (
          <section className="card p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink/40">Who should pay whom</h3>
            <div className="flex flex-col gap-2">
              {settlements.map((s, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl bg-primary-light px-3 py-2 text-sm">
                  <span>
                    {labelFor(participants, s.fromParticipantId)} → {labelFor(participants, s.toParticipantId)}
                  </span>
                  <span className="font-semibold text-primary-dark">${s.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    );
  }

  if (fullKey === "order.totalsByPerson" && value) {
    const totals = value as Record<string, number>;
    const participants = allRecords.filter((r) => r.entityType === "order.participant");
    const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0);
    return (
      <div className="flex flex-col gap-3 pb-24">
        <div className="card p-4 text-center">
          <p className="text-xs uppercase tracking-wide text-ink/40">Order total</p>
          <p className="text-2xl font-semibold">${grandTotal.toFixed(2)}</p>
        </div>
        <div className="card divide-y divide-white/5">
          {Object.entries(totals).map(([id, total]) => (
            <div key={id} className="flex items-center justify-between px-4 py-3 text-sm">
              <span>{labelFor(participants, id)}</span>
              <span className="font-semibold">${total.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return <div className="card px-6 py-12 text-center text-sm text-ink/50">Nothing to show yet.</div>;
}
