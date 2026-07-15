# Flightglass Academy — Speed Transfer Experience Design

**Status:** Normative design specification, 2026-07-15. Ready for an
implementation plan after the shared Academy curriculum/store migration spec
exists.

**Experience ID:** `speed-transfer`

**Learner-visible title:** **Speed Transfer**

**Owned legacy concepts:** `club-speed`, `smash`, `ball-speed`

**Primary outcome:** Ball Speed

**Goal family:** Speed & distance

**Prerequisite:** None

**Normative inputs:**

- `docs/superpowers/specs/2026-07-15-academy-outcome-curriculum-blueprint.md`
- `docs/superpowers/specs/2026-07-15-academy-backspin-curriculum-amendment.md`
- `impact-flight.js`
- the `club-speed`, `smash` and `ball-speed` legacy records in `academy.html`

## 1. Learner promise

Teach the learner how a measured clubhead speed becomes modeled Ball Speed,
without presenting Smash Factor as energy percentage, centeredness or universal
strike quality.

The experience succeeds only when the learner can:

1. define Club Speed at the measurement instant;
2. define Smash Factor as Ball Speed divided by Club Speed;
3. reconstruct Ball Speed as Club Speed multiplied by Smash;
4. separate the direct Club Speed input from the modeled Spin-Loft response;
5. identify the current 1.15/1.42 Smash clamps as 7-iron-preset model limits;
6. explain why a faster club can create the same Ball Speed as a slower club;
7. avoid inferring centered contact or actual energy percentage from current
   Flightglass Smash; and
8. build two deliveries with different Club Speed and Smash but equal Ball
   Speed.

## 2. Non-goals

- Do not call Club Speed “power” or “energy.” Kinetic energy also depends on
  effective mass and speed squared; neither is solved here.
- Do not call Smash Factor a percentage of energy transferred.
- Do not call current-engine Smash a centered-contact score.
- Do not claim Flightglass measures impact location, gear effect, face
  flexibility, shaft dynamics, clubhead mass, ball compression or COR.
- Do not teach a universal ideal Smash number across clubs.
- Do not use a driver label. The engine ships only a `7iron` preset.
- Do not teach swing-sequencing, speed-training or equipment prescriptions.
- Do not make Carry the hero; Carry belongs to the next experience.
- Do not award separate mastery or XP for the three legacy concepts.
- Do not change `impact-flight.js`.

## 3. Legacy-content verdict

The legacy records contain the right arithmetic but mix measured quantities,
collision physics, biomechanics, equipment claims and current-model behavior.
They also repeatedly treat Smash as centeredness even though the engine has no
impact-location input.

### Retain, rewritten

- Club Speed is the linear speed of the clubhead's geometric center just before
  first contact.
- Smash Factor is the Ball-Speed-to-Club-Speed ratio.
- `Ball Speed = Club Speed × Smash` is an exact identity for displayed values.
- At held modeled Smash, Ball Speed changes linearly with Club Speed.
- Current Flightglass makes modeled Smash fall as simplified Spin Loft rises.
- Ball Speed is the speed outcome that the current Carry fit consumes.

### Reject from learner-facing copy

- “Club Speed is raw energy.”
- “Smash tells how centered the strike was.”
- “Smash is the fraction of club energy transferred.”
- biomechanical rankings and unsupported 10–20 mph training claims;
- driver-shaped examples presented as a driver simulation;
- a 1.49 collision ceiling presented as the current engine ceiling;
- range-ball, shaft-fitting or ball-temperature prescriptions;
- “Ball Speed is the true engine of every flight result.” It is important, but
  direction, launch, spin and descent have separate paths.

### Move elsewhere

- Carry response → Carry;
- spin generation → Backspin;
- Dynamic Loft/Attack components of Spin Loft → Delivered Loft & Launch and
  Backspin;
- temperature and altitude → Air Density;
- technique or equipment fitting → outside Academy's current diagnostic scope.

## 4. Definition and truth contract

### 4.1 Three distinct quantities

| Quantity | Definition | Register | Current source |
|---|---|---|---|
| Club Speed | Linear speed of the clubhead geometric center just before first touch | DEFINITION | learner input / launch-monitor concept |
| Smash Factor | `Ball Speed / Club Speed` when Club Speed is non-zero | DEFINITION | derived display |
| Ball Speed | Speed of the ball immediately after impact | DEFINITION | current model output |

The UI must not place percent symbols beside Smash.

### 4.2 Current transfer model

For the only shipped preset:

```text
Spin Loft = Dynamic Loft − Attack Angle

SmashRaw = 1.46 − 0.004 × Spin Loft

Smash = clamp(SmashRaw, 1.15, 1.42)

Ball Speed = Club Speed × Smash
```

Truth labels:

- Spin Loft identity: `DEFINITION` within the 2D simplification;
- 1.46 and 0.004 relation: `MODEL`;
- 1.15 and 1.42 clamps: `MODEL BOUND`;
- Ball-Speed product: `DEFINITION` for displayed fields;
- any centeredness or energy explanation: `NOT MODELED`.

The engine comment calls `smashEff` strike efficiency. Learner copy must use
**modeled transfer ratio** because the current numeric path is only Spin Loft.

### 4.3 Influence hierarchy

Within the current model and stated ranges:

1. Club Speed is the direct scale input.
2. Modeled Smash is the direct multiplier.
3. Simplified Spin Loft is the modeled upstream modifier of Smash.
4. Dynamic Loft and Attack are components of Spin Loft, not additional
   independent causes.
5. Impact location, effective mass, club/ball construction and friction are
   real-world factors but `NOT MODELED` in this transfer solve.

No percentage-cause chart is allowed. Club Speed and Smash multiply; they are
not additive shares of one total.

### 4.4 Direct sensitivities

At held Spin Loft 33°:

```text
+1 mph Club Speed → +1.328 mph Ball Speed · FOR THIS STATE · MODEL
```

At held Club Speed 90 mph, away from clamps:

```text
+1° Spin Loft → −0.004 Smash
+1° Spin Loft → −0.36 mph Ball Speed · FOR THIS STATE · MODEL
```

These are local sensitivities, not coaching targets.

### 4.5 Verified primary fixtures

All values come from the unchanged current equations.

| State | Club Speed | Spin Loft | Smash | Ball Speed | Carry context | Backspin context |
|---|---:|---:|---:|---:|---:|---:|
| Slower | 80 mph | 33° | 1.328 | 106.24 mph | 148.86 yd | 6310.7 rpm |
| Base | 90 mph | 33° | 1.328 | 119.52 mph | 172.40 yd | 7099.5 rpm |
| Faster | 100 mph | 33° | 1.328 | 132.80 mph | 193.95 yd | 7888.3 rpm |
| Smaller gap | 90 mph | 25° | 1.360 | 122.40 mph | 177.30 yd | 5508.0 rpm |
| Larger gap | 90 mph | 45° | 1.280 | 115.20 mph | 164.88 yd | 9000 rpm clamp |

Context columns are subordinate and are never used to imply that Ball Speed is
the only real-world input to those outcomes.

### 4.6 Equal-Ball-Speed transfer pair

The mandatory contrast uses:

| Delivery | Club Speed | Spin Loft | Smash | Ball Speed | Current Carry |
|---|---:|---:|---:|---:|---:|
| A — slower/directer | 96 mph | 25° | 1.360 | 130.56 mph | 190.53 yd |
| B — faster/more glancing | 102 mph | 45° | 1.280 | 130.56 mph | 190.53 yd |

This proves only that different factors can produce the same modeled Ball
Speed. It does not say Delivery A is better, centered or appropriate for a
particular club.

### 4.7 Clamp behavior

- `Spin Loft ≤ 10°` reaches the 1.42 upper clamp.
- `Spin Loft ≥ 77.5°` reaches the 1.15 lower clamp.
- clamp activation must be visible as `MODEL LIMIT REACHED`;
- the live mastery keeps both states away from clamps;
- values beyond the clamp may not be narrated as additional transfer change.

### 4.8 Causal-completeness inventory

| Role | Treatment |
|---|---|
| Dominant direct scale | Club Speed over the stated range |
| Material multiplier | modeled Smash |
| Upstream modifier | simplified Spin Loft |
| Components | Dynamic Loft and Attack Angle inside Spin Loft |
| Gates/clamps | 1.15 and 1.42 |
| Held | face, path, club preset, ball, effective club mass |
| Not modeled | impact location, gear effect, face flexibility, shaft dynamics, friction, real energy transfer |

## 5. Instrument design

### 5.1 Design direction

**Aesthetic:** restrained aerospace energy ledger within Flightglass's native
laboratory language.

**Purpose:** make a multiplicative relationship tangible, then expose what the
model does not know.

**Differentiation anchor:** a single luminous transfer pulse crosses three
physically ordered stations — **CLUB → RATIO → BALL** — while a second ghost
pulse proves two different inputs can end at the same Ball Speed ruler.

DFII:

| Dimension | Score |
|---|---:|
| Aesthetic impact | 4 |
| Context fit | 5 |
| Implementation feasibility | 5 |
| Performance safety | 5 |
| Consistency risk | 3 |
| **DFII** | **16 − 3 = 13** |

The instrument uses existing brand fonts/tokens. It does not introduce a new
font, palette or generic dashboard-card system.

### 5.2 Visual layers

1. Club Speed rail, measured input.
2. Smash ratio gate, modeled multiplier.
3. Ball Speed ruler, authoritative outcome.
4. Small read-only Spin Loft modifier under the gate.
5. Dashed `NOT MODELED` ports for Impact Location and Club/Ball Collision.

The ports are visible only after the boundary reveal. They are not disabled
controls.

### 5.3 Controls

Primary:

- Club Speed: 70–115 mph, step 1;
- modeled Spin Loft: 20–50°, step 1 for the core journey;
- compare-state switch A/B.

Advanced Explore may show 5–80° to reveal both clamps. Mastery may not require
the advanced range.

Face, Path and club preset remain held and hidden from control.

### 5.4 Synchronized response

When Club Speed changes:

- Club rail changes length;
- Smash gate stays still;
- transfer pulse speed/extent changes once;
- Ball Speed ruler moves;
- accessible text announces only the changed input and result.

When Spin Loft changes:

- gap marker changes;
- Smash gate narrows/widens;
- Club Speed rail stays still;
- Ball Speed changes;
- clamp badge appears only at a bound.

Reduced motion uses static before/after ticks and never animates a pulse.

## 6. Surface-by-surface specification

### S0 — Mission

Kicker:

> SPEED & DISTANCE · 1 OF 2

Title:

> Speed Transfer

Promise:

> See how Club Speed and a modeled transfer ratio become Ball Speed — and what
> that ratio cannot diagnose.

Mission card:

> Build two different deliveries that produce the same Ball Speed.

Boundary strip:

> FLIGHTGLASS MODEL · ONE 7-IRON PRESET · IMPACT LOCATION NOT MODELED

Primary action:

> Start transfer lab

Voice, first visit only:

> “Club speed supplies the scale. The transfer ratio decides how much ball
> speed this model returns.”

Synchronized cue: CLUB and BALL stations illuminate; RATIO remains outlined.

### S1 — Transfer Lab

#### Step A — Name the quantities

Prompt:

> Which number is measured just before the club first touches the ball?

Correct selection: Club Speed.

Reveal:

> CLUB SPEED · geometric-center speed just before first contact · DEFINITION

Second prompt:

> Which number is the speed of the ball just after impact?

Correct selection: Ball Speed.

Reveal:

> BALL SPEED · post-impact speed · DEFINITION

#### Step B — Build the ratio

Base state: 90 mph Club Speed, Spin Loft 33°, Smash 1.328, Ball Speed
119.52 mph.

Equation shown as three aligned fields:

> 90.00 mph × 1.328 = 119.52 mph

Prompt:

> If Ball Speed is 119.52 and Club Speed is 90, what is Smash?

Answer:

> 119.52 ÷ 90 = 1.328 · DEFINITION

Voice:

> “Smash is a speed ratio, not an energy percentage.”

#### Step C — Change Club Speed

Learner predicts higher/lower/same, then moves 90 → 100 mph while Spin Loft
stays 33°.

Reveal:

> Club Speed +10.00 mph
>
> Smash +0.000
>
> Ball Speed +13.28 mph

Cause sentence:

> At held modeled Smash, Ball Speed scales directly with Club Speed.

#### Step D — Change the modeled ratio

Reset Club Speed to 90. Move Spin Loft 25° → 45°.

Reveal:

> Spin Loft +20°
>
> Smash 1.360 → 1.280
>
> Ball Speed 122.40 → 115.20 mph

Cause sentence:

> In this model, a larger delivery gap lowers the transfer ratio.

Do not display “worse strike.”

Completion requires both controls moved after prediction.

### S2 — Influence and equal-output proof

#### Stage 1 — Multiplication, not shares

Copy:

> Club Speed and Smash do not own separate percentages of Ball Speed. One is
> multiplied by the other.

The old ranked-bar visualization is prohibited. Use the three-station ledger.

#### Stage 2 — Local sensitivity

At the base state, expose:

> +1 mph Club Speed → +1.328 mph Ball Speed · FOR THIS STATE · MODEL

Then:

> +1° Spin Loft → −0.004 Smash → −0.36 mph Ball Speed · FOR THIS STATE · MODEL

Copy:

> The first sensitivity changes if Smash changes. The second changes if Club
> Speed changes or a clamp is active.

#### Stage 3 — Equal Ball Speed

Ghost state A appears at 96 mph / 25°.

Learner must tune state B until:

- Club Speed differs by at least 5 mph;
- Spin Loft differs by at least 15°;
- Smash differs by at least 0.06;
- Ball Speed differs by no more than 0.10 mph.

Normative solution:

> A · 96 × 1.360 = 130.56 mph
>
> B · 102 × 1.280 = 130.56 mph

Voice on success:

> “Different speed and ratio. Same ball speed. The outcome alone cannot tell
> you which delivery created it.”

#### Stage 4 — Boundary ports

Reveal labels:

> IMPACT LOCATION · NOT MODELED
>
> EFFECTIVE MASS · NOT MODELED
>
> FACE / BALL COLLISION · NOT MODELED

Copy:

> Real Smash also reflects factors outside this solve. Flightglass cannot use
> its current Smash number to diagnose centeredness.

### S3 — Myths and boundary

#### Myth 1 — “Club Speed is energy”

> False. It is a speed measurement. Energy also requires mass and a collision
> model.

#### Myth 2 — “Smash is percent energy transferred”

> False. Smash is Ball Speed divided by Club Speed. A ratio of 1.33 is not
> 133% energy transfer.

#### Myth 3 — “Low Smash proves an off-center hit”

> Not here. Impact location is not an input to Flightglass's current transfer
> model.

#### Myth 4 — “More Club Speed always means more Ball Speed”

> Only if the transfer ratio does not fall enough to offset it.

#### Myth 5 — “1.42 is a universal physical maximum”

> False. It is the upper clamp for the current shipped preset.

Boundary card:

> WHAT FLIGHTGLASS KNOWS
>
> Club Speed · Dynamic Loft · Attack Angle · modeled Spin Loft · modeled Smash
>
> WHAT IT DOES NOT KNOW
>
> impact location · effective mass · face flexibility · shaft dynamics · ball
> construction · measured collision efficiency

### S4 — Mastery Check

Five tasks; four knowledge tasks plus a mandatory live transfer.

#### Task 1 — Definition

> Smash Factor is:

- the percentage of energy transferred;
- Ball Speed divided by Club Speed; **correct**
- impact distance from face center;
- Club Speed divided by Ball Speed.

#### Task 2 — Arithmetic

> Club Speed is 90 mph and Smash is 1.328. Ball Speed is:

- 67.77 mph;
- 91.33 mph;
- 119.52 mph; **correct**
- 132.80 mph.

#### Task 3 — Current model

> What changes current Flightglass Smash before a clamp?

- Impact location;
- simplified Spin Loft; **correct**
- Face Angle;
- Wind.

#### Task 4 — Inference limit

> A Flightglass state shows Smash 1.28. What can you conclude?

- the strike was on the toe;
- 72% of energy was lost;
- the model returned a 1.28 speed ratio for this delivery; **correct**
- the golfer needs a different shaft.

#### Task 5 — Live equal-Ball-Speed transfer, mandatory

Target:

> Match 130.56 mph twice with two genuinely different transfers.

Required acceptance:

- save state A and B;
- Ball Speed in each: 130.46–130.66 mph;
- Club Speed difference: at least 5 mph;
- Spin Loft difference: at least 15°;
- Smash difference: at least 0.06;
- neither state is clamp-active;
- learner opens the compare explanation;
- learner selects: “Ball Speed alone does not reveal the delivery.”

The normative fixture pair is 96/25 and 102/45. Equivalent valid pairs are
accepted.

Mastery requires 4/5 knowledge checks **and** the live gate. Repeating a quiz
cannot replace the live transfer.

### S5 — Result

Mastered title:

> Transfer understood

Summary:

> You separated measured speed, modeled ratio and Ball Speed — and proved that
> one outcome can come from different deliveries.

Evidence rows:

- `DEFINITION` Smash = Ball Speed ÷ Club Speed;
- `MODEL` Spin Loft changes current Smash;
- `LIVE` two distinct transfers matched one Ball Speed;
- `BOUNDARY` centeredness and collision efficiency were not inferred.

Journey action:

> Continue to Carry

Secondary actions:

- Replay transfer;
- Review evidence;
- Explore model limits;
- Return to Academy.

Voice, once per newly earned mastery:

> “Transfer confirmed. Next, test what this ball speed does — and does not do —
> to carry.”

## 7. Information sheets

### 7.1 Club Speed

- definition and timing;
- scalar magnitude, no direction;
- direct user/model input;
- not energy, technique or effort.

### 7.2 Smash Factor

- exact ratio definition;
- current Spin-Loft response;
- clamp behavior;
- why current Smash is not Smash Index or impact-location diagnosis.

### 7.3 Ball Speed

- speed immediately after impact;
- exact displayed product;
- consumed by current Carry/Apex/Backspin equations;
- does not decide start line or Spin Axis.

### 7.4 What matters most

Use a multiplicative table, not ranked bars:

| Change | Held | Result |
|---|---|---|
| Club Speed +10 mph | Spin Loft/Smash | Ball Speed +13.28 mph |
| Spin Loft +20° | Club Speed 90 | Smash −0.08, Ball Speed −7.20 mph |

### 7.5 Equal output

Show the 96/25 and 102/45 fixture and state the inference limit.

### 7.6 Model limits

List the held/not-modeled collision factors. Do not provide swing fixes.

### 7.7 Sources

- TrackMan Club Speed:
  `https://support.trackmangolf.com/hc/en-us/articles/39724348308891-Parameters-Club-Speed-Tee-to-Green`
- TrackMan Smash Factor:
  `https://support.trackmangolf.com/hc/en-us/articles/39726314021915-Parameters-Smash-Factor-Tee-to-Green`
- TrackMan Ball Speed:
  `https://support.trackmangolf.com/hc/en-us/articles/39726139974683-Parameters-Ball-Speed-Tee-to-Green`
- TrackMan Smash Index, used only to distinguish centeredness claims from
  simple Smash:
  `https://support.trackmangolf.com/hc/en-us/articles/43770050442267-Parameters-Smash-Index-Tee-to-Green`

Source copy may define measurements. It may not override current-engine truth.

## 8. Voice and synchronized UI

Shared voice: calm American female laboratory/control-room character.

| Trigger | Line | Visual companion |
|---|---|---|
| S0 first visit | “Club speed supplies the scale. The transfer ratio decides how much ball speed this model returns.” | CLUB and BALL illuminate |
| Smash definition | “Smash is a speed ratio, not an energy percentage.” | divide equation resolves |
| Club Speed change | “The ratio held. Ten more club miles per hour returned thirteen point two eight more ball speed.” | rails show before/after |
| Spin-Loft change | “Club speed held. The model narrowed the transfer ratio as the delivery gap grew.” | ratio gate narrows |
| Equal-output success | “Different speed and ratio. Same ball speed. The outcome alone cannot tell you which delivery created it.” | pulses meet one ruler tick |
| Boundary reveal | “Impact location is real. This transfer model does not measure it.” | dashed port appears |
| Mastery | “Transfer confirmed. Next, test what this ball speed does — and does not do — to carry.” | Carry destination appears |

Rules:

- 3–8 seconds and 12–24 words per line;
- play once for a new state signature;
- no voice for repeated slider scrubbing;
- captions are word-for-word and remain until the next deliberate action;
- replay and mute are always available;
- system screen reader suppresses auto-voice;
- voice preference persists app-wide.

## 9. State, compatibility and rewards

Canonical experience state:

```text
experienceId: speed-transfer
ownedConceptIds: [club-speed, smash, ball-speed]
```

Migration:

- completion of any one legacy concept does not auto-master the merged
  experience;
- if all three are legacy-complete, mark `reviewEligible`, preserve every
  completion, XP, attempt and timestamp, and offer a shortened live gate;
- never delete legacy records;
- reward is issued once for `speed-transfer`;
- legacy deep links route to the owned sheet inside Speed Transfer;
- no learner is relocked out of content already available;
- migration is idempotent.

The shortened review still requires the equal-Ball-Speed live gate. Prior quiz
scores may prefill knowledge evidence but cannot substitute for transfer.

## 10. Accessibility, motion and haptics

- Every station has a text label; color never carries station identity alone.
- Equation reading order is Club Speed, multiply, Smash, equals, Ball Speed.
- Slider labels include current value, unit, min/max and effect summary.
- Compare states are announced as complete sentences, not raw tables only.
- Dynamic announcements are debounced and fire on commit, not every drag frame.
- Focus order follows the physical chain.
- Minimum target size is 44×44 pt.
- Voice, caption and screen-reader channels never speak simultaneously.
- Reduced motion replaces transfer pulses with static state ticks.
- Haptic: light on deliberate state save, success on valid equal-output pair;
  none during continuous scrubbing.

## 11. Failure and edge states

### Flight model unavailable

Disable live controls, preserve S0/information sheets, show:

> Live transfer is unavailable. Your progress is safe; mastery was not changed.

### Non-finite or zero Club Speed

Reject the state before division. Never display Infinity or NaN. Mastery cannot
receive credit.

### Clamp active

Show the bound, raw value and `MODEL LIMIT REACHED`. Do not continue animating
the ratio as if it changed.

### Equal-output false positive

Do not accept if the same state was saved twice, if either state is clamped or
if only rounding makes the values look equal outside the numeric tolerance.

### Legacy partial completion

Preserve it and explain that three former topic cards now live in one outcome
experience. Do not duplicate XP.

## 12. Verification contract

### 12.1 Model tests

- 80/33 → Smash 1.328, Ball Speed 106.24;
- 90/33 → 1.328, 119.52;
- 100/33 → 1.328, 132.80;
- 90/25 → 1.360, 122.40;
- 90/45 → 1.280, 115.20;
- 96/25 and 102/45 → exactly 130.56 mph before display rounding;
- upper clamp activates at 10° and below;
- lower clamp activates at 77.5° and above;
- non-finite input cannot change readouts or award credit.

### 12.2 Native behavior tests

- S0–S5 order and restoration;
- both controls must be manipulated in S1;
- prediction precedes reveal;
- compare requires two distinct saved signatures;
- live gate survives app background/foreground;
- voice once-per-signature and replay;
- screen-reader suppression;
- reduced-motion static equivalent;
- no browser-only interaction or web fallback.

### 12.3 Content-truth tests

Fail if learner-facing copy:

- calls Club Speed energy or power;
- puts a percent sign on Smash;
- says current Smash measures centeredness;
- presents 1.42 as a universal physical ceiling;
- calls a state driver/wedge simulation;
- says Ball Speed alone determines real Carry;
- double-counts Spin Loft plus Dynamic Loft and Attack as independent causes;
- hides the only-7-iron-preset boundary.

### 12.4 Acceptance evidence

Required evidence:

1. zero critical defects;
2. content/truth, interaction, native/accessibility, motion, performance and
   migration category floors all pass;
3. every critical evidence check passes;
4. pairwise-blind comparison beats the previous separate-lesson generation;
5. exact numeric fixtures pass against unchanged `solveFlight()`;
6. VoiceOver manual handoff package exists for physical device review;
7. model engine hash is unchanged.

A derived score is a diagnostic byproduct and cannot override a failed gate.

## 13. Implementation boundary

The implementation agent may build native screens, state, voice/captions,
instrument animation, migration and tests from this specification.

It may not:

- change `impact-flight.js`;
- create a driver preset;
- add impact-location physics;
- infer coaching advice;
- split the experience back into three reward-bearing lessons;
- improvise new numeric targets.

Any future collision or impact-location model requires a separate source,
calibration and acceptance package before the copy may call Smash a strike-
quality diagnosis.
