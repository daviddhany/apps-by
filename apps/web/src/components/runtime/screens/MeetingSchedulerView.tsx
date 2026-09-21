"use client";

import { useState } from "react";
import type { ScreenComponentProps } from "../types";
import { canDo } from "../types";
import { RecordForm } from "../RecordForm";
import { BottomSheet } from "@/components/BottomSheet";
import { Icon } from "@/components/Icon";

/** Propose a few times, let the group mark when they're free, and surface
 * whichever time has the most "I'm available" marks — the same
 * propose/tally mechanic as VotingView, kept as its own component (rather
 * than reusing "voting") because every screen component in this runtime is
 * tied to one Tool DNA's namespace (see ARCHITECTURE.md §3/§5): this one
 * reads/writes "meeting.meeting" and "meeting.availability" records. */
export function MeetingSchedulerView({ appInstanceId, screen, records, allRecords, fields, actions, role, currentUserId, onMutate }: ScreenComponentProps) {
  const [adding, setAdding] = useState(false);
  const canPropose = canDo(actions, "add", role);
  const canMark = canDo(actions, "vote", role);
  const canConfirm = canDo(actions, "complete", role);
  const availability = allRecords.filter((r) => r.entityType === "meeting.availability");

  return (
    <div className="flex flex-col gap-3 pb-24">
      {records.length === 0 ? (
        <div className="card px-6 py-12 text-center text-sm text-on-surface-variant">No meetings proposed yet.</div>
      ) : (
        records.map((meeting) => {
          const options = (meeting.data.options as string[]) ?? [];
          const marks = availability.filter((v) => v.data.meetingId === meeting.id);
          const mine = marks.find((v) => v.data.memberId === currentUserId);
          const scheduled = meeting.data.status === "scheduled";
          const best = options.reduce<{ option: string | null; count: number }>(
            (top, opt) => {
              const count = marks.filter((v) => v.data.optionId === opt).length;
              return count > top.count ? { option: opt, count } : top;
            },
            { option: null, count: 0 }
          );

          return (
            <div key={meeting.id} className="card p-4">
              <div className="mb-3 flex items-start justify-between gap-2">
                <p className="font-headline-sm text-headline-sm font-bold text-on-surface">{meeting.data.title as string}</p>
                {scheduled ? (
                  <span className="pill flex shrink-0 items-center gap-1 bg-secondary-container px-2.5 py-1 font-label-sm text-label-sm font-bold text-on-secondary-container">
                    <Icon name="check_circle" size={14} filled />
                    Confirmed
                  </span>
                ) : null}
              </div>

              <div className="flex flex-col gap-2">
                {options.map((opt) => {
                  const count = marks.filter((v) => v.data.optionId === opt).length;
                  const isMine = mine?.data.optionId === opt;
                  const isBest = scheduled && best.option === opt;
                  return (
                    <button
                      key={opt}
                      disabled={!canMark || scheduled}
                      onClick={() => onMutate({ action: "vote", entity: "meeting.availability", payload: { meetingId: meeting.id, optionId: opt } })}
                      className={`relative overflow-hidden rounded-xl border px-3 py-2 text-left font-body-md text-body-md transition-colors ${
                        isBest ? "border-secondary bg-secondary-container" : isMine ? "border-primary bg-primary-fixed" : "border-on-surface/10"
                      } disabled:opacity-70`}
                    >
                      <div className="absolute inset-y-0 left-0 -z-10 bg-primary/10" style={{ width: `${options.length ? (count / Math.max(marks.length, 1)) * 100 : 0}%` }} />
                      <span className="flex items-center justify-between gap-2">
                        <span className={isBest ? "font-bold text-on-secondary-container" : "text-on-surface"}>{opt}</span>
                        <span className="shrink-0 font-label-sm text-label-sm text-on-surface-variant">{count} free</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {canConfirm && !scheduled && marks.length > 0 ? (
                <button
                  onClick={() => onMutate({ action: "complete", entity: "meeting.meeting", payload: { meetingId: meeting.id } })}
                  className="tap mt-3 flex items-center gap-1 font-label-md text-label-md font-semibold text-primary"
                >
                  <Icon name="check_circle" size={16} />
                  Confirm {best.option ?? "a time"}
                </button>
              ) : null}
            </div>
          );
        })
      )}

      {canPropose ? (
        <button onClick={() => setAdding(true)} className="tap fixed bottom-24 right-5 z-30 h-14 w-14 rounded-full bg-primary text-2xl text-on-primary shadow-lg active:scale-95">
          +
        </button>
      ) : null}

      {adding ? (
        <BottomSheet title="Propose a meeting" onClose={() => setAdding(false)}>
          <RecordForm
            appInstanceId={appInstanceId}
            fields={fields}
            submitLabel="Propose"
            onCancel={() => setAdding(false)}
            onSubmit={async (values) => {
              await onMutate({ action: "add", entity: screen.entity, payload: { entityType: screen.entity, fields: { ...values, status: "proposed" } } });
              setAdding(false);
            }}
          />
        </BottomSheet>
      ) : null}
    </div>
  );
}
