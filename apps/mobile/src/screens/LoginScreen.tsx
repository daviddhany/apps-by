import { useState } from "react";
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator, Image } from "react-native";
import { useAuth } from "../api/AuthContext";

export function LoginScreen({ navigation }: { navigation: { navigate: (screen: string) => void } }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-surface">
      <View className="flex-1 justify-center px-6 gap-6">
        <View className="items-center">
          <Image source={require("../../assets/logo.png")} className="mb-3 h-16 w-16" resizeMode="contain" />
          <Text className="text-3xl font-extrabold tracking-tight text-on-surface">Needly</Text>
          <Text className="mt-1 text-base text-on-surface-variant">What do you need?</Text>
        </View>

        <View className="gap-3 rounded-2xl bg-surface-container-lowest p-5 shadow-sm">
          <TextInput
            placeholder="Email"
            placeholderTextColor="#908fa0"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            className="rounded-2xl bg-surface-container-low px-4 py-3 text-base text-on-surface"
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor="#908fa0"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            className="rounded-2xl bg-surface-container-low px-4 py-3 text-base text-on-surface"
          />
          {error ? <Text className="text-sm text-error">{error}</Text> : null}
          <Pressable
            onPress={submit}
            disabled={loading || !email || !password}
            className="mt-1 items-center rounded-full bg-primary py-3 active:opacity-80 disabled:opacity-50"
          >
            {loading ? <ActivityIndicator color="#1000a9" /> : <Text className="text-base font-semibold text-on-primary">Sign in</Text>}
          </Pressable>
        </View>

        <View className="flex-row justify-center gap-1">
          <Text className="text-sm text-on-surface-variant">New here?</Text>
          <Pressable onPress={() => navigation.navigate("Register")}>
            <Text className="text-sm font-semibold text-primary">Create an account</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
