# StrikeArc Academy — LOW POINT chapter · Build Spec

**Target file:** `academy.html` (single-file SPA, LESSONS-registry architecture).
**Author:** Fable 5, design director + physics pedagogue · **Date:** 2026-07-10 · **Status:** buildable spec — implement without further design input.
**Numerical ground truth:** every number in this spec comes from node runs against `swing-parameters-and-impact.js` (the geometry engine, byte-identical, read-only). Run log in **Appendix A**. No invented physics.
**Companion helpers (reuse, do not duplicate):** `geo3d/groundcontact.js#groundCrossingTheta0(state)` (closed-form turf entry/exit; returns `null` when `lp.z ≥ 0` — i.e. no divot).
**Colour/type:** consume `sa-p3.css` tokens only (`--attack` mint `#4DE8D2`, `--path` `#6FC6FF`, `--plane` periwinkle `#93A4F2`, `--depth` orchid `#C98AE6`, `--accent` ember = live-output lane, `--warn` gold = XP only). No new tokens. English-locked copy. Everything in `docs/academy-polish-spec.md` (type roles, labels-only-uppercase, a11y master rules) applies to the new lessons verbatim.

---

## 0. Why this chapter, and the two coaching pearls — verified against the engine

The owner's brief: a chapter on **low point**, especially low point in the **height axis** (`lowPoint.z`) — how it changes **ball strike** but **not** attack angle, and how **plane, low-point-x and low-point-z must cohere**. Two pearls to teach:

| Pearl (owner's words) | Engine verdict | Proof triple (node-run) |
|---|---|---|
| (a) "A DEEP low point does not have to mean hitting far DOWN ON THE BALL — divot depth and strike height are different things." | **CONFIRMED, and the engine states it even more strongly:** `deriveImpact()` never reads `lowPoint.z` at all. Attack angle at `lpz` −30 mm / 0 / +30 mm is **−4.11° / −4.11° / −4.11°** (x +10.5 cm, plane 55°). Depth moves the contact point on the ball **exactly 1 mm per mm** (`clubZ = lowPoint.z + lift(θ)`); it never moves the angle. And a *deeper* divot with the *same* contact height is reachable by moving the low point further ahead: (x +10.5, z −4 mm) and (x +13, z −6 mm) both strike at clubZ −0.2 mm — 50 % more divot depth, identical strike height. | see Appendix A rows A9–A10, P-a |
| (b) "NO divot can still be a very NEGATIVE attack angle — a picked/clean strike does not mean shallow." | **CONFIRMED:** (x +15 cm, z +2 mm) → attack **−5.88°**, zero turf contact (arc bottom 2 mm above grass), strike band **Pure**. The divot testifies about the arc's *depth*, never its *direction* at the ball. Inverse also true: (x 0, z −4 mm) → a 21.6 cm divot centred on the ball with attack **0.00°** — a big divot with a perfectly level strike. | Appendix A rows P-b, X-3 |

**One engine-vs-intuition finding to state honestly** (precedent: `docs/diagnose-harness-v2-findings.md` findings #2/#3):

> **Finding G-1 — the engine's divots are millimetre-scale, not centimetre-scale.** The engine models the club as a *point on the arc*, so "ball-first with a divot" requires the arc to pass the ball above ground and dip below it just ahead. At plane 55° the arc sits only **3.8 mm** above its bottom when it reaches a ball 10.5 cm behind the low point (lift table: +2 cm → 0.1 mm, +8 cm → 2.2 mm, +10.5 → 3.8 mm, +15 → 7.7 mm). So the deepest *ball-first* divot the model can draw is **7.7 mm** (at the +15 cm edge of the Pure window) — real tour divots run 1–2 cm because a real club has a sole and the ball is struck by the *face* while the sole passes below, which the point-club abstraction flattens. **Consequence for copy:** the lessons quote engine divot depths in millimetres and call the drawn divot a *model divot*; the *relationships* (invariance, coupling, where the divot starts) are the physics being taught and are exactly right — the absolute depth scale is engine-scale. Never write "2 cm deep divot" next to a Pure band.

Secondary honest note (**G-2**): `strikeQuality()` draws a hard line at `clubZ < 0` = turf-first, so (x +10.5, z −4 mm) reads **Fat** even though turf entry is only 3 mm behind the ball. The band chip is honest to the model; lesson 2's copy explains the hard line rather than hiding it.

Bonus teaching fact the sweeps surfaced (**G-3**, used in lesson 3): the same geometry couples **club path**. At fixed swing direction 0, moving the low point ahead adds in-to-out path (x +10.5 → path **+2.88°**, x +15 → **+4.13°**) — hitting "earlier on the circle" points the head right. This is the engine reproducing the real TrackMan attack↔path coupling, free of charge.

---

## 1. Placement in the skill tree

**Three new nodes, one new tier column, gated behind Attack Angle.** The chapter *deepens* attack angle (the attack-angle lesson already name-drops `effectiveLpx()`/`thetaAtImpact()`); it must not re-gate any existing node.

### 1.1 `#graph-data` additions

```json
nodes (append, tier "geometry"):
{ "id":"low-point",     "label":"Low Point",      "tier":"geometry",
  "blurb":"The bottom of your swing's circle — where it sits versus the ball decides whether you strike down or up." },
{ "id":"strike-depth",  "label":"Strike Depth",   "tier":"geometry",
  "blurb":"How deep the circle's bottom sits — it moves contact up and down the ball, millimetre for millimetre, but never changes attack angle." },
{ "id":"plane-coupling","label":"Plane Coupling", "tier":"geometry",
  "blurb":"Plane, swing direction and low point are one linked system — change one and the other two move." }

edges (append):
{ "from":"attack-angle",  "to":"low-point" },
{ "from":"low-point",     "to":"strike-depth" },
{ "from":"strike-depth",  "to":"plane-coupling" }
```

Unlock semantics fall out of the existing `recomputeUnlocks()` untouched: `low-point`'s only authored, non-environment predecessor is `attack-angle`, so the chapter opens when Attack Angle is **completed** — and never blocks anything that is open today (no new edges point *into* existing nodes).

### 1.2 Registry & chrome wiring (exact edits)

- `AUTHORED` — add `'low-point':true, 'strike-depth':true, 'plane-coupling':true`.
- `TIER_COLS` — insert a new column between `fundamental` and `derived`:
  `{ tier:'geometry', label:'Swing geometry', ids:['low-point','strike-depth','plane-coupling'] }`
  (layout is computed — `computeLayout()` handles the extra column; 3 ids = 2 rows).
- `GRAPH.progression` — insert `'low-point','strike-depth','plane-coupling'` after `'club-path'`.
- Path intro copy: `"<span class=mastered>N</span> of 21 mastered"` → **`of 24`**. Audit any other literal `21` (e.g. badge descriptions, completion copy) and update to 24 in the same commit.
- `next` chain: the chapter is self-contained — `low-point.next='strike-depth'`, `strike-depth.next='plane-coupling'`, `plane-coupling.next=null` (`nextLabel` accordingly). Do **not** rewire `attack-angle.next` (stays `face-angle`).
- Tier display label in lesson header: `tier:'Geometry'` (parallel to `'Fundamental'` etc.).
- XP: **maxXp 190 per lesson** — identical formula to all 21 neighbours (read +40 · 5 quiz × 20 first-try · perfect-run +50). Mastery stays the stock rule (quiz best ≥ 80 % = 4/5). *Decision note: the brief floated 3–4 quiz items; neighbours are uniformly 5 items/190 XP and the mastery threshold (0.8) makes 4-item quizzes require a perfect run to master — so the chapter ships 5 items per lesson to keep the XP/mastery economy uniform. The two pearls own dedicated quiz items (L2-Q2, L2-Q3).*

---

## 2. New diagram archetype: `arc-window`  *(one archetype, three configs)*

Every existing archetype wraps `solveFlight()`. This chapter's live engine is `swing-parameters-and-impact.js`, so it needs **one** new archetype; all three lessons configure it. Same contract as the others: `fn(mount, ctx)`, portrait-first, canvas top / full-width sliders below, renders its own `.vig-title`.

### 2.1 What it draws (face-on window: x = target line →, z = up)

Fixed world scale so millimetres are honest: window spans **x −25…+40 cm, z −4…+12 cm**; ball drawn to true scale (Ø 42.7 mm) at origin.

1. **Turf line** at z = 0 (structural `--rule`), grass tint below.
2. **The arc** — `arcPosition(θ, state)` sampled θ ∈ [−28°, +28°], projected orthographically (x → x, z → y; no camera). Stroke `--secondary` violet (chrome/world), 2 px.
3. **Low-point marker** — dot + vertical drop-line at the arc bottom, `--attack` mint (the token that already means "geometry low-point locus" per the `--q-attack` comment in `sa-p3.css`), with a mono cm label ("10.5 cm ahead"). The **depth** dimension (z of the marker vs turf) draws in `--depth` orchid.
4. **Model divot** — when `groundCrossingTheta0(state)` returns θ₀: fill the arc-below-turf sliver between `arcPosition(−θ₀)` and `arcPosition(+θ₀)`, `--depth` at 25 % alpha, plus two tick labels: *starts N cm before/after ball* · *L cm long*. When it returns `null`, render the quiet caption **"no turf contact"** in `--muted` (this caption is load-bearing for pearl (b) — never omit it).
5. **Attack tangent** — arrow through the ball along `tangentAt(thetaAtImpact(state))` (projected), `--attack` mint. Its angle *is* the attack angle — the window is orthographic, so the drawing never lies.
6. **Contact tick** — horizontal tick on the ball at `clubBallContact(state).clubZ`, `--accent` ember (live output), sliding up/down the ball face as depth changes.
7. **Band chip** — `strikeQuality(state)`: band word in its `textColor`, pct in mono. (The engine's own `TEXT_COLOR` values are AA-tuned; reuse them.)

### 2.2 Slider contract extension (document in the ARCHETYPE API block)

`engineSliders[].bind` for `arc-window` names **GeometryState fields** instead of solveFlight inputs: `'lowPointX' | 'lowPointZ' | 'planeAngle' | 'swingDirection'`. `config.fixed` overrides any non-exposed field, e.g. `fixed:{ planeAngle:55, swingDirection:0, lowPointZ:0 }`. Radius is always `RADIUS` (1.2 m). x/z sliders are metres internally, **displayed in cm (x) and mm (z)** — mono values, `--depth`/`--attack`-dotted labels per SYS-11. Ranges below stay inside the live Geometry screen's own slider ranges (x ±0.30, z ±0.20, plane 45–70, dir ±8) so nothing taught here is un-doable on the instrument.

### 2.3 A11y (master rules apply)

Canvas `role=img` with a **live aria-label sentence** reusing geometry.html's narration grammar: *"Low point 10.5 cm ahead of the ball, 4 mm below the turf. Attack 4.1 degrees down. Turf contact 0.3 cm before the ball. Fat."* Every drawn value also exists as a text chip. Sliders: stock `slider()` markup, `aria-valuetext` with spoken units ("centimetres ahead", "millimetres below the turf"). Reduced motion: no tweened redraws — state renders complete.

---

## 3. Lesson 1 — `low-point` · **"Low point — the bottom of your circle"**

### 3.1 Registry entry

```js
'low-point': { ...CONTENT['low-point'],
  node:'low-point', tier:'Geometry',
  identity:'θ = asin(−xLP / R) — where the ball sits on your circle',
  next:'strike-depth', nextLabel:'Strike Depth', maxXp:190,
  diagramArchetype:'arc-window',
  diagramConfig:{
    title:'The Bottom of the Circle', tag:'LIVE',
    readoutLabel:'Attack angle', readoutUnit:'°',
    engineSliders:[
      {key:'lpx', label:'Low point', min:-0.10, max:0.30, step:0.005, value:0.105, bind:'lowPointX',
       unit:' cm', display:v=>Math.round(v*100), unitSpoken:'centimetres, positive is ahead of the ball', signed:true},
    ],
    fixed:{ lowPointZ:0, planeAngle:55, swingDirection:0 },
    chips:['clubPath','contactMM','band'],   // arc-window chip dictionary, §2.1
  },
},
```

*(Chip dictionary for `arc-window`: `attack` °, `clubPath` °, `contactMM` mm vs ball equator, `divotStart` cm, `divotLen` cm, `band` word — analogous to `CHIP_DEFS`.)*

**What the reader watches:** one slider. Dragging the low point from behind the ball to far ahead sweeps attack from **+2.35° (x −6 cm)** through **0.00° (x 0)** to **−5.88° (x +15)** and on to **−9.83° (x +25, bladed Thin)** — the readout, the tangent arrow and the band chip all move together; ~**0.39° per cm (≈1° per inch)**.

### 3.2 CONTENT JSON (authored copy — ship verbatim, JSON-escape on build)

**parameter:** `Low Point`

**oneLiner:** `Your swing is a circle, and every circle has a bottom. Where that bottom sits — behind the ball, at it, or ahead of it — is the single number that decides whether you strike down, level, or up.`

**whatItIs:** `The low point is the lowest point of the arc your clubhead travels on. It is not a feeling and not a technique — it is a place, measured in centimetres along the target line, relative to the ball. In this app's geometry engine (swing-parameters-and-impact.js) it is literally the state variable lowPoint.x, and the whole strike story falls out of one line of trigonometry: theta = asin(−xLP / R) finds where on the circle the ball sits, and deriveImpact() converts that place into the attack angle. Put the bottom of the circle AHEAD of the ball (positive x, toward the target) and the club must still be descending when it arrives at the ball — a negative attack angle and, with turf, a divot that starts after the ball. Put the bottom BEHIND the ball and the club is already climbing — a positive attack angle, which is exactly what a teed driver wants and a grounded 7-iron does not. Engine-run: sliding the low point from 6 cm behind the ball to 15 cm ahead (plane 55°) sweeps attack angle from +2.35° to −5.88° — about 0.4° per centimetre, the famous "one degree per inch of ball position" from the range, computed instead of recited.`

**components:** *(4 entries)*
1. **name:** `lowPoint.x — the place along the target line` · **role:** `The master input. effectiveLpx() reads it (plus a swing-direction correction taught in lesson 3), thetaAtImpact() converts it to the ball's position on the circle, and deriveImpact() turns that into attack angle. Engine-run at plane 55°: x −6 cm → +2.35° up, x 0 → exactly 0.00°, x +10.5 cm → −4.11° down, x +15 → −5.88°.` · **typicalRange:** `irons: low point 2–15 cm ahead of the ball (the engine's own 'Pure' window, ideal centre +10.5 cm); driver: at or behind the ball`
2. **name:** `The radius (R = 1.2 m)` · **role:** `The circle's size sets how fast attack angle changes per centimetre of low point. theta = asin(−xLP/R): a bigger circle is flatter near its bottom, so the same offset produces a gentler angle.` · **typicalRange:** `fixed at 1.2 m in the engine — roughly a mid-iron swing radius`
3. **name:** `Club path, riding along (G-3)` · **role:** `The same geometry moves the head's horizontal direction: strike before the bottom and the head still travels slightly rightward/outward. Engine-run, swing direction held at 0: x +10.5 cm gives path +2.88°, x +15 gives +4.13°. Attack and path are two shadows of one place on the circle.` · **typicalRange:** `≈ +0.28° of in-to-out path per cm of low point ahead (plane 55°)`
4. **name:** `What it is NOT: depth` · **role:** `lowPoint.x says where along the line the bottom sits. How DEEP the bottom sits (lowPoint.z) is a different axis with a completely different job — the next lesson. Trailer, engine-run: attack angle at z −30 mm, 0 and +30 mm is −4.11°, −4.11°, −4.11°.` · **typicalRange:** `see the Strike Depth lesson`

**howTheyConnect:** `Think of the swing as a wheel rolling through the hitting area, and the ball as a stone on the ground somewhere along its path. Nothing about the wheel changes — only where the stone sits. If the stone is before the wheel's lowest point, the rim is still travelling downward when it hits; past the lowest point, upward. That is the entire mechanism: attack angle is not a move you make at the ball, it is an address — where you placed the bottom of your circle. The engine says it in two lines: theta = asin(−xLP/R) (where is the ball on the circle?) and attackAngle = atan2(sinθ·sinφ, hypot(cosθ, −sinθ·cosφ)) (what direction is the rim moving there?). Two things follow that most golfers have backwards. First, the slope is gentle and linear-ish in the playable zone — about 0.4° per cm (engine-run: 5.1° of attack across the 13 cm from x +2 to x +15) — so small setup drifts make small, predictable attack changes; nobody 'suddenly' hits 5° steeper without the bottom of their circle moving a lot. Second, the far end bites: push the low point 25 cm ahead (z = 0) and the club reaches the ball 21.6 mm above its bottom — equator height — and the band chip flips to Thin at the exact moment the geometry says 'blade'. Steep and thin are neighbours, which is why chasing an ever-more-forward low point without depth control tops the ball. The low point is the cause; attack angle, path nudge, contact height and the divot are all effects read off the same circle.`

**hierarchy:** *(3 drivers)*
1. **driver:** `Ball position / low-point offset (x)` · **weight:** `dominant — ~0.39°/cm ≈ 1.0°/inch (engine-run: +2 cm → −0.78°, +15 cm → −5.88°, plane 55°)` · **why:** `It is the direct argument of thetaAtImpact(). Nothing else in the geometry moves attack angle as much for a realistic change.`
2. **driver:** `Swing plane angle (φ)` · **weight:** `secondary multiplier — ~+0.05° per degree of plane (engine-run at x +10.5: plane 40° → −3.22°, 70° → −4.72°)` · **why:** `vz = sinθ·sinφ — a steeper plane converts the same circle-position into more vertical motion. Taught fully in lesson 3.`
3. **driver:** `Low-point depth (z)` · **weight:** `ZERO — exactly 0.00° per mm (engine-run: −4.11° at z −30/0/+30 mm)` · **why:** `deriveImpact() never reads lowPoint.z. Depth changes what the strike hits, never the angle it arrives at — the whole point of the next lesson.`

**realWorld:**
- tourBenchmarks:
  - `Launch monitors measure this directly: TrackMan's "Low Point" number reports cm ahead (A) or behind (B) the ball — tour iron strikes typically bottom out ~7–10 cm ahead, exactly the middle of this app's own Pure window (2–15 cm, ideal +10.5 cm)`
  - `Engine cross-check: the ideal +10.5 cm low point at the default 55° plane computes to −4.1° attack — landing on the tour mid-iron −4°..−5° benchmark from the Attack Angle lesson`
  - `Tour driver setups place the ball forward specifically to move the strike past the low point — the same single variable, used in the opposite direction`
- scenarios:
  - `Ball creeping back in the stance during a range session — attack quietly steepens ~1° per inch until strikes feel "trapped"`
  - `The fairway-wood off a tight lie that only works when the low point is barely ahead — the geometry's narrow Pure window at small x, made visible`
  - `A "steep" swing diagnosed on video that is really a ball position problem — the circle is fine, the stone moved`
- whatItMeansForYou: `Stop thinking of attack angle as something your hands do at impact and start thinking of it as somewhere the bottom of your circle sits. With irons, that bottom belongs a hand-width ahead of the ball; move the ball, not your swing, and watch the attack readout follow at about a degree per inch. When a strike pattern changes overnight, ask "where is my bottom?" before asking "what is wrong with my swing?".`

**misconceptions:** *(6 — each maps to a quiz distractor, §3.3)*
1. `"Attack angle is created at impact with the hands." It is set by where the low point sits, decided at address and by the swing's overall shape — the engine computes it from lowPoint.x and plane alone; nothing hand-shaped is in the formula.`
2. `"Hitting down means the low point is AT the ball." Backwards — hitting down means the low point is AHEAD of the ball; the club passes the ball on its way down to a bottom that comes later.`
3. `"More forward low point is always better ball-striking." Only inside the window. At z = 0 the engine blades the ball (Thin, contact at the equator) once the low point passes ~25 cm ahead — steep and thin are neighbours.`
4. `"The low point is where the divot is deepest, so it's behind the ball on good strikes." On a good iron strike the low point (and the whole divot) is ahead of the ball — ball first, then turf.`
5. `"A degree of attack angle needs a big swing change." ~1° per inch of ball position (engine-run 0.39°/cm) — it is one of the cheapest numbers in golf to move.`
6. `"Low point and attack angle are the same thing." One is a place (cm), the other is a direction (degrees) read off that place; lesson 2 shows a third quantity (depth) that moves neither.`

**wolframChecks:** *(engine-run, node — commands in Appendix A)*
1. `thetaAtImpact/deriveImpact sweep, plane 55°, z 0: x −6 cm → attack +2.35°, x 0 → 0.00°, x +2 → −0.78°, x +10.5 → −4.11°, x +15 → −5.88°, x +25 → −9.83° (Thin, contact +0.3 mm above equator), x +30 → −11.82° (Whiff)`
2. `slope check: (−5.88 − (−0.78))/13 cm = 0.392°/cm ≈ 1.00°/inch — the range rule of thumb, derived`
3. `path coupling: same sweep, clubPath +0.55° (x +2) → +2.88° (x +10.5) → +4.13° (x +15) — deriveImpact's swingDirection term held at 0`
4. `band flips (strikeQuality, z=0): x < 0 → Fat (low point behind), x 0..+2 → Thin ("not far enough ahead" — engine-run: Thin at exactly x 0), +2..+15 → Pure, +18..+25 → Thin, ≥ +30 → Whiff — matches LP_AHEAD_MIN/MAX 0.02/0.15`
5. `sanity: arcPosition(thetaAtImpact(state), state) lands at the ball (x = y = 0.0 mm) for swing directions −6, 0, +5 — the address-compensated lpWorld() keeps impact at the ball, so every drawn number belongs to the same strike`

### 3.3 Quiz (5 items — distractor ↔ misconception map in brackets)

1. **q:** `In the engine, what single input does thetaAtImpact() use to locate the ball on the swing's circle?` · options: `The golfer's grip pressure` [hands myth, M1] · `The low point's position along the target line (lowPoint.x)` ✔ · `The club's loft` [confuses delivery with geometry] · `The depth of the divot` [M4/depth confusion] · **answerIndex 1** · expl: `theta = asin(−effectiveLpx/R). Grip and loft never enter; depth (z) belongs to the next lesson and moves contact, not angle.`
2. **q:** `A well-struck 7-iron hits down about 4°. Where is the low point?` · `Exactly at the ball` [M2] · `About 10 cm ahead of the ball` ✔ · `About 10 cm behind the ball` [backwards] · `Wherever the hands release` [M1] · **1** · expl: `Engine-run: x +10.5 cm → −4.11° at the default 55° plane. Down means the bottom comes AFTER the ball.`
3. **q:** `Roughly how much attack angle does one inch of ball position buy?` · `~1°` ✔ · `~5°` [M5 overrated] · `~0.1°` [underrated] · `It depends only on swing speed` [speed myth] · **0** · expl: `0.39°/cm engine-run = ~1.0°/inch. Speed is nowhere in the geometry.`
4. **q:** `You keep pushing the low point further and further ahead of the ball (depth unchanged). What does the engine eventually do?` · `The strike gets purer forever` [M3] · `The ball is bladed — contact climbs to the equator and the band flips to Thin` ✔ · `The attack angle stops changing` · `The divot gets deeper` [depth confusion] · **1** · expl: `At x +25 cm (z = 0) contact height reaches +0.3 mm above the equator — Thin at −9.8° attack. Steep and thin are neighbours.`
5. **q:** `Moving the low point ahead also nudges which other delivery number, according to the same circle geometry?` · `Club path (slightly more in-to-out)` ✔ · `Clubhead speed` · `Face angle` · `Ball compression` · **0** · expl: `Engine-run: path +0.55° → +4.13° as x goes +2 → +15 cm (swing direction fixed 0). Attack and path are two shadows of one place on the circle.`

---

## 4. Lesson 2 — `strike-depth` · **"Depth vs. height on the ball"**  *(the pearls' home)*

### 4.1 Registry entry

```js
'strike-depth': { ...CONTENT['strike-depth'],
  node:'strike-depth', tier:'Geometry',
  identity:'clubZ = lowPoint.z + lift(θ) — depth moves contact, never the angle',
  next:'plane-coupling', nextLabel:'Plane Coupling', maxXp:190,
  diagramArchetype:'arc-window',
  diagramConfig:{
    title:'Depth vs. Height on the Ball', tag:'LIVE',
    readoutLabel:'Contact on the ball', readoutUnit:'mm',   // clubBallContact().offset, signed, spoken "below/above the equator"
    engineSliders:[
      {key:'lpz', label:'Low-point depth', min:-0.030, max:0.030, step:0.001, value:0.000, bind:'lowPointZ',
       unit:' mm', display:v=>Math.round(v*1000), unitSpoken:'millimetres, negative is below the turf', signed:true},
      {key:'lpx', label:'Low point', min:0, max:0.15, step:0.005, value:0.105, bind:'lowPointX',
       unit:' cm', display:v=>Math.round(v*100), unitSpoken:'centimetres ahead of the ball'},
    ],
    fixed:{ planeAngle:55, swingDirection:0 },
    chips:['attack','divotStart','divotLen','band'],
    presets:{
      picked: {label:'Picked & steep', lpx:0.15,  lpz: 0.002},   // pearl (b): attack −5.88°, NO turf, Pure
      tour:   {label:'Tour divot',     lpx:0.105, lpz:-0.002},   // Pure 82, divot starts +2.8 cm AFTER the ball
      deep:   {label:'Deep & clean',   lpx:0.15,  lpz:-0.0077},  // pearl (a) inverse: 7.7 mm divot, contact at turf level, Pure
      buried: {label:'Same depth, bottom behind', lpx:0.02, lpz:-0.004}, // fat: entry −8.8 cm behind ball
    },
  },
},
```

**The demo, spelled out (the owner's "no divot ≠ shallow attack" demo — MUST ship exactly like this):**
- Preset **Picked & steep** (`lpx +15 cm, lpz +2 mm`): readout shows attack **−5.88°** while the divot layer prints **"no turf contact"** (groundCrossingTheta0 = null) and the band chip shows **Pure**. The reader sees a *steeper-than-tour* attack with literally zero divot.
- Preset **Deep & clean** (`lpx +15 cm, lpz −7.7 mm`) — the inverse: the model's deepest ball-first divot, **7.7 mm** deep and **30 cm** long starting at the ball, contact tick at turf level (clubZ 0.0), band still **Pure**, attack *unchanged* at **−5.88°**.
- Dragging only the **depth** slider between the two presets, the attack readout **does not move** — that non-movement is the lesson, and the aria-label sentence must say it ("Attack unchanged, 5.9 degrees down").

### 4.2 CONTENT JSON

**parameter:** `Strike Depth`

**oneLiner:** `Depth is the forgotten axis of the low point: how far below (or above) the turf the bottom of your circle sits. It decides what you hit — turf first, ball first, equator, or air — and it never changes your attack angle by even a tenth of a degree.`

**whatItIs:** `Strike depth is lowPoint.z — the height of the arc's bottom relative to the ground. Where lesson 1's x-axis answered "down or up?", the z-axis answers "how much ball, how much earth?". The engine keeps the two jobs perfectly separate: deriveImpact() (attack angle) never reads z at all — engine-run, attack is −4.11° whether the bottom sits 30 mm below the turf or 30 mm above it — while clubBallContact() moves the contact point on the ball exactly one millimetre per millimetre of depth (clubZ = lowPoint.z + lift). Between the two extremes lives every strike you know: bottom far below turf = the club is underground at the ball (Fat, then Duff); bottom just below = ball first, then a divot ahead (Pure); bottom above the turf = a clean pick with no divot at all — which, and this is the part almost everyone has backwards, can still be a steeply descending blow. The divot is testimony about the arc's DEPTH; it says nothing about the arc's DIRECTION at the ball.`

**components:** *(4)*
1. **name:** `lowPoint.z — the depth dial` · **role:** `Moves contact height 1:1: clubZ = z + lift(θ). Engine-run at x +10.5/plane 55: z −30 mm → Duff, −25..−4 → Fat, −2..+15 → Pure, +18..+25 → Thin, +30 → Whiff. Every band edge is just the contact tick crossing a line on the ball.` · **typicalRange:** `playable window ≈ −8 mm (deepest ball-first, far-forward low point) to +15 mm (still Pure); the Geometry screen's slider allows ±20 cm`
2. **name:** `lift(θ) — how much the arc has climbed at the ball` · **role:** `Because the ball sits BEFORE the bottom (lesson 1), the club is still above its own low point when it arrives: lift = R(1−cosθ)sinφ. Engine-run lift table (plane 55): low point +2 cm ahead → 0.1 mm of lift, +8 → 2.2 mm, +10.5 → 3.8 mm, +15 → 7.7 mm. Lift is the divot budget: it is exactly how deep the bottom may sit below turf while the BALL is still struck cleanly.` · **typicalRange:** `0–8 mm across the Pure window`
3. **name:** `The divot pair (entry/exit)` · **role:** `Where the arc crosses the turf: groundCrossingTheta0() gives ±θ₀; entry before the bottom, exit after. Engine-run: x +10.5, z −2 mm → divot starts +2.8 cm AFTER the ball, 15.4 cm long — the tour pattern; x +2, z −4 mm → starts 8.8 cm BEHIND the ball — the fat. Same depth axis, opposite stories, because x decides where the dip lands.` · **typicalRange:** `good iron strike: entry 0–5 cm after the ball; model depths are mm-scale (see honesty note)`
4. **name:** `Contact height on the ball (the "height" of the title)` · **role:** `clubBallContact().offset = clubZ − ball radius, the tick on the ball face. −21.3 mm = struck at the very bottom, 0 = equator (blade), above = whiff. This — not divot depth — is what "hitting down on the ball" actually moves.` · **typicalRange:** `Pure band: contact 2.5–19.5 mm below the equator (offset −19.5..−2.5 mm engine-run at x +10.5)`

**howTheyConnect:** `Hold the picture from lesson 1 — the wheel and the stone — and now raise or lower the whole wheel. Nothing about "down or up at the stone" changes: the rim arrives at the same angle whether the wheel's bottom hangs a centimetre into soft ground or floats a centimetre above it. The engine proves the separation exactly: attack angle at z −30, 0 and +30 mm is −4.11°, −4.11° and −4.11°. What DOES change is what the rim meets. Lower the wheel and the contact point slides down the ball millimetre for millimetre until the rim is below the grass at the ball — turf first, fat. Raise it and contact slides up the ball toward the equator — thin, then air. The two pearls of this chapter both live here. Pearl one: a DEEP bottom does not mean hitting far down ON the ball, because x sets how much of that depth has already been climbed away when the club reaches the ball. Engine-run: a −4 mm bottom at x +10.5 strikes at −0.2 mm (leading edge a hair under the grass), and a −6 mm bottom at x +13 strikes at the SAME −0.2 mm — half again more divot depth, identical height on the ball. Divot depth and strike height are different measurements of different things. Pearl two, the inverse: NO divot does not mean a shallow blow. Put the bottom 2 mm ABOVE the turf with the low point 15 cm ahead and the engine reports attack −5.88° — steeper than the tour 7-iron average — with zero turf contact and a Pure band. A clean picker can be the steepest hitter on the range; the grass just never got to testify. And the fat you feel when the bottom is barely ahead of the ball is the same geometry running backwards: at x +2 the divot budget is 0.1 mm — the club has essentially no lift left at the ball, so ANY depth at all digs in behind it (engine-run: z −4 at x +2 → entry 8.8 cm behind the ball). Depth chooses what you hit; x chooses where the dip lands; the angle was never up for negotiation.`

**hierarchy:** *(3)*
1. **driver:** `lowPoint.z` · **weight:** `total control of contact height — 1.000 mm per mm (clubZ = z + lift, engine identity)` · **why:** `It is an additive term. The band chip is a pure function of where the tick lands.`
2. **driver:** `lowPoint.x (via the lift budget)` · **weight:** `sets how much depth is survivable — budget 0.1 mm at x +2 cm up to 7.7 mm at x +15 (engine lift table)` · **why:** `Ball-first requires clubZ ≥ 0 at the ball, i.e. z ≥ −lift(θ). Forward low point = bigger budget = deeper clean divots.`
3. **driver:** `Attack angle` · **weight:** `ZERO influence in either direction — depth does not move attack (−4.11° at any z) and attack does not require turf (Pure at z +5 mm)` · **why:** `deriveImpact() and groundCrossingTheta0() share no variable except through x and plane. The divot and the angle are witnesses to different events.`

**realWorld:**
- tourBenchmarks:
  - `Tour iron divots start AFTER the ball — the model reproduces the pattern at x +10.5, z −2 mm: divot entry +2.8 cm past the ball, exit +18.2 cm (a bacon-strip ~15 cm long)`
  - `Plenty of elite players are "pickers" — clean, divotless iron strikes with completely normal descending attack angles; TrackMan classes them by low point ahead, not by turf taken`
  - `The engine's own Pure window tops out at a 7.7 mm model divot — real divots read deeper (1–2 cm) because a real sole passes below the ball while the FACE strikes it; the point-club model compresses that (honesty note G-1)`
- scenarios:
  - `Range mats hiding a fat pattern: the mat pays the depth penalty the turf would — the bottom sits below "grass" but the club skids instead of digging. Same z, kinder surface`
  - `"I took no divot so I must have picked it clean/shallow" — the picker with a steep, perfectly fine strike (pearl b), and the scooper who ALSO takes no divot but with the bottom behind the ball: same missing divot, opposite geometry`
  - `Wet vs firm turf changing effective depth: soft ground effectively raises z's cost — the same swing that brushed dry turf digs on soggy ground`
- whatItMeansForYou: `Read your strikes as two separate dials. The divot (its start point and existence) reports your DEPTH and your x; the flight's steepness reports your x and plane. When contact is heavy, you don't necessarily "swing too steep" — your circle's bottom may simply sit too low, or not far enough ahead. And when you take no divot at all, don't assume shallow: check where the strike met the ball. Fixing the right dial is the difference between a setup adjustment and six months of rebuilding a swing that was never broken.`

**misconceptions:** *(6)*
1. `"A deep divot means I hit steeply down on the ball." Divot depth is z; attack is x-and-plane. Engine: −4 mm and −6 mm bottoms both strike the ball at −0.2 mm when x compensates — more earth, same ball. [PEARL a]`
2. `"No divot = shallow attack angle." The engine's cleanest counterexample: bottom 2 mm above turf, low point 15 cm ahead → attack −5.88°, no turf, Pure. The divot testifies about depth, never direction. [PEARL b]`
3. `"Hitting down digs the club into the ground, so hitting down causes fat shots." Fat is depth-behind-the-ball. A steeper descending strike with the bottom well ahead takes turf AFTER the ball; the fat happens when the bottom (however shallow) sits barely ahead or behind.`
4. `"The strike bands (Pure/Thin/Fat) are judgements about my swing." They are a ruler on the ball: the engine flips band exactly when the contact tick crosses a line (turf level, equator, 1.4 ball-radii). Move z one millimetre across an edge and the word changes.`
5. `"To stop blading it, help the ball up." Thin contact = tick too high = bottom too high (or x too far forward). Raising the hands raises the bottom further. The fix is down and/or less far forward — the opposite instinct.`
6. `"Divots should start at the ball." At the ball is the boundary case; the tour pattern starts 2–5 cm after it (engine: +2.8 cm at the ideal x, 2 mm depth). Starting AT or BEFORE the ball is the first warning of a depth/x budget problem.`

**wolframChecks:**
1. `invariance: deriveImpact attack = −4.11° at lowPoint.z ∈ {−0.030, 0, +0.030} m (x +10.5 cm, plane 55°) — identical, structurally: deriveImpact() has no z term at all`
2. `contact 1:1: clubBallContact clubZ at z −10/0/+10 mm = −6.2/+3.8/+13.8 mm — slope exactly 1 mm/mm; offset vs ball equator −27.5/−17.5/−7.5 mm`
3. `band ladder at x +10.5: z −30 Duff · −25 Fat(edge) · −4 Fat (clubZ −0.2) · −2 Pure (divot +2.8..+18.2 cm) · +15 Pure (offset −2.5) · +18 Thin (offset +0.5) · +30 Whiff (clubZ 33.8 > 1.4·ball radius 29.8)`
4. `pearl (a) triple: (x+10.5, z−4) clubZ −0.2 mm & (x+13, z−6) clubZ −0.2 mm — deeper bottom, same strike height; (x+2, z−4) clubZ −3.9 mm, turf entry −8.8 cm (fat) — same depth, budget blown`
5. `pearl (b) triple: (x+15, z+2) attack −5.88°, groundCrossingTheta0 = null (no turf), band Pure 79; inverse (x+15, z−7.7) attack −5.88°, divot 0→+30 cm, 7.7 mm deep, Pure 70`
6. `lift budget table: deepest ball-first z = −0.1/−0.9/−2.2/−3.8/−5.8/−7.7 mm at x +2/+5/+8/+10.5/+13/+15 cm (clubZ(z=0) per x — engine-run)`

### 4.3 Quiz (5 — pearls are Q2 and Q3)

1. **q:** `In the engine, what happens to attack angle when you move the low point 3 cm deeper into the turf (x unchanged)?` · `It gets ~3° steeper` [depth=steepness myth] · `Nothing — exactly 0.0° of change` ✔ · `It gets shallower as the club decelerates` [invented physics] · `It depends on club speed` [speed myth] · **1** · expl: `deriveImpact() never reads lowPoint.z. Engine-run: −4.11° at z −30, 0 and +30 mm. Depth moves WHAT you hit, not the angle you arrive at.`
2. **q (PEARL a):** `Player A's circle bottoms 4 mm under the turf, 10.5 cm ahead of the ball. Player B's bottoms 6 mm under, 13 cm ahead. Who strikes lower on the ball?` · `B — deeper bottom means hitting further down on the ball` [the pearl's target myth] · `Neither — both strike at the same height (engine: −0.2 mm for both)` ✔ · `A — shallower divots always strike lower` · `Cannot be known without swing speed` [speed myth] · **1** · expl: `clubZ = z + lift(x): B's extra 2 mm of depth is paid for by 2 mm more lift from the more-forward bottom. Divot depth and strike height are different measurements — the owner's pearl, computed.`
3. **q (PEARL b):** `A golfer never takes a divot. What does that tell you about their attack angle?` · `It must be shallow or level` [the pearl's target myth] · `It must be positive (hitting up)` [stronger version of same myth] · `Nothing — the engine shows −5.9° down with zero turf contact (bottom 2 mm above the grass, 15 cm ahead)` ✔ · `They must be topping the ball` [confuses clean pick with thin] · **2** · expl: `The divot testifies about the arc's DEPTH, not its DIRECTION. A picked strike from a bottom just above the turf can be steeper than the tour average — Pure band, no grass harmed.`
4. **q:** `Why does the tour divot start AFTER the ball?` · `Because the club bounces off the ball first` · `Because the arc's bottom — and therefore its below-turf dip — sits ahead of the ball` ✔ · `Because tour players hit up on their irons` [driver confusion] · `It doesn't — good divots start at or behind the ball` [M6] · **1** · expl: `Engine-run: x +10.5, z −2 mm → turf entry +2.8 cm past the ball, exit +18.2 cm. Ball first at −4.1° down, then the dip.`
5. **q:** `Same 4 mm depth, but the low point only 2 cm ahead of the ball. The engine says:` · `Pure — depth is fine at any x` [budget blindness] · `Fat — turf entry 8.8 cm BEHIND the ball, because the lift budget at x +2 is only 0.1 mm` ✔ · `Thin — less forward always thins it` · `Whiff` · **1** · expl: `Ball-first needs z ≥ −lift(x). The budget grows with x: 0.1 mm at +2 cm, 3.8 mm at +10.5, 7.7 mm at +15. Depth is only survivable when the bottom is far enough ahead.`

---

## 5. Lesson 3 — `plane-coupling` · **"The plane coupling"**

### 5.1 Registry entry

```js
'plane-coupling': { ...CONTENT['plane-coupling'],
  node:'plane-coupling', tier:'Geometry',
  identity:'xLP(effective) = lowPoint.x − dir·R·cos(plane)·π/180',
  next:null, nextLabel:null, maxXp:190,
  diagramArchetype:'arc-window',
  diagramConfig:{
    title:'One Linked System', tag:'LIVE',
    readoutLabel:'Effective low point', readoutUnit:'cm',    // effectiveLpx(state)·100, signed, "ahead/behind"
    engineSliders:[
      {key:'plane', label:'Plane', min:45, max:70, step:1, value:55, bind:'planeAngle', unit:'°', unitSpoken:'degrees'},
      {key:'dir', label:'Swing direction', min:-8, max:8, step:0.5, value:0, bind:'swingDirection', unit:'°', unitSpoken:'degrees, positive in-to-out', signed:true},
      {key:'lpx', label:'Low point', min:-0.05, max:0.20, step:0.005, value:0.105, bind:'lowPointX',
       unit:' cm', display:v=>Math.round(v*100), unitSpoken:'centimetres ahead of the ball'},
    ],
    fixed:{ lowPointZ:-0.002 },   // 2 mm brush so the divot markers respond live
    chips:['attack','clubPath','divotStart','band'],
  },
},
```

**What the reader watches:** hold the low point at +10.5 cm and drag only **swing direction**. On a flat 45° plane the effective low point races **−1.48 cm per degree** (dir +8 → effLpx −1.3 cm, the bottom now BEHIND the ball, attack +0.46°, band Fat); repeat on a steep 70° plane and the same slider only moves it **−0.72 cm per degree** (dir +8 → effLpx +4.8 cm, still Pure). The readout is `effectiveLpx()` itself — the reader literally watches the engine's coupling constant change with plane.

### 5.2 CONTENT JSON

**parameter:** `Plane Coupling`

**oneLiner:** `Plane, swing direction and low point are not three settings — they are one linked system. Turn any one of them and the engine moves your real, effective low point for you, whether you meant it or not.`

**whatItIs:** `The x-axis low point you learned in lesson 1 is where the bottom sits if you swing straight down the line. Rotate the swing direction and the whole tilted circle rotates with it — and because the circle is tilted (the plane), rotating it slides the bottom along the target line. The engine does this bookkeeping in one line, effectiveLpx(): xLP(effective) = lowPoint.x − swingDirection · R·cos(plane)·π/180. The coupling constant R·cos(plane) is the part worth tattooing somewhere: it says the FLATTER your plane, the more every degree of swing direction drags your low point around — engine-run: 1.48 cm per degree at a 45° plane, 1.20 at 55°, only 0.72 at 70°. Plane also has the direct effect from lesson 1 (steeper plane = more attack per cm, ~+0.05°/° of plane) and it sets the lift budget from lesson 2. Which is why the chapter ends here: x, z and plane are not tuned separately. A change of swing direction that means nothing on a steep plane can silently move a flat-plane player's bottom from "hand-width ahead" to "behind the ball" — same ball position, same feel, completely different strike.`

**components:** *(4)*
1. **name:** `The coupling constant R·cos(plane)` · **role:** `How many cm of low point one degree of swing direction is worth. Engine-run: 1.481 cm/° (plane 45), 1.201 (55), 0.716 (70). Flat planes pay the steepest exchange rate.` · **typicalRange:** `0.7–1.5 cm per degree over the instrument's 45–70° plane range`
2. **name:** `Swing direction (dir)` · **role:** `Positive = in-to-out. It shifts the effective bottom BACKWARD (a positive dir subtracts from xLP): swing out to right field and your bottom arrives earlier. Engine-run at plane 45, x +10.5: dir +8 → effective x −1.3 cm (behind the ball!), attack +0.46°, Fat. The same +8 at plane 70 keeps +4.8 cm, −2.14°, Pure.` · **typicalRange:** `±8° on the instrument; ±4° covers most real patterns`
3. **name:** `Out-to-in, the other direction` · **role:** `Negative dir ADDS effective low point and steepens everything: plane 45, dir −8 → effective x 22.3 cm, attack −7.57°, band Thin (contact riding up the ball). The classic over-the-top strike — steep, forward-bottomed, prone to thin/heel — emerges from pure geometry with no "swing flaw" narrative needed.` · **typicalRange:** `each −1° of direction ≈ +0.7..1.5 cm of effective low point, by plane`
4. **name:** `Plane's own two dials (recap)` · **role:** `Direct: same x reads steeper on a steeper plane (engine-run at x +10.5: −3.22° at 40°... −4.72° at 70°, ~+0.05°/°). Budget: steeper plane lifts the club more at the ball (clubZ 3.0 → 4.3 mm across 40→70°), slightly widening the clean-divot window. Plane is a multiplier on both earlier lessons.` · **typicalRange:** `45–70° on the instrument; engine default 55°`

**howTheyConnect:** `Picture the tilted hula-hoop of your swing lying at its plane angle, its lowest point marked with chalk. Now rotate the whole hoop a few degrees to the right, as an in-to-out swinger does. The chalk mark doesn't stay put — it slides around the hoop, and because the hoop is tilted, "around the hoop" has a component ALONG the target line. That slide is the coupling, and its size is R·cos(plane): a flat hoop's bottom lives far from the pivot horizontally, so rotation swings it a long way (1.48 cm/°); a steep hoop's bottom sits nearly under the pivot, so the same rotation barely moves it (0.72 cm/°). Everything the chapter taught now runs through this one line. The engine's own numbers, low point held at +10.5 cm with a 2 mm turf brush: a flat-plane player (45°) who starts swinging +8° in-to-out watches the effective bottom move to 1.3 cm BEHIND the ball — attack flips to +0.5°, the divot jumps behind the ball, the band reads Fat — while nothing about their ball position or depth changed. The steep-plane player (70°) making the identical direction change keeps the bottom 4.8 cm ahead and stays Pure. Run it the other way and the over-the-top move (−8° at 45°) piles up 22.3 cm of effective low point: attack −7.6°, contact climbing the ball, Thin. This is what "must cohere" means: x, z, plane and direction are four inputs to ONE circle, and the strike bands only reward combinations that agree. It is also why the same swing-direction tip helps one golfer and wrecks another — the exchange rate depends on the plane they brought with them.`

**hierarchy:** *(3)*
1. **driver:** `Swing direction × the coupling (dir · R·cos φ)` · **weight:** `dominant mover of the EFFECTIVE low point — up to ±12 cm across the ±8° slider on a flat plane (engine-run: effLpx 22.3 → −1.3 cm at plane 45)` · **why:** `It is the only term in effectiveLpx() besides x itself. On flat planes it can outmuscle deliberate ball-position changes.`
2. **driver:** `Plane angle (as the exchange-rate setter)` · **weight:** `halves the coupling across the slider range (1.48 → 0.72 cm/° from 45° to 70°)` · **why:** `cos(plane) — the flat plane's bottom sits far from the pivot horizontally; rotation moves it more.`
3. **driver:** `Plane angle (direct steepness)` · **weight:** `secondary — ~+0.05° attack per degree of plane at fixed x (−3.55° → −4.72° across 45–70°)` · **why:** `vz = sinθ·sinφ, the lesson-1 multiplier; real but a third of the ball-position lever.`

**realWorld:**
- tourBenchmarks:
  - `TrackMan's classic pairing: out-to-in swings measure steeper attack, in-to-out swings shallower — the engine derives it (dir −8 → −7.6°, dir +8 → +0.5°, plane 45, same ball position) rather than asserting it`
  - `Flat-plane "rotary" players are famously sensitive to start-direction changes turning into contact changes; upright players get away with more — the cos(plane) exchange rate, named`
  - `The fitter's cross-check: a player who "suddenly hits it fat" after learning to draw the ball (in-to-out shift) hasn't lost their swing — their effective low point moved back ~1–1.5 cm per degree of direction change`
- scenarios:
  - `The draw project that turned into fat shots: +4° of new in-to-out at a 45° plane = the bottom ~6 cm earlier. The fix is a ball-position/x compensation, not abandoning the draw`
  - `The over-the-top slicer's deep, ball-side divots and occasional thins: −6° direction at a flattish plane piles ~9 cm ONTO the effective low point — steep AND thin-prone at once (engine: Thin at effLpx 22.3 cm)`
  - `Why one range tip ("swing more right") fixes a steep friend and buries yours: different planes, different exchange rates`
- whatItMeansForYou: `When you change one of the three — plane, direction, or low point — assume the other two moved and go look. The instrument's Geometry screen shows all four numbers live; the cheapest habit in this chapter is checking the EFFECTIVE low point readout after any direction change. If you swing in-to-out on a flatter plane, your real bottom lives closer to the ball than your setup says — budget for it with ball position before you blame your contact.`

**misconceptions:** *(6)*
1. `"Swing direction only changes where the ball starts, not how I strike it." Direction moves your effective low point 0.7–1.5 cm per degree (plane-dependent). At a flat plane, +8° in-to-out relocates the bottom behind the ball — a Fat, from a direction change alone.`
2. `"Steep plane = steep attack = digging." Partly true (−0.05°/° direct effect) but the steep plane is the STABLE one under direction changes (0.72 vs 1.48 cm/°) and carries a bigger lift budget at the ball. Steepness where it matters is mostly x, not plane.`
3. `"In-to-out is the shallow, safe pattern." Shallower in angle, yes (engine: +8° dir → attack +0.46°) — but it drags the bottom BACK, which is the fat direction. Safe only if ball position compensates.`
4. `"Over-the-top means fat shots." Usually the opposite: out-to-in ADDS effective low point ahead (engine: 22.3 cm at −8°/plane 45) — steep contact climbing the ball: thin, not fat, is its signature miss.`
5. `"These are three independent sliders." One formula binds them: xLP_eff = x − dir·R·cos(plane)·π/180. The chapter exists because they must cohere.`
6. `"The coupling is a quirk of this app." It is rigid-circle trigonometry — any tilted circle's bottom slides along the line when the circle rotates. The engine just makes the constant visible.`

**wolframChecks:**
1. `effectiveLpx coupling per +1° of swing direction: −1.481 cm (plane 45), −1.201 (55), −0.716 (70) — engine-run finite difference, matches R·cos(φ)·π/180 with R = 1.2 m`
2. `flat-plane flip: x +10.5, plane 45: dir +8 → effLpx −1.3 cm, attack +0.46°, band Fat; dir −8 → effLpx 22.3 cm, attack −7.57°, band Thin — full Fat↔Thin traverse from direction alone`
3. `steep-plane stability: x +10.5, plane 70: dir +8 → effLpx +4.8 cm, attack −2.14°, Pure; dir −8 → 16.2 cm, −7.30°, Thin — half the excursion`
4. `plane direct effect at fixed x +10.5, dir 0: attack −3.22/−3.55/−4.11/−4.72° at plane 40/45/55/70 (≈ +0.05°/°); lift 3.0/3.3/3.8/4.3 mm`
5. `address-compensation sanity under coupling: arcPosition(thetaAtImpact) = (0.0, 0.0) mm at dir −6/0/+5 — lpWorld()'s stance shift keeps impact at the ball, so the coupling numbers are strike-for-strike comparable`

### 5.3 Quiz (5)

1. **q:** `The engine computes your EFFECTIVE low point as lowPoint.x − dir·R·cos(plane)·π/180. What does swinging more in-to-out (positive dir) do?` · `Moves the effective bottom backward, toward/behind the ball` ✔ · `Moves it further ahead` · `Nothing until dir exceeds 8°` · `Changes depth (z)` · **0** · expl: `Positive dir subtracts. Engine-run at plane 45: +8° moves a +10.5 cm bottom to −1.3 cm — behind the ball.`
2. **q:** `Who feels a 3° swing-direction change more in their strike?` · `A flat-plane (45°) swinger — ~1.5 cm of low point per degree` ✔ · `A steep-plane (70°) swinger — ~0.7 cm per degree` · `Both the same — direction is direction` [independence myth] · `Neither — direction never affects strike` [M1] · **0** · expl: `The exchange rate is R·cos(plane): 1.48 vs 0.72 cm/°. Flat planes pay double.`
3. **q:** `An over-the-top (out-to-in) move at a flattish plane most characteristically produces:` · `Fat shots — it digs behind the ball` [M4] · `A steeper attack AND thin-prone contact — the effective bottom piles up far ahead` ✔ · `A shallower attack` · `No strike change, only a pull` [M1] · **1** · expl: `Engine-run: dir −8, plane 45 → effLpx 22.3 cm, attack −7.6°, band Thin. Steep and thin arrive together — lesson 1's neighbours, delivered by direction.`
4. **q:** `You've been learning a draw (+4° in-to-out, plane ~45°) and suddenly hit it heavy. The chapter's diagnosis?` · `You lost your swing — rebuild it` · `Your effective low point moved ~6 cm back with the new direction; compensate with ball position/x` ✔ · `You're now too steep` · `Your depth (z) changed on its own` · **1** · expl: `4° × 1.48 cm/° ≈ 5.9 cm of effective low point, gone backward. Same swing, same depth — the coupling moved the bottom.`
5. **q:** `Why does the same "swing more right" tip fix one golfer's strike and ruin another's?` · `Golf tips are random` · `Their planes differ, so the cm-per-degree exchange rate differs — the coupling is plane-dependent` ✔ · `One of them has a faster swing` [speed myth] · `Direction only matters for lefties` · **1** · expl: `R·cos(plane): the tip moves a 70°-plane bottom 0.72 cm/° but a 45°-plane bottom 1.48 cm/°. Same advice, double the dose.`

---

## 6. Acceptance checklist (build agent runs before merge)

1. `node` reproduction: every number quoted in lesson copy/quiz explanations appears in a rerun of Appendix A's script within ±0.05 (° / mm / cm).
2. New nodes unlock exactly per §1.1 (attack-angle completion opens `low-point`; chain thereafter); **no existing node's lock state changes** for a store snapshot taken before the merge.
3. `arc-window` renders all three configs; depth slider drag in L2 leaves the attack readout byte-identical; "no turf contact" caption appears at the Picked & steep preset.
4. XP economy: each lesson maxXp 190; completing all three at perfect-run = +570; mastery at 4/5.
5. A11y sweep per `academy-polish-spec.md` §7: canvas aria-label sentences update per input; sliders announce spoken units; reduced-motion renders complete states.
6. "N of 24 mastered" — no stray literal 21 remains.

---

## Appendix A — node run log (the numbers' provenance)

Script: `lowpoint-sweeps.mjs` (session scratchpad; recreate trivially — it only imports `swing-parameters-and-impact.js` and calls `deriveImpact` / `clubBallContact` / `strikeQuality` / `effectiveLpx` / `arcPosition` / `thetaAtImpact`, plus a bisection turf-crossing check that agrees with `geo3d/groundcontact.js#groundCrossingTheta0`'s closed form). State base: `radius 1.2, plane 55°, dir 0, z 0, x +10.5 cm` unless noted. Selected rows (attack°, clubZ mm, band, turf entry/exit cm rel. ball):

| id | state | attack | path | clubZ | band | turf entry→exit |
|---|---|---|---|---|---|---|
| A1 | z −30 mm | −4.11 | +2.88 | −26.2 | Duff | −18.9 → +39.9 |
| A4 | z −10 mm | −4.11 | +2.88 | −6.2 | Fat | −6.6 → +27.6 |
| A8 | z −2 mm | −4.11 | +2.88 | +1.8 | Pure 82 | **+2.8 → +18.2** |
| A9 | z −4 mm | −4.11 | +2.88 | −0.2 | Fat 50 | −0.3 → +21.3 |
| A11 | z +5 mm | −4.11 | +2.88 | +8.8 | Pure 88 | none |
| A16–A20 | z +18/+20/+25/+30 | −4.11 | +2.88 | 21.8/23.8/28.8/33.8 | Thin/Thin/Thin/Whiff | none |
| B0 | x −6 cm | +2.35 | −1.64 | +1.2 | Fat | none |
| B3 | x 0 | 0.00 | 0.00 | 0.0 | Thin | none |
| B8 | x +10.5 | −4.11 | +2.88 | +3.8 | Pure 84 | none |
| B11 | x +15 | −5.88 | +4.13 | +7.7 | Pure 77 | none |
| B14 | x +25 | −9.83 | +6.97 | +21.6 | Thin 99 (offset +0.3) | none |
| B15 | x +30 | −11.82 | +8.42 | +31.2 | Whiff | none |
| C | plane 40/45/55/70 (x +10.5) | −3.22/−3.55/−4.11/−4.72 | +3.85/+3.55/+2.88/+1.72 | 3.0/3.3/3.8/4.3 | Pure | none |
| D | coupling per +1° dir | — | — | — | — | −1.481 / −1.201 / −0.716 cm at plane 45/55/70 |
| D45 | plane 45, dir +8 | +0.46 | +7.54 | +0.1 | Fat (effLpx −1.3) | none |
| D45′ | plane 45, dir −8 | −7.57 | −0.37 | +14.8 | Thin (effLpx 22.3) | none |
| D70 | plane 70, dir +8 | −2.14 | +8.78 | +0.9 | Pure (effLpx +4.8) | none |
| P-b | x +15, z +2 mm | **−5.88** | +4.13 | +9.7 | **Pure 79** | **none** |
| P-a | x +13, z −6 mm | −5.09 | +3.58 | −0.2 | Fat 50 | −0.2 → +26.2 |
| P-a′ | x +15, z −7.7 mm | −5.88 | +4.13 | 0.0 | Pure 70 | 0.0 → +30.0 |
| P-a″ | x +2, z −4 mm | −0.78 | +0.55 | −3.9 | Fat 42 | −8.8 → +12.8 |
| X-3 | x 0, z −4 mm | 0.00 | 0.00 | −4.0 | Fat 42 | −10.8 → +10.8 |
| L | lift budget (z=0 clubZ) | — | — | 0.1/0.9/2.2/3.8/5.8/7.7 mm at x +2/+5/+8/+10.5/+13/+15 | — | — |
| S | sanity dir −6/0/+5 | impact at ball (0.0, 0.0 mm) | | | | |

— Fable 5, design director
