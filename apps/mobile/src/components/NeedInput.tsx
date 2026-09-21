import { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { apiFetch } from "../api/client";
import { Icon } from "./Icon";

const SUGGESTIONS = [
  { emoji: "🏝️", label: "Split a trip", prompt: "We're 8 friends traveling together and want to split all our expenses." },
  { emoji: "⚽", label: "Run a tournament", prompt: "We are organizing a knockout FC tournament for 16 players." },
  { emoji: "💰", label: "Track a collection", prompt: "Track everyone's monthly contribution to a shared money pool." },
  { emoji: "🔥", label: "30-day challenge", prompt: "Start a 30-day daily workout challenge with the group." },
  { emoji: "🍕", label: "Group dinner vote", prompt: "Create an instant vote for where we should eat tonight." },
];

const STAGES = ["Understanding your need…", "Finding the best tool…", "Assembling your app…"];

type Outcome =
  | { kind: "chat_answer"; text: string }
  | { kind: "reminder"; text: string; at?: string }
  | { kind: "clarify"; question: string }
  | { kind: "mini_app"; appInstanceId: string; title: string };

export function NeedInput({ autoFocus }: { autoFocus?: boolean }) {
  const navigation = useNavigation<any>();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const stageTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (stageTimer.current) clearInterval(stageTimer.current); }, []);

  async function submit(value: string) {
    if (!value.trim() || loading) return;
    return run(() => apiFetch<Outcome>("/api/needs", { method: "POST", body: JSON.stringify({ text: value }) }));
  }

  function surpriseMe() {
    if (loading) return;
    setText("🎲 Surprise me — build something random");
    return run(() => apiFetch<Outcome>("/api/needs/surprise", { method: "POST" }));
  }

  async function run(call: () => Promise<Outcome>) {
    setLoading(true);
    setError(null);
    setOutcome(null);
    setStage(0);
    stageTimer.current = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 480);

    try {
      const result = await call();
      if (result.kind === "mini_app") {
        navigation.navigate("AppRuntime", { appInstanceId: result.appInstanceId });
        return;
      }
      setOutcome(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      if (stageTimer.current) clearInterval(stageTimer.current);
      setLoading(false);
    }
  }

  return (
    <View className="w-full">
      <View className="rounded-[22px] bg-surface-container-lowest p-4 shadow-md gap-3">
        <View>
          <TextInput
            autoFocus={autoFocus}
            value={text}
            onChangeText={setText}
            placeholder="e.g. We're 8 friends traveling to Dahab and want to split all our expenses..."
            placeholderTextColor="#908fa0"
            multiline
            numberOfLines={3}
            className="rounded-2xl bg-surface-container-low p-4 text-base text-on-surface"
            style={{ minHeight: 88, textAlignVertical: "top" }}
          />
          <View className="absolute right-3 top-3 opacity-40">
            <Icon name="auto_awesome" size={20} color="#8083ff" />
          </View>
        </View>

        <View className="flex-row items-center justify-between pt-1">
          <View className="flex-row items-center gap-2">
            <View className="h-9 w-9 items-center justify-center rounded-full bg-surface-container">
              <Icon name="mic" size={18} color="#8083ff" />
            </View>
            <View className="h-9 w-9 items-center justify-center rounded-full bg-surface-container">
              <Icon name="attach_file" size={18} color="#c7c4d7" />
            </View>
          </View>
          <Pressable
            onPress={() => submit(text)}
            disabled={!text.trim() || loading}
            className="flex-row items-center gap-1.5 rounded-full bg-primary-container px-5 py-2.5 shadow-sm active:opacity-90 disabled:opacity-40"
          >
            {loading ? (
              <ActivityIndicator color="#1000a9" size="small" />
            ) : (
              <>
                <Icon name="bolt" size={18} color="#1000a9" />
                <Text className="font-semibold text-on-primary">Make</Text>
                <Icon name="arrow_forward" size={18} color="#1000a9" />
              </>
            )}
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View className="mt-3 flex-row items-center justify-center gap-2">
          <ActivityIndicator size="small" color="#c0c1ff" />
          <Text className="text-sm text-on-surface-variant">{STAGES[stage]}</Text>
        </View>
      ) : null}

      {!loading && !outcome && !error ? (
        <View className="mt-4 flex-row items-center justify-between px-1">
          <Text className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Popular right now</Text>
          <Pressable
            onPress={surpriseMe}
            className="flex-row items-center gap-1 rounded-full bg-secondary-container px-3 py-1 active:opacity-90"
          >
            <Text>🎲</Text>
            <Text className="text-xs font-semibold text-on-secondary-container">Surprise me</Text>
          </Pressable>
        </View>
      ) : null}

      {!loading && !outcome && !error ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2 -mx-1" contentContainerStyle={{ paddingHorizontal: 4, gap: 8 }}>
          {SUGGESTIONS.map((s) => (
            <Pressable
              key={s.label}
              onPress={() => { setText(s.prompt); submit(s.prompt); }}
              className="flex-row items-center gap-1.5 rounded-full bg-surface-container-low px-3.5 py-2 active:bg-surface-container"
            >
              <Text>{s.emoji}</Text>
              <Text className="text-sm font-medium text-on-surface">{s.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      {error ? (
        <View className="mt-4 rounded-2xl bg-error-container p-4">
          <Text className="text-sm text-on-error-container">{error}</Text>
        </View>
      ) : null}

      {outcome?.kind === "chat_answer" ? (
        <View className="mt-4 rounded-2xl bg-primary-fixed p-4">
          <Text className="text-sm text-on-primary-fixed">{outcome.text}</Text>
        </View>
      ) : null}

      {outcome?.kind === "reminder" ? (
        <View className="mt-4 rounded-2xl bg-secondary-container p-4">
          <Text className="text-sm text-on-secondary-container">
            Got it — I&rsquo;ll remember: {outcome.text}
            {outcome.at ? ` at ${outcome.at}` : ""}.
          </Text>
        </View>
      ) : null}

      {outcome?.kind === "clarify" ? (
        <View className="mt-4 rounded-2xl bg-tertiary-fixed p-4">
          <Text className="text-sm text-on-tertiary-fixed-variant">{outcome.question}</Text>
        </View>
      ) : null}
    </View>
  );
}
