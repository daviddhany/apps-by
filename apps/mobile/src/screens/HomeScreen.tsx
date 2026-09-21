import { useCallback, useState } from "react";
import { View, Text, ScrollView, Pressable, RefreshControl } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { apiFetch } from "../api/client";
import { useAuth } from "../api/AuthContext";
import { AppHeader } from "../components/AppHeader";
import { NeedInput } from "../components/NeedInput";
import { Icon } from "../components/Icon";

const ICON_EMOJI: Record<string, string> = { sparkles: "✨", trophy: "🏆", receipt: "🧾", car: "🚗", "check-square": "✅" };

interface AppSummary {
  id: string;
  title: string;
  icon: string;
  role: string;
  status: string;
}

interface AppDetail {
  spec: { screens: { title: string }[]; settings: Record<string, unknown> };
  computed: Record<string, unknown>;
  data: { entityType: string }[];
}

interface CardData extends AppSummary {
  metricLabel: string;
  metricValue: string;
  screenCount: number;
}

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [cards, setCards] = useState<CardData[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { apps } = await apiFetch<{ apps: AppSummary[] }>("/api/apps");
      const withMetrics = await Promise.all(
        apps.slice(0, 5).map(async (a): Promise<CardData> => {
          try {
            const detail = await apiFetch<AppDetail>(`/api/apps/${a.id}`);
            const { metricLabel, metricValue } = deriveMetric(detail);
            return { ...a, metricLabel, metricValue, screenCount: detail.spec.screens.length };
          } catch {
            return { ...a, metricLabel: "Screens", metricValue: "—", screenCount: 0 };
          }
        })
      );
      setCards(withMetrics);
    } catch {
      setCards([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View className="flex-1 bg-surface">
      <AppHeader title="Needly" subtitle="Home" initial={user?.name ?? "N"} />
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: insets.bottom + 32, gap: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
      >
        <View className="gap-1">
          <View className="flex-row items-center gap-1.5 self-start rounded-full bg-surface-container-high px-3 py-1">
            <Text className="text-sm font-medium text-on-surface-variant">Hi {user?.name?.split(" ")[0] ?? "there"} 👋</Text>
          </View>
          <Text className="mt-1 text-4xl font-extrabold tracking-tight text-on-surface">What do you need?</Text>
          <Text className="text-base text-on-surface-variant">Tell Needly what you&rsquo;re trying to do — we&rsquo;ll build the tool in seconds.</Text>
        </View>

        <NeedInput autoFocus={false} />

        <Pressable
          onPress={() => navigation.navigate("Join")}
          className="flex-row items-center justify-between gap-3 rounded-2xl bg-surface-container-high/60 p-3"
        >
          <View className="flex-1 flex-row items-center gap-2.5">
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-surface-container-lowest">
              <Icon name="qr_code_scanner" size={20} color="#c0c1ff" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-semibold text-on-surface">Got a code? Join an app</Text>
              <Text className="text-xs text-on-surface-variant">e.g. D7K-42P</Text>
            </View>
          </View>
          <View className="rounded-full bg-surface-container-lowest px-3.5 py-1.5">
            <Text className="text-sm font-semibold text-primary">Join</Text>
          </View>
        </Pressable>

        {cards.length > 0 ? (
          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Text className="text-lg font-bold tracking-tight text-on-surface">Your Active Apps</Text>
                <View className="rounded-full bg-primary-fixed px-2 py-0.5">
                  <Text className="text-xs font-bold text-on-primary-fixed">{cards.length} live</Text>
                </View>
              </View>
            </View>
            {cards.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => navigation.navigate("AppRuntime", { appInstanceId: c.id })}
                className="gap-3 rounded-[22px] bg-surface-container-lowest p-4 shadow-sm active:opacity-90"
              >
                <View className="flex-row items-start justify-between gap-2">
                  <View className="flex-1 flex-row items-center gap-2.5">
                    <View className="h-10 w-10 items-center justify-center rounded-2xl bg-surface-variant">
                      <Text className="text-xl">{ICON_EMOJI[c.icon] ?? "✨"}</Text>
                    </View>
                    <View className="flex-1">
                      <Text numberOfLines={1} className="text-base font-bold text-on-surface">{c.title}</Text>
                      <Text className="text-xs text-on-surface-variant">as {c.role}</Text>
                    </View>
                  </View>
                  <View className="rounded-full bg-surface-container-high px-2.5 py-1">
                    <Text className="text-xs font-semibold text-primary">Active</Text>
                  </View>
                </View>
                <View className="flex-row gap-2 rounded-xl bg-surface-container-low/70 p-2.5">
                  <View className="flex-1">
                    <Text className="text-xs text-on-surface-variant">{c.metricLabel}</Text>
                    <Text className="text-lg font-bold text-on-surface">{c.metricValue}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-on-surface-variant">Screens</Text>
                    <Text className="text-lg font-bold text-on-surface">{c.screenCount}</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}

        <View className="flex-row items-center gap-3 rounded-2xl bg-surface-container p-4">
          <View className="h-9 w-9 items-center justify-center rounded-full bg-surface-container-lowest">
            <Icon name="offline_bolt" size={20} color="#c0c1ff" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-on-surface">Every app is instantly shareable</Text>
            <Text className="text-xs text-on-surface-variant">Friends can use it without downloading anything.</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function deriveMetric(detail: AppDetail): { metricLabel: string; metricValue: string } {
  const computed = detail.computed;
  if (computed["expense.balances"]) {
    const { balances } = computed["expense.balances"] as { balances: { net: number }[] };
    const unsettled = balances.filter((b) => b.net < -0.01).reduce((s, b) => s - b.net, 0);
    return { metricLabel: "Unsettled", metricValue: `$${unsettled.toFixed(0)}` };
  }
  if (computed["tournament.standings"]) {
    const matchCount = detail.data.filter((r) => r.entityType === "tournament.match").length;
    return { metricLabel: "Matches", metricValue: String(matchCount) };
  }
  if (computed["savings.totalProgress"] !== undefined) {
    const goal = Number(detail.spec.settings.goalAmount ?? 0);
    const total = Number(computed["savings.totalProgress"] ?? 0);
    return { metricLabel: "Progress", metricValue: goal > 0 ? `${Math.round((total / goal) * 100)}%` : `$${total.toFixed(0)}` };
  }
  if (computed["checklist.progress"] !== undefined) {
    return { metricLabel: "Done", metricValue: `${Math.round(Number(computed["checklist.progress"]) * 100)}%` };
  }
  return { metricLabel: "Screens", metricValue: String(detail.spec.screens.length) };
}
