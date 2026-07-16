# Flightglass Academy — Carry Side Integration Experience Design

**Status:** Normative design specification, 2026-07-15. Ready for an
implementation plan after the shared Academy curriculum/store migration spec
exists.

**Experience ID:** `shot-pattern`

**Learner-visible title:** **Carry Side**

**Internal curriculum label:** Shot Pattern integration

**Owned legacy concept:** `offline`

**Primary outcome:** Carry Side

**Goal family:** Start line & shape

**Normative inputs:**

- `docs/superpowers/specs/2026-07-15-academy-outcome-curriculum-blueprint.md`
- `docs/superpowers/specs/2026-07-15-academy-start-line-design.md`
- `docs/superpowers/specs/2026-07-15-academy-shape-design.md`
- `docs/FLIGHTGLASS-CLAUDE-CODE-MASTER-PLAN.md`, Phase 6
- `impact-flight.js`
- the `offline` legacy content record in `academy.html`

## 1. Naming decision

“Shot Pattern” is useful as an internal curriculum concept but is not an honest
learner-facing title for the current engine. In golf, a pattern or dispersion
normally requires multiple shots. Flightglass currently computes one
deterministic trajectory from one input state.

The Academy card, navigation title and result therefore use **Carry Side**:

> The perpendicular side distance from the target line to the modeled carry
> point.

The compatibility ID remains `shot-pattern` so curriculum planning does not
churn, and the legacy engine output remains `offline`. Neither internal term is
shown as the primary outcome.

“Where it finishes” may appear only in conversational voice when immediately
qualified as “at the carry point.” It must never imply:

- a real measured landing;
- a final resting position after bounce and roll;
- a multi-shot dispersion pattern; or
- target proximity in two dimensions.

If Flightglass later stores multiple real or modeled shots, a separate
Dispersion/Shot Pattern experience can be designed from an actual distribution.

## 2. Learner promise

Teach the learner to combine start and bend into one carry-side outcome without
confusing the parts.

The experience succeeds only when the learner can:

1. distinguish Launch Direction, Curve and Carry Side;
2. convert Launch Direction into a sideways start contribution at a given
   Carry;
3. add the start contribution and Curve with the correct signs;
4. explain how a shot can start away from the target and curve back to the
   target line;
5. create two different modeled flights that reach the same Carry Side;
6. recognize Carry as an amplifier of both the start contribution and, in the
   current heuristic, Curve;
7. avoid calling one modeled result a dispersion pattern; and
8. separate Carry Side from Total Side, wind effects and real landing
   variability.

## 3. Non-goals

- Do not reteach Face/Path weighting or the Face-to-Path mechanism in full.
  Start Line and Shape own those mechanisms.
- Do not teach Offline as a third independent force. It is the combined result
  of start displacement and curve.
- Do not call the carry point the final resting position. The current lateral
  result does not model side movement during bounce and roll.
- Do not show a dispersion ellipse, shot cloud, standard deviation or strokes
  gained from a single deterministic state.
- Do not claim the engine measures the user's target, ball, strike or landing.
- Do not prescribe a preferred draw/fade or aim strategy.
- Do not add wind. Wind owns a later estimate layer.
- Do not interpret a near-zero Carry Side as proof of a “good swing.”
- Do not change `impact-flight.js`.

## 4. Legacy-content verdict

The legacy `offline` article recognizes that start and curve combine, but its
name is ambiguous and its long-form explanation risks conflating carry-side
distance, final resting side and dispersion.

### Retain, rewritten

- Launch Direction determines where the no-curve ray would be at Carry.
- Curve is measured from the Launch Direction ray to the carry point.
- Carry Side is the signed distance from the target line to that carry point.
- Opposite-signed start and curve can partially or almost fully cancel.
- Same-signed start and curve reinforce one another.

### Reject from learner-facing copy

- “Offline is accuracy.”
- “Offline is caused by Face Angle plus Club Path” without the mediating chain.
- Any percentage split between start and curve presented as universal.
- Any claim that zero Carry Side means the underlying delivery is neutral.
- Any target bullseye implying distance-to-pin; the model only supplies lateral
  distance from a line.
- Any use of one shot as a “pattern.”

### Preserve as compatibility only

`offline` remains:

- the legacy concept alias;
- the protected engine property;
- an internal adapter field where required.

Visible output uses `CARRY SIDE`.

## 5. Model and truth contract

The protected engine computes:

```text
StartContribution =
  Carry × sin(LaunchDirection × π / 180)

Offline =
  StartContribution + Curve
```

The Academy adapter maps `Offline` to learner-visible `Carry Side` without
changing the number.

| Statement | Label | Required learner meaning |
|---|---|---|
| Carry Side is perpendicular side distance from target line to carry point | ≈ REAL WORLD | Industry-aligned outcome definition |
| `StartContribution = Carry × sin(LaunchDirection)` | MODEL GEOMETRY | Exact inside the app's flat top-down decomposition |
| `CarrySide = StartContribution + Curve` | MODEL | Exact current-engine composition, inheriting the Curve heuristic |
| Positive = right, negative = left | CONVENTION | Right-handed display/target coordinate convention |
| Flat equal-elevation carry plane | HELD | The carry point assumes return to launch elevation |
| Calm air and centered strike | HELD | No wind or strike-location displacement is added |
| Lateral bounce and roll | NOT MODELED | Carry Side is not Total Side |
| Shot-to-shot variability | NOT MODELED | One state is not dispersion |

The compact learner equation is:

> START SIDE + CURVE = CARRY SIDE

The expanded equation is behind “How the instrument combines them.”

### 5.1 No double counting

Launch Direction and Curve are upstream components. Carry Side is their combined
outcome. A causal chart must never rank all three as independent contributors.

Likewise, Face Angle and Club Path remain deeper inputs to both branches:

```text
Face + Path + delivered-loft modifier
  → Launch Direction
  → Start Side

Face − Path
  → modeled Spin Axis
  → Curve

Start Side + Curve
  → Carry Side
```

The integration experience may show this graph after the learner has completed
both prerequisite experiences, but its main interaction begins with the two
already-learned outcomes: Launch Direction and Curve.

### 5.2 Verified teaching fixtures

All fixtures are direct `solveFlight()` outputs with Dynamic Loft 30°, Attack
Angle −3°, Club Speed 90 mph and the 7-iron preset. Presentation rounds degrees
and yards to one decimal.

| Fixture | Face | Path | Launch | Start Side | Curve | Carry Side |
|---|---:|---:|---:|---:|---:|---:|
| Straight to line | 0.0° | 0.0° | 0.0° | 0.0 yd | 0.0 yd | 0.0 yd |
| Starts right, bends left | +2.0° | +4.0° | +2.5° | +7.5 yd | −7.4 yd | +0.1 yd |
| Starts left, bends right | −2.0° | −4.0° | −2.5° | −7.5 yd | +7.4 yd | −0.1 yd |
| Same +1° start, straight | +1.0° | +1.0° | +1.0° | +3.0 yd | 0.0 yd | +3.0 yd |
| Same +1° start, right bend | +2.0° | −2.0° | +1.0° | +3.0 yd | +14.9 yd | +17.9 yd |
| Same +1° start, left bend | 0.0° | +4.0° | +1.0° | +3.0 yd | −14.9 yd | −11.9 yd |
| Right start, no bend | +3.0° | +3.0° | +3.0° | +9.0 yd | 0.0 yd | +9.0 yd |

Raw values used by tests:

- target-return right/left Start Side:
  ±7.519984575564661 yd;
- target-return Curve:
  ∓7.430444335318268 yd;
- target-return Carry Side:
  ±0.08954024024639295 yd;
- +1° Start Side:
  +3.0087957475339118 yd;
- +1° right/left Curve:
  ±14.860888670636536 yd;
- +1° final Carry Side:
  +17.869684418170447 yd and −11.852092923102624 yd.

The ±0.1-yard results are called “near the target line,” not mathematically
zero. Display rounding must not be used to pretend exact cancellation.

### 5.3 Causal-completeness inventory

| Role | Item | Included how |
|---|---|---|
| Direct component | Start Side from Launch Direction at Carry | First signed term |
| Direct component | Curve | Second signed term |
| Combined outcome | Carry Side | Sum, never a third cause |
| Amplifier | Carry | Scales Start Side and also enters the engine's Curve heuristic |
| Deeper inputs | Face Angle, Club Path, Dynamic Loft modifier | Visible in expanded chain, editable only in live transfer |
| Held | Attack Angle, preset, centered contact, calm air, flat equal-elevation carry plane | Visible state drawer |
| Not modeled | Wind, lateral bounce/roll, lie/slope, shot variability, target recognition | Boundary sheet and mastery |

For a single fixed state, “what mattered more” may be described in signed yards:

> Start Side: +7.5 yd
> Curve: −7.4 yd
> Net Carry Side: +0.1 yd

This is a decomposition, not a universal percentage claim.

## 6. Instrument design

The instrument is a top-down signed-distance ledger synchronized to a flight
trace.

### 6.1 Spatial view

The spatial view contains:

1. target line from origin through the carry plane;
2. Launch Direction rail;
3. no-curve carry marker on the rail;
4. actual modeled carry marker;
5. Start Side bracket from target line to no-curve marker;
6. Curve bracket from no-curve marker to actual marker;
7. Carry Side bracket from target line to actual marker;
8. a small plus-sign junction connecting the two component brackets.

Labels:

- `START SIDE +7.5 YD RIGHT`;
- `CURVE −7.4 YD LEFT`;
- `CARRY SIDE +0.1 YD RIGHT`.

The component brackets use different line styles, not color alone. Carry Side
uses the strongest weight.

### 6.2 Signed ledger

Below or beside the trace:

```text
START SIDE       +7.5 yd
CURVE            −7.4 yd
────────────────────────
CARRY SIDE       +0.1 yd RIGHT
```

For same-sign reinforcement:

```text
START SIDE       +3.0 yd
CURVE           +14.9 yd
────────────────────────
CARRY SIDE      +17.9 yd RIGHT
```

The ledger updates numerically without rolling-counter animation. Signs, words
and spatial brackets must agree in every state.

### 6.3 What the instrument must not show

- no dispersion ellipse or multiple stochastic landing dots;
- no hole, flag or circular “accuracy” score;
- no Total Side or roll trace;
- no wind layer;
- no face/path influence bars on the main surface;
- no curved line labeled Launch Direction;
- no Curve bracket measured from target line;
- no Carry Side bracket measured from Launch Direction.

### 6.4 Controls

Guided composition uses outcome-level controls:

- Launch Direction, −4.0° to +4.0°, step 0.5°;
- Curve, −20.0 to +20.0 yd, step 0.5 yd;
- Carry locked at 172.4 yd.

These controls are a **teaching composer**, not direct engine inputs. Every
composer surface must carry:

> COMPOSITION LAB · OUTCOME-LEVEL

It does not write mastery evidence and does not call `solveFlight()` with
invented reverse-solved inputs.

Live transfer uses actual engine controls:

- Face Angle, −6.0° to +6.0°, step 0.5°;
- Club Path, −6.0° to +6.0°, step 0.5°.

All live numbers come from `solveFlight()`. The transition between composer and
live mode is explicit:

> Now build the same relationship through the engine's real inputs.

This separation allows the learner to understand the sum before solving the
coupled face/path problem.

## 7. Surface-by-surface specification

### S0 — Mission

**Eyebrow**

> START LINE & SHAPE · 3 OF 3

**Title**

> Where is the carry point?

**Body**

> Start and bend are different. Carry Side combines them: how far right or left
> the modeled flight reaches the carry plane.

**Precision note**

> One flight is not a shot pattern. This lesson does not measure dispersion.

**Mission card**

> TARGET LINE
> Build two different flights
> Carry Side within ±0.5 yd

**Primary action**

> ENTER CARRY SIDE LAB

**Secondary actions**

- `REVIEW START LINE`
- `REVIEW SHAPE`

**Interaction**

The preview runs once:

1. a straight flight reaches the target line;
2. a right-start/left-curve flight reaches almost the same point;
3. the two traces remain visible as distinct paths.

With Reduce Motion, both appear immediately.

**Voice**

> “Start and curve can reinforce or cancel. Carry Side shows their combined
> result at the carry point.”

### S1 — Composition Lab

**Title**

> Add signed distances.

**Instruction**

> First find where the launch line would reach Carry. Then add Curve from that
> line.

#### Step A — Start Side

State:

- Launch Direction +2.5°;
- Carry 172.4 yd;
- Curve temporarily hidden.

**Prediction**

> Which side is the no-curve carry marker?

Choices:

- `Right` — correct;
- `On the target line`;
- `Left`.

Reveal:

> +2.5° over 172.4 yards places the no-curve marker 7.5 yards right.

Truth chip:

> MODEL GEOMETRY

#### Step B — Add Curve

Reveal Curve −7.4 yd.

**Prediction**

> Does this curve reinforce or cancel the start?

Choices:

- `Mostly cancels it` — correct;
- `Reinforces it`;
- `Cannot affect Carry Side`.

Reveal ledger:

> +7.5 yd right + 7.4 yd left = +0.1 yd right

Copy must preserve signed numeric form in the ledger while the spoken sentence
uses direction words.

#### Step C — Compare paths

Overlay:

- straight 0° start, 0 yd Curve, 0 yd Carry Side;
- +2.5° start, −7.4 yd Curve, +0.1 yd Carry Side.

**Prompt**

> Same carry side. Same flight?

Correct answer:

> No. The carry points are nearly the same, but the paths and upstream causes
> are different.

**Completion gate**

- Step A prediction committed;
- Step B prediction committed;
- signed ledger expanded;
- Step C distinction answered.

**Voice sequence**

1. Entry: “Project the start line to Carry. Then add Curve from that line.”
2. Cancellation: “Seven and a half right, then seven point four left. The
   modeled carry point is nearly centered.”
3. Comparison: “A similar carry point does not mean the flights were the same.”

Only the entry line autoplays.

### S2 — Influence and amplifier proof

**Title**

> Reinforce, cancel, or cross.

This surface uses three controlled comparisons at fixed Carry.

#### Case 1 — Reinforce

Verified state:

- Launch +1.0°;
- Start Side +3.0 yd;
- Curve +14.9 yd;
- Carry Side +17.9 yd.

**Copy**

> Both terms point right. They reinforce.

#### Case 2 — Cancel and cross

Verified state:

- Launch +1.0°;
- Start Side +3.0 yd;
- Curve −14.9 yd;
- Carry Side −11.9 yd.

**Copy**

> The left Curve is larger than the right Start Side. The flight crosses the
> target line and reaches Carry left.

#### Case 3 — Start only

Verified state:

- Launch +3.0°;
- Start Side +9.0 yd;
- Curve 0.0 yd;
- Carry Side +9.0 yd.

**Copy**

> No curve does not mean on target. A straight flight can carry offline from
> its start direction alone.

#### Carry amplifier inset

The inset does not add a free speed slider. It shows a conceptual comparison:

> At a longer Carry, the same Launch Direction produces more Start Side. In the
> current Flightglass model, longer Carry also increases Curve yards.

Then:

> Carry amplifies both branches. It is not a third side force.

Any numeric inset used in implementation must be generated from verified
`solveFlight()` states. It may not hold Curve artificially constant while
claiming to be a live engine comparison.

**Influence summary**

> FOR THIS SHOT
> Start Side: +3.0 yd
> Curve: −14.9 yd
> Carry Side: −11.9 yd

**Voice**

> “Same signs reinforce. Opposite signs cancel. If curve is larger, the flight
> crosses the target line.”

### S3 — Myths and boundary

**Title**

> A result is not a diagnosis.

#### Experiment 1 — “Zero Carry Side means neutral delivery”

**Claim**

> “If the carry point is on the target line, Face and Path must both be zero.”

**Prediction**

> True or false?

Correct:

> False.

**Reveal**

Compare the straight-to-line and right-start/left-curve fixtures.

> Different Launch Direction and Curve combinations can reach nearly the same
> Carry Side. The outcome alone does not identify a unique delivery.

#### Experiment 2 — “Carry Side is Curve”

**Claim**

> “A straight flight has zero Carry Side.”

Correct:

> False. A no-curve flight that launches away from the target still reaches
> Carry on that side.

Reveal the +3°/+3° state:

- Curve 0.0 yd;
- Carry Side +9.0 yd right.

#### Experiment 3 — “One point is a pattern”

**Claim**

> “This simulated carry point tells me my dispersion.”

Correct:

> False.

**Boundary reveal**

> Dispersion requires multiple shots and their variability. Flightglass
> currently shows one deterministic modeled state. Wind, strike variability and
> lateral bounce/roll are not included here.

Labels:

- `ONE MODELED SHOT`;
- `VARIABILITY · NOT MODELED`;
- `WIND · LATER EXPERIENCE`;
- `TOTAL SIDE · NOT THIS OUTCOME`.

**Voice**

> “A centered carry point can hide very different flights. One modeled point is
> not a dispersion pattern.”

### S4 — Mastery Check

**Title**

> Prove you can combine start and curve.

Five tasks. Pass requires at least four correct and completion of Task 5. Tasks
1–4 use unseen values or reordered answers. Task 5 is live engine transfer.

#### Task 1 — Definitions

**Prompt**

> Which measurement runs from Launch Direction to the carry point?

Choices:

- `Curve` — correct;
- `Carry Side`;
- `Launch Direction`.

**Evidence**

> Distinguished the reference lines.

#### Task 2 — Signed composition

**Prompt**

> Start Side is 6.0 yd right. Curve is 9.0 yd left. Where is Carry Side?

Choices:

- `3.0 yd left` — correct;
- `15.0 yd right`;
- `3.0 yd right`.

**Evidence**

> Combined opposite signs and recognized crossing.

#### Task 3 — Inference limit

**Prompt**

> Carry Side is 0.0 yd. What can you conclude?

Choices:

- `Start Side and Curve produced a zero net result` — correct;
- `Face and Path were both 0.0°`;
- `The shot had no Curve`.

**Evidence**

> Did not reverse one outcome into a unique cause.

#### Task 4 — Boundary

**Prompt**

> Which statement is honest about this result?

Choices:

- `It is a modeled carry-side point, not a multi-shot dispersion or resting position` — correct;
- `It predicts the full real landing pattern`;
- `It includes lateral bounce, roll and wind`.

**Evidence**

> Preserved the current model boundary.

#### Task 5 — Live transfer, mandatory

**Mission**

> TWO FLIGHTS · ONE CARRY LINE
> Build one shot that starts right and curves left.
> Build one that starts left and curves right.
> Each must finish within ±0.5 yd Carry Side.

**Editable**

- Face Angle, −6.0° to +6.0°;
- Club Path, −6.0° to +6.0°.

**Held**

- Dynamic Loft 30°;
- Attack Angle −3°;
- Club Speed 90 mph;
- preset 7-iron.

**Pass, first state**

- Launch Direction ≥ +1.5°;
- Curve ≤ −4.0 yd;
- absolute Carry Side ≤ 0.5 yd.

**Pass, second state**

- Launch Direction ≤ −1.5°;
- Curve ≥ +4.0 yd;
- absolute Carry Side ≤ 0.5 yd.

**Shared requirements**

- both states created through learner control;
- raw engine output, not rounded display, determines tolerance;
- neither state may reuse a stored preset;
- states must be captured in the required order or explicitly labeled;
- verified +2°/+4° and −2°/−4° pass.

**Near miss feedback**

- correct shape, still outside:
  > The parts oppose, but they do not cancel closely enough. Compare their
  > signed yards.
- wrong start side:
  > The carry point may be close, but this mission requires the opposite start.
- right start, wrong curve:
  > Start and Curve point the same way. Reverse the Face-to-Path sign while
  > protecting the start.
- display looks 0.5 but raw value fails:
  > Very close. The full-precision result is just outside the target gate.

**Voice**

> “Build two different paths to the same carry line. The live engine decides
> the gate.”

### S5 — Result

**Pass eyebrow**

> CARRY SIDE · MASTERED

**Pass title**

> You combined start and shape.

**Evidence card**

> VERIFIED
> Opposite start-and-curve flights built
> Both within ±0.5 yd Carry Side
> Dispersion boundary identified

**Transfer**

> Carry Side tells where this modeled airborne flight reaches the carry plane.
> It does not tell how a group of your shots will spread.

**Journey completion**

> START LINE & SHAPE · COMPLETE

**Primary action**

> CHOOSE YOUR NEXT GOAL

**Secondary actions**

- `REPLAY LIVE MISSION`;
- `RETURN TO ACADEMY`;
- `REVIEW SOURCES`.

There is no hardcoded “Next: Wind.” Academy Home chooses the next goal journey.
Wind may become available because this prerequisite is complete, but it is not
forced.

**Retry eyebrow**

> CARRY SIDE · NOT YET

**Retry title**

> One part of the sum needs another pass.

Evidence-specific repair labels:

- `REFERENCE LINES`;
- `SIGNED COMPOSITION`;
- `INFERENCE LIMIT`;
- `SINGLE-SHOT BOUNDARY`;
- `LIVE TARGET RETURN`.

**Voice**

> “You built different flights to the same carry line. That completes Start
> Line and Shape.”

## 8. Information sheets

### 8.1 Carry Side

**Title**

> Carry Side

**Body**

> Carry Side is the perpendicular distance from the target line to the point
> where the modeled trajectory returns to launch elevation. Positive is right;
> negative is left.

**Plain-language note**

> On flat ground, think “which side of the target line at carry.”

**Truth label**

> ≈ REAL WORLD DEFINITION · MODEL OUTPUT

### 8.2 Start Side

**Title**

> Start Side at Carry

**Body**

> Launch Direction is an angle. Start Side converts that angle into sideways
> yards at the current Carry, before Curve is added.

**Equation**

> Carry × sin(Launch Direction)

**Why Carry matters**

> The same angle reaches farther sideways over a longer distance.

**Truth label**

> MODEL GEOMETRY

### 8.3 Curve

**Title**

> Curve

**Body**

> Curve is side movement from the Launch Direction line to Carry Side. Its
> reference is the launch line, not the target line.

**Link**

> REVIEW SHAPE

### 8.4 Carry Side versus Total Side

**Title**

> The carry point is not the resting point

**Body**

> Carry Side ends at the modeled carry plane. Total Side would include where
> the ball finishes after bounce and roll. Flightglass does not currently
> calculate a separate lateral roll result, so it must not label Carry Side as
> Total Side.

### 8.5 One shot versus dispersion

**Title**

> A point is not a pattern

**Body**

> Dispersion describes how multiple shots spread around a target or center. One
> deterministic modeled state has no shot-to-shot variation, confidence region
> or pattern.

**Future condition**

> Flightglass may teach dispersion only after it has a valid set of multiple
> shots or a clearly labeled stochastic model.

### 8.6 Model limits

**Title**

> What this integration holds still

**Body**

> Centered contact, calm air and a flat equal-elevation carry plane are held.
> Wind, strike variability, target recognition and lateral bounce/roll are not
> modeled. Curve inherits the Shape lesson's simplified equation.

### 8.7 Sources

- TrackMan Support, “Carry Side”:
  `https://support.trackmangolf.com/hc/en-us/articles/39726790709659-Parameters-Carry-Side-Tee-to-Green`
- TrackMan, “What is Launch Direction?”:
  `https://www.trackman.com/blog/golf/what-is-launch-direction`
- TrackMan Support, “Curve”:
  `https://support.trackmangolf.com/hc/en-us/articles/39726823283099-Parameters-Curve-Tee-to-Green`
- TrackMan Support, “Total Side”:
  `https://support.trackmangolf.com/hc/en-us/articles/39727351395867-Parameters-Total-Side-Tee-to-Green`

External sources support the measurement distinctions. They do not validate the
Flightglass Curve heuristic or its target-return fixtures.

## 9. Voice and synchronized UI table

| Trigger | Voice line | Synchronized visual | Replay |
|---|---|---|---|
| First S0 entry | “Start and curve can reinforce or cancel. Carry Side shows their combined result at the carry point.” | Two component brackets resolve into final bracket | Yes |
| First S1 entry | “Project the start line to Carry. Then add Curve from that line.” | Start rail extends, then Curve bracket appears | Yes |
| First near-cancel | “Seven and a half right, then seven point four left. The modeled carry point is nearly centered.” | Signed ledger resolves to +0.1 | Yes |
| First path comparison | “A similar carry point does not mean the flights were the same.” | Straight and curved traces remain overlaid | Yes |
| S2 entry | “Same signs reinforce. Opposite signs cancel. If curve is larger, the flight crosses the target line.” | Three signed ledgers step in | Yes |
| S3 boundary | “A centered carry point can hide very different flights. One modeled point is not a dispersion pattern.” | ONE MODELED SHOT chip replaces ellipse silhouette | Yes |
| S4 live | “Build two different paths to the same carry line. The live engine decides the gate.” | ±0.5-yd gate appears | Yes |
| Pass | “You built different flights to the same carry line. That completes Start Line and Shape.” | Journey evidence resolves | Yes |

Shared voice contract:

- calm American female laboratory/control-room character;
- 12–24 words, approximately 3–8 seconds;
- one autoplay per new page/signature;
- no slider-value narration;
- event lines trigger once only;
- captions begin no later than audio and remain readable;
- Replay remains available even with Voice Off;
- voice is interruptible and never blocks interaction;
- screen-reader speech suppresses autoplay;
- no essential equation or boundary exists only in audio.

## 10. State, compatibility and rewards

### 10.1 Canonical progress

Canonical key:

> `academy.progress.shot-pattern`

Display metadata:

> `title: Carry Side`

Required evidence:

- schema/content version;
- completion timestamp;
- mastery results;
- raw live inputs/outputs for both Task 5 states;
- single-shot boundary result;
- attempts;
- voice preference;
- prerequisite evidence versions.

### 10.2 Legacy alias

On first migration:

- completed `offline` maps to prior Carry Side evidence;
- it unlocks review and may allow a placement challenge;
- it does not silently grant new mastery;
- canonical mastery is awarded only through the new gate;
- the old ID remains a resolvable deep-link/history alias.

The adapter may read `flight.offline` but writes the user-facing label Carry
Side. It must not rename or mutate the protected engine property.

### 10.3 Prerequisites

Mastery requires:

- Start Line mastered; and
- Shape mastered;

or a passed placement challenge proving equivalent knowledge. Preview remains
available without prerequisites.

### 10.4 Reward semantics

One completion, one reward, one goal-family completion event. Legacy `offline`
does not create a second reward. Replays and placement retries are idempotent.

## 11. Accessibility, motion and haptics

- Every trace has a textual equivalent listing Launch Direction, Start Side,
  Curve and Carry Side.
- Screen-reader order follows the signed equation, not visual position.
- Right/left uses sign and words, never color alone.
- Brackets differ by label, dash style and weight.
- The composition controls expose degrees/yards and explain that they are
  outcome-level teaching controls.
- Live controls expose signed Face/Path values and the resulting live outputs.
- When a trace crosses the target line, accessibility text says where and why;
  motion is not required to infer crossing.
- Dynamic Type reflows the ledger into stacked rows with no clipped signs or
  units.
- Reduce Motion replaces trace drawing and bracket morphing with immediate
  before/after states.
- Optional haptic: selection on prediction, light on valid gate entry, success
  on pass. Never pulse continuously while inside tolerance.
- Voice and captions follow the shared native policy.
- Focus returns to the invoking element after sheets and review links.

## 12. Failure and edge states

### Engine unavailable in live transfer

> LIVE CARRY SIDE UNAVAILABLE
> The composition lesson is still available. Mastery waits for the protected
> flight model.

No composer result may substitute for Task 5.

### Non-finite live output

> THIS LIVE STATE COULD NOT BE CALCULATED
> Return to the last valid Face and Path values.

It cannot count toward either captured state.

### Rounded zero

If raw absolute Carry Side is nonzero but displays 0.0:

> 0.0 yd · ROUNDED

The information sheet exposes the full precision policy. Copy may say “on the
display line” or “near the line,” not exact zero.

### Sign disagreement

If any adapter/view sign disagrees with `solveFlight()`, fail closed:

> DIRECTION DISPLAY UNAVAILABLE
> Your progress is safe.

Do not show a trace whose side contradicts its number.

### Interrupted Task 5

Restore the held state but require both live captures again. A single captured
half is not durable mastery evidence.

### Prior legacy completion

> PRIOR LEARNING FOUND
> Your Offline history is preserved. Complete Carry Side to verify the new
> start-plus-shape integration.

### Audio unavailable

Captions and transcript remain. No learning or mastery gate changes.

## 13. Verification contract

### 13.1 Pure model-adapter tests

1. 0/0 fixture maps engine `offline` 0 to Carry Side 0.
2. +2/+4 produces Launch +2.5°, Start Side
   +7.519984575564661, Curve −7.430444335318268 and Carry Side
   +0.08954024024639295 yd.
3. −2/−4 produces exact sign-mirrored outputs.
4. +1/+1 produces Launch +1°, Curve 0 and Carry Side
   +3.0087957475339118 yd.
5. +2/−2 produces Start Side +3.0087957475339118, Curve
   +14.860888670636536 and Carry Side +17.869684418170447 yd.
6. 0/+4 produces the same Start Side, Curve −14.860888670636536 and Carry Side
   −11.852092923102624 yd.
7. +3/+3 produces Curve 0 and Carry Side +9.02272148845282 yd.
8. the visible alias does not mutate `solveFlight()` output shape.
9. raw values—not rounded strings—drive ±0.5-yd mastery.
10. negative zero normalizes consistently.

### 13.2 Native behavior tests

1. S0–S5 order and back navigation preserve state.
2. Composer is visibly labeled and never awards mastery.
3. Every prediction precedes reveal.
4. Start, Curve and Carry Side brackets use the correct reference lines.
5. The ledger signs always match spatial direction.
6. Live Task 5 calls the protected engine.
7. Both opposite-path live captures are required.
8. One captured state cannot survive interruption as completed Task 5.
9. rounded near-zero states preserve honest wording.
10. Voice once, Replay, Voice Off and screen-reader suppression work.
11. Reduce Motion and Dynamic Type preserve all meaning.
12. reward writes are idempotent.
13. Next returns to goal selection rather than a hardcoded lesson.

### 13.3 Content-truth tests

Fail if visible copy:

- uses Shot Pattern as the primary title;
- calls one result dispersion;
- calls Carry Side a final resting position;
- labels engine `offline` as a third force;
- says zero Carry Side proves Face and Path are zero;
- defines Curve from the target line;
- defines Carry Side from the Launch Direction line;
- hides the inherited Curve-model boundary;
- claims wind, variability or lateral roll is included;
- turns a model outcome into swing prescription;
- describes ±0.0895 yd as mathematically zero.

### 13.4 Acceptance evidence

- screenshots of S0–S5 at standard and accessibility text sizes;
- both target-return fixtures plus straight comparison;
- reinforce, cross and no-curve fixtures;
- every ledger/spatial sign combination;
- Task 5 pass and each near-miss;
- rounded-zero state;
- composer-versus-live labeling;
- Voice/Replay/Voice Off/screen-reader evidence;
- Reduce Motion evidence;
- legacy `offline` migration fixture;
- unit/native test output;
- proof that `impact-flight.js` did not change.

Acceptance uses mandatory gates. A polished trace cannot compensate for a false
reference line, a single-shot “dispersion” claim or composer data used as live
mastery evidence.

## 14. Implementation boundary

An implementation plan may add native Carry Side views, a clearly isolated
composition helper, engine adapters, fixtures, migration aliases, accessibility
metadata and tests. It must:

- preserve `shot-pattern` as canonical curriculum ID and Carry Side as visible
  title;
- read `solveFlight().offline` without changing the protected engine;
- calculate display-only Start Side from the same raw Carry and Launch Direction
  used by the engine;
- never feed composer values into canonical progress;
- preserve Start Line and Shape truth boundaries;
- route completion through Academy Home;
- preserve legacy `offline` history without duplicate rewards;
- leave production physics and unrelated behavior unchanged.

This document authorizes planning, not implementation.
