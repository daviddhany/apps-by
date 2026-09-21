// Same design tokens as apps/web/tailwind.config.ts (both derive from the
// Stitch "Instant Synthesis" design system) — kept as a literal copy rather
// than a cross-package import because Tailwind/NativeWind's config loader
// runs outside Metro's bundling pipeline, so importing the untranspiled
// @needly/core TS source here isn't reliable. If the web palette changes,
// mirror the change here too.
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.tsx", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        "surface-bright": "#f9f9ff",
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

        primary: {
          DEFAULT: "#0037b0",
          container: "#1d4ed8",
          fixed: "#dce1ff",
          "fixed-dim": "#b7c4ff",
        },
        "on-primary": "#ffffff",
        "on-primary-container": "#cad3ff",
        "on-primary-fixed": "#001551",

        secondary: {
          DEFAULT: "#006a61",
          container: "#86f2e4",
          fixed: "#89f5e7",
          "fixed-dim": "#6bd8cb",
        },
        "on-secondary": "#ffffff",
        "on-secondary-container": "#006f66",
        "on-secondary-fixed-variant": "#005049",

        tertiary: {
          DEFAULT: "#7c2900",
          container: "#a33900",
          fixed: "#ffdbce",
        },
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#ffc9b6",
        "on-tertiary-fixed-variant": "#7f2b00",

        error: { DEFAULT: "#ba1a1a", container: "#ffdad6" },
        "on-error": "#ffffff",
        "on-error-container": "#93000a",
      },
      borderRadius: {
        DEFAULT: "16px",
        lg: "32px",
        xl: "48px",
        "2xl": "22px",
        full: "9999px",
      },
      fontFamily: {
        sans: ["System"],
      },
    },
  },
  plugins: [],
};
