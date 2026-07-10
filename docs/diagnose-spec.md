# Diagnose My Shot — Build Spec v1

**Status:** design locked (Fable 5, free-rein pass, 2026-07-10). Ready for build.
**Deliverables (new files only):** `diagnose-mock.html` + `diagnose-engine.js` at repo root.
**Read-only dependencies:** `impact-flight.js` (NEVER edit), `diagnose-map.json`, `sa-p3.css`, `sa-haptics.js`, `assets/range-night-3d-33.png`.
**Off-limits this run:** `impact-viz-mock.html`, `impact-outcome-mock.html`, `geometry-window-mock.html`, `academy.html`, `home-mock.html`, `sa-p3.css` — integration hooks into them are SPECIFIED here but built in a later commit.
**Numerical ground truth:** `tools/diagnose-harness.mjs` findings — treat every number in §3 as load-bearing.

---

## 0. The concept in one line

The user *describes* the shot they actually hit — five taps, no jargon required — and StrikeArc reconstructs the delivery that caused it, replays it as an ember trace over their own violet sketch, names the cause in plain language with the real terms taught inline, and hands them the delivery to fix by dragging in Ball Flight.

**The moment this feature exists for:** the ember reconstruction drawing itself over the user's description sketch and *matching it*. "How did it know." Everything else serves that beat.

### Honesty doctrine (non-negotiable, from the harness)

The inverse problem is genuinely ambiguous: 98.1% of real shots land in a symptom bucket with 4+ cause archetypes; the everyday slice/hook has ~20. The engine's structure gives us one certainty and one fog:

- **CERTAIN (structural):** curve + start line pin the *face-to-path relationship* — `startDirection` and `spinAxis` are pure functions of face/path. This is the confident headline ("Your face was open to your path"), and it is *always* true for the described shape.
- **FOGGY:** which exact delivery (attack/loft/speed/severity mix) produced it. We show ranked candidates with real prior percentages and never pretend otherwise.

So the UI has two confidence registers, visually distinct: **the story** (asserted, calm, definite) and **the deliveries** (ranked list with "about N in 10 matches" language and visible share bars). No fake 95%. No single-answer theater.

---

## 1. Where it lives + orientation (decisions)

- **Own destination.** Not a mode on Ball Flight (that screen is a dense instrument; Diagnose is a *conversation that ends at an instrument*). File: `diagnose-mock.html`.
- **Home:** 5th rail card, position 4 of 5 — `Geometry → Ball Flight → Outcome → Diagnose → Academy` ("make it → see it → read it → **ask why** → learn"). This amends `docs/front-page-spec.md` §2.1 (card `min-width` drops 150→140 so 5 fit at 812pt). **Deferred to a later home commit** — this run, `diagnose-mock.html` stands alone with the standard `.sa-strip` home button. Card spec for that later commit: eyebrow `Diagnose`, glyph = violet curving trace ending in a violet `?`, teach line `Why did it do that?`; once `sa.stat.diagnose` exists the body becomes a real stat (e.g. `Slice · face open`) — persisted result = live data, ember value like the other cards.
- **Orientation: landscape-locked, like every instrument** (Academy remains the only portrait screen). The prompt's portrait/landscape seam is resolved by *dissolving* it: the input flow is not a form, it's an instrument — a question rail on the left driving a live scene on the right. Landscape is its natural shape, and "Try this delivery →" lands in landscape Ball Flight with **zero rotation seam**. (Web mock viewed portrait: rail stacks above scene, scene 40vh — fallback only.)

---

## 2. Files & contracts

### 2.1 `diagnose-engine.js` (root, ES module, no deps beyond impact-flight.js)

```js
import { solveFlight, trajectorySamples, shapeLabel } from './impact-flight.js';

export async function loadMap(url = './diagnose-map.json')   // fetch + cache in module scope
export function descriptorKey({curve, startLine, height, distanceLoss})
  // -> `${curve}||${startLine}||${height}||${distanceLoss}` — EXACT map strings, see §3.1
export function lookup(map, descriptor)
  // -> { entry, exact: true } | { entry: null, nearest: [{descriptor, changed: 'distance'|'height'|'severity'}...(≤3)] }
  // nearest relaxation order: distanceLoss ±1 step → height ±1 step → curve severity swap (Slice↔Fade, Hook↔Draw)
export function consolidateStories(entry, attackFilter = null)
  // group clusters by face+path band; story = { face, path, pct: Σ priorPct, rep: highest-prior cluster's
  //   representative, variants: [{attack, pct, rep}] sorted desc, gridCount }
  // attackFilter: null | Set<band> — drop non-matching clusters, renormalize pcts to 100, drop empty stories.
  // returns { stories (sorted desc, max render 3), otherCount, otherPct, clusterCount, gridCount, filtered:boolean }
export function needsFollowUp(stories)
  // true unless stories[0].pct >= 60 AND stories[0].variants[0].pct/stories[0].pct >= 0.7
export function divotFilter(answer)
  // 'deep' -> Set{'steep descending'} · 'brushed' -> Set{'moderate descending','level'}
  // 'none' -> Set{'level','ascending'} · 'unsure' -> null
export function confidenceLabel(pct)
  // >=45 'Most likely' · 25–44 'Strong candidate' · 10–24 'Also fits' · <10 'Outside chance'
  // + text `about ${max(1, Math.round(pct/10))} in 10 matching deliveries`
export function storyTitle(story)   // plain-language headline, see copy table §6.3
export function deliveryPhrases(rep) // signed numbers -> golfer words, see §6.4
export function solveTrace(rep)
  // solveFlight(rep) -> { flight, samples: trajectorySamples(flight, 48) } for the ember reveal
export function sketchTrace(descriptor)
  // canonical NON-engine sketch (see §5.4) -> same {d,h,x}[] sample shape as trajectorySamples
export function persistStat(result)  // localStorage 'sa.stat.diagnose' (§2.3)
export function handoff(rep, label)  // localStorage 'sa.handoff.delivery' + returns deep-link URL (§2.4)
```

Everything above is pure/deterministic except `loadMap`/`persistStat`/`handoff`. No ML, no invented physics: every flight drawn in ember comes from `solveFlight`; every percentage comes from the map's grid counts.

### 2.2 `diagnose-mock.html` (root)

Standalone page: `<link rel="stylesheet" href="./sa-p3.css">`, standard `.sa-strip` with home button (`href="./home-mock.html"`) + `.sa-strip__title` = `DIAGNOSE`. Imports `./diagnose-engine.js` and `./sa-haptics.js` as modules. All layout/interaction per §5–§7. `viewport-fit=cover`, safe-area padding identical to the other instruments.

### 2.3 Persisted stat (for the future home card)

`localStorage['sa.stat.diagnose']` = `{"ts": <Date.now()>, "shape": "Slice", "story": "Face open to path", "face": 6.5, "path": -6.5}` — written at every reveal (S6). Same freshness contract as the other `sa.stat.*` keys (30-day stale window, `ts` required).

### 2.4 "Try this delivery" handoff contract (integration later — Ball Flight is off-limits this run)

On tap, Diagnose writes **both**:

1. `localStorage['sa.handoff.delivery']` = `{"v":1, "ts":<now>, "source":"diagnose", "label":"Face open to path — slice", "params":{"clubSpeed":86.3,"faceAngle":6.5,"clubPath":-6.5,"attackAngle":-4.9,"dynamicLoft":25.7}}`
2. navigates to `./impact-viz-mock.html?from=diagnose` (params also mirrored in the query string: `&speed=86.3&face=6.5&path=-6.5&attack=-4.9&loft=25.7` for robustness/shareability).

**Later Ball Flight commit (~12 lines, after cohesion run unlocks the file):** if `from=diagnose` and handoff `ts` < 5 min old, seed `state` from `params` before first render, clear the key, and show a dismissible violet banner chip top-center: `Replaying your diagnosed slice — drag the delivery to fix it` (label word from handoff). The existing 10-shot gate on that screen fires exactly as it does for any visit — **no new gate mechanism anywhere** (§8).

Until that commit, the button still works: Diagnose's own reveal scene (S6) already contains the replay, so the killer moment does not depend on the integration.

---

## 3. Data layer (read this before writing any logic)

### 3.1 Map vocabulary — EXACT strings (build keys from these, never free-type)

- `curve`: `Straight` `Draw` `Hook` `Fade` `Slice`
- `startLine`: `Left` `Straight` `Right`
- `height`: `Low` `Normal` `High` `Ballooned`
- `distanceLoss`: `Long (gained distance)` `Full (normal distance)` `Slight loss` `Noticeable loss`
- cause bands — face: `strongly closed` `slightly closed` `square` `slightly open` `strongly open`; path: `strongly out-to-in` `slightly out-to-in` `neutral` `slightly in-to-out` `strongly in-to-out`; attack: `steep descending` `moderate descending` `level` `ascending`

Entry shape: `inverseMap[key] = { descriptor, gridCount, clusterCount, clusters: [{cause:{face,path,attack}, priorPct, gridCount, representative:{faceAngle,clubPath,attackAngle,dynamicLoft,clubSpeed}, ranges}] }`. 180 of 240 keys exist — **missing keys are a designed state (S-MISS), not an error.**

### 3.2 Story consolidation (the ambiguity made humane)

Raw cluster counts (up to 24) are unreadable. Group by `face|path`; the attack variants live *inside* a story. The everyday slice then reads as ~3 stories (top ≈ 40% summed) instead of 20 clusters. Render at most 3 stories + one honesty line:

> `This flight matches {gridCount.toLocaleString()} deliveries in {clusterCount} patterns. Showing the three biggest — {otherCount} rarer patterns share the remaining {otherPct}%.`

### 3.3 The follow-up question (information-gain findings applied)

Start line — the single best disambiguator (+1.08 bits) — is **already collected** by the 9-flight picker. The residual fog is mostly the attack dimension (knowing attack ≈ 1.9 bits remaining vs 3.26). Attack has a real-world observable: **the divot**. So the one follow-up, shown only when `needsFollowUp()` is true:

> **One more clue — your divot?**  `Deep divot` · `Brushed the grass` · `No divot` · `Didn't notice`

Mapping per `divotFilter` (§2.1). After filtering: renormalize, re-rank, eyebrow gains `REFINED BY YOUR DIVOT`, ember trace redraws from the new top representative (live static redraw). If the filter empties the map: keep unfiltered results and say plainly: `A {deep} divot doesn't fit this flight in the model — showing all patterns.` Never ask a second follow-up. One question, then we live with honest ranks.

### 3.4 Contact feel — parallel track, never an input to this map

Architectural fact: contact quality lives in the geometry model (`swing-parameters-and-impact.js` low-point/`xLP`), which shares zero inputs with `solveFlight`; the flight engine has no mishit term. Contact feel therefore **never filters or reweights the inverse map**. It renders a separate results card (§6.6) that routes to the Strike Window. Related honesty: matched-speed geometry only moves carry −8.8%..+4.9%, so "way short" ≈ contact/speed, and the app *says so* — that's a teaching moment, not a gap.

---

## 4. State machine

```
S0 INTRO ─tap tile→ S1 SHAPE(severity?) → S2 HEIGHT → S3 DISTANCE → S4 CONTACT(optional)
   → S5 REVEAL-BEAT (skipped under reduced-motion) → S6 RESULTS ─divot→ S6' REFINED
S6/S6' ─Try this delivery→ HANDOFF (impact-viz-mock.html)
any answered chip tap → reopen that question (dock pattern) → re-solve → back to S6 path
lookup miss at S3/S2 → S-MISS (nearest-flight suggestions) → resume
```

Auto-advance on every selection. Total: 4–6 taps, 15–30 s. No typing anywhere. Answered questions collapse into summary chips (the chips + tune-dock grammar applied to *descriptors*: chip = answered value, tapping it reopens its question panel in place).

---

## 5. Input flow — layout + every state (landscape 812×375 reference)

### 5.0 Frame

```
┌──────────────────────────────────────────────────────────────────────┐
│ .sa-strip  [⌂]  DIAGNOSE                                    (40px)   │
├──────────────┬───────────────────────────────────────────────────────┤
│ QUESTION RAIL│                SCENE (canvas, flex:1)                 │
│ .sa-plate    │   top-down trace view, grid + target line             │
│ w:300px      │   ┌─────────────┐                                     │
│ (min 264)    │   │ side-profile│  inset 172×84, bottom-right,       │
│ scrollable   │   └─────────────┘  .sa-plate                          │
└──────────────┴───────────────────────────────────────────────────────┘
```

Scene background: `--scene-bg` gradient over `assets/range-night-3d-33.png` at the same night grade as home (image .78 + dark rect .16). Canvas is decorative (`aria-hidden="true"`); an offscreen paragraph `#sceneAlt` (visually-hidden, not aria-hidden) carries the text alternative, updated with the sketch: `Your described shot: starts right, curves further right, normal height, normal distance.`

Question rail = one `.sa-plate`, 12px padding, containing: (a) summary chip row (answered descriptors), (b) the ONE active question block, (c) the fixed club pill. Only one question is ever expanded — calm, sequential.

### 5.1 S0 — intro (first paint)

Rail:

```
DESCRIBE YOUR LAST SHOT            ← 11px uppercase .14em --muted
Which flight looks like yours?     ← 15px/700 --ink
[ 3×3 flight picker, §5.2 ]
7-IRON · more clubs soon           ← club pill: 12px, --secondary-soft bg,
                                      "more clubs soon" 10px --muted (honest: only calibrated club)
```

Scene: empty range, faint violet target line, ghost text center `Tap a flight to sketch it` (13px `--muted`). No trace yet.

### 5.2 S1 — the 9-flight picker (+ severity)

3×3 grid of 72×72 tiles (gap 8), each a mini top-down glyph: white dot origin, violet stroked trace. Columns = start line (Left/Straight/Right), rows = curve direction (curves left / straight / curves right). RH-golfer v1 (footer note: `Right-handed flights — mirrored left-hand mode is on the list`).

- Semantics: `role="radiogroup"` `aria-label="Which flight looks like yours?"`, tiles `role="radio"`, roving tabindex, arrow keys move in both axes (Left/Right within row, Up/Down within column). Tile hit area = full 72px (>44 ✓).
- Tile `aria-label`s (col,row): `Starts left, keeps curving left` · `Starts left, flies straight` · `Starts left, curves back right` · `Starts straight, curves left` · `Dead straight` · `Starts straight, curves right` · `Starts right, curves back left` · `Starts right, flies straight` · `Starts right, keeps curving right`.
- Mapping: startLine = column. Curve direction: left→Draw/Hook family, none→`Straight`, right→Fade/Slice family.
- **Severity follow-on** (only if curved) replaces the grid (grid collapses to a summary chip):

```
HOW MUCH CURVE?
( A little — a draw )   ( A lot — a hook )      ← radiogroup, 2 chips, 44px
Small curve = draw. Big curve = hook.           ← 11px --muted, terms in --secondary
```

(Fade/slice wording when curving right.) This *teaches the taxonomy at the moment of choice* — the map's Draw|Hook split is exactly the engine's ≤6°/>6° face-to-path gap.

- On selection: sketch trace appears in the scene (§5.4) using provisional defaults `height:Normal, distanceLoss:Full`. Live region: `Sketched: starts right, curves right — a slice. Next: height.` Haptic: light tick.

### 5.3 S2 / S3 / S4 — height, distance, contact (one chip row each)

Each is a radiogroup of 44px-hit chips with an 11px uppercase question label. Auto-advance; each answer redraws the sketch (live static redraw — never animated mid-flow).

- **S2 `HOW HIGH DID IT FLY?`** → `Low` `Normal` `High` `Ballooned` (map strings 1:1). `Ballooned` sub-hint on selection: `climbed steep, dropped short of its usual flight`.
- **S3 `DISTANCE, NEXT TO YOUR NORMAL 7-IRON?`** → `Longer` → `Long (gained distance)` · `Normal` → `Full (normal distance)` · `A bit short` → `Slight loss` · `Way short` → `Noticeable loss`. Picking `Way short` sets a flag that promotes the contact card in results (§6.6) — the engine genuinely cannot lose big distance from geometry alone.
- **S4 `HOW DID IT FEEL OFF THE FACE? (OPTIONAL)`** → `Pure` `Thin` `Fat` `Not sure` + text-button `Skip`. Stored separately; NEVER keys the map (§3.4).

After S3's answer the diagnosis is already solvable; S4 rides in front of the reveal because feel is freshest in memory, but `Skip`/`Not sure` cost nothing.

### 5.4 The sketch trace (violet — the user's words, NOT the engine)

Deliberately independent of the engine so the reveal is real work, not a mirror. Canonical construction in `sketchTrace(descriptor)`:

- startDir: Left −4°, Straight 0°, Right +4°. Carry (m): Long 160 · Full 150 · Slight 142 · Noticeable 132. Apex (m): Low 18 · Normal 30 · High 38 · Ballooned 44 (apex fraction 0.52; 0.58 for Ballooned). Curve lateral offset at landing (m): Hook −28 · Draw −12 · Straight 0 · Fade +12 · Slice +28, added to `tan(startDir)·carry`, growing with `d²` (matches `trajectorySamples`' lateral law).
- Render: 2px dashed `rgba(157,139,255,.75)` (`--secondary`), landing X marker, tag `AS DESCRIBED` (9px uppercase, `--muted`) at the trace's end. Side inset gets the matching profile.

This is the grammar's *before-trace*, reborn: the cold violet "before" is your memory; the ember "after" is the physics.

### 5.5 S-MISS — descriptor combination not in the map (60 of 240)

Rail block replaces the reveal:

```
THAT MIX DOESN'T COME OUT OF THE PHYSICS
A mid-iron can't fly that exact combination in our model —
usually one detail reads differently than it felt.
Closest real flights:
( Same, but a bit short )  ( Same, normal height )  ( Gentler curve )
```

≤3 suggestion chips from `lookup().nearest`, each stating only what changed. Tapping one applies it (the changed summary chip pulses once) and proceeds to S5. No dead end, no fake result.

---

## 6. Reveal + results

### 6.1 S5 — the reveal beat

420 ms: scene dims 8%, rail shows `Reconstructing your delivery…` (13px `--muted`), live region announces same. Then the **ember trace draws itself over the sketch** — 720 ms tip-led draw, 3px `#FF8A4D`, glow `shadowBlur 8 / rgba(255,138,77,.35)`, ember landing dot; the violet sketch stays visible beneath. Side inset draws its ember profile in sync. Haptic: success. **Reduced motion: no beat, no draw — both traces and the results render complete, instantly.**

The ember trace is `solveTrace(stories[0].rep)` — a real `solveFlight` solve of the top story's representative delivery. Its agreement with the independent violet sketch is the honest magic. Scene scale: fit `max(sketchCarry, flight.carry) × 1.15`; range grid rings every 25 m with tiny labels.

### 6.2 S6 — results layout

Rail (scrollable) becomes the diagnosis column; scene keeps both traces + gains a delivery readout strip:

```
┌ RAIL ────────────────────────┐  ┌ SCENE ─────────────────────────────┐
│ [summary chips — tappable]   │  │  violet sketch + ember replay      │
│ ┌ STORY CARD 1 (headline) ┐  │  │  [side-profile inset]              │
│ │ MOST LIKELY · ~4 IN 10  │  │  │  ┌ delivery readout strip ──────┐  │
│ │ Face open to your path  │  │  │  │ FACE +6.5° open · PATH 6.5°  │  │
│ │ [mini D-plane glyph]    │  │  │  │ out-to-in · ATTACK 4.9° down │  │
│ │ plain-language why…     │  │  │  │ · LOFT 25.7° · 86 mph        │  │
│ │ variant bars + divot Q  │  │  │  └ param-coloured chips ────────┘  │
│ │ [ Try this delivery → ] │  │  └────────────────────────────────────┘
│ └─────────────────────────┘  │
│ story cards 2–3 (compact)    │
│ honesty line (§3.2)          │
│ contact card (§6.6, if any)  │
└──────────────────────────────┘
```

Results are an `<ol>` (stories in rank order), each `<li><article>`. Confidence text is the first DOM content of each card. Share bars are `aria-hidden` with the text equivalent adjacent.

### 6.3 Story card copy (the two registers)

Eyebrow: `{confidenceLabel} · ABOUT {n} IN 10 MATCHES` (11px uppercase; ember only on card 1's value number — persisted-result-as-live-data, consistent with home's stat law).

Title = `storyTitle(story)` — the certain register, face-to-path relationship in plain words. Full copy table (face band × path band → title), representative examples:

| face / path | title |
|---|---|
| strongly open / strongly out-to-in | `Face open, swinging across it` |
| strongly open / slightly out-to-in | `Face open to a slightly across path` |
| slightly open / neutral | `Face a touch open, path fine` |
| strongly closed / strongly in-to-out | `Face shut, swinging out to the right` |
| square / strongly out-to-in | `Square face, but swinging across` |
| open ≈ path in-to-out (matched, push) | `Face and path both aimed right` |

(Opus: generate the full 5×5 table mechanically from band names in this voice — assert the *relationship*, never a percentage, in the title.)

Body (13px/1.5), always three beats — what happened, why the ball did what it did, terms taught: e.g. for the slice headline:

> `Your clubface pointed right of the direction the club was travelling. The ball starts close to where the face points, then curves away from the path — that gap is the whole slice. The face direction is your` **`face angle`**`; the travel direction is your` **`club path`**`.`

Real terms render in `--secondary`, dotted-underlined; tap toggles a one-line inline definition (no tooltip hover dependency; it's a `<button aria-expanded>` revealing a 12px `--muted` line).

### 6.4 `deliveryPhrases` — sign conventions → golfer words (readout strip + cards)

`faceAngle +6.5` → `6.5° open` (− → `closed`) · `clubPath −6.5` → `6.5° out-to-in` (+ → `in-to-out`) · `attackAngle −4.9` → `4.9° down` (+ → `up`) · `dynamicLoft 25.7` → `25.7° loft` · `clubSpeed 86.3` → `86 mph`. Chips use the locked param colours (`--face` `--path` `--attack` `--loft`; speed = `--ink`) with the coloured dot + label pattern — labelled chips only, never bare colour dots.

### 6.5 Mini D-plane glyph (per story card, 72×72 SVG, aria-hidden)

Top-down schematic: vertical `--line-strong` target line; **path arrow** in `--path` blue rotated `clubPath°×2` (visual gain 2, matching Ball Flight's direction lens); **face arrow** in `--face` red rotated `faceAngle°×2`; the wedge between them shaded `--secondary-soft`; a small violet curve hint bending away from the path arrow. No ember (diagram ≠ live data). Adjacent visually-hidden text: `Diagram: face 6.5 degrees open, path 6.5 degrees left of target — face right of path.`

### 6.6 Variants + follow-up (inside card 1) and the contact card

Variant rows (max 3): `Steep, digging swing ▮▮▮▮▮ 5 in 10 within this story` — attack band in words (`steep descending`→`steep, digging` · `moderate descending`→`normal, downward` · `level`→`flat, level` · `ascending`→`on the way up`). Below them, the divot radiogroup (§3.3) when `needsFollowUp()`. On answer: re-rank per §3.3, ember redraws (static under reduced motion), live region: `Refined. Most likely: face open, swinging across, with a steep attack — about 5 in 10.`

**Contact card** (rendered when S4 = Thin/Fat, promoted directly under card 1 when distance = Way short):

> `THE STRIKE, SEPARATELY` — `Thin contact comes from where your swing bottoms out — that's strike geometry, and this flight engine genuinely can't see it. A pure strike at this same delivery loses only a few percent of distance; a big loss is the strike talking.` `[ Open the Strike Window → ]` → `./geometry-window-mock.html`.

Never blended into the flight ranking. Two models, two cards — the honesty *is* the lesson.

### 6.7 CTA

`[ Try this delivery → ]` — 44px, ember border + ember text on `--plate` (the one hot control; it launches live data). Sub-line 11px `--muted`: `Loads these numbers into Ball Flight — drag them to fix the shot.` Story cards 2–3 get a quiet text-button variant of the same action with their own representative. Behavior: §2.4.

---

## 7. Motion, tokens, a11y master list

- **Motion:** chip selections = 120 ms ease (`--ease`); sketch redraw = instant swap (live static redraw); reveal beat + 720 ms draw + bar re-rank animations are the only theater, all `.001ms`-killed by the `sa-p3.css` reduced-motion block (verify: traces must render complete at full value).
- **One polite live region** `#saLive` (`aria-live="polite"`, visually hidden), throttled ≥800 ms between messages. Announces: step advances, sketch updates, reveal headline, refinement, gate. Nothing else speaks.
- **Focus:** DOM order = visual order (strip → rail → scene CTA). Selecting a chip keeps focus in place; the next question appears *below* in DOM so Tab flows forward naturally. Reopened questions (summary-chip tap) receive focus on their group. Double focus ring via `.sa-focus` everywhere.
- **Hit targets:** all interactive ≥44px (chips 36px visual + `::after` hit pad, tiles 72px, CTA 44px).
- **Contrast:** everything texty on `.sa-plate` (all P3 tokens ≥6.4:1 there). Ember only ever on plate/scene-dark, never on bloom.
- **Colour law audit:** ember = ember trace, card-1 confidence number, CTA. Violet = sketch, chrome, taught terms, D-plane wedge. Param colours = labelled chips + D-plane arrows only. No celebrate/warn (no XP here).
- **Language:** English (locked). Numbers `font-variant-numeric: tabular-nums`.

---

## 8. Monetization placement (decision)

**Everything inside Diagnose is free, forever** — input, diagnosis, inline ember replay, divot refinement, contact card. It is the ASO hook ("why does my ball slice?") and the post-range retention loop; a paywall in front of the aha would kill both. **No new gate is built.** The existing hard 10-shot gate on the instruments is the monetization: `Try this delivery →` leads into Ball Flight, which counts shots exactly as today, and Diagnose is engineered to make that tap irresistible — it becomes the instruments' best shot-consumer and therefore the strongest paywall *feeder*. When the target screen gates, the existing paywall shows; later polish (optional, with the §2.4 integration): `from=diagnose` context line on the paywall — `Your diagnosis is free. Replaying and fixing it is Pro.` Free Academy + free Diagnose + 10 shots stays the whole trial story (consistent with docs/monetization-strategy.md).

---

## 9. Edge cases

- Map fetch fails → rail shows `Diagnosis needs its physics map — check your connection and retry` + retry button; picker stays interactive (sketch still works).
- Descriptor bucket missing → S-MISS (§5.5). Partial-flow lookup miss (provisional defaults) → silently use nearest for the sketch only; never block mid-flow.
- `Straight + Straight + Normal + Full` (the "perfect shot") → results render with a wink line above card 1: `That's the one you're trying to repeat. Here's a delivery that does it:` — same mechanics, no fake pathology.
- Re-diagnose: `Describe another shot` text-button under the honesty line resets to S0 (keeps club pill).
- LH golfers: v1 RH-only, footer-noted (§5.2) — mirroring is a sign flip but the downstream instruments are RH; ship the chain consistent.
- 7-iron only: club pill is honest (§5.1); never imply driver applicability.

---

## 10. The ONE thing + build order

**The ONE thing:** the reveal — the user sketches their miss in cold violet from memory, and the engine's ember reconstruction draws itself over it and *fits*. If that beat lands, "how did it know" carries the whole feature: the diagnosis is believed, the terms are wanted, the Try-tap follows. Protect it: the sketch must be genuinely engine-independent (§5.4), the draw must start within 500 ms of the last tap, and nothing else on screen may move while it happens.

**Build order (each step leaves a working page):**
1. `diagnose-engine.js`: `loadMap`/`descriptorKey`/`lookup`/`consolidateStories`/`confidenceLabel` + unit-style console asserts against the four §spot-checks in `diagnose-map.json` (slice/pull-hook/push/balloon must reproduce the harness's top causes).
2. Page shell: strip, rail, scene canvas, sketch renderer (`sketchTrace`) — input flow S0–S4 fully tappable, sketch redrawing live.
3. Reveal: `solveTrace` + ember draw + S6 card 1 (title/body/readout/D-plane/CTA writing the §2.4 handoff), `persistStat`.
4. Ambiguity layer: stories 2–3, variants, divot follow-up + re-rank, honesty line, S-MISS.
5. Contact card + Way-short promotion; edge cases §9.
6. A11y + reduced-motion verification pass (radiogroup keyboard model, live-region script, complete-traces check), haptics, polish.
7. *(Separate commits, post-cohesion-run)*: Ball Flight seed reader (§2.4) · home 5th card + front-page-spec §2.1 amendment (§1).

— Fable 5, design director
