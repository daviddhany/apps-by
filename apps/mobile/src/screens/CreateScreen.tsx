import { View, Text, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppHeader } from "../components/AppHeader";
import { NeedInput } from "../components/NeedInput";
import { useAuth } from "../api/AuthContext";

export function CreateScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-surface">
      <AppHeader title="Create" initial={user?.name ?? "N"} />
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingTop: 16, paddingBottom: insets.bottom + 32, gap: 16 }}>
        <View className="items-center">
          <Text className="text-2xl font-bold text-on-surface">Make something</Text>
          <Text className="mt-1 text-base text-on-surface-variant">Describe the situation — I&rsquo;ll build the tool.</Text>
        </View>
        <NeedInput autoFocus />
      </ScrollView>
    </View>
  );
}
