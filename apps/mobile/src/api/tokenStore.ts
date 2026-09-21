import * as SecureStore from "expo-secure-store";

const KEY = "needly_session_token";

// SecureStore isn't available on Expo's web target (react-native-web) — fall
// back to plain localStorage there. Native builds (Expo Go / a real device
// build) always use SecureStore's encrypted keychain/keystore.
const isWeb = typeof document !== "undefined";

export async function getToken(): Promise<string | null> {
  if (isWeb) return typeof localStorage !== "undefined" ? localStorage.getItem(KEY) : null;
  return SecureStore.getItemAsync(KEY);
}

export async function setToken(token: string): Promise<void> {
  if (isWeb) {
    localStorage.setItem(KEY, token);
    return;
  }
  await SecureStore.setItemAsync(KEY, token);
}

export async function clearToken(): Promise<void> {
  if (isWeb) {
    localStorage.removeItem(KEY);
    return;
  }
  await SecureStore.deleteItemAsync(KEY);
}
