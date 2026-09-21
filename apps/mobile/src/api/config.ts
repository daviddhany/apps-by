import Constants from "expo-constants";

const API_PORT = 3000;

/**
 * `localhost` only reaches the Next.js dev server from a web preview or an
 * iOS simulator on the same machine — a physical phone running Expo Go needs
 * the machine's LAN IP instead. Expo Go already knows that IP: it's baked
 * into `Constants.expoConfig.hostUri` (e.g. "192.168.1.5:8081", the address
 * the phone used to load the JS bundle from Metro), so we reuse its host and
 * swap in the Next.js server's port. This is what makes a physical device
 * work out of the box without hand-editing an IP into app.json.
 */
function lanHostFromExpo(): string | undefined {
  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri?.split(":")[0];
  if (!host || host === "localhost" || host === "127.0.0.1") return undefined;
  return `http://${host}:${API_PORT}`;
}

/**
 * Resolves the backend base URL, in priority order:
 * 1. EXPO_PUBLIC_API_BASE_URL (Expo inlines EXPO_PUBLIC_* vars at build time)
 * 2. `extra.apiBaseUrl` in app.json, when it's been edited to something other
 *    than the localhost default
 * 3. Metro's own LAN host, auto-detected from Expo Go's dev manifest
 * 4. localhost, for web preview / same-machine simulators
 */
export function getApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (fromEnv) return fromEnv;

  const fromConfig = Constants.expoConfig?.extra?.apiBaseUrl as string | undefined;
  if (fromConfig && !fromConfig.includes("localhost") && !fromConfig.includes("127.0.0.1")) return fromConfig;

  return lanHostFromExpo() ?? fromConfig ?? "http://localhost:3000";
}
