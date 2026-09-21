import * as SecureStore from "expo-secure-store";

const KEY = "needly_server_url_override";
const isWeb = typeof document !== "undefined";

// getApiBaseUrl() (config.ts) is called synchronously from many places
// (including inline in JSX, e.g. building an <Image> uri), but SecureStore
// is async — so this module hydrates once at app startup (see App.tsx) into
// this in-memory variable, which getApiBaseUrl() then reads synchronously.
// `undefined` means "not hydrated yet", distinct from `null` ("hydrated,
// no override set").
let cached: string | null | undefined;

export async function hydrateServerUrlOverride(): Promise<void> {
  cached = isWeb ? (typeof localStorage !== "undefined" ? localStorage.getItem(KEY) : null) : await SecureStore.getItemAsync(KEY);
}

export function getServerUrlOverride(): string | null {
  return cached ?? null;
}

export async function setServerUrlOverride(url: string | null): Promise<void> {
  cached = url;
  if (isWeb) {
    if (typeof localStorage === "undefined") return;
    if (url) localStorage.setItem(KEY, url);
    else localStorage.removeItem(KEY);
    return;
  }
  if (url) await SecureStore.setItemAsync(KEY, url);
  else await SecureStore.deleteItemAsync(KEY);
}
