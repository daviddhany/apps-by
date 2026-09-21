import { useState } from "react";
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { useAuth } from "../api/AuthContext";

export function RegisterScreen({ navigation }: { navigation: { navigate: (screen: string) => void } }) {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      await register(name, email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-surface">
      <View className="flex-1 justify-center px-6 gap-6">
        <View className="items-center">
          <Text className="text-2xl font-bold text-on-surface">Create your account</Text>
          <Text className="mt-1 text-base text-on-surface-variant">Takes about 20 seconds.</Text>
        </View>

        <View className="gap-3 rounded-2xl bg-surface-container-lowest p-5 shadow-sm">
          <TextInput
            placeholder="Name"
            placeholderTextColor="#94A3B8"
            value={name}
            onChangeText={setName}
            className="rounded-2xl bg-surface-container-low px-4 py-3 text-base text-on-surface"
          />
          <TextInput
            placeholder="Email"
            placeholderTextColor="#94A3B8"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            className="rounded-2xl bg-surface-container-low px-4 py-3 text-base text-on-surface"
          />
          <TextInput
            placeholder="Password (min 8 characters)"
            placeholderTextColor="#94A3B8"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            className="rounded-2xl bg-surface-container-low px-4 py-3 text-base text-on-surface"
          />
          {error ? <Text className="text-sm text-error">{error}</Text> : null}
          <Pressable
            onPress={submit}
            disabled={loading || !name || !email || password.length < 8}
            className="mt-1 items-center rounded-full bg-primary py-3 active:opacity-80 disabled:opacity-50"
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-base font-semibold text-on-primary">Create account</Text>}
          </Pressable>
        </View>

        <View className="flex-row justify-center gap-1">
          <Text className="text-sm text-on-surface-variant">Already have an account?</Text>
          <Pressable onPress={() => navigation.navigate("Login")}>
            <Text className="text-sm font-semibold text-primary">Sign in</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
