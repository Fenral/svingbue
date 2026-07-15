# Flightglass Academy — Low Point Experience Design

**Status:** Normative design specification, 2026-07-15. Ready for an
implementation plan after the shared Academy curriculum/store migration spec
exists.

**Experience ID:** `low-point`

**Learner-visible title:** **Low Point**

**Owned legacy concept:** `low-point`

**Primary outcome:** modeled Low Point Distance

**Goal family:** Strike & contact

**Prerequisite:** Up or Down at Impact

**Normative inputs:**

- `docs/superpowers/specs/2026-07-15-academy-outcome-curriculum-blueprint.md`
- `docs/superpowers/specs/2026-07-15-academy-attack-at-impact-design.md`
- `swing-parameters-and-impact.js`
- `docs/strike-window-consensus.md`
- `docs/geometry-rethink.md`
- the `low-point` legacy content record in `academy.html`

## 1. Learner promise

Teach the learner to locate the bottom of the modeled clubhead arc relative to
the ball and use that place to explain the sign and approximate magnitude of
modeled Attack Angle.

The experience succeeds only when the learner can:

1. distinguish a place in centimeters from a direction in degrees;
2. identify ahead, at and behind relative to the target line;
3. order ball and Low Point events along the modeled arc;
4. predict descending/level/ascending Attack from the relative order;
5. recognize Low Point Distance as the dominant direct geometry input to Attack
   at a fixed plane;
6. recognize plane as a material modifier of centimeters-to-degrees;
7. recognize vertical depth as invariant to Attack in the current engine; and
8. avoid inferring strike quality, divot depth or a coaching fix from Low Point
   Distance alone.

## 2. Non-goals

- Do not teach Low Point as a universal technique prescription.
- Do not claim a hand-width, centimeter value or “one degree per inch” is ideal
  for every player, club, lie or shot.
- Do not label a Low Point ahead of the ball automatically “pure.”
- Do not infer ground contact without vertical depth.
- Do not treat the current rigid-circle mapping as launch-monitor measurement.
- Do not hide the model's plane and swing-direction couplings.
- Do not teach vertical contact bands in full. Strike Depth owns them.
- Do not teach Plane Coupling as a core requirement. Its implementation-specific
  relation remains an optional advanced lab.
- Do not change `swing-parameters-and-impact.js`.

## 3. Legacy-content verdict

The legacy lesson has a strong central idea—Low Point is a place, Attack Angle
is a direction—but makes its numeric mapping and contact conclusions too
universal.

### Retain, rewritten

- Low Point is the bottom of the modeled clubhead arc.
- “Ahead” and “behind” are relative to the ball/impact along the target frame.
- Ahead corresponds to descending impact in the held core geometry.
- Behind corresponds to ascending impact.
- At the ball corresponds to level impact.
- Vertical depth does not change derived Attack in the current engine.

### Reject from learner-facing copy

- “The single number that decides whether you strike down, level or up.”
  Plane modifies the mapping; swing direction modifies effective Low Point in
  this engine.
- “One degree per inch” as a general physical law.
- Any fixed tour/ideal centimeter target without measurement context.
- “Further ahead gets purer until a threshold” based on arbitrary model bands.
- Ball-position or hand-action prescriptions.
- Claims that a divot or contact band follows from x-position alone.

### Preserve as model-specific nuance

- `effectiveLpx()`, not raw `lowPoint.x`, is the geometry engine's authority
  whenever swing direction is nonzero.
- Derived Club Path also changes as impact moves around the inclined model arc.
  That is disclosed, not made the core objective.

## 4. Definition and coordinate contract

Learner definition:

> Low Point is the lowest point of the modeled clubhead arc. Low Point Distance
> tells how far that point lies ahead of or behind the ball in the target
> direction.

Core sign/language:

- positive: ahead of the ball, toward the target;
- zero: at the ball;
- negative: behind the ball.

Visible values always include word and distance:

- `+10.5 CM · AHEAD`;
- `0.0 CM · AT BALL`;
- `−6.0 CM · BEHIND`.

The sign convention is an app convention and must not be assumed to match every
external launch-monitor display.

### 4.1 Real parameter versus current model

| Claim | Label | Meaning |
|---|---|---|
| Low Point describes where the clubhead arc bottoms out relative to impact | ≈ REAL WORLD | Industry-aligned concept |
| Negative Attack means bottom after impact; positive means bottom before | ≈ REAL WORLD | Qualitative relationship |
| `theta = asin(−effectiveLpx / radius)` | MODEL GEOMETRY | Current rigid-circle mapping |
| `deriveImpact()` angle transform | MODEL GEOMETRY | Exact engine output |
| radius 1.20 m, fixed plane and rigid arc | HELD | Core teaching state |
| full 3D Low Point Side | HELD / NOT SHOWN | Current lesson uses side-on target-axis distance |
| club/sole, deformable turf, body motion and measurement uncertainty | NOT MODELED | No real contact diagnosis |

### 4.2 Raw versus effective Low Point

The engine computes:

```text
effectiveLpx =
  lowPoint.x
  − swingDirection × radius × cos(planeAngle) × π / 180
```

In the core experience:

- Swing Direction = 0°;
- therefore `effectiveLpx = lowPoint.x`;
- the visible ruler is honest and direct.

If the optional advanced lab is entered, the readout must distinguish:

- `SET LOW POINT` — raw state;
- `EFFECTIVE LOW POINT` — engine value used by Attack/contact.

The core experience must never quietly enable nonzero Swing Direction.

### 4.3 Verified fixtures

Held state:

- radius 1.20 m;
- plane 55°;
- swing direction 0°;
- Low Point depth 0;
- side-on target frame.

| Low Point | Event order | Attack | Derived Club Path |
|---:|---|---:|---:|
| −6.0 cm behind | Low Point → ball | +2.347° | −1.645° |
| −2.0 cm behind | Low Point → ball | +0.782° | −0.548° |
| 0.0 cm | same location | 0.000° | 0.000° |
| +2.0 cm ahead | ball → Low Point | −0.782° | +0.548° |
| +6.0 cm ahead | ball → Low Point | −2.347° | +1.645° |
| +10.5 cm ahead | ball → Low Point | −4.110° | +2.884° |
| +15.0 cm ahead | ball → Low Point | −5.877° | +4.133° |

The main lesson rounds the angle to 0.1° and keeps Club Path collapsed under
“Other modeled coupling.”

### 4.4 Plane modifier proof

With effective Low Point +10.5 cm:

| Plane | Attack |
|---:|---:|
| 45° | −3.547° |
| 55° | −4.110° |
| 70° | −4.716° |

Required interpretation:

> Low Point position sets the main before/after relationship. Plane changes how
> much of the tangent points vertically, so the same centimeters do not always
> produce the same Attack Angle.

Do not convert these three states into driver/iron/wedge labels.

### 4.5 Depth invariance

At Low Point +10.5 cm and plane 55°:

| Vertical depth | Attack |
|---:|---:|
| −30 mm | −4.110245535124602° |
| 0 mm | −4.110245535124602° |
| +30 mm | −4.110245535124602° |

This is an exact current-engine invariant because `deriveImpact()` does not read
`lowPoint.z`. It is not a claim that moving a real golfer vertically leaves all
delivery conditions unchanged.

### 4.6 Causal hierarchy

| Role | Item | Treatment |
|---|---|---|
| Dominant direct geometry input | effective Low Point Distance | Main control |
| Material modifier | plane angle | Controlled comparison |
| Coupling into effective value | swing direction × plane | Held in core; optional lab |
| Invariant to Attack | Low Point depth | Proof/bridge to Strike Depth |
| Secondary modeled output | Club Path | Disclosed in sheet |
| Held | radius, swing direction, target frame | Visible |
| Not modeled | changing radius/plane, body motion, sole/turf, measurement error | Boundary |

## 5. Instrument design

The instrument is a side-on Strike Window with an explicit event ruler.

Required elements:

1. ball at target-line origin;
2. restrained rigid arc;
3. Low Point marker on/below the arc;
4. ball-to-Low-Point dimension bracket;
5. direction arrow toward target;
6. impact tangent and Attack readout;
7. ordered event chips;
8. held-state drawer.

Event chips:

- ahead state: `1 BALL · 2 LOW POINT`;
- behind state: `1 LOW POINT · 2 BALL`;
- zero state: `BALL = LOW POINT`.

The event sequence is spatial, not a full-time swing animation.

### 5.1 Visual hierarchy

Strongest:

- Low Point marker and centimeter bracket.

Secondary:

- ball;
- Attack tangent/readout.

Muted:

- rest of arc;
- derived Club Path;
- vertical depth line.

Do not show strike-quality bands on the main instrument. They would turn a
place lesson into an unsupported good/bad judgment.

### 5.2 Controls

Primary:

- Low Point Distance −15.0 to +20.0 cm;
- step 0.5 cm;
- direct drag and native adjustable alternative.

S2 modifier comparison:

- Plane 45°, 55°, 70° segmented control.

Held:

- radius 1.20 m;
- Swing Direction 0°;
- Low Point depth 0 mm.

The learner can open a “Why is Swing Direction held?” sheet but cannot change
it in the core lesson.

### 5.3 Cause sentence

Ahead:

> The ball comes 10.5 cm before the modeled bottom. The tangent is still moving
> down: Attack −4.1°.

Behind:

> The modeled bottom comes 6.0 cm before the ball. The tangent is already moving
> up: Attack +2.3°.

At:

> Ball and modeled bottom align. The tangent is level: Attack 0.0°.

Boundary:

> Fixed plane and rigid radius: MODEL GEOMETRY.

## 6. Surface-by-surface specification

### S0 — Mission

**Eyebrow**

> STRIKE & CONTACT · 2 OF 3

**Title**

> Where is the bottom?

**Body**

> Low Point is a place, not an angle. Locate the modeled bottom relative to the
> ball, then use the order to explain up or down at impact.

**Mission card**

> BUILD TWO SEQUENCES
> Ball → Low Point
> Low Point → Ball

**Primary action**

> ENTER LOW POINT LAB

**Secondary**

> REVIEW ATTACK ANGLE

**Voice**

> “Attack is a direction. Low Point is a place. Watch which one comes first:
> ball or bottom.”

Preview swaps two static event orders once.

### S1 — Low Point Lab

**Title**

> Move the bottom, read the order.

#### Step A — Ahead

Initial Low Point +10.5 cm.

Prediction:

> Which event occurs first along the target direction?

Choices:

- `Ball, then Low Point` — correct;
- `Low Point, then ball`;
- `They are the same point`.

Reveal:

> The ball comes before the bottom, so the modeled tangent is still descending:
> −4.1°.

#### Step B — At the ball

Prompt:

> Drag Low Point to the ball.

Gate:

- absolute Low Point ≤0.25 cm.

Reveal:

> Place and impact align. The modeled tangent is level.

#### Step C — Behind

Prompt:

> Move Low Point at least 4 cm behind the ball.

Prediction:

> What happens to the Attack sign?

Correct:

> It becomes positive: the clubhead is already ascending.

#### Step D — Place versus direction

Match:

- centimeters → Low Point;
- degrees → Attack Angle.

**Completion gate**

- ahead prediction;
- zero gate;
- behind state;
- sign prediction;
- unit match.

**Voice sequence**

1. “Ahead means the ball arrives before the bottom, while the modeled tangent
   still points down.”
2. “Move the bottom behind the ball, and impact occurs on the ascending side.”

Only line 1 autoplays.

### S2 — Influence and invariance

**Title**

> Position leads. Plane modifies.

#### Stage 1 — Position sweep

At fixed plane 55°, show:

- −6 cm → +2.3° Attack;
- 0 cm → 0.0°;
- +10.5 cm → −4.1°;
- +15 cm → −5.9°.

Role:

> DOMINANT DIRECT GEOMETRY INPUT

Copy:

> Moving farther ahead makes the fixed-plane tangent more descending. Moving
> behind makes it ascending.

Do not show a linear best-fit or “one degree per inch.”

#### Stage 2 — Plane modifier

Lock +10.5 cm. Toggle 45°, 55°, 70°:

- −3.5°;
- −4.1°;
- −4.7°.

Role:

> MATERIAL MODIFIER

Copy:

> Same place, different plane, different vertical share of the tangent.

#### Stage 3 — Depth invariance preview

Lock +10.5 cm and plane 55°. Toggle vertical −30, 0, +30 mm.

Readout:

> ATTACK −4.110° · UNCHANGED

Role:

> INVARIANT IN THIS MODEL

Copy:

> Moving the whole arc vertically changes what it meets, not its tangent angle.
> Strike Depth tests that next.

#### Stage 4 — Other coupling

Collapsed:

> Derived Club Path also changes as impact moves around this inclined rigid
> circle. Plane Coupling isolates that model behavior later; it is not another
> independent Low Point cause.

**Voice**

> “Low Point position leads the angle. Plane changes the exchange rate. Vertical
> depth leaves the model tangent unchanged.”

### S3 — Myths and boundary

**Title**

> A place explains one part of contact.

#### Experiment 1 — “Hitting down means Low Point at the ball”

Correct:

> False. At the ball is level. Descending impact requires the modeled bottom
> after the ball.

#### Experiment 2 — “Further ahead is always better”

Correct:

> False.

Reveal:

> Further ahead makes this fixed-plane model more descending. Whether contact
> is useful also depends on vertical depth, club/shot context and physics the
> point-club model does not contain.

No `Pure` quality score is used as evidence.

#### Experiment 3 — “Low Point and Attack are the same”

Correct:

> False. Low Point is measured in distance; Attack is a tangent angle derived
> from the modeled relationship.

#### Experiment 4 — “The centimeter mapping is universal”

Correct:

> False. The plane comparison changes Attack while distance is held. Real
> swings also change radius and plane through time.

#### Experiment 5 — Full 3D boundary

Copy:

> A real low point can also sit left or right of the target line. This core
> instrument holds that side component and Swing Direction at zero.

**Voice**

> “Low Point helps explain the tangent. It does not, by itself, grade the
> strike or prescribe a swing.”

### S4 — Mastery Check

**Title**

> Prove you can locate the bottom.

Five tasks; pass requires at least four plus Task 5.

#### Task 1 — Units

> Which pair is correct?

- `Low Point: centimeters; Attack: degrees` — correct;
- `Both are degrees`;
- `Low Point: mph; Attack: centimeters`.

#### Task 2 — Order

> Low Point is 8 cm ahead. What is the modeled order?

- `Ball, then Low Point` — correct;
- `Low Point, then ball`;
- `Cannot be ordered`.

#### Task 3 — Sign

> Low Point is behind the ball in the held side-on geometry. What Attack sign
> follows?

- `Positive/ascending` — correct;
- `Negative/descending`;
- `Always zero`.

#### Task 4 — Modifier and boundary

> Why can +10.5 cm produce different Attack magnitudes?

- `Plane changes the vertical share of the tangent` — correct;
- `Low Point is secretly measured in degrees`;
- `Vertical depth changes Attack one for one`.

#### Task 5 — Live sequence transfer, mandatory

**Mission**

> BUILD BOTH EVENT ORDERS
> A. Ball → Low Point, with Attack −5.0° to −3.0°
> B. Low Point → Ball, with Attack +1.0° to +3.0°

**Editable**

- Low Point Distance only.

**Held**

- radius 1.20 m;
- plane 55°;
- Swing Direction 0°;
- vertical depth 0.

**Pass A**

- effective Low Point ahead;
- raw Attack in −5.0°…−3.0°;
- learner labels ball first.

**Pass B**

- effective Low Point behind;
- raw Attack in +1.0°…+3.0°;
- learner labels Low Point first.

**Evidence**

- raw state;
- effective value;
- derived Attack;
- event label.

**Near misses**

- right order, angle too small:
  > Correct side of the bottom. Increase the distance from the ball.
- wrong order:
  > The marker is on the other side of the ball.
- correct angle, wrong label:
  > Read the target-direction order before capturing.

**Voice**

> “Move only the bottom. Build ball-then-bottom, then bottom-then-ball.”

### S5 — Result

**Pass eyebrow**

> LOW POINT · MASTERED

**Pass title**

> You separated place from direction.

**Evidence**

> VERIFIED
> Ahead, at and behind identified
> Plane modifier recognized
> Both event orders built live

**Next**

> NEXT IN STRIKE & CONTACT
> Strike Depth
> Move the arc vertically without changing its Attack Angle.

**Primary action**

> CONTINUE TO STRIKE DEPTH

**Secondary**

- `REPLAY LIVE SEQUENCES`;
- `EXPLORE PLANE COUPLING LATER`;
- `RETURN TO ACADEMY`.

Plane Coupling remains locked until Strike Depth is complete and never blocks
the core goal.

**Retry labels**

- `PLACE VS DIRECTION`;
- `EVENT ORDER`;
- `ATTACK SIGN`;
- `PLANE MODIFIER`;
- `LIVE LOW POINT`.

**Voice**

> “You located the bottom and read its order. Next, move the arc up and down
> without changing that direction.”

## 7. Information sheets

### 7.1 Low Point Distance

> Low Point Distance describes how far the bottom of the modeled clubhead arc
> sits ahead of or behind impact in the target direction.

Truth:

> ≈ REAL WORLD CONCEPT · MODEL OUTPUT

### 7.2 Ahead and behind

> Ahead means toward the target after the ball. Behind means before the ball.
> Flightglass uses positive for ahead and negative for behind.

### 7.3 Low Point versus Attack

> Low Point is a location in centimeters. Attack Angle is the tangent direction
> in degrees. In the held model, ahead maps to descending and behind to
> ascending.

### 7.4 What matters most

> For the core fixed-plane state, effective Low Point Distance is the dominant
> direct geometry input to Attack. Plane is a material modifier. Vertical depth
> is invariant to Attack.

### 7.5 Effective Low Point

> Swing Direction and plane alter the engine value used downstream. The core
> lesson holds Swing Direction at zero so the marker and effective value are
> identical. The optional Plane Coupling lab exposes the difference.

### 7.6 Other modeled coupling

> Moving impact around an inclined rigid circle also changes the horizontal
> tangent, so the engine's derived Club Path can move even while the Swing
> Direction input is held. That is a model relationship, not a second Low Point
> definition.

### 7.7 Model limits

> The instrument uses a rigid 1.20 m circle and a fixed plane. It does not model
> a changing radius, shifting plane, club sole, turf deformation, body motion
> or measurement noise. It cannot grade your real contact.

### 7.8 Sources

- TrackMan Support, “Low Point Distance”:
  `https://support.trackmangolf.com/hc/en-us/articles/39724600685339-Parameters-Low-Point-Distance-Tee-to-Green`
- TrackMan Support, “Low Point Side”:
  `https://support.trackmangolf.com/hc/en-us/articles/39724627132443-Parameters-Low-Point-Side-Tee-to-Green`
- TrackMan Support, “Attack Angle”:
  `https://support.trackmangolf.com/hc/en-us/articles/39724226342555-Parameters-Attack-Angle-Tee-to-Green`

Sources support definitions and qualitative order. Exact centimeter-to-degree
fixtures come from the current Flightglass geometry engine.

## 8. Voice and synchronized UI

| Trigger | Voice | Visual |
|---|---|---|
| S0 first entry | “Attack is a direction. Low Point is a place. Watch which one comes first: ball or bottom.” | cm ruler and degree wedge separate |
| S1 ahead | “Ahead means the ball arrives before the bottom, while the modeled tangent still points down.” | event chips order |
| S1 behind | “Move the bottom behind the ball, and impact occurs on the ascending side.” | order reverses |
| S2 entry | “Low Point position leads the angle. Plane changes the exchange rate. Vertical depth leaves the model tangent unchanged.” | position, plane, depth roles sequence |
| S3 | “Low Point helps explain the tangent. It does not, by itself, grade the strike or prescribe a swing.” | boundary chips resolve |
| S4 | “Move only the bottom. Build ball-then-bottom, then bottom-then-ball.” | two capture slots appear |
| Pass | “You located the bottom and read its order. Next, move the arc up and down without changing that direction.” | Strike Depth destination |

Shared voice/caption policy from the curriculum blueprint applies.

## 9. State, compatibility and rewards

Canonical key:

> `academy.progress.low-point`

Evidence:

- content/geometry version;
- mastery answers;
- raw and effective Low Point values for both Task 5 states;
- raw derived Attack values;
- plane modifier answer;
- attempts/time/voice preference.

Legacy:

- legacy `low-point` completion becomes prior evidence under the same alias;
- schema migration distinguishes legacy record version from canonical mastery;
- placement can verify prior knowledge;
- no duplicate reward.

Prerequisite:

- Up or Down at Impact for mastery;
- preview always available.

Completion:

- unlocks Strike Depth;
- contributes no separate Attack reward;
- may reveal optional Plane Coupling preview, still locked for mastery/explore
  completion until Strike Depth.

## 10. Accessibility, motion and haptics

- The dimension bracket has an accessible value with sign, centimeters and
  ahead/behind words.
- Event sequence is announced as ordered text.
- The tangent has signed degree and up/down word.
- Direct drag has stepper/adjustable alternatives.
- Direction uses sign, word and position, not color.
- Dynamic Type stacks ruler, event chips and readouts.
- Reduce Motion shows static prior/current marker positions.
- No essential content is voice-only.
- Hidden secondary Club Path is available in the sheet, not omitted from the
  accessibility tree when expanded.
- Haptic: selection at ball alignment, light on capture, success on pass.
- Focus restores from sheets and review links.

## 11. Failure and edge states

### Geometry unavailable

> LOW POINT MODEL UNAVAILABLE
> Your prior progress is safe. Live mastery requires the geometry engine.

No hand-authored fallback numbers.

### Non-finite effective value

> THIS LOW POINT COULD NOT BE CALCULATED

Last valid state remains muted and cannot earn evidence.

### Out-of-range migrated state

Clamp only the temporary view control; preserve stored raw evidence and show:

> Saved Low Point lies outside this lab's range.

### Zero formatting

> 0.0 CM · AT BALL

Never “0 cm ahead.”

### Prior completion

> PRIOR LEARNING FOUND
> Your Low Point history is preserved. Complete the new place-and-direction
> check to verify mastery.

## 12. Verification contract

### 12.1 Geometry tests

1. held fixtures at −0.06, −0.02, 0, +0.02, +0.06, +0.105 and +0.15 m match
   `effectiveLpx()` and `deriveImpact()`;
2. plane 45/55/70 fixtures at +0.105 m match −3.5472611810209624°,
   −4.110245535124602° and −4.71636134032566°;
3. z −0.03/0/+0.03 m leaves Attack exactly unchanged at the held state;
4. core Swing Direction remains zero;
5. live mastery uses effective, not raw, Low Point;
6. rounding does not decide gates;
7. protected engine is not duplicated or changed.

### 12.2 Native behavior tests

1. S0–S5/resume/back behavior.
2. Ruler sign, word and spatial side agree.
3. Event order flips at zero.
4. Plane modifier preserves Low Point.
5. Depth comparison preserves Attack.
6. Club Path remains secondary and correctly labeled.
7. Task 5 requires both orders and angle ranges.
8. voice once/Replay/Voice Off/screen reader.
9. Dynamic Type/Reduce Motion parity.
10. idempotent progress/reward.

### 12.3 Content-truth tests

Fail if copy:

- calls Low Point an angle;
- calls Attack a place;
- says at-ball Low Point means descending;
- says ahead automatically means good contact;
- claims centimeters map universally to degrees;
- hides plane as a modifier;
- says vertical depth changes Attack in this engine;
- presents raw Low Point as effective with nonzero Swing Direction;
- claims the model measured the learner;
- prescribes a technique or universal target.

### 12.4 Acceptance evidence

- S0–S5 screenshots;
- ahead/zero/behind states;
- plane modifier and depth invariant comparisons;
- both live Task 5 captures and near misses;
- full text/voice/accessibility evidence;
- Reduce Motion and Dynamic Type;
- legacy migration;
- engine/native test output;
- unchanged protected-engine proof.

Acceptance is gate-based; no quality score can offset a wrong sign, hidden
modifier, contact overclaim or raw/effective Low Point mismatch.

## 13. Implementation boundary

An implementation plan may add native Low Point views, adapters, fixtures,
migration state, accessibility metadata and tests. It must:

- use `effectiveLpx()` and `deriveImpact()` as numeric authority;
- keep Swing Direction zero in the core lesson;
- separate centimeters, degrees and vertical millimeters;
- keep contact-quality classification out of the main outcome;
- route next through the selected goal;
- preserve the legacy ID and one reward;
- leave geometry/flight production physics unchanged.

This document authorizes planning, not implementation.
