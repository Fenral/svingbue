# STRIKEARC — COMPLETE CONTEXT HANDOFF
*Self-contained primer for any Claude session. Compiled 2026-07-11 by Fable 5 (design director). If this file conflicts with sa-p3.css or docs/, the code and docs win.*

## 1 · WHAT THE APP IS
StrikeArc is a **premium golf ball-flight instrument app** (web + iOS via Capacitor). It shows — live, from a real physics engine — how swing geometry creates impact numbers and ball flight. Audience: **the curious golfer who wants to learn, NOT the expert** (this drives language, pricing, marketing, onboarding). UI is 100 % English. Norwegian owner (Sivert), dialogue in Norwegian.

- Live: **https://svingbue.vercel.app** · Repo: **github.com/Fenral/svingbue** (private) · Local: OneDrive Skrivebord/Apper/svingbue
- Stack: plain HTML/JS/CSS, no bundler, relative imports ONLY (bare specifiers crash the iOS WKWebView). Three.js vendored for 3D. Deploy: `npx vercel deploy --prod --yes` (deploys working tree). Push to GitHub also triggers a Codemagic iOS build (app id no.strikearc.app).
- Monetization (locked): freemium, 10 free shots → hard paywall. Monthly 99 / Annual 399 / Lifetime 999 NOK, no trial. Academy tier-1 free.

## 2 · THE UNBREAKABLE LAWS
1. **Engine truth**: every displayed number is a live output of `impact-flight.js` (`solveFlight`) or `swing-parameters-and-impact.js`. These two files are BYTE-IDENTICAL, read-only, shared by all surfaces. Nothing is stored, faked or approximated on screen.
2. **The Motor law** (Fable×Copilot consensus): *"The numbers are the truth. Visualizations are interpretations. Visual gain must always be declared, never hidden, and printed numbers are authoritative."* (3D delivery arrow = honest 1:1; 2D path dial = «×4 · diagnostic view», declared.)
3. **Honesty doctrine**: what the engine doesn't model is SAID, not faked — the "Real-world layer" (violet register, ≈-prefixed, named public source, always labelled "Real-world estimate — not the simulator"). Sources live in docs/lie-effects-sources.md (Andrew Rice TrackMan wet test, USGA Spin Generation, MyGolfSpy). Gear effect + 3-D spin loft are declared as "not modeled".
4. **Meters + mph**, never yards. **U+2212 (−)** for minus in data text. 10 px type floor. 44 px hit targets.
5. **Ember budget**: ember `#FF8A4D` = live engine truth ONLY, ≤3 ember elements at rest per surface. Gold = XP/reward only. Celebrate magenta = moments only.
6. **One hue, one meaning** (SYS-11): each param hue binds to exactly one physical quantity app-wide (consume `--q-*` aliases).
7. Pre-launch: **noindex** everywhere until launch.

## 3 · DESIGN SYSTEM — "ULTRAVIOLET EMBER" (P3, owner-validated palette; single source = sa-p3.css)
### Palette (exact)
| Role | Token | Value |
|---|---|---|
| Background | `--bg` | `#07060C` |
| Surface | `--surface` | `#110D1C` |
| Plate (glass, on-scene) | `--plate` | `rgba(8,5,14,.86)` |
| Plate (solid, panels) | `--plate-solid` | `#0D0A18` |
| Ink | `--ink` | `#F5F2FF` |
| Muted / Muted-2 | `--muted` / `--muted-2` | `#A79FC7` / `#8E85A8` |
| **Ember (live engine truth ONLY)** | `--accent` | `#FF8A4D` |
| Violet secondary (chrome/labels) | `--secondary` | `#9D8BFF` |
| Celebrate (moments only) | `--celebrate` | `#FF5CE1` |
| Good / Warn / Bad | | `#58E6A8` / `#FFD056` / `#FF7B8A` |
| Reward gold (XP; alias of warn hex, different intent) | `--reward-gold` | `#FFD056` |
| Param: face / path / attack / loft | | `#FF5C6B` / `#6FC6FF` / `#4DE8D2` / `#B9A0FF` |
| Param: launch / plane / depth | | `#E3C468` / `#93A4F2` / `#C98AE6` |
| Ghost (reference traces only) | `--ghost` | `#A7A0C4` |
| Hairline / strong | `--line` | `rgba(255,255,255,.10)` / `.30` |

### Type trio (SYS-01, vendored in vendor/fonts/)
- UI: **Inter** · Display (heroes/headings): **Space Grotesk** · Data (numbers ONLY, tabular, U+2212): **IBM Plex Mono**

### Geometry & motion
Radii: 12 controls · 16 cards · 20 lenses · 999 pills. Ease: `cubic-bezier(.2,.8,.2,1)`; press/nav snap: `cubic-bezier(.23,1,.32,1)`. Press feedback `scale(.97)` on every pressable. Reduced-motion: global kill in sa-p3.css + explicit RM branches (no auto-motion; everything present at full value).

### DEPTH & LIGHT (adopted 2026-07-11 — answer to "dark but flat")
Opt-in `<body class="sa-depth">`: top-lit plate gradients (`#120E20→#0C0916`) with baked-in **1px edge-light** on every card, ambient violet skylight + faint teal floor-glow over bg, `.sa-bloom-ember`/`.sa-bloom-gold` text-glow on live hero values, static 2.8 % film grain. Contrast law: lightest plate `#120E20` keeps muted ≥7:1. Raw tokens unchanged (SVG-fill consumers stay safe). Adopted: academy.html, diagnose-mock, v2 mock. Pending: geometry pair, home, impact, paywall.

### Haptics table (fixed, via sa-haptics.js; web = no-op + log)
slider whole-unit detent = tick · band/category change = light · verdict = light · deliberate nav tap = light · HIT = medium · launch = heavy (the ONLY heavy) · mastery/unlock = success notify · scroll/auto = NEVER.

### A11y contracts (every surface)
Exactly ONE polite live region (260 ms settle), canvases aria-hidden with DOM-mirrored values, real `<input type=range>` with labels + spoken signed values ("minus 3 degrees"), named icon buttons, focus-trapped sheets (Esc + focus return, one level deep), roving-tabindex radiogroups, visible double-ink focus, AA contrast, RM parity. **Paged navigation MUST set `inert` on inactive panes.**

### Voice
Playful-but-precise English. Real terms kept and taught at first use ("spin loft", never dumbed down). Verdicts in display voice. Errors direct, no apology.

## 4 · SURFACES LIVE TODAY (svingbue.vercel.app/…)
| Surface | File | State |
|---|---|---|
| Home (Observatory constellation) | home-mock.html | Showcase: 5 module-stars, comet broadcast of your REAL last shot |
| Impact (live D-plane instrument) | impact.html | Flagship: sliders → live flight, ghosts, predictor. Freemium shot-gate lives here |
| Geometry 3D | geometry.html | **RE-HEROED 2026-07-11**: big ember delivery arrow THROUGH the ball (honest 1:1) shows attack+path live; ATTACK/PATH dominant readout; continuous calm club loop (pausable); FX once on slider change; face-zoom parked behind `?facezoom=1` |
| Strike Window 2D | geometry-window-mock.html | Owner-locked IN (2D+3D pair). Side-on orthographic impact window: draggable ball+low point, true-scale attack tangent, sequence bar, presets, «×4 view» dial |
| Academy tree | academy.html | 24 lessons, Face Angle first (slice story opens the app), Low Point chapter, upcoming-not-locked, collapsed tiers, rank ladder Rookie→Strike Scientist |
| **Backspin v2 lesson (THE TEMPLATE)** | academy-lesson-v2-mock.html | Complete S0–S5. The master mock every lesson copies |
| Diagnose (coach interview) | diagnose-mock.html | v2 interview + v3 values layer: "the slice costs you the fairway, not the yards", half-gap forecast, carry-slider personalization, driver %/degrees-only honesty law, Pro CTA |
| Paywall mock | paywall-mock.html | Needs pay-01..14 fixes (queued) |

## 5 · THE V2 LESSON TEMPLATE (frozen contract — docs/academy-native-v2-spec.md §7)
Surface sequence **S0 Mission → S1 Lab → S2 Influence → S3 Myths → S4 Quiz → S5 Mastery**, plus owner amendments (2026-07-11):
- **FIT LAW**: every surface renders complete in ONE viewport (430×932 AND 375×812), no internal scroll. S1 shows flight strip + hero + sliders simultaneously.
- **PAGED MODULE STEPPER**: horizontal pane swaps; bottom-bar stepper (current step = named pill, others = 44px dot buttons, aria-current, forward gated like Next, `inert` on inactive panes). Long scroll is dead.
- **Nav live-HUD**: if the hero ever scrolls away, the top bar morphs into the live value (iOS large-title grammar) — never adjust blind.
- **Atmosphere imagery**: Mission surfaces may carry a P3-graded, heavily dimmed photo backdrop (scrim ≥.62); imagery otherwise ONLY in the Real-world layer (PeakVisor doctrine: the image is reality; the data explains why). Generated via Nano Banana/Gemini, one shared style-kit prompt.
- Ten components: one box spec (radius 16, top-lit plate, single elevation shadow for floating elements) · mono ember hero + band chip · engine-driven canvas with DOM mirror · 3-cell readout row · 44px slider spec · ONE typed-on stamp per surface · bottom sheets · fixed haptics · image slot · ≤50 visible words per surface.
- **Impact cluster exception** (2D window & instrument surfaces): Attack + Path as ONE primary object replaces the one-stamp law.
- **Global readout law**: Attack over Path — same mono/size/param-hues/placement in Impact, Academy, 2D and 3D. The app is learned once.

## 6 · WHAT IS TO BE IMPLEMENTED (the queue, in order)
1. **Academy content batch 1** — roll the v2 template to the first 8 lessons: Face Angle, Club Path, Face-to-Path, Spin Axis, Curve, Launch Angle, Dynamic Loft, Attack Angle. Each judged against the frozen §7 contract. Facts from the lesson JSON models; engine-verified numbers; NO TrackMan University dependency (dropped by owner).
2. **Strike Window 2D porting** into the app — acceptance criteria = docs/strike-window-consensus.md: both views are live instruments with the same slider dock; 2D owns contact diagnosis (sequence bar, strike height mm, turf) / 3D owns delivery geometry (arrow, plane, loop); symmetric «View in 2D/3D» in identical positions; dial relabeled «×4 · diagnostic view»; sequence bar = 2D-exclusive superpower, elevated via own plate + "BALL FIRST" typography + category-shift haptic (cause→consequence hierarchy: Attack+Path → Sequence → Ball flight).
3. **Depth & Light adoption** on geometry pair, home, impact, paywall (add `sa-depth`, verify per-page).
4. **Paywall fixes** (docs/paywall-verdict.md pay-01..14): P3 repaint (not cyan), prices 99/399/999, "Save 66%", text/viewport bugs, what-stays-free, ≈kr33/mo anchor. PLUS: a new freemium gate point for Geometry (the ambient loop no longer counts shots — gate must move or Geometry becomes ungated).
5. **Zeigarnik/streak spec** (owner-approved direction): Academy = the streak surface (one lesson surface/day counts, streak freeze mercy, gold flame), Zeigarnik open loops (next star teased, "1 lesson away"), habit cue = push notifications (native phase), "tame your pattern" framing (the shrinking miss as the tamagotchi — NO mascot).
6. **Style-kit imagery** for remaining lessons (Nano Banana, P3-graded dusk world, ~1–2 NOK/image, declared).
7. Outcome page 83→90 polish rest · Apple cert + Codemagic upload (owner does 2FA).

## 7 · KEY FILES
- `sa-p3.css` — design system source of truth (tokens, SYS laws, depth layer, RM kill)
- `impact-flight.js` + `swing-parameters-and-impact.js` — THE ENGINE (read-only, byte-identical)
- `sa-haptics.js` — haptics singleton · `vendor/fonts/` — type trio
- `docs/DESIGN-SYSTEM.md` — full reference (CSS wins on conflict)
- `docs/academy-native-v2-spec.md` — frozen lesson contract §7 + amendments
- `docs/strike-window-consensus.md` — 2D/3D pairing verdicts
- `docs/geometry-rehero-spec.md` — the 3D pivot (arrow hero, loop, parked face-zoom)
- `docs/lie-effects-sources.md` — the ONLY permitted real-world numbers
- `docs/paywall-verdict.md`, `docs/academy-path-verdict.md`, `docs/diagnose-v3-values-spec.md` — queued work orders
- `docs/claude-design-brief/lesson-backspin.json` — content model shape for lessons

*Working doctrine: mock-before-lock (visual choices are deployed and seen by the owner before they become law) · a11y-lead review before every ship · headless Playwright verification with numeric asserts (no "looks right" claims) · deviations from any contract are declared in one line, motivated by the learning point, never by variety.*
