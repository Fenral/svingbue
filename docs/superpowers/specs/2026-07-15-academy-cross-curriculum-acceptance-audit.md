# Flightglass Academy — Cross-Curriculum Acceptance Audit

**Date:** 2026-07-15

**Status:** Specification acceptance review

**Decision:** PASS for sequential implementation planning; NOT production acceptance

**Scope:** the outcome-led Academy blueprint, 13 core experiences, one optional
MODEL LAB, Backspin compatibility, common native behavior, migration and the
current deterministic physics engines

**Out of scope:** production implementation, runtime visual acceptance, device
testing, pairwise preference results and changes to protected physics files

---

## 1. Decision and meaning

The planned curriculum passes the cross-experience specification gate. It has
one owner for every legacy concept, no contradictory prerequisite, no known
double-counted causal input and an explicit boundary wherever the current app
uses a fitted model or a first-order estimate.

This decision authorizes writing and executing one-experience implementation
plans in the order named in Section 15. It does **not** assert that any unbuilt
experience is production-ready. Production acceptance still requires fresh
runtime evidence for every mandatory gate in Section 16.

The decision is gate-based:

| Gate | Result | Evidence |
|---|---:|---|
| All 24 legacy IDs have exactly one owner | PASS | Section 3 and automated ownership reconciliation |
| Each core experience has one dominant learner job | PASS | Section 4 |
| Current-engine equations have one instructional owner | PASS | Section 5 |
| No known causal double-counting remains | PASS | Section 6 |
| Prerequisites form an acyclic, previewable graph | PASS | Section 7 |
| Names do not overclaim the current model | PASS | Section 8 |
| Common S0–S5, voice and accessibility contracts reconcile | PASS | Section 9 |
| Each core experience has a mandatory live-transfer gate | PASS | Section 10 |
| Legacy progress and reward invariants are explicit | PASS | Section 11 |
| Production acceptance evidence exists | NOT YET APPLICABLE | Requires implementation and device verification |

No aggregate score may override a failed critical row.

---

## 2. Audited artifact set

The review covers:

- `2026-07-15-academy-outcome-curriculum-blueprint.md`;
- Start Line, Shape and Carry Side specifications;
- Up or Down at Impact, Low Point and Contact Height specifications;
- the optional Plane Coupling MODEL LAB specification;
- Delivered Loft & Launch and Flight Height & Descent specifications;
- the Backspin curriculum amendment together with the accepted Backspin base
  design and reference-lesson plan;
- Speed Transfer and Carry specifications;
- Air Density and Wind specifications.

Inventory result:

| Item | Count | Required | Result |
|---|---:|---:|---:|
| Core outcome experiences | 13 | 13 | PASS |
| Optional advanced model labs | 1 | 1 | PASS |
| Owned legacy concept IDs | 24 | 24 | PASS |
| Duplicate concept owners | 0 | 0 | PASS |
| Orphaned concept IDs | 0 | 0 | PASS |
| New experience specs with S0–S5 | 13 | 13 | PASS |
| Declared voice lines | 99 | — | audited |
| Voice lines outside 12–24 words | 0 | 0 | PASS |

Backspin keeps its accepted base S0–S5 implementation and uses an amendment
rather than pretending it is an unbuilt experience.

---

## 3. Exact concept-ownership reconciliation

Ownership means responsibility for the primary definition, interaction,
assessment and legacy migration. Reuse elsewhere is a dependency or preview,
not a second owner.

| Experience | Learner-visible title | Owned legacy IDs | Count |
|---|---|---|---:|
| `start-line` | Start Line | `face-angle`, `club-path`, `start-direction` | 3 |
| `shape` | Shape | `spin-axis`, `curve` | 2 |
| `shot-pattern` | Carry Side | `offline` | 1 |
| `attack-at-impact` | Up or Down at Impact | `attack-angle` | 1 |
| `low-point` | Low Point | `low-point` | 1 |
| `strike-depth` | Contact Height | `strike-depth` | 1 |
| `plane-coupling-lab` | Plane Coupling | `plane-coupling` | 1 |
| `delivered-loft-launch` | Delivered Loft & Launch | `dynamic-loft`, `launch-angle` | 2 |
| `backspin` | Backspin | `spin-loft`, `backspin` | 2 |
| `flight-height-descent` | Flight Height & Descent | `apex`, `landing-angle` | 2 |
| `speed-transfer` | Speed Transfer | `club-speed`, `smash`, `ball-speed` | 3 |
| `carry` | Carry | `carry`, `total` | 2 |
| `air-density` | Air Density | `altitude`, `temperature` | 2 |
| `wind` | Wind | `wind` | 1 |
| **Total** |  |  | **24** |

The following terms may appear in more than one experience but retain one
owner:

- Face Angle and Club Path are owned by Start Line, then reused as the
  Face-to-Path comparison in Shape.
- Attack Angle is owned by Up or Down at Impact, then used as an input in Low
  Point, Delivered Loft & Launch and Backspin.
- Dynamic Loft is owned by Delivered Loft & Launch, then reused in Backspin and
  as the modifier of Start Line weighting.
- Carry is owned by Carry, then reused as the distance scale in Carry Side,
  Wind and the Air Density estimate layer.
- Apex and Landing Angle are owned together by Flight Height & Descent even
  when another lesson previews their downstream movement.

---

## 4. One dominant learner job per experience

| Experience | Dominant question | Required proof, not article recall |
|---|---|---|
| Start Line | Why did the ball begin on that line? | Construct one start outcome from different Face/Path contributions and account for loft-dependent weighting. |
| Shape | Why did it bend, and which way? | Hold start nearly fixed while producing opposite Spin Axis and Curve. |
| Carry Side | How can start and bend combine at the carry plane? | Separate start displacement, curve and final Carry Side in one trace. |
| Up or Down at Impact | Was the club moving up or down at impact? | Produce ascending and descending delivery from the geometry, without an Attack slider. |
| Low Point | Where is the modeled bottom relative to the ball? | Produce ball-first/bottom-after and bottom-first/bottom-before sequences. |
| Contact Height | How can vertical arc placement change modeled contact? | Move Contact Height while Attack remains invariant. |
| Plane Coupling | Why can plane and direction move effective Low Point? | Explore exchange rates in a clearly optional MODEL LAB; no mastery is awarded. |
| Delivered Loft & Launch | Why did the ball leave at that vertical angle? | Produce equal Launch from materially different Dynamic Loft/Attack deliveries. |
| Backspin | What creates launch spin in this model? | Reach a Backspin window and a separate Landing Angle gate through Spin Loft and Ball Speed. |
| Flight Height & Descent | Why can equal height return differently? | Produce equal Apex with materially different descent and delivery states. |
| Speed Transfer | How does club speed become ball speed here? | Produce equal Ball Speed from different Club Speed/Smash combinations. |
| Carry | What moves engine Carry, and what does it omit? | Produce equal Carry with different trajectories and illustrative Total. |
| Air Density | How does the same engine shot change in different air? | Freeze impact/launch outputs while creating a large EST Carry contrast. |
| Wind | How does a wind vector move the same launch result? | Freeze the engine shot while decomposing along-line Carry and cross-line drift. |

No two rows ask for the same transfer. The progression moves from cause
isolation to outcome integration rather than repeating 24 article topics.

---

## 5. Current physics graph and instructional ownership

### 5.1 Truth-register vocabulary

- `DEFINITION`: a declared quantity or exact arithmetic relationship.
- `MODEL`: a deterministic fitted or illustrative relationship in the protected
  current engine.
- `EST`: a post-solve, first-order conditions estimate outside the flight
  engine.
- `REAL-WORLD`: explanatory context that the app does not calculate.
- `MODEL LIMIT`: a visible clamp, omitted dependency or boundary that changes
  how a displayed value may be interpreted.

Every numeric display must carry the register required by its owning spec. A
visually realistic trajectory never upgrades a `MODEL` or `EST` value into a
measurement.

### 5.2 Lateral chain

The exact current relationships are:

```text
faceW = clamp(0.90 − 0.005 × DynamicLoft, 0.60, 0.88)
LaunchDirection = faceW × FaceAngle + (1 − faceW) × ClubPath
FaceToPath = FaceAngle − ClubPath
SpinAxis = clamp(1.5 × FaceToPath, −38°, +38°)
Curve = clamp(Carry² × SpinAxis / 12000, −0.60 × Carry, +0.60 × Carry)
StartDisplacement = Carry × sin(LaunchDirection)
CarrySide = StartDisplacement + Curve
```

| Relationship | Register | Primary owner | Boundary |
|---|---|---|---|
| Face/Path blend → Launch Direction | MODEL with sourced directional premise | Start Line | Face weight changes with Dynamic Loft and clamps. |
| Face − Path → Face-to-Path | DEFINITION | Shape | It is a comparison, not a third independent input. |
| Face-to-Path → Spin Axis | MODEL | Shape | Clamp ±38°; gear effect, impact location and full 3-D effects omitted. |
| Spin Axis + Carry → Curve | MODEL | Shape | Curve is bend only and scales quadratically with Carry. |
| Start displacement + Curve → Carry Side | MODEL | Carry Side | A deterministic endpoint is not a dispersion pattern. |

### 5.3 Vertical, spin and speed chain

```text
SpinLoft = DynamicLoft − AttackAngle
LaunchAngle = 0.62 × DynamicLoft + 0.25 × AttackAngle
Smash = clamp(1.46 − 0.004 × SpinLoft, 1.15, 1.42)   // current 7-iron preset
BallSpeed = ClubSpeed × Smash
Backspin = clamp(abs(SpinLoft) × BallSpeed × 1.8, 1500, 9000)
Carry = 0.232 × BallSpeed^1.389 / (1 + (BallSpeed / 210)^6)
ApexLaunchFactor = clamp(0.35 + 0.65 × (LaunchAngle / 18), 0.45, 1.35)
Apex = 44 × (1 − exp(−BallSpeed / 85)) × ApexLaunchFactor
LandingRaw = 45
  + 0.5 × (SpinLoft − 25)
  + 0.6 × (LaunchAngle − 14)
  + 1.0 × (Apex − 30)
LandingAngle = clamp(LandingRaw, 32, 60)
RollFraction = clamp(0.04 − 0.0015 × (LandingAngle − 45), 0.012, 0.055)
IllustrativeTotal = Carry + Carry × RollFraction
```

| Relationship | Register | Primary owner | Boundary |
|---|---|---|---|
| Dynamic Loft/Attack → Launch | MODEL | Delivered Loft & Launch | Coefficients are sensitivities, not percentages. |
| Dynamic Loft − Attack → Spin Loft | 2-D DEFINITION/approximation | Backspin | Full 3-D Spin Loft also depends on horizontal delivery. |
| Spin Loft → Smash | MODEL | Speed Transfer | Ratio is not energy percentage or centeredness diagnosis. |
| Club Speed × Smash → Ball Speed | DEFINITION over modeled Smash | Speed Transfer | Club Speed is a measured speed, not itself “energy.” |
| Spin Loft × Ball Speed → Backspin | MODEL | Backspin | Friction, ball, grooves, moisture and impact location omitted; rpm clamp visible. |
| Ball Speed → Carry | MODEL | Carry | Current Carry ignores Launch Angle and Backspin. That omission is taught, not hidden. |
| Ball Speed + Launch → Apex | MODEL | Flight Height & Descent | Clamp may flatten Launch sensitivity. |
| Spin Loft + Launch + Apex → Landing | MODEL | Flight Height & Descent | Apex is a mediator; Landing clamps at 32°/60°. |
| Carry + descent-derived roll → Total | MODEL | Carry | Total is illustrative; there is no turf, slope or green model. |

The current engine computes Backspin but does not feed that rpm value back into
Carry, Apex or Landing Angle. A lesson may explain real aerodynamic relevance
only inside a clearly separated REAL-WORLD layer.

### 5.4 Geometry chain

```text
perDegree = Radius × cos(PlaneAngle) × π / 180
EffectiveLowPointX = LowPointX − SwingDirection × perDegree
thetaAtImpact = asin(clamp(−EffectiveLowPointX / Radius, −0.999, 0.999))
AttackAngle = vertical angle of the arc tangent returned by deriveImpact(...)
ContactHeight = LowPointZ
  + Radius × (1 − cos(thetaAtImpact)) × sin(PlaneAngle)
```

| Relationship | Register | Primary owner | Boundary |
|---|---|---|---|
| Tangent at impact → Attack | rigid-circle MODEL | Up or Down at Impact | Not a measured real swing or coaching prescription. |
| Effective Low Point X → sequence | rigid-circle MODEL | Low Point | Plane/direction coupling remains visible but secondary. |
| Low Point Z → Contact Height | rigid-circle MODEL | Contact Height | It is club-path height at ball X, not face strike location or literal divot depth. |
| Plane/direction → Effective Low Point | MODEL LAB | Plane Coupling | Optional until independently validated; no core reward. |

Vertical translation changes Contact Height but does not change the tangent and
therefore does not change modeled Attack Angle. The curriculum deliberately
assesses this invariance.

### 5.5 Conditions chain

Air Density uses one combined mediator:

```text
AltitudeFactor = 1 − 0.03 × (AltitudeFeet / 1000)
TemperatureFactor = 288.15 / (273.15 + TemperatureC)
DensityProxy = AltitudeFactor × TemperatureFactor
AirMultiplier = 1 + 0.70 × (1 − DensityProxy)
EstimatedCarry = EngineCarry × AirMultiplier
EstimatedApex = EngineApex × AirMultiplier
```

Wind uses one vector decomposition after the engine solve. Positive headwind is
internal headwind; negative headwind is tailwind. Positive crosswind means wind
from the left and therefore positive/right drift for the right-handed sign
convention.

```text
HeadMultiplier(h) = max(0.40, 1 − (0.0001h² + 0.009h))       when h ≥ 0
TailMultiplier(t) = 1 + (0.008t − 0.0001t²)                 when t = abs(h), h < 0
Exposure = 1
  + clamp((LaunchAngle − 14) / 40, 0, 0.60)
  + clamp((SpinLoft − 25) / 140, 0, 0.35)
EstimatedWindCarry = EngineCarry × HeadTailMultiplier
WindDrift = Crosswind × EstimatedWindCarry / 300 × Exposure
FirstOrderWindSide = EngineCarrySide + WindDrift
```

| Relationship | Register | Primary owner | Boundary |
|---|---|---|---|
| Altitude + Temperature → density proxy | EST | Air Density | Not a full atmospheric density calculation; humidity is not numeric. |
| Density proxy → Carry/Apex multiplier | EST | Air Density | Impact and launch ledgers remain frozen. |
| Head/tail component → Carry | EST | Wind | First-order post-solve adjustment, not integrated aerodynamics. |
| Cross component → drift | EST | Wind | Does not change Spin Axis or engine Curve. |
| Engine Carry Side + wind drift → endpoint | EST composition | Wind | Both layers must be visible so wind does not erase the shot's own lateral result. |

---

## 6. Double-counting prohibitions

These are critical implementation laws. A violation fails content-truth
acceptance even if the screen looks polished.

1. **Face and Path:** Face-to-Path is calculated from Face minus Path. Do not
   add it as a third independent cause of Launch Direction or Shape.
2. **Launch Direction:** Dynamic Loft changes the Face/Path weight. Do not add
   a second standalone Dynamic-Loft steering term.
3. **Spin Loft:** Spin Loft already contains Dynamic Loft and Attack Angle. Do
   not show all three as independent additive backspin causes.
4. **Ball Speed:** Ball Speed is Club Speed multiplied by Smash. Do not add a
   separate “strike bonus” on top of that product.
5. **Smash language:** Smash is a speed ratio. Do not call `1.36` “136% energy
   transfer,” and do not infer impact centeredness the model cannot see.
6. **Carry:** Do not reintroduce the legacy launch/spin-window bonus. The
   protected current Carry equation consumes Ball Speed only.
7. **Apex/Landing:** Apex already carries Ball Speed and Launch effects into
   Landing Angle. Do not repeat those contributions as unnamed speed/height
   bonuses.
8. **Backspin:** The rpm output is not an input to current Carry/Apex/Landing.
   Never narrate a same-speed flight change as if the protected engine solved
   Magnus lift from rpm.
9. **Total:** Roll is already part of Total. Never present Carry, Roll and Total
   as three additive independent outcomes.
10. **Air:** Altitude and Temperature combine through one DensityProxy. Do not
    apply separate completed multipliers and then apply a density multiplier
    again.
11. **Wind:** A wind vector is decomposed into components. Do not apply full
    wind magnitude to Carry and again to drift.
12. **Lateral endpoint:** Engine Carry Side already equals start displacement
    plus Curve. Wind adds drift to that endpoint; it must not recalculate or
    replace either engine term.
13. **Geometry:** Low Point Z changes Contact Height. It does not get a second
    hidden Attack modifier.
14. **Progress:** A merged experience has one mastery and one reward. Old
    constituent completions cannot award it multiple times.

---

## 7. Prerequisite and journey audit

All experiences are previewable. Prerequisites gate only mastery entry, or may
be bypassed by an explicit placement challenge. The router uses stored evidence
and goal journeys; no lesson renderer owns a universal `next` pointer.

| Experience | Mastery prerequisite | Preview | Migration exception |
|---|---|---:|---|
| Start Line | none | always | none |
| Shape | Start Line | always | prior legacy evidence may offer placement |
| Carry Side | Start Line + Shape | always | prior `offline` remains Practiced evidence |
| Up or Down at Impact | none | always | none |
| Low Point | Up or Down at Impact | always | legacy completion never relocks old access |
| Contact Height | Low Point | always | legacy completion becomes prior evidence |
| Plane Coupling | Low Point + Contact Height; Shape recommended | always | optional, never a core gate |
| Delivered Loft & Launch | Up or Down at Impact | always | legacy records preserved |
| Backspin | Delivered Loft & Launch + Up or Down for new guided journeys | existing demo remains open | mastered users are grandfathered and never relocked |
| Flight Height & Descent | Delivered Loft & Launch + Backspin | always | grandfathered Backspin satisfies its prerequisite |
| Speed Transfer | none | always | none |
| Carry | Speed Transfer | always | legacy Carry/Total become evidence, not auto-mastery |
| Air Density | Carry | always | old Altitude/Temperature access/history preserved |
| Wind | Carry + Carry Side | always | old Wind access/history preserved |

The graph is acyclic. Its three independent entry points—Start Line, Up or Down
at Impact and Speed Transfer—prevent a forced linear course. Goal journeys may
recommend one branch without rewriting the physics graph.

---

## 8. Naming and claim audit

| Internal or legacy term | Learner-visible decision | Reason |
|---|---|---|
| `start-direction` | Launch Direction inside Start Line | Uses the launch-monitor term while Start Line remains the experience job. |
| `shot-pattern` / `offline` | Carry Side | One deterministic shot is not a dispersion pattern; signed side at the carry plane is precise. |
| `attack-angle` | Up or Down at Impact | Leads with meaning before the technical parameter name. |
| `strike-depth` | Contact Height | Current value is path height at the ball, not literal depth into turf or face impact location. |
| `dynamic-loft` | Delivered Loft | Distinguishes impact loft from the stamped club loft. |
| `spin-loft` | Embedded in Backspin | First-class mechanism, not a duplicate experience. |
| `apex` + `landing-angle` | Flight Height & Descent | Describes modeled airborne outcomes without claiming stopping distance. |
| `smash` | Smash ratio inside Speed Transfer | Prevents “power score” and centered-strike overclaiming. |
| `total` | Illustrative Total inside Carry | Current rollout lacks turf, slope and green state. |
| `altitude` + `temperature` | Air Density | Both act through one estimated atmospheric mediator. |
| `plane-coupling` | Plane Coupling · MODEL LAB | Makes uncertainty and optional status visible. |

“Stopping Power” is prohibited as an experience title or numeric promise.
Landing Angle may be discussed as one contributor to stopping potential only
with the omitted ball, turf, slope, moisture and landing-spin dependencies.

---

## 9. Shared native lesson contract

### 9.1 Surface roles

Every new core experience uses the same six-role grammar without forcing the
same picture or instrument:

| Surface | Required role |
|---|---|
| S0 Mission | one outcome problem, learner promise, relevance and a single primary action |
| S1 Lab | congruent live instrument; direct manipulation with truth ledger |
| S2 Influence | visual proof of dominant/material/modifier relationships |
| S3 Myths | boundary cases, common false inference and explicit not-modeled state |
| S4 Mastery | five tasks; 4/5 knowledge threshold plus mandatory live transfer |
| S5 Result | evidence earned, what remains limited and journey-routed next action |

The optional Plane Coupling lab may use the visual grammar but cannot write core
mastery, XP or prerequisite completion.

### 9.2 Voice and synchronized screen

- Voice is an event layer, not a narration of every paragraph.
- A line plays once for a new content signature, not on every revisit or focus
  movement.
- The synchronized visual target changes, highlights or reveals while the line
  explains it; the screen is not decorative karaoke.
- All 99 declared voice lines are 12–24 words after the wording audit.
- An experience has at most eight authored signatures: no more than one
  automatic entry cue per surface plus rare first-time Consequence/Recovery
  cues for genuinely new instrument evidence.
- Automatic cues never queue behind rapid manipulation or speak over one
  another.
- Caption/transcript and Replay are available for every line.
- Muted preference persists globally; the app never resets it at a new lesson.
- Screen-reader reading and Academy voice do not compete; narration is
  suppressed or explicitly coordinated when assistive speech is active.
- Voice failure never blocks controls, content or mastery.
- Future voice variants must share stable semantic cue IDs; they cannot fork
  assessment wording or physics claims.

### 9.3 Native and accessibility invariants

- This is a native packaged application only. No web product, responsive web
  route or network service is planned.
- Target portrait viewports are 430×932 and 375×812 including safe areas.
- Minimum interactive target is 44×44 CSS pixels.
- Canvas/SVG communicates interpretation only; exact values, labels and state
  exist in accessible DOM.
- Keyboard and switch users can complete every task and receive deterministic
  focus return from sheets.
- Text scaling to 200% preserves the outcome and primary action; undersized
  fallbacks may scroll.
- Reduced motion removes trace flight and decorative transitions while
  preserving before/after evidence.
- Color is never the sole sign or pass/fail channel.
- At most two trace ghosts may coexist.
- No remote runtime dependency is required for curriculum, physics or voice
  fallback.

---

## 10. Live-transfer gate ledger

Knowledge recall alone cannot award mastery. Each core experience has one
mandatory state-building or state-comparison gate.

| Experience | Mandatory live evidence | Critical anti-cheat/near miss |
|---|---|---|
| Start Line | Build the specified Launch Direction from distinct Face/Path contributions while the relevant loft condition is active. | Moving only one memorized slider or missing the loft-modifier state does not pass. |
| Shape | Hold Launch Direction at approximately +1.0° while producing a clear left and right Curve in separate captures. | Correct bend without the same-start constraint fails. |
| Carry Side | Capture a shot that starts to one side, bends the other way and reaches the required signed Carry Side. | Matching final side without visibly separating start and bend fails. |
| Up or Down at Impact | Use arc geometry to capture one descending and one ascending impact. | A direct Attack slider is prohibited; labels alone cannot pass. |
| Low Point | Capture ball-first/bottom-after and bottom-first/bottom-before sequences. | Merely changing Contact Height without the sequence change fails. |
| Contact Height | Change Contact Height through vertical arc placement while the displayed Attack value remains invariant. | A capture with materially changed Attack fails the invariance gate. |
| Delivered Loft & Launch | Create two deliveries around the same 18.4–18.8° Launch window with at least a 10° Spin-Loft gap and opposite attack signs. | Equal Launch without the materially different hidden flight state fails. |
| Backspin | Complete 4/5 knowledge tasks, reach the specified 6,800–7,400 rpm window and separately satisfy Landing Angle ≥50°. | The rpm clamp or a single lucky final state cannot substitute for both stages. |
| Flight Height & Descent | Create two shots around the same 31.3–31.7 yd Apex, one below 50° and one above 54° Landing, with ≥6° Landing and ≥8° Spin-Loft separation. | Same Apex alone fails; clamp-only artifacts and identical-speed duplicates fail. |
| Speed Transfer | Create equal 130.56 mph Ball Speed with materially different Club Speed and Smash states. | Treating Smash as a percent or using the same input state twice fails. |
| Carry | Create equal approximately 174.25 yd Carry with different trajectory and Illustrative Total states. | Reintroducing a launch/spin Carry bonus or matching Total instead of Carry fails. |
| Air Density | Keep the complete engine shot unchanged while two air states produce at least a 25 yd estimated Carry gap. | Any changed impact/launch engine field fails the frozen-shot gate. |
| Wind | Keep the engine shot unchanged while two wind vectors produce the required distinct estimated Carry/side endpoints. | Replacing Engine Carry Side with wind drift or mutating Spin Axis fails. |

Plane Coupling has exploration challenges and evidence capture but deliberately
has no mastery gate, reward or core completion event.

---

## 11. State, migration and reward audit

### 11.1 Storage invariants

- Keep `strikearc.academy.v1` and `strikearc.academy.nudge`.
- Preserve all legacy lesson objects, completion flags, attempts, quiz history,
  XP, badges and timestamps.
- Add outcome-experience state without rewriting historical records.
- Migration must be deterministic and idempotent across repeated app launches.
- Content-version migration and route alias resolution are separate from
  reward issuance.
- Voice enabled/muted, preferred variant and played cue signatures are global
  preference/state, not embedded independently in every experience.

### 11.2 Evidence conversion

- A completed legacy concept grants prior `Practiced` evidence to its owning
  outcome experience.
- It does not automatically prove the new live transfer.
- Where all concepts of a merged experience are legacy-complete, the experience
  becomes `reviewEligible` and may offer a shortened review path.
- The shortened path still contains the live gate.
- Existing accepted Backspin native mastery is the sole grandfathered mastery
  exception.
- Grandfathered users are never relocked when new Backspin prerequisites are
  introduced.
- Plane Coupling legacy completion becomes exploration history only.

### 11.3 Reward invariants

- One core experience awards at most one mastery reward.
- Reward issuance uses an idempotent experience-attempt ID and a separate
  reward ledger.
- Constituent legacy records never cause multiple merged-experience rewards.
- Mastery count uses 13 core experiences, not 24 legacy concept records.
- Plane Coupling never blocks Academy completion or adds a hidden 14th core
  requirement.
- Historical XP and rank never decrease.
- Before reward amounts or rank thresholds change, fixtures must prove maximum
  reachable rank for both a fresh profile and a migrated high-XP profile.

### 11.4 Navigation invariants

- Every old concept deep link resolves to its owner experience or owned concept
  sheet.
- Restored partial progress returns to the last valid surface/state.
- The Academy Home offers one dominant `Continue`, `Repair` or `Start` action
  based on stored evidence.
- Lesson renderers do not hardcode the old Altitude → Wind → Temperature chain
  or any other global `next` chain.

---

## 12. Cross-experience contradiction findings

### 12.1 Corrected before acceptance

The following issues were identified in the legacy curriculum or early design
and are explicitly corrected by the specifications:

1. Face Angle and Club Path are inputs inside outcome experiences, not two
   isolated compulsory article modules.
2. Dynamic Loft is material to Launch Direction because it changes face/path
   weighting; it is not falsely presented as equally important to Face Angle.
3. Carry no longer teaches a launch/spin “optimal window” bonus absent from the
   protected engine.
4. Backspin no longer claims that current-engine rpm changes Carry at fixed Ball
   Speed.
5. Smash is a speed ratio, not a percentage-energy score or a pure impact-
   quality diagnosis.
6. Contact Height replaces the misleading learner term “Strike Depth” and
   states what the geometry actually measures.
7. Illustrative Total no longer presents course rollout as a solved outcome.
8. Air Density combines Altitude and Temperature so the same air effect is not
   taught twice.
9. Humidity is removed as a numeric current-estimate control.
10. Wind preserves the engine's existing Carry Side before adding Wind Drift;
    the old rendering's wind-only endpoint is not carried forward.
11. Landing Angle is not renamed Stopping Power.
12. Plane Coupling is removed from the compulsory core until its model premise
    is independently validated.

### 12.2 Remaining intentional model limits

These are not contradictions if displayed exactly as specified:

- a 7-iron-only Smash/Backspin preset;
- 2-D Spin Loft inside a world where the full real quantity is three-
  dimensional;
- no impact-location, gear-effect, friction, groove, moisture or ball model;
- Carry driven only by Ball Speed;
- fitted Apex and Landing relationships rather than integrated aerodynamics;
- illustrative roll without turf/slope/green conditions;
- density proxy rather than full meteorology;
- first-order wind adjustment rather than wind-aware ball flight;
- rigid-circle swing geometry rather than a measured human swing.

Each limit has a named owner and must appear before or at the moment a learner
could otherwise form the false inference.

---

## 13. Specification-gate matrix

All experience specs were checked against the blueprint's 15-part gate.

| Requirement | Cross-curriculum result | Implementation consequence |
|---|---:|---|
| Unique learner promise and non-goals | PASS | Preserve one dominant job per batch. |
| Owned/reused concepts and prerequisites | PASS | Use the exact mapping in Section 3. |
| Exact current-engine dependency map | PASS | Import protected solvers; do not duplicate constants. |
| Influence-role inventory | PASS | Render rank as dominant/material/modifier/etc., not equal bars. |
| Truth register for every output | PASS | Register labels are required content, not optional badges. |
| S0–S5 copy roles and sheet inventory | PASS | Implement copy from the owning spec verbatim before editorial changes. |
| Congruent S1/S2 interaction | PASS | S2 must prove the same relationship manipulated in S1. |
| Five tasks plus mandatory transfer | PASS for 13 core | Optional lab remains deliberately non-mastery. |
| Voice line + synchronized visual target | PASS | Semantic cue IDs precede audio production. |
| Failure, clamp and unavailable states | PASS | These need deterministic fixture coverage. |
| Accessibility and reduced-motion behavior | PASS | Category floor; cannot be offset by visual quality. |
| Deterministic verification requirements | PASS | Each batch produces model/browser/migration/content evidence. |
| Evidence sources and claim limits | PASS | Source changes require content review, not casual copy edits. |
| Legacy ID and reward mapping | PASS | Shared store migration lands before experiences. |
| No unresolved contradiction | PASS | Critical laws are centralized in Sections 5–6. |

Backspin's accepted base spec plus the curriculum amendment jointly satisfy the
gate. The amendment must not fork its solver or erase existing acceptance
evidence.

---

## 14. Implementation-risk register

| Risk | Severity | Required control |
|---|---:|---|
| Shared shell/store built ad hoc inside the first experience | Critical | Land Home/store mapping as its own first batch with Backspin regression coverage. |
| Formula constants duplicated in renderers | Critical | Import solver outputs and breakdown fields from the single source of truth. |
| Legacy progress or XP lost | Critical | Golden migration fixtures before and after repeated migration. |
| Old deep links break | High | Alias table and route tests for all 24 IDs. |
| Voice becomes repetitive or blocks use | High | Content signatures, Replay, global mute, failure-safe text path. |
| Visual animation implies unsupported physics | High | DOM truth ledger and reduced-motion state must remain complete. |
| Carry reintroduces false launch/spin causality | Critical | Fixture asserts equal Ball Speed → equal current Carry across contrasting launch states. |
| Backspin copy implies rpm drives current flight | Critical | Content-truth test and fixed-speed solver fixture. |
| Wind discards engine lateral displacement | Critical | Endpoint fixture asserts `EngineCarrySide + WindDrift`. |
| Air applies Altitude and Temperature twice | Critical | One DensityProxy assertion and frozen engine ledger. |
| Plane Coupling silently affects core completion | Critical | No reward/mastery/prerequisite writes; store snapshot test. |
| “Total” is mistaken for predicted course distance | High | Always show `Illustrative Total` plus model-limit sheet. |
| Batch prompt implements multiple experiences | High | One experience per plan, after shared shell batch. |
| Web architecture expands scope | High | Native packaged runtime only; no parallel web product. |

---

## 15. Authorized sequential rollout

Each numbered row is a separate implementation batch and acceptance decision.
Failure in one batch stops dependent batches but does not erase already accepted
independent work.

1. Academy Home, shared experience registry, progress migration, voice event
   contract and Backspin shell regression.
2. Start Line.
3. Shape.
4. Carry Side.
5. Up or Down at Impact.
6. Low Point.
7. Contact Height.
8. Delivered Loft & Launch.
9. Backspin compatibility amendment.
10. Flight Height & Descent.
11. Speed Transfer.
12. Carry.
13. Air Density.
14. Wind.
15. Plane Coupling optional MODEL LAB.

No implementation prompt may introduce more than one new experience. Shared
shell changes remain in Batch 1 and require accepted Backspin regression before
Batch 2 begins.

---

## 16. Production acceptance contract

For each implemented core experience, acceptance requires all rows below.
Evidence is per experience; a later polished screen cannot compensate for an
earlier failed critical gate.

| Category | Required evidence | Stop condition |
|---|---|---|
| Runtime | No uncaught error; all S0–S5 routes and restore states open | any critical runtime failure |
| Physics | Fresh exact model fixtures, printed rounding and clamp tests | formula drift or false dependency |
| Content truth | Required/forbidden claim scan plus human content review | unsupported causal claim |
| Mastery | 4/5 rule, mandatory transfer, near misses and retry behavior | recall-only completion possible |
| State | partial restore, legacy migration and duplicate reward fixtures | progress/XP loss or double reward |
| Accessibility | keyboard/switch path, semantic values, focus return, 200% text | essential action or truth unavailable |
| Motion | normal and reduced-motion evidence | reduced motion removes evidence |
| Viewports | 430×932 and 375×812 screenshots for key states | clipped primary action/outcome |
| Preference | pairwise-blind comparison against legacy article lesson | new experience does not win |
| Integrity | byte identity of protected physics files | protected engine changed in Academy batch |
| Ledger | committed status entry with exact evidence paths | unverifiable handoff |

The production decision is `accepted` only when every relevant row passes with
fresh evidence. Otherwise it remains `executing` or is explicitly escalated
with the smallest blocking decision.

---

## 17. Final audit verdict

**Status: specification accepted for implementation planning.**

Acceptance criteria:

- [x] 24/24 legacy concepts reconcile exactly once.
- [x] 13 core experiences and one optional lab have distinct learner jobs.
- [x] Physics, pedagogy and goal-journey graphs remain separate.
- [x] Exact current equations and their truth registers have named owners.
- [x] Critical double-counting and overclaiming rules are explicit.
- [x] Prerequisites are acyclic, previewable and migration-safe.
- [x] Every core experience requires live transfer beyond quiz recall.
- [x] Shared native, voice and accessibility behavior is consistent.
- [x] Legacy history, XP, rewards and deep links have explicit invariants.
- [x] Remaining model limits are visible rather than silently “fixed” in copy.
- [x] The rollout order isolates shared infrastructure and one experience per
  later implementation batch.

Open risks:

- no unbuilt experience has runtime, device, pairwise-preference or assistive-
  technology evidence yet;
- shared Home/store migration and reward reachability still need their own
  implementation-ready specification and fixtures;
- voice audio production and future voice variants are product-cost decisions,
  while semantic cue design is part of the current plan;
- Plane Coupling remains optional pending independent physical validation.

Need human input: **none for continuing the planning program**. Human approval
is required later only for production deployment, destructive migration, new
billing/security posture or a material change to the accepted product direction.
