"use client";

import { useState } from "react";
import { questionForDate, computeStreak } from "@needly/core";
import type { ScreenComponentProps } from "../types";
import { canDo } from "../types";
import { Icon } from "../../Icon";

/** Shared daily prompt: today's question is derived deterministically from
 * the calendar date (see @needly/core's questionForDate) rather than stored
 * — every member's client computes the same question with no setup step, so
 * only each person's own one-sentence answer needs to be persisted, as
 * "journal.entry" records. */
export function DailyJournalView({ screen, allRecords, actions, role, members, currentUserId, onMutate }: ScreenComponentProps) {
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canAnswer = canDo(actions, "add", role);
  const today = questionForDate();
  const entries = allRecords.filter((r) => r.entityType === "journal.entry");
  const todaysEntries = entries.filter((e) => e.data.date === today.date);
  const myEntry = todaysEntries.find((e) => e.data.authorId === currentUserId);
  const myDates = entries.filter((e) => e.data.authorId === currentUserId).map((e) => e.data.date as string);
  const streak = computeStreak(myDates);

  async function submit() {
    const answer = draft.trim();
    if (!answer) return;
    setSubmitting(true);
    setError(null);
    try {
      await onMutate({ action: "add", entity: screen.entity, payload: { date: today.date, question: today.question, answer } });
      setDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save your answer");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 pb-24">
      <div className="card p-5">
        <div className="mb-1 flex items-center gap-1.5 text-primary">
          <Icon name="auto_awesome" size={16} filled />
          <span className="font-label-sm text-label-sm font-bold uppercase tracking-wider">Today&rsquo;s question</span>
        </div>
        <p className="font-headline-sm text-headline-sm font-bold text-on-surface">{today.question}</p>

        {myEntry ? (
          <div className="mt-4 rounded-2xl bg-secondary-container p-4">
            <p className="font-label-sm text-label-sm font-semibold text-on-secondary-container">You answered</p>
            <p className="mt-1 font-body-md text-body-md text-on-secondary-container">{myEntry.data.answer as string}</p>
          </div>
        ) : canAnswer ? (
          <div className="mt-4 flex flex-col gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, 280))}
              placeholder="Answer in one sentence…"
              rows={2}
              className="w-full resize-none rounded-2xl bg-surface-container-low p-space-md font-body-md text-body-md text-on-surface outline-none focus:shadow-[0_0_0_2px_rgba(29,78,216,0.2)]"
            />
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant">{draft.length}/280</span>
              <button
                onClick={submit}
                disabled={!draft.trim() || submitting}
                className="tap rounded-full bg-primary px-5 py-2 font-label-md text-label-md font-bold text-on-primary shadow-md disabled:opacity-50"
              >
                {submitting ? "Saving…" : "Answer"}
              </button>
            </div>
            {error ? <p className="font-body-sm text-body-sm text-error">{error}</p> : null}
          </div>
        ) : null}

        {streak > 1 ? (
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-tertiary-fixed px-3 py-1 font-label-sm text-label-sm font-bold text-on-tertiary-fixed-variant">
            <span aria-hidden>🔥</span>
            <span>{streak}-day streak</span>
          </div>
        ) : null}
      </div>

      {todaysEntries.length > 0 ? (
        <div className="card p-4">
          <p className="mb-2 font-label-sm text-label-sm font-semibold uppercase tracking-wide text-on-surface-variant">Today&rsquo;s answers</p>
          <div className="flex flex-col gap-2.5">
            {todaysEntries.map((e) => {
              const name = members.find((m) => m.id === e.data.authorId)?.name ?? "Someone";
              return (
                <div key={e.id} className="rounded-xl bg-surface-container-low p-3">
                  <p className="font-label-sm text-label-sm font-bold text-on-surface">{name}</p>
                  <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">{e.data.answer as string}</p>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
