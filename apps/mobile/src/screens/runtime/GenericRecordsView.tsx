import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import type { ScreenComponentProps } from "@needly/core";
import { canDo, labelFor } from "@needly/core";
import { RecordForm } from "./RecordForm";
import { BottomSheet } from "../../components/BottomSheet";
import { Icon } from "../../components/Icon";
import { useThemeColors } from "../../theme/ThemeContext";

export function GenericRecordsView({ appInstanceId, screen, records, allRecords, fields, actions, role, onMutate }: ScreenComponentProps) {
  const colors = useThemeColors();
  const [adding, setAdding] = useState(false);
  const addAction = actions.find((a) => a.name === "add");
  const canAdd = canDo(actions, "add", role);

  return (
    <View className="gap-3 pb-24">
      {records.length === 0 ? (
        <EmptyState canAdd={canAdd} onAdd={() => setAdding(true)} />
      ) : (
        records.map((r) => (
          <View key={r.id} className="rounded-2xl bg-surface-container-lowest p-4 shadow-sm">
            {fields.slice(0, 4).map((f) => (
              <View key={f.key} className="flex-row items-baseline justify-between py-0.5">
                <Text className="text-sm text-on-surface-variant">{f.label}</Text>
                <Text className="text-sm font-medium text-on-surface">{renderCell(r.data[f.key], f.type, allRecords)}</Text>
              </View>
            ))}
          </View>
        ))
      )}

      {canAdd ? (
        <Pressable
          onPress={() => setAdding(true)}
          className="absolute bottom-2 right-0 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg active:opacity-90"
        >
          <Icon name="add" size={26} color={colors["on-primary"]} />
        </Pressable>
      ) : null}

      <BottomSheet visible={adding} title={`Add ${screen.title.replace(/s$/, "")}`} onClose={() => setAdding(false)}>
        <RecordForm
          appInstanceId={appInstanceId}
          fields={fields}
          submitLabel="Add"
          onCancel={() => setAdding(false)}
          onSubmit={async (values) => {
            const payload = addAction?.payloadSchemaKey === "generic.add" ? { entityType: screen.entity, fields: values } : values;
            await onMutate({ action: "add", entity: screen.entity, payload });
            setAdding(false);
          }}
        />
      </BottomSheet>
    </View>
  );
}

function renderCell(value: unknown, type: string, allRecords: ScreenComponentProps["allRecords"]): string {
  if (value === undefined || value === null || value === "") return "—";
  if (type === "money") return `$${Number(value).toFixed(2)}`;
  if (type === "boolean") return value ? "Yes" : "No";
  if (type === "person" && typeof value === "string") return labelFor(allRecords, value, value);
  if (type === "multiselect" && Array.isArray(value)) return value.map((v) => labelFor(allRecords, String(v), String(v))).join(", ");
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

function EmptyState({ canAdd, onAdd }: { canAdd: boolean; onAdd: () => void }) {
  return (
    <View className="items-center gap-2 rounded-2xl bg-surface-container-lowest px-6 py-12">
      <Text className="text-3xl">📭</Text>
      <Text className="text-base font-medium text-on-surface">Nothing here yet</Text>
      {canAdd ? (
        <Pressable onPress={onAdd} className="mt-2 rounded-full bg-primary px-4 py-2">
          <Text className="text-sm font-medium text-on-primary">Add the first one</Text>
        </Pressable>
      ) : (
        <Text className="text-sm text-on-surface-variant">Check back soon.</Text>
      )}
    </View>
  );
}
