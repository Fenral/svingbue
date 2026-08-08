---
name: Flightglass
description: "A live ultraviolet mechanics instrument for inspecting cause, strike, and modeled flight."
colors:
  arena-black: "#07060C"
  mechanics-absolute-black: "#000"
  mechanics-focus-black: "rgba(0, 0, 0, .85)"
  mechanics-contact-black: "rgba(0, 0, 0, .9)"
  mechanics-depth-black: "rgba(0, 0, 0, .92)"
  mechanics-floating-black: "rgba(0, 0, 0, .96)"
  raised-ultraviolet-black: "#110D1C"
  solid-plate: "#0D0A18"
  lens-violet-black: "color-mix(in srgb, #110D1C 82%, #07060C)"
  ink-white: "#F5F2FF"
  muted-lavender: "#A79FC7"
  dim-lavender: "#8E85A8"
  etched-hairline: "rgba(255,255,255,.10)"
  etched-hairline-strong: "rgba(255,255,255,.30)"
  ultraviolet-chrome: "#9D8BFF"
  ultraviolet-soft: "rgba(157,139,255,.14)"
  ultraviolet-line: "rgba(157,139,255,.45)"
  live-ember: "#FF8A4D"
  face-coral: "#FF5C6B"
  path-sky: "oklch(78.68% 0.1179 228.25)"
  attack-pink: "oklch(72.34% 0.1793 348.62)"
  loft-lavender: "#B9A0FF"
  launch-citron: "oklch(80% 0.10 105)"
  plane-periwinkle: "oklch(70.06% 0.1494 288.55)"
  depth-orchid: "#C98AE6"
  strike-gold: "oklch(78.73% 0.1178 78.12)"
typography:
  headline:
    fontFamily: "'Space Grotesk', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "17px"
    fontWeight: 650
    lineHeight: 1.05
    letterSpacing: "-0.025em"
  title:
    fontFamily: "'Space Grotesk', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "13px"
    fontWeight: 650
    lineHeight: 1
    letterSpacing: "-0.02em"
  body:
    fontFamily: "'Space Grotesk', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "clamp(13px, 1.45vw, 17px)"
    fontWeight: 560
    lineHeight: 1.24
    letterSpacing: "-0.025em"
  label:
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "10px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.08em"
  instrument-floor:
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "10px"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "0.04em"
  instrument-detail:
    fontFamily: "UI or mono family according to content semantics"
    fontSize: "11px"
    fontWeight: 650
    lineHeight: 1.18
    letterSpacing: "0"
  instrument-control:
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  compact-data:
    fontFamily: "'IBM Plex Mono', ui-monospace, 'SF Mono', 'JetBrains Mono', Menlo, monospace"
    fontSize: "14px"
    fontWeight: 550
    lineHeight: 1
    letterSpacing: "-0.045em"
  touch-data:
    fontFamily: "'IBM Plex Mono', ui-monospace, 'SF Mono', 'JetBrains Mono', Menlo, monospace"
    fontSize: "22px"
    fontWeight: 550
    lineHeight: 1
    letterSpacing: "-0.035em"
  data:
    fontFamily: "'IBM Plex Mono', ui-monospace, 'SF Mono', 'JetBrains Mono', Menlo, monospace"
    fontSize: "clamp(15px, 2.25vw, 24px)"
    fontWeight: 550
    lineHeight: 1
    letterSpacing: "-0.035em"
rounded:
  indicator: "2px"
  track: "3px"
  compact: "10px"
  switch: "14px"
  control: "12px"
  card: "16px"
  lens: "20px"
  pill: "999px"
spacing:
  micro: "4px"
  compact: "8px"
  content: "16px"
components:
  icon-control:
    backgroundColor: "rgba(255,255,255,.035)"
    textColor: "{colors.ink-white}"
    rounded: "{rounded.control}"
    size: "44px"
  mode-segment:
    backgroundColor: "transparent"
    textColor: "{colors.muted-lavender}"
    rounded: "{rounded.compact}"
    padding: "0 15px"
    height: "44px"
  mode-segment-active:
    backgroundColor: "rgba(157,139,255,.15)"
    textColor: "{colors.ink-white}"
    rounded: "{rounded.compact}"
    padding: "0 15px"
    height: "44px"
  handoff-action:
    backgroundColor: "{colors.ultraviolet-soft}"
    textColor: "{colors.ink-white}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "44px"
  causal-stepper:
    textColor: "{colors.dim-lavender}"
    height: "31px"
  parameter-control:
    textColor: "{colors.ink-white}"
    height: "44px"
  cause-trace-panel:
    backgroundColor: "{colors.solid-plate}"
    textColor: "{colors.ink-white}"
    rounded: "{rounded.card}"
    padding: "10px"
  key-value-list:
    textColor: "{colors.ink-white}"
  telemetry-strip:
    backgroundColor: "{colors.arena-black}"
    textColor: "{colors.ink-white}"
    height: "72px"
  instrument-lens:
    backgroundColor: "{colors.lens-violet-black}"
    textColor: "{colors.ink-white}"
    rounded: "{rounded.lens}"
---

# Design System: Flightglass

## Overview

**Creative North Star: "The Ultraviolet Ballistics Bench"**

Flightglass is an ultraviolet-black arena arranged like a precision ballistics bench under restrained broadcast light. Dense controls, paired views, causal facts, and live outcomes read as one instrument: etched hairlines establish structure, semantic quantity hues preserve physical meaning, and mono numerals carry the live truth.

The system is factual, impersonal, and non-coaching. Sports-broadcast density is welcome when it keeps cause and effect visible together, but spectacle never outranks traceability. The shipped paired-lens Mechanics Lab is a proven composition for that surface, not a global mandate for every page.

The v1 family remains one product: Home orients, Range/Outcome replays and
compares, Mechanics explains the complete causal chain, and Guide answers
bounded questions. All four routes retain the shared opaque app shell, safe-area
discipline, truth labels, access states and transition behavior from `sa-p3.css`.

**Key Characteristics:**

- Ultraviolet-black surfaces with cold violet chrome and etched hairlines.
- Stable semantic hues that bind one color to one physical quantity.
- IBM Plex Mono numerals for live values, units, and model output.
- A scarce ember trace reserved for the ball, trajectory, and selected live data.
- Compact broadcast density with factual text and immediate state continuity.

## Colors

The palette keeps the arena cold and structural, then spends saturation only where a live quantity or trajectory needs identification.

### Primary

- **Live Ember** (`live-ember`): marks the live ball, its trajectory, and a selected live outcome; it is a focal signal, not general decoration.

### Secondary

- **Ultraviolet Chrome** (`ultraviolet-chrome`, `ultraviolet-soft`, `ultraviolet-line`): carries active authority, interactive outlines, glyphs, and causal progress without competing with live data.

### Tertiary

- **Face Coral** (`face-coral`): identifies face angle and the corresponding start-line value.
- **Path Sky** (`path-sky`): identifies club path, swing direction, and the corresponding curve value.
- **Attack Pink** (`attack-pink`): identifies attack angle and low-point locus.
- **Loft Lavender and Launch Citron** (`loft-lavender`, `launch-citron`): identify dynamic loft/backspin and launch angle respectively.
- **Plane Periwinkle, Depth Orchid, and Strike Gold** (`plane-periwinkle`, `depth-orchid`, `strike-gold`): identify swing plane, strike depth, and contact quality.

### Neutral

- **Arena Black, Raised Ultraviolet Black, Solid Plate, and Lens Violet Black**: establish the canvas-to-panel depth ladder.
- **Ink White, Muted Lavender, and Dim Lavender**: separate primary facts, supporting copy, and telemetry labels.
- **Etched Hairlines** (`etched-hairline`, `etched-hairline-strong`): divide regions and mark interactive structure without turning panels into boxes.

### Functional Black and Depth Tokens

- **Mechanics Absolute Black** (`#000`): mask-only opaque black for the arena's atmospheric fade; it is not a visible surface color.
- **Mechanics Focus Black** (`rgba(0, 0, 0, .85)`): the inner separation line beneath the ink-white keyboard focus ring.
- **Mechanics Contact Black** (`rgba(0, 0, 0, .9)`): the compact contact shadow beneath range thumbs.
- **Mechanics Depth Black** (`rgba(0, 0, 0, .92)`): instrument lift and lower-third separation.
- **Mechanics Floating Black** (`rgba(0, 0, 0, .96)`): the stronger shadow behind the guided cue that must stay legible over live diagrams.

These five values are functional opacity stops, not ad-hoc palette additions. Mechanics CSS exposes them as `--mechanics-black-absolute`, `--mechanics-black-focus`, `--mechanics-black-contact`, `--mechanics-black-depth`, and `--mechanics-black-float`.

### Named Rules

**The Restrained Ember Rule.** At rest, use no more than three ember elements: the ball or tracer, one live hero value, and one primary action. The logo ball remains the codified identity exception.

**The One Hue, One Quantity Rule.** A semantic data hue keeps exactly one physical meaning across controls, diagrams, and outputs; use the corresponding quantity role and never recycle that hue as status or decoration.

## Typography

**Display Font:** Space Grotesk (with Inter and system sans-serif fallbacks)

**Body Font:** Inter (with system sans-serif fallbacks)

**Label/Mono Font:** IBM Plex Mono (with system monospace fallbacks)

**Character:** Space Grotesk gives headings and causal sentences a compact technical voice; Inter keeps chrome legible; IBM Plex Mono makes changing values feel measured and inspectable. All three are self-hosted and load with `font-display: swap`.

### Hierarchy

- **Headline** (650, 17px, 1.05): screen identity and the highest local title.
- **Title** (650, 13px, 1): panel, lens, trajectory, and facts headings.
- **Body** (560, `clamp(13px, 1.45vw, 17px)`, 1.24): the short causal sentence that explains what changed.
- **Label** (700, 10px, 0.08em): uppercase telemetry labels, causal steps, and metadata; 10px is the hard minimum.
- **Instrument Floor** (700, 10px, 1.1): the absolute minimum for compact lens metadata, derived labels, causal nodes, and guided-state text. No 8px or 9px text is permitted.
- **Instrument Detail** (650, 11px, 1.18): compact headings, value annotations, handoff copy, and short causal support.
- **Instrument Control** (700, 12px, 1.2): authority segments and control values when the viewport gives them enough room.
- **Compact Data** (550, 14px, 1): the minimum mono telemetry value in the fixed portrait strip.
- **Touch Data** (550, 22px, 1): large mono telemetry on touch layouts before the portrait lower-third contract takes over.
- **Data** (550, `clamp(15px, 2.25vw, 24px)`, 1): live outcomes; use tabular numerals and the true minus sign (U+2212).

### Named Rules

**The Mono Means Measured Rule.** IBM Plex Mono is for data values only. Labels, instructions, headings, and actions remain in the UI or display families.

## Layout

The system follows a 4/8 spatial grid with 16px content insets where space permits, 44px minimum controls, and opaque sticky chrome. Operate surfaces should keep the active cause, its visual explanation, and the resulting values in the same viewport whenever the available geometry allows it.

Shipping routes reserve the app shell's measured footprint and the device safe
areas. Fixed Mechanics facts and telemetry sit above, never beneath, the shell
in portrait and compact landscape. Home, Range/Outcome and Guide remain
portrait-first; Mechanics is adaptive and never asks the user to rotate.

Mechanics Lab establishes a responsive instrument pattern. Above 820px, the workspace uses control bank / paired instrument / facts columns and a six-cell telemetry strip. At 820px and below, portrait uses one content column, a dedicated authority row, and a two-column telemetry fallback. Short landscape retains the three-part instrument and six-value strip above the shared shell, including at 812×375. At 380px and below, the paired direction and height lenses remain side by side while the persistent trajectory and Cause Trace share the fixed evidence row.

At 480px and below, trajectory and Cause Trace form a split fixed evidence row directly above a 104px, 3-by-2 telemetry grid. The workspace reserves the evidence row, telemetry, and shell as distinct non-overlapping footprints; delivery uses an 88px evidence row and arc uses 124px so Contact, derived Attack, and derived Path all remain readable.

**The Lower-Third Continuity Rule.** On compact live-instrument surfaces, keep causal explanation immediately above persistent telemetry and reserve its exact footprint in content. This is a responsive component rule, not a requirement that unrelated pages copy the Mechanics Lab composition.

## Elevation & Depth

Depth is structural and sparse. Dark tonal changes distinguish canvas, raised surface, solid panel, and lens; hairlines and inset top-light etch the boundary before a shadow is added. Shadows belong to instruments, controls under manipulation, and the compact lower third—not every container.

### Shadow Vocabulary

- **Instrument Lift** (`0 18px 54px -34px rgba(0, 0, 0, .92)`): control banks, facts panels, and instrument lenses.
- **Thumb Contact** (`0 3px 10px -3px rgba(0, 0, 0, .9)`): range-control thumbs only.
- **Lower-Third Separation** (`0 -18px 42px -28px rgba(0, 0, 0, .92)`): the fixed Cause Trace band on compact screens.
- **Ink Focus** (`inset 0 0 0 1px rgba(0, 0, 0, .85), inset 0 0 0 3px var(--ink)`): keyboard focus on controls; the focus signal is never ember.
- **Guided Cue Float** (`0 16px 38px -24px rgba(0, 0, 0, .96)`): keeps the bounded experiment cue distinct from live canvas evidence.

### Named Rules

**The Etched-Before-Floating Rule.** Establish hierarchy with tone, hairlines, and a one-pixel top light first; use cast shadow only when a surface must separate from moving or fixed content.

## Shapes

Shapes encode functional scale. Controls use gently curved 12px corners, cards and plates use 16px, instrument lenses use 20px, and chips or tracks may use the 999px pill. Four smaller radii have exact instrument jobs: 2px for active-step indicators, 3px for range tracks, 10px for nested segments and compact short-landscape panels, and 14px for the authority-switch group. Fixed mobile lower thirds meet the viewport edge with square corners. Mechanics CSS exposes these as `--mechanics-radius-indicator`, `--mechanics-radius-track`, `--mechanics-radius-compact`, and `--mechanics-radius-switch`.

**The Radius Ladder Rule.** Keep controls, cards, and lenses on the 12/16/20px ladder; introduce a different radius only when a component's nesting or viewport attachment makes the hierarchy clearer.

## Components

The component language is compact, tactile, and precise. Interactive state uses violet or neutral chrome, press feedback is a restrained scale change, and focus is always the double ink ring.

### Icon Controls

- **Shape:** 44px square with the 12px control radius, a fine neutral border, and a low-contrast surface fill.
- **States:** on pointer hover, strengthen the hairline and surface; on press, scale to 0.97; on keyboard focus, apply the double ink ring.

### Authority Switch

- **Structure:** a 48px-high two-segment group with 2px inset padding and a 3px gap.
- **State:** the pressed option uses a soft ultraviolet fill and ultraviolet inset line; the inactive option stays transparent and muted.
- **Responsive behavior:** below 820px, the switch owns a full header row and both options retain 44px targets.

### Causal Stepper

- **Style:** uppercase 10px steps connected by thin arrow glyphs; the active node shifts to ink white and gains a 2px ultraviolet underline.
- **Responsive behavior:** connectors shorten and letter spacing tightens below 380px; causal order never changes.

### Parameter Control

- **Structure:** a 44px-minimum label / range / value row separated by an etched hairline.
- **Color assignment:** the label, track, and thumb inherit the controlled quantity hue; the value stays mono ink white.
- **Focus:** the range receives the shared double ink ring without changing the quantity mapping.

### Handoff Action

- **Style:** a full-width 44px action with ultraviolet soft fill, ultraviolet line, 12px corners, and a right-pointing inline arrow.
- **States:** hover strengthens the violet field; press scales to 0.97; focus uses the ink ring.

### Instrument Lenses

- **Shape:** clipped 20px paired lenses plus a 16px full-width trajectory plate, each with instrument lift and a one-pixel inset top light.
- **Content:** heading at the upper left, mono summary at the upper right, and an accessible DOM alternative for canvas evidence.

### Cause Trace and Key-Value Rows

- **Style:** a factual Space Grotesk sentence above compact label/value pairs; labels are uppercase Inter and values are mono.
- **Responsive behavior:** at 480px and below, the panel becomes the fixed lower third; direct-mode rows collapse, while three arc-derived values remain visible.

### Telemetry Strip

- **Structure:** six persistent outcome cells with etched dividers, uppercase labels, and large tabular mono values.
- **Responsive behavior:** six columns become two columns below 820px and a fixed 3-by-2 grid below 480px.
- **Color assignment:** only the outcomes with established semantic ownership take quantity or ember color; all others remain ink white.

### App Shell and Navigation

- **Structure:** one opaque four-route bar with Home, Range/Outcome, Mechanics
  and Guide; each target is at least 44px and exposes the current route.
- **Compatibility:** visible labels may evolve, while internal route/access IDs
  such as `studio` remain stable when release contracts depend on them.
- **Safe areas:** the shell owns its bottom inset. Page content reserves the
  shell height instead of relying on transparent overlap.

### Question Ladder and Guide Actions

- **Primary Guide Action:** one ember action may open the next bounded question
  or live experiment; secondary actions use ultraviolet structure.
- **Question Ladder Row:** a full-width 44px-minimum choice with a short label,
  optional evidence hint and visible focus; v1 has no free-text prompt.
- **Progressive depth:** show the concise answer first, then bullets, tables,
  charts or a live model without changing the truth classification.

### Truth Labels, Answer Lenses and Model Boundaries

- **Truth Label:** compact uppercase text identifies modelled fact, geometry,
  estimate or unsupported real-world variable; color alone never carries it.
- **Answer Lens:** a restrained plate groups one conclusion and its supporting
  values without becoming a generic card grid.
- **Model Boundary:** a persistent neutral treatment states what the model does
  not measure; it never reads as an error, diagnosis or coaching prescription.

## Do's and Don'ts

### Do:

- **Do** bind every colored control, trace, and output to its established physical quantity.
- **Do** keep live values tabular, use U+2212 for negative numbers, and mirror canvas facts in accessible DOM text.
- **Do** preserve 44px minimum targets, the double ink focus ring, and full information parity under reduced motion.
- **Do** use the compact Cause Trace lower third above persistent telemetry when a live instrument reaches 480px or narrower.
- **Do** write factual causal sentences that describe model behavior without grading or coaching the golfer.
- **Do** keep shared shell, access and truth states visually consistent across
  Home, Range/Outcome, Mechanics and Guide.

### Don't:

- **Don't** use ember as generic accent, status, hover chrome, or decorative glow.
- **Don't** reassign a semantic quantity hue or show it as an unlabeled status dot.
- **Don't** turn the Mechanics Lab's paired-lens composition into a universal page template or a ban on other evidence-led layouts.
- **Don't** introduce generic SaaS cards, decorative glassmorphism, dashboard clutter, or gamified scoring into mechanics surfaces.
- **Don't** hide changing relationships behind animation; reduced motion must preserve every value and causal connection.
- **Don't** let Range/Outcome or Guide duplicate Mechanics as a second causal
  authority.
