# Flightglass Academy — Shape Experience Design

**Status:** Normative design specification, 2026-07-15. Ready for an
implementation plan after the shared Academy curriculum/store migration spec
exists.

**Experience ID:** `shape`

**Owned legacy concepts:** `spin-axis`, `curve`

**Primary outcome:** Shape

**Goal family:** Start line & shape

**Normative inputs:**

- `docs/superpowers/specs/2026-07-15-academy-outcome-curriculum-blueprint.md`
- `docs/superpowers/specs/2026-07-15-academy-start-line-design.md`
- `docs/FLIGHTGLASS-CLAUDE-CODE-MASTER-PLAN.md`, Phase 6
- `docs/superpowers/specs/2026-07-13-backspin-96-97-design.md`
- `impact-flight.js`
- the `spin-axis` and `curve` legacy content records in `academy.html`

## 1. Learner promise

Teach the learner to separate start from bend, create a requested left or right
shape without moving the start line, and explain the difference between the
real golf relationship and Flightglass's deliberately smaller model.

The experience succeeds only when the learner can:

1. define Face-to-Path as Face Angle minus Club Path;
2. use the sign of Face-to-Path to predict modeled Spin Axis and curve direction;
3. recognize matched face and path as the zero-curve gate in this model, even
   when both point away from the target;
4. keep Launch Direction constant while changing Shape;
5. distinguish the mechanism, Spin Axis, from the sideways outcome, Curve;
6. explain that carry amplifies curve distance without changing the launch Spin
   Axis in the current model; and
7. identify centered contact, spin magnitude, full three-dimensional delivery
   and wind as held or unmodeled boundaries rather than silently absent causes.

## 2. Non-goals

- Do not reteach Launch Direction as the main outcome. It is a quiet reference
  inherited from Start Line.
- Do not teach final Offline or target proximity. Shot Pattern owns the combined
  landing outcome.
- Do not claim that Face-to-Path alone determines every real ball's curve.
  Impact location and gear effect can materially alter curvature, especially
  with woods.
- Do not equate Spin Axis with Backspin. They describe different properties of
  the launch spin vector.
- Do not claim the engine's `1.5 × Face-to-Path` relationship or
  `carry² × Spin Axis / 12000` curve relationship is a physical law.
- Do not prescribe a grip, swing direction, alignment or preferred stock shape.
- Do not call the low- and high-speed states different clubs. The protected
  engine still uses one 7-iron preset.
- Do not change `impact-flight.js`.

## 3. Legacy-content verdict

The legacy lessons contain the correct core distinction—Face-to-Path relates to
spin-axis tilt, and Curve is not the same as Offline—but overstate causal
completeness and read like reference articles rather than a lesson.

### Retain, rewritten

- Face-to-Path is the face/path difference.
- A zero gap produces zero modeled Spin Axis and zero modeled Curve.
- Spin Axis describes tilt at launch; Curve describes sideways movement during
  flight.
- More time and distance in flight can amplify the number of sideways yards.
- A ball can start right and curve left, or start left and curve right.

### Reject from learner-facing copy

- “Curve is caused entirely by Face-to-Path.”
- “Path determines the curve.”
- “A draw always means an in-to-out path” or the mirrored fade claim.
- Any universal driver/iron/wedge ratio when the engine exposes one 7-iron
  preset.
- Any coaching instruction that treats the modeled diagnosis as a prescribed
  body or club intervention.
- Any implication that the engine measures the user's strike or wind.

### Move to later experiences

- Final landing side and target miss move to Shot Pattern.
- Backspin magnitude and spin-loft production remain in Backspin.
- Carry production remains in Carry.
- Wind-driven lateral movement remains in Wind.

## 4. Model and truth contract

The current protected engine computes:

```text
FaceToPath = FaceAngle − ClubPath
SpinAxis = clamp(1.5 × FaceToPath, −38°, +38°)
Curve = clamp(Carry² × SpinAxis / 12000, −0.60 × Carry, +0.60 × Carry)
```

These expressions require different truth labels:

| Statement | Label | Required learner meaning |
|---|---|---|
| `FaceToPath = FaceAngle − ClubPath` | DEFINITION | The horizontal angular gap in the app's coordinate convention |
| Face-to-Path is a major centered-strike contributor to expected curvature | ≈ REAL WORLD | Useful beyond the app, but not causally complete |
| `SpinAxis = 1.5 × FaceToPath` plus clamp | MODEL | Flightglass teaching transform, not an industry law |
| `Curve = Carry² × SpinAxis / 12000` plus clamp | MODEL | Flightglass visual heuristic, not an aerodynamic equation |
| Centered contact | HELD | The lesson behaves as though strike location does not change |
| Calm air | HELD | No wind-driven movement is added |
| Backspin/total-spin magnitude | HELD / NOT USED HERE | Real flight depends on the full spin vector; this curve formula does not |
| Gear effect and impact location | NOT MODELED | A real shot can depart from the lesson's prediction |
| Full 3D face/path, dynamic lie and spin-axis aerodynamics | NOT MODELED | The lesson uses the engine's horizontal abstraction |

The learner-facing default equation is the definition:

> Face-to-Path = Face Angle − Club Path

The two model equations live behind “How this instrument works.” They are never
presented as universal golf laws.

### 4.1 Coordinate and sign convention

The experience is written for a right-handed display convention:

- positive Face-to-Path → positive modeled Spin Axis → curve right;
- negative Face-to-Path → negative modeled Spin Axis → curve left;
- zero Face-to-Path → zero modeled Spin Axis → no modeled curve.

Every directional readout must include words as well as signs:

- `+6.0° · RIGHT`
- `−6.0° · LEFT`
- `0.0° · STRAIGHT`

If handedness is added later, the implementation plan must define whether the
engine convention or only user-facing labels mirror. This specification must
not be “fixed” locally by reversing signs.

### 4.2 Verified teaching fixtures

All fixtures below are direct `solveFlight()` outputs with Dynamic Loft 30°,
Attack Angle −3°, 7-iron preset and, unless stated, Club Speed 90 mph.
Presentation rounds degrees to 0.1° and distances to one yard.

| Fixture | Face | Path | Launch Direction | Face-to-Path | Spin Axis | Carry | Curve |
|---|---:|---:|---:|---:|---:|---:|---:|
| Matched | +1.0° | +1.0° | +1.0° | 0.0° | 0.0° | 172.4 yd | 0.0 yd |
| Right bend | +2.0° | −2.0° | +1.0° | +4.0° | +6.0° | 172.4 yd | +14.9 yd |
| Left bend | 0.0° | +4.0° | +1.0° | −4.0° | −6.0° | 172.4 yd | −14.9 yd |
| Same axis, low speed | +2.0° | −2.0° | +1.0° | +4.0° | +6.0° | 124.8 yd | +7.8 yd |
| Same axis, high speed | +2.0° | −2.0° | +1.0° | +4.0° | +6.0° | 211.6 yd | +22.4 yd |

The first three fixtures are the central proof: identical Launch Direction,
identical Carry, but straight, right-bending and left-bending flights.

The speed pair is an amplifier proof only. Copy must say:

> The launch tilt stayed +6.0°. The longer modeled flight turned the same tilt
> into more sideways yards.

It must not say speed “creates more Spin Axis.”

### 4.3 Causal-completeness inventory

| Role | Item | Included how |
|---|---|---|
| Composite direct driver | Face-to-Path | Main mechanism; face and path enter equally per degree because it is their difference |
| Components | Face Angle, Club Path | Editable, but never double-counted beside Face-to-Path in an influence ranking |
| Mediator | Spin Axis | Modeled launch state between gap and curve |
| Amplifier | Carry | Changes curve distance in the current model without changing Spin Axis |
| Gate | Face Angle = Club Path | Makes Face-to-Path, modeled Spin Axis and modeled Curve zero |
| Quiet reference | Launch Direction | Held constant in the central proof |
| Held | Dynamic Loft, Attack Angle, preset, calm air, centered contact | Visible in “Held for this shot” |
| Not modeled | Gear effect, impact location, full 3D spin/aerodynamics, wind | Named in boundary sheet and mastery |

The influence view must not rank Face-to-Path, Face Angle and Club Path as three
independent causes. That would count the same relationship twice.

## 5. Instrument design

The instrument is a restrained top-down “shape tunnel,” not a golf-course
illustration.

It contains:

1. a vertical target line through the origin;
2. a slim Launch Direction rail leaving the ball;
3. a fixed +1.0° start gate used in the guided proof;
4. a full modeled flight trace that begins on the rail and bends left, right or
   remains straight;
5. a ghost trace from the prior state;
6. a small axis puck showing left, level or right tilt;
7. one Curve bracket measured perpendicular from the Launch Direction rail to
   the carry point.

It deliberately omits:

- target bullseyes and scoring rings;
- the target-relative Offline bracket;
- trees, fairways, wind arrows and landing roll;
- a clubhead animation that implies measured mechanics;
- decorative particles;
- the word “dispersion.”

The graph label is:

> SHAPE · CURVE FROM LAUNCH DIRECTION

The quiet top chip reads:

> START +1.0° RIGHT · HELD

The viewer must be able to see that Curve is measured from the launch line, not
from the target line. This distinction is the preparation for Shot Pattern.

### 5.1 Controls

Guided and live states expose:

- Face Angle, −6.0° to +6.0°, step 0.5°;
- Club Path, −6.0° to +6.0°, step 0.5°.

Influence proof adds one segmented switch:

- `LOWER SPEED` — Club Speed 70 mph;
- `BASE` — Club Speed 90 mph;
- `HIGHER SPEED` — Club Speed 110 mph.

Dynamic Loft 30°, Attack Angle −3° and the 7-iron preset remain held and visible
in the state drawer. Speed is editable only during the amplifier proof; it is
not available during mastery except in the dedicated prediction item.

The guided live mission constrains combinations to the verified +1.0° Launch
Direction family. The implementation may use a linked control or accept any
face/path pair that produces +1.0° ±0.1°. It must not secretly alter a value
after the learner releases a control.

### 5.2 Readouts

Primary live readouts:

1. `FACE-TO-PATH +4.0°`
2. `SPIN AXIS +6.0° · RIGHT`
3. `CURVE +14.9 YD · RIGHT`

Quiet readouts:

- `LAUNCH +1.0° RIGHT`
- `CARRY 172.4 YD`

Readout hierarchy follows the causal chain. Curve is visually strongest, Spin
Axis second, Face-to-Path third. Launch and Carry use muted text because they
are reference/amplifier states.

For zero:

- `FACE-TO-PATH 0.0°`
- `SPIN AXIS 0.0° · LEVEL`
- `CURVE 0.0 YD · STRAIGHT`

Never show `−0.0`.

### 5.3 Cause sentence

The live sentence has three clauses:

> Face is 4.0° right of Path. Flightglass maps that gap to 6.0° right Spin
> Axis. Over 172.4 yards, the model bends 14.9 yards right.

For the zero gate:

> Face matches Path. The modeled axis is level, so this flight does not bend.

For a negative case:

> Face is 4.0° left of Path. Flightglass maps that gap to 6.0° left Spin Axis.
> Over 172.4 yards, the model bends 14.9 yards left.

The first clause is a definition, the second and third are model claims. Small
truth chips appear at their boundaries: `DEFINITION`, then `MODEL`.

## 6. Surface-by-surface specification

### S0 — Mission

**Eyebrow**

> START LINE & SHAPE · 2 OF 3

**Title**

> Keep the start. Change the bend.

**Body**

> Three shots can begin on the same line and fly three different shapes. Your
> job is to make one fly straight, one bend left and one bend right—without
> moving its +1.0° start.

**Truth strip**

> ≈ REAL WORLD · Face-to-Path is a major centered-strike clue, not the whole
> real-world curve story.

**Mission card**

> TARGET
> Launch +1.0° right
> Shape: straight → left → right

**Primary action**

> ENTER SHAPE LAB

**Secondary action**

> REVIEW START LINE

The secondary action returns to the completed Start Line result without losing
Shape progress.

**Interaction**

A three-trace preview animates once: all traces leave on the same rail, then
separate. Animation lasts at most 900 ms and is replaced by a static diagram
under Reduce Motion.

**Voice**

> “Keep the same start line. Now make the flight bend left, right, or not at
> all.”

The start button becomes available immediately; voice never blocks it.

### S1 — Shape Lab

**Title**

> Same start. Different gap.

**Instruction**

> Begin with Face and Path matched. Then separate them while the launch gate
> stays fixed.

**Initial state**

- Face +1.0°
- Path +1.0°
- Face-to-Path 0.0°
- Launch +1.0°
- Spin Axis 0.0°
- Curve 0.0 yd

**Step A prompt**

> MATCHED
> Face +1.0° · Path +1.0°
> What shape do you expect?

Choices:

- `Straight` — correct;
- `Bends left`;
- `Bends right`.

After commitment, reveal the straight trace and:

> Equal does not mean “on target.” It means no modeled gap—and therefore no
> modeled curve.

**Step B prompt**

> KEEP LAUNCH AT +1.0°
> Set Face to +2.0° and Path to −2.0°.

Both controls remain visibly learner-operated. When correct:

> Same +1.0° start. Face is now 4.0° right of Path, so the model creates a
> +6.0° axis and 14.9 yards of right curve.

**Step C prompt**

> REVERSE THE GAP
> Set Face to 0.0° and Path to +4.0°.

When correct:

> Same +1.0° start. The gap reversed, so the modeled axis and curve reversed.

**Reflection**

> What stayed the same?

Choices:

- `Launch Direction and Carry` — correct;
- `Face-to-Path and Spin Axis`;
- `Face Angle and Club Path`.

**Completion gate**

- prediction committed;
- both required states created;
- reflection answered;
- controls changed by the learner, not only replayed.

**Voice sequence**

1. Entry: “Match Face and Path first. The flight starts right, but it does not
   bend.”
2. First separation: “The start stayed fixed. The gap changed, so the modeled
   shape changed.”
3. Reversal: “Reverse the gap, and the curve reverses with it.”

Only the entry line autoplays. Later lines are event-triggered and play once per
completed event.

### S2 — Influence and amplifier proof

**Title**

> One mechanism. One amplifier.

**Intro**

> Face and Path form one gap. Carry does a different job: it changes how many
> sideways yards that modeled tilt can accumulate.

#### Stage 1 — The gap

Display a centered equation rail:

> FACE ANGLE − CLUB PATH = FACE-TO-PATH

Two independent half-degree buttons are tested from the same base:

- `FACE +0.5°`;
- `PATH −0.5°`.

Both increase Face-to-Path by +0.5° and modeled Spin Axis by +0.75°.

**Prompt**

> Which change has the larger direct effect on Face-to-Path?

Correct answer:

> Neither. One degree of Face and one degree of Path contribute equally to
> their difference.

**Required note**

> This does not mean Face and Path affect Launch Direction equally. Start Line
> already showed that separate relationship.

This note prevents the learner from transferring the Start Line weighting into
the Face-to-Path definition.

#### Stage 2 — Carry as an amplifier

Lock Face +2.0° and Path −2.0°. Switch among the three verified speed states.

| State | Spin Axis | Carry | Curve |
|---|---:|---:|---:|
| Lower speed | +6.0° | 124.8 yd | +7.8 yd |
| Base | +6.0° | 172.4 yd | +14.9 yd |
| Higher speed | +6.0° | 211.6 yd | +22.4 yd |

**Prompt**

> What changed at launch?

Correct answer:

> Not the modeled Spin Axis. The flight traveled farther, so the current model
> accumulated more curve yards.

**Influence summary**

> FOR THIS SHOT
> Face-to-Path: direct mechanism
> Carry: amplifier of curve distance
> Launch Direction: held reference

No percentages or bars are shown. These are different causal roles, not shares
of one total.

**Voice**

> “The gap sets the modeled tilt. Carry changes how far that tilt can move the
> ball sideways.”

### S3 — Myths and model boundary

**Title**

> Test the story, not just the number.

Each experiment requires a prediction before the reveal. The model trace and
the boundary explanation are separate panels.

#### Experiment 1 — “Path makes the curve”

**Claim**

> “An in-to-out Path automatically creates a left-bending shot.”

**Test states**

- Face +4.0°, Path +4.0°;
- Face 0.0°, Path +4.0°.

**Question**

> Do both bend left in Flightglass?

Correct answer:

> No. The matched +4°/+4° state has zero gap and zero modeled curve. The 0°/+4°
> state has a negative gap and bends left.

**Debrief**

> Path is one component of the gap. It does not determine modeled shape by
> itself.

#### Experiment 2 — “More backspin means more side curve”

**Claim**

> “If Backspin rises, this model must curve more.”

**Interaction**

Show two recorded Backspin values from valid engine states while keeping the
Shape chain collapsed. Ask whether Backspin is an input to the current Curve
formula.

Correct answer:

> No. Flightglass's current Curve formula uses Carry and modeled Spin Axis, not
> Backspin magnitude.

**Boundary**

> In real flight, curvature depends on the full spin vector and aerodynamics.
> This smaller model must not be used to claim that spin magnitude never
> matters.

This experiment is explanatory, not a request to modify the Backspin lesson or
engine.

#### Experiment 3 — “Face-to-Path tells the whole real story”

**Claim**

> “Once Face-to-Path is known, real curve is fully determined.”

**Correct answer**

> No.

**Boundary reveal**

> Flightglass holds centered contact. Real impact location can add gear effect
> and materially change expected curvature, especially with woods. Wind changes
> the flight path too, but not the ball's launch Spin Axis.

**Labels**

- `CENTERED CONTACT · HELD`
- `GEAR EFFECT · NOT MODELED`
- `WIND · LATER EXPERIENCE`

**Voice**

> “Face-to-Path is powerful, but centered contact is an assumption—not a fact
> measured by this phone.”

### S4 — Mastery Check

**Title**

> Prove you can separate start from shape.

The check contains five tasks. Tasks 1–4 are knowledge and prediction; Task 5
is mandatory live transfer. Passing requires at least four correct overall and
Task 5 complete. A retry changes values but preserves the tested concept.

#### Task 1 — Definition

**Prompt**

> Face is +2.5°. Path is −1.5°. What is Face-to-Path?

Choices:

- `+4.0°` — correct;
- `+1.0°`;
- `−4.0°`.

**Evidence**

> Applied Face Angle − Club Path.

#### Task 2 — Direction

**Prompt**

> In this right-handed display, Face-to-Path is −3.0°. What does Flightglass
> predict?

Choices:

- `Negative Spin Axis and left curve` — correct;
- `Positive Spin Axis and right curve`;
- `No curve because Path is positive`.

**Evidence**

> Used the model's sign convention.

#### Task 3 — Zero gate

**Prompt**

> Face is +3.0°. Path is +3.0°. The ball begins right. What shape does the
> current model create?

Choices:

- `Straight from its rightward start` — correct;
- `A draw back to target`;
- `A fade farther right`.

**Evidence**

> Recognized that matched Face and Path produce zero modeled curve.

#### Task 4 — Boundary

**Prompt**

> A centered-strike model predicts a small fade, but a real wood shot struck on
> the toe curves differently. Which explanation is honest?

Choices:

- `Impact location and gear effect are not modeled here` — correct;
- `The Face-to-Path definition stops applying`;
- `Wind changed the launch Spin Axis`.

**Evidence**

> Kept a real-world cause outside the current engine boundary.

#### Task 5 — Live transfer, mandatory

**Mission**

> TWO SHAPES · ONE START
> Keep Launch Direction at +1.0° ±0.1°.
> First create at least 10.0 yd left Curve.
> Then create at least 10.0 yd right Curve.

**Editable**

- Face Angle;
- Club Path.

**Held**

- Dynamic Loft 30°;
- Attack Angle −3°;
- Club Speed 90 mph;
- preset 7-iron.

**Pass**

- both states are produced by learner interaction;
- Launch Direction is within tolerance in both;
- first Curve ≤ −10.0 yd and second Curve ≥ +10.0 yd;
- the two states use opposite Face-to-Path signs;
- no preset answer button writes the state.

The verified 0°/+4° and +2°/−2° pairs pass, but any valid pair passes.

**Near miss feedback**

- Start outside tolerance:
  > The bend is correct, but the start moved. Rebuild Face and Path as a pair.
- Correct start, too little curve:
  > The start is held. Increase the Face-to-Path gap in the required direction.
- Wrong curve side:
  > The start is held, but the gap sign points the other way.

**Voice**

> “Same start. Opposite gaps. Build both shapes yourself.”

### S5 — Result

**Pass eyebrow**

> SHAPE · MASTERED

**Pass title**

> You separated start from bend.

**Evidence card**

> VERIFIED
> Same +1.0° launch
> Left and right curve created
> Model boundary identified

**Transfer**

> A launch monitor's Curve is side movement from Launch Direction—not the same
> thing as where the ball finishes relative to the target.

**Next**

> NEXT IN THIS JOURNEY
> Carry Side
> Combine start and curve to explain the landing side.

**Primary action**

> CONTINUE TO SHOT PATTERN

**Secondary actions**

- `REPLAY LIVE MISSION`
- `RETURN TO ACADEMY`
- `REVIEW SOURCES`

**Retry eyebrow**

> SHAPE · NOT YET

**Retry title**

> One relationship needs another pass.

The evidence card names the failed concept, never a generic score:

- `FACE-TO-PATH SIGN`;
- `ZERO-CURVE GATE`;
- `MODEL BOUNDARY`;
- `LIVE START CONTROL`.

The retry opens at the relevant lab state. It does not replay S0–S3 unless the
learner chooses review.

**Voice**

> “You held the start and changed the shape. Next, combine both to explain the
> landing side.”

## 7. Information sheets

All sheets use a native bottom sheet or detail panel, support Dynamic Type, and
return focus to the invoking control.

### 7.1 Face-to-Path

**Title**

> Face-to-Path

**Body**

> Face-to-Path is Face Angle minus Club Path. It tells you where the face points
> relative to the path—not where either points relative to the target.

**Example**

> Face +2° − Path −2° = +4°

**Why it matters**

> For centered contact, this gap is a major clue to expected curvature.

**Truth label**

> DEFINITION + ≈ REAL WORLD

### 7.2 Spin Axis

**Title**

> Spin Axis

**Body**

> Spin Axis describes the tilt of the ball's spin at launch. In Flightglass,
> Face-to-Path is transformed into a modeled axis. Positive tilts right in this
> display; negative tilts left.

**Boundary**

> The multiplier and clamp are teaching-model choices. A launch monitor's
> measured axis comes from the ball's actual launch spin, not this formula.

**Truth label**

> MODEL

### 7.3 Curve

**Title**

> Curve

**Body**

> Curve is sideways movement from the Launch Direction line to the carry point.
> It is not the same as Offline, which is measured from the target line.

**Model note**

> Flightglass uses Carry and modeled Spin Axis to draw Curve. The equation is a
> stable teaching heuristic, not a complete aerodynamic simulation.

**Truth label**

> MODEL

### 7.4 What matters most

**Title**

> Different jobs, not one percentage

**Body**

> Face and Path create one direct gap. The model maps that gap to Spin Axis.
> Carry then amplifies how many sideways yards appear. These are stages in a
> chain, so adding them as independent “percent contributions” would be wrong.

**For this shot**

- Direct mechanism: Face-to-Path;
- amplifier: Carry;
- held reference: Launch Direction.

### 7.5 Model limits

**Title**

> What this Shape Lab holds still

**Body**

> The lab assumes centered contact and calm air. It does not model impact
> location, gear effect, the full three-dimensional spin vector, dynamic lie or
> wind. Backspin is computed elsewhere but is not an input to this Curve
> equation.

**Closing**

> Use the lab to understand the relationship it contains—not to erase causes it
> does not contain.

### 7.6 Sources

Learner-facing source links:

- TrackMan, “Face-to-Path”:
  `https://www.trackman.com/blog/golf/face-to-path`
- TrackMan Support, “Face to Path”:
  `https://support.trackmangolf.com/hc/en-us/articles/39724525751707-Parameters-Face-to-Path-Tee-to-Green`
- TrackMan Support, “Spin Axis”:
  `https://support.trackmangolf.com/hc/en-us/articles/39726408967323-Parameters-Spin-Axis-Tee-to-Green`
- TrackMan Support, “Curve”:
  `https://support.trackmangolf.com/hc/en-us/articles/39726823283099-Parameters-Curve-Tee-to-Green`
- TrackMan, “Spin Loft” for the full 3D caveat:
  `https://www.trackman.com/blog/golf/spin-loft`

Source copy must say that external sources support the real-world definitions
and boundaries; they do not validate Flightglass's numeric transforms.

## 8. Voice and synchronized UI table

| Trigger | Voice line | Synchronized visual | Replay |
|---|---|---|---|
| First S0 entry | “Keep the same start line. Now make the flight bend left, right, or not at all.” | Three traces share the rail, then separate | Yes |
| First S1 entry | “Match Face and Path first. The flight starts right, but it does not bend.” | Face and Path align; axis puck levels | Yes |
| First separated state | “The start stayed fixed. The gap changed, so the modeled shape changed.” | Gap brace opens; curve trace draws | Yes |
| First reversed state | “Reverse the gap, and the modeled curve reverses while the separate start line remains visible.” | Brace and axis flip; trace crosses rail | Yes |
| S2 entry | “The gap sets the modeled tilt. Carry changes how far that tilt can move the ball sideways.” | Chain highlights, then Carry amplifier | Yes |
| S3 boundary reveal | “Face-to-Path is powerful, but centered contact is an assumption—not a fact measured by this phone.” | HELD and NOT MODELED chips appear | Yes |
| S4 live task | “Hold the same start, create opposite gaps, and build both modeled shapes yourself.” | Start gate pulses once | Yes |
| Pass | “You held the start and changed the shape. Next, combine both to explain the landing side.” | Evidence card resolves | Yes |

Voice requirements:

- calm American female laboratory/control-room character;
- natural, authoritative and warm, never theatrical;
- 12–24 words per line, approximately 3–8 seconds;
- autoplay once only for a new page/signature;
- event lines never repeat because a slider crosses a value again;
- captions appear before or with audio and persist long enough to read;
- Replay is always available and labeled;
- audio is interruptible and never delays controls;
- no autoplay when screen-reader speech is active;
- remembered `VOICE OFF` prevents all future autoplay but preserves Replay.

The voice does not read body copy. It directs attention to the changing
relationship while the screen carries the precise numbers and truth labels.

## 9. State, compatibility and rewards

### 9.1 Canonical progress

Canonical completion key:

> `academy.progress.shape`

Required evidence:

- version;
- completion timestamp;
- best mastery result;
- Task 5 left-state evidence;
- Task 5 right-state evidence;
- boundary item result;
- attempts;
- voice preference at completion;
- content/model version used.

Task evidence records raw engine inputs and raw outputs before display rounding.

### 9.2 Legacy aliases

On first migration only:

- completed `spin-axis` maps to `shape` prior evidence;
- completed `curve` maps to `shape` prior evidence;
- either or both may unlock `shape` for review;
- neither alias alone awards new mastery;
- only passing this experience writes canonical `shape` mastery.

Both old IDs remain resolvable as aliases for deep links and history. There is
one canonical Shape card, one result and one reward.

### 9.3 Reward semantics

The experience awards:

- one Shape mastery state;
- one mastery reward;
- one goal-journey progression event.

It does not award separate Spin Axis and Curve rewards. Replays never duplicate
reward events.

## 10. Accessibility, motion and haptics

- The trace has a textual alternative that lists Launch Direction, curve side
  and Curve yards in causal order.
- Direction is never encoded by color alone; use words, signs and trace style.
- The target line, launch rail and curve trace have distinct dash/weight
  patterns at high contrast.
- The axis puck has `accessibilityValue` such as “six degrees, tilted right.”
- Sliders expose name, signed value, unit, minimum, maximum and adjustable
  actions.
- The linked start-gate mode explains both changed values after each adjustment.
- Prediction choices are reachable before the animated reveal.
- Dynamic Type at accessibility sizes changes the instrument/result to a
  vertical layout without hiding readouts.
- Reduce Motion replaces trace drawing, puck rotation and ghost morphing with
  immediate state changes.
- Optional haptics: light on prediction commit, selection on valid start-gate
  lock, success on mastery pass. Haptics follow system settings.
- No essential information exists only in voice, animation, haptic or color.

## 11. Failure and edge states

### Engine unavailable

> SHAPE MODEL UNAVAILABLE
> Your progress is safe. Try this instrument again when the model is available.

No fabricated trace or score is shown.

### Non-finite output

> THIS STATE COULD NOT BE CALCULATED
> Return to the last valid Face and Path values.

The last valid trace remains as a muted ghost and cannot count for mastery.

### Out-of-domain deep link

Clamp only at the visible control boundary and announce:

> Saved values were outside this lab's range and were moved to the nearest
> available setting.

Do not silently mutate canonical stored evidence.

### Audio unavailable

Captions and Replay transcript remain. The lesson is fully completable.

### Interrupted session

Resume at the last completed surface, not inside an unanswered mastery choice.
If interruption occurs during Task 5, restore the held state but require both
live shapes again.

### Prior legacy completion

Show:

> PRIOR LEARNING FOUND
> Your Spin Axis/Curve history is preserved. Complete this combined Shape check
> to verify the new outcome.

## 12. Verification contract

### 12.1 Pure model-adapter tests

At minimum:

1. +1/+1 produces Face-to-Path 0, Launch +1, Spin Axis 0 and Curve 0;
2. +2/−2 produces Face-to-Path +4, Launch +1, Spin Axis +6 and Curve
   +14.860888670636536 yd at the fixed base state;
3. 0/+4 produces Face-to-Path −4, Launch +1, Spin Axis −6 and Curve
   −14.860888670636536 yd;
4. low/base/high speed preserve Spin Axis +6 while Curve matches the verified
   7.786846257703091, 14.860888670636536 and 22.38488745267537 yd;
5. displayed rounding never changes mastery decisions;
6. negative zero normalizes to zero;
7. the adapter calls protected `solveFlight()` rather than reimplementing
   physics in the view.

### 12.2 Native behavior tests

1. S0–S5 order and back navigation preserve state.
2. Prediction is committed before every reveal.
3. Guided controls require learner input.
4. The curve bracket is relative to Launch Direction, not the target line.
5. Launch remains a muted reference during Shape.
6. Event voice plays once and Replay works.
7. Voice-off and screen-reader suppression work.
8. Reduce Motion produces equivalent static meaning.
9. Dynamic Type does not hide controls or readouts.
10. Focus returns correctly after every information sheet.
11. Task 5 cannot pass with only one shape or with Launch outside tolerance.
12. A replay cannot duplicate rewards.

### 12.3 Content-truth tests

Automated or snapshot checks must fail if visible copy:

- says Path alone determines curve;
- says Face-to-Path fully determines all real curvature;
- calls the 1.5 multiplier or carry-squared equation physics;
- conflates Spin Axis and Backspin;
- defines Curve from the target line;
- hides centered-contact or gear-effect boundaries;
- labels speed states as club simulations;
- prescribes swing technique from a model state;
- ranks Face, Path and Face-to-Path as independent percentage causes.

### 12.4 Acceptance evidence

Required evidence bundle:

- screenshots of S0–S5 at standard and accessibility text sizes;
- matched/right/left fixture captures;
- low/base/high Carry amplifier capture;
- Task 5 pass and each near-miss state;
- Voice on/off, Replay and screen-reader suppression evidence;
- Reduce Motion evidence;
- legacy migration fixture for each old ID and both together;
- unit/native test output;
- proof that `impact-flight.js` did not change.

Acceptance is gate-based. No averaged quality score can compensate for a false
physics claim, broken live transfer, inaccessible instrument or duplicate
reward.

## 13. Implementation boundary

An implementation plan derived from this spec may add native Shape views,
view-model/model adapters, fixtures, accessibility metadata, tests and
curriculum registration. It must:

- consume the protected engine through the approved bridge;
- use engine outputs as the only authority for numeric teaching fixtures;
- preserve legacy IDs through the shared migration;
- route Next through the goal journey;
- share the Academy shell, voice policy and result contract;
- preserve the model/truth labels in visible UI;
- leave `impact-flight.js` and unrelated production behavior unchanged.

This document authorizes planning, not implementation.
