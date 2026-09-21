---
name: Instant Synthesis
colors:
  surface: '#f9f9ff'
  surface-dim: '#cfdaf2'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee8ff'
  surface-container-highest: '#d8e3fb'
  on-surface: '#111c2d'
  on-surface-variant: '#434655'
  inverse-surface: '#263143'
  inverse-on-surface: '#ecf1ff'
  outline: '#747686'
  outline-variant: '#c4c5d7'
  surface-tint: '#2151da'
  primary: '#0037b0'
  on-primary: '#ffffff'
  primary-container: '#1d4ed8'
  on-primary-container: '#cad3ff'
  inverse-primary: '#b7c4ff'
  secondary: '#006a61'
  on-secondary: '#ffffff'
  secondary-container: '#86f2e4'
  on-secondary-container: '#006f66'
  tertiary: '#7c2900'
  on-tertiary: '#ffffff'
  tertiary-container: '#a33900'
  on-tertiary-container: '#ffc9b6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b7c4ff'
  on-primary-fixed: '#001551'
  on-primary-fixed-variant: '#0039b5'
  secondary-fixed: '#89f5e7'
  secondary-fixed-dim: '#6bd8cb'
  on-secondary-fixed: '#00201d'
  on-secondary-fixed-variant: '#005049'
  tertiary-fixed: '#ffdbce'
  tertiary-fixed-dim: '#ffb599'
  on-tertiary-fixed: '#370e00'
  on-tertiary-fixed-variant: '#7f2b00'
  background: '#f9f9ff'
  on-background: '#111c2d'
  surface-variant: '#d8e3fb'
typography:
  display:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 48px
    letterSpacing: -0.03em
  display-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 38px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 17px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0em
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.005em
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.03em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-tablet: 1.25rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

The design system embodies a consumer-first generation engine: fluid, prompt, and tactile. Instead of resembling technical IDEs, terminal shells, or enterprise workflow builders, it feels like an ambient native operating layer—calm, confident, and delightfully intuitive. The core emotional promise is pure creative agency: natural speech collapsing the distance between an idea and an interactive, shareable software artifact.

The visual direction merges **Minimalist Modernism** with **Tactile Glassmorphism**:
- **Pristine surfaces:** Warm, paper-clean backgrounds layered with luminous white content cards.
- **Electric intentionality:** Punchy cobalt and indigo active anchors replace tired magenta-purple "AI gradients." 
- **Physical tangibility:** Micro-diffused ambient drop shadows, hairline border definitions, and generous squircle corner profiles make generated mini-apps feel like pocket instruments rather than cold web pages.
- **Transparent fluidity:** Translucent bottom sheets, floating promptbars, and subtle backdrop blurs frame dynamic UI generation directly in view.

## Colors

The color palette establishes an uncompromising light-first environment that prioritizes clarity, crisp contrast, and domain specificity.

### Base Hierarchy
- **Canvas / Background:** `#FBFBFA` (soft natural parchment tone; mitigates ocular fatigue and elevates white cards).
- **Surface Elevation 1 (Cards & Modular Shells):** `#FFFFFF` (pure stark white).
- **Surface Elevation 2 (Elevated Sheets & Floating Nav):** `rgba(255, 255, 255, 0.85)` with saturated backdrop blur.
- **Hairline Borders:** `rgba(15, 23, 42, 0.06)` (subtle structural separation).

### Brand Accent
- **Primary (Electric Cobalt):** `#1D4ED8` (base), `#2563EB` (hover/interactive), `#DBEAFE` (tinted wash). This provides focused, athletic authority without generic AI clichés.

### Domain-Specific Category Accents
Generated apps receive contextual accents to intuitively brand their specific utilities:
- **Travel / Itineraries:** Sky Blue (`#0284C7`, background tint `rgba(2, 132, 199, 0.08)`)
- **Finances / Expense Splitting:** Teal Emerald (`#0D9488`, background tint `rgba(13, 148, 136, 0.08)`)
- **Tournaments / Sports / Bracket:** Grass Green (`#16A34A`, background tint `rgba(22, 163, 74, 0.08)`)
- **Voting / Polls / Social:** Warm Amber Coral (`#EA580C`, background tint `rgba(234, 88, 12, 0.08)`)
- **Challenges / Habits / Streaks:** Flame Coral (`#F43F5E`, background tint `rgba(244, 63, 94, 0.08)`)

### Text & Contrast Rules
- **Text Primary:** `#0F172A` (deep slate-black, minimum 11:1 contrast on canvas).
- **Text Secondary:** `#475569` (balanced midtone slate).
- **Text Muted:** `#94A3B8` (metadata, timestamps, placeholder copy).

## Typography

Typography centers on **Plus Jakarta Sans** for its contemporary geometric construction, generous x-height, and friendly, human-centric terminals. It balances the precision of an operating system with the warmth of consumer editorial design.

### Typographic Rules
- **No Unreadable Scales:** The absolute minimum font size permitted is 11px (`label-sm`), strictly reserved for uppercase micro-badges and indicators. Interactive text never falls below 14px.
- **Tightened Display Tracking:** Negative letter-spacing on display and headline tiers removes visual slack, creating cohesive, punchy lockups.
- **Numeric Clarity:** In data-dense mini-apps (e.g., split calculations, tournament scores, habit counters), enable tabular figures (`font-variant-numeric: tabular-nums`) to prevent horizontal jitter during interactive updates.

## Layout & Spacing

The layout system is mobile-first, prioritizing tactile, one-handed thumb ergonomics while gracefully expanding into centered canvas columns on desktop viewports.

### Breakpoints & Canvas Architecture
- **Mobile (<640px):** Single-column layout with 16px lateral margins. Floating interaction shells (prompts, quick actions) pin to the bottom edge, clearing system gestures with safe-area padding.
- **Tablet (640px–1024px):** Dual-column dynamic reflow with 20px margins. Generated mini-apps adapt to a card grid or side-by-side prompt/preview pane.
- **Desktop (>1024px):** Fixed max-width viewport constraints for mini-apps (max 480px for phone mockup previews; max 840px for full split-screen workbenches), centering the app within a serene, distraction-free stage.

### Rhythm & Alignment
Spacing follows an exact 4px/8px incremental rhythm. Interior padding for interactive containers adheres to a minimum 16px (`space-md`) threshold, providing breathing room so mini-apps never feel like compressed desktop spreadsheets.

## Elevation & Depth

Visual hierarchy leverages crisp surface separation, diffused ambient shadow envelopes, and glass-like translucent overlays rather than heavy black cast shadows.

### Elevation Hierarchy
1. **Level 0 (Canvas Base):** Flat `#FBFBFA`. All interactive components stage on this surface.
2. **Level 1 (Generated Cards & Panels):** Pure `#FFFFFF` background, a 1px border using `rgba(15, 23, 42, 0.06)`, and an ambient soft shadow:
   `0 1px 2px rgba(0, 0, 0, 0.03), 0 4px 16px rgba(15, 23, 42, 0.04)`.
3. **Level 2 (Active Interactive Cards & Popovers):** Pure `#FFFFFF`, border `rgba(15, 23, 42, 0.08)`, elevated shadow:
   `0 4px 6px -1px rgba(0, 0, 0, 0.03), 0 12px 28px -4px rgba(15, 23, 42, 0.08)`.
4. **Level 3 (Floating Bars & Sheets):** Semi-transparent white (`rgba(255, 255, 255, 0.85)`), backdrop-filter blur of `16px`, saturation boost `180%`, subtle top inset highlight `inset 0 1px 0 rgba(255, 255, 255, 0.8)`, and floating shadow:
   `0 8px 32px rgba(15, 23, 42, 0.12)`.

### Ambient Glows
During state changes or active generation, surfaces gain subtle, soft-glowing outlines matching their domain color (e.g., `0 0 0 2px rgba(37, 99, 235, 0.2)`), avoiding harsh neon halos.

## Shapes

The design system embraces an organic, consumer-friendly curvature profile:
- **Card Containers:** Custom 20px to 24px squircle border-radii (`rounded-2xl` / `rounded-3xl`), establishing a handheld, pocket-device quality.
- **Pill Shells (Buttons, Chips, Searchbars):** Full circular curvature (`9999px`), ensuring tactile touch targets.
- **Internal Form Fields:** 14px to 16px radii, providing comfortable nesting inside 20px–24px parent cards without geometric corner collisions.

## Components

### 1. Buttons
- **Primary Pill:** Full pill radius (`9999px`), solid Electric Cobalt (`#1D4ED8`), text white (`#FFFFFF`), `font-weight: 600`, horizontal padding 24px, height 48px. Subtle tap compression (`scale(0.98)`).
- **Secondary Pill:** Pure white surface, 1px border `rgba(15, 23, 42, 0.1)`, text Slate-900 (`#0F172A`), active hover fill `rgba(15, 23, 42, 0.03)`.
- **Ghost / Icon Pill:** Circular 40x40px or 48x48px pill; transparent surface, hover fill `rgba(15, 23, 42, 0.05)`.

### 2. Cards & Modular Blocks
- Container corner radius: 22px.
- Background: `#FFFFFF`.
- Border: Hairline 1px `rgba(15, 23, 42, 0.06)`.
- Padding: 20px mobile, 24px desktop.
- Header lockups within cards combine an 8px domain color dot or jewel icon, a 16px semi-bold title, and a top-right contextual pill action.

### 3. Chips & Domain Badges
- Height: 32px.
- Radius: `9999px`.
- Inactive: Background `rgba(15, 23, 42, 0.04)`, text `#475569`.
- Active / Category Filter: Background set to domain tint (e.g., Sky Blue `rgba(2, 132, 199, 0.1)`), text set to domain solid (`#0284C7`), border 1px `rgba(2, 132, 199, 0.2)`.

### 4. Natural Language Input Bar (Floating Creation Bar)
- Persistent floating pill anchored above safe area (height 56px).
- Translucent frosted shell (`rgba(255, 255, 255, 0.9)`, 20px blur, shadow Level 3).
- Left accessory: Sparkle/gem synthesis icon in Primary Cobalt.
- Center: Borderless input with placeholder `"Describe what you need..."` in `#94A3B8`.
- Right accessory: Circular submission button (`#1D4ED8`) with upward arrow icon.

### 5. Input Fields & Controls
- Form Fields: Height 46px, radius 14px, background `rgba(15, 23, 42, 0.02)`, border 1px `rgba(15, 23, 42, 0.08)`. Focus states transition border to `#2563EB` with `0 0 0 3px rgba(37, 99, 235, 0.15)`.
- Checkboxes: 20x20px squircle (6px radius), selected fill `#1D4ED8` with crisp white checkmark icon.
- Radio Buttons: 20x20px circle, selected ring `#1D4ED8` with 8px centered cobalt dot.

### 6. Dynamic State Indicators (AI Activity)
- **Calm Synthesis State:** Discrete pulsing gem icon, shimmer hairline border cycle across the card top (`2s ease-in-out infinite`), accompanied by human-friendly microcopy (e.g., `"Assembling split calculator..."`)—never raw system or debugging outputs.