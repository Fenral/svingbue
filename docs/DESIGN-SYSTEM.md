# StrikeArc Design System — "Ultraviolet Ember" (P3)

**Single source of truth in code:** `sa-p3.css` (tokens + laws) · `sa-haptics.js` (haptics) · vendored fonts in `vendor/fonts/`. This document is the human-readable map of all of it. If this file and `sa-p3.css` ever disagree, the CSS wins — update this doc.
**The world in one line:** a cold ultraviolet night driving-range. ONE living hot element — the ember ball/tracer. Everything else is chrome, glass, violet and starlight.

---

## 1 · Colour palette

### Identity / surfaces
| Role | Value |
|---|---|
| Background (app) | `#07060C` |
| Surface (raised) | `#110D1C` |
| Plate (on-scene, blurred) | `rgba(8,5,14,.86)` + backdrop blur |
| Plate (solid, lens/panel) | `#0D0A18` |
| Text primary (ink) | `#F5F2FF` |
| Text muted | `#A79FC7` |
| Text dim (telemetry) | `#8E85A8` |
| Hairline | `rgba(255,255,255,.10)` |
| Hairline strong (interactive) | `rgba(255,255,255,.30)` |
| Scene gradient | radial 130%×120% at 50% −10%: `#140E24 → #07060C` |

### Ember — the hero (live ball / live data / celebration ONLY)
| Role | Value |
|---|---|
| Ember accent | `#FF8A4D` |
| Soft fill | `rgba(255,138,77,.16)` |
| Line | `rgba(255,138,77,.55)` |
| Line strong (promotion hairline) | `rgba(255,138,77,.80)` |
| White-hot tip (canvas/3D light carve-out only) | `#FFF3E8` |

### Violet — secondary (chrome, glyphs, taught terms, sketches)
| Role | Value |
|---|---|
| Violet | `#9D8BFF` |
| Soft fill | `rgba(157,139,255,.14)` |
| Line | `rgba(157,139,255,.45)` |

### Data parameters (ONE hue = ONE physical quantity, always labelled — SYS-11)
| Quantity | Hue | Value |
|---|---|---|
| Face angle | coral | `#FF5C6B` |
| Club path | sky blue | `#6FC6FF` |
| Attack angle / low-point | mint | `#4DE8D2` |
| Dynamic loft | lavender | `#B9A0FF` |
| Launch | desaturated gold | `#E3C468` |
| Swing plane | periwinkle | `#93A4F2` |
| Strike depth | orchid | `#C98AE6` |
| Ghost/reference trace (strokes only) | violet-grey | `#A7A0C4` |

### Status & reward
| Role | Value |
|---|---|
| Good | `#58E6A8` |
| Warn / XP gold (allowlist: XP, badges, mastery — SYS-15) | `#FFD056` |
| Bad | `#FF7B8A` |
| Celebrate (celebration MOMENTS only, never resting progress) | `#FF5CE1` |

**Brass note:** `--launch #E3C468` doubles as the *etched-instrument* voice (armillary tick engravings, plaque frames) on the two Observatory Broadcast surfaces — frames and engravings only, **never data values**.

---

## 2 · Typography

**App-wide trio (SYS-01, vendored woff2 in `vendor/fonts/`, `font-display:swap`):**
| Role | Face | Use |
|---|---|---|
| ui | Inter 400/500/600 | labels, eyebrows, buttons, captions |
| display | Space Grotesk 600/700 | hero numerals ≥28px + wordmark |
| data | IBM Plex Mono 400/500/600 | **data values only** — always `tabular-nums`, minus is always U+2212 |

**Showcase deviation (declared, scoped):** the front page + 3D geometry run **Fraunces** (variable serif, optical sizes; WONK axis on for the wordmark only) as the display role — the engraved-observatory-plaque voice. Scoped per-page via local `@font-face`; deliberately NOT in `sa-p3.css`.

**Floors & grammar:** nothing rendered below **10px**. Unit grammar (SYS-06): `value␣unit` ("16 m", "90 mph"), side letter after unit ("16 m L"), degrees closed up ("−2.0°"). Data dictionary (SYS-05): one canonical label + order everywhere — `LAUNCH DIR · LAUNCH ANGLE · SPIN AXIS · CURVE · APEX · LAND ANGLE · BALL SPEED · BACKSPIN · CARRY · TOTAL`.

---

## 3 · Surfaces, spacing, radii (SYS-07)
- **Radii:** 12px controls · 16px cards/plates · 20px lenses (`--radius-lens`) · 999px pills.
- **Border alphas:** `--line` .10 (decorative) · `--line-strong` .30 (interactive). No freelance values.
- **Plate tiers:** blur-plate on-scene (`rgba(8,5,14,.86)` + blur; ≥.92 where it sits over hot strokes — SYS-10) · solid plate `#0D0A18` for lenses/panels.
- **Spacing:** 4/8 grid; content inset 16px at 812pt width; sticky chrome is opaque (SYS-13).

## 4 · Interaction states (SYS-03)
- **Focus:** the double ink ring — `inset 0 0 0 1px rgba(0,0,0,.85), inset 0 0 0 3px var(--ink)` (never ember). On the constellation stars it renders as a brass reticle *over* the ring.
- **Pressed:** `scale(.97)` + bg `rgba(255,255,255,.06)`, 80ms ease-out. **Disabled:** 40% opacity, no pointer.
- **Hit targets:** ≥44×44pt, including moving targets (hit-testing continues during motion).

## 5 · Motion language
- **Easing token:** `--ease: cubic-bezier(.2,.8,.2,1)`; GSAP vendored for choreography.
- **The doctrine (Observatory Broadcast):** *the universe is slow, the strike is violent* — gravitational easing and telescope glides at rest; whip-pans, speed-ramps and hard freezes only at the moment of a swing.
- **Laws:** entry choreography ≤2.6s, skippable on any input, once per session (`sessionStorage`). Transient surfaces animate in AND out. Nothing animates through occluding content. `prefers-reduced-motion` = complete, static, fully functional (information parity — never just shorter durations). Ambient loops pause on `visibilitychange`. Glow blur ≤0.4× font-size.
- **Ember budget (SYS-08):** at rest, max **3 ember elements** per screen (ball/tracer, one hero value, one primary action). Codified exceptions: logo ball, wordmark accent.

## 6 · Haptics (`sa-haptics.js` — Capacitor Haptics; silent no-op on web, logs to `_log` for tests)
| Event | Haptic |
|---|---|
| Slider drag start/end | selectionStart / selectionEnd |
| Whole-degree detent | `tick(key)` — rate-limited ≥70ms/key, coalesced |
| Band change (Pure→Thin…) | impact **light** (the lesson moment) |
| HIT / play | impact **medium** |
| Launch (Ball Flight) | impact **heavy** — the ONLY heavy in the app |
| Landing | medium (+ notify success on first pure straight shot only) |
| Popover open | light · Stepper: selectionChanged · Nav: **none** (HIG) |
Principle: haptics mark *physical events and detents*, never decoration; enhancement-only, never the sole channel.

## 7 · Voice & copy (SYS-14)
Curious-golfer first: plain language, real terms kept and **taught inline** at first use (precision is non-negotiable). No caps-for-emphasis in body copy. Banned: developer vocabulary in user-facing text ("display-layer", "engine solve", "vertical slice"…). Honesty register: certainty asserted calmly ("Your face was open to your path"), probability shown as ranked shares ("about 7 in 10") — never fake precision.

## 8 · Accessibility contracts (every surface)
One polite live region per context (throttled ≥800ms) · canvas/3D always `aria-hidden` with a real text alternative + data mirrored in DOM · every gesture has a tap/keyboard equivalent · roving tabindex on chip rows/radiogroups (both axes in grids) · no keyboard traps (freeze-holds release via Esc/Enter) · AA contrast on all text, re-validated after any hue change (OKLCH gamut rule) · English UI.

---
*Compiled by Fable 5, 2026-07-10 — from sa-p3.css (tokens + SYS-01..15 law blocks), sa-haptics.js, docs/showcase-spec.md, and the craft-critique rubrics.*
