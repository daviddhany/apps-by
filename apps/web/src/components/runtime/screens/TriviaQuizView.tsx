"use client";

import { useState } from "react";
import type { ScreenComponentProps } from "../types";
import { canDo } from "../types";
import { RecordForm } from "../RecordForm";
import { BottomSheet } from "@/components/BottomSheet";
import { Icon } from "@/components/Icon";

/** Real mini-game, not a filter toggle: host starts a quiz and adds
 * multiple-choice questions, players answer at their own pace with instant
 * right/wrong feedback (no host-paced turn-taking — mobile only polls every
 * few seconds, so a live "everyone answers together" round isn't reliable),
 * and a scoreboard tallies points for correct answers. Reads/writes
 * "quiz.quiz", "quiz.question" and "quiz.answer". */
export function TriviaQuizView({ appInstanceId, spec, screen, records, allRecords, fields, actions, role, members, currentUserId, onMutate }: ScreenComponentProps) {
  const [addingQuiz, setAddingQuiz] = useState(false);
  const [addingQuestionFor, setAddingQuestionFor] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const canStart = canDo(actions, "add", role);
  const canAddQuestion = actions.some((a) => a.name === "add" && a.entity === "quiz.question" && a.allowedRoles.includes(role as never));
  const canAnswer = canDo(actions, "vote", role);
  const canClose = canDo(actions, "complete", role);

  const questions = allRecords.filter((r) => r.entityType === "quiz.question");
  const answers = allRecords.filter((r) => r.entityType === "quiz.answer");
  const questionFields = (spec.fields["quiz.question"] ?? []).filter((f) => f.key !== "quizId");

  const board = new Map<string, { points: number; correct: number }>();
  for (const a of answers) {
    const d = a.data as { playerId: string; correct: boolean; points: number };
    const entry = board.get(d.playerId) ?? { points: 0, correct: 0 };
    entry.points += d.points ?? 0;
    if (d.correct) entry.correct += 1;
    board.set(d.playerId, entry);
  }
  const standings = [...board.entries()]
    .map(([playerId, s]) => ({ playerId, name: members.find((m) => m.id === playerId)?.name ?? "Player", ...s }))
    .sort((a, b) => b.points - a.points);

  return (
    <div className="flex flex-col gap-3 pb-24">
      {standings.length > 0 ? (
        <div className="card p-4">
          <p className="mb-2 font-label-sm text-label-sm font-semibold uppercase tracking-wide text-on-surface-variant">Scoreboard</p>
          <div className="flex flex-col gap-1.5">
            {standings.map((s, i) => (
              <div key={s.playerId} className="flex items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-2">
                  <span className="text-on-surface-variant">#{i + 1}</span>
                  <span className={i === 0 ? "font-bold text-on-surface" : "text-on-surface"}>{s.name}</span>
                </span>
                <span className="text-on-surface-variant">
                  {s.points} pts · {s.correct} correct
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {records.length === 0 ? (
        <div className="card px-6 py-12 text-center text-sm text-on-surface-variant">No quizzes yet — start one to add questions.</div>
      ) : (
        records.map((quiz) => {
          const closed = quiz.data.status === "closed";
          const quizQuestions = questions.filter((q) => q.data.quizId === quiz.id);
          const expanded = expandedId === quiz.id;

          return (
            <div key={quiz.id} className="card p-4">
              <button onClick={() => setExpandedId(expanded ? null : quiz.id)} className="tap flex w-full items-center justify-between gap-2 text-left">
                <span className="font-headline-sm text-headline-sm font-bold text-on-surface">{quiz.data.title as string}</span>
                <span className="flex items-center gap-2">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{quizQuestions.length} question{quizQuestions.length === 1 ? "" : "s"}</span>
                  {closed ? <span className="pill bg-secondary-container px-2 py-0.5 text-xs font-bold text-on-secondary-container">Closed</span> : null}
                  <Icon name={expanded ? "close" : "chevron_right"} size={18} />
                </span>
              </button>

              {expanded ? (
                <div className="mt-3 flex flex-col gap-3">
                  {quizQuestions.length === 0 ? (
                    <p className="text-sm text-on-surface-variant">No questions yet.</p>
                  ) : (
                    quizQuestions.map((q) => {
                      const options = (q.data.options as string[]) ?? [];
                      const correctIndex = Number(q.data.correctOption) - 1;
                      const correctText = options[correctIndex];
                      const mine = answers.find((a) => a.data.questionId === q.id && a.data.playerId === currentUserId);

                      return (
                        <div key={q.id} className="rounded-xl border border-on-surface/10 p-3">
                          <div className="mb-2 flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold text-on-surface">{q.data.text as string}</p>
                            <span className="shrink-0 font-label-sm text-label-sm text-on-surface-variant">{(q.data.points as number) ?? 10} pts</span>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            {options.map((opt) => {
                              const isMine = mine?.data.optionText === opt;
                              const revealCorrect = Boolean(mine) && opt === correctText;
                              const wrongPick = isMine && mine?.data.correct !== true;
                              return (
                                <button
                                  key={opt}
                                  disabled={!canAnswer || closed || Boolean(mine)}
                                  onClick={() => onMutate({ action: "vote", entity: "quiz.answer", payload: { questionId: q.id, optionText: opt } })}
                                  className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors disabled:opacity-90 ${
                                    revealCorrect
                                      ? "border-secondary bg-secondary-container text-on-secondary-container"
                                      : wrongPick
                                        ? "border-error bg-error-container text-on-error-container"
                                        : "border-on-surface/10 text-on-surface"
                                  }`}
                                >
                                  <span className="flex items-center justify-between gap-2">
                                    {opt}
                                    {revealCorrect ? <Icon name="check_circle" size={16} /> : wrongPick ? <Icon name="close" size={16} /> : null}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  )}

                  {canAddQuestion && !closed ? (
                    <button
                      onClick={() => setAddingQuestionFor(quiz.id)}
                      className="tap flex items-center justify-center gap-1.5 rounded-full border border-dashed border-on-surface/20 py-2 text-sm font-semibold text-on-surface-variant"
                    >
                      <Icon name="add" size={16} />
                      Add a question
                    </button>
                  ) : null}

                  {canClose && !closed ? (
                    <button
                      onClick={() => onMutate({ action: "complete", entity: "quiz.quiz", payload: { quizId: quiz.id } })}
                      className="tap self-start font-label-md text-label-md font-medium text-on-surface-variant underline"
                    >
                      Close quiz
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })
      )}

      {canStart ? (
        <button onClick={() => setAddingQuiz(true)} className="tap fixed bottom-24 right-5 z-30 h-14 w-14 rounded-full bg-primary text-2xl text-on-primary shadow-lg active:scale-95">
          +
        </button>
      ) : null}

      {addingQuiz ? (
        <BottomSheet title="Start a quiz" onClose={() => setAddingQuiz(false)}>
          <RecordForm
            appInstanceId={appInstanceId}
            fields={fields.filter((f) => f.key !== "status")}
            submitLabel="Start"
            onCancel={() => setAddingQuiz(false)}
            onSubmit={async (values) => {
              await onMutate({ action: "add", entity: screen.entity, payload: { entityType: screen.entity, fields: { ...values, status: "open" } } });
              setAddingQuiz(false);
            }}
          />
        </BottomSheet>
      ) : null}

      {addingQuestionFor ? (
        <BottomSheet title="Add a question" onClose={() => setAddingQuestionFor(null)}>
          <RecordForm
            appInstanceId={appInstanceId}
            fields={questionFields}
            submitLabel="Add"
            onCancel={() => setAddingQuestionFor(null)}
            onSubmit={async (values) => {
              await onMutate({ action: "add", entity: "quiz.question", payload: { entityType: "quiz.question", fields: { ...values, quizId: addingQuestionFor } } });
              setAddingQuestionFor(null);
            }}
          />
        </BottomSheet>
      ) : null}
    </div>
  );
}
