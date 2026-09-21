import { View, Text } from "react-native";
import type { ScreenComponentProps } from "@needly/core";
import { labelFor } from "@needly/core";

export function DashboardView({ screen, allRecords, computed, spec }: ScreenComponentProps) {
  const computedKey = (screen.config?.computed as string | undefined) ?? "";
  const namespace = screen.entity?.split(".")[0] ?? spec.toolDnaSlug[0];
  const fullKey = `${namespace}.${computedKey}`;
  const value = computed[fullKey];

  if (fullKey === "expense.balances" && value) {
    const { balances, settlements } = value as {
      balances: { participantId: string; net: number }[];
      settlements: { fromParticipantId: string; toParticipantId: string; amount: number }[];
    };
    const participants = allRecords.filter((r) => r.entityType === "expense.participant");
    return (
      <View className="gap-4 pb-24">
        <View className="rounded-2xl bg-surface-container-lowest p-4">
          <Text className="mb-3 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Balances</Text>
          <View className="gap-2">
            {balances.map((b) => (
              <View key={b.participantId} className="flex-row items-center justify-between">
                <Text className="text-sm text-on-surface">{labelFor(participants, b.participantId)}</Text>
                <Text className={`text-sm font-semibold ${b.net >= 0 ? "text-secondary" : "text-error"}`}>
                  {b.net >= 0 ? "+" : ""}
                  ${b.net.toFixed(2)}
                </Text>
              </View>
            ))}
            {balances.length === 0 ? <Text className="text-sm text-on-surface-variant">Add an expense to see balances.</Text> : null}
          </View>
        </View>

        {settlements.length > 0 ? (
          <View className="rounded-2xl bg-surface-container-lowest p-4">
            <Text className="mb-3 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Who should pay whom</Text>
            <View className="gap-2">
              {settlements.map((s, i) => (
                <View key={i} className="flex-row items-center justify-between rounded-xl bg-primary-fixed px-3 py-2">
                  <Text className="text-sm text-on-primary-fixed">
                    {labelFor(participants, s.fromParticipantId)} → {labelFor(participants, s.toParticipantId)}
                  </Text>
                  <Text className="text-sm font-semibold text-on-primary-fixed">${s.amount.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </View>
    );
  }

  if (fullKey === "order.totalsByPerson" && value) {
    const totals = value as Record<string, number>;
    const participants = allRecords.filter((r) => r.entityType === "order.participant");
    const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0);
    return (
      <View className="gap-3 pb-24">
        <View className="items-center rounded-2xl bg-surface-container-lowest p-4">
          <Text className="text-xs uppercase tracking-wide text-on-surface-variant">Order total</Text>
          <Text className="text-2xl font-bold text-on-surface">${grandTotal.toFixed(2)}</Text>
        </View>
        <View className="divide-y divide-outline-variant/30 rounded-2xl bg-surface-container-lowest">
          {Object.entries(totals).map(([id, total]) => (
            <View key={id} className="flex-row items-center justify-between px-4 py-3">
              <Text className="text-sm text-on-surface">{labelFor(participants, id)}</Text>
              <Text className="text-sm font-semibold text-on-surface">${total.toFixed(2)}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View className="items-center rounded-2xl bg-surface-container-lowest px-6 py-12">
      <Text className="text-sm text-on-surface-variant">Nothing to show yet.</Text>
    </View>
  );
}
