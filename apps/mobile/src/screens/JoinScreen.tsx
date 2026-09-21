import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { apiFetch } from "../api/client";
import { useAuth } from "../api/AuthContext";
import { AppHeader } from "../components/AppHeader";

export function JoinScreen() {
  const navigation = useNavigation<any>();
  const { user, refresh } = useAuth();
  const [code, setCode] = useState("");
  const [guestName, setGuestName] = useState("");
  const [needsName, setNeedsName] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch<{ appInstanceId: string }>("/api/join", {
        method: "POST",
        body: JSON.stringify({ code, guestName: needsName ? guestName : undefined }),
      });
      await refresh();
      navigation.replace("AppRuntime", { appInstanceId: result.appInstanceId });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Couldn't join";
      if (message === "needs_name") {
        setNeedsName(true);
        setError("Enter your name to join as a guest.");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-surface">
      <AppHeader title="Join an app" showBack initial={user?.name ?? "N"} />
      <View className="flex-1 justify-center gap-6 px-6">
        <View className="items-center">
          <Text className="text-xl font-bold text-on-surface">Join an app</Text>
          <Text className="mt-1 text-sm text-on-surface-variant">Enter the code someone shared with you.</Text>
        </View>

        <View className="gap-3 rounded-2xl bg-surface-container-lowest p-5">
          <TextInput
            placeholder="D7K-42P"
            placeholderTextColor="#908fa0"
            autoCapitalize="characters"
            value={code}
            onChangeText={(v) => setCode(v.toUpperCase())}
            maxLength={8}
            className="rounded-2xl bg-surface-container-low px-4 py-3 text-center text-xl font-bold tracking-widest text-primary"
          />
          {needsName ? (
            <TextInput
              placeholder="Your name"
              placeholderTextColor="#908fa0"
              value={guestName}
              onChangeText={setGuestName}
              className="rounded-2xl bg-surface-container-low px-4 py-3 text-base text-on-surface"
            />
          ) : null}
          {error ? <Text className="text-sm text-tertiary">{error}</Text> : null}
          <Pressable onPress={submit} disabled={loading || !code} className="items-center rounded-full bg-primary py-3 disabled:opacity-50">
            {loading ? <ActivityIndicator color="#1000a9" /> : <Text className="text-base font-semibold text-on-primary">Join</Text>}
          </Pressable>
        </View>
      </View>
    </View>
  );
}
