import { useCallback, useState } from "react";
import { View, Text, FlatList, Pressable } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { apiFetch } from "../api/client";
import { AppHeader } from "../components/AppHeader";
import { Icon } from "../components/Icon";
import { useAuth } from "../api/AuthContext";

interface AppSummary {
  id: string;
  title: string;
  role: string;
  status: string;
}

export function MyAppsScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [apps, setApps] = useState<AppSummary[]>([]);

  useFocusEffect(
    useCallback(() => {
      apiFetch<{ apps: AppSummary[] }>("/api/apps")
        .then((r) => setApps(r.apps))
        .catch(() => setApps([]));
    }, [])
  );

  return (
    <View className="flex-1 bg-surface">
      <AppHeader title="My Apps" initial={user?.name ?? "N"} />
      <View className="flex-1 px-4 pt-4">
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-on-surface">My Apps</Text>
          <Pressable onPress={() => navigation.navigate("Join")} className="flex-row items-center gap-1 rounded-full bg-primary-fixed px-3 py-1.5">
            <Icon name="qr_code_scanner" size={16} color="#001551" />
            <Text className="text-sm font-medium text-on-primary-fixed">Join with code</Text>
          </Pressable>
        </View>

        {apps.length === 0 ? (
          <View className="items-center gap-2 rounded-2xl bg-surface-container-lowest px-6 py-12">
            <Text className="text-3xl">🗂️</Text>
            <Text className="text-base font-bold text-on-surface">No apps yet</Text>
            <Text className="text-center text-sm text-on-surface-variant">Describe what you need on the Home tab to create your first one.</Text>
          </View>
        ) : (
          <FlatList
            data={apps}
            keyExtractor={(a) => a.id}
            contentContainerStyle={{ gap: 8, paddingBottom: 32 }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => navigation.navigate("AppRuntime", { appInstanceId: item.id })}
                className="flex-row items-center justify-between rounded-2xl bg-surface-container-lowest px-4 py-3"
              >
                <View>
                  <Text className="text-base font-bold text-on-surface">{item.title}</Text>
                  <Text className="text-xs text-on-surface-variant">
                    {item.role} · {item.status}
                  </Text>
                </View>
                <Icon name="chevron_right" size={20} color="#94A3B8" />
              </Pressable>
            )}
          />
        )}
      </View>
    </View>
  );
}
