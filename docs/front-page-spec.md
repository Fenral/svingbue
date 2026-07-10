# StrikeArc — Front Page Spec (P3 "Ultraviolet Ember")

**Date:** 2026-07-10 · **Author:** Fable 5 (design-director pass, spec only — no code)
**Replaces:** current `index.html` (diagonal 2-zone menu + blocking GSAP splash).
**Locked foundations honoured:** P3 tokens (docs/palette-proposals.md §P3) · backdrop `assets/range-night-3d-33.png` + night grade (image .78, dark rect .16, violet-shifted gradients) · four destinations (Geometry C2 window / Ball Flight viz / Outcome 2D / Academy) · landscape-locked except Academy · chips+dock/before-trace/ember=live-data grammar.
**Tightest target:** 812×375 landscape, notch + home-indicator safe areas. Vibe reference: `impact-viz-mock-p3-cand29.html`.

---

## 0. The thesis (read this first)

The current index is a *menu*. A million-dollar app opens **already running**: your own numbers are on the glass at first paint, the world is cold and quiet, and exactly **one hot thing** moves — a single ember tracer down the floodlit corridor. No splash wall, no marketing copy, no decisions demanded. The front page is the app's instrument-cluster at idle.

Three laws the page must visibly teach (they are the palette laws made spatial):

1. **Ember `#FF8A4D` appears exactly twice:** the tracer (+ its landing dot) and the resume-card's live stat. Nothing else. Ever.
2. **Magenta `#FF5CE1` + gold `#FFD056` appear exactly once:** on the Academy card (XP bar / streak). Rewards live there and only there.
3. Everything else is the cold ultraviolet world: violet chrome `#9D8BFF`, ink `#F5F2FF`, muted `#A79FC7`, plates.

---

## 1. Tokens, type, scene grade

### 1.1 Tokens (verbatim P3; put in a shared `sa-p3.css` — this file becomes the cohesion-pass source of truth)

```css
:root{
  --bg:#07060C; --surface:#110D1C; --plate:rgba(8,5,14,.86);
  --ink:#F5F2FF; --muted:#A79FC7;
  --accent:#FF8A4D;          /* ember — live ball / live data ONLY */
  --accent-soft:rgba(255,138,77,.16); --accent-line:rgba(255,138,77,.55);
  --secondary:#9D8BFF;       /* violet — chrome, glyphs, labels */
  --secondary-soft:rgba(157,139,255,.14); --secondary-line:rgba(157,139,255,.45);
  --celebrate:#FF5CE1;       /* XP/badges ONLY */
  --good:#58E6A8; --warn:#FFD056; --bad:#FF7B8A;
  --line:rgba(255,255,255,.10); --line-strong:rgba(255,255,255,.30);
  --radius-card:16px; --radius-pill:999px;
  --ease:cubic-bezier(.2,.8,.2,1);
}
```

### 1.2 Type
System stack (`-apple-system, "Segoe UI", Roboto…`) — native feel, zero font-flash. Academy keeps its own display fonts inside Academy; the front page does **not** import them (CALL: the shell is system-voice; Academy is a "place" with its own voice).
- Wordmark: 600, letter-spacing .14em, uppercase.
- Card eyebrow: 9px, 600, ls .22em, uppercase, `--muted`.
- Card stat value: 17px, 700, `font-variant-numeric:tabular-nums`, `--ink` (ember on resume card).
- Card stat label/unit: 10px, 600, `--muted`.
- First-run card line: 12px, 500, `--ink`.

### 1.3 Scene layer stack (bottom → top) — the NIGHT GRADE, verbatim recipe
1. `body` fill: `radial-gradient(130% 120% at 50% -10%, #140E24, #07060C)` (P3 scene gradient — visible during image decode; nothing ever flashes white).
2. `<img>`/SVG `<image>` `assets/range-night-3d-33.png`, `object-fit/preserveAspectRatio: cover (slice)`, **opacity .78**.
3. Dark rect: full-bleed `#07060C` at **opacity .16**.
4. Violet grade wash: `linear-gradient(180deg, rgba(20,14,36,.42) 0%, rgba(20,14,36,.10) 42%, rgba(157,139,255,.10) 62%, rgba(20,14,36,.38) 100%)` — cools the turf stripes, lifts a faint UV haze at the treeline (~55% height in this crop), re-darkens the foreground so plates sit on near-black.
5. Bottom scrim under the rail: `linear-gradient(0deg, rgba(7,6,12,.88), transparent 46%)` covering the lower 180px — guarantees plate/text contrast regardless of turf brightness.
6. Tracer layer (§3).
7. UI (wordmark, cards).

Image composition note (this crop): symmetric tower alley converging to a central vanishing point at ≈(50%, 56%); sky darkest at top-center — the wordmark lives there; brightest bloom is the two edge towers — no text there.

---

## 2. Layout — one screen, two states

### 2.1 Returning user (the default truth), 812×375

```
┌────────────────────────────────────────────────────────────────────────────┐
│              ◜arc-mark◝  S T R I K E A R C                        [?]      │ ← y≈14, centered lockup; help top-right
│                                                                            │
│                    (scene corridor — ember tracer flies here,              │
│                     lands as a breathing dot near the vanishing point)     │ ← ~190px of pure scene. NOTHING else.
│                                                                            │
│  ┌────────────┐ ┌CONTINUE═══════┐ ┌────────────┐ ┌────────────────┐        │
│  │ GEOMETRY   │ │ BALL FLIGHT   │ │ OUTCOME    │ │ ACADEMY        │        │
│  │ ~arc glyph~│ │ ~tracer glyph~│ │ ~dial glyph│ │ ⬡3  ▓▓▓░ 240XP │        │ ← rail y≈252..360
│  │ Pure −3.1° │ │ 214 m  4 m R  │ │ Draw 198 m │ │ 🔥 12-day streak│       │
│  └────────────┘ └───────────────┘ └────────────┘ └────────────────┘        │
└────────────────────────────────────────────────────────────────────────────┘
        (glyphs = violet)  ↑ ember top-hairline + ember stat = resume target
```

- **Rail:** 4 cards, equal size, single row. `padding-inline:max(16px, env(safe-area-inset-left/right))`; gap 10px; card ≈165×108 at 812pt (flex:1, min-width 150, max-width 200; >832pt the row centers). `padding-bottom:max(12px, env(safe-area-inset-bottom))`.
- **CALL — card order is FIXED, never recency-sorted:** `GEOMETRY · BALL FLIGHT · OUTCOME · ACADEMY` — the causal pipeline left→right (swing → flight → result → learn). Spatial memory beats recency; the resume card is *promoted in place* (hairline + ember stat + CONTINUE eyebrow), never moved.
- **CALL — data-alive cards, not miniature canvases, not cinematic tiles.** Live-preview minis at ~165px over a photo are noise and cost (two canvases + Three.js on the hub); cinematic tiles are hollow (no state). Each card instead carries **one static schematic glyph + one real persisted number** from that screen's last session. Real state, zero runtime weight. The stat *is* the live preview.
- **Middle band stays empty.** The restraint is the luxury. No quotes, no tips, no second CTA.

### 2.2 Card anatomy (all cards)
- Surface: `--plate` on `backdrop-filter:blur(10px)`, `border:1px solid var(--line)`, radius 16.
- Row 1 (eyebrow): destination name; resume card prepends `CONTINUE · ` in `--accent` (9px).
- Row 2: schematic glyph, 26px line-work, stroke 1.6, **`--secondary` violet**, `aria-hidden`:
  - Geometry: arc-bottom curve + ball dot + ground tick (the Strike Window in 12 strokes).
  - Ball Flight: launch tracer curve + apex dot.
  - Outcome: two small lenses (top-down arrow + side-on arrow) — the dual-lens mark.
  - Academy: level hexagon with the numeral inside.
- Row 3 (stat): value + label (see 2.4). Resume card's value in `--accent`; all others `--ink`.
- Resume promotion: 2px ember hairline across the card's **top edge** (`border-top:2px solid var(--accent-line)` + 8px soft glow) — one line, not a filled state.
- Hover/press (pointer + touch): border → `--secondary-line`, translateY(-2px), 150ms; pressed scale .985. No color floods.

### 2.3 First-run state (no persisted data)
- Hero moves to **BALL FLIGHT**: eyebrow `START HERE ·` in ember, ember hairline, stat row replaced by `See the shot →` (12px ink). **CALL:** first-run pushes to Ball Flight, not Geometry — the hook is the ten-second spectacle payoff; Geometry is where you go once you have a shot to explain. Academy is the *second* pull: its card reads `Learn the physics · Lv 1`.
- Other cards get teaching lines instead of stats: Geometry `Model your strike` · Outcome `Read the launch`.
- No streak, no XP bar until they exist (never show zero-state gamification chrome).
- Tracer still flies (the identity moment is unconditional).
- First-run detection: absence of all `sa.stat.*` keys (§2.4).

### 2.4 State contract (localStorage; each destination writes on session end / settle)
```
sa.home.last      = "flight" | "geometry" | "outcome" | "academy"
sa.stat.flight    = { total:214, offlineM:4, offlineSide:"R", ts }
sa.stat.geometry  = { band:"Pure", attack:-3.1, ts }
sa.stat.outcome   = { shape:"Draw", carry:198, ts }   // fallback if no shape: carry only
sa.stat.academy   = read Academy's EXISTING store (xp, level, streak — confirm key name in academy.html at build time; do not invent a parallel store)
```
Card stat rendering: `flight → "214 m · 4 m R"` · `geometry → "Pure · −3.1° attack"` · `outcome → "Draw · 198 m"` · `academy → "⬡Lv · XP-bar · N-day streak"`. Stats older than 30 days decay to the first-run teaching line (stale numbers feel dead, not alive).
Resume target = `sa.home.last`; if unset → Ball Flight.

### 2.5 Academy card = the pull-back loop (the only warm-reward surface)
- Level hexagon (`--secondary` outline, numeral `--ink`), XP bar 4px: track `--line`, fill gradient `#FF5CE1 → #9D8BFF` (the celebrate treatment rule), XP numeral tint `--warn` gold (Academy's law).
- Streak: SVG flame glyph in `--warn` + `N-day streak` (no emoji).
- **Streak-at-risk nudge:** if last Academy activity ≥20h ago and streak ≥3, the streak line swaps to `--warn` `Streak ends tonight` (text only, no pulse, no badge). CALL: uses warn-gold, never ember (color law) and never a modal (no begging on the hub).
- If a level-up happened since home was last shown (compare stored level vs last-rendered level in `sa.home.seenLevel`): the hexagon does one 500ms badgePop (Academy's existing keyframe) + `notificationSuccess` haptic, once.

---

## 3. Identity moment — the first 2 seconds

**CALL: DELETE the blocking splash** (current `#saSplash`, ~1.25s every open). Native launch already shows the Capacitor splash; an in-app second splash is a double door. The home screen itself is the identity moment, and it is **interactive from first paint** — the choreography decorates, never gates.

Cold-launch timeline (per app process launch, not per navigation back to home):
| t (ms) | beat |
|---|---|
| 0 | Scene (bg gradient → image) + rail plates render immediately; cards tappable NOW. Plates fade in 240ms, translateY 4px→0, stagger 40ms left→right. |
| 120 | Wordmark fades in (240ms). |
| 420 | **Ember tracer launches**: from bottom-center tee (x 50%, y 102%) arcing up the corridor, apex ≈(50%, 34%), landing at the vanishing point ≈(51%, 56%). Duration 1500ms, ease-out. Rendered exactly like `fTracer`: 3.8px gradient stroke (`#FF8A4D`, tip `#FFF3E8` white-hot core 1.5px) over a 14px low-opacity under-glow stroke. No blur filters. |
| 1920 | Landing splash ring (1.4px ember stroke ellipse) draws, holds 1.8s, fades; a 3px ember dot remains and **breathes** opacity .35→.6, 4s sine loop — the page's ONE idle motion. Simultaneously, card stats count up 300ms (tabular-nums, no layout shift). |

- Warm return to home (back-nav / bfcache / same session): **no tracer replay** — scene + resting ember dot only, stats already set. Track with `sessionStorage sa.home.traced=1`. Replaying the signature cheapens it.
- Reduced motion: tracer path pre-drawn static at .5 opacity with the dot at the landing point; no count-ups, no breathing, no stagger — everything simply present at full value.
- Wordmark P3 treatment (the brand story in miniature — **cold arc, hot ball**): arc-mark strokes `--secondary` violet; the ball dot in the mark `--accent` ember; text `STRIKE` in `--ink`, `ARC` in `--accent`. CALL: the lockup is the codified exception to "ember = live data" — the ball in the logo *is* the ball. Update favicon + `theme-color:#07060C` to match.

---

## 4. Navigation model + shared app-shell chrome (the cohesion-pass contract)

**CALL: pure hub-and-spoke.** No persistent tab bar anywhere. Reasons: (1) the four destinations are *modes*, not siblings you flip between mid-task; (2) at 375px height the instruments cannot give up a persistent nav row — the chip row owns the bottom edge on Flight/Geometry/Outcome; (3) the hub is cheap to return to *because it is stateful* — coming home shows you what you just did, so the extra hop has value, not friction. The existing sibling tabs (`Geometry / Impact` links in each topstrip) are **removed** in the cohesion pass.

Shared shell chrome (`.sa-strip`, applied to every destination):
- 40px top strip (already exists on Flight/Outcome): **left cluster = [home button] + [screen title 11px uppercase]**; right cluster stays screen-specific (`?` help etc.). Center stays screen-specific (e.g. Flight's speed slider).
- Home button: the arc-mark glyph, 30px visual / 44px hit (the established `::after` pad trick), `aria-label="Home"`, `view-transition-name:sa-logo`. Violet strokes + ember ball dot (matches the lockup so the morph reads).
- Placement per destination: Flight & Outcome — replaces the modnav in their existing topstrip, far left. Geometry (Strike Window) — same strip pattern added above the window (it currently has headroom in the presets row; home glyph sits far left of that row). Academy — far left inside its existing sticky header, before the wordmark; same glyph, 44px target. **Never inside the instrument canvas; always in the strip/header row that already exists.** Zero pixels stolen from instruments.
- OS back (Android back gesture / swipe-back): destination → home; home → OS default (minimize). Wire via Capacitor App plugin listener.

---

## 5. Native feel — transitions, haptics, safe areas

- **Cross-document View Transitions** (MPA files): add `@view-transition{navigation:auto}` to home + all four destinations. Named pairs: `sa-logo` (home wordmark-mark ↔ destination home-button — already the convention in index/viz). Card→screen morph: on `pointerup`, JS sets `style.viewTransitionName='sa-stage'` on **the tapped card only** (never in static CSS — four identical names would abort the transition); each destination assigns `sa-stage` to its primary stage container. Result: the card expands into the instrument. 320ms, `var(--ease)`.
- Fallbacks: no cross-doc VT support (older WebKit) → instant navigation, no shim; `prefers-reduced-motion` → VT disabled (`@media` guard), instant swap.
- **Haptics** (`sa-haptics.js`, existing — adapt to its real API names): light impact on card pointerdown; medium impact on navigation commit; success notification on the level-up badgePop (§2.5), max once per event. No haptic on the tracer (it's ambient, not a response).
- **Safe areas:** rail `padding-inline:max(16px, env(safe-area-inset-left), env(safe-area-inset-right))` (landscape notch either side); rail bottom `max(12px, env(safe-area-inset-bottom))`; wordmark `top:max(14px, env(safe-area-inset-top))`. `viewport-fit=cover` stays.
- Home is **landscape-locked** like the rest of the shell; returning from portrait Academy re-rotates — accepted cost of the lock, Academy's existing orientation nudge is the mitigation. No horizontal scroll at any width ≥ 667pt; below that (should not occur under the lock) cards wrap 2×2.

---

## 6. A11y by design

- Landmarks: `<header>` (lockup + help) → `<main>` → `<nav aria-label="Destinations">` containing a `<ul>` of 4 `<a>` cards. `<h1>` is the wordmark lockup (`aria-label="StrikeArc"`); card names are the links' accessible names, not headings (a menu, not a document).
- Card semantics: plain `<a href>` per card. Composed `aria-label`, e.g. `"Ball flight — last shot 214 metres, 4 metres right. Continue where you left off."` / first-run: `"Ball flight — see the shot. Start here."` Glyphs, tracer, scene, XP-bar fill: `aria-hidden` (XP carried as text: `"240 XP, level 3, 12-day streak"` inside the Academy label). XP bar also gets `role="progressbar"` with the Academy header's existing value semantics.
- Focus order = DOM = visual: help → Geometry → Flight → Outcome → Academy (header first, then rail left→right). The resume card is announced via its label ("Continue where you left off"), **not** by reordering tabindex.
- Focus ring: the established backdrop-proof **double ring** — `inset 0 0 0 1px rgba(0,0,0,.85), inset 0 0 0 3px var(--ink)`. CALL: ink-white, not ember (scarcity law) and not violet (3:1 risk over floodlight bloom); white passes everywhere on this scene.
- Contrast: all stats/eyebrows sit on `--plate` (composite ≈`#0B0913`; every P3 token ≥6.4:1 there — computed in palette doc). Wordmark sits in the darkest sky region (top-center) + existing drop-shadow; ember `#FF8A4D` on that sky ≈8:1. Nothing texty ever sits on raw turf/bloom — the bottom scrim (§1.3.5) backstops the rail.
- Announcements: none on load (no live regions on a menu). The tracer is decoration; screen readers land on `<h1>` then the nav.
- Hit targets: cards ≈165×108; help + home 44px via pad.

---

## 7. Build notes for Opus

- New `index.html` replaces the current one wholesale; keep `sa-firstrun.js` hook (first tap → destination's own coach marks handle onboarding; home adds nothing).
- Scene = plain layered divs/one SVG; **no Three.js, no canvas, no GSAP dependency required** — the tracer is one SVG path with `stroke-dasharray` draw-on (Web Animations API or CSS); keep GSAP out of the hub's critical path.
- Tracer geometry: quadratic path in a 960×540 viewBox mapped `slice`, P0(480,551) → Papex(480,184) → Pland(490,302); under-glow duplicate path behind.
- Preload the backdrop (`<link rel=preload as=image>`); `theme-color #07060C`; robots noindex stays.
- Everything themed through `sa-p3.css` vars — the cohesion pass repaints destinations by importing the same file.

---

## 8. The ONE thing + build order

**The ONE thing:** *it opens already running.* First paint shows the cold ultraviolet range with **your** numbers on the glass, interactive at 0ms, and exactly one hot signal crossing the sky. If a first-time reviewer can tap into a destination before the tracer even lands — and a returning player reads last night's 214 m without touching anything — the page feels like a finished instrument, not a menu. Every cut candidate is judged against this sentence.

**Build order for the cohesion pass — front page FIRST, then repaint:**
1. **Front page (this spec).** Smallest surface that exercises every P3 token, the night-grade recipe, the type ramp, the shell chrome, VT names and haptic conventions → it *becomes* the reference card. Ships `sa-p3.css` + `.sa-strip` contract.
2. **Ball Flight** repaint (cand29 is ~90% there): adopt strip/home glyph, drop sibling tabs, write `sa.stat.flight`.
3. **Outcome 2D** (shares Flight's DNA — mostly token swap + strip).
4. **Geometry / Strike Window** (dusk-token mock was built vars-first — token swap + strip + `sa.stat.geometry`).
5. **Academy last** (largest theming delta: violet-on-violet depth needs optical checking per palette doc; warn-gold XP + celebrate-magenta rules; keeps its own fonts).

Repainting screens first would force each to adopt shell chrome twice. The hub defines the world; the rooms then match it.
