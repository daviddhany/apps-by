// Theme source of truth for mobile — mirrors the CSS custom properties web
// defines in apps/web/src/app/globals.css (`:root` = dark/default,
// `:root[data-theme="light"]` = light override) and the token names web's
// tailwind.config.ts wraps in `rgb(var(--color-x) / <alpha-value>)`.
//
// Two things live here:
//  1. `darkColors` / `lightColors` — plain hex lookups for the native color
//     props (`<Icon color>`, `<ActivityIndicator color>`,
//     `placeholderTextColor`, …) that can't be styled through a CSS class,
//     because they're passed straight to a native view, not resolved by
//     react-native-css-interop.
//  2. `darkVars` / `lightVars` — the same values as NativeWind `vars()`-ready
//     "R G B" strings (space-separated 0-255 channels, matching web's
//     globals.css convention so `bg-primary/50`-style opacity modifiers keep
//     working), for the className-driven side. See ThemeContext.tsx, which
//     applies these at the app root via `vars()`.
//
// If the web palette changes, mirror the change here too (see the same note
// in tailwind.config.js).

export type ColorToken =
  | "surface-bright"
  | "surface"
  | "surface-dim"
  | "surface-container-lowest"
  | "surface-container-low"
  | "surface-container"
  | "surface-container-high"
  | "surface-container-highest"
  | "surface-variant"
  | "on-surface"
  | "on-surface-variant"
  | "inverse-surface"
  | "inverse-on-surface"
  | "outline"
  | "outline-variant"
  | "background"
  | "on-background"
  | "primary"
  | "primary-container"
  | "primary-fixed"
  | "primary-fixed-dim"
  | "primary-dark-alias"
  | "primary-light-alias"
  | "on-primary"
  | "on-primary-container"
  | "on-primary-fixed"
  | "on-primary-fixed-variant"
  | "inverse-primary"
  | "secondary"
  | "secondary-container"
  | "secondary-fixed"
  | "secondary-fixed-dim"
  | "on-secondary"
  | "on-secondary-container"
  | "on-secondary-fixed"
  | "on-secondary-fixed-variant"
  | "tertiary"
  | "tertiary-container"
  | "tertiary-fixed"
  | "tertiary-fixed-dim"
  | "on-tertiary"
  | "on-tertiary-container"
  | "on-tertiary-fixed"
  | "on-tertiary-fixed-variant"
  | "error"
  | "error-container"
  | "on-error"
  | "on-error-container"
  | "ink"
  | "canvas"
  | "accent"
  | "good"
  | "warn"
  | "danger";

type ColorMap = Record<ColorToken, string>;

// Dark — the app's original/default theme (see tailwind.config.js header).
export const darkColors: ColorMap = {
  "surface-bright": "#37393f",
  surface: "#111318",
  "surface-dim": "#111318",
  "surface-container-lowest": "#0c0e13",
  "surface-container-low": "#1a1b21",
  "surface-container": "#1e1f25",
  "surface-container-high": "#282a2f",
  "surface-container-highest": "#33353a",
  "surface-variant": "#33353a",
  "on-surface": "#e2e2e9",
  "on-surface-variant": "#c7c4d7",
  "inverse-surface": "#e2e2e9",
  "inverse-on-surface": "#2e3036",
  outline: "#908fa0",
  "outline-variant": "#464554",
  background: "#111318",
  "on-background": "#e2e2e9",

  primary: "#c0c1ff",
  "primary-container": "#8083ff",
  "primary-fixed": "#e1e0ff",
  "primary-fixed-dim": "#c0c1ff",
  "primary-dark-alias": "#8083ff",
  "primary-light-alias": "#1e1f25",
  "on-primary": "#1000a9",
  "on-primary-container": "#0d0096",
  "on-primary-fixed": "#07006c",
  "on-primary-fixed-variant": "#2f2ebe",
  "inverse-primary": "#494bd6",

  secondary: "#ddb7ff",
  "secondary-container": "#6f00be",
  "secondary-fixed": "#f0dbff",
  "secondary-fixed-dim": "#ddb7ff",
  "on-secondary": "#490080",
  "on-secondary-container": "#d6a9ff",
  "on-secondary-fixed": "#2c0051",
  "on-secondary-fixed-variant": "#6900b3",

  tertiary: "#ffb2bd",
  "tertiary-container": "#ef5f7f",
  "tertiary-fixed": "#ffd9dd",
  "tertiary-fixed-dim": "#ffb2bd",
  "on-tertiary": "#670025",
  "on-tertiary-container": "#5a001f",
  "on-tertiary-fixed": "#400014",
  "on-tertiary-fixed-variant": "#8c1038",

  error: "#ffb4ab",
  "error-container": "#93000a",
  "on-error": "#690005",
  "on-error-container": "#ffdad6",

  ink: "#e2e2e9",
  canvas: "#111318",
  accent: "#ef5f7f",
  good: "#7dd8a8",
  warn: "#ffb2bd",
  danger: "#ffb4ab",
};

// Light — the original Material-3 palette this app shipped with before the
// dark "Luminous Utility" migration (recoverable at
// `git show 344c722:apps/mobile/tailwind.config.js`), now web's light theme
// too, so both platforms match exactly in both themes.
export const lightColors: ColorMap = {
  "surface-bright": "#e7eeff",
  surface: "#f9f9ff",
  "surface-dim": "#cfdaf2",
  "surface-container-lowest": "#ffffff",
  "surface-container-low": "#f0f3ff",
  "surface-container": "#e7eeff",
  "surface-container-high": "#dee8ff",
  "surface-container-highest": "#d8e3fb",
  "surface-variant": "#d8e3fb",
  "on-surface": "#111c2d",
  "on-surface-variant": "#434655",
  "inverse-surface": "#263143",
  "inverse-on-surface": "#ecf1ff",
  outline: "#747686",
  "outline-variant": "#c4c5d7",
  background: "#f9f9ff",
  "on-background": "#111c2d",

  primary: "#0037b0",
  "primary-container": "#1d4ed8",
  "primary-fixed": "#dce1ff",
  "primary-fixed-dim": "#b7c4ff",
  "primary-dark-alias": "#1d4ed8",
  "primary-light-alias": "#dce1ff",
  "on-primary": "#ffffff",
  "on-primary-container": "#cad3ff",
  "on-primary-fixed": "#001551",
  "on-primary-fixed-variant": "#1d4ed8",
  "inverse-primary": "#b7c4ff",

  secondary: "#006a61",
  "secondary-container": "#86f2e4",
  "secondary-fixed": "#89f5e7",
  "secondary-fixed-dim": "#6bd8cb",
  "on-secondary": "#ffffff",
  "on-secondary-container": "#006f66",
  "on-secondary-fixed": "#003731",
  "on-secondary-fixed-variant": "#005049",

  tertiary: "#7c2900",
  "tertiary-container": "#a33900",
  "tertiary-fixed": "#ffdbce",
  "tertiary-fixed-dim": "#ffb59b",
  "on-tertiary": "#ffffff",
  "on-tertiary-container": "#ffc9b6",
  "on-tertiary-fixed": "#2c0d00",
  "on-tertiary-fixed-variant": "#7f2b00",

  error: "#ba1a1a",
  "error-container": "#ffdad6",
  "on-error": "#ffffff",
  "on-error-container": "#93000a",

  ink: "#111c2d",
  canvas: "#f9f9ff",
  accent: "#a33900",
  good: "#146c43",
  warn: "#7c2900",
  danger: "#ba1a1a",
};

function hexToRgbTriple(hex: string): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

/** Builds a NativeWind `vars()`-ready map ({ "--color-x": "R G B" }) from a
 * ColorMap, so it can be spread straight into `vars(...)`. */
function toVars(colors: ColorMap): Record<string, string> {
  const out: Record<string, string> = {};
  for (const token of Object.keys(colors) as ColorToken[]) {
    out[`--color-${token}`] = hexToRgbTriple(colors[token]);
  }
  return out;
}

export const darkVars = toVars(darkColors);
export const lightVars = toVars(lightColors);
