# Geometry rethink — verdict + three concepts

**Date:** 2026-07-10 · **Author:** Fable 5 (design-director pass, spec only — no code touched)
**Inputs read:** `geometry-mock.html` (rounds 1–4 header + runtime), `swing-parameters-and-impact.js` (full), `impact-viz-mock.html` (idiom skim), `geo3d-mock/groundcontact.js` (located `groundCrossingTheta0`).
**Non-negotiable:** the engine `swing-parameters-and-impact.js` stays byte-identical. Everything below is a consumer.

**The goal, restated as an acceptance test:** with the screen at rest, a learner can read — without tapping anything —
(a) attack angle, (b) club path, (c) strike height on the face (mm), and (d) whether the club meets the **ground before or after the ball**; and when they change any of the 5 inputs (direction, plane, low-point X, depth, ball position) they **see those four answers move, against what they were a moment ago**.

---

## Part 1 — Verdict

**Yes, the plot was lost — but not everywhere, and the wreckage contains the correct screen in miniature.** The current mock renders the *causes* in loving 3D while the four *effects* are the least visible things on the page. Specifics:

### Where it lost the plot

1. **The outputs have no numbers at rest.** Round 4 removed the attack/path value chips; values now exist only in slider bubbles (transient, one param at a time) and the sr-only `#sceneData` string. What remains on screen are two delivery lines with 10 px "Path"/"Attack" tags — physically honest tangents, but **projected through a perspective camera with `xStretch: 1.7` (DTL), so the on-screen angle between them is NOT the attack angle** at any camera pose. It's an instrument whose needles were removed and whose dial is warped. Nothing on the visible screen tells you attack is −3.1°.
2. **The truth is inset-sized; the theater is hero-sized.** The round-2 strike-detail card is *literally the stated goal*: arc-bottom curve, ball, low-point cm dimension, turf strip when fat, mm-on-face closeup, honest band chip. It occupies a small corner card while the full-bleed 3D scene — which can show none of the four outputs legibly — owns ~85 % of the pixels. Hero and inset are inverted relative to the goal.
3. **Time was added to a problem that has no time dimension.** Impact geometry is a *state → numbers* relation. Playback, face-zoom freeze, controls-fade choreography, camera orbit tweens: all answer "what does a swing look like", never "what changes when I move the low point". The "Hit" verb is the centerpiece of a lesson it cannot teach.
4. **The 5-tabs / one-slider model hides the cause space.** Tabs are label-only (round 3), so at rest you can see neither the other four *input* values nor any *output* value. But the whole lesson is **cross-coupling** — ball position vs low-point X, direction vs effective low point (`effectiveLpx` even encodes the plane-dependent cm/° coupling!). You cannot *feel* a coupling between quantities you cannot *see simultaneously*. The owner's beloved flight-screen model (all chips visible with live values, tap one to tune, before-trace answers "how is it different") is the exact inverse of this rail.
5. **The ghost shows the wrong delta.** The drag ghost-arc ghosts the *cause* (previous arc in 3D). The flight screen's before-trace ghosts the *effect* (previous outcome + numeric delta). Geometry has **no output memory at all** — change a slider and the previous attack/path/strike/turf state is simply gone.
6. **The duff/ball-first story is computed, narrated… and only screen readers get it.** `groundCrossingTheta0` + `renderReadout` already produce the exact sentence the owner asked for — "Turf contact N cm before/after the ball" — and it is emitted *only* into the sr-only live region. Visually the story is a small turf strip that appears in the inset only when already fat. The single most important binary in the goal statement is second-class.

### What earned its place (keep, promote, or repurpose)

| Asset | Verdict |
|---|---|
| Engine (`deriveImpact`, `clubBallContact`, `effectiveLpx`, `thetaAtImpact`, `arcPosition`…) | **Keep byte-identical.** The pedagogy already lives here. |
| `strikedisplay.js` honest-band side layer (round-3 fixes) | **Earned.** Verdict honesty is the product's spine. |
| **2D strike-detail schematic inset** (round 2) | **Earned — it's the seed of the right screen.** Promote, never delete. Its two-panel anatomy (window + ball closeup) also solves the mm-vs-cm scale problem. |
| Stance-frame ball position (ball moves, arc stays) | **Earned.** Matches the lesson mental model; keep in any concept. |
| Grounded club address + real club model | **Earned as credibility/context**, not as hero. |
| sr-only `#sceneData` full-parity narration | **Earned — and it's the script the *visual* layer should have been following.** |
| Delivery lines' *physics* (true 3D tangent at impact) | Right quantity, wrong display space. Reuse the math in an orthographic view where drawn angle = real angle. |
| Slim always-on rail, full-bleed canvas, render-on-demand discipline | Earned as craft; carries over. |
| Face-zoom freeze, controls-fade, orbit tweens, playback-as-default-verb, label-only tab carousel | **Spectacle.** No pedagogical function toward the stated goal. |

**Design principle for everything that follows:** *no number the user must infer from perspective.* If a value matters, it is either printed or drawn in an orthographic view where the drawn angle/length IS the value.

---

## Part 2 — Three concepts

A shared observation first, because it decides the architecture: **three of the four outputs live natively in ONE view** — the side-on X-Z cross-section of the ~60–80 cm around the arc bottom (attack angle, strike height, turf-before/after-ball, plus inputs low-point X, depth, ball position). Only **club path** (and its cause, swing direction) needs the top-down view. That asymmetry is the map.

---

### C1 — "Honest HUD" (smallest fix; 3D stays hero)

**Thesis:** keep the 3D scene as hero, but give the instrument its needles back and make turf contact first-class.

**Wireframe (landscape phone):** unchanged full-bleed 3D scene. Bottom-left: the strike-detail card grows one row and becomes the **outputs panel** — band chip, mm-on-face, low-point cm, turf order, **plus Attack ° and Path ° printed** (all four outputs in one always-on card). Delivery lines keep their geometry but get **numeric end-labels** ("Attack −3.1°", "Path +1.8°") — values return to the scene as *labels on the lines*, which respects the owner's round-4 "streker, ikke chips" direction. A **turf-contact patch** is drawn on the 3D ground where the arc crosses z=0, flagged "3 cm before ball" / "after ball" — always, not only when fat. Tabs regain two-line label+value (round-2 style; the duplication that killed it is gone since the row's persistent label was removed).

**Interaction loop:** as today (tab → slider), plus an **output before-trace**: first input of a tune session snapshots the four output values; the panel shows "was → is" micro-deltas and the previous delivery lines linger dotted until release.

**Hero vs context:** 3D scene hero; outputs panel is the truth strip; playback stays behind "Hit".

**Four outputs at rest:** all four printed in the outputs panel; attack/path additionally labeled on the lines; turf order additionally drawn in-scene.

**Duff story:** the in-scene turf patch + "before/after ball" flag + the panel line. First-class.

**Deleted:** face-zoom freeze as default behavior (kept only inside explicit playback). Nothing else.

**Size: S–M** (DOM/SVG only; no renderer changes).

**Pedagogical risk (honest):** it remains a theater with better gauges. Reading still splits across three surfaces (scene, lines, panel); the drawn angles are still perspective-warped even when labeled; the one-slider rail still hides cross-coupling. This is a patch that makes the wrong hero more legible — and given four rounds of iteration already spent here, patching risks a fifth, sixth… (the drop-signal pattern).

---

### C2 — "The Strike Window" (impact-window-hero) ★ recommended

**Thesis:** the ~70 cm around the arc bottom, drawn side-on at honest scale, IS the lesson — make that window the screen, and make every one of the four answers readable in it at rest.

**Wireframe (landscape phone):**

```
┌──────────────────────────────────────────────────────────────┬─────────────┐
│  STRIKE WINDOW (side-on, orthographic, ~62% width)           │ FACE PANEL  │
│                                                              │  (ball big, │
│        arc-bottom curve (engine-sampled, X-Z)                │  contact    │
│   ····dotted before-curve (ghost)····                        │  line, mm   │
│            ⌄ low-point marker (drag X and Y)                 │  label —    │
│   ─────●━━━━━━━━━━━━━━━━━━━━━━──────────  ground line        │  today's    │
│  turf shading ▒▒▒   ⛳ball (drags = ball position)           │  closeup,   │
│   [turf entry ●  "3 cm before ball"]  [attack tangent ∠]     │  sized up)  │
│  ┌ SEQUENCE BAR: ①turf ②ball  (order pips along X) ┐         ├─────────────┤
│  └──────────────────────────────────────────────────┘        │ PATH DIAL   │
│                                                              │ (top-down:  │
│                                                              │ dir + path  │
│                                                              │ arrows + °) │
├──────────────────────────────────────────────────────────────┴─────────────┤
│ CHIP ROW: [Plane 55°][Dir 0°][Low pt +8cm][Depth 0][Ball ctr] │ [Attack −3.1°↓][Path +1.8°→][Face 4mm low][Ball first ✓] │ [3D] │
└──────────────────────────────────────────────────────────────────────────────┘
```

- **Window** is orthographic: the drawn attack tangent at the ball *is* the attack angle; the low-point cm dimension *is* to scale. Turf-entry point = `arcPosition(−groundCrossingTheta0)` — always drawn, with a before/after-ball badge.
- **Sequence bar** under the ground line: event pips ordered along X — `① turf → ② ball` (fat) vs `① ball → ② low point → ③ turf` (pure). The duff question becomes literal reading order. This is the four th output made *structural*, not decorative.
- **Face panel** (right): today's proven ball-closeup, sized up — solves mm-scale strike height without lying about the window's cm scale (reuse of the two-panel inset anatomy).
- **Path dial** (right, below): the one output that doesn't live in the cross-section — swing-direction arrow + resulting path arrow + printed °, top-down. Small, always on.
- **Chip row** (bottom): the flight screen's grammar verbatim — 5 input chips with live values, 4 output chips; tap an input chip → tune dock slider above the row; outputs flash deltas on change.
- **Direct manipulation where it's honest:** drag the low-point marker (X = `lowPoint.x`, Y = depth), drag the ball (ball position) — these are *positions in the window*, so dragging them is truthful. Plane and direction are **not** spatially draggable in this projection — they stay chip+slider (honest about the projection's limits; direction's spatial meaning lives in the path dial, plane's in curvature + the 3D overlay).
- **3D demoted to context:** a `[3D]` pill opens the current scene (club, glass plane, orbit, "Hit" playback) as an on-demand overlay. The spectacle survives — as an appendix, not the thesis.

**Interaction loop:** everything visible at rest → touch anything → window redraws live; first touch of a session snapshots a **dotted before-curve + ghosted previous turf/contact markers + "was" values on the output chips** (the flight-screen before-trace, ported); release → ghost lingers ~1.8 s, then fades. Zero extra taps, ever.

**Four outputs at rest:** attack = drawn tangent + chip; path = dial + chip; strike height = face panel mm + chip; turf order = sequence bar + badge + chip. Each output readable in *two* redundant places (drawing + number).

**Deleted from today's screen:** the 3D scene *as hero* (→ overlay), face-zoom choreography, delivery-lines overlay, the tab carousel, controls-fade, camera-orbit view button (lives in the 3D overlay).

**Size: M.** All math exists (`arcPosition`, `thetaAtImpact`, `deriveImpact`, `clubBallContact`, `effectiveLpx`, side-layer `groundCrossingTheta0`); the window is a new pure-SVG/canvas consumer; chip row + dock + before-trace are ports of proven flight-mock patterns; the 3D overlay is today's code behind a pill.

**Pedagogical risk (honest):** plane and direction lose their gorgeous 3D spatial meaning and become "a slider that changes the curve's shape / the dial's arrows" — the tilted-glass-plane intuition now costs one tap ([3D]). And a 2D diagram risks reading as "less product" than the 3D scene to a first-time eye; the counter is that it reads as *more instrument* (TrackMan-adjacent), which is the brand.

---

### C3 — "One instrument grammar: See the Strike → See the Shot" (wild card)

**Thesis:** Geometry stops being its own app. It adopts the flight screen's idiom *exactly* — chip row, tune dock, before-trace, ghost FIFO, Replay — with the Strike Window as its scene, and its **output chips are literally the flight screen's input chips**: Geometry explains where Impact's inputs come from, and one tap sends the delivered numbers downstream.

**Wireframe:** C2's layout, plus: identical pill/dock/ghost components as `impact-viz-mock.html` (shared CSS/JS, not copies); a ghost FIFO (max 3) of previous *deliveries* rendered as stacked dotted window-curves with legend chips; the output chip cluster gains a **"Send to flight →"** affordance that opens Impact pre-loaded with this attack + path (speed/face untouched); "Hit" is renamed/reskinned as **Replay** and becomes a *contact sequencer scrub* — a scrub bar under the window slides the (real, grounded) club model through the window; event pips fire in order with haptic ticks (turf… ball…) as the club crosses them. Time returns, but as a *scrubbable ruler over the causal window*, not as theater.

**Interaction loop:** identical muscle memory to the flight screen — the user who learned "tap chip → dock → drag → before-trace answers 'how is it different' → Replay commits a ghost" now owns *both* screens for free.

**Hero vs context:** Strike Window hero; 3D overlay context (as C2); the *bridge to Impact* becomes part of the content — the app reads as a two-stage causal pipeline: **swing → delivery → flight**.

**Four outputs at rest:** as C2, plus each output chip is visually the same species as the corresponding Impact input chip (attack/path), which *teaches the pipeline by typography alone*.

**Duff story:** as C2's sequence bar, elevated by the sequencer scrub — you can *feel* turf-before-ball as haptic order.

**Deleted:** everything C2 deletes, plus Geometry-specific control idioms (view button, help-coach choreography folded into the shared grammar), plus the standalone "Hit" playback.

**Size: L** (shared-component extraction from the flight mock + cross-screen state handoff + sequencer).

**Pedagogical risk (honest):** over-unification can flatten a real difference — a strike is a *state*, a flight is a *trajectory*; the ghost FIFO earns less here than before-trace does, and the sequencer can re-grow into exactly the theater we just demolished if it becomes the default verb. The send-to-flight bridge also drags in product questions (Tune = Pro gating must hold across the handoff).

---

## Recommendation (ranked)

1. **C2 — build this next.** It is the only concept where every clause of the owner's goal statement is satisfied *at rest*, it makes the duff/ball-first question structural (reading order, not a badge), it imports the interaction model the owner already loves, and it *promotes* the one artifact from four rounds of iteration that was always right (the strike-detail schematic) instead of deleting the past.
2. **C3 — the north star, not the next step.** Build C2's chip row, dock, and before-trace *to the flight screen's grammar from day one* (same class names, same behavior contracts) so C3 becomes additive — a later unification pass plus the bridge — never a rewrite.
3. **C1 — hedge only.** Do it only if C2's static mock tests badly with the owner. Doing it *first* would spend a fifth round making the wrong hero more legible.

**How to proceed:** build `geometry-window-mock.html` in three gated steps, cheapest falsification first. **(1) Static window, no tuning:** render the Strike Window + face panel + path dial + populated chip row from `engineState`, with five tappable presets (Pure / Thin / Fat / Duff / Topped). Owner test: *"read all four answers in under 3 seconds per preset"* — if this fails, stop; the concept is wrong and C1 is the fallback. **(2) Live loop:** chip row → dock → live redraw + before-curve/ghosted markers + output-chip deltas + low-point and ball dragging. Owner test: the ball-position drill — drag the ball back and *watch* attack steepen, low point move ahead relative to ball, and the sequence pips flip; if that coupling isn't felt, the dock/window wiring is wrong, not the concept. **(3) Demote 3D last:** only after the window has proven it carries the lesson, A/B [3D]-overlay vs corner-PiP vs delete — do not argue about the 3D scene's fate before the 2D truth exists on screen. Engine and `strikedisplay.js` stay byte-identical throughout; the window is a new pure consumer (`arcPosition`, `thetaAtImpact`, `deriveImpact`, `clubBallContact`, `effectiveLpx`, `geo3d-mock/groundcontact.js#groundCrossingTheta0`), and the sr-only narration keeps its existing full-parity contract.
