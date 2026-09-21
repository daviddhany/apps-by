import Constants from "expo-constants";

/**
 * Resolves the backend base URL. `localhost` only reaches the Next.js dev
 * server from a web preview or an iOS simulator on the same machine — a
 * physical phone running Expo Go needs the machine's LAN IP instead. Set
 * EXPO_PUBLIC_API_BASE_URL (Expo inlines EXPO_PUBLIC_* vars at build time) or
 * edit `extra.apiBaseUrl` in app.json.
 */
export function getApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (fromEnv) return fromEnv;
  const fromConfig = Constants.expoConfig?.extra?.apiBaseUrl as string | undefined;
  return fromConfig ?? "http://localhost:3000";
}
