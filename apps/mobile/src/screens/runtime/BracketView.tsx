import { useState } from "react";
import { View, Text, Pressable, TextInput, ScrollView } from "react-native";
import type { ScreenComponentProps } from "@needly/core";
import { canDo, labelFor } from "@needly/core";

export function BracketView({ records, allRecords, actions, role, onMutate }: ScreenComponentProps) {
  const canRecord = canDo(actions, "record_score", role);
  const canRandomize = canDo(actions, "randomize", role);
  const players = allRecords.filter((r) => r.entityType === "tournament.player");
  const rounds = [...new Set(records.map((r) => r.data.round as number))].sort((a, b) => a - b);

  return (
    <ScrollView horizontal className="pb-24 pt-1" contentContainerStyle={{ gap: 16 }}>
      {rounds.length === 0 ? (
        <View className="items-center gap-3 rounded-2xl bg-surface-container-lowest px-6 py-12">
          <Text className="text-center text-sm text-on-surface-variant">
            {players.length < 2 ? "Add at least 2 players, then generate the bracket." : "Ready to generate the bracket."}
          </Text>
          {canRandomize && players.length >= 2 ? (
            <Pressable onPress={() => onMutate({ action: "randomize", entity: "tournament.match", payload: {} })} className="rounded-full bg-primary px-4 py-2">
              <Text className="text-sm font-medium text-on-primary">Generate bracket</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        rounds.map((round) => (
          <View key={round} className="min-w-[220px] justify-around gap-3">
            <Text className="text-center text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              {round === Math.max(...rounds) ? "Final" : `Round ${round}`}
            </Text>
            {records
              .filter((r) => r.data.round === round)
              .sort((a, b) => (a.data.slot as number) - (b.data.slot as number))
              .map((m) => (
                <MatchCard key={m.id} match={m} players={players} canRecord={canRecord} onMutate={onMutate} />
              ))}
          </View>
        ))
      )}
    </ScrollView>
  );
}

function MatchCard({
  match,
  players,
  canRecord,
  onMutate,
}: {
  match: ScreenComponentProps["records"][number];
  players: ScreenComponentProps["allRecords"];
  canRecord: boolean;
  onMutate: ScreenComponentProps["onMutate"];
}) {
  const [editing, setEditing] = useState(false);
  const [scoreA, setScoreA] = useState(String(match.data.scoreA ?? ""));
  const [scoreB, setScoreB] = useState(String(match.data.scoreB ?? ""));
  const playerAId = match.data.playerAId as string | undefined;
  const playerBId = match.data.playerBId as string | undefined;
  const done = match.data.status === "done";

  return (
    <View className="rounded-2xl bg-surface-container-lowest p-3">
      <Row label={labelFor(players, playerAId, "TBD")} score={match.data.scoreA as number | undefined} won={done && (match.data.scoreA as number) > (match.data.scoreB as number)} />
      <Row label={labelFor(players, playerBId, "TBD")} score={match.data.scoreB as number | undefined} won={done && (match.data.scoreB as number) > (match.data.scoreA as number)} />

      {canRecord && playerAId && playerBId && !done ? (
        editing ? (
          <View className="mt-2 flex-row items-center gap-2">
            <TextInput value={scoreA} onChangeText={setScoreA} keyboardType="numeric" className="w-12 rounded-lg bg-surface-container-low px-2 py-1 text-center text-sm" />
            <Text className="text-on-surface-variant">–</Text>
            <TextInput value={scoreB} onChangeText={setScoreB} keyboardType="numeric" className="w-12 rounded-lg bg-surface-container-low px-2 py-1 text-center text-sm" />
            <Pressable
              onPress={async () => {
                await onMutate({ action: "record_score", entity: "tournament.match", payload: { matchId: match.id, scoreA: Number(scoreA), scoreB: Number(scoreB) } });
                setEditing(false);
              }}
              className="ml-auto rounded-full bg-primary px-2 py-1"
            >
              <Text className="text-xs font-medium text-on-primary">Save</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={() => setEditing(true)} className="mt-2 items-center rounded-lg bg-primary-fixed py-1.5">
            <Text className="text-xs font-medium text-on-primary-fixed">Enter score</Text>
          </Pressable>
        )
      ) : null}
    </View>
  );
}

function Row({ label, score, won }: { label: string; score?: number; won: boolean }) {
  return (
    <View className={`flex-row items-center justify-between rounded-lg px-2 py-1 ${won ? "bg-secondary-container" : ""}`}>
      <Text className={won ? "text-sm font-semibold text-secondary" : "text-sm text-on-surface"}>{label}</Text>
      <Text className={won ? "text-sm font-semibold text-secondary" : "text-sm text-on-surface"}>{score ?? ""}</Text>
    </View>
  );
}
