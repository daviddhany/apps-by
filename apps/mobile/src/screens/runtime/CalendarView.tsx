import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import type { ScreenComponentProps } from "@needly/core";
import { canDo, labelFor } from "@needly/core";
import { RecordForm } from "./RecordForm";
import { BottomSheet } from "../../components/BottomSheet";
import { Icon } from "../../components/Icon";

// Simplified calendar: a chronological agenda list, same simplification as
// the web runtime (see ARCHITECTURE.md) — no month-grid widget.
export function CalendarView({ screen, records, allRecords, fields, actions, role, onMutate }: ScreenComponentProps) {
  const [adding, setAdding] = useState(false);
  const canAdd = canDo(actions, "add", role) || canDo(actions, "reserve", role);
  const dateField = fields.find((f) => f.type === "date")?.key ?? "date";

  const grouped = new Map<string, typeof records>();
  for (const r of records) {
    const key = (r.data[dateField] as string) ?? (r.data.start as string) ?? "Undated";
    grouped.set(key, [...(grouped.get(key) ?? []), r]);
  }
  const sortedKeys = [...grouped.keys()].sort();

  return (
    <View className="gap-3 pb-24">
      {sortedKeys.length === 0 ? (
        <View className="items-center rounded-2xl bg-surface-container-lowest px-6 py-12">
          <Text className="text-sm text-on-surface-variant">Nothing scheduled yet.</Text>
        </View>
      ) : (
        sortedKeys.map((key) => (
          <View key={key}>
            <Text className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">{formatDate(key)}</Text>
            <View className="divide-y divide-outline-variant/30 rounded-2xl bg-surface-container-lowest">
              {grouped.get(key)!.map((r) => (
                <View key={r.id} className="px-4 py-3">
                  <Text className="font-medium text-on-surface">
                    {(r.data.title as string) ?? (r.data.resourceId ? labelFor(allRecords, r.data.resourceId as string, "Resource") : "Event")}
                  </Text>
                  {r.data.participantId ? <Text className="text-xs text-on-surface-variant">by {labelFor(allRecords, r.data.participantId as string)}</Text> : null}
                </View>
              ))}
            </View>
          </View>
        ))
      )}

      {canAdd ? (
        <Pressable onPress={() => setAdding(true)} className="absolute bottom-2 right-0 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg">
          <Icon name="add" size={26} color="#1000a9" />
        </Pressable>
      ) : null}

      <BottomSheet visible={adding} title={`Add ${screen.title.replace(/s$/, "")}`} onClose={() => setAdding(false)}>
        <RecordForm
          fields={fields}
          submitLabel="Add"
          onCancel={() => setAdding(false)}
          onSubmit={async (values) => {
            const addAction = actions.find((a) => a.name === "add" || a.name === "reserve");
            const payload = addAction?.payloadSchemaKey === "generic.add" ? { entityType: screen.entity, fields: values } : values;
            await onMutate({ action: addAction?.name ?? "add", entity: screen.entity, payload });
            setAdding(false);
          }}
        />
      </BottomSheet>
    </View>
  );
}

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}
