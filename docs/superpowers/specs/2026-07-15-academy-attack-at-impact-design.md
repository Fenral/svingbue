# Flightglass Academy — Up or Down at Impact Experience Design

**Status:** Normative design specification, 2026-07-15. Ready for an
implementation plan after the shared Academy curriculum/store migration spec
exists.

**Experience ID:** `attack-at-impact`

**Learner-visible title:** **Up or Down at Impact**

**Owned legacy concept:** `attack-angle`

**Primary outcome:** Attack Angle

**Goal families:** Strike & contact; prerequisite in Launch, spin & descent

**Normative inputs:**

- `docs/superpowers/specs/2026-07-15-academy-outcome-curriculum-blueprint.md`
- `docs/FLIGHTGLASS-CLAUDE-CODE-MASTER-PLAN.md`, Phase 6
- `impact-flight.js`
- `swing-parameters-and-impact.js`
- the `attack-angle` legacy content record in `academy.html`

## 1. Learner promise

Teach the learner to read Attack Angle as a direction of clubhead travel at one
instant—not as loft, launch, contact quality or a swing instruction.

The experience succeeds only when the learner can:

1. define Attack Angle relative to the horizon at impact;
2. distinguish descending, level and ascending delivery from the sign;
3. read the tangent direction from a side-on arc without relying on animation;
4. explain that a negative Attack Angle does not mean the ball launches down;
5. compare its two direct current-engine sensitivities: −1.0° Spin Loft and
   +0.25° Launch Angle for each +1.0° Attack Angle at held Dynamic Loft;
6. recognize Low Point position and plane as model causes of the derived angle,
   with vertical arc depth held separate; and
7. avoid treating positive or negative as universally “better.”

## 2. Non-goals

- Do not prescribe “hit down,” “swing up,” ball position, tee height, wrist
  action or body motion.
- Do not teach a universal Attack Angle target by club. The flight engine has
  one 7-iron preset, and this lesson is about the measurement.
- Do not call Attack Angle “compression.”
- Do not infer strike quality, divot depth or ground-first/ball-first sequence
  from Attack Angle alone.
- Do not teach Low Point geometry in full. The next experience owns it.
- Do not imply the phone measured a physical clubhead.
- Do not present the geometry engine's rigid circle as a captured real swing.
- Do not change `impact-flight.js` or `swing-parameters-and-impact.js`.

## 3. Legacy-content verdict

The legacy record contains the correct sign definition and useful downstream
equations, but it mixes measurement, model causes, coaching prescriptions and
club-specific optimization.

### Retain, rewritten

- Negative means the clubhead's geometric center is moving down at impact.
- Positive means it is moving up.
- Attack Angle is not Launch Angle or Dynamic Loft.
- Current Flightglass uses Attack Angle directly in Spin Loft and Launch Angle.
- In the separate rigid-circle geometry, where impact occurs relative to the
  low point and the plane both affect the derived angle.

### Reject from learner-facing copy

- “Every well-taught iron” or “driver must” prescriptions.
- “One degree per inch” as a universal real-golfer law.
- Tour-average targets presented without club/preset and measurement context.
- Claims that Attack Angle alone decides compression, contact or turf sequence.
- Advice to change ball position or tee height as if the model diagnosed a real
  player.
- “Single biggest free-distance change” language.

### Move to later experiences

- Low Point as a place: Low Point.
- Vertical arc depth and strike location: Strike Depth.
- Spin Loft and Backspin: Backspin.
- Delivered Loft and Launch Angle: Delivered Loft & Launch.

## 4. Definition and truth contract

Learner definition:

> Attack Angle is the vertical angle of the clubhead's direction of travel at
> impact, measured relative to the horizon.

Sign convention:

- negative: descending;
- zero: level;
- positive: ascending.

| Claim | Label | Meaning |
|---|---|---|
| Up/down movement at maximum compression relative to horizon | ≈ REAL WORLD DEFINITION | Industry-aligned parameter definition |
| The side-on tangent is the direction at that instant | DEFINITION / GEOMETRY | A tangent, not the clubface orientation |
| `SpinLoft = DynamicLoft − AttackAngle` | MODEL, simplified | Exact current flight engine; real Spin Loft is 3D |
| `LaunchAngle = 0.62 × DynamicLoft + 0.25 × AttackAngle` | MODEL | Exact current flight engine transform |
| Attack derived from rigid-circle Low Point and plane | MODEL GEOMETRY | Exact current geometry engine, not a measured swing |
| Fixed radius, rigid plane and clubhead point | HELD | Simplifying geometry assumptions |
| Shaft deflection, changing radius/plane, face orientation and contact dynamics | NOT MODELED | Cannot be inferred from this instrument |

### 4.1 Current-engine influence hierarchy

At held Dynamic Loft:

| Direct path | Per +1.0° Attack Angle | Role |
|---|---:|---|
| Spin Loft | −1.0° | dominant direct angular sensitivity |
| Launch Angle | +0.25° | smaller direct modifier |

The table compares two degree-valued model sensitivities. It does not say Spin
Loft is “four times more important” to the whole shot. Downstream effects use
different functions and are taught elsewhere.

Attack Angle also changes modeled Smash, Ball Speed, Backspin, Carry, Apex and
Landing Angle indirectly through the two paths. Those effects are previewed as
downstream, not ranked or assessed here.

### 4.2 Verified flight fixtures

All fixtures use Face 0°, Path 0°, Dynamic Loft 30°, Club Speed 90 mph and the
7-iron preset.

| Attack | Direction | Spin Loft | Launch Angle | Ball Speed | Carry |
|---:|---|---:|---:|---:|---:|
| −6.0° | down | 36.0° | 17.1° | 118.44 mph | 170.54 yd |
| −4.0° | down | 34.0° | 17.6° | 119.16 mph | 171.78 yd |
| 0.0° | level | 30.0° | 18.6° | 120.60 mph | 174.25 yd |
| +4.0° | up | 26.0° | 19.6° | 122.04 mph | 176.70 yd |
| +6.0° | up | 24.0° | 20.1° | 122.76 mph | 177.91 yd |

The central −4° to +4° comparison must say:

> Attack changed 8°. Spin Loft changed 8° in the opposite direction. Launch
> Angle changed 2° in the same direction.

Carry is shown only behind “Downstream preview.” It must not become the mission
or a universal optimization claim.

### 4.3 Verified geometry fixtures

Rigid-circle state: radius 1.20 m, plane 55°, swing direction 0°, depth 0.

| Effective Low Point | Derived Attack | Derived Club Path |
|---:|---:|---:|
| 6.0 cm behind | +2.347° | −1.645° |
| 2.0 cm behind | +0.782° | −0.548° |
| at ball | 0.000° | 0.000° |
| 2.0 cm ahead | −0.782° | +0.548° |
| 10.5 cm ahead | −4.110° | +2.884° |
| 15.0 cm ahead | −5.877° | +4.133° |

Only the sign relationship is taught on S1. The numeric mapping is labeled
`MODEL GEOMETRY · FIXED PLANE`. Club Path coupling is disclosed in the model
sheet but not made a second lesson objective.

### 4.4 Causal-completeness inventory

| Role | Item | Treatment |
|---|---|---|
| Measurement outcome | Attack Angle | Primary |
| Geometric sign cause | impact before/at/after Low Point in side-on arc | Guided preview |
| Material modifier | plane angle | Named; held at 55° in core interaction |
| Modeled coupling | swing direction changes effective Low Point | Deferred to optional Plane Coupling lab |
| Invariant in model | low-point vertical depth | Named; proved in Strike Depth |
| Held | radius, plane during core task, rigid arc, target frame | Visible drawer |
| Not modeled | time-varying plane/radius, shaft/sole, body motion, measurement noise | Boundary sheet |

## 5. Instrument design

The instrument is a side-on “impact tangent” window.

Required elements:

1. horizontal ground/reference line;
2. ball center at the origin;
3. a restrained arc segment;
4. one clubhead-center point at impact;
5. a tangent arrow through that point;
6. a horizon reference ray;
7. an angle wedge labeled with sign, degrees and word;
8. three static zones: descending, level, ascending.

Primary readout:

> ATTACK −4.1° · DOWN

Secondary readout:

> DIRECTION AT IMPACT

The clubface, delivered loft and ball launch arrow are absent from the main
instrument. They appear only in a myth comparison where distinct styling
prevents confusion.

### 5.1 No misleading motion

Attack Angle is an instantaneous direction. The default view is static.

An optional “show before and after” action may display:

- one ghost point immediately before impact;
- the impact point;
- one ghost point immediately after.

It must not animate a full swing or suggest timing/body mechanics. Reduce
Motion shows the three points immediately.

### 5.2 Controls

S1 teaching control:

- drag the tangent handle through −8° to +8°, step/snap 0.5°;
- screen-reader adjustable action with signed degree value.

Label:

> OUTCOME-LEVEL ANGLE LAB

S2 uses a segmented comparison:

- `−4° DOWN`;
- `0° LEVEL`;
- `+4° UP`.

S4 live transfer switches to geometry:

- learner drags the ball-impact marker along the fixed arc;
- engine derives Attack Angle through `deriveImpact()`;
- no direct Attack slider is available;
- low-point and plane values are visible as held state, but Low Point teaching
  is deferred.

### 5.3 Readout cause sentence

Outcome-level:

> The clubhead direction is 4.0° below the horizon at impact: descending.

Geometry transfer:

> Impact occurs before the modeled arc reaches its bottom, so the tangent still
> points down.

Boundary line:

> This is a rigid-circle model, not a club measurement.

## 6. Surface-by-surface specification

### S0 — Mission

**Eyebrow**

> STRIKE & CONTACT · 1 OF 3

**Title**

> Is the club moving up or down?

**Body**

> Read one instant: the direction the clubhead is traveling when ball and face
> are maximally compressed.

**Mission card**

> IDENTIFY
> Descending · Level · Ascending
> Then build both signs in the live arc

**Truth strip**

> ≈ REAL WORLD DEFINITION · MODEL INSTRUMENT

**Primary action**

> ENTER IMPACT ANGLE LAB

**Voice**

> “Ignore loft and launch for a moment. Read only the clubhead's direction at
> impact.”

The preview rotates the tangent once from down to level to up. No ball flight
is drawn.

### S1 — Impact Angle Lab

**Title**

> Read the tangent.

**Instruction**

> The tangent shows the direction at one point on the arc. Compare it with the
> horizon.

#### Step A — Descending

Initial angle: −4.0°.

**Prediction**

> Which word matches this direction?

Choices:

- `Descending` — correct;
- `Level`;
- `Ascending`.

Reveal:

> Negative means down. It does not mean closed face, low launch or poor
> contact.

#### Step B — Level

Learner drags to 0.0° ±0.25°.

Reveal:

> Level means the tangent and horizon align at impact.

#### Step C — Ascending

Learner drags to +3.0° or higher.

Reveal:

> Positive means up. It does not automatically mean more distance or better
> contact.

#### Step D — Separate the arrows

Show three toggleable arrows:

- clubhead travel: Attack Angle;
- clubface orientation: Dynamic Loft;
- initial ball direction: Launch Angle.

**Prompt**

> Which arrow defines Attack Angle?

Correct:

> Clubhead travel.

**Completion gate**

- sign prediction committed;
- level state produced;
- ascending state produced;
- arrow distinction correct.

**Voice sequence**

1. “The tangent is the direction. Below the horizon is negative; above it is
   positive.”
2. “Loft, launch, and attack can point differently. Keep their arrows
   separate.”

Only line 1 autoplays.

### S2 — Influence proof

**Title**

> One angle, two direct model paths.

**Held state**

- Dynamic Loft 30°;
- Face 0°;
- Path 0°;
- Club Speed 90 mph;
- preset 7-iron.

The comparison toggles −4°, 0° and +4° Attack.

#### Spin Loft rail

> +1° ATTACK → −1° SPIN LOFT

States:

- −4° Attack → 34° Spin Loft;
- 0° Attack → 30° Spin Loft;
- +4° Attack → 26° Spin Loft.

Role label:

> DOMINANT DIRECT ANGULAR SENSITIVITY

#### Launch Angle rail

> +1° ATTACK → +0.25° LAUNCH ANGLE

States:

- −4° Attack → 17.6° Launch;
- 0° Attack → 18.6° Launch;
- +4° Attack → 19.6° Launch.

Role label:

> SMALLER DIRECT MODIFIER

#### Required interpretation

> In this engine, Attack moves Spin Loft degree for degree. Its direct Launch
> Angle contribution is one quarter as large. That does not make the total
> flight four times more sensitive to one outcome.

No percentages or “importance score” appears.

#### Downstream preview

Collapsed by default:

> Smash, Ball Speed, Backspin, Carry, Apex and Landing Angle can also move
> downstream. Their lessons own those outcomes.

**Voice**

> “Attack moves modeled Spin Loft one for one. Its direct Launch Angle effect is
> smaller: one quarter degree.”

### S3 — Myths and boundary

**Title**

> Direction is not destiny.

#### Experiment 1 — “Downward attack means downward launch”

State:

- Attack −4.0°;
- Dynamic Loft 30°.

Prediction:

> Does the modeled ball launch below the horizon?

Correct:

> No. It launches +17.6° because delivered loft is the larger direct input in
> this model.

Visual:

- attack arrow points down;
- face arrow points up;
- launch arrow points up;
- labels prevent the three from merging.

#### Experiment 2 — “Descending means turf first”

Claim:

> “If Attack is negative, the club must hit the ground before the ball.”

Correct:

> Not from Attack Angle alone.

Boundary:

> Ground sequence also depends on where the modeled arc sits vertically and
> where its low point is. Strike Depth owns that proof.

Do not display a real divot photo or coaching recommendation.

#### Experiment 3 — “Positive is always better”

Correct:

> No. The useful delivery depends on the shot, club, lie and intended outcome.
> This lesson verifies the direction, not a universal target.

#### Experiment 4 — Model cause

Compare fixed-plane rigid-circle states:

- low point 6 cm behind → +2.35°;
- low point 10.5 cm ahead → −4.11°.

Copy:

> In this model, impact after the bottom is ascending; impact before the bottom
> is descending. Plane changes the magnitude, so the centimeters-to-degrees
> mapping is not universal.

**Voice**

> “Attack tells direction at impact. It does not, by itself, tell launch,
> contact quality, or the correct target.”

### S4 — Mastery Check

**Title**

> Prove you can read impact direction.

Five tasks. Pass requires at least four correct and completion of Task 5.

#### Task 1 — Definition

**Prompt**

> Attack Angle measures which direction?

Choices:

- `The clubhead's travel relative to the horizon at impact` — correct;
- `The face orientation relative to the horizon`;
- `The ball's initial launch direction`.

#### Task 2 — Sign

**Prompt**

> The tangent points 3° below the horizon. Which readout is correct?

Choices:

- `−3° · descending` — correct;
- `+3° · descending`;
- `−3° · ascending`.

#### Task 3 — Influence

**Prompt**

> Dynamic Loft is held. Attack rises from −2° to +2°. What changes directly in
> the current model?

Choices:

- `Spin Loft falls 4°; Launch Angle rises 1°` — correct;
- `Spin Loft rises 1°; Launch Angle falls 4°`;
- `Both rise 4°`.

#### Task 4 — Boundary

**Prompt**

> Attack is −4°. Which conclusion is justified by that number alone?

Choices:

- `The clubhead was moving down at impact` — correct;
- `The ball launched down`;
- `The club hit turf before the ball`;
- `The strike was compressed well`.

#### Task 5 — Live geometry transfer, mandatory

**Mission**

> TWO DIRECTIONS · ONE FIXED ARC
> Move the impact marker to create:
> 1. Attack between −5.0° and −3.0°
> 2. Attack between +1.0° and +3.0°

**Visible**

- arc and bottom marker;
- horizon;
- tangent;
- signed output after capture.

**Hidden until capture**

- live numeric Attack value.

**Held**

- radius 1.20 m;
- plane 55°;
- swing direction 0°;
- vertical depth 0.

**Pass**

- both ranges reached using the geometry engine;
- the learner labels the first descending and second ascending;
- direct angle control is unavailable;
- raw `deriveImpact()` output determines the gate.

**Near miss feedback**

- correct sign, too small:
  > The tangent points the right way, but not far enough from the horizon.
- wrong sign:
  > The impact point is on the other side of the modeled bottom.
- order reversed:
  > Both directions were built. Capture descending first, then ascending.

**Voice**

> “Move the impact point, not the number. Build one descending and one
> ascending tangent.”

### S5 — Result

**Pass eyebrow**

> ATTACK ANGLE · MASTERED

**Pass title**

> You can read up or down at impact.

**Evidence card**

> VERIFIED
> Direction, sign and tangent identified
> Direct model sensitivities compared
> Both signs built in the live arc

**Next**

> NEXT IN STRIKE & CONTACT
> Low Point
> Name where the modeled arc reaches its bottom.

**Alternate journey**

> ALSO UNLOCKED
> Delivered Loft & Launch
> Continue the launch, spin & descent journey.

Academy Home chooses which journey continues. The sticky action uses the
currently selected goal, not a hardcoded next screen.

**Primary action**

> CONTINUE CURRENT GOAL

**Secondary actions**

- `REPLAY LIVE ARC`;
- `RETURN TO ACADEMY`;
- `REVIEW SOURCES`.

**Retry**

Evidence-specific repair labels:

- `DEFINITION`;
- `SIGN`;
- `MODEL SENSITIVITY`;
- `INFERENCE LIMIT`;
- `LIVE TANGENT`.

**Voice**

> “You read the direction at impact. Next, locate the bottom that helps create
> it.”

## 7. Information sheets

### 7.1 Attack Angle

**Body**

> Attack Angle is the up/down direction of the clubhead's geometric center at
> maximum compression, relative to the horizon.

**Sign**

- negative: moving down;
- zero: level;
- positive: moving up.

**Truth label**

> ≈ REAL WORLD DEFINITION

### 7.2 Not Dynamic Loft

> Dynamic Loft describes face orientation. Attack Angle describes clubhead
> travel. A face can point up while the clubhead moves down.

Link:

> OPEN DELIVERED LOFT PREVIEW

### 7.3 Not Launch Angle

> Launch Angle describes the ball's initial vertical direction. In the current
> model it is influenced more directly by Dynamic Loft than by Attack Angle.

### 7.4 What it changes here

> At held Dynamic Loft, every +1° Attack reduces modeled Spin Loft by 1° and
> raises modeled Launch Angle by 0.25°. Later lessons show the downstream
> consequences.

**Truth label**

> MODEL

### 7.5 Geometry cause preview

> The rigid-circle instrument derives Attack from the impact point, modeled Low
> Point and plane. Moving the vertical depth of the entire arc does not change
> the tangent angle in this model.

**Truth label**

> MODEL GEOMETRY

### 7.6 Model limits

> The arc has a fixed radius and plane. It does not model changing swing shape,
> shaft deflection, club sole, body motion, turf deformation or measurement
> noise. The phone has not observed your club.

### 7.7 Sources

- TrackMan Support, “Attack Angle”:
  `https://support.trackmangolf.com/hc/en-us/articles/39724226342555-Parameters-Attack-Angle-Tee-to-Green`
- TrackMan Support, “Low Point Distance”:
  `https://support.trackmangolf.com/hc/en-us/articles/39724600685339-Parameters-Low-Point-Distance-Tee-to-Green`
- TrackMan Support, “Spin Loft”:
  `https://support.trackmangolf.com/hc/en-us/articles/39724683297051-Parameters-Spin-Loft-Tee-to-Green`
- TrackMan Support, “Launch Angle”:
  `https://support.trackmangolf.com/hc/en-us/articles/39726267472667-Parameters-Launch-Angle-Tee-to-Green`

External sources support parameter definitions and the qualitative relations.
Flightglass's coefficients and rigid-circle mapping remain model claims.

## 8. Voice and synchronized UI

| Trigger | Voice | Visual |
|---|---|---|
| First S0 entry | “Ignore loft and launch for a moment. Read only the clubhead's direction at impact.” | Other arrows dim; tangent remains |
| First S1 entry | “The tangent is the direction. Below the horizon is negative; above it is positive.” | Horizon and wedge highlight |
| Arrow distinction | “Loft, launch, and attack can point differently. Keep their arrows separate.” | Three labeled arrows separate |
| S2 entry | “Attack moves modeled Spin Loft one for one. Its direct Launch Angle effect is smaller: one quarter degree.” | Two rails update together |
| S3 conclusion | “Attack tells direction at impact. It does not, by itself, tell launch, contact quality, or the correct target.” | Four inference chips resolve |
| S4 live | “Move the impact point, not the number. Build one descending and one ascending tangent.” | Number hides; arc gate appears |
| Pass | “You read the direction at impact. Next, locate the bottom that helps create it.” | Result evidence resolves |

Shared native voice contract applies: calm American female lab/control-room
character, 12–24 words, 3–8 seconds, once per new signature, captions, Replay,
interruptible audio, Voice Off persistence and screen-reader autoplay
suppression.

## 9. State, compatibility and rewards

Canonical key:

> `academy.progress.attack-at-impact`

Evidence includes:

- content/model versions;
- mastery item results;
- both raw geometry states and derived outputs from Task 5;
- inference-limit result;
- attempts and completion time;
- voice preference.

Legacy migration:

- `attack-angle` completion becomes prior evidence;
- old deep links route to this experience;
- prior evidence may unlock a placement challenge;
- it does not silently award new mastery;
- canonical mastery writes one completion/reward only.

Prerequisites:

- preview: none;
- mastery: none.

Completion unlocks both Low Point and Delivered Loft & Launch. It does not choose
the next journey for the learner.

## 10. Accessibility, motion and haptics

- Tangent direction has text such as “four degrees below horizon,
  descending.”
- Sign, word and arrow direction all encode state; color is supplementary.
- The angle wedge meets contrast at all states and does not rely on fine
  one-pixel lines.
- Drag control has adjustable actions and a non-drag alternative.
- Hidden-number mastery announces only “above,” “level” or “below” until
  capture; it does not leak the exact answer.
- Dynamic Type reflows instrument and rails vertically.
- Reduce Motion uses static before/impact/after points.
- Voice and captions contain no exclusive information.
- Optional haptic: selection at level crossing, light on capture, success on
  pass; no continuous vibration.
- Focus returns from every information sheet.

## 11. Failure and edge states

### Flight model unavailable

S1 definition remains usable. S2 and its mastery influence task show:

> FLIGHT RELATION UNAVAILABLE
> Your definition progress is safe. Model comparison requires the flight
> engine.

### Geometry model unavailable

> LIVE ARC UNAVAILABLE
> Your knowledge answers are safe. Mastery waits for the geometry instrument.

Composer interaction cannot replace live Task 5.

### Non-finite output

Retain last valid arrow and show:

> THIS ANGLE COULD NOT BE CALCULATED

No mastery credit.

### Exact zero

Display:

> 0.0° · LEVEL

Normalize negative zero before visual and accessibility formatting.

### Prior completion

> PRIOR LEARNING FOUND
> Your Attack Angle history is preserved. Complete this outcome check to verify
> the new experience.

## 12. Verification contract

### 12.1 Flight adapter tests

1. fixtures for −6, −4, 0, +4 and +6 match `solveFlight()` raw outputs;
2. +1° Attack produces −1° Spin Loft and +0.25° Launch Angle at held inputs;
3. view never reimplements flight formulas;
4. rounded values do not drive mastery;
5. negative zero normalizes.

### 12.2 Geometry adapter tests

1. x −0.06 m at the held state derives +2.347354349071378°;
2. x 0 derives 0°;
3. x +0.105 m derives −4.110245535124602°;
4. x +0.15 m derives −5.8770447150409°;
5. Task 5 uses raw `deriveImpact()` output;
6. vertical depth changes do not change derived Attack;
7. protected geometry code is consumed, not copied.

### 12.3 Native behavior tests

1. S0–S5 sequence and resume.
2. Prediction precedes reveal.
3. Tangent, horizon and sign always agree.
4. Attack, Dynamic Loft and Launch arrows remain distinguishable.
5. Direct Attack slider is absent from live mastery.
6. Both live signs are required.
7. Voice once, Replay and Voice Off.
8. screen-reader suppression.
9. Reduce Motion and Dynamic Type parity.
10. idempotent reward and goal-routing behavior.

### 12.4 Content-truth tests

Fail if copy:

- defines Attack as face orientation or ball launch;
- says negative Attack means downward ball launch;
- says Attack alone proves ground-first/ball-first or contact quality;
- prescribes universal positive/negative targets;
- calls the 1:1 and 0.25 coefficients universal collision physics;
- calls the rigid-circle state measured;
- presents centimeters-per-degree as a universal real-golfer law;
- hides the smaller-versus-larger direct model roles;
- claims vertical depth changes Attack in this engine.

### 12.5 Acceptance evidence

- S0–S5 screenshots at standard/accessibility sizes;
- down/level/up angle states;
- separate Attack/Dynamic Loft/Launch arrows;
- −4/0/+4 influence proof;
- all myth reveals;
- both live mastery gates and near misses;
- voice/caption/accessibility evidence;
- Reduce Motion evidence;
- `attack-angle` migration fixture;
- adapter/native test output;
- proof both protected engines are unchanged.

Acceptance is gate-based. A visually convincing swing cannot compensate for a
wrong definition, prescriptive target, confused arrow or composer-only mastery.

## 13. Implementation boundary

An implementation plan may add native views, adapters for the two protected
engines, fixtures, migration aliases, accessibility metadata and tests. It
must:

- keep the outcome-level angle lab separate from live geometry evidence;
- show exact truth labels;
- use current engine outputs as numeric authority;
- preserve the `attack-angle` alias;
- unlock both applicable journeys without hardcoding the next screen;
- leave production physics and unrelated behavior unchanged.

This document authorizes planning, not implementation.
