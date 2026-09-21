import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import type { ScreenComponentProps } from "@needly/core";
import { canDo, labelFor } from "@needly/core";
import { RecordForm } from "./RecordForm";
import { BottomSheet } from "../../components/BottomSheet";
import { Icon } from "../../components/Icon";

export function ProgressView({ screen, records, allRecords, fields, actions, spec, role, computed, onMutate }: ScreenComponentProps) {
  const [adding, setAdding] = useState(false);
  const canAdd = canDo(actions, "add", role);
  const goal = Number(spec.settings.goalAmount ?? 0);
  const total = Number(computed["savings.totalProgress"] ?? 0);
  const pct = goal > 0 ? Math.min(100, Math.round((total / goal) * 100)) : 0;
  const participants = allRecords.filter((r) => r.entityType === "savings.participant");

  return (
    <View className="gap-4 pb-24">
      <View className="items-center rounded-2xl bg-surface-container-lowest p-5">
        <Text className="text-xs uppercase tracking-wide text-on-surface-variant">Progress toward goal</Text>
        <Text className="mt-1 text-2xl font-bold text-on-surface">
          ${total.toFixed(2)} <Text className="text-base text-on-surface-variant">/ ${goal.toFixed(2)}</Text>
        </Text>
        <View className="mt-3 h-3 w-full overflow-hidden rounded-full bg-black/5">
          <View className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </View>
      </View>

      <View className="divide-y divide-black/5 rounded-2xl bg-surface-container-lowest">
        {records
          .slice()
          .reverse()
          .map((r) => (
            <View key={r.id} className="flex-row items-center justify-between px-4 py-3">
              <Text className="text-sm text-on-surface">{labelFor(participants, r.data.participantId as string)}</Text>
              <Text className="text-sm font-semibold text-secondary">+${Number(r.data.amount).toFixed(2)}</Text>
            </View>
          ))}
        {records.length === 0 ? <Text className="px-4 py-8 text-center text-sm text-on-surface-variant">No contributions yet.</Text> : null}
      </View>

      {canAdd ? (
        <Pressable onPress={() => setAdding(true)} className="absolute bottom-2 right-0 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg">
          <Icon name="add" size={26} color="#ffffff" />
        </Pressable>
      ) : null}

      <BottomSheet visible={adding} title="Add contribution" onClose={() => setAdding(false)}>
        <RecordForm
          fields={fields}
          submitLabel="Add"
          onCancel={() => setAdding(false)}
          onSubmit={async (values) => {
            await onMutate({ action: "add", entity: screen.entity, payload: { participantId: values.participantId, amount: Number(values.amount) } });
            setAdding(false);
          }}
        />
      </BottomSheet>
    </View>
  );
}
