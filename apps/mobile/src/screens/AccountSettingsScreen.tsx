import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { apiFetch } from "../api/client";
import { AppHeader } from "../components/AppHeader";
import { useAuth } from "../api/AuthContext";

export function AccountSettingsScreen() {
  const { user } = useAuth();
  const isGuest = !user?.email;

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(null);
    setSuccess(false);
    if (newPassword !== confirmPassword) {
      setError("New passwords don't match");
      return;
    }
    setLoading(true);
    try {
      await apiFetch("/api/auth/change-password", { method: "POST", body: JSON.stringify({ currentPassword, newPassword }) });
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't change password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-surface">
      <AppHeader title="Account settings" showBack initial={user?.name ?? "N"} />
      <View className="flex-1 gap-4 px-4 pt-4">
        <View className="rounded-2xl bg-surface-container-lowest p-5">
          <Text className="text-xs font-semibold text-on-surface-variant">Name</Text>
          <Text className="mt-0.5 text-base text-on-surface">{user?.name}</Text>
          {user?.email ? (
            <>
              <Text className="mt-3 text-xs font-semibold text-on-surface-variant">Email</Text>
              <Text className="mt-0.5 text-base text-on-surface">{user.email}</Text>
            </>
          ) : null}
        </View>

        {isGuest ? (
          <View className="rounded-2xl bg-surface-container-lowest p-5">
            <Text className="text-sm text-on-surface-variant">This is a guest account and doesn&rsquo;t have a password to change.</Text>
          </View>
        ) : (
          <View className="gap-3 rounded-2xl bg-surface-container-lowest p-5">
            <Text className="text-base font-bold text-on-surface">Change password</Text>
            <TextInput
              secureTextEntry
              placeholder="Current password"
              placeholderTextColor="#908fa0"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              className="rounded-2xl bg-surface-container-low px-4 py-3 text-base text-on-surface"
            />
            <TextInput
              secureTextEntry
              placeholder="New password (min 8 characters)"
              placeholderTextColor="#908fa0"
              value={newPassword}
              onChangeText={setNewPassword}
              className="rounded-2xl bg-surface-container-low px-4 py-3 text-base text-on-surface"
            />
            <TextInput
              secureTextEntry
              placeholder="Confirm new password"
              placeholderTextColor="#908fa0"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              className="rounded-2xl bg-surface-container-low px-4 py-3 text-base text-on-surface"
            />
            {error ? <Text className="text-sm text-error">{error}</Text> : null}
            {success ? <Text className="text-sm text-secondary">Password updated.</Text> : null}
            <Pressable onPress={submit} disabled={loading} className="items-center rounded-full bg-primary py-3 disabled:opacity-50">
              {loading ? <ActivityIndicator color="#1000a9" /> : <Text className="font-semibold text-on-primary">Update password</Text>}
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}
