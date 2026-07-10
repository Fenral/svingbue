# StrikeArc Home — Creative Concepts (Fable synthesis, 2026-07-10)

**Input:** `docs/home-creative-research.md` (8 mechanic families, 16 guardrails, 7 gaps). **Owner's ask:** NOT the classic list of buttons — an uncommon blend of motion and interactive targets.
**Deliverable:** three interactive mocks — `home-concept-1.html`, `home-concept-2.html`, `home-concept-3.html` — deployed side by side so the owner can *feel* them, then pick (mock-before-lock).
**Locked context every concept obeys:** P3 Ultraviolet Ember (`sa-p3.css` consumed READ-ONLY — punch-list workflows own that file right now; do not edit it, and do not edit `home-mock.html`), landscape 932×430 + 812×375, range-33 backdrop + night grade available, engine files byte-identical read-only, English UI, data-alive stat contract (`sa.stat.*` localStorage keys — read `home-mock.html` for the exact keys and staleness rules; READ that file only). Destinations: Ball Flight (`impact-viz-mock.html`), Outcome (`impact-outcome-mock.html`), Strike Window (`geometry-window-mock.html`), Academy (`academy.html`); Diagnose (`diagnose-mock.html`) appears as a quiet 5th where noted.

**Pass/fail floor:** the 16 "Non-negotiable guardrails" in the research doc. The five most at-risk here: reduced-motion branch for EVERYTHING (¶1), no gesture-only affordances (¶2), ≥44px hit targets even on moving elements (¶3), hit-testing during motion (¶4), entry choreography ≤2s and skippable (¶13). Ember budget law from `sa-p3.css` holds: ≤3 ember elements at rest.

**Shared garnish (all three, cheap):** subtle IMU idle-parallax when landscape-held (gap #7; `deviceorientation` behind the iOS permission gesture, silent math fallback — never required); pause all ambient loops on `visibilitychange` (¶14).

---

## K1 — «FLOODLIGHTS» · The range IS the menu (families A2+A3+G1, gaps #5)

**Fantasy:** there is no menu. You are standing at a night range that exists whether you open the app or not, and the app's modules are *places in it*.

**Scene (932×430):** full-bleed range-33 world built as 2.5D parallax planes (sky / treeline / mid-field / foreground turf; DOM layers + `translate3d`, one canvas reserved for the ember ball/tracer only).
Destinations are lit places at true depths, left→right following the ball's own journey:

- **The tee** (foreground left): ball resting on the lit mat, small plate `BALL FLIGHT · 162 m` — the closest, warmest place. First-run: this is START HERE.
- **The strike window**: a faint etched-glass rectangle hanging over the tee line (violet hairlines), plate `STRIKE WINDOW · 87% FLUSH`.
- **The landing green** (mid-field right): rings + plates downrange, `OUTCOME · 16 m L`.
- **The academy tower**: the far floodlight mast whose lamp head glows a touch warmer, plate `ACADEMY · LVL 7`.
- **Diagnose (quiet 5th):** a ghost tracer in the grass ending in a violet `?` — `WHY DID IT DO THAT?`.

**The mechanic:** tapping a place makes the camera *travel there* — one GSAP ease of the world container (scale+translate toward the place, ~650 ms, `pointer-events:none` during flight, amplitude capped per vestibular guardrail ¶8) and the module opens **by arrival** (navigate at the apex of the zoom, so the module's own entrance completes the move; never a hard cut mid-scene).
**Aliveness:** Alto's-style — the range runs on its own: every ~20 s a lazy ambient ember tracer arcs downrange and its ghost stays faintly in the grass (session memory, gap #5 — the range remembers you); floodlights breathe almost imperceptibly; haze drifts. **Boot (once per session):** ≤1.8 s — floodlight poles kick on one by one down the range, plates resolve last; any input skips it (¶13).
**Blend of motion + buttons:** the buttons *are* scenery that light up; a slow parallax drift (≤8 px) follows a horizontal drag anywhere, making the world graspable without ever being required.

**A11y skeleton:** the five places are REAL `<a>` elements in logical DOM order (tee → window → green → tower → ghost), each ≥44px hit plate, `.sa-focus` double ring rendered as a lit outline *in the world*, screen-reader names = destination + live stat. Reduced motion: static wide shot, no boot, no ambient tracer, camera-travel becomes an instant navigation. Scene canvas `aria-hidden` + offscreen text alternative.

**The ONE thing:** selection = *travel*. If flying to the landing green doesn't feel like walking down the range, the concept fails.

---

## K2 — «SUMMON» · Press the ball, the app orbits it (families C1+C2+C3+F1, gap #6)

**Fantasy:** total darkness. One ember ball breathing mid-frame — the app's only light. You *summon* the app out of the dark; it was never a page.

**Scene:** near-black (deep UV vignette, no photo backdrop — this concept is the anti-scene). The ember ball floats center-left, slow 4 s breath (scale 1→1.03 + glow). Beneath it, one quiet line: `Hold the ball` (11px `--muted`), plus a plain `MENU` text-button top-right (the mandatory non-gesture path, ¶2).

**The mechanic:** press-and-hold the ball (or tap MENU): five dark-glass tiles **fan out of the ball** into an elliptical orbit around it (GSAP timeline, 500 ms, stagger 40 ms), rim-lit only on the ball-facing edge (radial-gradient rim trick — no real lighting). Tiles: BALL FLIGHT · OUTCOME · STRIKE WINDOW · ACADEMY · DIAGNOSE, each carrying its live stat in mono.
- **Drag the ring** → it rotates with momentum (hand-rolled spring/verlet, ~5 nodes — no libs), **haptic detent** as each tile crosses the front position (`sa-haptics.js` tick; silent on web).
- The front tile is enlarged and focused; **tap it → it swallows the screen** (GSAP scale from its own position to full viewport → navigate; spatial continuity per watchOS C2).
- Idle with the ring open: tiles sway microscopically on invisible threads (verlet mobile, gap #6 — flick a tile and its neighbors react).
- Tap the dark / Esc → the ring collapses back into the ball.

**Colour law:** the ball is the ONLY ember. Tiles are dark chrome (`plate-solid`, `--line-strong` edges), stats in ink mono, violet secondary for the rim of the focused tile. Ember count at rest: 1.

**A11y skeleton:** the five tiles exist permanently in DOM as buttons (visually hidden while collapsed, revealed when fanned; `aria-expanded` on the ball, which is itself a real button `aria-label="Open StrikeArc menu"`). MENU button opens the ring identically without any hold. Keyboard: Tab reaches ball/MENU → arrow keys rotate the ring (roving tabindex), Enter enters. Moving tiles keep ≥44px hit and stay tappable mid-motion (grab-in-flight inherits position, ¶3-4). Reduced motion: hold/tap reveals the ring instantly as a static ellipse, swallow becomes a fade-cut; no breathing, no sway.

**The ONE thing:** the summon. Press-hold → dark glass unfurling around the one hot light must feel like *waking an instrument*, not opening a drawer.

---

## K3 — «THE ARC» · Your last shot is the menu (families D1+D2+E1+F1, gap #1-ready)

**Fantasy:** no menu, no scene *around* the content — the home IS one frozen ball flight, wall to wall, and you hold it in your hand. Navigation is literally learning ball flight: the modules live at the phases of the shot.

**Scene (932×430):** one ember arc spans the full viewport over a minimal night-void (faint horizon line, range rings) — the user's actual last shot solved honestly through `solveFlight` (import `impact-flight.js` read-only; fall back to a canonical beautiful demo shot when no stored shot exists — never fake numbers). The ball sits ON the arc as a bright bead. Under the horizon: a thin XP band (Academy's rim presence).

**The mechanic (Moonlitt move):** drag ANYWHERE — the ball scrubs along its own frozen trace, and the readout at your fingertip morphs live (height, distance, curve at that exact point — real interpolated `trajectorySamples` values in mono). The arc is the scrubber; there is no scrubber widget.
**Stations** sit at the physics moments, in cause→effect order (the pedagogy IS the nav):

- **Address/impact** (arc start): `STRIKE WINDOW — how it's made`
- **The flight** (mid-arc): `BALL FLIGHT — fly it`
- **Apex** (top): violet `WHY?` tag → `DIAGNOSE`
- **Landing** (arc end): `OUTCOME — read it`
- **The rim** (bottom band): `ACADEMY · LVL 7 · XP bar`

Scrubbing INTO a station's capture zone: the station plate brightens + **haptic detent** + the ball settles magnetically onto the station point (spring `linear()`); its plate becomes the primary action — tap → enter (plate grows to swallow, then navigates). Stations are ALSO directly tappable at all times, no scrubbing required (¶2).
**First-run:** the demo shot draws itself once (tip-led, ≤1.6 s, skippable), then `Drag the ball` hint appears once.

**Colour law:** arc + ball + the currently-armed station value = the ember budget (≤3). Other stations rest as ink/violet plates.

**A11y skeleton:** stations are real buttons in DOM order (strike window → ball flight → diagnose → outcome → academy) with live-stat names; scrub has keyboard parity (arrow keys step the ball between stations; Home/End to ends); one polite live region announces station arming (`Outcome — 162 metres, 16 left. Press Enter to open.`); reduced motion: no draw-on, no magnetic settle animation (instant snap), scrub still works (motion of the scrub itself is user-driven = allowed, but provide the arrow-key path). Canvas `aria-hidden` + text alternative describing the shot.

**The ONE thing:** the fingertip readout. Numbers morphing under your thumb as you drag the ball along its own flight must feel like holding the shot — if it reads as "a chart with a slider," it fails.

---

## Build & verification contract (all three)

- **Files:** each concept is ONE self-contained html at repo root + shared read-only deps (`sa-p3.css`, `sa-haptics.js`, engine for K3). No edits to any existing file.
- **Tech:** vanilla JS + GSAP (vendored path used by existing pages) + one canvas max per page for ember work; all chrome motion on compositor (`transform`/`opacity`); 60fps with tracer running; DPR cap 2.
- **States each mock must actually implement:** first-run (no `sa.stat.*`), returning-with-stats (seed script provided in-page via `?seed=1` query for review), reduced-motion, keyboard-only pass.
- **Verification per mock (workflow):** all 16 guardrails as pass/fail checklist with DOM/measured evidence; keyboard walkthrough; reduced-motion screenshot pair; ember count at rest; 0 console errors; both viewports. Craft: P3 token discipline (no freelance hexes; type roles per SYS-01 once punch-list A lands them — use `.sa-ui/.sa-display/.sa-data` classes if present, system stack fallback if not yet).
- **Not in scope:** replacing `home-mock.html` (it remains baseline + fallback), production wiring, sound (K3 is sonification-*ready*, ship silent).

— Fable 5, design director
