# Flightglass Academy — Delivered Loft & Launch Experience Design

**Status:** Normative design specification, 2026-07-15. Ready for an
implementation plan after the shared Academy curriculum/store migration spec
exists.

**Experience ID:** `delivered-loft-launch`

**Learner-visible title:** **Delivered Loft & Launch**

**Owned legacy concepts:** `dynamic-loft`, `launch-angle`

**Primary outcome:** Launch Angle

**Goal family:** Launch, spin & descent

**Prerequisite:** Up or Down at Impact

**Normative inputs:**

- `docs/superpowers/specs/2026-07-15-academy-outcome-curriculum-blueprint.md`
- `docs/superpowers/specs/2026-07-15-academy-attack-at-impact-design.md`
- `docs/superpowers/specs/2026-07-13-backspin-96-97-design.md`
- `impact-flight.js`
- the `dynamic-loft` and `launch-angle` legacy records in `academy.html`

## 1. Learner promise

Teach the learner why the ball's initial vertical direction is closer to the
delivered face orientation than to the clubhead's up/down travel, while keeping
both inputs and their other model paths visible.

The experience succeeds only when the learner can:

1. distinguish Static Loft, Dynamic Loft, Attack Angle and Launch Angle;
2. identify Dynamic Loft as face orientation at impact;
3. identify Launch Angle as the ball's initial vertical direction;
4. apply the current model's 0.62° Dynamic-Loft and 0.25° Attack sensitivities;
5. explain why Attack is smaller but not irrelevant;
6. build two different deliveries with nearly the same Launch Angle;
7. recognize that equal Launch Angle does not imply equal Spin Loft, Ball Speed
   or flight; and
8. identify the linear 2D launch transform and unmodeled collision factors as
   model boundaries.

## 2. Non-goals

- Do not call Dynamic Loft the number stamped on the club.
- Do not call Attack Angle face orientation.
- Do not call Launch Angle trajectory height or Apex.
- Do not teach a universal ideal Launch Angle.
- Do not label low/mid/high loft states as different club simulations. The
  engine still uses one 7-iron preset.
- Do not say Dynamic Loft alone determines real Launch Angle.
- Do not hide Attack because its coefficient is smaller.
- Do not hide Dynamic Loft's other current-model paths through Spin Loft,
  Start Line weighting and downstream efficiency/spin.
- Do not prescribe shaft lean, release, face manipulation or ball position.
- Do not change `impact-flight.js`.

## 3. Legacy-content verdict

The legacy records correctly separate delivered loft from stamped loft and
recognize loft-dominant launch, but they mix measurement definitions, universal
optimization, club labels and unsupported delivery advice.

### Retain, rewritten

- Dynamic Loft is vertical face orientation at impact.
- Launch Angle is the ball's initial vertical direction after separation.
- The ball generally launches closer to Dynamic Loft than Attack Angle.
- Current Flightglass uses both.
- Dynamic Loft also raises simplified Spin Loft at held Attack.
- Two deliveries can create nearly the same Launch Angle and different spin
  conditions.

### Reject from learner-facing copy

- Driver/iron/wedge claims presented as current-engine club simulations.
- Fixed “optimal launch windows.”
- Static-loft-to-dynamic-loft prescriptions.
- “Loft is all that matters.”
- “Attack barely matters” or “Attack is irrelevant.”
- Exact 62/25 coefficients presented as universal collision physics.
- Claims that equal Launch means equal height, carry or stopping.

### Move to later experiences

- Spin Loft/Backspin mastery remains in Backspin.
- Apex and Landing Angle remain in Flight Height & Descent.
- Carry remains in Carry.
- Launch Direction weighting remains in Start Line.

## 4. Definition and truth contract

### 4.1 Four distinct quantities

| Quantity | Definition | Unit/reference |
|---|---|---|
| Static Loft | club's designed face angle outside the delivered impact state | degrees; equipment context |
| Dynamic Loft | vertical face orientation at the center of contact at impact | degrees from horizon |
| Attack Angle | clubhead travel direction up/down at impact | degrees from horizon |
| Launch Angle | ball's initial vertical direction after separation | degrees from horizon |

The main lesson shows only the last three arrows. Static Loft lives in a sheet
because it is not an engine input.

### 4.2 Current launch transform

```text
LaunchAngle =
  0.62 × DynamicLoft
  + 0.25 × AttackAngle
```

| Claim | Label |
|---|---|
| Dynamic Loft/Attack/Launch definitions | ≈ REAL WORLD |
| Dynamic Loft is normally the larger direct launch contributor | ≈ REAL WORLD, qualitative |
| exact 0.62 and 0.25 coefficients | MODEL |
| one 7-iron preset and linear 2D transform | HELD MODEL |
| face flexibility, impact location, ball/club properties and full 3D collision | NOT MODELED |

The coefficients sum to 0.87, not 1.00. The missing 0.13 is not a named
physical contribution and must not be rendered as “other 13%.” The equation is
a fitted model transform, not a conservation/share equation.

### 4.3 Direct sensitivity hierarchy

At held other input:

| Input | +1° input produces | Role |
|---|---:|---|
| Dynamic Loft | +0.62° Launch Angle | dominant direct model input |
| Attack Angle | +0.25° Launch Angle | smaller material modifier |

Because both use degrees, their direct coefficients can be compared. The
instrument must say “for each degree in this model,” not a universal percentage
of launch.

### 4.4 Dynamic Loft's other paths

Dynamic Loft is not only a Launch input:

1. `SpinLoft = DynamicLoft − AttackAngle`: +1° Dynamic Loft gives +1° simplified
   Spin Loft at held Attack.
2. `faceWeight = clamp(0.90 − 0.005 × DynamicLoft, 0.60, 0.88)`: +1° changes the
   current Start Line face/path split by −0.005 until clamped.
3. Spin Loft then changes modeled Smash, Ball Speed, Backspin and Landing Angle.

These are separate causal paths. The lesson must not collapse them into a
single “Dynamic Loft importance percentage.”

### 4.5 Verified primary fixtures

All use Face 0°, Path 0°, Club Speed 90 mph and 7-iron preset.

| State | Dynamic Loft | Attack | Launch | Spin Loft | Ball Speed | Backspin | Apex | Landing |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Base | 30° | −4° | 17.60° | 34° | 119.16 mph | 7292.6 rpm | 32.69 yd | 54.35° |
| Loft +4° | 34° | −4° | 20.08° | 38° | 117.72 mph | 8052.0 rpm | 35.46 yd | 60.00° clamp |
| Attack +4° | 30° | 0° | 18.60° | 30° | 120.60 mph | 6512.4 rpm | 34.07 yd | 54.33° |

Required comparison:

> The same +4° input change moved Launch +2.48° through Dynamic Loft and +1.00°
> through Attack. It moved Spin Loft +4° in the loft case and −4° in the Attack
> case.

The 60° Landing value is labeled `MODEL CEILING`. It is not used to claim
physical saturation.

### 4.6 Equal-launch contrast

| State | Dynamic Loft | Attack | Launch | Spin Loft | Ball Speed | Backspin | Carry | Landing |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Low-spin-loft delivery | 28° | +5° | 18.61° | 23° | 123.12 mph | 5097.2 rpm | 178.51 yd | 51.17° |
| High-spin-loft delivery | 32° | −5° | 18.59° | 37° | 118.08 mph | 7864.1 rpm | 169.91 yd | 57.49° |

Launch differs by only 0.02°, while Spin Loft differs 14°, Backspin differs
2766.96 rpm and current-engine Carry differs 8.60 yd.

This is the central anti-simplification proof:

> Same launch does not mean same delivery or same flight.

### 4.7 Causal-completeness inventory

| Role | Item | Treatment |
|---|---|---|
| Dominant direct Launch input | Dynamic Loft | Main control |
| Smaller material direct input | Attack Angle | Main control, prerequisite knowledge |
| Composite downstream path | Spin Loft | Visible bridge to Backspin |
| Modifier in another outcome | Start Line face weight | Sheet/recall only |
| Held | Face, Path, Club Speed, preset, centered contact | Visible drawer |
| Not modeled | full collision, impact location, face flexibility, dynamic lie, ball/club properties | Boundary |

## 5. Instrument design

The instrument is a side-on delivery wedge with three visually distinct arrows:

1. **FACE** — Dynamic Loft, anchored at impact face;
2. **TRAVEL** — Attack Angle, tangent to clubhead movement;
3. **BALL** — Launch Angle, leaving the ball.

The horizon is a common reference.

Arrow styling:

- each has a persistent text label;
- each uses a different line pattern/endpoint symbol;
- color is supplementary;
- their angle wedges do not overlap labels.

Primary readout:

> LAUNCH 17.6°

Inputs:

- `DYNAMIC LOFT 30.0°`;
- `ATTACK −4.0° DOWN`.

Truth line:

> 0.62 × 30° + 0.25 × −4° = 17.6° · MODEL

### 5.1 Secondary outcome rail

Below the wedge:

> SPIN LOFT 34° → BACKSPIN PREVIEW 7293 RPM

It is collapsed by default on S1 and expanded in S2/equal-launch contrast. It
must not compete with Launch Angle.

### 5.2 Controls

- Dynamic Loft 16° to 44°, step 1°;
- Attack Angle −8° to +6°, step 1°.

These ranges are input states for the 7-iron-calibrated model. They are not
named clubs.

Guided controls use native sliders/steppers. The face arrow may be directly
dragged to change Dynamic Loft; the tangent arrow may be directly dragged to
change Attack. The ball arrow is output-only and must never be draggable.

### 5.3 Cause sentence

> Dynamic Loft contributes 18.6° to the model sum. Attack contributes −1.0°.
> Launch is 17.6°.

This is arithmetic decomposition, not percentages.

Equal-launch:

> Both balls launch near 18.6°. Their face/travel gaps differ, so modeled Spin
> Loft and the rest of flight diverge.

## 6. Surface-by-surface specification

### S0 — Mission

**Eyebrow**

> LAUNCH, SPIN & DESCENT · 2 OF 4

The journey counts Up or Down at Impact as step 1.

**Title**

> Separate face, travel, and ball.

**Body**

> Build the ball's initial vertical direction from delivered face orientation
> and Attack Angle—then prove the same launch can hide different deliveries.

**Mission**

> TARGET
> Launch near 18.6°
> Build two different Spin Loft states

**Primary**

> ENTER LAUNCH LAB

**Secondary**

> REVIEW ATTACK ANGLE

**Voice**

> “Face, clubhead travel, and ball launch are three different arrows. Keep all
> three visible.”

### S1 — Delivery Wedge Lab

**Title**

> Build the launch arrow.

Initial base state: Dynamic Loft 30°, Attack −4°.

#### Step A — Identify arrows

Prompt:

> Which arrow is Dynamic Loft?

Correct:

> Face orientation at impact.

Then:

> Which arrow is Launch Angle?

Correct:

> Ball's initial vertical direction.

#### Step B — Predict loft change

Prompt:

> Hold Attack −4°. Raise Dynamic Loft from 30° to 34°. How much will modeled
> Launch rise?

Choices:

- `2.48°` — correct;
- `4.00°`;
- `1.00°`.

Learner changes the control. Reveal 20.08° Launch.

#### Step C — Predict Attack change

Reset Dynamic Loft 30°. Raise Attack from −4° to 0°.

Choices:

- `Launch rises 1.00°` — correct;
- `Launch rises 2.48°`;
- `Launch falls 4.00°`.

Reveal 18.60° Launch.

#### Step D — Explain hierarchy

Prompt:

> Which is the larger direct per-degree Launch input in this model?

Correct:

> Dynamic Loft. Attack is smaller but still moves the result.

**Completion**

- all arrow identities;
- both committed predictions;
- both controls learner-operated;
- hierarchy explanation.

**Voice sequence**

1. “Dynamic Loft sets face orientation. Attack sets clubhead travel. The ball
   launch sits closer to loft.”
2. “Attack has a smaller coefficient, but it still changes the outcome.”

Only line 1 autoplays.

### S2 — Influence and equal-launch proof

**Title**

> One outcome, more than one delivery.

#### Stage 1 — Direct sensitivities

Two rails:

> +1° DYNAMIC LOFT → +0.62° LAUNCH

> +1° ATTACK → +0.25° LAUNCH

Roles:

- Dynamic Loft: `DOMINANT DIRECT`;
- Attack: `SMALLER MATERIAL MODIFIER`.

No percentage wheel.

#### Stage 2 — Both also change Spin Loft

At base:

- Dynamic Loft +4° → Spin Loft +4°;
- Attack +4° → Spin Loft −4°.

Copy:

> Equal-sized input changes move Spin Loft equally in opposite directions, even
> though they do not move Launch equally.

This is the required nuance linking into Backspin.

#### Stage 3 — Equal-launch contrast

Show both verified deliveries side by side:

- 28° Loft / +5° Attack;
- 32° Loft / −5° Attack.

Before reveal:

> Both launch near 18.6°. Will the rest of the flight match?

Correct:

> No.

Reveal in stages:

1. Spin Loft 23° versus 37°;
2. Ball Speed 123.12 versus 118.08 mph;
3. Backspin 5097 versus 7864 rpm;
4. Carry 178.5 versus 169.9 yd;
5. Landing 51.2° versus 57.5°.

All downstream values show `MODEL`. The lesson does not assess memorization of
those values.

#### Stage 4 — Other Dynamic Loft path

Collapsed:

> Dynamic Loft also changes the Start Line face/path weighting in the current
> model. Start Line owns that relationship.

**Voice**

> “Dynamic Loft leads launch per degree. Both inputs also reshape Spin Loft, so
> equal launch can hide very different flights.”

### S3 — Myths and boundary

**Title**

> Launch is an outcome, not a full diagnosis.

#### Myth 1 — “Dynamic Loft is stamped loft”

Correct:

> False. Dynamic Loft is delivered face orientation at impact. Static Loft is
> equipment geometry outside that delivered state.

#### Myth 2 — “Attack is irrelevant”

Correct:

> False. It contributes +0.25° Launch per degree in the current model and enters
> Spin Loft with full opposite sign.

#### Myth 3 — “The coefficients are percentages”

Correct:

> False. 0.62 and 0.25 are coefficients in a fitted transform. Their sum does
> not create an “other 13%” cause.

#### Myth 4 — “Same Launch means same flight”

Use equal-launch contrast.

Correct:

> False. Launch is only one launch condition.

#### Myth 5 — “Flightglass measured delivered loft”

Correct:

> False. These are interactive model inputs unless connected to a validated
> measurement source in the future.

Boundary reveal:

- `CENTERED CONTACT · HELD`;
- `FACE FLEX / IMPACT LOCATION · NOT MODELED`;
- `ONE 7-IRON PRESET`;
- `FULL 3D COLLISION · NOT MODELED`.

**Voice**

> “Launch Angle is one outcome. It cannot uniquely identify delivered loft,
> Attack, or the whole flight.”

### S4 — Mastery Check

**Title**

> Prove you can build and interpret launch.

Five tasks; pass requires at least four and live Task 5.

#### Task 1 — Definition

> Dynamic Loft is:

- `Vertical face orientation at impact` — correct;
- `The clubhead travel direction`;
- `The ball's peak height`.

#### Task 2 — Direct sensitivity

> Dynamic Loft rises 5°. Attack is held. How much does current-model Launch
> rise?

- `3.10°` — correct;
- `5.00°`;
- `1.25°`.

#### Task 3 — Smaller modifier

> Attack rises 4°. Dynamic Loft is held. How much does Launch rise?

- `1.00°` — correct;
- `2.48°`;
- `4.00°`.

#### Task 4 — Inference limit

> Two shots share 18.6° Launch. What can you conclude?

- `Their modeled Launch outcome is similar, but delivery and Spin Loft may
  differ` — correct;
- `Dynamic Loft and Attack are identical`;
- `Carry and Landing Angle are identical`.

#### Task 5 — Live equal-launch transfer, mandatory

**Mission**

> SAME LAUNCH · DIFFERENT DELIVERY
> Build two states with Launch 18.4°–18.8°.
> Their Spin Loft must differ by at least 10.0°.
> One must be ascending; one descending.

**Editable**

- Dynamic Loft;
- Attack Angle.

**Held**

- Face 0°;
- Path 0°;
- Club Speed 90 mph;
- preset 7-iron.

**Pass**

- both learner-created through engine controls;
- both raw Launch values in range;
- absolute Spin Loft difference ≥10°;
- one Attack >0°, one Attack <0°;
- states are distinct;
- raw outputs determine gates.

Verified pair:

- 28°/+5° → Launch 18.61°, Spin Loft 23°;
- 32°/−5° → Launch 18.59°, Spin Loft 37°.

**Near misses**

- launch out of range:
  > Adjust the 0.62/0.25 sum before capturing.
- spin-loft gap too small:
  > Launch matches, but the two face/travel gaps are still too similar.
- same Attack sign:
  > Build one ascending and one descending delivery.
- only rounded display passes:
  > The full-precision Launch value is just outside the gate.

**Voice**

> “Match the launch window twice. Change the face-to-travel gap enough to
> separate Spin Loft.”

### S5 — Result

**Pass eyebrow**

> DELIVERED LOFT & LAUNCH · MASTERED

**Pass title**

> You separated the three vertical arrows.

**Evidence**

> VERIFIED
> Dynamic Loft and Attack roles compared
> Equal Launch, different Spin Loft built live
> Model boundary identified

**Next**

> NEXT IN LAUNCH, SPIN & DESCENT
> Backspin
> Use the face-to-travel gap and Ball Speed to control modeled launch spin.

**Primary**

> CONTINUE TO BACKSPIN

**Secondary**

- `REPLAY EQUAL-LAUNCH MISSION`;
- `RETURN TO ACADEMY`;
- `REVIEW SOURCES`.

If Backspin is already mastered under the existing reference lesson, the
primary action routes to Flight Height & Descent and says why. It never relocks
or erases prior Backspin completion.

**Retry labels**

- `ARROW DEFINITIONS`;
- `LOFT SENSITIVITY`;
- `ATTACK MODIFIER`;
- `INFERENCE LIMIT`;
- `LIVE EQUAL LAUNCH`.

**Voice**

> “You matched launch with different deliveries. Next, connect that gap to
> modeled Backspin.”

## 7. Information sheets

### 7.1 Dynamic Loft

> Dynamic Loft is vertical face orientation at impact, measured relative to the
> horizon. It can differ from Static Loft.

Truth:

> ≈ REAL WORLD DEFINITION

### 7.2 Static Loft

> Static Loft describes the club's designed face angle outside the delivered
> impact state. It is not a current Flightglass engine input.

### 7.3 Launch Angle

> Launch Angle is the ball's initial vertical direction after separation from
> the face. It is not Apex or the average trajectory angle.

### 7.4 Attack Angle

> Attack Angle is the clubhead's up/down travel direction at impact. It is a
> smaller direct Launch modifier here and a full component of simplified Spin
> Loft.

Link:

> REVIEW UP OR DOWN AT IMPACT

### 7.5 What matters most

> For each degree in this model, Dynamic Loft moves Launch +0.62° and Attack
> moves it +0.25°. Dynamic Loft is the larger direct input; Attack remains
> material.

### 7.6 Other Dynamic Loft paths

> Dynamic Loft also changes simplified Spin Loft degree for degree and adjusts
> the current Start Line face/path weighting. Those are separate paths, not
> extra percentages in Launch.

### 7.7 Equal Launch

> One outcome cannot be inverted into one unique delivery. Two combinations of
> Dynamic Loft and Attack can share Launch and differ in Spin Loft, Ball Speed,
> Backspin and later flight.

### 7.8 Model limits

> The model uses a linear 2D transform, centered contact and one 7-iron preset.
> It does not model face flexibility, impact location, dynamic lie, detailed
> ball/club properties or a full collision.

### 7.9 Sources

- TrackMan Support, “Dynamic Loft”:
  `https://support.trackmangolf.com/hc/en-us/articles/39724378738203-Parameters-Dynamic-Loft-Tee-to-Green`
- TrackMan Support, “Launch Angle”:
  `https://support.trackmangolf.com/hc/en-us/articles/39726267472667-Parameters-Launch-Angle-Tee-to-Green`
- TrackMan Support, “Attack Angle”:
  `https://support.trackmangolf.com/hc/en-us/articles/39724226342555-Parameters-Attack-Angle-Tee-to-Green`
- TrackMan Support, “Spin Loft”:
  `https://support.trackmangolf.com/hc/en-us/articles/39724683297051-Parameters-Spin-Loft-Tee-to-Green`

Sources support definitions and qualitative dominance. Exact coefficients and
all fixtures are Flightglass model claims.

## 8. Voice and synchronized UI

| Trigger | Voice | Visual |
|---|---|---|
| S0 | “Face, clubhead travel, and ball launch are three different arrows. Keep all three visible.” | arrows separate |
| S1 | “Dynamic Loft sets face orientation. Attack sets clubhead travel. The ball launch sits closer to loft.” | labels highlight |
| Attack comparison | “Attack has a smaller coefficient, but it still changes the outcome.” | smaller rail moves |
| S2 | “Dynamic Loft leads launch per degree. Both inputs also reshape Spin Loft, so equal launch can hide very different flights.” | Launch aligns, downstream diverges |
| S3 | “Launch Angle is one outcome. It cannot uniquely identify delivered loft, Attack, or the whole flight.” | boundary chips |
| S4 | “Match the launch window twice. Change the face-to-travel gap enough to separate Spin Loft.” | two capture slots |
| Pass | “You matched launch with different deliveries. Next, connect that gap to modeled Backspin.” | journey route resolves |

Shared native voice policy applies.

## 9. State, compatibility and rewards

Canonical key:

> `academy.progress.delivered-loft-launch`

Evidence:

- content/flight-model version;
- mastery answers;
- both raw live states and outputs;
- inference-limit result;
- attempts/time/voice preference;
- prerequisite version.

Legacy aliases:

- `dynamic-loft` → prior concept evidence;
- `launch-angle` → prior outcome evidence;
- either or both may open placement/review;
- neither silently grants new mastery;
- both old IDs retain deep-link/history resolution;
- one canonical completion/reward.

Prerequisite:

- Up or Down at Impact for mastery;
- preview always available.

Completion:

- normally unlocks Backspin;
- if Backspin already complete, unlocks Flight Height & Descent without
  relocking Backspin.

## 10. Accessibility, motion and haptics

- Each arrow has name, signed angle, reference and direction text.
- Arrow styles differ without color.
- Formula/ledger has logical read order.
- Output ball arrow is not exposed as adjustable.
- Sliders have signed values and native adjustable actions.
- Equal-launch contrast is text-complete before/after.
- Dynamic Type stacks wedge, formula and secondary rail.
- Reduce Motion uses immediate arrow states.
- No essential relationship is voice-only.
- Haptic: selection on target crossing, light on capture, success on mastery.
- Focus returns from sheets/review.

## 11. Failure and edge states

### Flight model unavailable

> LAUNCH MODEL UNAVAILABLE
> Definitions remain available. Live comparison and mastery wait for the
> protected engine.

### Non-finite output

> THIS DELIVERY COULD NOT BE CALCULATED

Last valid arrows remain muted; no evidence.

### Arrow overlap

At accessibility sizes, switch to stacked mini-wedges with the same horizon.
Never hide a label or merge arrows.

### Clamp state downstream

If a fixture hits Backspin/Landing clamp, label the ceiling/floor and keep raw
intermediates available. Do not teach the clamped plateau as physics.

### Prior Backspin mastery

> BACKSPIN ALREADY MASTERED
> Your existing result is preserved. Continue to Flight Height & Descent.

### Prior legacy completion

> PRIOR LEARNING FOUND
> Your Dynamic Loft and Launch Angle history is preserved. Complete this
> combined outcome check to verify mastery.

## 12. Verification contract

### 12.1 Model tests

1. base/Loft+4/Attack+4 fixtures match `solveFlight()`;
2. +1 Dynamic Loft produces +0.62 Launch and +1 Spin Loft;
3. +1 Attack produces +0.25 Launch and −1 Spin Loft;
4. equal-launch pair matches all frozen outputs;
5. raw values drive live gates;
6. clamped downstream values are labeled;
7. view does not duplicate protected formulas;
8. negative zero normalizes.

### 12.2 Native behavior tests

1. S0–S5/resume/back.
2. face/travel/ball arrows never swap labels.
3. Launch output cannot be dragged.
4. predictions precede reveals.
5. S2 displays both launch hierarchy and Spin Loft opposition.
6. Task 5 requires two states, opposite Attack signs and ≥10° Spin Loft gap.
7. prior Backspin mastery routes forward without mutation.
8. voice/Replay/Voice Off/screen-reader behavior.
9. Dynamic Type/Reduce Motion parity.
10. idempotent migration/reward.

### 12.3 Content-truth tests

Fail if copy:

- calls Dynamic Loft Static Loft;
- calls Attack face orientation;
- calls Launch Apex;
- hides Attack or calls it irrelevant;
- presents coefficients as percentages or creates “other 13%”;
- calls exact coefficients universal;
- says equal Launch means equal flight;
- labels states as club simulations;
- hides Dynamic Loft's Spin Loft path;
- prescribes technique;
- says the phone measured delivery.

### 12.4 Acceptance evidence

- S0–S5 surfaces;
- all three arrows at multiple states;
- base/Loft+4/Attack+4 proof;
- equal-launch contrast and live mission;
- every boundary/clamp state;
- prior Backspin-complete route;
- voice/a11y/motion/text scaling;
- legacy alias migration;
- model/native tests;
- protected engine unchanged.

Acceptance is gate-based. Visual polish cannot compensate for arrow confusion,
hidden Attack, a false percentage decomposition or an equal-launch inference
error.

## 13. Implementation boundary

An implementation plan may add native views, engine adapters, fixtures,
migration, accessibility and tests. It must:

- preserve both legacy aliases;
- use one canonical outcome experience/reward;
- keep Launch dominant and Spin Loft secondary but visible;
- consume current engine coefficients/outputs;
- honor prior Backspin completion;
- route through goal journey;
- leave production physics unchanged.

This document authorizes planning, not implementation.
