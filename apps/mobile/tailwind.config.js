// Same design tokens as apps/web/tailwind.config.ts (both derive from the
// Stitch "Luminous Utility" design system) — kept as a literal copy rather
// than a cross-package import because Tailwind/NativeWind's config loader
// runs outside Metro's bundling pipeline, so importing the untranspiled
// @needly/core TS source here isn't reliable. If the web palette changes,
// mirror the change here too.
//
// Every color resolves through a CSS custom property (defined for both
// themes in src/theme/tokens.ts and applied at the app root via NativeWind's
// `vars()` — see src/theme/ThemeContext.tsx) instead of a literal hex value,
// so toggling the theme re-themes the whole app without a reload. Each
// variable stores "R G B" channel values so Tailwind's `/opacity` modifier
// (e.g. `bg-primary/50`) keeps working — mirrors
// https://tailwindcss.com/docs/customizing-colors#using-css-variables
function themed(name) {
  return `rgb(var(--color-${name}) / <alpha-value>)`;
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.tsx", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        "surface-bright": themed("surface-bright"),
        surface: themed("surface"),
        "surface-dim": themed("surface-dim"),
        "surface-container-lowest": themed("surface-container-lowest"),
        "surface-container-low": themed("surface-container-low"),
        "surface-container": themed("surface-container"),
        "surface-container-high": themed("surface-container-high"),
        "surface-container-highest": themed("surface-container-highest"),
        "surface-variant": themed("surface-variant"),
        "on-surface": themed("on-surface"),
        "on-surface-variant": themed("on-surface-variant"),
        "inverse-surface": themed("inverse-surface"),
        "inverse-on-surface": themed("inverse-on-surface"),
        outline: themed("outline"),
        "outline-variant": themed("outline-variant"),
        background: themed("background"),
        "on-background": themed("on-background"),

        primary: {
          DEFAULT: themed("primary"),
          container: themed("primary-container"),
          fixed: themed("primary-fixed"),
          "fixed-dim": themed("primary-fixed-dim"),
          // legacy aliases used by earlier screens
          dark: themed("primary-dark-alias"),
          light: themed("primary-light-alias"),
        },
        "on-primary": themed("on-primary"),
        "on-primary-container": themed("on-primary-container"),
        "on-primary-fixed": themed("on-primary-fixed"),
        "on-primary-fixed-variant": themed("on-primary-fixed-variant"),
        "inverse-primary": themed("inverse-primary"),

        secondary: {
          DEFAULT: themed("secondary"),
          container: themed("secondary-container"),
          fixed: themed("secondary-fixed"),
          "fixed-dim": themed("secondary-fixed-dim"),
        },
        "on-secondary": themed("on-secondary"),
        "on-secondary-container": themed("on-secondary-container"),
        "on-secondary-fixed": themed("on-secondary-fixed"),
        "on-secondary-fixed-variant": themed("on-secondary-fixed-variant"),

        tertiary: {
          DEFAULT: themed("tertiary"),
          container: themed("tertiary-container"),
          fixed: themed("tertiary-fixed"),
          "fixed-dim": themed("tertiary-fixed-dim"),
        },
        "on-tertiary": themed("on-tertiary"),
        "on-tertiary-container": themed("on-tertiary-container"),
        "on-tertiary-fixed": themed("on-tertiary-fixed"),
        "on-tertiary-fixed-variant": themed("on-tertiary-fixed-variant"),

        error: { DEFAULT: themed("error"), container: themed("error-container") },
        "on-error": themed("on-error"),
        "on-error-container": themed("on-error-container"),

        // legacy short aliases (kept for components not yet ported)
        ink: themed("ink"),
        canvas: themed("canvas"),
        accent: themed("accent"),
        good: themed("good"),
        warn: themed("warn"),
        danger: themed("danger"),

        // Aurora spectrum — reserved for hero CTAs, active generation
        // states, and luminous ambient glows. Never for body text/surfaces.
        // Fixed across both themes — it's a brand gradient, not a surface.
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
        sans: ["System"],
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
