# Flightglass Academy — Backspin Curriculum and Voice Amendment

**Status:** Normative amendment, 2026-07-15. Applies to the existing STUDIO-GRADE
Backspin design without redesigning its instrument or acceptance baseline.

**Canonical experience ID:** `backspin`

**Learner-visible title:** **Backspin**

**Owned legacy concepts:** `spin-loft`, `backspin`

**Goal family:** Launch, spin & descent

**Normative base:**

- `docs/superpowers/specs/2026-07-13-backspin-96-97-design.md`
- `docs/superpowers/plans/2026-07-13-backspin-reference-lesson.md`
- `docs/superpowers/plans/2026-07-14-instrument-gates.md`
- `docs/superpowers/specs/2026-07-15-academy-outcome-curriculum-blueprint.md`
- `docs/superpowers/specs/2026-07-15-academy-delivered-loft-launch-design.md`
- `impact-flight.js`

Where this amendment conflicts with the 2026-07-13 design on curriculum
ownership, route order, result copy, truth boundaries or voice, this amendment
wins. The existing instrument, S0–S5 interaction structure, live engine
fixtures, 4/5-plus-live mastery behavior and proven acceptance gates remain the
reference.

## 1. Why an amendment, not a redesign

Backspin already passed:

- zero critical defects;
- all category floors;
- all critical evidence checks across independent judges;
- pairwise-blind comparison;
- full native/browser/visual/performance gates.

Rebuilding it would spend risk without solving the Academy rollout problem.
The outcome-led curriculum requires only targeted integration:

1. assign `spin-loft` to Backspin instead of a duplicate lesson;
2. place Delivered Loft & Launch before Backspin for new guided journeys;
3. route Backspin next to Flight Height & Descent, not Launch Angle;
4. remove “stopping flight” overclaim;
5. make current-engine causal boundaries explicit;
6. add the shared native voice/caption policy;
7. preserve every existing completion and reward.

## 2. Learner promise, clarified

The existing experience teaches the learner to:

- build simplified Spin Loft from Dynamic Loft and Attack Angle;
- compare the roles of Spin Loft and Ball Speed in the current Backspin model;
- distinguish engine Backspin from wet/flyer real-world estimates;
- create a live Backspin target while meeting a separate Landing Angle gate.

It does not prove that modeled Backspin caused current-engine Carry, Apex or
Landing Angle.

## 3. Ownership and prerequisites

### 3.1 Concept ownership

Backspin is the single canonical experience for:

- `spin-loft`;
- `backspin`.

There is no separate Spin Loft card, mastery result or reward. Spin Loft remains
individually defined, manipulated and assessed inside Backspin.

### 3.2 New guided prerequisite

For learners entering the new Launch, spin & descent journey:

1. Up or Down at Impact;
2. Delivered Loft & Launch;
3. Backspin;
4. Flight Height & Descent.

Backspin preview remains available without prerequisites.

### 3.3 Grandfather rule

Any user with existing Backspin completion/mastery:

- remains complete/mastered;
- keeps XP, badge, attempts and history;
- is never relocked;
- does not need to pass newly preceding experiences retroactively;
- may continue directly to Flight Height & Descent;
- can review Delivered Loft & Launch voluntarily.

This rule is a mandatory migration gate.

## 4. Model and truth corrections

The current engine computes:

```text
SpinLoft =
  DynamicLoft − AttackAngle

SmashEff =
  clamp(1.46 − 0.004 × SpinLoft, 1.15, 1.42)

BallSpeed =
  ClubSpeed × SmashEff

BackspinRaw =
  abs(SpinLoft) × BallSpeed × 1.8

Backspin =
  clamp(BackspinRaw, 1500, 9000)
```

### 4.1 Causal roles

| Role | Item | Required wording |
|---|---|---|
| Composite geometric driver | Spin Loft | dominant direct angular input in this model |
| Equal/opposite components | Dynamic Loft and Attack | +1° Loft / −1° Attack each adds 1° simplified Spin Loft |
| Multiplicative scaler | Ball Speed | scales raw rpm at fixed Spin Loft |
| Efficiency coupling | Spin Loft → Smash → Ball Speed | model self-limiter; do not count Ball Speed as fully independent when Club Speed is held |
| Calibration | 1.8 rpm/(degree·mph) | 7-iron model coefficient, not physical constant |
| Display gates | 1500/9000 rpm clamps | model floor/ceiling, not physical limits |
| Held | centered, clean/dry contact; one 7-iron preset | visible |
| Not modeled | friction, grooves, moisture/grass, impact location, ball/face properties | real causes/conditions outside engine |

Influence UI must not rank Spin Loft, Dynamic Loft and Attack as three
independent causes; Dynamic Loft and Attack are components of Spin Loft.

### 4.2 Backspin does not drive current Carry

The current `carry` equation reads Ball Speed only. The current `apex` equation
reads Ball Speed and Launch Angle. The current `landingAngle` equation reads
Spin Loft, Launch Angle and Apex—not the returned Backspin value.

Therefore visible copy must say:

> Flightglass calculates Backspin as an outcome. The current flight fit does not
> feed that rpm value back into Carry, Apex or Landing Angle.

The live mastery's Landing Angle ≥50° condition is a second model gate created
by the same delivery state. It must not be narrated as:

> More Backspin caused the steeper landing.

Allowed:

> Build the requested Backspin range while also keeping the modeled Landing
> Angle at or above 50°.

### 4.3 Real-world boundary

Allowed:

> In real flight, spin magnitude materially affects lift and trajectory.

Required follow-up:

> Flightglass's current fitted flight equations do not close that causal loop.

The Wet/Flyer layer remains an explicit separate estimate and never mutates
`solveFlight()` output.

### 4.4 Simplified versus full 3D Spin Loft

Keep:

> Dynamic Loft − Attack Angle is the lesson's simplified vertical view.

Add:

> Real Spin Loft is the three-dimensional angle between clubhead travel and
> face orientation, including horizontal components.

No screen may call the subtraction a complete universal definition without the
qualifier.

## 5. Required copy changes

### 5.1 S0 Mission

Retain the existing mission structure and target. Add a persistent ownership
line:

> SPIN LOFT + BALL SPEED → MODELED BACKSPIN

Truth strip:

> MODEL · CLEAN, CENTERED 7-IRON CONDITIONS HELD

### 5.2 S1 Lab

The cause sentence must follow:

> Dynamic Loft [value] minus Attack [value] gives Spin Loft [value]. At Ball
> Speed [value], Flightglass returns [value] rpm.

Do not say Dynamic Loft or Attack independently “creates Backspin” without the
composite.

### 5.3 S2 Influence

Required role labels:

- `SPIN LOFT · DIRECT GEOMETRIC DRIVER`;
- `BALL SPEED · MULTIPLICATIVE SCALER`;
- `FRICTION / STRIKE CONDITIONS · HELD OR NOT MODELED`.

If Dynamic Loft and Attack are shown, nest them under Spin Loft.

### 5.4 S3 Myths

Keep existing prediction-before-reveal behavior. Add/confirm:

> More engine Backspin does not numerically cause more current-engine Carry.

Debrief:

> Real spin affects flight. This fitted app model currently keeps rpm output and
> flight trajectory partly decoupled.

### 5.5 S4 Mastery

Keep five tasks and mandatory live Task 5. Change the live mission description
to:

> Create 6,800–7,400 rpm and keep modeled Landing Angle at or above 50°. Both
> are gates from the final live `solveFlight()` state.

Do not say the Backspin gate causes the Landing gate.

### 5.6 S5 Result

Replace:

> You can separate spin loft from “hitting down” and control a shot's stopping
> flight in the Flightglass model.

With:

> You can build Spin Loft from delivered face and travel, then use Ball Speed
> to create a requested Backspin state in the Flightglass model.

Evidence card:

> VERIFIED
> Spin Loft components separated
> Backspin target created live
> Landing Angle gate met independently

Remove:

> Next: Launch Angle

Replace, for the active Launch, spin & descent journey:

> NEXT
> Flight Height & Descent
> Connect Ball Speed and Launch Angle to Apex, then explain modeled descent.

If a different goal is active, the primary action returns through Academy Home
with the next goal reason. No lesson-specific hardcoded route wins over the
journey router.

Replace “Back to path” with:

> RETURN TO CURRENT GOAL

### 5.7 “Stopping” language

Remove or qualify:

- stopping flight;
- stopping power;
- holds the green;
- stops faster;
- more Backspin makes this model stop.

Allowed:

- steeper modeled Landing Angle;
- smaller current roll estimate;
- real-world stopping also depends on landing speed, spin, surface, slope and
  bounce;
- current model does not calculate stopping distance.

## 6. Voice and synchronized UI

The existing screens keep their exact visual hierarchy. Voice adds brief
attention guidance, never a read-aloud.

| Trigger | Voice line | Synchronized visual |
|---|---|---|
| First S0 entry | “Backspin is an outcome. Build the face-to-travel gap, then see how Ball Speed scales it.” | Spin Loft chain highlights, then Ball Speed |
| First S1 entry | “Dynamic Loft minus Attack forms simplified Spin Loft. Ball Speed multiplies that modeled gap.” | two input wedges resolve into Spin Loft, then rpm |
| Build mission event | “The gap is larger. Check whether Ball Speed and the rpm clamp changed the final result.” | raw rpm and clamp state highlight |
| Cut mission event | “A smaller gap lowers raw rpm. The clean, centered strike assumption has not changed.” | raw rpm falls; HELD chip persists |
| S2 entry | “Spin Loft is the direct geometric lever here. Ball Speed scales it; real friction remains outside the engine.” | nested influence roles appear |
| S3 boundary reveal | “Real spin changes flight. Flightglass does not feed this Backspin number back into its current trajectory fit.” | rpm-to-flight link changes to dashed/not modeled |
| S4 live task | “Hit both gates in one live state: the Backspin window and Landing Angle of at least fifty degrees.” | two independent gate rows |
| Pass | “You built the requested Backspin state. Next, explain Apex and descent without promising stopping distance.” | Flight Height & Descent preview |

Voice contract:

- calm American female laboratory/control-room character;
- 12–24 words, about 3–8 seconds;
- first-entry autoplay once per page/signature;
- event lines once per actual mission milestone, not slider crossings;
- captions synchronized and persistent long enough to read;
- Replay always available;
- Voice Off remembered;
- autoplay suppressed with screen-reader speech;
- controls remain immediately usable and interrupt audio;
- no essential truth exists only in voice.

## 7. Information-sheet amendments

### 7.1 Spin Loft

Add:

> Dynamic Loft and Attack are equal-magnitude, opposite-sign components of the
> simplified subtraction. Dynamic Loft is not an independent extra cause after
> Spin Loft is known.

### 7.2 Ball Speed

Add:

> Ball Speed scales raw rpm, but when Club Speed is held in this engine, Spin
> Loft also changes Ball Speed through modeled Smash. The two are not fully
> independent in that comparison.

### 7.3 Engine limits

Add:

- Backspin output is not fed into current Carry/Apex/Landing equations;
- 1500/9000 rpm are display/model clamps;
- 1.8 is a 7-iron calibration coefficient;
- no friction, impact location, ball/face properties or second club preset;
- no stopping-distance model.

### 7.4 Real-world layer

Keep Wet/Flyer separate and add:

> This estimate illustrates an omitted real condition. It is not a corrected
> engine output and does not change mastery numbers.

### 7.5 Sources

Add or preserve:

- TrackMan Support, “Spin Loft”:
  `https://support.trackmangolf.com/hc/en-us/articles/39724683297051-Parameters-Spin-Loft-Tee-to-Green`
- TrackMan Support, “Spin Rate”:
  `https://support.trackmangolf.com/hc/en-us/articles/39726491252251-Parameters-Spin-Rate-Tee-to-Green`
- TrackMan Support, “Dynamic Loft”:
  `https://support.trackmangolf.com/hc/en-us/articles/39724378738203-Parameters-Dynamic-Loft-Tee-to-Green`
- TrackMan Support, “Attack Angle”:
  `https://support.trackmangolf.com/hc/en-us/articles/39724226342555-Parameters-Attack-Angle-Tee-to-Green`

If the Spin Rate URL changes before implementation, the implementation plan
must verify the current official page. External sources support definitions and
qualitative relations; not the 1.8 coefficient or clamps.

## 8. State, migration and reward contract

### 8.1 Canonical mastery

Keep canonical Backspin progress and the existing
`strikearc.academy.v1`-compatible journey record. The shared migration may wrap
it in the new curriculum registry but may not rewrite attempt/reward history.

### 8.2 Spin Loft alias

- legacy `spin-loft` completion becomes prior concept evidence inside Backspin;
- legacy `backspin` remains the canonical lesson history;
- either deep link resolves to Backspin;
- `spin-loft` never creates another card/reward;
- existing Backspin mastery dominates alias placement.

### 8.3 Grandfather fixtures

Mandatory migration fixtures:

1. Backspin mastered, prerequisites absent → remains mastered and Flight Height
   & Descent available;
2. Backspin complete below mastery → remains complete, may retry without
   relocking;
3. Spin Loft complete only → Backspin review/placement available, no silent
   mastery;
4. both old IDs complete → one canonical Backspin record/reward;
5. duplicate attempt ID → no XP/reward mutation.

### 8.4 Route resolution

The lesson returns:

- `experienceId: backspin`;
- result state;
- available destination facts.

Academy Home/goal router chooses next. Backspin renderer must not embed
`launch-angle` or any other fixed destination.

## 9. Accessibility and interaction preservation

All existing accepted requirements remain:

- ≥44 pt targets;
- DOM mirror of canvas values;
- native range semantics;
- focus trap/return;
- 200% text support;
- Reduced Motion parity;
- settled live-region announcements;
- idempotent persistence.

Voice adds:

- caption text in logical focus order;
- Replay labeled “Replay guidance”;
- Voice Off accessible toggle;
- no overlapping live-region and autoplay speech;
- no autoplay when assistive speech is active.

Voice implementation must not disturb the accepted target sizes, viewport fit or
performance budget.

## 10. Verification amendments

### 10.1 Content-truth gates

Fail if visible copy:

- gives Spin Loft a duplicate lesson/reward;
- ranks Spin Loft and its components independently;
- says Backspin output drives current Carry/Apex/Landing;
- calls the live Landing gate a Backspin-caused outcome;
- promises stopping distance or stopping flight;
- calls 1.8 or clamps physical constants;
- hides the one-preset/friction/impact-location boundary;
- hardcodes Next: Launch Angle;
- relocks existing Backspin users.

### 10.2 Route/migration tests

Test every grandfather fixture and:

- new journey order;
- selected-goal return;
- prior Backspin-complete forward route;
- Spin Loft alias;
- one reward only;
- no persisted-value loss.

### 10.3 Voice tests

- first-entry line once;
- event lines once per milestone;
- Replay;
- Voice Off persistence;
- interruption;
- screen-reader suppression;
- captions;
- no progress dependence;
- no duplicate live-region speech.

### 10.4 Regression evidence

Because voice and route/copy changes touch the STUDIO-GRADE reference, the
implementation phase must re-run:

- Backspin model/browser suites;
- Academy/UX suites;
- both native engines;
- normal/reduced visual captures at both target viewports;
- accessibility critical/serious scan;
- focused pairwise review of any visually changed S5 result;
- protected-engine hash check.

Acceptance remains gate-based. A derived score cannot offset a causal overclaim,
relocked user, wrong route or inaccessible voice behavior.

## 11. Implementation boundary

An implementation plan may make the smallest Backspin changes required for:

- curriculum registration and `spin-loft` alias;
- prerequisite/grandfather routing;
- result copy and destination;
- truth-boundary copy;
- shared voice/captions/replay hooks;
- focused tests/evidence.

It must not redesign the accepted instrument, re-tune the model, change mastery
targets, replace persistence keys, alter XP history or modify
`impact-flight.js`.

This amendment authorizes planning, not implementation.
