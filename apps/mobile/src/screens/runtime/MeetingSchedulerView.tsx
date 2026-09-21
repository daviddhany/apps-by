import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import type { ScreenComponentProps } from "@needly/core";
import { canDo } from "@needly/core";
import { RecordForm } from "./RecordForm";
import { BottomSheet } from "../../components/BottomSheet";
import { Icon } from "../../components/Icon";

/** Mirrors apps/web/.../MeetingSchedulerView.tsx — propose a few times, let
 * the group mark when they're free, surface whichever time has the most
 * marks. Reads/writes "meeting.meeting" and "meeting.availability". */
export function MeetingSchedulerView({ screen, records, allRecords, fields, actions, role, currentUserId, onMutate }: ScreenComponentProps) {
  const [adding, setAdding] = useState(false);
  const canPropose = canDo(actions, "add", role);
  const canMark = canDo(actions, "vote", role);
  const canConfirm = canDo(actions, "complete", role);
  const availability = allRecords.filter((r) => r.entityType === "meeting.availability");

  return (
    <View className="gap-3 pb-24">
      {records.length === 0 ? (
        <View className="items-center rounded-2xl bg-surface-container-lowest px-6 py-12">
          <Text className="text-sm text-on-surface-variant">No meetings proposed yet.</Text>
        </View>
      ) : (
        records.map((meeting) => {
          const options = (meeting.data.options as string[]) ?? [];
          const marks = availability.filter((v) => v.data.meetingId === meeting.id);
          const mine = marks.find((v) => v.data.memberId === currentUserId);
          const scheduled = meeting.data.status === "scheduled";
          const best = options.reduce<{ option: string | null; count: number }>(
            (top, opt) => {
              const count = marks.filter((v) => v.data.optionId === opt).length;
              return count > top.count ? { option: opt, count } : top;
            },
            { option: null, count: 0 }
          );

          return (
            <View key={meeting.id} className="rounded-2xl bg-surface-container-lowest p-4">
              <View className="mb-3 flex-row items-start justify-between gap-2">
                <Text className="flex-1 text-base font-bold text-on-surface">{meeting.data.title as string}</Text>
                {scheduled ? (
                  <View className="flex-row items-center gap-1 rounded-full bg-secondary-container px-2.5 py-1">
                    <Icon name="check_circle" size={13} color="#490080" />
                    <Text className="text-xs font-bold text-on-secondary-container">Confirmed</Text>
                  </View>
                ) : null}
              </View>

              <View className="gap-2">
                {options.map((opt) => {
                  const count = marks.filter((v) => v.data.optionId === opt).length;
                  const isMine = mine?.data.optionId === opt;
                  const isBest = scheduled && best.option === opt;
                  return (
                    <Pressable
                      key={opt}
                      disabled={!canMark || scheduled}
                      onPress={() => onMutate({ action: "vote", entity: "meeting.availability", payload: { meetingId: meeting.id, optionId: opt } })}
                      className={`overflow-hidden rounded-xl border px-3 py-2 ${
                        isBest ? "border-secondary bg-secondary-container" : isMine ? "border-primary bg-primary-fixed" : "border-outline-variant/40"
                      }`}
                    >
                      <View className="flex-row items-center justify-between">
                        <Text className={isBest ? "text-sm font-bold text-on-secondary-container" : "text-sm text-on-surface"}>{opt}</Text>
                        <Text className="text-sm text-on-surface-variant">{count} free</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {canConfirm && !scheduled && marks.length > 0 ? (
                <Pressable
                  onPress={() => onMutate({ action: "complete", entity: "meeting.meeting", payload: { meetingId: meeting.id } })}
                  className="mt-3 flex-row items-center gap-1"
                >
                  <Icon name="check_circle" size={16} color="#c0c1ff" />
                  <Text className="text-sm font-semibold text-primary">Confirm {best.option ?? "a time"}</Text>
                </Pressable>
              ) : null}
            </View>
          );
        })
      )}

      {canPropose ? (
        <Pressable onPress={() => setAdding(true)} className="absolute bottom-2 right-0 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg">
          <Icon name="add" size={26} color="#1000a9" />
        </Pressable>
      ) : null}

      <BottomSheet visible={adding} title="Propose a meeting" onClose={() => setAdding(false)}>
        <RecordForm
          fields={fields}
          submitLabel="Propose"
          onCancel={() => setAdding(false)}
          onSubmit={async (values) => {
            await onMutate({ action: "add", entity: screen.entity, payload: { entityType: screen.entity, fields: { ...values, status: "proposed" } } });
            setAdding(false);
          }}
        />
      </BottomSheet>
    </View>
  );
}
