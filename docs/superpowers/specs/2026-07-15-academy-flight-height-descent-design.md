# Flightglass Academy — Flight Height & Descent Experience Design

**Status:** Normative design specification, 2026-07-15. Ready for an
implementation plan after the shared Academy curriculum/store migration spec
exists.

**Experience ID:** `flight-height-descent`

**Learner-visible title:** **Flight Height & Descent**

**Owned legacy concepts:** `apex`, `landing-angle`

**Primary outcomes:** Apex and Landing Angle as one trajectory-profile job

**Goal family:** Launch, spin & descent

**Prerequisites:** Delivered Loft & Launch and Backspin

**Normative inputs:**

- `docs/superpowers/specs/2026-07-15-academy-outcome-curriculum-blueprint.md`
- `docs/superpowers/specs/2026-07-15-academy-delivered-loft-launch-design.md`
- `docs/superpowers/specs/2026-07-15-academy-backspin-curriculum-amendment.md`
- `impact-flight.js`
- the `apex` and `landing-angle` legacy records in `academy.html`

## 1. Learner promise

Teach the learner to explain modeled peak height and return angle without
collapsing them into one number or promising stopping distance.

The experience succeeds only when the learner can:

1. define Apex relative to launch elevation;
2. define Landing Angle relative to the horizon at equal landing elevation;
3. identify Ball Speed and Launch Angle as the current Apex inputs;
4. distinguish the current Landing paths: Spin Loft direct, Launch direct and
   Apex as a mediator;
5. recognize that Launch affects Landing both directly and through Apex;
6. build two states with nearly the same Apex and materially different Landing
   Angles;
7. explain that current Backspin rpm is not fed into either flight-height or
   descent equation;
8. recognize 32°/60° Landing clamps as model bounds; and
9. distinguish Landing Angle from bounce, roll and stopping distance.

## 2. Non-goals

- Do not teach Apex as “how high it launches.”
- Do not teach Landing Angle as angle of the ground, club or face.
- Do not promise a green-stopping result.
- Do not call the current roll fraction a physical turf simulation.
- Do not claim higher Apex or steeper Landing is universally better.
- Do not claim Backspin rpm drives current Apex/Landing; it does not.
- Do not label speed/loft states as club simulations.
- Do not hide Landing clamp activation.
- Do not double-count Launch and Apex as independent percentage causes.
- Do not prescribe delivery, club choice or shot technique.
- Do not change `impact-flight.js`.

## 3. Legacy-content verdict

The legacy records have useful definitions and trajectory intuition but treat
fitted engine outputs and real flight physics too interchangeably. They also
overuse “stopping power.”

### Retain, rewritten

- Apex is maximum height above launch elevation.
- Landing Angle is descent relative to the horizon at equal elevation.
- Ball Speed and Launch Angle influence height.
- Height and Landing Angle are related but not identical.
- Current engine Landing uses Spin Loft, Launch and Apex.
- Steeper Landing generally reduces bounce/roll all else equal in real golf.

### Reject from learner-facing copy

- “Backspin makes the current modeled ball climb” unless clearly marked
  real-world-only; the engine does not use rpm in Apex.
- “Landing Angle tells stopping power.”
- Fixed >45° targets as universal goals.
- Driver/iron/wedge optimization claims from a one-preset engine.
- Any claim a 60° plateau is a physical ceiling.
- “Apex determines Landing Angle” without Spin Loft and direct Launch paths.
- Prescriptions to add loft/spin.

### Move to other experiences

- Backspin production stays in Backspin.
- Carry and Total remain in Carry.
- Wind and density changes remain separate estimate layers.

## 4. Definitions and truth contract

### 4.1 Definitions

> Apex is the maximum vertical height of the modeled trajectory above launch
> elevation.

> Landing Angle is the downward angle of the modeled trajectory relative to the
> horizon when it returns to launch elevation.

The UI displays a positive magnitude with a descent word:

> LANDING 54.3° · DOWN

It does not use a negative sign for the descent magnitude unless the entire app
changes its established convention.

### 4.2 Current Apex model

```text
LaunchFactor =
  clamp(0.35 + 0.65 × LaunchAngle / 18, 0.45, 1.35)

Apex =
  44 × (1 − exp(−BallSpeed / 85)) × LaunchFactor
```

| Path | Role |
|---|---|
| Ball Speed | saturating speed factor |
| Launch Angle | multiplicative launch factor |
| Backspin rpm | not used |
| Spin Loft | not used directly |

Apex is a fitted MODEL output. Real Apex also depends materially on Spin Rate
and aerodynamics.

### 4.3 Current Landing model

```text
LandingRaw =
  45
  + 0.5 × (SpinLoft − 25)
  + 0.6 × (LaunchAngle − 14)
  + 1.0 × (Apex − 30)

LandingAngle =
  clamp(LandingRaw, 32, 60)
```

The 45°, 25°, 14° and 30-yard references are fit anchors. They are not causal
forces and do not appear in an “importance” chart.

### 4.4 Landing causal roles

| Input/path | Direct sensitivity | Role |
|---|---:|---|
| Spin Loft | +0.5° LandingRaw per +1° | direct fitted input |
| Launch Angle | +0.6° LandingRaw per +1° | direct fitted input |
| Apex | +1.0° LandingRaw per +1 yd | mediator from Ball Speed/Launch |
| Ball Speed | no direct term | affects Landing through Apex |
| Launch Angle again | indirect | also changes Apex |
| Backspin rpm | none | not used |

Launch has two model paths. Any causal diagram must show:

```text
Launch ───────────────→ LandingRaw
   └→ Apex ───────────→ LandingRaw

Ball Speed → Apex ────→ LandingRaw

Spin Loft ────────────→ LandingRaw
```

It must not list Launch and Apex as independent shares of unknown total.

### 4.5 Truth register

| Claim | Label |
|---|---|
| Apex/Landing parameter definitions | ≈ REAL WORLD |
| exact Apex and Landing equations | MODEL / FIT |
| Backspin omission | MODEL BOUNDARY |
| equal-elevation landing plane | HELD |
| Landing 32°/60° | MODEL CLAMPS |
| surface, slope, landing speed, spin-driven bounce/roll | NOT MODELED HERE |

## 5. Verified teaching fixtures

All fixtures use Face 0°, Path 0° and the 7-iron preset.

### 5.1 Launch-driven Apex at fixed Spin Loft and Ball Speed

Dynamic Loft and Attack move together, keeping Spin Loft 33° and modeled Ball
Speed 119.52 mph at Club Speed 90 mph.

| State | Dynamic Loft | Attack | Launch | Apex | LandingRaw | Landing |
|---|---:|---:|---:|---:|---:|---:|
| Low Launch | 26° | −7° | 14.37° | 28.862 yd | 48.084° | 48.084° |
| Base | 30° | −3° | 17.85° | 33.036 yd | 54.346° | 54.346° |
| High Launch | 34° | +1° | 21.33° | 37.210 yd | 60.608° | 60.000° clamp |

Required interpretation:

> Spin Loft and Ball Speed stayed fixed. Higher Launch raised Apex and also
> entered Landing directly. The high state hit the 60° model ceiling.

### 5.2 Speed-driven Apex at fixed Launch and Spin Loft

Dynamic Loft 30°, Attack −3°.

| Club Speed | Ball Speed | Launch | Spin Loft | Apex | Landing |
|---:|---:|---:|---:|---:|---:|
| 70 mph | 92.96 mph | 17.85° | 33° | 29.102 yd | 50.412° |
| 90 mph | 119.52 mph | 17.85° | 33° | 33.036 yd | 54.346° |
| 110 mph | 146.08 mph | 17.85° | 33° | 35.914 yd | 57.224° |

Required interpretation:

> Ball Speed raised Apex through a saturating fit. Landing changed through the
> Apex term, not a direct Ball Speed coefficient.

### 5.3 Base Landing decomposition

Base state raw ledger:

```text
FIT ANCHOR                      45.000°
SPIN LOFT TERM                  +4.000°
LAUNCH DIRECT TERM              +2.310°
APEX MEDIATOR TERM              +3.036°
────────────────────────────────────────
LANDING RAW                     54.346°
LANDING DISPLAY                 54.346°
```

The ledger is a model decomposition relative to fit anchors. It is not a
percentage allocation.

### 5.4 Same-Apex, different-descent pair

| State | Dynamic Loft | Attack | Club Speed | Launch | Spin Loft | Ball Speed | Apex | Landing | Carry |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| A | 25° | −3° | 105 mph | 14.75° | 28° | 141.54 mph | 31.48998 yd | 48.43998° | 206.13 yd |
| B | 31° | −7° | 85 mph | 17.47° | 38° | 111.18 mph | 31.48971 yd | 55.07171° | 157.75 yd |

Apex differs by only 0.00027 yd while Landing differs by 6.63°. Copy:

> The same peak height does not define the full trajectory. Launch and Spin
> Loft still differ in the Landing fit.

This pair is not presented as a recommended shot.

### 5.5 Causal-completeness inventory

| Role | Item | Treatment |
|---|---|---|
| Apex direct model inputs | Ball Speed, Launch Angle | Main lab |
| Landing direct model inputs | Spin Loft, Launch Angle | Main decomposition |
| Landing mediator | Apex | Main decomposition |
| Missing real flight input | Backspin/Spin Rate | Boundary |
| Outcome boundary | Landing Angle, not stopping distance | Persistent |
| Held | equal elevation, calm air, one preset | Visible |
| Not modeled | spin aerodynamics into Apex, surface/slope/bounce, landing speed | Boundary |

## 6. Instrument design

The instrument is a side-on full trajectory profile.

Required:

1. launch point and equal-elevation landing plane;
2. engine-derived trace;
3. vertical Apex ruler;
4. Launch Angle wedge at origin;
5. tangent/descent wedge at carry point;
6. baseline ghost trace;
7. compact input chips for Ball Speed, Launch and Spin Loft;
8. persistent Backspin boundary chip;
9. raw/clamped Landing status.

Primary readouts:

- `APEX 33.0 YD`;
- `LANDING 54.3° DOWN`.

Boundary:

> BACKSPIN RPM · NOT USED BY THIS FLIGHT FIT

This boundary can be collapsed after first acknowledgment but remains available
through an icon/sheet.

### 6.1 Trace honesty

The trace is generated by the approved engine/trajectory sampler. It must not
be hand-drawn to match the listed Apex/Landing if the sampler differs.

If the current trajectory sampler cannot simultaneously reproduce the exact
numeric Apex and Landing geometry, the implementation plan must:

- keep numeric outputs authoritative;
- label the trace `ILLUSTRATIVE PROFILE`;
- avoid drawing a false tangent;
- either derive a consistent profile adapter or use a schematic with explicit
  MODEL label.

Do not silently force SVG control points to fake exact physics.

### 6.2 Controls

Guided:

- Dynamic Loft 20°–38°, step 1°;
- Attack −8°–+4°, step 1°;
- Club Speed 70–110 mph, step 5 mph.

Main S1 compares verified presets but requires learner predictions. S4 live uses
all three engine controls.

Face/Path remain 0° and hidden under held state.

### 6.3 Influence UI

For Apex:

- Ball Speed → saturating factor;
- Launch → multiplicative factor.

For Landing:

- Spin Loft → direct term;
- Launch → direct term and Apex path;
- Apex → mediator;
- clamps → gate.

No universal bar or pie chart.

## 7. Surface-by-surface specification

### S0 — Mission

**Eyebrow**

> LAUNCH, SPIN & DESCENT · 4 OF 4

**Title**

> Same peak. Different return.

**Body**

> Apex tells how high the model climbs. Landing Angle tells how it returns to
> launch elevation. Build the same peak with two different descents.

**Mission**

> TARGET APEX 31.3–31.7 YD
> Build Landing below 50° and above 54°

**Boundary**

> LANDING ANGLE ≠ STOPPING DISTANCE

**Primary**

> ENTER FLIGHT PROFILE LAB

**Voice**

> “Apex and descent are related, but one does not determine the other. Build the
> same peak twice.”

### S1 — Flight Profile Lab

**Title**

> What raises the peak?

#### Step A — Launch comparison

Base held:

- Spin Loft 33°;
- Ball Speed 119.52 mph.

Prediction:

> If Launch rises while both remain fixed, what happens to Apex?

Correct:

> It rises in this model.

Learner steps low/base/high Launch fixtures. Readouts:

- 28.862;
- 33.036;
- 37.210 yd.

#### Step B — Speed comparison

Hold Launch 17.85°, Spin Loft 33°. Toggle speed fixtures.

Prediction:

> Does each equal Club Speed step add the same Apex height?

Correct:

> No. The current Ball Speed term saturates, so the gain narrows.

#### Step C — Define Landing

Show landing wedge at equal elevation.

Prompt:

> What is the reference for Landing Angle?

Correct:

> The horizon at the equal-elevation carry point.

#### Step D — Separate outcomes

Prompt:

> Does 33 yd Apex uniquely determine Landing Angle?

Correct:

> No. Spin Loft and Launch also enter the Landing fit.

**Completion**

- both predictions;
- all controlled states inspected;
- landing reference correct;
- non-unique relation understood.

**Voice**

> “Launch and Ball Speed set modeled height. Descent also reads Spin Loft and
> Launch, so Apex is only one part.”

### S2 — Landing decomposition and clamp

**Title**

> Follow the paths into descent.

#### Stage 1 — Base ledger

Show the verified decomposition. Each row highlights its source:

- Spin Loft;
- Launch direct;
- Apex mediator.

The fit anchor remains visually neutral and labeled `FIT ANCHOR`.

#### Stage 2 — Launch has two paths

Move low/base/high launch at fixed Spin Loft/Ball Speed.

Highlight:

1. Launch direct term changes;
2. Apex changes;
3. Apex term changes;
4. LandingRaw changes.

Copy:

> Launch enters twice in the current fit. Do not count Launch and Apex as
> unrelated causes.

#### Stage 3 — Ball Speed is indirect

Move speed states at fixed Launch/Spin Loft.

Copy:

> Ball Speed changes Landing through Apex. There is no direct Ball Speed term.

#### Stage 4 — Spin Loft direct

Use two engine states selected by the implementation plan that keep Launch as
close as practical and show the raw 0.5°/degree term. The UI must use actual
`solveFlight()` outputs and disclose any simultaneous Ball Speed/Apex change.

The equation rail states:

> +1° SPIN LOFT → +0.5° LANDING RAW DIRECT

It does not claim total Landing changes exactly 0.5° at held Club Speed because
Spin Loft also changes modeled Smash/Ball Speed.

#### Stage 5 — Clamp

High-launch fixture:

- LandingRaw 60.608°;
- displayed Landing 60.000°.

Copy:

> The display ceiling hides another 0.608° of raw fitted change. This is an app
> clamp, not a physical maximum.

**Voice**

> “Spin Loft enters directly. Launch enters directly and through Apex. Ball
> Speed reaches descent through Apex.”

### S3 — Myths and model boundary

**Title**

> A flight profile is not a stopping promise.

#### Myth 1 — “Same Apex means same Landing”

Use the verified pair.

Correct:

> False. Same Apex, 6.63° different Landing in the current fit.

#### Myth 2 — “More Backspin rpm makes current Apex higher”

Correct:

> Not in the current Flightglass equation.

Boundary:

> Real Spin Rate materially affects height and trajectory. The current Apex fit
> omits it.

#### Myth 3 — “Landing Angle equals stopping distance”

Correct:

> False.

Reveal:

> Real stopping also depends on landing speed, Spin Rate, surface firmness,
> slope, bounce and roll. Flightglass does not calculate stopping distance.

#### Myth 4 — “60° is the physical maximum”

Correct:

> False. It is the current model clamp.

#### Myth 5 — “Higher and steeper are always better”

Correct:

> False. Useful trajectory depends on the shot, conditions and intent. Academy
> teaches the outcome, not a universal target.

**Voice**

> “Real spin and surface matter. This fitted profile cannot promise where the
> ball stops after landing.”

### S4 — Mastery Check

**Title**

> Prove you can separate height from descent.

Five tasks; pass requires at least four and live Task 5.

#### Task 1 — Apex definition

> Apex is:

- `Maximum trajectory height above launch elevation` — correct;
- `Launch Angle at impact`;
- `Landing speed`.

#### Task 2 — Apex inputs

> Which values enter current Flightglass Apex?

- `Ball Speed and Launch Angle` — correct;
- `Backspin rpm and Landing Angle`;
- `Spin Axis and Curve`.

#### Task 3 — Landing paths

> Which statement is complete?

- `Spin Loft and Launch enter directly; Apex also enters as a mediator` —
  correct;
- `Apex alone determines Landing`;
- `Backspin rpm is the only Landing input`.

#### Task 4 — Boundary

> Landing Angle is 55°. What can the app honestly conclude?

- `The modeled trajectory returns at 55° to the horizon at equal elevation` —
  correct;
- `The ball will stop within a known distance`;
- `The turf is firm`.

#### Task 5 — Live same-Apex transfer, mandatory

**Mission**

> SAME APEX · DIFFERENT DESCENT
> Build two states with Apex 31.3–31.7 yd.
> One Landing must be below 50.0°.
> The other must be above 54.0°.
> Landing difference must be at least 6.0°.

**Editable**

- Dynamic Loft;
- Attack Angle;
- Club Speed.

**Held**

- Face 0°;
- Path 0°;
- preset 7-iron;
- calm/equal-elevation model.

**Pass**

- both states learner-created;
- both raw Apex values in target;
- one raw/clamped Landing below 50 and one above 54;
- absolute displayed Landing difference ≥6°;
- Spin Loft differs ≥8°;
- states use different Club Speed;
- raw values drive gates;
- neither relies on a hidden clamp to fake the difference.

Verified pair:

- 25°/−3°/105 mph → Apex 31.48998, Landing 48.43998;
- 31°/−7°/85 mph → Apex 31.48971, Landing 55.07171.

**Near misses**

- Apex outside:
  > Adjust Ball Speed and Launch together before capturing.
- Landing gap too small:
  > The peaks match, but Spin Loft/Launch have not separated descent enough.
- clamp used:
  > Move away from the model ceiling so the raw descent difference is visible.
- same speed:
  > Use different Ball Speed paths to prove the peak can be rebuilt.

**Voice**

> “Match the peak twice. Then separate descent through Spin Loft, Launch, and
> the Apex path.”

### S5 — Result

**Pass eyebrow**

> FLIGHT HEIGHT & DESCENT · MASTERED

**Pass title**

> You separated peak height from return angle.

**Evidence**

> VERIFIED
> Apex inputs identified
> Landing paths decomposed
> Same Apex, different descent built live
> Stopping-distance boundary preserved

**Journey**

> LAUNCH, SPIN & DESCENT · COMPLETE

**Primary**

> CHOOSE YOUR NEXT GOAL

**Secondary**

- `REPLAY SAME-APEX MISSION`;
- `RETURN TO ACADEMY`;
- `REVIEW SOURCES`.

No hardcoded next to Total, Carry or Wind.

**Retry labels**

- `APEX DEFINITION`;
- `APEX INPUTS`;
- `LANDING PATHS`;
- `STOPPING BOUNDARY`;
- `LIVE PROFILE`.

**Voice**

> “You matched height and changed descent. The launch, spin, and descent journey
> is complete.”

## 8. Information sheets

### 8.1 Apex

> Maximum height above the elevation where the ball launched.

Truth:

> ≈ REAL WORLD DEFINITION · MODEL OUTPUT

### 8.2 Landing Angle

> Downward trajectory angle relative to the horizon when the modeled ball
> returns to launch elevation.

Truth:

> ≈ REAL WORLD DEFINITION · MODEL OUTPUT

### 8.3 What sets modeled Apex

> Current Flightglass uses Ball Speed and Launch Angle. Ball Speed uses a
> saturating fit; Launch multiplies it through a clamped factor.

### 8.4 What sets modeled Landing

> Spin Loft and Launch enter directly. Apex enters as a mediator. Launch also
> changed Apex, so it has two paths. Ball Speed reaches Landing through Apex.

### 8.5 Missing Backspin loop

> Real Spin Rate affects trajectory. Flightglass calculates Backspin but does
> not use that rpm in current Apex or Landing equations.

### 8.6 Clamps

> Landing display is clamped to 32°–60°. Raw fitted Landing remains available
> for explanation and testing. The bounds are not physical maxima/minima.

### 8.7 Not stopping distance

> Landing Angle is one input to bounce and roll. Real stopping also depends on
> landing speed, Spin Rate, surface, slope and collision. This lesson does not
> calculate stopping distance.

### 8.8 Model limits

> One 7-iron preset, calm air, equal elevation, fitted trajectory, no Spin Rate
> feedback into height/descent, no detailed aerodynamics, ground or surface.

### 8.9 Sources

- TrackMan Support, “Height (Apex)”:
  `https://support.trackmangolf.com/hc/en-us/articles/39726869324699-Parameters-Height-Apex`
- TrackMan Support, “Landing Angle”:
  `https://support.trackmangolf.com/hc/en-us/articles/39727190664859-Parameters-Landing-Angle-Tee-to-Green`
- TrackMan Support, “Ball Speed”:
  `https://support.trackmangolf.com/hc/en-us/articles/39726139974683-Parameters-Ball-Speed-Tee-to-Green`
- TrackMan Support, “Launch Angle”:
  `https://support.trackmangolf.com/hc/en-us/articles/39726267472667-Parameters-Launch-Angle-Tee-to-Green`
- TrackMan Support, “Spin Rate”:
  `https://support.trackmangolf.com/hc/en-us/articles/39726491252251-Parameters-Spin-Rate-Tee-to-Green`

External sources support definitions and real-world multi-factor context. Exact
fits, decomposition and clamps are Flightglass model claims.

## 9. Voice and synchronized UI

| Trigger | Voice | Visual |
|---|---|---|
| S0 | “Apex and descent are related, but one does not determine the other. Build the same peak twice.” | same-height traces diverge at landing |
| S1 | “Launch and Ball Speed set modeled height. Descent also reads Spin Loft and Launch, so Apex is only one part.” | Apex inputs then Landing paths |
| S2 | “Spin Loft enters directly. Launch enters directly and through Apex. Ball Speed reaches descent through Apex.” | causal paths highlight |
| S3 | “Real spin and surface matter. This fitted profile cannot promise where the ball stops after landing.” | NOT MODELED layer |
| S4 | “Match the peak twice. Then separate descent through Spin Loft, Launch, and the Apex path.” | two capture slots |
| Pass | “You matched height and changed descent. The launch, spin, and descent journey is complete.” | journey evidence |

Shared voice/caption policy applies.

## 10. State, compatibility and rewards

Canonical key:

> `academy.progress.flight-height-descent`

Evidence:

- content/flight version;
- mastery answers;
- both Task 5 raw inputs/outputs/terms;
- clamp state;
- stopping-boundary result;
- attempts/time/voice preference;
- prerequisite evidence versions.

Legacy aliases:

- `apex` → prior height evidence;
- `landing-angle` → prior descent evidence;
- either/both may open review/placement;
- no silent mastery;
- old deep links/history preserved;
- one canonical reward.

Prerequisites:

- Delivered Loft & Launch;
- Backspin;
- or placement.

Existing Backspin users remain eligible; no retroactive relock beyond the shared
placement/grandfather rules.

Completion closes the selected goal family and routes through Academy Home.

## 11. Accessibility, motion and haptics

- Trace has a complete textual trajectory summary.
- Apex and Landing rulers have units/reference words.
- Input paths are readable without color.
- Decomposition ledger has logical order and anchor label.
- Clamp state is announced.
- Direct controls expose signed values.
- Dynamic Type stacks trace, rulers and ledger.
- Reduce Motion uses immediate baseline/current profiles.
- Same-Apex pair remains distinguishable by trace styles/labels.
- No essential information is voice-only.
- Haptic: selection at target band, light on capture, success on mastery.
- Focus returns from sheets.

## 12. Failure and edge states

### Flight model unavailable

> FLIGHT PROFILE UNAVAILABLE
> Definitions remain available. Live mastery requires the protected engine.

### Trace mismatch

If visual trajectory cannot honor numeric Apex/Landing:

> PROFILE SCHEMATIC
> Numeric outputs are authoritative.

Do not draw a false exact tangent.

### Non-finite output

> THIS PROFILE COULD NOT BE CALCULATED

No evidence or fabricated trace.

### Clamp

Always show:

> RAW 60.6° → DISPLAY 60.0° · MODEL CEILING

or equivalent.

### Prior legacy completion

> PRIOR LEARNING FOUND
> Your Apex and Landing Angle history is preserved. Complete the combined
> profile check to verify mastery.

## 13. Verification contract

### 13.1 Model tests

1. low/base/high Launch fixtures match every frozen output/term;
2. low/base/high speed fixtures match every frozen output/term;
3. base decomposition sums exactly to `landingRaw`;
4. clamp maps 60.608122126137694 to 60;
5. same-Apex pair matches raw outputs;
6. Backspin changes cannot be claimed as an Apex/Landing input;
7. raw values drive mastery;
8. view does not duplicate formulas.

### 13.2 Native behavior tests

1. S0–S5/resume/back.
2. Apex/Landing reference lines correct.
3. trace/numeric truth policy.
4. Launch two-path highlighting.
5. Ball Speed indirect path.
6. clamp visible.
7. Task 5 requires both Apex targets and Landing gap.
8. no stopping claim.
9. voice/Replay/Voice Off/screen reader.
10. Dynamic Type/Reduce Motion.
11. migration/reward idempotency.

### 13.3 Content-truth tests

Fail if copy:

- says Apex is Launch Angle;
- says Apex alone determines Landing;
- says Backspin rpm drives current height/descent;
- hides real Spin Rate omission;
- calls Landing stopping distance/power;
- hides clamps or calls them physical;
- says Ball Speed enters Landing directly;
- double-counts Launch and Apex as independent shares;
- labels states as clubs;
- prescribes a flight target.

### 13.4 Acceptance evidence

- S0–S5;
- launch and speed Apex comparisons;
- base Landing decomposition;
- clamp state;
- same-Apex pair and live task;
- all boundary/myth states;
- voice/a11y/motion/text scaling;
- legacy migration;
- model/native tests;
- protected engine unchanged.

Acceptance is gate-based. A beautiful trajectory cannot compensate for a false
Backspin loop, hidden clamp, wrong landing reference or stopping promise.

## 14. Implementation boundary

An implementation plan may add native trajectory-profile views, adapters,
fixtures, migration, accessibility and tests. It must:

- use current engine outputs/terms;
- keep the missing Backspin loop visible;
- preserve equal-elevation and clamp labels;
- avoid false exact trace geometry;
- preserve aliases and one reward;
- route through Academy Home;
- leave production physics unchanged.

This document authorizes planning, not implementation.
