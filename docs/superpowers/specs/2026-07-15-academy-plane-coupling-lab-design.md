# Flightglass Academy — Plane Coupling Model Lab Design

**Status:** Normative optional-lab design specification, 2026-07-15. Ready for
an implementation plan after the shared Academy curriculum/store migration spec
exists.

**Experience ID:** `plane-coupling-lab`

**Learner-visible title:** **Plane Coupling**

**Persistent qualifier:** **MODEL LAB**

**Owned legacy concept:** `plane-coupling`

**Primary outcome:** understand the current engine's raw-to-effective Low Point
transform

**Placement:** Explore the physics; optional after Contact Height

**Core-goal status:** never required

**Normative inputs:**

- `docs/superpowers/specs/2026-07-15-academy-outcome-curriculum-blueprint.md`
- `docs/superpowers/specs/2026-07-15-academy-low-point-design.md`
- `docs/superpowers/specs/2026-07-15-academy-strike-depth-design.md`
- `swing-parameters-and-impact.js`
- `docs/geometry-rethink.md`
- `docs/strike-window-consensus.md`
- the `plane-coupling` legacy content record in `academy.html`

## 1. Why this is optional

The current engine contains a clear and testable coupling:

```text
effectiveLpx =
  rawLowPointX
  − swingDirection × radius × cos(planeAngle) × π / 180
```

That relation is valuable for:

- understanding why the Geometry screen distinguishes raw and effective Low
  Point;
- preventing view/adaptor code from using the wrong value;
- exploring how a fixed rigid-plane model couples its coordinates.

It is not ready to act as compulsory golf instruction because:

- the exact formula is an implementation model, not a standard launch-monitor
  parameter definition;
- it depends on a fixed radius and plane;
- its address/pivot compensation and coordinate convention are app choices;
- real swings have time-varying radius and plane;
- primary sources define Swing Plane, Swing Direction, Low Point and Club Path
  but do not validate this exact numeric transform.

Every surface therefore shows `MODEL LAB`. Completion records exploration, not
golf mastery, and awards no core reward.

## 2. Learner promise

Teach an advanced learner to predict and compensate the current engine's
raw-to-effective Low Point shift.

The lab succeeds when the learner can:

1. distinguish Swing Direction from Club Path;
2. distinguish raw Low Point x from effective Low Point;
3. compute the sign of the current model's direction coupling;
4. compare the centimeters-per-degree exchange rate at flat and steep planes;
5. compensate raw x to preserve a target effective value;
6. recognize that plane plays two different model roles: exchange-rate setter
   and tangent-orientation modifier;
7. avoid treating the transform as measured truth or a swing prescription.

## 3. Non-goals

- Do not make the lab a prerequisite for any core journey.
- Do not award `MASTERED`, a mastery badge or a standard Academy reward.
- Do not claim in-to-out or out-to-in is good/bad contact.
- Do not prescribe ball position, alignment, plane or Swing Direction.
- Do not call Swing Direction Club Path.
- Do not call raw Low Point the engine-authoritative Low Point when direction is
  nonzero.
- Do not use current `strikeQuality()` labels as proof.
- Do not generalize centimeters-per-degree beyond the fixed model.
- Do not change the protected geometry engine.

## 4. Legacy-content verdict

The legacy lesson correctly quotes the current formula and exchange rates but
overstates its external physical authority and turns model cases into real
diagnoses.

### Retain, rewritten

- Positive Swing Direction subtracts from effective Low Point in the current
  sign convention.
- A flatter plane has a larger `cos(plane)` exchange rate.
- Raw x can compensate a direction-induced effective shift.
- Plane also changes derived Attack directly through tangent decomposition.
- Swing Direction and Club Path are distinct quantities.

### Reject from learner-facing copy

- “The formula is worth tattooing.”
- “Any tilted circle” proves this exact transform.
- “Draw project causes fat shots” as a real-player diagnosis.
- “Over the top produces thin” as a general result.
- Any range tip or ball-position compensation prescription.
- Current model quality bands as external evidence.
- Claims that a direction change “moves the real bottom” by the exact engine
  exchange rate.

## 5. Model and truth contract

### 5.1 Core equation

```text
effectiveLowPoint =
  setLowPoint
  − SwingDirection × exchangeRate

exchangeRate =
  radius × cos(SwingPlane) × π / 180
```

Units:

- raw/effective Low Point: meters internally, centimeters visible;
- Swing Direction: degrees;
- plane: degrees;
- exchange rate: centimeters per degree.

### 5.2 Truth register

| Claim | Label | Meaning |
|---|---|---|
| Swing Plane and Swing Direction external definitions | ≈ REAL WORLD | Source-aligned parameter concepts |
| exact `effectiveLpx()` transform | MODEL LAB | Current implementation |
| exchange rate shrinks as plane steepens | MODEL MATH | Exact for current formula |
| derived Attack/Club Path consequences | MODEL GEOMETRY | Current rigid-circle output |
| fixed 1.20 m radius | HELD | Core lab constant |
| real time-varying plane/radius, address changes and measurement noise | NOT MODELED | No diagnostic prescription |

### 5.3 Verified exchange rates

At radius 1.20 m:

| Plane | Exchange rate |
|---:|---:|
| 45° | 1.480960979386122 cm/° |
| 55° | 1.201295679141773 cm/° |
| 70° | 0.716325312201099 cm/° |

Visible rounding:

- 45°: 1.48 cm per degree;
- 55°: 1.20 cm per degree;
- 70°: 0.72 cm per degree.

Required comparison:

> The fixed 45° model shifts effective Low Point about twice as much per degree
> as the fixed 70° model.

Do not call them driver/iron/club simulations.

### 5.4 Direction sweep fixtures

Raw Low Point +10.5 cm, z −2 mm, radius 1.20 m.

#### Plane 45°

| Swing Direction | Effective Low Point | Attack | Club Path | Contact Height |
|---:|---:|---:|---:|---:|
| −8° | +22.348 cm | −7.567° | −0.366° | +12.844 mm |
| −4° | +16.424 cm | −5.554° | +1.580° | +5.985 mm |
| 0° | +10.500 cm | −3.547° | +3.554° | +1.255 mm |
| +4° | +4.576 cm | −1.545° | +5.546° | −1.383 mm |
| +8° | −1.348 cm | +0.455° | +7.545° | −1.946 mm |

#### Plane 70°

| Swing Direction | Effective Low Point | Attack | Club Path | Contact Height |
|---:|---:|---:|---:|---:|
| −8° | +16.231 cm | −7.302° | −5.327° | +8.362 mm |
| −4° | +13.365 cm | −6.008° | −1.805° | +5.016 mm |
| 0° | +10.500 cm | −4.716° | +1.721° | +2.325 mm |
| +4° | +7.635 cm | −3.428° | +5.249° | +0.285 mm |
| +8° | +4.769 cm | −2.140° | +8.779° | −1.109 mm |

These are current-engine fixtures, not expected real-player outcomes.

### 5.5 Compensation fixtures

Target effective Low Point: +10.5 cm.

At Swing Direction +4°:

| Plane | Required raw Low Point | Shift compensated |
|---:|---:|---:|
| 45° | +16.42384391754449 cm | +5.923843917544488 cm |
| 55° | +15.305182716567092 cm | +4.805182716567092 cm |
| 70° | +13.365301252404396 cm | +2.865301252404396 cm |

The implementation must compute these from the formula, not freeze rounded
sliders as truth.

### 5.6 Plane has two roles

Role A — exchange-rate setter:

> `cos(plane)` controls how direction changes effective Low Point.

Role B — tangent decomposition:

> `sin(plane)` and `cos(plane)` also change how the same arc position becomes
> Attack and Club Path.

These are two paths from one input. They must not be added as two independent
“plane percentages.”

### 5.7 Causal hierarchy

| Role | Item | Treatment |
|---|---|---|
| Direct set value | raw Low Point x | Editable |
| Coupled modifier | Swing Direction × exchange rate | Main lab mechanism |
| Exchange-rate setter | plane via cosine | Controlled comparison |
| Held scale | radius 1.20 m | Visible |
| Authoritative result | effective Low Point | Main outcome |
| Downstream model outputs | Attack, Club Path, Contact Height | Secondary ledger |
| Not modeled | time-varying plane/radius, body/address response, real strike | Boundary |

## 6. Instrument design

The lab uses a coordinated split instrument:

### Left — top-down plane base

- target line;
- plane-base direction ray;
- Swing Direction wedge;
- no ball-flight trace;
- explicit `SWING DIRECTION · NOT CLUB PATH` label.

### Right — side-on Low Point

- ball;
- raw Low Point marker;
- effective Low Point marker;
- bracket between them;
- Attack tangent;
- Contact Height point.

### Center — coupling ledger

```text
SET LOW POINT          +10.50 cm
DIRECTION SHIFT         −5.92 cm
────────────────────────────────
EFFECTIVE LOW POINT     +4.58 cm
```

At positive direction, the shift row is negative under the current convention.

Persistent header:

> MODEL LAB · CURRENT FLIGHTGLASS GEOMETRY

### 6.1 Controls

- Swing Direction −8° to +8°, step 1°;
- Swing Plane 45° to 70°, step 5° or locked presets 45/55/70 for assessed
  comparisons;
- Set Low Point −5 to +25 cm, step 0.5 cm;
- radius visible/locked 1.20 m;
- z visible/locked −2 mm.

No club labels.

### 6.2 Readouts

Primary:

- `EFFECTIVE LOW POINT +4.58 CM AHEAD`.

Mechanism:

- `RATE 1.48 CM/°`;
- `DIRECTION SHIFT −5.92 CM`.

Secondary:

- `ATTACK −1.55°`;
- `CLUB PATH +5.55°`;
- `CONTACT HEIGHT −1.38 MM`.

Every secondary value has `MODEL OUTPUT`.

### 6.3 Cause sentence

> At a 45° plane, each degree of positive Swing Direction subtracts 1.48 cm
> from effective Low Point. Four degrees shifts it 5.92 cm back.

Then:

> Raw +10.50 cm becomes effective +4.58 cm in this model.

Boundary:

> This is an implementation transform, not a measured swing diagnosis.

## 7. Surface-by-surface specification

### S0 — Model Lab invitation

**Eyebrow**

> EXPLORE THE PHYSICS · OPTIONAL

**Qualifier**

> MODEL LAB

**Title**

> Why are “set” and “effective” Low Point different?

**Body**

> Flightglass's rigid-plane engine couples Swing Direction, plane and Low Point.
> Explore the exact app formula without treating it as compulsory golf truth.

**Boundary card**

> NOT A CORE GATE
> No mastery badge
> No swing prescription

**Primary action**

> OPEN MODEL LAB

**Secondary**

> RETURN TO ACADEMY

**Voice**

> “This optional lab explains Flightglass's geometry bookkeeping. It is a model
> transform, not a diagnosis of your swing.”

### S1 — Exchange-rate Lab

**Title**

> Plane sets the rate.

Raw Low Point +10.5 cm, direction 0°.

#### Step A — Predict the flatter plane

Prompt:

> Which plane has the larger centimeters-per-degree shift?

Choices:

- `45°` — correct;
- `70°`;
- `They are identical`.

Reveal:

- 45° → 1.48 cm/°;
- 70° → 0.72 cm/°.

#### Step B — Apply +4°

At plane 45°, learner moves Direction to +4°.

Ledger:

> +10.50 − 5.92 = +4.58 cm effective

#### Step C — Same direction, steeper plane

Switch plane to 70° without changing raw x or direction.

Ledger:

> +10.50 − 2.87 = +7.63 cm effective

Prompt:

> What changed most directly?

Correct:

> The exchange rate; the same direction produced a smaller effective shift.

**Voice**

> “A flatter fixed plane has a larger exchange rate. The same direction moves
> effective Low Point farther.”

### S2 — Compensation and two plane roles

**Title**

> Preserve the effective result.

#### Stage 1 — Compensation at 45°

Target:

> EFFECTIVE LOW POINT +10.5 CM

Held:

- plane 45°;
- direction +4°.

Learner adjusts raw x. Gate:

- effective value +10.5 ±0.2 cm.

Expected raw:

- approximately +16.42 cm.

#### Stage 2 — Compensation at 70°

Same target/direction; plane 70°.

Expected raw:

- approximately +13.37 cm.

Reflection:

> Why did the required raw compensation shrink?

Correct:

> `cos(plane)` made the direction exchange rate smaller.

#### Stage 3 — Plane's second role

Hold effective Low Point at +10.5 cm while toggling plane:

- 45° → Attack −3.547°;
- 55° → −4.110°;
- 70° → −4.716°.

Copy:

> Compensation preserved the effective place, but plane still changed tangent
> decomposition. One input has two model paths.

#### Stage 4 — Swing Direction is not Club Path

At plane45/raw10.5/direction0:

- Swing Direction 0°;
- derived Club Path +3.554°.

Copy:

> Swing Direction describes the base of the modeled plane. Club Path is the
> instantaneous horizontal tangent at impact. They can differ.

**Voice**

> “Compensate raw Low Point to preserve the effective place. Plane can still
> change the tangent through a second model path.”

### S3 — Model myths and boundary

**Title**

> Know what the formula does not prove.

#### Myth 1 — “Direction only changes Club Path”

Within the current model:

> False. Direction also changes effective Low Point through `effectiveLpx()`.

Boundary:

> That is a statement about this engine, not a universal diagnosis.

#### Myth 2 — “The exact rate is a launch-monitor law”

Correct:

> False. External definitions support the parameter concepts, but the exact
> rate is Flightglass implementation math with a fixed radius and plane.

#### Myth 3 — “Set Low Point is always the real engine value”

Correct:

> Only when Swing Direction is zero, or when the direction shift is otherwise
> zero.

#### Myth 4 — “Swing Direction equals Club Path”

Correct:

> False. One describes the base of a plane over a portion of the swing; the
> other is the horizontal clubhead direction at impact.

#### Myth 5 — “Plane has one contribution percentage”

Correct:

> False. It sets the exchange rate and also changes tangent decomposition.
> Those are causal paths, not additive shares.

**Voice**

> “Use this formula to understand the app. Do not reverse it into a universal
> player diagnosis.”

### S4 — Model Check

**Title**

> Verify the transform.

This is an optional understanding check, not Academy mastery. Completion
requires three knowledge items and one live compensation.

#### Item 1 — Sign

> In the current convention, positive Swing Direction does what to effective
> Low Point?

- `Subtracts from it` — correct;
- `Adds to it`;
- `Changes only z`.

#### Item 2 — Rate

> Which fixed plane shifts more per direction degree?

- `45°` — correct;
- `70°`;
- `Neither`.

#### Item 3 — Distinction

> Swing Direction and Club Path are:

- `Different model quantities` — correct;
- `Always numerically identical`;
- `Two names for Launch Direction`.

#### Item 4 — Live compensation

> At plane 45° and Direction +4°, preserve effective Low Point +10.5 ±0.2 cm.

Editable:

- raw Low Point only.

Pass:

- raw state learner-created;
- effective value computed by `effectiveLpx()`;
- expected raw approximately 16.42 cm;
- learner labels the result MODEL.

Retry opens directly on the failed item. There is no 4/5 mastery score.

**Voice**

> “Use the ledger to preserve the effective value. The engine, not the rounded
> display, decides the gate.”

### S5 — Lab result

**Eyebrow**

> MODEL LAB · COMPLETE

**Title**

> You can read Flightglass's coupling.

**Evidence**

> EXPLORED
> Set versus effective Low Point
> Plane-dependent exchange rate
> Live compensation completed

**Boundary**

> This records model literacy, not golf mastery.

**Primary**

> RETURN TO ACADEMY

**Secondary**

- `REPLAY COMPENSATION`;
- `REVIEW ENGINE BOUNDARY`;
- `VIEW SOURCES`.

No next prerequisite, mastery reward or goal-completion event fires.

**Voice**

> “You can now read the app's raw-to-effective transform. Core Academy progress
> remains unchanged.”

## 8. Information sheets

### 8.1 Set Low Point

> The x value stored in `lowPoint.x` before the current engine applies its
> Swing Direction/plane coupling.

Truth:

> MODEL INPUT

### 8.2 Effective Low Point

> The x value used by `thetaAtImpact()`, `deriveImpact()` and
> `clubBallContact()` after the coupling transform.

Truth:

> MODEL OUTPUT

### 8.3 Swing Direction

> The angle between the base of the clubhead movement plane and target line over
> the measured swing segment. It is not Club Path.

Truth:

> ≈ REAL WORLD DEFINITION

### 8.4 Swing Plane

> The vertical angle of the clubhead movement plane relative to the horizon.
> The current lab holds it rigid through the arc.

Truth:

> ≈ REAL WORLD DEFINITION + HELD MODEL

### 8.5 Club Path

> The instantaneous horizontal clubhead direction at impact. In the model it is
> derived from Swing Direction, plane and arc position.

### 8.6 Why no mastery badge

> The exact coupling has not been independently validated as a universal
> player-facing law. The lab teaches implementation literacy and keeps its
> boundary visible.

### 8.7 Sources

- TrackMan Support, “Swing Direction”:
  `https://support.trackmangolf.com/hc/en-us/articles/39724812068379-Parameters-Swing-Direction-Tee-to-Green`
- TrackMan Support, “Swing Plane”:
  `https://support.trackmangolf.com/hc/en-us/articles/39724927056283-Parameters-Swing-Plane-Tee-to-Green`
- TrackMan Support, “Low Point Distance”:
  `https://support.trackmangolf.com/hc/en-us/articles/39724600685339-Parameters-Low-Point-Distance-Tee-to-Green`
- TrackMan Support, “Low Point Side”:
  `https://support.trackmangolf.com/hc/en-us/articles/39724627132443-Parameters-Low-Point-Side-Tee-to-Green`
- TrackMan Support, “Club Path”:
  `https://support.trackmangolf.com/hc/en-us/articles/39724275421211-Parameters-Club-Path-Tee-to-Green`

Sources define the real parameters only. They do not validate
`effectiveLpx()`.

## 9. Voice and synchronized UI

| Trigger | Voice | Visual |
|---|---|---|
| S0 | “This optional lab explains Flightglass's geometry bookkeeping. It is a model transform, not a diagnosis of your swing.” | MODEL LAB qualifier locks |
| S1 | “A flatter fixed plane has a larger exchange rate. The same direction moves effective Low Point farther.” | rate chips compare |
| S2 | “Compensate raw Low Point to preserve the effective place. Plane can still change the tangent through a second model path.” | raw marker moves; effective marker locks |
| S3 | “Use this formula to understand the app. Do not reverse it into a universal player diagnosis.” | boundary layer appears |
| S4 | “Use the ledger to preserve the effective value. The engine, not the rounded display, decides the gate.” | live target gate |
| S5 | “You can now read the app's raw-to-effective transform. Core Academy progress remains unchanged.” | EXPLORED result |

Shared voice/caption/accessibility policy applies. Voice never says `mastered`.

## 10. State, compatibility and rewards

Canonical exploration key:

> `academy.explore.plane-coupling-lab`

It is not stored under the core `academy.progress.*` mastery namespace.

Evidence:

- lab/content/geometry versions;
- items answered;
- raw/effective compensation state;
- boundary acknowledgment;
- completion timestamp;
- attempts and voice preference.

Legacy:

- legacy `plane-coupling` completion maps to prior exploration evidence;
- deep links route to this model lab;
- prior completion may prefill “previously explored”;
- it never grants/blocks core mastery;
- it never duplicates a core reward.

Rewards:

- no standard mastery reward;
- optional Explore-completion marker only;
- no journey-completion event;
- no unlock dependency downstream.

## 11. Accessibility, motion and haptics

- Top-down and side-on panels each have complete text equivalents.
- Ledger reading order is raw, shift, effective.
- Every value includes sign, unit and ahead/behind or left/right words.
- Swing Direction and Club Path are never color-only distinctions.
- Direct drag has stepper alternatives.
- Dynamic Type stacks both views above the ledger.
- Reduce Motion replaces marker transitions with static before/current states.
- MODEL LAB qualifier is included in screen title and initial announcement.
- No essential formula is voice-only.
- Haptic: light on compensation target, success-like but non-reward completion
  haptic on S5.
- Focus restores from all sheets.

## 12. Failure and edge states

### Geometry unavailable

> MODEL LAB UNAVAILABLE
> Core Academy progress is unaffected.

### Non-finite effective value

> THIS TRANSFORM COULD NOT BE CALCULATED

No fallback formula in the view.

### Raw/effective labels missing

Fail closed:

> COUPLING DISPLAY INCOMPLETE

Do not show one unlabeled Low Point value.

### Out-of-range compensation

> The required raw value lies outside this lab's range for the selected state.

Change the teaching target, not engine state, in the implementation plan.

### Prior legacy completion

> PREVIOUSLY EXPLORED
> Your Plane Coupling history is preserved. Reopen any experiment.

## 13. Verification contract

### 13.1 Model tests

1. exchange rates at 45/55/70 match exact formula;
2. all frozen direction-sweep fixtures match `effectiveLpx()`,
   `deriveImpact()` and `clubBallContact()`;
3. compensation raw values produce effective +0.105 m within floating-point
   tolerance;
4. raw/effective equality at direction 0;
5. positive direction subtracts under current convention;
6. view does not duplicate model formulas;
7. raw values drive the live check.

### 13.2 Native behavior tests

1. MODEL LAB qualifier on S0–S5 and accessibility title.
2. No core mastery/reward/prerequisite writes.
3. Raw and effective markers always labeled.
4. Swing Direction and Club Path remain distinct.
5. Plane comparison updates rate and secondary outputs.
6. Compensation target uses effective value.
7. voice never says mastered.
8. Replay/Voice Off/screen-reader suppression.
9. Dynamic Type/Reduce Motion parity.
10. legacy exploration migration idempotent.

### 13.3 Content-truth tests

Fail if copy:

- presents the formula without MODEL LAB;
- calls it universally measured physics;
- says Swing Direction equals Club Path;
- calls raw Low Point effective under nonzero direction;
- gives real-player fat/thin diagnoses;
- prescribes compensation;
- turns exchange rate into a club label;
- ranks plane's two paths as additive percentages;
- awards mastery or blocks a core journey.

### 13.4 Acceptance evidence

- S0–S5 at standard/accessibility sizes;
- plane rate comparison;
- direction sweep at 45 and 70;
- both compensation states;
- Swing Direction/Club Path distinction;
- every boundary statement;
- no-core-progress/reward proof;
- voice/accessibility/motion evidence;
- legacy migration;
- model/native tests;
- protected engine unchanged.

Any missing MODEL LAB qualifier, core-gate write or universal diagnosis is a
critical failure regardless of polish.

## 14. Implementation boundary

An implementation plan may add an optional native model lab, adapters, fixtures,
exploration storage, accessibility and tests. It must:

- consume `effectiveLpx()`, `deriveImpact()` and `clubBallContact()`;
- keep the qualifier persistent;
- store exploration outside core mastery;
- preserve legacy history;
- expose both raw and effective values;
- provide no swing prescription;
- leave production geometry/physics unchanged.

This document authorizes planning, not implementation.
