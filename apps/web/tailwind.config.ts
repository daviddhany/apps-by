import type { Config } from "tailwindcss";

// Design tokens transplanted from the Stitch "Luminous Utility" design
// system (see /_design_ref/mobile in the repo root, gitignored — the source
// mockups this theme was built from). Dark-canvas Material-3-style tokens,
// same naming scheme as before (so component code didn't need renaming),
// values replaced. A handful of legacy short aliases (ink, canvas,
// primary.light/dark, accent, good/warn/danger) are kept pointed at the same
// palette so components written before this pass still render correctly.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
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

        primary: {
          DEFAULT: "#c0c1ff",
          container: "#8083ff",
          fixed: "#e1e0ff",
          "fixed-dim": "#c0c1ff",
          // legacy aliases used by earlier screens
          dark: "#8083ff",
          light: "#1e1f25",
        },
        "on-primary": "#1000a9",
        "on-primary-container": "#0d0096",
        "on-primary-fixed": "#07006c",
        "on-primary-fixed-variant": "#2f2ebe",
        "inverse-primary": "#494bd6",

        secondary: {
          DEFAULT: "#ddb7ff",
          container: "#6f00be",
          fixed: "#f0dbff",
          "fixed-dim": "#ddb7ff",
        },
        "on-secondary": "#490080",
        "on-secondary-container": "#d6a9ff",
        "on-secondary-fixed": "#2c0051",
        "on-secondary-fixed-variant": "#6900b3",

        tertiary: {
          DEFAULT: "#ffb2bd",
          container: "#ef5f7f",
          fixed: "#ffd9dd",
          "fixed-dim": "#ffb2bd",
        },
        "on-tertiary": "#670025",
        "on-tertiary-container": "#5a001f",
        "on-tertiary-fixed": "#400014",
        "on-tertiary-fixed-variant": "#8c1038",

        error: { DEFAULT: "#ffb4ab", container: "#93000a" },
        "on-error": "#690005",
        "on-error-container": "#ffdad6",

        // legacy short aliases (kept for components not yet ported)
        ink: "#e2e2e9",
        canvas: "#111318",
        accent: "#ef5f7f",
        good: "#7dd8a8",
        warn: "#ffb2bd",
        danger: "#ffb4ab",

        // Aurora spectrum — reserved for hero CTAs, active generation
        // states, and luminous ambient glows. Never for body text/surfaces.
        aurora: {
          indigo: "#6366F1",
          violet: "#A855F7",
          pink: "#FF6B8B",
          amber: "#FBBF24",
        },
      },
      backgroundImage: {
        aurora: "linear-gradient(135deg, #6366F1 0%, #A855F7 35%, #FF6B8B 70%, #FBBF24 100%)",
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg: "1rem",
        xl: "1.5rem",
        "2xl": "1.25rem",
        full: "9999px",
      },
      spacing: {
        "gutter-tablet": "1.25rem",
        "space-xs": "0.25rem",
        "space-sm": "0.5rem",
        "space-md": "1rem",
        "space-lg": "1.5rem",
        "space-xl": "2.5rem",
        margin: "1.25rem",
        "margin-tablet": "1.5rem",
        "margin-desktop": "2.5rem",
        gutter: "1rem",
        "gutter-desktop": "1.5rem",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      fontSize: {
        display: ["44px", { lineHeight: "52px", letterSpacing: "-0.03em", fontWeight: "800" }],
        "display-mobile": ["34px", { lineHeight: "42px", letterSpacing: "-0.025em", fontWeight: "800" }],
        "headline-lg": ["30px", { lineHeight: "38px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "headline-md": ["22px", { lineHeight: "30px", letterSpacing: "-0.01em", fontWeight: "600" }],
        "headline-sm": ["18px", { lineHeight: "26px", letterSpacing: "-0.005em", fontWeight: "600" }],
        "body-lg": ["16px", { lineHeight: "26px", letterSpacing: "0em", fontWeight: "400" }],
        "body-md": ["14px", { lineHeight: "22px", letterSpacing: "0em", fontWeight: "400" }],
        "body-sm": ["13px", { lineHeight: "18px", letterSpacing: "0.005em", fontWeight: "400" }],
        "label-lg": ["14px", { lineHeight: "20px", letterSpacing: "0.01em", fontWeight: "600" }],
        "label-md": ["12px", { lineHeight: "16px", letterSpacing: "0.02em", fontWeight: "600" }],
        "label-sm": ["11px", { lineHeight: "14px", letterSpacing: "0.04em", fontWeight: "700" }],
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.2), 0 8px 24px rgba(0,0,0,0.35)",
        elevated: "0 20px 40px -15px rgba(0,0,0,0.7)",
        floating: "0 12px 32px rgba(0,0,0,0.4)",
        glow: "0 0 30px rgba(128,131,255,0.18)",
      },
    },
  },
  plugins: [],
};

export default config;
