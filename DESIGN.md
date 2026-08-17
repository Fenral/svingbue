---
name: Flightglass
description: A dark field instrument for explaining bounded golf-flight relationships.
colors:
  background: "#07060C"
  surface: "#110D1C"
  solid-lens: "#0D0A18"
  ink: "#F5F2FF"
  muted: "#A79FC7"
  hairline: "rgba(255,255,255,.10)"
  violet: "#9D8BFF"
  ember: "#FF8A4D"
  model-cyan: "oklch(78.68% 0.1179 228.25)"
  ghost-trace: "#A7A0C4"
  good: "#58E6A8"
  warning: "#FFD056"
  bad: "#FF7B8A"
typography:
  display:
    fontFamily: "Space Grotesk, Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "clamp(30px, 7vw, 50px)"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-.035em"
  body:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "IBM Plex Mono, ui-monospace, SF Mono, JetBrains Mono, Menlo, monospace"
    fontSize: "10px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: ".08em"
rounded:
  control: "12px"
  card: "16px"
  lens: "20px"
  pill: "999px"
spacing:
  inset: "16px"
  control: "44px"
  panel: "18px"
  section: "30px"
components:
  button-primary:
    backgroundColor: "{colors.ember}"
    textColor: "{colors.background}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
    height: "48px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
    height: "48px"
  answer-lens:
    backgroundColor: "{colors.solid-lens}"
    rounded: "{rounded.lens}"
    padding: "clamp(18px, 4vw, 34px)"
  model-boundary:
    backgroundColor: "rgba(157,139,255,.07)"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px 14px"
  app-navigation-active:
    backgroundColor: "rgba(157,139,255,.12)"
    textColor: "{colors.violet}"
    rounded: "{rounded.control}"
    height: "44px"
---

# Design System: Flightglass

## Overview

**Creative North Star: "Flightglass Field Instrument / Question Ladder"**

Flightglass is a cold, precise field instrument for explaining a bounded golf model. The system gives a question, its evidence, deterministic geometry, and exact comparison a single vertical chain rather than breaking them into decorative dashboard cards. It is dense enough for real measurements but calm enough for a golfer asking one practical question.

The portable visual contract complements, and never replaces, the technical authority in `docs/DESIGN-SYSTEM.md`; `sa-p3.css` remains the token and law source of truth. Dark solid lenses, thin hairlines, tonal layering, violet structure, cyan model traces, and a single rare ember action make model boundaries visible as part of the interface itself.

**Key Characteristics:**

- A Browse → Answer → Lab progression: answer first, evidence and controlled comparison on demand.
- One dominant panel on a phone; a narrow ladder may sit beside the evidence lens on desktop.
- Truth labels, held constants, and model limits are first-class UI, not decorative badges.
- No fake chat, assistant orb, typewriter theatre, FAQ grid, marketing hero, or ornamental glass.

## Colors

An ultraviolet-black instrument field is structured by violet, made legible by cool cyan model traces, and punctuated by one ember event.

### Primary

- **Living Ember:** use the ember token for the one primary action, resolving point, or live focal value. Its scarcity carries the meaning of live truth.

### Secondary

- **Structural Violet:** use violet for hierarchy, active navigation, taught labels, paths, and quiet model state.
- **Truthful Model Cyan:** use model cyan only for labelled deterministic directional comparison and range-modelled traces.

### Neutral

- **Night Field:** background grounds the full application.
- **Raised Instrument Surface:** surface holds ordinary panel regions; the solid lens concentrates the answer and exact data.
- **Starlight Ink and Muted Readout:** ink carries primary reading; muted carries supporting explanation.
- **Hairline and Ghost Trace:** hairlines separate the ladder and tables; ghost trace is reference-stroke-only, never control chrome.

### Named Rules

**The One Ember Rule.** Ember is reserved for a live point or the single primary action; it must not become general-purpose emphasis.

**The One Hue, One Meaning Rule.** A physical quantity keeps its labelled semantic hue across views; colour never supplies meaning without its text label.

## Typography

**Display Font:** Space Grotesk, with Inter and system-sans fallbacks.
**Body Font:** Inter, with system-sans fallbacks.
**Label/Mono Font:** IBM Plex Mono, with monospace fallbacks.

**Character:** Space Grotesk gives conclusions a compact technical lift; Inter keeps questions and explanations direct; IBM Plex Mono makes values, provenance, units, and state labels exact rather than ornamental.

### Hierarchy

- **Display** (600, `clamp(30px, 7vw, 50px)`, 1): question conclusions and Guide title.
- **Body** (400, 14px, 1.45): explanations and supporting copy, constrained by the content lens rather than a marketing measure.
- **Question title** (600, 15px, 1.25): topic ladder rows and compact task choices.
- **Data** (500–600, 10–20px depending on the measurement, tabular figures): exact values, tables, provenance, and deterministic diagram annotations.
- **Label** (600, 10px, 1, `.08em`): uppercase truth tiers, table headings, and compact state labels.

**The Exact Readout Rule.** Use IBM Plex Mono with tabular numerals for measurements only; keep the existing unit grammar and never render text below 10px.

## Layout

The Guide centers a shell at `min(1120px, 100%)`, with a 16px content inset on narrow screens and 4/8-based rhythm. Topic rows are full width and separated by 1px hairlines; expanded questions branch inward with a violet rule. On desktop the lab uses a two-column controls/results layout and the Guide may show the ladder with its evidence lens. On a 390px phone, Browse, Answer, and Lab replace one another as separate dominant panels; reading order stays intact and exact tables alone may scroll inside their labelled region.

Every essential control remains at least 44px high. The shared bottom navigation reserves space rather than covering actions.

## Elevation & Depth

Depth is primarily tonal, not card-dashboard elevation. The field remains near-black; raised surface and solid lens tiers establish hierarchy with restrained top-lit gradients. A lens may use one soft offset shadow, but do not combine a pronounced border and shadow. On-scene plates can use the existing blurred plate treatment; the Guide’s information panels stay solid and readable.

**The Lens, Not Glass Rule.** Prefer a dark solid answer lens and hairline separators over translucent decorative glass or repeated floating cards.

## Shapes

Controls use the gently rounded control radius, cards and plates use the card radius, focused evidence regions use the larger lens radius, and compact truth labels use pills. Geometry is a deliberate exception: deterministic SVG paths are thin, crisp, and mostly unfilled, with a 2px causal trace permitted only inside diagrams. Borders are 1px hairlines; interactive borders use the existing strong line token.

## Components

### Buttons

**Character:** task-forward, measured controls rather than promotional calls to action.

- **Primary:** the single full-width ember action, with a 48px minimum height and compact horizontal padding.
- **Secondary:** a quiet transparent reset or supporting action with the same target size and control shape.
- **Hover / Focus:** modest brightness or violet tonal response for state; keyboard focus is the existing high-contrast double inset ink ring, never ember.

### Topic Ladder

**Character:** a vertical question index, not a card collection.

- **Shape:** full-width rows with a 76px minimum height, hairline dividers, mono indexes, violet chevrons, and an indented violet branch for revealed questions.
- **State:** hover and focus use a restrained violet wash; an expanded topic may use ember text as the currently resolving branch.

### Cards / Containers

**Character:** one decisive evidence lens with quieter supporting panels.

- **Answer lens:** a large solid dark lens with responsive inner padding, holding conclusion, evidence, diagram, exact table, boundary, and action in order.
- **Lab panels:** surface-tier controls and results panels with lens corners; their distinction comes from tonal fill and spacing rather than stacks of borders.

### Inputs / Fields

**Character:** explicit one-variable control.

- **Parameter rows:** full-width, 62px minimum choices with the active model input identified by violet structure and text.
- **Range input:** a compact track with an ember active fill and thumb; the surrounding copy names all held constants.
- **Focus:** use the established double inset ink ring and keep keyboard operation equivalent to touch.

### Navigation

The shared four-route navigation is a compact bottom bar with 44px links, violet active state, and a 2px active indicator. It remains visible but spatially subordinate to the current Guide panel.

**Immersive tool exception.** A full-height instrument, model, or relationship canvas may omit the bottom bar when it materially reduces the working area. It must instead expose one 44px minimum back control in the upper-left corner that returns to the Home navigation surface. Do not add parallel route controls inside the canvas.

### Truth Labels

Outlined mono pills expose provenance such as range-modelled, studio geometry, estimate, and not-modelled. They pair colour with explicit text and are required wherever a claim’s boundary matters.

## Do's and Don'ts

### Do:

- **Do** use violet hairlines and tonal fills to show question hierarchy and active model state.
- **Do** show the short answer before deeper evidence, then offer the live lab as one controlled change.
- **Do** pair labelled cyan traces with deterministic geometry and exact values in accessible HTML.
- **Do** retain visible focus, 44px minimum targets, and complete reduced-motion information parity.
- **Do** state provenance, held constants, estimates, and unsupported variables directly at the claim.

### Don't:

- **Don't** use ember for generic decoration, multiple competing actions, or a focus ring.
- **Don't** turn the Guide into a chatbot, assistant-avatar experience, typewriter simulation, or FAQ card grid.
- **Don't** use decorative frosted glass, heavy shadows, or card-dashboard drift to create hierarchy.
- **Don't** imply diagnosis, personal fitting, or precision outside the shipping model’s stated boundaries.
