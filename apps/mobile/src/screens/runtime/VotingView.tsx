import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import type { ScreenComponentProps } from "@needly/core";
import { canDo } from "@needly/core";
import { RecordForm } from "./RecordForm";
import { BottomSheet } from "../../components/BottomSheet";
import { Icon } from "../../components/Icon";
import { useThemeColors } from "../../theme/ThemeContext";

export function VotingView({ appInstanceId, screen, records, allRecords, fields, actions, role, currentUserId, onMutate }: ScreenComponentProps) {
  const colors = useThemeColors();
  const [adding, setAdding] = useState(false);
  const canCreate = canDo(actions, "add", role);
  const canVote = canDo(actions, "vote", role);
  const canClose = canDo(actions, "complete", role);
  const votes = allRecords.filter((r) => r.entityType === "voting.vote");

  return (
    <View className="gap-3 pb-24">
      {records.length === 0 ? (
        <View className="items-center rounded-2xl bg-surface-container-lowest px-6 py-12">
          <Text className="text-sm text-on-surface-variant">No polls yet.</Text>
        </View>
      ) : (
        records.map((poll) => {
          const options = (poll.data.options as string[]) ?? [];
          const pollVotes = votes.filter((v) => v.data.pollId === poll.id);
          const myVote = pollVotes.find((v) => v.data.participantId === currentUserId);
          const closed = poll.data.status === "closed";
          const total = pollVotes.length;

          return (
            <View key={poll.id} className="rounded-2xl bg-surface-container-lowest p-4">
              <View className="mb-3 flex-row items-start justify-between">
                <Text className="flex-1 font-medium text-on-surface">{poll.data.question as string}</Text>
                {closed ? (
                  <View className="rounded-full bg-surface-container-high px-2 py-0.5">
                    <Text className="text-xs text-on-surface-variant">Closed</Text>
                  </View>
                ) : null}
              </View>
              <View className="gap-2">
                {options.map((opt) => {
                  const count = pollVotes.filter((v) => v.data.optionId === opt).length;
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  const mine = myVote?.data.optionId === opt;
                  return (
                    <Pressable
                      key={opt}
                      disabled={!canVote || closed}
                      onPress={() => onMutate({ action: "vote", entity: "voting.vote", payload: { pollId: poll.id, optionId: opt } })}
                      className={`overflow-hidden rounded-xl border px-3 py-2 ${mine ? "border-primary bg-primary-fixed" : "border-outline-variant/40"}`}
                    >
                      <View className="flex-row items-center justify-between">
                        <Text className="text-sm text-on-surface">{opt}</Text>
                        <Text className="text-sm text-on-surface-variant">
                          {count} {total > 0 ? `(${pct}%)` : ""}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
              {canClose && !closed ? (
                <Pressable onPress={() => onMutate({ action: "complete", entity: "voting.poll", payload: { pollId: poll.id } })} className="mt-3">
                  <Text className="text-xs font-medium text-on-surface-variant underline">Close voting</Text>
                </Pressable>
              ) : null}
            </View>
          );
        })
      )}

      {canCreate ? (
        <Pressable onPress={() => setAdding(true)} className="absolute bottom-2 right-0 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg">
          <Icon name="add" size={26} color={colors["on-primary"]} />
        </Pressable>
      ) : null}

      <BottomSheet visible={adding} title="New poll" onClose={() => setAdding(false)}>
        <RecordForm
          appInstanceId={appInstanceId}
          fields={fields}
          submitLabel="Create"
          onCancel={() => setAdding(false)}
          onSubmit={async (values) => {
            await onMutate({ action: "add", entity: screen.entity, payload: { entityType: screen.entity, fields: { ...values, status: "open" } } });
            setAdding(false);
          }}
        />
      </BottomSheet>
    </View>
  );
}
