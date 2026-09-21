import { View, Text, Pressable } from "react-native";
import { AppHeader } from "../components/AppHeader";
import { useAuth } from "../api/AuthContext";

export function ProfileScreen() {
  const { user, logout } = useAuth();

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
