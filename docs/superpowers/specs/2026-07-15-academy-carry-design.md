# Flightglass Academy — Carry Experience Design

**Status:** Normative design specification, 2026-07-15. Ready for an
implementation plan after the shared Academy curriculum/store migration spec
exists.

**Experience ID:** `carry`

**Learner-visible title:** **Carry**

**Owned legacy concepts:** `carry`, `total`

**Primary outcome:** Carry

**Secondary model extension:** Illustrative Total

**Goal family:** Speed & distance

**Prerequisite:** Speed Transfer

**Normative inputs:**

- `docs/superpowers/specs/2026-07-15-academy-outcome-curriculum-blueprint.md`
- `docs/superpowers/specs/2026-07-15-academy-speed-transfer-design.md`
- `docs/superpowers/specs/2026-07-15-academy-flight-height-descent-design.md`
- `impact-flight.js`
- the `carry` and `total` legacy records in `academy.html`

## 1. Learner promise

Teach exactly what moves current-engine Carry, expose what real Carry also
depends on, and keep the illustrative roll extension from masquerading as a
course prediction.

The experience succeeds only when the learner can:

1. define Carry at equal landing elevation;
2. identify Ball Speed as the only numeric input to current-engine Carry;
3. read the full current Carry fit, including its denominator;
4. distinguish current-model causality from real-world launch/spin effects;
5. distinguish Carry from Total and from stopping distance;
6. reconstruct current Total as Carry plus a Landing-Angle-derived roll term;
7. name turf, landing Ball Speed and spin at landing as omitted roll factors;
8. create two current-model shots with equal Carry and different trajectories;
9. explain why equal modeled Carry does not mean equal real flight; and
10. use Carry, not Total, for a carry-plane clearance question.

## 2. Non-goals

- Do not teach an optimal launch/spin window as current-engine Carry causality.
- Do not say current Backspin rpm moves Carry; it does not.
- Do not call the Carry equation a full aerodynamic simulation.
- Do not call the high-speed denominator a measured drag law.
- Do not present a driver, iron or wedge simulation; only the 7-iron preset
  exists.
- Do not prescribe swing changes, club selection or equipment fitting.
- Do not call Total a prediction for a particular fairway or green.
- Do not call the roll fraction stopping power.
- Do not include altitude, temperature, humidity or wind controls. Those are
  separate estimate experiences.
- Do not show the legacy illustrative “launch + spin window bonus.” It is not
  added to the current flight.
- Do not change `impact-flight.js`.

## 3. Legacy-content verdict

The legacy Carry and Total records contain useful definitions but repeatedly
blend real-world physics with current-engine causality. The current Carry
instrument also includes environmental controls and an unconsumed illustrative
launch/spin bonus, which makes the causal story appear richer than the solve.

### Retain, rewritten

- Carry is the distance to the equal-elevation carry plane.
- Carry and Total are different quantities.
- Ball Speed is a major real-world Carry driver and the sole current-model
  Carry input.
- current Total equals Carry plus current illustrative roll;
- current roll fraction decreases as current Landing Angle steepens;
- Carry is the relevant clearance number for a hazard before first landing.

### Reject from learner-facing copy

- “Launch Angle and Backspin shape current Carry.”
- “Current Carry finds an optimal launch-and-spin window.”
- “Backspin is needed for current Carry.”
- “Carry scales as `0.232 × BallSpeed^1.389`” without the denominator;
- “drag saturates Carry near 210 yards” as a physical conclusion;
- “Smash means centered strike”;
- driver/wedge roll regimes presented as simulated club presets;
- Total described as GPS resting distance on real turf;
- the claim that current roll models check, bounce or stopping behavior.

### Move elsewhere

- Ball-Speed production → Speed Transfer;
- Launch, Apex and Landing paths → Delivered Loft & Launch and Flight Height &
  Descent;
- Backspin generation → Backspin;
- altitude and temperature → Air Density;
- wind → Wind;
- real turf behavior → information boundary only.

## 4. Definition and truth contract

### 4.1 Carry definition

Learner copy:

> Carry is the straight-line distance from launch to where the trajectory
> crosses the launch elevation again.

Register: `DEFINITION`.

This equal-elevation definition is essential. It is not automatically the
distance to a sloped real landing surface.

### 4.2 Current Carry fit

```text
Carry =
  0.232 × BallSpeed^1.389
  ───────────────────────
  1 + (BallSpeed / 210)^6
```

Register: `MODEL` / `FITTED ESTIMATE`.

Current direct dependency:

```text
Ball Speed → Carry
```

Current direct dependencies that do **not** exist:

```text
Launch Angle ⇢ Carry      NOT MODELED
Backspin rpm ⇢ Carry      NOT MODELED
Spin Axis ⇢ Carry         NOT MODELED
Altitude ⇢ engine Carry   NOT MODELED; later EST layer
Wind ⇢ engine Carry       NOT MODELED; later EST layer
```

The function is near-monotonic through the core human range but peaks around
172 mph Ball Speed and falls beyond it. That turnover is a fit boundary, not a
lesson that extreme speed reduces real Carry.

Core controls must stay below 160 mph Ball Speed. Advanced Explore may reveal
the turnover only with `MODEL FIT BOUNDARY` visible.

### 4.3 Real-world comparison

Official measurement guidance identifies Ball Speed, Launch Angle and Spin Rate
as primary Carry inputs in real golf. Flightglass currently calculates the
latter two as outputs but does not feed them into its Carry fit.

The exact approved copy is:

> In real golf, launch and spin materially shape Carry. Current Flightglass
> Carry is a Ball-Speed-only fitted estimate.

Never replace this with “Ball Speed is all that matters.”

### 4.4 Current Total extension

```text
RollFraction = clamp(
  0.04 − 0.0015 × (LandingAngle − 45),
  0.012,
  0.055
)

Roll = Carry × RollFraction

Total = Carry + Roll
```

Registers:

- arithmetic identity: `DEFINITION` within current outputs;
- roll-fraction relation: `MODEL` / `ILLUSTRATIVE`;
- Total as course resting distance: `NOT PREDICTED`.

Because current Landing Angle itself is clamped 32–60°, the reachable roll
fraction is normally 5.5% at 32° to 1.75% at 60°. The coded 1.2% lower bound is
not reached through current Landing Angle.

### 4.5 Total model omissions

TrackMan's calculated Total uses Landing Angle, landing Ball Speed and Spin
Rate under assumed surface conditions. Current Flightglass Total uses:

- current Carry;
- current Landing Angle;
- a fixed functional roll fraction.

It omits:

- landing Ball Speed;
- spin rate at landing;
- spin-axis/bounce interaction;
- turf firmness, moisture, rough and slope;
- ball/ground restitution and friction;
- elevation change.

Therefore the learner-visible label is **Illustrative Total**, except where a
sheet is explicitly defining the general launch-monitor term.

### 4.6 Verified speed fixtures

Held delivery: Dynamic Loft 30°, Attack −3°, Spin Loft 33°.

| Club Speed | Ball Speed | Carry | Landing | Roll | Illustrative Total |
|---:|---:|---:|---:|---:|---:|
| 70 mph | 92.96 mph | 124.79 yd | 50.41° | 3.98 yd | 128.77 yd |
| 90 mph | 119.52 mph | 172.40 yd | 54.35° | 4.48 yd | 176.88 yd |
| 110 mph | 146.08 mph | 211.59 yd | 57.22° | 4.58 yd | 216.17 yd |

Copy must say these are current 7-iron-preset model states, not target club
benchmarks.

### 4.7 Equal-Carry / different-flight pair

Held Club Speed 90 mph and Spin Loft 30°:

| State | Dynamic Loft | Attack | Launch | Ball Speed | Carry | Apex | Landing | Roll | Total |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Low trace | 25° | −5° | 14.25° | 120.60 mph | 174.25 yd | 28.84 yd | 46.49° | 6.58 yd | 180.83 yd |
| High trace | 35° | +5° | 22.95° | 120.60 mph | 174.25 yd | 39.31 yd | 60.00° clamp | 3.05 yd | 177.30 yd |

The same Ball Speed forces identical current Carry. Launch changes Apex and
Landing, which changes the illustrative roll tail. In real golf, the same Ball
Speed with such different launch conditions would not generally produce equal
Carry.

### 4.8 Causal-completeness inventory

| Role | Current treatment |
|---|---|
| Dominant/direct | Ball Speed, sole Carry input |
| Upstream | Club Speed and modeled Smash inside Ball Speed |
| Secondary extension | Landing Angle changes illustrative roll fraction |
| Mediators | Apex and Launch contribute to current Landing, not Carry |
| Gate/bound | high-speed Carry-fit turnover; Landing and roll clamps |
| Held | face/path for longitudinal lesson; equal elevation |
| Real but not in Carry | Launch Angle, Spin Rate, aerodynamics |
| Not in Total | landing speed/spin, turf, slope, bounce physics |

Do not rank Launch, Spin and Ball Speed as if all three numerically drive the
current Carry output.

## 5. Instrument design

### 5.1 Design direction

**Aesthetic:** severe trajectory test range with an equal-elevation carry gate.

**Purpose:** make the model omission memorable without making the model feel
broken or untrustworthy.

**Differentiation anchor:** two visibly different trajectories snap into the
same vertical **CARRY PLANE**, then grow different dashed roll tails.

DFII:

| Dimension | Score |
|---|---:|
| Aesthetic impact | 5 |
| Context fit | 5 |
| Implementation feasibility | 5 |
| Performance safety | 5 |
| Consistency risk | 3 |
| **DFII** | **17 − 3 = 14** |

### 5.2 Visual layers

1. horizontal launch elevation;
2. solid current trajectory trace;
3. authoritative vertical Carry plane at the endpoint;
4. optional ghost comparison trace;
5. dashed illustrative roll tail;
6. compact cause ledger beneath the plot.

Solid trace means current engine. Dashed tail means illustrative ground layer.
A dotted outline is reserved for real-world/not-modeled context and never
shares the same color treatment as the engine trace.

### 5.3 Controls

Core lab:

- Club Speed 70–115 mph, step 1;
- Dynamic Loft 20–40°, step 1;
- Attack Angle −6° to +6°, step 1;
- state A/B save and compare.

No environment controls. Face and Path are held at zero. Club preset is held at
`7iron` and is shown in the boundary strip.

### 5.4 Cause ledger

The ledger has three rows only:

1. Ball Speed → engine Carry · `MODEL`;
2. Landing Angle → illustrative Roll Fraction · `MODEL`;
3. Launch + Spin Rate → real Carry · `NOT IN CURRENT CARRY FIT`.

Do not show an invented launch/spin yard bonus.

## 6. Surface-by-surface specification

### S0 — Mission

Kicker:

> SPEED & DISTANCE · 2 OF 2

Title:

> Carry

Promise:

> Find what moves Carry in this engine, then prove where the fit stops.

Mission:

> Land two different trajectories on the same Carry plane.

Boundary strip:

> CARRY FIT · EQUAL ELEVATION · TOTAL IS AN ILLUSTRATIVE ROLL EXTENSION

Primary action:

> Open carry range

Voice, first visit only:

> “This engine gives Carry one direct input: ball speed. Launch and spin still
> matter in real flight.”

### S1 — Carry Range

#### Step A — Define the endpoint

Prompt:

> Move the marker that defines Carry.

The learner selects the equal-elevation trajectory crossing, not apex or end of
roll.

Reveal:

> CARRY · launch to equal-elevation crossing · DEFINITION

#### Step B — Change Ball Speed

Base: 90 mph Club Speed, DL30, AA−3.

Learner predicts, then moves Club Speed 90 → 100 mph.

Reveal:

> Ball Speed 119.52 → 132.80 mph
>
> Carry 172.40 → 193.95 yd

Copy:

> Ball Speed is the only direct input to current Flightglass Carry.

#### Step C — Change Launch at equal Ball Speed

Set low trace: DL25, AA−5, CS90.

Learner predicts what changes when switching to DL35, AA+5, CS90.

Reveal:

> Ball Speed 120.60 → 120.60 mph
>
> Launch 14.25° → 22.95°
>
> Carry 174.25 → 174.25 yd

Voice:

> “The trajectories changed. Current Carry did not. That is a model boundary,
> not a law of golf.”

#### Step D — Reveal the roll tails

Show:

> Low trace · Landing 46.49° · Roll 6.58 yd · Total 180.83 yd
>
> High trace · Landing 60.00° clamp · Roll 3.05 yd · Total 177.30 yd

Copy:

> Current Total changes because Landing Angle changes its illustrative roll
> fraction. It is not predicting this turf.

Completion requires the Ball-Speed change and the equal-Carry contrast.

### S2 — Influence and fit boundary

#### Stage 1 — The whole Carry equation

Show numerator and denominator. The denominator may not be collapsed behind an
ellipsis or “drag.”

At base state:

> 0.232 × 119.52^1.389 ÷ [1 + (119.52/210)^6] = 172.40 yd · MODEL

#### Stage 2 — Speed sweep

Render the three verified points 92.96/119.52/146.08 mph Ball Speed. Copy:

> The fitted curve rises strongly through this range. The yard gain per added
> mph is not constant.

Do not describe the change as a causal percentage.

#### Stage 3 — Equal Carry proof

Overlay the low and high traces, same endpoint. Add:

> SAME BALL SPEED · SAME CURRENT CARRY
>
> DIFFERENT LAUNCH · APEX · LANDING · TOTAL

#### Stage 4 — Real-world bridge

Reveal a dotted connector from Launch and Spin Rate to a card labeled:

> REAL CARRY · MATERIAL
>
> CURRENT CARRY FIT · NOT CONNECTED

Copy:

> Flightglass calculates Launch and Backspin, but current Carry does not consume
> them.

#### Stage 5 — High-speed boundary

Information-only; not in core mastery.

> Above roughly 172 mph Ball Speed the current fit turns downward. Treat that
> as a fitted-range warning, not real speed advice.

### S3 — Myths and boundary

#### Myth 1 — “Launch and Backspin drive this Carry number”

> False in the current solve. They matter in real golf but are not inputs to
> current-engine Carry.

#### Myth 2 — “Carry ends where the ball stops”

> False. Carry ends at the equal-elevation first-landing plane; Total adds an
> illustrative roll tail.

#### Myth 3 — “Illustrative Total predicts my course”

> False. It has no turf, slope, landing speed or spin-at-landing model.

#### Myth 4 — “More Total is always the useful answer”

> False. A hazard-clearance decision needs Carry before the first landing.

#### Myth 5 — “The high-speed turnover means more speed shortens real shots”

> False. It marks the boundary of this fitted equation.

Boundary card:

> CURRENT CARRY KNOWS
>
> Ball Speed
>
> CURRENT CARRY DOES NOT KNOW
>
> Launch Angle · Spin Rate · wind · air density · real drag/lift integration
>
> ILLUSTRATIVE TOTAL DOES NOT KNOW
>
> landing Ball Speed · spin at landing · turf · slope · bounce friction

### S4 — Mastery Check

#### Task 1 — Definition

> Carry is measured to:

- the ball's resting point;
- the highest point;
- the equal-elevation trajectory crossing; **correct**
- the end of the visual screen.

#### Task 2 — Current cause

> Which value directly enters current Flightglass Carry?

- Ball Speed; **correct**
- Backspin rpm;
- Launch Angle;
- Spin Axis.

#### Task 3 — Real-world boundary

> Which statement is accurate?

- Launch and spin never affect real Carry;
- current Carry uses them invisibly;
- launch and spin matter in real flight but are omitted from current Carry;
  **correct**
- Backspin changes current Carry only in wind.

#### Task 4 — Total

> Current Illustrative Total adds:

- measured turf roll;
- Carry × a Landing-Angle-derived roll fraction; **correct**
- Apex to Carry;
- wind drift.

#### Task 5 — Live equal-Carry transfer, mandatory

Target:

> Match one Carry plane with two visibly different flights.

Acceptance:

- two saved states;
- each Carry 174.15–174.35 yd;
- each Ball Speed 120.50–120.70 mph;
- Launch difference at least 8°;
- Apex difference at least 9 yd;
- Landing difference at least 12°;
- Illustrative Total difference at least 3 yd;
- one state Landing below 48°;
- the other is at the visible 60° clamp;
- learner states: “Equal current Carry does not prove equal real Carry.”

Normative pair: DL25/AA−5/CS90 and DL35/AA+5/CS90.

Mastery requires 4/5 knowledge tasks and the live gate.

### S5 — Result

Title:

> Carry model understood

Summary:

> You found the engine's direct Carry input, separated Carry from Total, and
> exposed the launch-and-spin boundary.

Evidence:

- `DEFINITION` equal-elevation Carry;
- `MODEL` Ball-Speed-only Carry fit;
- `LIVE` equal Carry with different trajectories;
- `BOUNDARY` real launch/spin and turf physics not inferred.

Goal-family completion action:

> Finish Speed & distance

If entering from Playing conditions journey:

> Continue to Air Density

Secondary action:

> Continue to Wind

The next action is selected by the journey router, never a hardcoded legacy
chain.

Voice, once on newly earned mastery:

> “Carry confirmed. You now know both the result and the boundary of the fit.”

## 7. Information sheets

### 7.1 Carry

- equal-elevation definition;
- current equation;
- Ball-Speed-only dependency;
- fitted-range boundary.

### 7.2 Real Carry

- Ball Speed, Launch Angle and Spin Rate materially interact;
- current engine does not integrate that flight;
- no universal optimum without club/player context.

### 7.3 Total

- general definition;
- current arithmetic;
- why learner label says Illustrative Total.

### 7.4 Roll Fraction

- current Landing-Angle relation and clamps;
- not bounce or turf physics;
- reachable 1.75–5.5% range.

### 7.5 Hazard clearance

> A 205-yard carry requirement is not cleared by 195 carry plus 20 roll.

No course-strategy prescription beyond this measurement distinction.

### 7.6 Equal Carry

Show both normative states and the inference limit.

### 7.7 Sources

- TrackMan Carry:
  `https://support.trackmangolf.com/hc/en-us/articles/39726543090971-Parameters-Carry-Tee-to-Green`
- TrackMan Total:
  `https://support.trackmangolf.com/hc/en-us/articles/39727276786843-Parameters-Total-Tee-to-Green`
- TrackMan Ball Speed:
  `https://support.trackmangolf.com/hc/en-us/articles/39726139974683-Parameters-Ball-Speed-Tee-to-Green`
- TrackMan Launch Angle:
  `https://support.trackmangolf.com/hc/en-us/articles/39726267472667-Parameters-Launch-Angle-Tee-to-Green`
- TrackMan Spin Rate:
  `https://support.trackmangolf.com/hc/en-us/articles/39726491252251-Parameters-Spin-Rate-Tee-to-Green`

## 8. Voice and synchronized UI

| Trigger | Voice line | Visual companion |
|---|---|---|
| S0 first visit | “This engine gives Carry one direct input: ball speed. Launch and spin still matter in real flight.” | Ball Speed connector appears |
| Definition | “Carry ends at the equal-elevation crossing, before any roll.” | carry plane locks |
| Speed change | “Ball speed rose. The fitted carry endpoint moved with it.” | endpoint slides |
| Equal-Carry switch | “The trajectories changed. Current Carry did not. That is a model boundary, not a law of golf.” | traces meet the same plane |
| Roll reveal | “Landing angle changes this illustrative tail. It does not predict the ground beneath you.” | dashed tails grow |
| Real-world bridge | “Real carry also depends on launch and spin. This fit does not consume them.” | dotted connectors stop at boundary |
| Mastery | “Carry confirmed. You now know both the result and the boundary of the fit.” | evidence locks |

Shared voice rules apply: short, once per new signature, captions, replay,
screen-reader suppression and persistent mute.

## 9. State, compatibility and rewards

```text
experienceId: carry
ownedConceptIds: [carry, total]
```

Migration:

- preserve legacy Carry and Total completion, attempts, XP and history;
- legacy `carry` route opens S0 or last valid Carry surface;
- legacy `total` route opens the Total information sheet inside Carry;
- Carry-complete only → `reviewEligible`, not auto-mastered;
- Carry+Total complete → prefill knowledge evidence, still require the live
  equal-Carry gate for new mastery;
- reward once for canonical `carry`;
- no duplicate Total reward;
- existing learners are not relocked;
- migration is idempotent.

## 10. Accessibility, motion and haptics

- Both traces have labels and distinct dash/solid patterns.
- Carry plane, first landing and end of roll are named in text.
- The chart has a complete table alternative.
- Screen-reader summary announces State A then State B, input, Carry, Apex,
  Landing, Roll and Total.
- Comparison changes announce on save/switch, not continuous drag.
- Reduced motion swaps path drawing for static traces.
- All controls and compare selectors meet 44×44 pt targets.
- Focus order: definition marker, controls, state save, compare, ledger.
- Haptic: light on state save; success on valid shared plane; none on plot
  animation.
- Clamp state has text and symbol, never color alone.

## 11. Failure and edge states

### Flight model unavailable

Keep definition/sheets available. Disable live mastery and say progress is safe.

### Non-finite output

No line, equation or target credit renders from non-finite input.

### Carry fit turnover

Core range prevents it. Advanced range shows `MODEL FIT BOUNDARY`; no mastery or
voice celebrates a lower Carry at higher extreme speed.

### Landing clamp

Display both raw and shown Landing where relevant. The normative high trace
shows `RAW 62.18° · DISPLAY 60.00° CLAMP` in expanded evidence.

### Roll tail clipping

Plot scale reserves the maximum 5.5% tail and includes it in accessible bounds.

### Legacy Total deep link

Never show a blank/standalone lesson. Route to the owned sheet and preserve
back navigation.

## 12. Verification contract

### 12.1 Model fixtures

- 70/DL30/AA−3 → Ball 92.96, Carry 124.7946, Total 128.7733;
- 90/DL30/AA−3 → Ball 119.52, Carry 172.4001, Total 176.8792;
- 110/DL30/AA−3 → Ball 146.08, Carry 211.5887, Total 216.1724;
- DL25/AA−5/CS90 → Carry 174.2500, Apex 28.8356, Landing 46.4856,
  Total 180.8317;
- DL35/AA+5/CS90 → Carry 174.2500, Apex 39.3137, Landing display 60,
  Total 177.2994;
- equal-pair Carry difference below 0.000001 yd;
- equal-pair Launch difference 8.70°, Apex difference 10.4781 yd, Total
  difference 3.5323 yd;
- current Carry remains unchanged when Face/Path/Launch change at held Ball
  Speed;
- non-finite input cannot award credit.

### 12.2 Native behavior tests

- exact S0–S5 restoration;
- carry-plane definition hit target;
- prediction before reveal;
- two distinct saved states;
- table alternative matches plot;
- journey-router next action;
- voice/caption/replay/mute behavior;
- reduced motion and screen reader;
- native background/foreground persistence;
- no web-only fallback.

### 12.3 Content-truth tests

Fail if copy:

- omits the Carry denominator;
- claims current Carry uses Launch or Backspin;
- says Launch/Spin do not matter in real golf;
- calls current Total course-specific;
- presents roll as stopping distance;
- includes the legacy fake launch/spin bonus;
- includes environment controls in core Carry;
- treats high-speed turnover as physical advice;
- uses driver/wedge labels as current simulations.

### 12.4 Acceptance evidence

Require zero critical defects, all category floors, all critical checks,
pairwise-blind win, exact fixture tests, native accessibility evidence, migration
evidence and unchanged protected-engine hash. Derived score remains a byproduct.

## 13. Implementation boundary

Implementation may build the native range, compare traces, illustrative roll
tail, sheets, state, voice and tests.

It may not:

- change the Carry or Total formulas;
- add a hidden launch/spin bonus;
- add environmental controls;
- turn Total into a turf forecast;
- add club presets;
- modify `impact-flight.js`;
- improvise a broader trajectory solver.

Improving the actual Carry/roll physics is a separate engine-calibration
project. Until then, the educational success criterion is precise truth about
the current fit and its real-world limits.
