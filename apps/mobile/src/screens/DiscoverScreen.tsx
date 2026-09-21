import { useCallback, useState } from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { apiFetch } from "../api/client";
import { AppHeader } from "../components/AppHeader";
import { useAuth } from "../api/AuthContext";

interface Template {
  id: string;
  title: string;
  description: string;
  category: string;
  usageCount: number;
  remixCount: number;
}

export function DiscoverScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [usingId, setUsingId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      apiFetch<{ templates: Template[] }>("/api/templates")
        .then((r) => setTemplates(r.templates))
        .catch(() => setTemplates([]));
    }, [])
  );

  async function use(id: string) {
    setUsingId(id);
    try {
      const result = await apiFetch<{ appInstanceId: string }>(`/api/templates/${id}/use`, { method: "POST" });
      navigation.navigate("AppRuntime", { appInstanceId: result.appInstanceId });
    } finally {
      setUsingId(null);
    }
  }

  return (
    <View className="flex-1 bg-surface">
      <AppHeader title="Discover" initial={user?.name ?? "N"} />
      <View className="flex-1 px-4 pt-4">
        <Text className="text-2xl font-bold text-on-surface">Discover</Text>
        <Text className="mb-4 text-sm text-on-surface-variant">Tools other people have made — use one instantly.</Text>

        {templates.length === 0 ? (
          <View className="items-center rounded-2xl bg-surface-container-lowest px-6 py-12">
            <Text className="text-center text-sm text-on-surface-variant">Nothing published yet.</Text>
          </View>
        ) : (
          <FlatList
            data={templates}
            keyExtractor={(t) => t.id}
            contentContainerStyle={{ gap: 12, paddingBottom: 32 }}
            renderItem={({ item }) => (
              <View className="rounded-2xl bg-surface-container-lowest p-4">
                <View className="flex-row items-start justify-between gap-2">
                  <View className="flex-1">
                    <Text className="text-base font-bold text-on-surface">{item.title}</Text>
                    <Text className="mt-0.5 text-sm text-on-surface-variant">{item.description}</Text>
                  </View>
                  <View className="rounded-full bg-primary-fixed px-2 py-1">
                    <Text className="text-xs font-semibold text-on-primary-fixed">{item.category}</Text>
                  </View>
                </View>
                <View className="mt-3 flex-row items-center justify-between">
                  <Text className="text-xs text-on-surface-variant">
                    {item.usageCount} uses · {item.remixCount} remixes
                  </Text>
                  <Pressable disabled={usingId === item.id} onPress={() => use(item.id)} className="rounded-full bg-primary px-3 py-1.5">
                    {usingId === item.id ? <ActivityIndicator size="small" color="#fff" /> : <Text className="text-sm font-semibold text-on-primary">Use this</Text>}
                  </Pressable>
                </View>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
}
