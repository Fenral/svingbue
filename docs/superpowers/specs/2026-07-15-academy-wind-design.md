# Flightglass Academy — Wind Experience Design

**Status:** Normative design specification, 2026-07-15. Ready for an
implementation plan after the shared Academy curriculum/store migration spec
exists.

**Experience ID:** `wind`

**Learner-visible title:** **Wind**

**Owned legacy concept:** `wind`

**Primary job:** separate the along-line Carry estimate from across-line drift
while preserving the immutable engine shot

**Goal family:** Playing conditions

**Prerequisites for mastery:** Carry and Carry Side

**Preview:** Always available

**Normative inputs:**

- `docs/superpowers/specs/2026-07-15-academy-outcome-curriculum-blueprint.md`
- `docs/superpowers/specs/2026-07-15-academy-shot-pattern-design.md`
- `docs/superpowers/specs/2026-07-15-academy-carry-design.md`
- the current Academy wind post-solve layer in `academy.html`
- `impact-flight.js`

## 1. Learner promise

Teach the learner to resolve one wind into two different jobs, add crosswind
drift after the engine's existing start-and-curve result, and keep launch spin
and Spin Axis unchanged.

The experience succeeds only when the learner can:

1. resolve a wind into head/tail and crosswind components relative to the
   target line;
2. identify the head/tail component as the current Carry-estimate input;
3. identify the crosswind component as the current drift-estimate input;
4. explain why the internal headwind/tailwind estimate is asymmetric;
5. distinguish engine Curve from wind drift;
6. reconstruct engine Carry Side as start-line displacement plus Curve;
7. add wind drift only after that engine result;
8. keep Club Speed, Ball Speed, Launch, Backspin rpm and Spin Axis unchanged;
9. identify the exposure amplifier as a heuristic based on Launch and Spin Loft;
10. build two wind states over one immutable engine shot and explain every
    component of their endpoint difference.

## 2. Non-goals

- Do not claim Wind changes launch Backspin rpm or Spin Axis.
- Do not call wind drift side spin or engine Curve.
- Do not replace engine Carry Side with wind drift.
- Do not claim a pure crosswind has exactly zero effect on real Carry.
- Do not call the estimator a full relative-airflow trajectory solver.
- Do not claim the head/tail coefficients are universal for every trajectory.
- Do not promise exact aiming, club selection or a “one club per X mph” rule.
- Do not model gusts, vertical wind, wind shear, terrain shielding or swirl.
- Do not fetch live weather or require network access.
- Do not let Wind mastery bypass Carry and Carry Side transfer knowledge.
- Do not change `impact-flight.js`.

## 3. Legacy-content verdict

The legacy content correctly separates along-line and cross-line wind and keeps
impact outputs fixed. Its instrument, however, draws a wind endpoint from drift
alone and omits the engine's existing Offline/Carry Side baseline. This makes
wind appear to replace Start Line and Curve instead of modifying their result.

### Retain, rewritten

- resolve one vector into along-line and cross-line components;
- headwind penalty and tailwind benefit are asymmetric in the current estimate;
- crosswind drift scales with estimated Carry and an exposure heuristic;
- launch Backspin and Spin Axis are fixed at impact;
- high/lofted states may be more wind-sensitive in real flight;
- all wind outputs remain post-solve `EST`.

### Reject from learner-facing copy

- endpoint diagrams that start at target-line zero when engine Carry Side is
  non-zero;
- “Crosswind changes direction, not distance” as an absolute real-world law;
- “Wind does not affect Carry” for pure crosswind as an exact promise;
- TrackMan percentage claims without a direct source attached to the sheet;
- a universal “1 foot per 100 yards per mph” law;
- claims that Spin Loft itself determines real wind exposure;
- exact course advice from sustained wind;
- narrative about pros flighting shots down as a prescribed fix.

### Correct integration

The visible decomposition is:

```text
Start-line displacement + engine Curve = engine Carry Side

engine Carry Side + EST wind drift = first-order wind-adjusted side estimate
```

The first line comes from current `solveFlight()`. The second is an Academy
post-solve estimate and remains visually/semantically separate.

## 4. Definition and truth contract

### 4.1 Sign convention

UI never exposes ambiguous signed labels alone.

- Head/tail slider center: Calm;
- positive internal `head`: headwind, wind toward the player;
- negative internal `head`: tailwind, wind toward the target;
- positive internal `cross`: wind from the left, pushes right;
- negative internal `cross`: wind from the right, pushes left;
- Carry Side/drift positive: right of target for a right-handed coordinate view;
- Carry Side/drift negative: left.

Both semantic direction and signed value appear in the data table.

### 4.2 Immutable engine shot

Wind interaction cannot alter:

- Club Speed;
- Ball Speed;
- Smash;
- Launch Angle;
- Spin Loft;
- Backspin rpm;
- Start Direction;
- Spin Axis;
- engine Carry;
- engine Curve;
- engine Carry Side/Offline.

These remain solid `ENGINE` outputs.

### 4.3 Head/tail Carry estimate

Let `h` be signed mph, positive headwind.

```text
if h ≥ 0:
  HeadTailMultiplier = max(
    0.40,
    1 − (0.0001 × h² + 0.009 × h)
  )

if h < 0 and t = −h:
  HeadTailMultiplier =
    1 + (0.008 × t − 0.0001 × t²)

EstimatedWindCarry = engineCarry × HeadTailMultiplier
```

Register: `EST WIND`.

The asymmetry is current-estimator behavior. It may be explained qualitatively
through relative airflow, but the coefficients are not a universal wind law.

### 4.4 Crosswind drift estimate

```text
ExposureAmplifier =
  1
  + clamp((LaunchAngle − 14) / 40, 0, 0.60)
  + clamp((SpinLoft − 25) / 140, 0, 0.35)

WindDrift =
  CrosswindMph
  × EstimatedWindCarry
  / 300
  × ExposureAmplifier
```

Register: `EST WIND`.

The amplifier is not Hang Time. It is a heuristic that uses Launch and Spin
Loft as proxies. Current Backspin rpm and Apex are not inputs.

Learner copy:

> Real wind response depends on the full trajectory and relative airflow. This
> estimator uses Carry plus simple launch/delivery proxies.

### 4.5 Side endpoint composition

Current engine:

```text
StartComponent = engineCarry × sin(StartDirection)

engineCarrySide = StartComponent + engineCurve
```

Wind overlay:

```text
FirstOrderWindSideEstimate = engineCarrySide + WindDrift
```

Register of final line: `FIRST-ORDER EST`.

Important limitation: the engine start/curve baseline is not re-integrated at
the wind-adjusted downrange distance. The overlay is educational decomposition,
not a new physical trajectory solve.

### 4.6 Why the old rendering is rejected

The legacy wind mode places the live lateral endpoint at `WindDrift` and does
not add `engineOffline`. That is acceptable as a pure drift ruler but not when
the endpoint is labeled as the shot's total side result.

The new native instrument must either:

1. show `WindDrift` alone with the explicit title **Wind drift only**; or
2. show the first-order side estimate with `engineCarrySide + WindDrift`.

This specification requires both rows and uses option 2 for the endpoint.

### 4.7 Normative engine fixture

Inputs:

```text
Face +1°
Path −2°
Dynamic Loft 30°
Attack −3°
Club Speed 95 mph
```

Immutable current outputs:

| Output | Value |
|---|---:|
| Face weight | 0.7700 |
| Start Direction | +0.3100° |
| Spin Loft | 33° |
| Smash | 1.328 |
| Ball Speed | 126.16 mph |
| Launch | 17.85° |
| Spin Axis | +4.50° |
| Backspin | 7493.90 rpm |
| Carry | 183.5339 yd |
| Curve | +12.6318 yd |
| Carry Side | +13.6248 yd |

### 4.8 Normative wind states

State A:

```text
12 mph headwind
10 mph crosswind from left
HeadTailMultiplier 0.8776
EstimatedWindCarry 161.0693 yd
ExposureAmplifier 1.153392857
WindDrift +6.1925 yd
FirstOrderWindSideEstimate +19.8173 yd
```

State B:

```text
12 mph tailwind
10 mph crosswind from right
HeadTailMultiplier 1.0816
EstimatedWindCarry 198.5103 yd
ExposureAmplifier 1.153392857
WindDrift −7.6320 yd
FirstOrderWindSideEstimate +5.9928 yd
```

The 12 mph headwind costs 22.4645 yd relative to engine Carry; the equal
tailwind adds 14.9764 yd. This demonstrates the current estimator's asymmetry,
not a universal ratio.

### 4.9 Causal-completeness inventory

| Role | Treatment |
|---|---|
| Along-line environmental input | head/tail component |
| Across-line environmental input | crosswind component |
| Along-line estimate | asymmetric Carry multiplier |
| Across-line estimate | crosswind × estimated Carry × exposure amplifier |
| Engine lateral baseline | Start component + Curve |
| Composite endpoint | engine Carry Side + WindDrift |
| Held | all impact/launch outputs, engine Curve/Carry Side |
| Proxy/amplifier | Launch Angle and Spin Loft, not extra wind causes |
| Not modeled | gusts, vertical wind, shear, terrain, full airflow, changed curve integration |

Head/tail, crosswind and total wind speed may not be ranked as three independent
causes. The components are a vector decomposition.

## 5. Instrument design

### 5.1 Design direction

**Aesthetic:** native aerospace vector tunnel with restrained amber wind
telemetry over Flightglass's violet test range.

**Purpose:** make decomposition and layer ownership immediately legible.

**Differentiation anchor:** one wind arrow enters a resolver and physically
splits into two orthogonal rails labeled **CARRY** and **DRIFT**; neither rail
touches the locked launch chips.

DFII:

| Dimension | Score |
|---|---:|
| Aesthetic impact | 5 |
| Context fit | 5 |
| Implementation feasibility | 4 |
| Performance safety | 5 |
| Consistency risk | 3 |
| **DFII** | **16 − 3 = 13** |

### 5.2 Top-down field

Layers, back to front:

1. target line;
2. solid engine launch/start segment;
3. solid engine Curve segment;
4. solid engine Carry Side endpoint;
5. amber wind vector;
6. dashed crosswind-drift extension;
7. outlined first-order endpoint;
8. ghost comparison state.

The downrange scale uses engine Carry for the solid baseline and estimated
Wind Carry for the outlined endpoint. A note states the lateral overlay is
first-order rather than re-integrated.

### 5.3 Controls

Core:

- Head/Tail: 30 mph headwind → calm → 30 mph tailwind, step 1;
- Crosswind: 30 mph from right → calm → 30 mph from left, step 1;
- compare state A/B;
- reset Calm.

Advanced baseline sheet:

- Face −5° to +5°;
- Path −5° to +5°;
- Club Speed 70–115 mph;
- Dynamic Loft 20–40°;
- Attack −6° to +4°.

Core sequence locks the normative engine state. Wind mastery cannot be earned
by altering the baseline shot.

### 5.4 Resolver

The learner may either use the two semantic component sliders or open a vector
control with speed and angle. If vector control exists:

```text
head component = wind vector projected on target line
cross component = wind vector projected across target line
```

The component values remain authoritative and are shown before any estimate.

## 6. Surface-by-surface specification

### S0 — Mission

Kicker:

> PLAYING CONDITIONS · WIND

Title:

> Wind

Promise:

> Split one wind into distance and drift without changing the strike.

Mission:

> Rebuild two wind-adjusted endpoints from the same engine shot.

Boundary strip:

> POST-SOLVE ESTIMATE · ENGINE SHOT LOCKED · GUSTS NOT MODELED

Primary action:

> Open vector tunnel

Voice, first visit only:

> “One wind, two jobs. Along the line changes estimated Carry. Across it adds
> estimated drift.”

### S1 — Vector Tunnel

#### Step A — Read the engine shot

The learner identifies:

- Start component;
- Curve;
- Carry Side.

Reveal:

> +0.99 yd start component + 12.63 yd Curve = 13.62 yd Carry Side · ENGINE

Values use full internal precision and round to display.

Voice:

> “Wind starts after this result. It does not erase the shot's own start and
> curve.”

#### Step B — Resolve wind

Prompt presents a wind from front-left. Learner drags it into:

- Headwind 12 mph;
- Crosswind from left 10 mph.

No flight estimate appears until the resolver is correct within 1 mph.

#### Step C — Apply along-line component

Reveal:

> 12 mph headwind → multiplier 0.8776 · EST
>
> 183.53 engine Carry → 161.07 estimated Carry

Then compare 12 mph tailwind:

> multiplier 1.0816 · 198.51 estimated Carry

Voice:

> “Equal headwind and tailwind are not mirror images in this estimator.”

#### Step D — Apply crosswind component

Reveal:

> 10 × 161.0693 ÷ 300 × 1.153393 = +6.1925 yd drift · EST

Then compose:

> 13.6248 engine Carry Side + 6.1925 wind drift = 19.8173 yd · FIRST-ORDER EST

The engine endpoint remains visible underneath.

#### Step E — Reverse both components

Set 12 mph tailwind and 10 mph from right.

Reveal state B. Completion requires the learner to identify which numbers
changed (estimated Carry, drift, first-order endpoint) and which did not (all
engine/launch outputs).

### S2 — Influence and decomposition

#### Stage 1 — Two jobs

The wind resolver feeds two columns:

| Along target | Across target |
|---|---|
| changes Estimated Wind Carry | changes Wind Drift |
| asymmetric multiplier | signed drift overlay |
| no direct side sign | no launch-spin change |

#### Stage 2 — Asymmetry

Overlay A/B Carry rulers:

> HEAD 12 · −22.46 yd from engine
>
> TAIL 12 · +14.98 yd from engine

Copy:

> The difference belongs to this estimator. Real response varies with the full
> trajectory and relative airflow.

#### Stage 3 — Three lateral components

Use a ledger:

```text
Start displacement    +0.99 yd  ENGINE
Curve                 +12.63 yd  ENGINE
Wind drift             +6.19 yd  EST
First-order endpoint  +19.82 yd  EST
```

The learner can mute each visual layer, but the equation always preserves the
sum and labels.

#### Stage 4 — Exposure heuristic

Reveal:

> Launch contribution +0.09625
>
> Spin-Loft proxy contribution +0.05714
>
> Exposure amplifier 1.15339 · EST

Copy:

> This is not measured Hang Time. Apex, Backspin rpm and wind-varying lift are
> not integrated.

#### Stage 5 — Same launch proof

Switch Calm/A/B. Confirm exact invariants:

- Ball Speed 126.16 mph;
- Launch 17.85°;
- Spin Axis +4.50°;
- Backspin 7493.90 rpm;
- engine Curve +12.63 yd;
- engine Carry Side +13.62 yd.

Voice:

> “The wind estimate moved the flight layer. Launch spin and spin axis stayed
> where impact set them.”

### S3 — Myths and boundary

#### Myth 1 — “Wind changes Spin Axis”

> Not here. Spin Axis is set by Face-to-Path before the post-solve wind layer.

#### Myth 2 — “Wind drift is the shot's Curve”

> False. Engine Curve is already inside Carry Side. Wind Drift is added after
> it.

#### Myth 3 — “A 12 mph headwind and tailwind cancel”

> Not in this estimator: −22.46 yd versus +14.98 yd for the normative shot.

#### Myth 4 — “The final endpoint is a full wind simulation”

> False. It is a first-order overlay on an immutable engine result.

#### Myth 5 — “A steady wind number is enough for exact course advice”

> False. Gusts, vertical flow, terrain and local shielding are not modeled.

Boundary card:

> ENGINE
>
> Start Direction · Curve · Carry Side · Carry · Spin Axis · Backspin
>
> EST WIND
>
> Head/Tail Carry multiplier · Crosswind Drift · first-order endpoint
>
> NOT MODELED
>
> gusts · vertical wind · shear · terrain · full relative-airflow trajectory

### S4 — Mastery Check

#### Task 1 — Resolve

> The wind component along the target line primarily enters:

- current Spin Axis;
- Estimated Wind Carry; **correct**
- current Smash;
- current Backspin.

#### Task 2 — Across line

> Crosswind drift is:

- the same as engine Curve;
- an EST layer added after engine Carry Side; **correct**
- a change to Face Angle;
- a new Spin Axis.

#### Task 3 — Invariant

> Which stays fixed when only wind changes?

- estimated endpoint;
- estimated Carry;
- launch Backspin and Spin Axis; **correct**
- wind drift.

#### Task 4 — Boundary

> ExposureAmplifier is:

- measured Hang Time;
- a heuristic using Launch and Spin Loft; **correct**
- Backspin rpm;
- wind speed.

#### Task 5 — Live two-state transfer, mandatory

Engine baseline is locked to the normative fixture.

State A acceptance:

- 11–13 mph headwind;
- 9–11 mph crosswind from left;
- Estimated Carry 158–164 yd;
- Wind Drift +5.4 to +7.1 yd;
- first-order side +19.0 to +20.7 yd.

State B acceptance:

- 11–13 mph tailwind;
- 9–11 mph crosswind from right;
- Estimated Carry 196–201 yd;
- Wind Drift −8.5 to −6.7 yd;
- first-order side +5.1 to +6.9 yd.

Across both:

- engine Carry difference <0.01 yd;
- engine Carry Side difference <0.01 yd;
- Spin Axis difference 0.00°;
- Backspin difference 0 rpm;
- learner rebuilds one endpoint from the three ledger components;
- learner selects: “Wind modified the post-solve layer, not impact.”

Mastery requires 4/5 knowledge tasks and this live gate.

### S5 — Result

Title:

> Wind resolved

Summary:

> You separated distance from drift, kept engine Curve intact, and rebuilt two
> wind endpoints from one launch.

Evidence:

- `ENGINE` start + Curve = Carry Side;
- `EST` head/tail changed estimated Carry;
- `EST` crosswind added drift;
- `LIVE` two states, one immutable launch;
- `BOUNDARY` no gust/full airflow claims.

Primary action:

> Finish Playing conditions

Secondary:

- Replay vector tunnel;
- Review components;
- Return to Academy.

Voice, once on new mastery:

> “Wind resolved. You kept the strike, engine curve and environmental drift in
> their proper layers.”

## 7. Information sheets

### 7.1 Wind vector

- direction relative to target, not compass bearing alone;
- semantic signs;
- head/tail and cross components;
- no double count with total wind speed.

### 7.2 Head and tail

- exact internal piecewise multiplier;
- asymmetry;
- 0.40 safety floor;
- estimator, not universal club-selection guidance.

### 7.3 Crosswind drift

- exact internal drift equation;
- direction signs;
- Carry and exposure proxy;
- no claim of full aerodynamic integration.

### 7.4 Curve versus drift

- engine Curve from Spin Axis;
- wind Drift from crosswind estimate;
- both can reinforce or oppose;
- neither changes the other's source quantity.

### 7.5 Carry Side composition

Use the normative three-row ledger and final sum.

### 7.6 Launch invariants

List Ball Speed, Launch, Backspin and Spin Axis as unchanged.

### 7.7 Gusts and terrain

Explain why a steady model cannot provide exact on-course prediction. No
prescriptive swing advice.

### 7.8 Sources

- TrackMan normalization confirms wind, altitude and temperature are condition
  layers:
  `https://support.trackmangolf.com/hc/en-us/articles/6976656064283-General-Normalization-Optimizer-Feature-in-TPS`
- TrackMan Carry:
  `https://support.trackmangolf.com/hc/en-us/articles/39726543090971-Parameters-Carry-Tee-to-Green`
- TrackMan Carry Side:
  `https://support.trackmangolf.com/hc/en-us/articles/39726790709659-Parameters-Carry-Side-Tee-to-Green`
- TrackMan Spin Axis:
  `https://support.trackmangolf.com/hc/en-us/articles/39726408967323-Parameters-Spin-Axis-Tee-to-Green`
- TrackMan Spin Rate:
  `https://support.trackmangolf.com/hc/en-us/articles/39726491252251-Parameters-Spin-Rate-Tee-to-Green`

The numeric wind functions are current Flightglass EST formulas, not TrackMan
formulas. Source UI must not imply otherwise.

## 8. Voice and synchronized UI

| Trigger | Voice line | Visual companion |
|---|---|---|
| S0 first visit | “One wind, two jobs. Along the line changes estimated Carry. Across it adds estimated drift.” | vector splits |
| Engine baseline | “Wind starts after this result. It does not erase the shot's own start and curve.” | solid components lock |
| Head/tail | “Equal headwind and tailwind are not mirror images in this estimator.” | Carry rulers compare |
| Crosswind | “Crosswind adds drift after engine Carry Side. It is not engine Curve.” | dashed segment attaches |
| Exposure | “Launch and Spin Loft are only exposure proxies here, not a measured flight-time solve.” | EST badge pulses once |
| Invariance | “The wind estimate moved the flight layer. Launch spin and spin axis stayed where impact set them.” | launch chips pin |
| Mastery | “Wind resolved. You kept the strike, engine curve and environmental drift in their proper layers.” | three ledgers lock |

Shared voice contract applies: captions, replay, persistent mute, once per new
signature and screen-reader suppression.

## 9. State, compatibility and rewards

```text
experienceId: wind
ownedConceptIds: [wind]
prerequisiteExperienceIds: [carry, shot-pattern]
```

Migration:

- preserve all legacy Wind completion, XP, attempts and history;
- legacy completion grants `reviewEligible`, not automatic mastery under the
  corrected Carry-Side integration;
- previously unlocked Wind remains previewable and is never hidden;
- mastery check requires Carry and Carry Side unless placement evidence exists;
- route `wind` directly to this experience;
- one reward, no duplicate environment-chain XP;
- remove the legacy Altitude → Wind → Temperature hardcoded chain;
- journey router selects next/finish action;
- migration idempotent.

## 10. Accessibility, motion and haptics

- Wind direction always has text such as `from left`, not arrow/color alone.
- Each solid/dashed layer has ENGINE/EST and component label.
- Diagram alternative is a ledger with exact arithmetic.
- Resolver can be operated with buttons/sliders and keyboard/switch input; drag
  is not required.
- Announcements occur after component commit, not every vector frame.
- State A/B summary reads baseline first, then wind changes.
- Reduced motion uses static vector resolution and endpoint ticks.
- Minimum targets 44×44 pt; safe-area-aware sticky action.
- Voice is suppressed under screen reader.
- Haptic: light when vector resolves, success when a complete endpoint ledger
  balances; none during continuous drag.

## 11. Failure and edge states

### Baseline model unavailable

Disable wind estimate/mastery, preserve informational content and state that
progress is safe.

### Non-finite wind input

Reject before multiplier/drift calculation. No output mutation or mastery.

### Headwind floor

If advanced/imported input reaches the 0.40 floor, show `EST LIMIT REACHED` and
raw multiplier. Core ±30 mph does not reach the floor.

### Endpoint beyond viewport

Scale or pan the plot; never clamp the numeric endpoint silently. Ledger stays
authoritative.

### Carry Side unavailable

Wind may preview drift-only with the title **Wind drift only**, but mastery and
first-order endpoint are disabled until engine Carry Side exists.

### Imported legacy state

Semantic direction is reconstructed from signed values. If ambiguous, reset to
Calm rather than guessing left/right.

## 12. Verification contract

### 12.1 Numeric tests

Normative baseline must return:

- Start +0.31°;
- Ball Speed 126.16;
- Carry 183.5338981;
- Spin Axis +4.5°;
- Curve +12.6317594;
- Carry Side +13.6247685;
- Backspin 7493.904 rpm.

State A must return:

- multiplier .8776;
- Carry 161.0693490;
- exposure 1.153392857;
- drift +6.1925412;
- first-order side +19.8173097.

State B must return:

- multiplier 1.0816;
- Carry 198.5102642;
- drift −7.6320107;
- first-order side +5.9927578.

All immutable engine fields must be value-identical across Calm/A/B.

### 12.2 Native behavior tests

- engine lateral decomposition precedes wind;
- vector resolution precedes estimate;
- semantic direction matches sign;
- head/tail and cross controls update only their intended estimate rows;
- state A/B persistence through background/foreground;
- journey prerequisite/placement behavior;
- voice/caption/replay/mute/screen-reader behavior;
- reduced motion;
- no web fallback or live-weather dependency.

### 12.3 Content-truth tests

Fail if copy or visuals:

- replace engine Carry Side with Wind Drift;
- call Wind Drift Curve or side spin;
- change launch Backspin or Spin Axis;
- imply the coefficients are TrackMan formulas;
- call ExposureAmplifier Hang Time;
- promise exact course aim/club;
- call first-order endpoint a full simulation;
- omit gust/terrain/full-airflow boundary;
- count vector magnitude plus both components as independent causes.

### 12.4 Acceptance evidence

Require zero critical defects, all category floors, all critical checks,
pairwise-blind win against legacy Wind, exact fixtures, corrected lateral
composition evidence, native accessibility evidence, migration evidence and an
unchanged protected-engine hash. Derived scores never override a failed gate.

## 13. Implementation boundary

Implementation may build the native resolver, post-solve wind estimate,
corrected lateral ledger, state, voice, migration and tests outside the
protected flight engine.

It may not:

- change `impact-flight.js`;
- mutate engine outputs;
- replace engine Carry Side with drift;
- add live weather or network requirements;
- add gust/full airflow physics;
- label the first-order endpoint as a prediction;
- hardcode a next legacy environment topic;
- improvise different coefficients or mastery windows.

A future full wind trajectory model must receive its own calibration and
acceptance package. Until then, layer separation is the product truth.
