import { useCallback, useState } from "react";
import { View, Text, TextInput, Pressable, FlatList, ActivityIndicator, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { apiFetch } from "../api/client";
import { AppHeader } from "../components/AppHeader";
import { Icon } from "../components/Icon";
import { useAuth } from "../api/AuthContext";
import { useThemeColors } from "../theme/ThemeContext";

interface FriendEntry {
  id: string;
  userId: string;
  name: string;
  email: string | null;
  createdAt: string;
}

export function FriendsScreen() {
  const { user } = useAuth();
  const colors = useThemeColors();
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [incoming, setIncoming] = useState<FriendEntry[]>([]);
  const [outgoing, setOutgoing] = useState<FriendEntry[]>([]);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    apiFetch<{ friends: FriendEntry[]; incoming: FriendEntry[]; outgoing: FriendEntry[] }>("/api/friends")
      .then((r) => {
        setFriends(r.friends);
        setIncoming(r.incoming);
        setOutgoing(r.outgoing);
      })
      .catch(() => {});
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function sendRequest() {
    setSending(true);
    setError(null);
    setSuccess(null);
    try {
      await apiFetch("/api/friends", { method: "POST", body: JSON.stringify({ email }) });
      setSuccess(`Request sent to ${email}`);
      setEmail("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send request");
    } finally {
      setSending(false);
    }
  }

  async function respond(id: string, action: "accept" | "decline") {
    setBusyId(id);
    try {
      await apiFetch(`/api/friends/${id}`, { method: "POST", body: JSON.stringify({ action }) });
      load();
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    setBusyId(id);
    try {
      await apiFetch(`/api/friends/${id}`, { method: "DELETE" });
      load();
    } finally {
      setBusyId(null);
    }
  }

  function confirmRemove(f: FriendEntry) {
    Alert.alert(`Remove ${f.name}?`, "You can send them a new friend request later.", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => remove(f.id) },
    ]);
  }

  const sections: { title: string; data: FriendEntry[]; kind: "incoming" | "outgoing" | "friend" }[] = [
    ...(incoming.length ? [{ title: `Requests (${incoming.length})`, data: incoming, kind: "incoming" as const }] : []),
    ...(outgoing.length ? [{ title: "Sent", data: outgoing, kind: "outgoing" as const }] : []),
    { title: `Friends (${friends.length})`, data: friends, kind: "friend" as const },
  ];

  return (
    <View className="flex-1 bg-surface">
      <AppHeader title="Friends" showBack initial={user?.name ?? "N"} />
      <FlatList
        className="flex-1 px-4 pt-4"
        data={sections}
        keyExtractor={(s) => s.kind}
        ListHeaderComponent={
          <View className="mb-4 gap-2 rounded-2xl bg-surface-container-lowest p-4">
            <Text className="text-sm font-semibold text-on-surface">Add a friend</Text>
            <View className="flex-row gap-2">
              <TextInput
                placeholder="Their email address"
                placeholderTextColor={colors.outline}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                className="flex-1 rounded-2xl bg-surface-container-low px-3.5 py-2.5 text-base text-on-surface"
              />
              <Pressable disabled={sending || !email} onPress={sendRequest} className="items-center justify-center rounded-full bg-primary px-5 disabled:opacity-50">
                {sending ? <ActivityIndicator color={colors["on-primary"]} /> : <Text className="font-semibold text-on-primary">Add</Text>}
              </Pressable>
            </View>
            {error ? <Text className="text-sm text-error">{error}</Text> : null}
            {success ? <Text className="text-sm text-secondary">{success}</Text> : null}
          </View>
        }
        renderItem={({ item: section }) => (
          <View className="mb-4 gap-2">
            <Text className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">{section.title}</Text>
            {section.kind === "friend" && section.data.length === 0 ? (
              <View className="items-center gap-2 rounded-2xl bg-surface-container-lowest px-6 py-10">
                <Text className="text-2xl">👋</Text>
                <Text className="text-base font-bold text-on-surface">No friends yet</Text>
                <Text className="text-center text-sm text-on-surface-variant">Add someone by email above to make it easy to share apps with them.</Text>
              </View>
            ) : (
              section.data.map((f) => (
                <View key={f.id} className="flex-row items-center justify-between gap-2 rounded-2xl bg-surface-container-lowest px-4 py-3">
                  <View className="flex-1 flex-row items-center gap-3">
                    <View className="h-9 w-9 items-center justify-center rounded-full bg-primary-fixed">
                      <Text className="text-xs font-bold text-on-primary-fixed">{f.name.slice(0, 1).toUpperCase()}</Text>
                    </View>
                    <Text numberOfLines={1} className="flex-1 text-base font-bold text-on-surface">{f.name}</Text>
                  </View>
                  {section.kind === "incoming" ? (
                    <View className="flex-row items-center gap-1.5">
                      <Pressable disabled={busyId === f.id} onPress={() => respond(f.id, "decline")} className="h-9 w-9 items-center justify-center rounded-full bg-error-container">
                        <Icon name="close" size={18} color={colors["on-error-container"]} />
                      </Pressable>
                      <Pressable disabled={busyId === f.id} onPress={() => respond(f.id, "accept")} className="h-9 w-9 items-center justify-center rounded-full bg-secondary-container">
                        <Icon name="check" size={18} color={colors["on-secondary-container"]} />
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      disabled={busyId === f.id}
                      onPress={() => (section.kind === "outgoing" ? remove(f.id) : confirmRemove(f))}
                    >
                      <Text className="text-sm font-medium text-on-surface-variant underline">{section.kind === "outgoing" ? "Cancel" : "Remove"}</Text>
                    </Pressable>
                  )}
                </View>
              ))
            )}
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 32 }}
      />
    </View>
  );
}
