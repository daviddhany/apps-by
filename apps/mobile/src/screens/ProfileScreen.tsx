import { useCallback, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { AppHeader } from "../components/AppHeader";
import { Icon } from "../components/Icon";
import { apiFetch } from "../api/client";
import { useAuth } from "../api/AuthContext";
import { useThemeColors } from "../theme/ThemeContext";

export function ProfileScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation<any>();
  const colors = useThemeColors();
  const [friendCount, setFriendCount] = useState(0);
  const [incomingCount, setIncomingCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      apiFetch<{ friends: unknown[]; incoming: unknown[] }>("/api/friends")
        .then((r) => {
          setFriendCount(r.friends.length);
          setIncomingCount(r.incoming.length);
        })
        .catch(() => {});
    }, [])
  );

  return (
    <View className="flex-1 bg-surface">
      <AppHeader title="Profile" initial={user?.name ?? "N"} />
      <View className="flex-1 gap-4 px-4 pt-4">
        <View className="items-center gap-2 rounded-2xl bg-surface-container-lowest p-6">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-primary-fixed">
            <Text className="text-2xl font-bold text-on-primary-fixed">{(user?.name ?? "N").slice(0, 1).toUpperCase()}</Text>
          </View>
          <Text className="text-lg font-bold text-on-surface">{user?.name}</Text>
          <Text className="text-sm text-on-surface-variant">{user?.email}</Text>
        </View>

        <Pressable onPress={() => navigation.navigate("Friends")} className="flex-row items-center justify-between rounded-2xl bg-surface-container-lowest px-4 py-3.5">
          <View className="flex-row items-center gap-3">
            <Icon name="group" size={20} color={colors.primary} />
            <View>
              <Text className="text-base font-bold text-on-surface">Friends</Text>
              <Text className="text-xs text-on-surface-variant">{friendCount} friend{friendCount === 1 ? "" : "s"}</Text>
            </View>
          </View>
          <View className="flex-row items-center gap-2">
            {incomingCount > 0 ? (
              <View className="rounded-full bg-tertiary px-2 py-0.5">
                <Text className="text-xs font-bold text-on-tertiary">{incomingCount}</Text>
              </View>
            ) : null}
            <Icon name="chevron_right" size={20} color={colors.outline} />
          </View>
        </Pressable>

        <Pressable onPress={() => navigation.navigate("AccountSettings")} className="flex-row items-center justify-between rounded-2xl bg-surface-container-lowest px-4 py-3.5">
          <View className="flex-row items-center gap-3">
            <Icon name="settings" size={20} color={colors.primary} />
            <Text className="text-base font-bold text-on-surface">Account settings</Text>
          </View>
          <Icon name="chevron_right" size={20} color={colors.outline} />
        </Pressable>

        <View className="rounded-2xl bg-surface-container-lowest p-5">
          <Text className="text-base font-bold text-on-surface">Plan: Free</Text>
          <Text className="mt-1 text-sm text-on-surface-variant">Unlimited creation for the MVP — Pro features are architected but not enforced yet.</Text>
        </View>

        <Pressable onPress={logout} className="items-center rounded-xl border border-outline-variant/40 py-3">
          <Text className="text-base font-medium text-on-surface-variant">Sign out</Text>
        </Pressable>
      </View>
    </View>
  );
}
