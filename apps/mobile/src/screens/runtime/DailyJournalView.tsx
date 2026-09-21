import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { questionForDate, computeStreak } from "@needly/core";
import type { ScreenComponentProps } from "@needly/core";
import { canDo } from "@needly/core";
import { Icon } from "../../components/Icon";
import { useThemeColors } from "../../theme/ThemeContext";

/** Mirrors apps/web/.../DailyJournalView.tsx — today's question is derived
 * deterministically from the calendar date (no DB row needed for the
 * prompt), and only each member's own one-sentence answer is persisted as a
 * "journal.entry" record. */
export function DailyJournalView({ screen, allRecords, actions, role, members, currentUserId, onMutate }: ScreenComponentProps) {
  const colors = useThemeColors();
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
    <View className="gap-3 pb-24">
      <View className="rounded-2xl bg-surface-container-lowest p-5">
        <View className="mb-1 flex-row items-center gap-1.5">
          <Icon name="auto_awesome" size={16} color={colors.primary} />
          <Text className="text-xs font-bold uppercase tracking-wider text-primary">Today&rsquo;s question</Text>
        </View>
        <Text className="text-lg font-bold text-on-surface">{today.question}</Text>

        {myEntry ? (
          <View className="mt-4 rounded-2xl bg-secondary-container p-4">
            <Text className="text-xs font-semibold text-on-secondary-container">You answered</Text>
            <Text className="mt-1 text-base text-on-secondary-container">{myEntry.data.answer as string}</Text>
          </View>
        ) : canAnswer ? (
          <View className="mt-4 gap-2">
            <TextInput
              value={draft}
              onChangeText={(t) => setDraft(t.slice(0, 280))}
              placeholder="Answer in one sentence…"
              placeholderTextColor={colors.outline}
              multiline
              numberOfLines={2}
              className="rounded-2xl bg-surface-container-low p-4 text-base text-on-surface"
              style={{ minHeight: 64, textAlignVertical: "top" }}
            />
            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-on-surface-variant">{draft.length}/280</Text>
              <Pressable
                onPress={submit}
                disabled={!draft.trim() || submitting}
                className="rounded-full bg-primary px-5 py-2 disabled:opacity-50"
              >
                {submitting ? <ActivityIndicator color={colors["on-primary"]} /> : <Text className="font-bold text-on-primary">Answer</Text>}
              </Pressable>
            </View>
            {error ? <Text className="text-sm text-error">{error}</Text> : null}
          </View>
        ) : null}

        {streak > 1 ? (
          <View className="mt-3 flex-row items-center gap-1.5 self-start rounded-full bg-tertiary-fixed px-3 py-1">
            <Text>🔥</Text>
            <Text className="text-xs font-bold text-on-tertiary-fixed-variant">{streak}-day streak</Text>
          </View>
        ) : null}
      </View>

      {todaysEntries.length > 0 ? (
        <View className="rounded-2xl bg-surface-container-lowest p-4">
          <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Today&rsquo;s answers</Text>
          <View className="gap-2.5">
            {todaysEntries.map((e) => {
              const name = members.find((m) => m.id === e.data.authorId)?.name ?? "Someone";
              return (
                <View key={e.id} className="rounded-xl bg-surface-container-low p-3">
                  <Text className="text-xs font-bold text-on-surface">{name}</Text>
                  <Text className="mt-0.5 text-sm text-on-surface-variant">{e.data.answer as string}</Text>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}
