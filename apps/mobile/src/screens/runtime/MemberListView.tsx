import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import type { ScreenComponentProps } from "@needly/core";
import { canDo } from "@needly/core";
import { RecordForm } from "./RecordForm";
import { BottomSheet } from "../../components/BottomSheet";
import { Icon } from "../../components/Icon";

export function MemberListView({ screen, records, fields, actions, role, members, onMutate }: ScreenComponentProps) {
  const [adding, setAdding] = useState(false);
  const canAdd = canDo(actions, "add", role);

  return (
    <View className="gap-4 pb-24">
      <View>
        <Text className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">App members</Text>
        <View className="divide-y divide-outline-variant/30 rounded-2xl bg-surface-container-lowest">
          {members.map((m) => (
            <View key={m.id} className="flex-row items-center gap-3 px-4 py-3">
              <View className="h-9 w-9 items-center justify-center rounded-full bg-primary-fixed">
                <Text className="text-sm font-bold text-on-primary-fixed">{m.name.slice(0, 1).toUpperCase()}</Text>
              </View>
              <Text className="flex-1 text-sm font-medium text-on-surface">
                {m.name} {m.isGuest ? <Text className="text-xs text-on-surface-variant">(guest)</Text> : null}
              </Text>
              <View className="rounded-full bg-surface-container-high px-2 py-0.5">
                <Text className="text-xs text-on-surface-variant">{m.role}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {records.length > 0 ? (
        <View>
          <Text className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">{screen.title}</Text>
          <View className="divide-y divide-outline-variant/30 rounded-2xl bg-surface-container-lowest">
            {records.map((r) => (
              <View key={r.id} className="px-4 py-3">
                <Text className="text-sm font-medium text-on-surface">{(r.data.name as string) ?? "—"}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {canAdd ? (
        <Pressable onPress={() => setAdding(true)} className="absolute bottom-2 right-0 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg">
          <Icon name="add" size={26} color="#1000a9" />
        </Pressable>
      ) : null}

      <BottomSheet visible={adding} title="Add person" onClose={() => setAdding(false)}>
        <RecordForm
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
