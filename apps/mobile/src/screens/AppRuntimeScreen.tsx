import { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, Image, Linking, TextInput, Alert } from "react-native";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import type { MiniAppSpecification } from "@needly/core";
import type { RuntimeMember, RuntimeRecord } from "@needly/core";
import { apiFetch } from "../api/client";
import { getApiBaseUrl } from "../api/config";
import { useAuth } from "../api/AuthContext";
import { AppHeader } from "../components/AppHeader";
import { BottomSheet } from "../components/BottomSheet";
import { Icon } from "../components/Icon";
import { COMPONENT_REGISTRY } from "./runtime/registry";

interface AppData {
  appInstanceId: string;
  spec: MiniAppSpecification;
  status: string;
  role: string;
  data: RuntimeRecord[];
  computed: Record<string, unknown>;
  members: RuntimeMember[];
  joinCodes: { code: string; role: string }[];
}

const ICONS: Record<string, string> = { sparkles: "✨", trophy: "🏆", receipt: "🧾", car: "🚗", "check-square": "✅" };
const POLL_MS = 4000;

export function AppRuntimeScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const appInstanceId: string = route.params.appInstanceId;

  const [app, setApp] = useState<AppData | null>(null);
  const [activeScreenId, setActiveScreenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [showCommand, setShowCommand] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [busy, setBusy] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await apiFetch<AppData>(`/api/apps/${appInstanceId}`);
      setApp(result);
      setActiveScreenId((prev) => prev ?? result.spec.screens[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load this app");
    }
  }, [appInstanceId]);

  useFocusEffect(
    useCallback(() => {
      load();
      // No SSE on React Native — poll instead while this screen is focused.
      pollRef.current = setInterval(load, POLL_MS);
      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
      };
    }, [load])
  );

  if (error) {
    return (
      <View className="flex-1 items-center justify-center gap-2 bg-surface px-6">
        <Text className="text-lg font-medium text-on-surface">Can&rsquo;t open this app</Text>
        <Text className="text-sm text-on-surface-variant">{error}</Text>
        <Pressable onPress={() => navigation.goBack()} className="mt-3 rounded-full bg-primary px-4 py-2">
          <Text className="text-sm font-medium text-on-primary">Go back</Text>
        </Pressable>
      </View>
    );
  }

  if (!app) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" color="#c0c1ff" />
      </View>
    );
  }

  const activeScreen = app.spec.screens.find((s) => s.id === activeScreenId) ?? app.spec.screens[0];
  const ActiveComponent = activeScreen ? COMPONENT_REGISTRY[activeScreen.component] : null;
  const records = app.data.filter((r) => r.entityType === activeScreen?.entity);

  async function onMutate(mutation: { action: string; entity?: string; payload: Record<string, unknown> }) {
    setBusy(true);
    try {
      await apiFetch(`/api/apps/${appInstanceId}/mutate`, { method: "POST", body: JSON.stringify(mutation) });
      await load();
    } catch (err) {
      // Every onMutate caller (buttons/switches across the screen components)
      // fires this without awaiting/catching it themselves, so a failure here
      // must never throw past this point — surface it instead of becoming an
      // unhandled promise rejection.
      Alert.alert("That didn't work", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function setArchived(archived: boolean) {
    setShowMenu(false);
    try {
      await apiFetch(`/api/apps/${appInstanceId}`, { method: "PATCH", body: JSON.stringify({ status: archived ? "archived" : "active" }) });
      await load();
    } catch (err) {
      Alert.alert("Couldn't update this app", err instanceof Error ? err.message : "Please try again.");
    }
  }

  function confirmDeleteApp() {
    setShowMenu(false);
    Alert.alert(
      `Delete "${app?.spec.title}"?`,
      "This deletes all its data for everyone and can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await apiFetch(`/api/apps/${appInstanceId}`, { method: "DELETE" });
              navigation.goBack();
            } catch (err) {
              Alert.alert("Couldn't delete this app", err instanceof Error ? err.message : "Please try again.");
            }
          },
        },
      ]
    );
  }

  return (
    <View className="flex-1 bg-surface">
      <AppHeader title="App Runner" showBack initial={app.members.find((m) => m.id === user?.id)?.name ?? "N"} />

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingTop: 8, paddingBottom: insets.bottom + 96 }}>
        <View className="mb-4 rounded-2xl bg-surface-container-lowest p-4 shadow-sm">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1 flex-row items-center gap-3">
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-secondary-container">
                <Text className="text-2xl">{ICONS[app.spec.icon] ?? "✨"}</Text>
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-1.5">
                  <Text numberOfLines={1} className="text-lg font-bold text-on-surface">{app.spec.title}</Text>
                  <View className={`rounded-full px-2 py-0.5 ${app.status === "archived" ? "bg-surface-container-high" : "bg-primary-fixed"}`}>
                    <Text className={`text-xs ${app.status === "archived" ? "text-on-surface-variant" : "text-on-primary-fixed"}`}>
                      {app.status === "archived" ? "Archived" : "Active"}
                    </Text>
                  </View>
                </View>
                <Text numberOfLines={1} className="text-xs text-on-surface-variant">
                  {app.spec.screens.length} screens • you&rsquo;re {app.role}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center gap-1.5">
              <Pressable onPress={() => setShowShare(true)} className="flex-row items-center gap-1.5 rounded-full bg-surface-container px-3 py-2">
                <Icon name="qr_code_2" size={18} color="#c0c1ff" />
                <Text className="text-sm font-medium text-on-surface">{app.joinCodes[0]?.code ?? "Share"}</Text>
              </Pressable>
              {app.role === "owner" || app.role === "admin" ? (
                <Pressable onPress={() => setShowMenu(true)} className="h-9 w-9 items-center justify-center rounded-full bg-surface-container">
                  <Icon name="more_vert" size={18} color="#e2e2e9" />
                </Pressable>
              ) : null}
            </View>
          </View>

          <View className="mt-4 flex-row items-center">
            {app.members.slice(0, 5).map((m, i) => (
              <View key={m.id} style={{ marginLeft: i === 0 ? 0 : -8 }} className="h-8 w-8 items-center justify-center rounded-full border-2 border-surface-container-lowest bg-primary">
                <Text className="text-xs font-bold text-on-primary">{m.name.slice(0, 1).toUpperCase()}</Text>
              </View>
            ))}
            {app.members.length > 5 ? (
              <View style={{ marginLeft: -8 }} className="h-8 w-8 items-center justify-center rounded-full bg-surface-variant">
                <Text className="text-xs font-bold text-on-surface-variant">+{app.members.length - 5}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4" contentContainerStyle={{ gap: 8 }}>
          {app.spec.screens.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => setActiveScreenId(s.id)}
              className={`rounded-full px-4 py-2 ${s.id === activeScreen?.id ? "bg-primary-container" : "bg-surface-container"}`}
            >
              <Text className={s.id === activeScreen?.id ? "text-sm font-medium text-on-primary" : "text-sm text-on-surface-variant"}>{s.title}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {ActiveComponent && activeScreen ? (
          <ActiveComponent
            spec={app.spec}
            screen={activeScreen}
            records={records}
            allRecords={app.data}
            fields={app.spec.fields[activeScreen.entity ?? ""] ?? []}
            actions={app.spec.actions.filter((a) => !a.entity || a.entity === activeScreen.entity)}
            computed={app.computed}
            role={app.role}
            members={app.members}
            currentUserId={user?.id ?? ""}
            busy={busy}
            onMutate={onMutate}
          />
        ) : null}
      </ScrollView>

      <Pressable
        onPress={() => setShowCommand(true)}
        style={{ bottom: insets.bottom + 88 }}
        className="absolute right-4 flex-row items-center gap-2 rounded-full bg-inverse-surface px-4 py-3 shadow-lg active:opacity-90"
      >
        <Icon name="auto_awesome" size={20} color="#490080" />
        <Text className="font-bold tracking-tight text-inverse-on-surface">Modify</Text>
      </Pressable>

      <BottomSheet visible={showMenu} title={app.spec.title} onClose={() => setShowMenu(false)}>
        <View className="gap-2">
          {app.status === "archived" ? (
            <Pressable onPress={() => setArchived(false)} className="flex-row items-center gap-3 rounded-2xl bg-surface-container-low px-4 py-3">
              <Icon name="unarchive" size={20} color="#c0c1ff" />
              <Text className="text-base font-medium text-on-surface">Restore app</Text>
            </Pressable>
          ) : (
            <Pressable onPress={() => setArchived(true)} className="flex-row items-center gap-3 rounded-2xl bg-surface-container-low px-4 py-3">
              <Icon name="archive" size={20} color="#c7c4d7" />
              <View>
                <Text className="text-base font-medium text-on-surface">Archive app</Text>
                <Text className="text-xs text-on-surface-variant">Hides it without losing any data. Reversible.</Text>
              </View>
            </Pressable>
          )}
          {app.role === "owner" ? (
            <Pressable onPress={confirmDeleteApp} className="flex-row items-center gap-3 rounded-2xl bg-error-container px-4 py-3">
              <Icon name="delete_forever" size={20} color="#ffdad6" />
              <View>
                <Text className="text-base font-medium text-on-error-container">Delete permanently</Text>
                <Text className="text-xs text-on-error-container/80">Deletes all data for every member. Can&rsquo;t be undone.</Text>
              </View>
            </Pressable>
          ) : null}
        </View>
      </BottomSheet>

      <BottomSheet visible={showShare} title="Share this app" onClose={() => setShowShare(false)}>
        <ShareSheet appInstanceId={appInstanceId} title={app.spec.title} joinCodes={app.joinCodes} onRefresh={load} />
      </BottomSheet>

      <BottomSheet visible={showCommand} title="Tell the app what to do" onClose={() => setShowCommand(false)}>
        <CommandSheet
          appInstanceId={appInstanceId}
          onDone={() => {
            setShowCommand(false);
            load();
          }}
        />
      </BottomSheet>
    </View>
  );
}

function ShareSheet({
  appInstanceId,
  title,
  joinCodes,
  onRefresh,
}: {
  appInstanceId: string;
  title: string;
  joinCodes: { code: string; role: string }[];
  onRefresh: () => void;
}) {
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const code = joinCodes[0]?.code;
  const link = code ? `${getApiBaseUrl()}/join?code=${code}` : "";
  const qrSrc = link ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(link)}` : "";

  if (!code) {
    return (
      <Pressable
        disabled={creating}
        onPress={async () => {
          setCreating(true);
          await apiFetch(`/api/apps/${appInstanceId}/join-code`, { method: "POST" });
          setCreating(false);
          onRefresh();
        }}
        className="items-center rounded-full bg-primary py-3"
      >
        {creating ? <ActivityIndicator color="#1000a9" /> : <Text className="font-semibold text-on-primary">Create a join code</Text>}
      </Pressable>
    );
  }

  return (
    <View className="gap-4">
      <Text className="text-sm text-on-surface-variant">Give friends instant access to {title} — no account required to join.</Text>

      <View className="items-center rounded-2xl bg-surface-container-low p-4">
        <Text className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-on-surface-variant">Join code</Text>
        <View className="rounded-full bg-surface-container-lowest px-5 py-2.5">
          <Text className="text-2xl font-bold tracking-widest text-primary">{code}</Text>
        </View>
        <Pressable
          onPress={async () => {
            await Clipboard.setStringAsync(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="mt-3 flex-row items-center gap-1.5 rounded-full bg-surface-container-high px-4 py-1.5"
        >
          <Icon name={copied ? "check" : "content_copy"} size={16} color="#e2e2e9" />
          <Text className="text-sm font-medium text-on-surface">{copied ? "Copied!" : "Copy invite link"}</Text>
        </Pressable>
      </View>

      {qrSrc ? (
        <View className="items-center gap-2 rounded-2xl bg-surface-container-low p-4">
          <Image source={{ uri: qrSrc }} style={{ width: 144, height: 144, borderRadius: 16, backgroundColor: "#fff" }} />
          <Text className="text-sm text-on-surface">Scan to join {title}</Text>
        </View>
      ) : null}

      <View className="flex-row gap-2">
        <Pressable
          onPress={() => Linking.openURL(`https://wa.me/?text=${encodeURIComponent(`Join ${title} on Apps By: ${link}`)}`)}
          className="flex-1 flex-row items-center justify-center gap-1.5 rounded-2xl bg-surface-container-low py-2.5"
        >
          <Icon name="chat" size={18} color="#25D366" />
          <Text className="text-sm font-semibold text-on-surface">WhatsApp</Text>
        </Pressable>
        <Pressable
          onPress={() => Linking.openURL(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(`Join ${title} on Apps By`)}`)}
          className="flex-1 flex-row items-center justify-center gap-1.5 rounded-2xl bg-surface-container-low py-2.5"
        >
          <Icon name="send" size={18} color="#0088CC" />
          <Text className="text-sm font-semibold text-on-surface">Telegram</Text>
        </Pressable>
      </View>
    </View>
  );
}

function CommandSheet({ appInstanceId, onDone }: { appInstanceId: string; onDone: () => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const examples = ["Add Ahmed", "Ahmed paid 20 for dinner", "Add a page where we vote", "Only admins can edit scores"];

  async function submit() {
    setBusy(true);
    setFeedback(null);
    try {
      const result = await apiFetch<{ type: string; question?: string }>(`/api/apps/${appInstanceId}/command`, {
        method: "POST",
        body: JSON.stringify({ text }),
      });
      if (result.type === "clarify") {
        setFeedback(result.question ?? "Not sure what you mean.");
      } else {
        onDone();
      }
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View className="gap-3">
      <View className="flex-row flex-wrap gap-1.5">
        {examples.map((ex) => (
          <Pressable key={ex} onPress={() => setText(ex)} className="rounded-full bg-surface-container px-3 py-1.5">
            <Text className="text-xs text-on-surface">&ldquo;{ex}&rdquo;</Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Describe the change you want…"
        placeholderTextColor="#908fa0"
        multiline
        numberOfLines={3}
        className="rounded-2xl bg-surface-container-low px-4 py-3 text-base text-on-surface"
        style={{ minHeight: 72, textAlignVertical: "top" }}
      />
      {feedback ? <Text className="text-sm text-tertiary">{feedback}</Text> : null}
      <Pressable onPress={submit} disabled={busy || !text.trim()} className="items-center rounded-full bg-primary py-3 disabled:opacity-50">
        {busy ? <ActivityIndicator color="#1000a9" /> : <Text className="font-semibold text-on-primary">Do it</Text>}
      </Pressable>
    </View>
  );
}
