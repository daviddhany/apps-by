import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import type { ScreenComponentProps } from "@needly/core";
import { canDo } from "@needly/core";
import { RecordForm } from "./RecordForm";
import { BottomSheet } from "../../components/BottomSheet";
import { Icon } from "../../components/Icon";
import { useThemeColors } from "../../theme/ThemeContext";

/** Mirrors apps/web/.../TriviaQuizView.tsx — real mini-game, not a filter
 * toggle: host starts a quiz and adds multiple-choice questions, players
 * answer at their own pace with instant right/wrong feedback, and a
 * scoreboard tallies points for correct answers. Reads/writes "quiz.quiz",
 * "quiz.question" and "quiz.answer". */
export function TriviaQuizView({ appInstanceId, spec, screen, records, allRecords, fields, actions, role, members, currentUserId, onMutate }: ScreenComponentProps) {
  const colors = useThemeColors();
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
    <View className="gap-3 pb-24">
      {standings.length > 0 ? (
        <View className="rounded-2xl bg-surface-container-lowest p-4">
          <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Scoreboard</Text>
          <View className="gap-1.5">
            {standings.map((s, i) => (
              <View key={s.playerId} className="flex-row items-center justify-between gap-2">
                <View className="flex-row items-center gap-2">
                  <Text className="text-sm text-on-surface-variant">#{i + 1}</Text>
                  <Text className={i === 0 ? "text-sm font-bold text-on-surface" : "text-sm text-on-surface"}>{s.name}</Text>
                </View>
                <Text className="text-sm text-on-surface-variant">
                  {s.points} pts · {s.correct} correct
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {records.length === 0 ? (
        <View className="items-center rounded-2xl bg-surface-container-lowest px-6 py-12">
          <Text className="text-sm text-on-surface-variant">No quizzes yet — start one to add questions.</Text>
        </View>
      ) : (
        records.map((quiz) => {
          const closed = quiz.data.status === "closed";
          const quizQuestions = questions.filter((q) => q.data.quizId === quiz.id);
          const expanded = expandedId === quiz.id;

          return (
            <View key={quiz.id} className="rounded-2xl bg-surface-container-lowest p-4">
              <Pressable onPress={() => setExpandedId(expanded ? null : quiz.id)} className="flex-row items-center justify-between gap-2">
                <Text className="flex-1 text-base font-bold text-on-surface">{quiz.data.title as string}</Text>
                <View className="flex-row items-center gap-2">
                  <Text className="text-xs text-on-surface-variant">
                    {quizQuestions.length} question{quizQuestions.length === 1 ? "" : "s"}
                  </Text>
                  {closed ? (
                    <View className="rounded-full bg-secondary-container px-2 py-0.5">
                      <Text className="text-xs font-bold text-on-secondary-container">Closed</Text>
                    </View>
                  ) : null}
                  <Icon name={expanded ? "close" : "chevron_right"} size={18} color={colors["on-surface-variant"]} />
                </View>
              </Pressable>

              {expanded ? (
                <View className="mt-3 gap-3">
                  {quizQuestions.length === 0 ? (
                    <Text className="text-sm text-on-surface-variant">No questions yet.</Text>
                  ) : (
                    quizQuestions.map((q) => {
                      const options = (q.data.options as string[]) ?? [];
                      const correctIndex = Number(q.data.correctOption) - 1;
                      const correctText = options[correctIndex];
                      const mine = answers.find((a) => a.data.questionId === q.id && a.data.playerId === currentUserId);

                      return (
                        <View key={q.id} className="rounded-xl border border-outline-variant/40 p-3">
                          <View className="mb-2 flex-row items-start justify-between gap-2">
                            <Text className="flex-1 text-sm font-semibold text-on-surface">{q.data.text as string}</Text>
                            <Text className="shrink-0 text-xs text-on-surface-variant">{(q.data.points as number) ?? 10} pts</Text>
                          </View>
                          <View className="gap-1.5">
                            {options.map((opt) => {
                              const isMine = mine?.data.optionText === opt;
                              const revealCorrect = Boolean(mine) && opt === correctText;
                              const wrongPick = isMine && mine?.data.correct !== true;
                              return (
                                <Pressable
                                  key={opt}
                                  disabled={!canAnswer || closed || Boolean(mine)}
                                  onPress={() => onMutate({ action: "vote", entity: "quiz.answer", payload: { questionId: q.id, optionText: opt } })}
                                  className={`rounded-lg border px-3 py-2 ${
                                    revealCorrect ? "border-secondary bg-secondary-container" : wrongPick ? "border-error bg-error-container" : "border-outline-variant/40"
                                  }`}
                                >
                                  <View className="flex-row items-center justify-between gap-2">
                                    <Text className={revealCorrect ? "text-sm text-on-secondary-container" : wrongPick ? "text-sm text-on-error-container" : "text-sm text-on-surface"}>
                                      {opt}
                                    </Text>
                                    {revealCorrect ? (
                                      <Icon name="check_circle" size={16} color={colors["on-secondary-container"]} />
                                    ) : wrongPick ? (
                                      <Icon name="close" size={16} color={colors["on-error-container"]} />
                                    ) : null}
                                  </View>
                                </Pressable>
                              );
                            })}
                          </View>
                        </View>
                      );
                    })
                  )}

                  {canAddQuestion && !closed ? (
                    <Pressable
                      onPress={() => setAddingQuestionFor(quiz.id)}
                      className="flex-row items-center justify-center gap-1.5 rounded-full border border-dashed border-outline-variant/50 py-2.5"
                    >
                      <Icon name="add" size={16} color={colors["on-surface-variant"]} />
                      <Text className="text-sm font-semibold text-on-surface-variant">Add a question</Text>
                    </Pressable>
                  ) : null}

                  {canClose && !closed ? (
                    <Pressable onPress={() => onMutate({ action: "complete", entity: "quiz.quiz", payload: { quizId: quiz.id } })} className="self-start">
                      <Text className="text-sm font-medium text-on-surface-variant underline">Close quiz</Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}
            </View>
          );
        })
      )}

      {canStart ? (
        <Pressable onPress={() => setAddingQuiz(true)} className="absolute bottom-2 right-0 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg">
          <Icon name="add" size={26} color={colors["on-primary"]} />
        </Pressable>
      ) : null}

      <BottomSheet visible={addingQuiz} title="Start a quiz" onClose={() => setAddingQuiz(false)}>
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

      <BottomSheet visible={Boolean(addingQuestionFor)} title="Add a question" onClose={() => setAddingQuestionFor(null)}>
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
    </View>
  );
}
