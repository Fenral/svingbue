# StrikeArc — Native Readiness Audit (Capacitor Packaging Gate)

**Date:** 2026-07-02
**Scope:** `https://svingbue.vercel.app` — `/` (index), `/geometry.html`, `/impact.html`
**Method:** Read-only. Headless Playwright (Chromium 1.60) against production; static grep against source in `svingbue/`. No app files modified.
**Target device profile:** landscape phone, ~740×416 to ~900×470 CSS px, notch/home-indicator present (iPhone-class).

---

## 1. Viewport / meta

| Page | `viewport-fit=cover` | `user-scalable` restriction | `theme-color` | `robots` |
|---|---|---|---|---|
| index.html | ✅ (`width=device-width, initial-scale=1.0, viewport-fit=cover`) | none present (no `maximum-scale`/`user-scalable=no`) | ❌ absent | `noindex` |
| geometry.html | ✅ same | none | ❌ absent | not checked (inherits noindex pattern) |
| impact.html | ✅ same | none | ❌ absent | not checked |

All three pages declare `viewport-fit=cover` correctly and do not disable pinch-zoom. **Landscape assumption is explicit and by design**: `index.html`'s `.shell` background is a single landscape hero image (`home-diag-landscape.png`), and `geometry.html`/`impact.html` both ship an explicit `.rotate` portrait-blocking overlay (`@media (orientation:portrait){.rotate{display:flex}}`). This is a deliberate landscape-only app, not an oversight — see §8.

**Verdict: PASS** (all 3 pages).

---

## 2. Safe-area coverage

Grep for `env(safe-area-inset-*)` across the three production pages:

| Page | Safe-area usages | Elements NOT using safe-area that touch raw viewport edges |
|---|---|---|
| index.html | 2 (`.wordmark` top, `.topstrip`/`.modnav` left) | `.zone` hit-areas run edge-to-edge (`inset:0`) by design — they are full-bleed background tap targets, not content, so this is fine. `.content` blocks (GEOMETRY/IMPACT labels) are inset via `padding:clamp(20px,4vw,52px)` from a `.zone`, not from the true viewport edge — **on a landscape notch, the top-left `.geo .content` label block and bottom-right `.imp .content` block do not add safe-area padding on top of their clamp() padding.** At clamp(20px) minimum, a left-side notch (home-indicator side in landscape) could clip the "GEOMETRY" label's first few characters on some notch geometries. |
| geometry.html | 12 (topstrip, title, modnav, controls, coachmark anchors, rotate hint N/A) | None found — every fixed-position chrome element (`.title`, `.modnav`, `.controls`) uses `max(Npx, env(safe-area-inset-*))`. Good coverage. |
| impact.html | 20 (topstrip, flightClose, flightReplay, ghostPill, ghostClear, fDelta, flightCarry, fData grid) | None found for chrome; flight-overlay close/replay/ghost buttons and the post-swing data grid all correctly use `max()`/`calc()` with `env()`. |

**Concrete gap:** `index.html` — the `.content` label blocks (`GEOMETRY`/`IMPACT` zone labels and the "Enter →" pills) are positioned via `.geo .content{top:40px;left:0}` / `.imp .content{bottom:0;right:0}` with only `clamp(20px,4vw,52px)` internal padding — **no `env(safe-area-inset-left)`/`env(safe-area-inset-right)` added**. In landscape with a physical notch/pill on the left or right (depending on device rotation), this is the one place on index.html where inset coverage is genuinely thinner than on the other two pages. Low visual risk (clamp min 20px is close to typical safe-area widths ~24–34px) but not proven-safe.

**Verdict: PASS (geometry, impact) / PASS-WITH-GAP (index — P1)**

---

## 3. Touch targets (44×44 CSS px minimum)

Measured live via `getBoundingClientRect()` at both required viewports. Results identical at 740×416 and 900×470 (layout doesn't change target sizing between these two, only horizontal position).

| Page | Elements measured | Under 44px | Detail |
|---|---|---|---|
| index.html | 5 (2 nav links, home icon, 2 full-bleed zone links) | **0** | All zone tap targets are full-viewport-half size; nav pills meet 44px. |
| geometry.html | 10 (nav ×3, viewBtn, tuneBtn, strikeBtn, hit, helpBtn, coachmark Skip/Next) | **0** | Every control measures exactly 44×44 or larger — `min-height:44px` is correctly applied everywhere. |
| impact.html | 20 (nav ×3, seg ×3, playpill, helpBtn, + flight-overlay controls) | **8** | See below. |

**impact.html violations (both 740×416 and 900×470, and 640×360):**

| Element | Selector | Measured size | CSS rule at fault |
|---|---|---|---|
| Home icon | `.modnav a.home` | 30×30 | `impact.html` line 48: `.modnav a{height:30px;...}` — **differs from `index.html`/`geometry.html`'s `min-height:44px` rule for the same class** |
| "Geometry" tab | `.modnav a.tab` | 59×30 | same |
| "Impact" tab | `.modnav a.tab` | 45×30 | same |
| "Direction" segment | `#segDir` (`.seg button`) | 72×30 | line 76: `.seg button{height:30px;...}` |
| "Launch" segment | `#segLaunch` | 61×30 | same |
| "Flight" segment | `#segFlight` | 55×30 | same |
| "▶ Play flight" | `.playpill` | 82×30 | line 94-95: `.playpill{height:30px;...}` |
| Help "?" button | `#helpBtn.sa-help` | 30×30 | line 93: `.ts-right .sa-help{width:30px;height:30px;...}` |

All eight sit inside `impact.html`'s `.topstrip{height:40px}` — the entire top control row is 40px tall (vs. 44px+ elsewhere), so no control in that row can reach 44px without either growing the strip or overlapping. This is the single largest concrete regression relative to geometry.html, which achieves 44px targets in a comparable top strip.

Flight-overlay-specific controls (`.flightClose`, `.flightReplay`, `.ghostPill`, `.ghostClear`) were not separately isolated in the measurement pass but are declared `width:36px;height:36px` in CSS (see §5) — also under 44px, confirmed by source read (impact.html lines 519, 524, 531, 542).

**Verdict: PASS (index, geometry) / FAIL (impact) — P0**

---

## 4. Hover-first / touch-equivalent audit

Grep for `:hover` across the three pages found hover rules only as **enhancements** layered on top of always-visible or focus-visible-equivalent state — no functionality is hover-gated with no touch/tap fallback:

- `index.html` `.zone:hover .enter{opacity:1}` — the "Enter →" pill is **already visible at `opacity:.92` by default** (see `.enter` base rule, line 56-59); hover/focus only brightens it further. Not hover-only.
- All `button:hover`, `.chip:hover`, `.mcard:hover`, `.tcell:hover`, `.cell:hover` rules pair with either a `:focus-visible` twin or are purely cosmetic (background tint) with the base state already interactive/tappable.
- `title="..."` attributes exist on 6 buttons (helpBtn, viewBtn, tuneBtn, strikeBtn, hit, helpBtn again on impact) — every one of them also carries an `aria-label` with the same or richer text, so there is no information conveyed only via a hover tooltip.
- No `cursor`-dependent logic (no `mousemove`-only drag handlers found outside of pointer-event-based sliders — see §9).

**Verdict: PASS** (all 3 pages) — no touch-inaccessible hover-only affordances found.

---

## 5. Overflow / overlap (740×416 and 640×360, incl. flight overlay + popovers)

Automated DOM-overflow probe (`scrollWidth`/`scrollHeight` vs `innerWidth`/`innerHeight`, plus per-element right/left-edge bleed) at both viewports, all three pages, and impact.html with the flight overlay opened (`.playpill` click → 2.5s wait):

| Page / State | 740×416 | 640×360 | hScroll | vScroll |
|---|---|---|---|---|
| index.html | 0 offenders | 0 offenders | 0px | 0px |
| geometry.html | 1 flagged (false positive — see below) | same | 0px | 0px |
| impact.html (base) | flagged offenders are SVG-internal `<g>/<rect>/<image>` nodes, not real overflow | same | 0px | 0px |
| impact.html (flight overlay open) | 6 flagged (all SVG-internal) | not separately tested | 0px | 0px |

- The geometry.html "offender" is `.lp3d-label`, which carries the `hidden` attribute (`<div class="lp3d-label" id="lp3dLabel" hidden aria-hidden="true">`) and is `display:none` by rule `.lp3d-label[hidden]{display:none}` — a false positive from the generic bounding-box probe (hidden elements still report a stale rect in some engines). **Not a real overflow.**
- The impact.html flight-overlay "offenders" are children of an inline SVG (`<g>`, `<rect>`, `<image>`, `<line>`) whose local coordinate space legitimately extends past the SVG viewBox as part of the flight-path drawing — this is normal SVG content, not page/document overflow. Both `hScrollPx` and `vScrollPx` measured **0** in every case, confirming no actual horizontal/vertical scroll or clipped-text risk was found.

No genuine overflow, clipping, or element-overlap was detected on any page at either landscape size, including with the flight overlay and its data-chip grid open.

**Verdict: PASS** (all 3 pages, all tested states).

---

## 6. Performance / page weight

Network totals captured via Playwright `networkidle` + response-body byte counts, `devicePixelRatio:3` (worst-case for image transfer):

| Page | Requests | Total transfer | Breakdown |
|---|---|---|---|
| index.html | 5 | **700 KB** | image 607 KB (`home-diag-landscape.png`), script 85 KB (GSAP 70 KB CDN + sa-firstrun 13 KB), doc 16 KB, css 9 KB |
| geometry.html | 22 | **1,894 KB** | script 1,656 KB — dominated by `three.module.js` **1,243 KB** (unminified dev build) + `GLTFLoader.js` 106 KB + `facezoom.js`/other geo3d modules ~120 KB combined + GSAP 70 KB CDN; fetch 225 KB (`club7.glb`); doc 49 KB; css 9 KB |
| impact.html | 7 | **1,038 KB** | image 712 KB (`range-day.png`), script 111 KB (GSAP 70 KB CDN + sa-firstrun 13 KB + sa-haptics 7 KB + impact-flight.js 17 KB), doc 226 KB, css 9 KB |

**Notable:**
- `vendor/three/build/three.module.js` is **1.24 MB unminified** — this is the single largest asset across the whole app and is loaded on every geometry.html visit. A production/minified Three.js build would very likely cut this by 60-70%. This matters doubly for native: Capacitor ships the bundle in the binary (bigger IPA/APK) *and* still parses/executes it on every cold launch on weaker mobile CPUs.
- Hero/background PNGs (`home-diag-landscape.png` 593 KB, `range-day.png` 696 KB) are uncompressed-feeling for what are essentially decorative photo backgrounds — no WebP/AVIF variant detected, no responsive `srcset`.
- Console/long-task sniffing during playback: geometry.html emitted 4 benign WebGL driver performance warnings (`GPU stall due to ReadPixels`) during swing playback — informational only, not errors; this is a headless/software-GL artifact and the caveat about headless rAF-throttling applies (real on-device frame timing was not measured). impact.html emitted only debug-level haptics logs (`[haptic] impact:medium/heavy`) during flight playback, no warnings or errors on either page. index.html: no console output at all.
- No page produced a `pageerror` (uncaught exception) on load or during interaction.

**Verdict: PASS-WITH-CONCERNS** — no hard failures, but geometry.html's payload (1.9 MB, dominated by an unminified Three.js) is the clearest performance risk for a native shell; **P1**.

---

## 7. CDN / external dependencies

Grep for `<script src=` / `<link href=` pointing at non-relative origins, cross-checked against live network capture:

| Page | External origin | Resource | Size |
|---|---|---|---|
| index.html | `cdnjs.cloudflare.com` | `/ajax/libs/gsap/3.12.5/gsap.min.js` | 72 KB (70 KB transfer) |
| geometry.html | `cdnjs.cloudflare.com` | same GSAP URL | same |
| impact.html | `cdnjs.cloudflare.com` | same GSAP URL | same |

**This is the single most important finding for native packaging.** All three pages load GSAP from a public CDN at runtime (`https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js`). A Capacitor-wrapped app with no network connectivity (airplane mode, weak signal, first-run before any cache is warm) will fail to load GSAP, and every page's coachmarks/splash/haptics-adjacent animation code that depends on `gsap` will throw or silently no-op depending on how defensively it's guarded. No other CDN dependency (fonts, analytics, icon fonts) was found — this is the only external origin referenced anywhere in the three production pages or their JS.

No web font CDN was found; the font stack is entirely system fonts (`"SF Pro Display",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif`), which is actually a plus for native (SF Pro is free on iOS, and there's no FOUT/network-font risk at all).

**Verdict: FAIL — P0.** GSAP must be vendored locally (a local copy under `/vendor/` alongside the existing `vendor/three/` pattern already used in this repo) before Capacitor packaging.

---

## 8. App shell (offline, icons, storage, console)

| Item | Finding |
|---|---|
| Service worker | **None registered.** No `serviceWorker` reference anywhere in source. Expected/acceptable for a Capacitor wrap (native shell replaces the need for SW-based offline caching of the shell itself), but combined with the CDN dependency in §7, there is currently **zero offline resilience** — a cold, no-network launch will fail to execute GSAP-dependent code paths. |
| App icons | **Only a single inline data-URI SVG favicon** (`<link rel="icon" href="data:image/svg+xml,...">`) shared identically across all three pages. **No `apple-touch-icon`, no `manifest.json`, no PNG/ICO icon set of any kind** was found in source or served. This is fine for Capacitor packaging itself (native app icons are supplied separately via Xcode/Android Studio asset catalogs, not pulled from the web layer), but there is no existing icon asset in this repo suitable for that native icon generation step — a fresh icon set will need to be produced from scratch. |
| `theme-color` meta | Absent on all three pages. Minor: affects Android Chrome/some WebView chrome tinting, not a native-Capacitor blocker per se, but cheap to add for polish. |
| localStorage keys | `sa_swing` (set on geometry.html, holds last-swing JSON) is the only key observed being written during a live session. `sa-haptics.js` additionally defines (but did not fire during this session) a `sa_haptics` boolean preference key, and `sa-firstrun.js` defines generic safe get/set helpers presumably used for a first-run/coachmark-seen flag (key name not observed live in this pass — the coachmark did not fire a distinct localStorage write during the automated session, likely because it's gated on a first-visit condition already satisfied by prior Playwright runs in this same browser context, or by a session/date-based fallback). All localStorage access in `sa-firstrun.js`/`sa-haptics.js` is defensively try/catch-wrapped ("storage being unavailable is non-fatal" — confirmed by source comment), which is exactly the right pattern for a WKWebView/Capacitor context where storage partitioning can behave unexpectedly. |
| Console errors/warnings on load | **None on index.html or impact.html.** geometry.html produced 4 benign WebGL driver performance warnings during swing playback (GPU stall due to ReadPixels — software/headless rendering artifact, not expected to reproduce identically on-device). No `pageerror` (uncaught JS exception) fired on any page in any tested state. |

**Verdict: PASS (console clean) / FAIL (offline resilience, due to §7 CDN dep) / GAP (icons — expected pre-work, not a code defect) — offline resilience is P0, icons is P1 (asset production, not audit-blocking).**

---

## 9. Orientation behavior

| Page | Portrait behavior |
|---|---|
| index.html | **No rotate-hint found.** No `.rotate` element and no `@media (orientation:portrait)` rule exists in index.html. At 390×844 (portrait phone), the page will render its landscape hero-image `.shell` background using `cover`, and the two diagonal `.zone` tap targets, without any explicit warning or lockout. Given the other two pages both explicitly block portrait, this is an **inconsistency**: either portrait should be supported intentionally on the landing page, or it should carry the same rotate-hint for consistency before shipping as a native app (where orientation lock is typically enforced at the native-shell level anyway, making this mostly a defense-in-depth gap rather than a functional bug). |
| geometry.html | `.rotate{display:none}` by default, `@media (orientation:portrait){.rotate{display:flex}}` — confirmed live: at 390×844 portrait, `.rotate` computed `display:flex` (visible), full-screen (`position:fixed;inset:0;z-index:9`), with an animated tilt-phone icon. Functions as designed. |
| impact.html | Same pattern, `z-index:60`, confirmed live: `display:flex` at 390×844. Functions as designed. |

**Verdict: PASS (geometry, impact) / GAP (index — no explicit handling, though likely moot if native shell enforces landscape lock) — P2.**

---

## 10. Gesture conflicts (iOS edge-swipe / scroll)

Checked slider (`input[type=range]`) horizontal position relative to the 0px/viewport-width edges, at 740×416, both pages, with the relevant panel opened (geometry's "tune" panel via `#tuneBtn`, impact's "Flight" segment via `#segFlight`):

| Page | Slider | Left edge | Right edge | Risk |
|---|---|---|---|---|
| geometry.html | `#s_plane`, `#s_dir`, `#s_lpx`, `#s_lpz` | 483px | 713px | None — panel sits well clear of both edges (viewport width 740px), 27px clearance from the right edge. |
| impact.html | `#s_speed` | 412px | 509px | None. |
| impact.html | `#s_face` | **18px** | 249px | **iOS's edge-swipe-back gesture hot zone is roughly the outer ~20px of the screen in landscape.** This slider's thumb can be dragged from a starting position as close as 18px from the left edge — a user's initial touch-down near the far-left of the thumb's travel range is inside or adjacent to that hot zone, risking an accidental back-navigation gesture instead of a slider drag (this app has no back-navigation to trigger client-side, but in a Capacitor WKWebView with native swipe-back enabled, the OS gesture recognizer can still intercept the touch before JS sees it). |
| impact.html | `#s_path` | 259px | 489px | None. |
| impact.html | `#fSpeedRange` (flight overlay) | 91-95px | 109-113px | None — comfortably clear. |
| impact.html | `#s_attack`, `#s_loft` | not measured (0×0 — hidden, "Impact" segment tab not active during this pass) | — | Not verified; same D-plane slider component/styling as `#s_face`/`#s_path`, worth spot-checking once native-swipe-back is enabled, since they likely share the same left-edge-adjacent layout. |

No other edge-hugging draggable/pointer-drag elements were found (the two-way arrow drag handles on impact.html's SVG diagrams are drawn well inside the viewBox, not screen-edge-adjacent).

**Verdict: PASS-WITH-ONE-GAP** — `#s_face` (and likely `#s_attack`, same component) sits close enough to the left screen edge to risk fighting iOS's native swipe-back gesture if that gesture is left enabled in the Capacitor shell. **P1** (mitigation is typically done at the native-shell level — disable edge-swipe-back for this view — rather than in web CSS, but flagging so it's on the Capacitor config checklist).

---

## 11. Verdict table

| # | Check | index.html | geometry.html | impact.html | Priority if FAIL |
|---|---|---|---|---|---|
| 1 | Viewport meta (`viewport-fit=cover`) | PASS | PASS | PASS | — |
| 2 | Safe-area coverage | PASS-WITH-GAP | PASS | PASS | P1 (index label insets) |
| 3 | Touch targets ≥44px | PASS | PASS | **FAIL** (8 controls @ 30px) | **P0** |
| 4 | Hover-only affordances | PASS | PASS | PASS | — |
| 5 | Overflow/overlap (incl. flight overlay) | PASS | PASS | PASS | — |
| 6 | Page weight / performance | PASS | PASS-WITH-CONCERNS (1.9MB, unminified three.js) | PASS | P1 |
| 7 | CDN dependency (GSAP) | **FAIL** | **FAIL** | **FAIL** | **P0** |
| 8a | Service worker | N/A (none, expected) | N/A | N/A | — |
| 8b | App icons / manifest | GAP (none exist) | GAP | GAP | P1 (asset production) |
| 8c | Console errors on load | PASS | PASS (warnings only) | PASS | — |
| 8d | localStorage usage sane/guarded | PASS | PASS | PASS | — |
| 9 | Orientation / portrait handling | GAP (no rotate-hint) | PASS | PASS | P2 |
| 10 | Gesture conflicts (edge-swipe) | N/A (no sliders) | PASS | PASS-WITH-GAP (`#s_face` @ 18px) | P1 |

---

## Prioritized fix list

### P0 — must fix before Capacitor packaging
1. **Vendor GSAP locally.** Replace `<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js">` (present identically in `index.html:178`, `geometry.html:358`, `impact.html:1167`) with a local copy, e.g. `vendor/gsap/gsap.min.js`, following the same pattern already used for `vendor/three/`. Without this, the app cannot function offline/without network on first launch — a hard requirement for a native app.
2. **Fix the impact.html top-strip touch targets.** `impact.html` lines 45-49 (`.modnav a{height:30px}`), line 73-76 (`.seg button{height:30px}`), line 93 (`.ts-right .sa-help{width:30px;height:30px}`), line 94-96 (`.playpill{height:30px}`) all need to reach a 44px effective tap target — either raise `.topstrip{height:40px}` (line 36-38) to accommodate 44px controls with padding, or keep the visual height at 30px but add invisible hit-area padding (`::before` pseudo-element with negative-margin, or CSS `padding`-based touch-target expansion) so the *tappable* area is 44px even if the visual chrome stays compact. `geometry.html`'s equivalent top strip already does this correctly (`min-height:44px` on `.modnav a` there) and should be the reference implementation.

### P1 — should fix
3. **Add safe-area insets to index.html's `.content` label blocks** (`.geo .content`, `.imp .content`, lines 44-46) so the GEOMETRY/IMPACT labels and "Enter →" pills don't rely solely on `clamp(20px,4vw,52px)` padding near a notch/home-indicator edge in landscape.
4. **Minify/trim the Three.js bundle on geometry.html.** `vendor/three/build/three.module.js` (1.24 MB) is the largest single asset in the app and is unminified; a production build (or tree-shaken subset covering only the modules actually imported) would meaningfully cut geometry.html's 1.9 MB page weight and reduce native binary size + cold-launch parse time.
5. **Move edge-adjacent sliders off the iOS swipe-back hot zone**, or explicitly disable native edge-swipe-back for these views in the Capacitor config. `impact.html`'s `#s_face` slider (and likely `#s_attack`, same D-plane component, not fully verified this pass) starts as close as 18px from the left screen edge.
6. **Produce a native icon set / manifest.** No `apple-touch-icon`, PNG icon set, or `manifest.json` exists anywhere in the repo today — only a shared inline SVG favicon. Needed before Capacitor's icon-generation tooling (`@capacitor/assets` or equivalent) has anything to work from.

### P2 — nice to have
7. **Add a portrait rotate-hint (or explicit orientation-lock rationale) to index.html** for consistency with geometry.html/impact.html, even though native orientation lock likely makes this moot once wrapped.
8. Add a `theme-color` meta tag to all three pages for native WebView chrome tinting consistency.

---

## Notes on method

- Live audit used a headless Chromium 1.60 instance (own Playwright script, not the shared MCP browser session) with `hasTouch:true, isMobile:true, deviceScaleFactor:3`, navigating with `waitUntil:'networkidle'` and an additional 1.5s settle before measurement.
- Touch-target and overflow measurements were taken via `getBoundingClientRect()` against a curated selector list covering all interactive/pill/chip/segment/close-button patterns visible in source; results were cross-checked against source CSS to explain root cause for every flagged element.
- Long-task/rAF sampling during swing (geometry) and flight (impact) playback was attempted but is subject to the known headless-throttling caveat noted in the audit brief — reported findings for §6 rely primarily on static asset size/count as the more reliable signal, with console output used as a secondary (informational-only) signal.
- No app source files were modified. This report and the `docs/` directory containing it are the only filesystem writes made during this audit.
