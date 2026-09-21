import { useState } from "react";
import { View, Text, Pressable, Switch } from "react-native";
import type { ScreenComponentProps } from "@needly/core";
import { canDo, labelFor } from "@needly/core";
import { RecordForm } from "./RecordForm";
import { BottomSheet } from "../../components/BottomSheet";
import { Icon } from "../../components/Icon";

export function ChecklistView({ appInstanceId, screen, records, allRecords, fields, actions, role, onMutate }: ScreenComponentProps) {
  const [adding, setAdding] = useState(false);
  const canAdd = canDo(actions, "add", role);
  const canComplete = canDo(actions, "complete", role) || canDo(actions, "checkin", role);
  const done = records.filter((r) => Boolean(r.data.done ?? r.data.present)).length;

  return (
    <View className="gap-3 pb-24">
      {records.length > 0 ? <Text className="px-1 text-sm text-on-surface-variant">{done} / {records.length} done</Text> : null}

      {records.length === 0 ? (
        <View className="items-center rounded-2xl bg-surface-container-lowest px-6 py-12">
          <Text className="text-sm text-on-surface-variant">Nothing to check off yet.</Text>
        </View>
      ) : (
        <View className="divide-y divide-outline-variant/30 rounded-2xl bg-surface-container-lowest">
          {records.map((r) => {
            const isDone = Boolean(r.data.done ?? r.data.present);
            const title = (r.data.title as string) ?? labelFor(allRecords, r.data.participantId as string, "Item");
            return (
              <View key={r.id} className="flex-row items-center gap-3 px-4 py-3">
                <Switch
                  value={isDone}
                  disabled={!canComplete}
                  onValueChange={(v) => {
                    onMutate({
                      action: r.data.title !== undefined ? "complete" : "checkin",
                      entity: screen.entity,
                      payload: r.data.title !== undefined ? { itemId: r.id, done: v } : { participantId: r.data.participantId, present: v },
                    });
                  }}
                />
                <Text className={isDone ? "flex-1 text-on-surface-variant line-through" : "flex-1 text-on-surface"}>{title}</Text>
              </View>
            );
          })}
        </View>
      )}

      {canAdd ? (
        <Pressable onPress={() => setAdding(true)} className="absolute bottom-2 right-0 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg">
          <Icon name="add" size={26} color="#1000a9" />
        </Pressable>
      ) : null}

      <BottomSheet visible={adding} title="Add item" onClose={() => setAdding(false)}>
        <RecordForm
          appInstanceId={appInstanceId}
          fields={fields}
          submitLabel="Add"
          onCancel={() => setAdding(false)}
          onSubmit={async (values) => {
            await onMutate({ action: "add", entity: screen.entity, payload: { entityType: screen.entity, fields: values } });
            setAdding(false);
          }}
        />
      </BottomSheet>
    </View>
  );
}
