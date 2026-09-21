"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";
const STORAGE_KEY = "needly-theme";

const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void }>({
  theme: "dark",
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

/** Reads the theme the inline script (see layout.tsx) already applied to
 * <html data-theme> before first paint, so this never causes a flash —
 * it just picks up what's already there and keeps <html> in sync going
 * forward. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const current = (document.documentElement.dataset.theme as Theme) || "dark";
    setTheme(current);
  }, []);

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute("content", theme === "light" ? "#f9f9ff" : "#111318");
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Private browsing / storage disabled — theme just won't persist.
      }
      return next;
    });
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

/** Sets <html data-theme> from localStorage before hydration, so there's
 * no flash of the wrong theme. Rendered as an inline <script> in the root
 * layout's <head> — must stay a plain string, not use any imports. */
export const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('${STORAGE_KEY}');
    if (stored === 'light' || stored === 'dark') {
      document.documentElement.dataset.theme = stored;
    }
  } catch (e) {}
})();
`;
