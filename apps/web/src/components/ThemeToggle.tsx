"use client";

import { useTheme } from "./ThemeProvider";
import { Icon } from "./Icon";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className={`tap flex h-9 w-9 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition-colors hover:bg-surface-container-high active:scale-95 ${className}`}
    >
      <Icon name={theme === "dark" ? "light_mode" : "dark_mode"} size={18} />
    </button>
  );
}
