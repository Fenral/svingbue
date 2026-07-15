# Flightglass Academy — Contact Height Experience Design

**Status:** Normative design specification, 2026-07-15. Ready for an
implementation plan after the shared Academy curriculum/store migration spec
exists.

**Experience ID:** `strike-depth`

**Learner-visible title:** **Contact Height**

**Internal curriculum label:** Strike Depth

**Owned legacy concept:** `strike-depth`

**Primary outcome:** modeled clubhead-path height at the ball

**Goal family:** Strike & contact

**Prerequisite:** Low Point

**Normative inputs:**

- `docs/superpowers/specs/2026-07-15-academy-outcome-curriculum-blueprint.md`
- `docs/superpowers/specs/2026-07-15-academy-attack-at-impact-design.md`
- `docs/superpowers/specs/2026-07-15-academy-low-point-design.md`
- `swing-parameters-and-impact.js`
- `geo3d-mock/groundcontact.js` for the existing ground-plane solve
- `docs/strike-window-consensus.md`
- the `strike-depth` legacy content record in `academy.html`

## 1. Naming decision

“Strike Depth” names the vertical model input, `lowPoint.z`. Outcome-led
Academy navigation should name what the learner is trying to explain:
**Contact Height**.

The precise outcome in this engine is:

> the height of the modeled clubhead path point at the ball's target-line
> position.

It is not a launch-monitor Impact Height measurement, because Flightglass does
not model a clubface, impact location on that face or a real collision. It is
not literal divot depth, because the engine uses a point path over a flat ground
plane without club sole, turf deformation or bounce.

The internal ID and legacy alias remain `strike-depth`.

## 2. Learner promise

Teach the learner that vertical arc placement and Attack Angle are different
jobs: one can move modeled contact up or down while the tangent direction stays
unchanged.

The experience succeeds only when the learner can:

1. distinguish Low Point Distance x from vertical arc height z;
2. distinguish modeled Contact Height from Attack Angle;
3. show that +1 mm vertical arc movement produces +1 mm Contact Height at held
   Low Point/plane;
4. explain why Low Point Distance changes the “lift budget” between the bottom
   and the ball;
5. preserve Attack Angle while moving Contact Height through two requested
   windows;
6. read the modeled ground-entry order without treating it as a real divot;
7. recognize two different x/z combinations that produce nearly the same
   Contact Height; and
8. identify the point-club, flat-ground and classification boundaries.

## 3. Non-goals

- Do not call `lowPoint.z` real divot depth.
- Do not call `clubZ` measured face Impact Height.
- Do not prescribe how high/low on a real clubface to strike.
- Do not infer ball speed, spin or launch from the point-path height.
- Do not teach `Pure`, `Thin`, `Fat`, `Duff` or `Whiff` bands as physical
  ground truth.
- Do not use the engine's 0–100 `pct` as mastery or quality evidence.
- Do not claim no ground crossing means a shallow or ascending Attack.
- Do not claim a deeper vertical arc makes Attack steeper.
- Do not change either protected geometry file.

## 4. Legacy-content verdict

The legacy content contains an excellent invariance lesson but uses “depth,”
“divot,” “contact” and quality bands too interchangeably.

### Retain, rewritten

- `lowPoint.z` translates the arc vertically.
- `deriveImpact()` does not read z, so Attack is invariant to z in this engine.
- `clubBallContact().clubZ` changes one millimeter per millimeter of z.
- Low Point Distance x changes how far the arc rises from its bottom before it
  reaches the ball.
- A below-ground modeled bottom can have ground entry before or after the ball,
  depending on x and z together.
- Different x/z combinations can produce similar Contact Height.

### Reject from learner-facing copy

- “Divot testifies only about depth, never direction.” Ground-entry location
  depends on both x and z in the model; real turf adds more variables.
- “No divot tells nothing about Attack” stated as an observed real-player fact.
  The model can prove only its own invariance.
- Real-tour divot depths derived from the point-club model.
- “The strike band flips exactly when a physical boundary is crossed.” Several
  band thresholds are app classification choices.
- Any “fix is down/up” instruction.
- Any claim the model locates impact on a real face.

## 5. Model and truth contract

The current engine computes:

```text
theta =
  asin(−effectiveLpx / radius)

ContactHeight =
  lowPoint.z
  + radius × (1 − cos(theta)) × sin(planeAngle)

AttackAngle =
  deriveImpact(theta, planeAngle)
```

The second term in Contact Height is called the **arc lift to the ball**.

| Claim | Label | Meaning |
|---|---|---|
| z translates Contact Height 1:1 | MODEL GEOMETRY | Exact current equation |
| x changes arc lift to the ball | MODEL GEOMETRY | Exact current equation |
| Attack is invariant to z | MODEL INVARIANT | Exact current implementation |
| path crosses flat z=0 plane when Low Point z < 0 | MODEL GEOMETRY | Ground-plane intersection, not turf simulation |
| real face Impact Height affects spin/speed | ≈ REAL WORLD, NOT THIS OUTPUT | Distinct external measurement |
| rigid radius/plane, point clubhead, flat hard ground | HELD | Instrument assumptions |
| sole radius, shaft deflection, turf, ball compression/collision | NOT MODELED | No real strike-quality inference |

### 5.1 Visible quantities

Use three separate labels:

- `LOW POINT DISTANCE +10.5 CM AHEAD` — x;
- `ARC HEIGHT AT BOTTOM −2.0 MM` — z input;
- `MODELED CONTACT HEIGHT +1.8 MM ABOVE GROUND` — `clubZ` output.

Do not label z simply “Depth” without the above/below-ground reference.

Contact Height relative to the ball center may be shown as a secondary ruler:

> 19.5 mm below modeled ball center

That is computed from `offset = clubZ − BALL_RADIUS_M` and carries `MODEL`.
It must not be named face Impact Height.

### 5.2 Verified z sweep

Held state:

- effective Low Point +10.5 cm;
- plane 55°;
- Swing Direction 0°;
- radius 1.20 m;
- Attack −4.110245535124602°;
- arc lift to ball +3.7702099868106393 mm.

| Arc height at bottom z | Contact Height `clubZ` | Ground entry x | Engine band, secondary only |
|---:|---:|---:|---|
| −10 mm | −6.230 mm | before ball | Fat |
| −6 mm | −2.230 mm | −2.74 cm | Fat |
| −4 mm | −0.230 mm | −0.31 cm | Fat |
| −2 mm | +1.770 mm | +2.85 cm | Pure |
| 0 mm | +3.770 mm | none | Pure |
| +2 mm | +5.770 mm | none | Pure |
| +10 mm | +13.770 mm | none | Pure |
| +20 mm | +23.770 mm | none | Thin |
| +30 mm | +33.770 mm | none | Whiff |

“Before/after” ground-entry values come from the current flat-ground crossing
solve. For −10 mm, the exact entry remains engine-generated in implementation;
the spec does not freeze an unverified rounded number.

Engine bands are visible only behind “Current model classification.” The main
lesson uses descriptive locations:

- `PATH BELOW GROUND AT BALL`;
- `PATH ABOVE GROUND, BELOW BALL CENTER`;
- `PATH ABOVE BALL CENTER`.

### 5.3 Lift-budget comparison

Hold z at −2.0 mm and plane at 55°:

| Effective Low Point x | Arc lift to ball | Contact Height | Ground entry |
|---:|---:|---:|---:|
| +2.0 cm | +0.137 mm | −1.863 mm | 5.65 cm before |
| +6.0 cm | +1.229 mm | −0.771 mm | 1.65 cm before |
| +10.5 cm | +3.770 mm | +1.770 mm | 2.85 cm after |
| +15.0 cm | +7.710 mm | +5.710 mm | 7.35 cm after |

Required interpretation:

> z moves the whole arc. x changes how much the arc rises between its bottom
> and the ball. Contact Height depends on both.

Attack also changes across x. Do not rank Attack as a separate cause of Contact
Height because it is a derived description of the same x/plane geometry.

### 5.4 Compensation pair

Two model states:

| State | Low Point x | z | Contact Height | Attack |
|---|---:|---:|---:|---:|
| A | +10.5 cm | −4.0 mm | −0.230 mm | −4.110° |
| B | +13.0 cm | −6.0 mm | −0.215 mm | −5.091° |

They pass within 0.02 mm of the same modeled Contact Height while Attack differs
by almost 1°. Copy:

> Similar modeled height does not mean identical delivery. More forward x
> created more arc lift, which offset the deeper z.

### 5.5 Causal hierarchy

| Role | Item | Treatment |
|---|---|---|
| Direct 1:1 input | vertical arc height z | Main live control |
| Material geometry modifier | effective Low Point x through arc lift | Controlled proof |
| Material geometry modifier | plane angle | Held in core; named in sheet |
| Derived companion | Attack Angle | Invariant to z; not independent cause |
| Modeled ground sequence | flat z=0 crossing | Visible with MODEL label |
| Secondary classifier | `strikeQuality()` bands | Optional sheet, never mastery |
| Held | radius, plane, Swing Direction, ball radius, flat ground | Visible |
| Not modeled | face/sole geometry, turf, collision, speed/spin effect, noise | Boundary |

## 6. Instrument design

The instrument is a close side-on Contact Window, not a swing-quality meter.

Required:

1. flat ground reference;
2. modeled ball circle resting on ground;
3. clubhead-path arc as a thin line;
4. Low Point marker and x bracket;
5. vertical z ruler at the bottom;
6. path-point marker at the ball x-position;
7. Contact Height ruler from ground to that point;
8. ball-center reference;
9. ground-entry and exit markers only when a real model crossing exists;
10. persistent Attack chip showing invariance.

Primary readout:

> CONTACT HEIGHT +1.8 MM · ABOVE GROUND

Secondary:

> ATTACK −4.1° · UNCHANGED

Held state:

> LOW POINT +10.5 CM AHEAD · PLANE 55°

### 6.1 Visual truth

The path point is drawn as a point, not a clubface silhouette. If a clubhead
glyph is used for orientation, a persistent label says:

> POINT-PATH MODEL · FACE AND SOLE NOT SIMULATED

Ground crossing uses a neutral dashed strip. It is never drawn as torn turf,
soil particles or a realistic divot.

### 6.2 Controls

S1:

- Arc Height at Bottom, −10 to +30 mm, step 1 mm.

S2 lift-budget stage:

- Low Point Distance preset +2, +6, +10.5, +15 cm;
- z locked −2 mm.

S4 live:

- z only;
- x +10.5 cm, plane 55°, direction 0°, radius 1.20 m held.

All values are native-adjustable and have direct-drag alternatives where the
mapping is spatially honest.

### 6.3 Cause sentence

> The modeled bottom is 2.0 mm below ground. The arc rises 3.8 mm before the
> ball, so the path point is 1.8 mm above ground at the ball.

Then:

> Attack remains −4.1° because vertical translation does not rotate the tangent.

For a below-ground point:

> The modeled path is 0.2 mm below the flat ground plane at the ball. A real
> club and turf response are not simulated.

## 7. Surface-by-surface specification

### S0 — Mission

**Eyebrow**

> STRIKE & CONTACT · 3 OF 3

**Title**

> Move contact. Keep the direction.

**Body**

> Raise or lower the modeled arc. Watch the path point move at the ball while
> Attack Angle stays exactly the same.

**Mission**

> HOLD ATTACK −4.1°
> Build one low path and one above-center path

**Truth strip**

> MODEL GEOMETRY · POINT PATH, NOT FACE IMPACT

**Primary action**

> ENTER CONTACT HEIGHT LAB

**Voice**

> “Move the arc vertically. Contact height changes millimeter for millimeter;
> the modeled tangent does not rotate.”

### S1 — Contact Height Lab

**Title**

> Translate the arc.

Initial state:

- x +10.5 cm;
- z −2 mm;
- Contact Height +1.770 mm;
- Attack −4.110°.

#### Step A — Read the budget

Prediction:

> The bottom is 2.0 mm below ground. The arc rises 3.8 mm before the ball. Where
> is the path point?

Choices:

- `About 1.8 mm above ground` — correct;
- `About 5.8 mm below ground`;
- `Exactly at the ball center`.

Reveal the signed ledger:

```text
ARC HEIGHT AT BOTTOM   −2.0 mm
ARC LIFT TO BALL       +3.8 mm
────────────────────────────
CONTACT HEIGHT         +1.8 mm
```

#### Step B — One-to-one translation

Prompt:

> Raise the bottom by 5 mm.

Required state:

- z +3 mm;
- Contact Height +6.770 mm;
- Attack unchanged.

Reveal:

> +5 mm at the bottom produced +5 mm at the ball. This is an exact additive
> model relationship.

#### Step C — Cross the ball center

Prompt:

> Raise Contact Height above the modeled ball center at 21.3 mm.

Gate:

- `clubZ > BALL_RADIUS_M`.

Reveal:

> The path point moved above center. Attack is still −4.1°.

#### Step D — Return low

Prompt:

> Return Contact Height to 1–5 mm above ground.

**Completion**

- ledger prediction;
- exact +5 mm change;
- above-center gate;
- low window;
- unchanged Attack acknowledged.

**Voice sequence**

1. “Bottom height plus arc lift gives the modeled height at the ball.”
2. “You crossed the ball center without changing Attack Angle.”

Only line 1 autoplays.

### S2 — Influence, compensation and ground order

**Title**

> Two coordinates build one height.

#### Stage 1 — z is direct

Role:

> DIRECT · 1 MM → 1 MM

At fixed x/plane, compare z −6, −2, +2 mm:

- Contact −2.230 mm;
- Contact +1.770 mm;
- Contact +5.770 mm.

Attack remains −4.110°.

#### Stage 2 — x supplies arc lift

Use the four-state lift-budget table with z −2 mm.

**Prompt**

> Why can the same z be below ground at +2 cm but above ground at +10.5 cm?

Correct:

> The farther-ahead impact point sits higher above the rigid circle's bottom,
> creating more modeled arc lift.

#### Stage 3 — ground entry moves

Show:

- x +2 cm, z −2 mm: entry 5.65 cm before ball;
- x +10.5 cm, z −2 mm: entry 2.85 cm after ball.

Copy:

> Both bottoms are 2 mm below the ground plane. x changes where the path reaches
> that plane relative to the ball.

Truth:

> MODEL FLAT-GROUND CROSSING · NOT TURF RESPONSE

#### Stage 4 — compensation pair

Predict whether A and B have the same Attack. Reveal:

> Nearly the same Contact Height, different Attack. x and z compensated for
> height, not for the whole delivery.

#### Stage 5 — plane note

> Plane changes both the tangent and arc-lift term. It is held here to keep the
> direct z relationship visible.

**Voice**

> “Vertical height moves contact directly. Low Point distance changes the lift
> available before the ball. Neither should be counted twice through Attack.”

### S3 — Myths and model boundary

**Title**

> A point model is not a divot.

#### Experiment 1 — “Deeper means steeper”

Toggle z −10 to +30 mm at fixed x/plane.

Correct:

> False. Contact Height moves 40 mm; Attack remains −4.110°.

#### Experiment 2 — “No ground crossing means ascending”

State:

- x +10.5 cm;
- z 0 mm;
- no below-ground crossing;
- Attack −4.110° descending.

Correct:

> False in this model. Vertical placement and tangent direction are separate.

#### Experiment 3 — “The band is measured truth”

Reveal current `strikeQuality()` labels and thresholds behind a dim layer.

Copy:

> These are app classifications built on a point path and chosen thresholds.
> They are useful interface states, not launch-monitor measurements or a
> physical contact model.

The 0–100 percentage is not displayed.

#### Experiment 4 — “Contact Height is face Impact Height”

Correct:

> False. Real Impact Height is where the ball strikes a clubface. Flightglass
> has no face/sole collision here; it shows path-point height at the ball's
> target-line position.

#### Experiment 5 — “Same height means same strike”

Use compensation pair.

Correct:

> False. Similar modeled height can come from different x/z combinations and
> different Attack Angles.

**Voice**

> “This model separates coordinates cleanly. It does not simulate a clubface,
> turf deformation, or a real divot.”

### S4 — Mastery Check

**Title**

> Prove you can move height without rotating direction.

Five tasks; pass requires four correct and Task 5.

#### Task 1 — Direct relationship

> At fixed x and plane, z rises 7 mm. What happens?

- `Contact Height rises 7 mm; Attack is unchanged` — correct;
- `Attack steepens 7°`;
- `Contact Height stays fixed`.

#### Task 2 — Lift budget

> z is fixed below ground. Why can moving Low Point farther ahead raise the path
> point at the ball?

- `The rigid arc has risen farther from its bottom before reaching the ball` —
  correct;
- `Attack is an independent height force`;
- `Club Speed lifts the path`.

#### Task 3 — Compensation

> Two states have nearly equal Contact Height. What may still differ?

- `Low Point Distance and Attack Angle` — correct;
- `Nothing in the geometry`;
- `Only color`.

#### Task 4 — Boundary

> What does Flightglass Contact Height measure?

- `A point on the modeled path at the ball position` — correct;
- `Real impact location on the clubface`;
- `Physical divot depth after turf deformation`.

#### Task 5 — Live invariance, mandatory

**Mission**

> ONE ATTACK · TWO HEIGHTS
> A. Contact Height 1.0–5.0 mm above ground
> B. Contact Height 22.0–26.0 mm above ground
> Keep Attack at −4.110° in both.

**Editable**

- Arc Height at Bottom z only.

**Held**

- effective Low Point +10.5 cm;
- plane 55°;
- Swing Direction 0°;
- radius 1.20 m.

**Pass**

- both raw `clubZ` windows captured;
- raw Attack exactly equals the initial geometry output within 1e−12;
- learner identifies B as above modeled ball center;
- learner identifies that A may still have a below-ground Low Point;
- no quality band or rounded display decides the gate.

Verified solutions include approximately:

- A: z −2 mm → +1.770 mm;
- B: z +20 mm → +23.770 mm.

**Near misses**

- height correct, x changed:
  > Low Point Distance moved. Reset the held geometry and change only vertical
  > arc height.
- A below ground:
  > Raise the modeled bottom until the point at the ball is above 1.0 mm.
- B below center:
  > The path point is still below 21.3 mm. Raise the arc.
- Attack mismatch:
  > A held input changed. Restore the fixed Low Point and plane.

**Voice**

> “Change only vertical arc height. Capture one low point-path state and one
> above-center state with the same Attack.”

### S5 — Result

**Pass eyebrow**

> CONTACT HEIGHT · MASTERED

**Pass title**

> You separated contact height from Attack.

**Evidence**

> VERIFIED
> 1:1 vertical translation
> Low Point lift budget explained
> Two heights, one Attack built live

**Journey**

> STRIKE & CONTACT · COMPLETE

**Optional**

> EXPLORE THE MODEL
> Plane Coupling
> See how the current engine links plane, Swing Direction and effective Low
> Point.

**Primary action**

> CHOOSE YOUR NEXT GOAL

**Secondary**

- `EXPLORE PLANE COUPLING`;
- `REPLAY LIVE HEIGHTS`;
- `RETURN TO ACADEMY`.

**Retry labels**

- `1:1 TRANSLATION`;
- `LIFT BUDGET`;
- `COMPENSATION`;
- `POINT-MODEL BOUNDARY`;
- `LIVE INVARIANCE`.

**Voice**

> “You moved modeled contact without rotating the tangent. The core
> strike-and-contact journey is complete.”

## 8. Information sheets

### 8.1 Contact Height

> Flightglass Contact Height is the vertical position of its modeled clubhead
> path point when it reaches the ball's target-line position.

Truth:

> MODEL GEOMETRY

### 8.2 Arc Height at Bottom

> `lowPoint.z` moves the entire arc up or down relative to the flat ground
> plane. Negative is below ground; positive is above.

### 8.3 Arc lift to the ball

> When the Low Point lies ahead, the ball occurs before the bottom and the
> circular path at the ball sits above that bottom. The distance x and plane
> determine this modeled lift.

### 8.4 Contact Height versus Attack

> Contact Height is a position in millimeters. Attack is tangent direction in
> degrees. Vertical translation changes the first and leaves the second
> invariant in the current engine.

### 8.5 Ground crossing

> A negative z lets the point path intersect the flat ground plane. The model
> can order entry, ball and exit, but it cannot simulate a sole cutting,
> bouncing or deforming turf.

### 8.6 Current quality bands

> The geometry engine also returns Pure, Thin, Fat, Duff and Whiff interface
> bands from chosen x/height thresholds. Academy does not use those bands as
> physical truth or mastery evidence.

### 8.7 Not face Impact Height

> Launch monitors may report where a ball struck above or below the center of a
> real clubface. Flightglass Contact Height is not that measurement.

### 8.8 Model limits

> Fixed radius and plane; point clubhead; rigid flat ground; fixed ball radius.
> No face, sole, shaft, collision, turf, friction, speed/spin response or
> measurement uncertainty.

### 8.9 Sources

- TrackMan Support, “Impact Height”:
  `https://support.trackmangolf.com/hc/en-us/articles/39724519074843-Parameters-Impact-Height-Tee-to-Green`
- TrackMan Support, “Low Point Distance”:
  `https://support.trackmangolf.com/hc/en-us/articles/39724600685339-Parameters-Low-Point-Distance-Tee-to-Green`
- TrackMan Support, “Low Point Height”:
  `https://support.trackmangolf.com/hc/en-us/articles/39724595146011-Parameters-Low-Point-Height-Tee-to-Green`
- TrackMan Support, “Attack Angle”:
  `https://support.trackmangolf.com/hc/en-us/articles/39724226342555-Parameters-Attack-Angle-Tee-to-Green`

These sources clarify the real measurement distinctions. All numeric height,
ground-crossing and invariance fixtures are current Flightglass model outputs.

## 9. Voice and synchronized UI

| Trigger | Voice | Visual |
|---|---|---|
| S0 | “Move the arc vertically. Contact height changes millimeter for millimeter; the modeled tangent does not rotate.” | z and Contact Height rulers move; Attack chip locks |
| S1 | “Bottom height plus arc lift gives the modeled height at the ball.” | signed ledger resolves |
| Above-center | “You crossed the ball center without changing Attack Angle.” | point crosses center line |
| S2 | “Vertical height moves contact directly. Low Point distance changes the lift available before the ball. Neither should be counted twice through Attack.” | z and x causal roles separate |
| S3 | “This model separates coordinates cleanly. It does not simulate a clubface, turf deformation, or a real divot.” | NOT MODELED chips appear |
| S4 | “Change only vertical arc height. Capture one low point-path state and one above-center state with the same Attack.” | two height gates appear |
| Pass | “You moved modeled contact without rotating the tangent. The core strike-and-contact journey is complete.” | evidence resolves |

Shared voice/caption policy applies.

## 10. State, compatibility and rewards

Canonical key:

> `academy.progress.strike-depth`

Display title:

> `Contact Height`

Evidence:

- content/geometry version;
- mastery answers;
- raw x/z/plane/direction/radius for both captures;
- raw `clubZ` and Attack;
- boundary item;
- attempts/time/voice preference.

Legacy:

- legacy `strike-depth` becomes prior evidence;
- deep links route to Contact Height;
- prior completion may open placement;
- new mastery is not silently granted;
- one canonical reward.

Prerequisite:

- Low Point mastery or placement.

Completion:

- completes Strike & contact core journey;
- unlocks optional Plane Coupling lab;
- does not force the optional lab.

## 11. Accessibility, motion and haptics

- z, Contact Height, ball-center relation and Attack have complete text
  alternatives.
- Rulers use signed units and above/below words.
- Ground entry announces distance before/after ball.
- Point position uses label and pattern, not color alone.
- Direct drag has adjustable/stepper alternative.
- Dynamic Type stacks the signed ledger and preserves millimeter precision.
- Reduce Motion uses immediate before/current states.
- Current quality bands, if expanded, remain supplementary and accessible.
- No essential truth exists only in visual crossing or voice.
- Haptic: selection at ground and ball-center crossings, light on capture,
  success on pass.
- Focus returns from all sheets.

## 12. Failure and edge states

### Geometry unavailable

> CONTACT HEIGHT MODEL UNAVAILABLE
> Your progress is safe. Live mastery requires the protected geometry engine.

### Ground solve unavailable

Contact Height can remain visible. Ground entry shows:

> GROUND SEQUENCE UNAVAILABLE

It cannot earn the related prediction evidence.

### Non-finite height

> THIS HEIGHT COULD NOT BE CALCULATED

No band, trace or credit is fabricated.

### Point outside modeled window

Keep numeric readout and announce:

> PATH POINT OUTSIDE VIEW

Auto-fit once if accessible; do not silently clamp physics state.

### Prior completion

> PRIOR LEARNING FOUND
> Your Strike Depth history is preserved. Complete Contact Height to verify the
> outcome-led model.

## 13. Verification contract

### 13.1 Geometry tests

1. held arc lift equals 0.0037702099868106393 m;
2. z −0.01, −0.006, −0.004, −0.002, 0, +0.002, +0.01, +0.02 and +0.03 m
   produce the frozen `clubZ` fixtures;
3. every +1 mm z produces exactly +1 mm `clubZ`;
4. all z states preserve Attack −4.110245535124602°;
5. x +0.02/+0.06/+0.105/+0.15 m at z −0.002 match Contact Height and ground
   entry fixtures;
6. compensation pair differs by ≤0.02 mm Contact Height and preserves its
   distinct Attack values;
7. no view formula replaces `clubBallContact()` or `deriveImpact()`;
8. raw values drive gates.

### 13.2 Native behavior tests

1. S0–S5/resume/back.
2. z and Contact Height move 1:1.
3. Attack chip remains unchanged under z-only interaction.
4. ground entry reference/order is correct.
5. ball center is 21.3 mm above ground in the model.
6. quality bands remain secondary and percentage hidden.
7. Task 5 requires both raw height windows.
8. direct x/plane controls are locked in Task 5.
9. voice/Replay/Voice Off/screen-reader behavior.
10. Dynamic Type/Reduce Motion parity.
11. idempotent reward and optional-lab routing.

### 13.3 Content-truth tests

Fail if copy:

- uses Strike Depth as the primary title;
- calls z literal divot depth;
- calls Contact Height measured face Impact Height;
- says deeper z makes Attack steeper;
- says no ground crossing proves ascending Attack;
- treats quality bands/percentage as physical truth or mastery;
- hides x as a Contact Height modifier;
- double-counts x and Attack as independent causes;
- claims a point path simulates sole/turf collision;
- prescribes a swing fix.

### 13.4 Acceptance evidence

- all S0–S5 surfaces;
- full z sweep and 1:1 ledger;
- lift-budget/ground-entry comparison;
- compensation pair;
- every myth boundary;
- Task 5 pass/near misses;
- voice/caption/a11y/Reduce Motion/Dynamic Type;
- legacy migration;
- geometry/native tests;
- protected files unchanged.

Acceptance is gate-based. No polished turf visual can compensate for confusing
point height with face impact, using quality bands as truth or breaking the z
invariance.

## 14. Implementation boundary

An implementation plan may add native Contact Height views, model adapters,
ground-crossing adapter, fixtures, migration, accessibility and tests. It must:

- preserve `strike-depth` as canonical ID and Contact Height as visible title;
- consume protected geometry functions;
- keep point-model/real-impact distinction visible;
- exclude quality percentage from Academy;
- route optional Plane Coupling without making it a core gate;
- preserve one completion/reward;
- leave production geometry and physics unchanged.

This document authorizes planning, not implementation.
