import { View, Text } from "react-native";
import type { ScreenComponentProps } from "@needly/core";

export function LeaderboardView({ screen, allRecords, computed, spec }: ScreenComponentProps) {
  const namespace = screen.entity?.split(".")[0] ?? spec.toolDnaSlug[0];
  const players = allRecords.filter((r) => r.entityType === screen.entity);

  if (namespace === "tournament") {
    const standings = (computed["tournament.standings"] ?? {}) as Record<string, { wins: number; losses: number }>;
    const rows = players
      .map((p) => ({ id: p.id, name: p.data.name as string, ...(standings[p.id] ?? { wins: 0, losses: 0 }) }))
      .sort((a, b) => b.wins - a.wins);
    return (
      <View className="divide-y divide-outline-variant/30 rounded-2xl bg-surface-container-lowest pb-24">
        {rows.map((r, i) => (
          <View key={r.id} className="flex-row items-center gap-3 px-4 py-3">
            <Text className="w-5 text-center text-sm font-semibold text-on-surface-variant">{i + 1}</Text>
            <Text className="flex-1 text-sm font-medium text-on-surface">{r.name}</Text>
            <Text className="text-sm text-on-surface-variant">{r.wins}W – {r.losses}L</Text>
          </View>
        ))}
        {rows.length === 0 ? <Text className="px-4 py-8 text-center text-sm text-on-surface-variant">No results yet.</Text> : null}
      </View>
    );
  }

  const streaks = (computed["habit.streaks"] ?? {}) as Record<string, number>;
  const rows = players.map((p) => ({ id: p.id, name: p.data.name as string, streak: streaks[p.id] ?? 0 })).sort((a, b) => b.streak - a.streak);

  return (
    <View className="divide-y divide-outline-variant/30 rounded-2xl bg-surface-container-lowest pb-24">
      {rows.map((r, i) => (
        <View key={r.id} className="flex-row items-center gap-3 px-4 py-3">
          <Text className="w-5 text-center text-sm font-semibold text-on-surface-variant">{i + 1}</Text>
          <Text className="flex-1 text-sm font-medium text-on-surface">{r.name}</Text>
          <Text className="text-sm text-tertiary">🔥 {r.streak}</Text>
        </View>
      ))}
      {rows.length === 0 ? <Text className="px-4 py-8 text-center text-sm text-on-surface-variant">No check-ins yet.</Text> : null}
    </View>
  );
}
