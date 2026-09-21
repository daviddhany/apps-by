import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { View } from "react-native";
import { vars } from "nativewind";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { darkColors, lightColors, darkVars, lightVars } from "./tokens";
import type { ColorToken } from "./tokens";

export type ThemeName = "dark" | "light";

interface ThemeState {
  theme: ThemeName;
  colors: Record<ColorToken, string>;
  toggleTheme: () => void;
}

const STORAGE_KEY = "@needly/theme";

const ThemeContext = createContext<ThemeState | null>(null);

// Same default as the app has always had (see App.tsx's previous hardcoded
// <StatusBar style="dark" />) — dark until a stored preference says
// otherwise, so this migration doesn't flip anyone's theme on next launch.
const DEFAULT_THEME: ThemeName = "dark";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeName>(DEFAULT_THEME);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored === "dark" || stored === "light") setTheme(stored);
      })
      .catch(() => {
        // No persisted preference (or storage unavailable) — keep the default.
      });
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next: ThemeName = prev === "dark" ? "light" : "dark";
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
      return next;
    });
  };

  const colors = theme === "dark" ? darkColors : lightColors;
  const themeVars = useMemo(() => vars(theme === "dark" ? darkVars : lightVars), [theme]);

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme }}>
      {/* Sets the --color-x CSS custom properties for this whole subtree, so
       * every className-driven color (text-primary, bg-surface, …) reacts to
       * the theme — NativeWind v4's `vars()` API, the mobile analog of
       * web's `:root[data-theme]` CSS variables (see globals.css). */}
      <View style={[{ flex: 1 }, themeVars]}>{children}</View>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

/** Convenience hook for the native color props (`Icon`, `ActivityIndicator`,
 * `placeholderTextColor`, …) that need an actual value rather than a
 * className — see ThemeContext.tsx / tokens.ts header for why. */
export function useThemeColors() {
  return useTheme().colors;
}
