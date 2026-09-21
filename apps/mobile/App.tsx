import "./global.css";
import { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "./src/api/AuthContext";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { ThemeProvider, useTheme } from "./src/theme/ThemeContext";
import { hydrateServerUrlOverride } from "./src/api/serverUrlStore";

function ThemedStatusBar() {
  const { theme } = useTheme();
  // Light icons read on this app's dark theme, dark icons on its light
  // theme — the opposite of the old hardcoded "dark" (which put dark icons
  // on the all-dark background, i.e. invisible).
  return <StatusBar style={theme === "dark" ? "light" : "dark"} />;
}

export default function App() {
  // A manually-set server address lives in SecureStore, which is async —
  // every API call needs it available synchronously (getApiBaseUrl in
  // src/api/config.ts), so it's loaded once into memory before anything
  // that could make a network request mounts.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    hydrateServerUrlOverride().finally(() => setReady(true));
  }, []);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <NavigationContainer>
            <ThemedStatusBar />
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
