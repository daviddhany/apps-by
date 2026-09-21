import { useCallback, useMemo, useState } from "react";
import { View, Text, FlatList, Pressable, Alert } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { apiFetch } from "../api/client";
import { AppHeader } from "../components/AppHeader";
import { BottomSheet } from "../components/BottomSheet";
import { Icon } from "../components/Icon";
import { useAuth } from "../api/AuthContext";
import { useThemeColors } from "../theme/ThemeContext";

interface AppSummary {
  id: string;
  title: string;
  role: string;
  status: string;
}

type Filter = "all" | "active" | "archived";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "archived", label: "Archived" },
];

export function MyAppsScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const colors = useThemeColors();
  const [apps, setApps] = useState<AppSummary[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [menuApp, setMenuApp] = useState<AppSummary | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    apiFetch<{ apps: AppSummary[] }>("/api/apps")
      .then((r) => setApps(r.apps))
      .catch(() => setApps([]));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const visible = useMemo(
    () => (filter === "all" ? apps : apps.filter((a) => a.status === filter)),
    [apps, filter]
  );
  const archivedCount = useMemo(() => apps.filter((a) => a.status === "archived").length, [apps]);

  async function setArchived(app: AppSummary, archived: boolean) {
    setMenuApp(null);
    setBusyId(app.id);
    try {
      await apiFetch(`/api/apps/${app.id}`, { method: "PATCH", body: JSON.stringify({ status: archived ? "archived" : "active" }) });
      load();
    } catch (err) {
      Alert.alert("Couldn't update this app", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  function confirmDelete(app: AppSummary) {
    setMenuApp(null);
    Alert.alert(
      `Delete "${app.title}"?`,
      "This deletes all its data for everyone and can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setBusyId(app.id);
            try {
              await apiFetch(`/api/apps/${app.id}`, { method: "DELETE" });
              load();
            } catch (err) {
              Alert.alert("Couldn't delete this app", err instanceof Error ? err.message : "Please try again.");
            } finally {
              setBusyId(null);
            }
          },
        },
      ]
    );
  }

  return (
    <View className="flex-1 bg-surface">
      <AppHeader title="My Apps" initial={user?.name ?? "N"} />
      <View className="flex-1 px-4 pt-4">
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-on-surface">My Apps</Text>
          <Pressable onPress={() => navigation.navigate("Join")} className="flex-row items-center gap-1 rounded-full bg-primary-fixed px-3 py-1.5">
            <Icon name="qr_code_scanner" size={16} color={colors["on-primary-fixed"]} />
            <Text className="text-sm font-medium text-on-primary-fixed">Join with code</Text>
          </Pressable>
        </View>

        <View className="mb-4 flex-row gap-2">
          {FILTERS.map((f) => (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              className={`flex-row items-center gap-1.5 rounded-full px-3.5 py-1.5 ${filter === f.key ? "bg-primary-container" : "bg-surface-container"}`}
            >
              <Text className={`text-sm font-medium ${filter === f.key ? "text-on-primary-container" : "text-on-surface-variant"}`}>{f.label}</Text>
              {f.key === "archived" && archivedCount > 0 ? (
                <View className={`rounded-full px-1.5 ${filter === f.key ? "bg-white/20" : "bg-surface-container-high"}`}>
                  <Text className={`text-xs font-bold ${filter === f.key ? "text-on-primary-container" : "text-on-surface-variant"}`}>{archivedCount}</Text>
                </View>
              ) : null}
            </Pressable>
          ))}
        </View>

        {visible.length === 0 ? (
          <View className="items-center gap-2 rounded-2xl bg-surface-container-lowest px-6 py-12">
            <Text className="text-3xl">🗂️</Text>
            <Text className="text-base font-bold text-on-surface">{filter === "archived" ? "No archived apps" : "No apps yet"}</Text>
            <Text className="text-center text-sm text-on-surface-variant">
              {filter === "archived" ? "Apps you archive show up here." : "Describe what you need on the Home tab to create your first one."}
            </Text>
          </View>
        ) : (
          <FlatList
            data={visible}
            keyExtractor={(a) => a.id}
            contentContainerStyle={{ gap: 8, paddingBottom: 32 }}
            renderItem={({ item }) => (
              <View
                className={`flex-row items-center justify-between rounded-2xl bg-surface-container-lowest px-4 py-3 ${busyId === item.id ? "opacity-50" : ""}`}
              >
                <Pressable
                  disabled={busyId === item.id}
                  onPress={() => navigation.navigate("AppRuntime", { appInstanceId: item.id })}
                  className="flex-1"
                >
                  <View className="flex-row items-center gap-1.5">
                    <Text numberOfLines={1} className="text-base font-bold text-on-surface">{item.title}</Text>
                    {item.status === "archived" ? (
                      <View className="rounded-full bg-surface-container-high px-2 py-0.5">
                        <Text className="text-xs text-on-surface-variant">Archived</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text className="text-xs text-on-surface-variant">{item.role}</Text>
                </Pressable>
                <Pressable
                  disabled={busyId === item.id}
                  onPress={() => setMenuApp(item)}
                  className="ml-2 h-9 w-9 items-center justify-center rounded-full active:bg-surface-container"
                >
                  <Icon name="more_vert" size={18} color={colors["on-surface-variant"]} />
                </Pressable>
              </View>
            )}
          />
        )}
      </View>

      <BottomSheet visible={!!menuApp} title={menuApp?.title ?? ""} onClose={() => setMenuApp(null)}>
        {menuApp ? (
          <View className="gap-2">
            {menuApp.status === "archived" ? (
              <Pressable onPress={() => setArchived(menuApp, false)} className="flex-row items-center gap-3 rounded-2xl bg-surface-container-low px-4 py-3">
                <Icon name="unarchive" size={20} color={colors.primary} />
                <Text className="text-base font-medium text-on-surface">Restore app</Text>
              </Pressable>
            ) : (
              <Pressable onPress={() => setArchived(menuApp, true)} className="flex-row items-center gap-3 rounded-2xl bg-surface-container-low px-4 py-3">
                <Icon name="archive" size={20} color={colors["on-surface-variant"]} />
                <View>
                  <Text className="text-base font-medium text-on-surface">Archive app</Text>
                  <Text className="text-xs text-on-surface-variant">Hides it without losing any data. Reversible.</Text>
                </View>
              </Pressable>
            )}
            {menuApp.role === "owner" ? (
              <Pressable onPress={() => confirmDelete(menuApp)} className="flex-row items-center gap-3 rounded-2xl bg-error-container px-4 py-3">
                <Icon name="delete_forever" size={20} color={colors["on-error-container"]} />
                <View>
                  <Text className="text-base font-medium text-on-error-container">Delete permanently</Text>
                  <Text className="text-xs text-on-error-container/80">Deletes all data for every member. Can&rsquo;t be undone.</Text>
                </View>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </BottomSheet>
    </View>
  );
}
