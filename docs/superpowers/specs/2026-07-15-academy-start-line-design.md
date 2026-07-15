# Flightglass Academy — Start Line Experience Design

**Status:** Normative design specification, 2026-07-15. Ready for an
implementation plan after the shared Academy curriculum/store migration spec
exists.

**Experience ID:** `start-line`

**Owned legacy concepts:** `face-angle`, `club-path`, `start-direction`

**Primary outcome:** Launch Direction

**Goal family:** Start line & shape

**Normative inputs:**

- `docs/superpowers/specs/2026-07-15-academy-outcome-curriculum-blueprint.md`
- `docs/FLIGHTGLASS-CLAUDE-CODE-MASTER-PLAN.md`, Phase 6
- `docs/superpowers/specs/2026-07-13-backspin-96-97-design.md`
- `impact-flight.js`
- the three legacy content records in `academy.html`

## 1. Learner promise

Teach the learner to control where the ball begins horizontally and to explain
why Face Angle normally contributes more than Club Path while the split changes
with delivered loft/impact obliqueness.

The experience succeeds only when the learner can:

1. distinguish Face Angle, Club Path and Launch Direction;
2. create a requested Launch Direction in the live model;
3. explain that the face/path split is not a fixed 75/25 law;
4. recognize Dynamic Loft as a modifier rather than a third equal steering
   input;
5. preserve a target Launch Direction after the held delivered loft changes;
6. name important current-model limits without treating them as engine inputs.

## 2. Non-goals

- Do not teach curve, Spin Axis or final Offline as co-equal outcomes. Shape and
  Shot Pattern own those jobs.
- Do not prescribe a grip, release, body alignment or swing fix.
- Do not claim that Face Angle and Club Path fully explain every real-world
  launch direction.
- Do not teach a universal 75/25 or 85/15 split.
- Do not label the low/mid/high Dynamic Loft cases as driver, iron and wedge
  simulations. The protected engine still has one 7-iron preset.
- Do not change `impact-flight.js`.

## 3. Legacy-content verdict

The legacy corpus contains useful definitions and examples but cannot ship as
the new lesson without correction.

### Retain, rewritten

- Launch Direction is the initial horizontal direction before curve.
- Face Angle and Club Path are different measurements.
- The ball launches between the modeled face and path directions and normally
  closer to face in the current domain.
- The face/path contribution changes as delivered loft/obliqueness changes.
- A matched face and path can create a straight push/pull; straight is not the
  same as on target.

### Reject from learner-facing copy

- `When in doubt, blame the face` and `fix the face first` prescriptions.
- Claims that Face Angle causes “essentially all” curve.
- Claims that Attack Angle cannot affect the real three-dimensional relation.
- Driver-versus-wedge distance claims generated from the one-preset engine.
- Swing-direction, low-point and plane coaching inside this experience.
- Tour and handicap norms that lack a directly approved source and are not
  needed for the learning objective.

### Move to later experiences

- Face-to-Path, Spin Axis and Curve → Shape.
- Carry-scaled yards and final miss → Shot Pattern.
- Plane/direction/Low Point geometry → Plane Coupling model lab.

## 4. Model and truth contract

The authoritative live value is the existing `solveFlight()` field
`startDirection`, relabelled **Launch Direction** in the UI.

Current model:

```text
faceW = clamp(0.90 − DynamicLoft × 0.005, 0.60, 0.88)
LaunchDirection = faceW × FaceAngle + (1 − faceW) × ClubPath
```

This relationship is labelled `MODEL`, not `DEFINITION`.

Positive values start right of the target line and negative values start left
under the app's current right-handed sign convention. The convention is a
visible `HELD · RH` assumption until handedness is productized elsewhere.

The primary readout is rounded to one decimal degree. Internal evaluation uses
the unrounded engine value.

### 4.1 Verified teaching fixtures

All fixtures use Attack Angle −3° and Club Speed 90 mph as held values. They do
not affect the current Launch Direction calculation.

| Case | Face | Path | Dynamic Loft | Face share | Launch Direction |
|---|---:|---:|---:|---:|---:|
| Initial guided state | 0.0° | −2.0° | 30° | 75.0% | −0.5° |
| Mission target | +2.0° | −2.0° | 30° | 75.0% | +1.0° |
| Low-loft comparison | +2.0° | −2.0° | 13° | 83.5% | +1.34° |
| High-loft comparison | +2.0° | −2.0° | 46° | 67.0% | +0.68° |
| High-loft restore | +2.5° | −2.0° | 46° | 67.0% | +1.015° |
| Matched low loft | +3.0° | +3.0° | 13° | 83.5% | +3.0° |
| Matched high loft | +3.0° | +3.0° | 46° | 67.0% | +3.0° |

The matched cases prove an important modifier rule: changing the split has no
Launch Direction effect when Face Angle equals Club Path because there is no
gap to reweight.

### 4.2 Causal-completeness inventory

| Role | Quantity | Exact lesson treatment |
|---|---|---|
| Dominant driver | Face Angle | Direct input. Current model weight is 60–88% across the allowed Dynamic Loft domain. It is not called the universal “main fault”. |
| Material driver | Club Path | Direct input. It contributes the remaining 12–40% in the current model and remains essential even when smaller. |
| Modifier | Dynamic Loft | Changes `faceW`. Its current effect depends on the Face–Path gap; it is not ranked as an independent equal steering input. |
| Held | Attack Angle, Club Speed | Visible in the model-details sheet. They do not enter the current Launch Direction formula. |
| Held | Target line, centered contact, RH sign convention | Visible assumptions, not silent defaults. |
| Not modeled | Full 3-D obliqueness coupling | Real collision nuance includes the vertical face/path relation; current horizontal taper uses Dynamic Loft alone. |
| Not modeled | Dynamic Lie | Can influence the horizontal face normal, especially with lofted clubs. |
| Not modeled | Impact location, bulge/roll, collision deflection | Material particularly for woods; no live control or hidden estimate. |

Carry is not an amplifier inside this experience. It converts an angular start
error into lateral yards later, but Launch Direction itself is defined before
that downstream distance. Shot Pattern owns that consequence.

## 5. Instrument design

Use a purpose-built top-down **departure instrument**, not the full-flight
D-plane view.

The instrument represents only the first part of flight:

- a fixed vertical target line;
- a compact clubhead/face-normal vector at impact;
- a Club Path vector through impact;
- an Ember Launch Direction ray from the ball through a target gate;
- one prior-state ghost ray after settle;
- a visible caption: `INITIAL DIRECTION · CURVE EXCLUDED`.

The ray ends at a calibrated angular ruler, not at a fake landing point. No
curved trace appears on S1 or S2. This prevents Shape from competing with the
current learning job.

The vector thickness may help show contribution, but printed contribution
values are authoritative. Any visual exaggeration is labelled `ANGLE ×2` if
needed for legibility.

### 5.1 Controls

- Face Angle and Club Path use 44 px parameter tabs and one active range input.
- Range: −10.0° to +10.0°, step 0.5°.
- Dynamic Loft is a visible held chip on S1.
- On S2, Dynamic Loft becomes a three-case selector: `LOW 13°`, `MID 30°`,
  `HIGH 46°`. These are delivered-loft cases, not club presets.
- During the restore stage, `HIGH 46°` locks and Face/Path controls reopen so
  the learner cannot solve the task by undoing the comparison.

### 5.2 Readouts

Primary truth:

- Launch Direction, signed one decimal degree.

Three supporting readouts maximum:

- Face contribution, signed one decimal degree;
- Path contribution, signed one decimal degree;
- Face share, whole percent with `MODEL` tag.

Contribution values are terms of the live equation and must sum to the
unrounded Launch Direction within floating-point tolerance.

### 5.3 Cause sentence

After 300 ms settle, compose from actual before/after states:

`Face +0.5° → face contribution +0.4° → Launch Direction +0.4°.`

For a Dynamic Loft change:

`Delivered loft 30° → 46° → face share 75% → 67% → Launch Direction +1.0° → +0.7°.`

For matched Face and Path:

`Face matches path at +3.0°. The split changed; Launch Direction stayed +3.0°.`

Do not report a causal delta that disappears only because of display rounding.
The accessible sentence may use two decimals when one-decimal rounding would
hide a real change.

## 6. Surface-by-surface specification

All visible prose counts exclude labels, values and navigation.

### S0 — Mission

**Purpose:** Define the outcome and reveal that it is a blend before asking the
learner to control it.

**Visible copy:**

```text
ACADEMY · DIRECTION
Start Line

Launch Direction is the horizontal angle the ball starts from the target line.
It does not include curve.

MISSION
Set +1.0°, then hold it when delivered loft changes.

Enter the Direction Lab
```

**Visual:** Static worked example with Face +2°, Path −2° and the Launch ray
between them. `MID 30° · HELD` is visible. Tapping any vector opens its sheet;
it does not alter the example.

**Gate:** None. The primary action enters S1.

### S1 — Direction Lab

**Purpose:** Complete a guided worked example and make the two direct causes
controllable.

**Initial state:** Face 0.0°, Path −2.0°, Dynamic Loft 30°.

**Visible copy:**

```text
BUILD +1.0°
Move Face to +2.0°. Path and delivered loft stay held.

INITIAL DIRECTION · CURVE EXCLUDED
```

The Face control begins active and its +2.0° target detent is marked. The model
and truth move continuously. When the state reaches Face +2.0°, Path −2.0° and
Launch Direction 0.95°–1.05°, stage one is credited and the learner may freely
explore both direct controls.

**Stage verdict:**

```text
TARGET HELD
Face contributed +1.5°. Path contributed −0.5°. Launch Direction is +1.0°.
```

**Forward gate:** The guided target must be reached once.

### S2 — Influence and modifier proof

**Purpose:** Show relative importance without converting a model shortcut into
a fixed law.

**Entry state:** Face +2.0°, Path −2.0°, Dynamic Loft 30°; previous +1.0° ray
becomes the single ghost.

**Visible copy before prediction:**

```text
THE SPLIT IS NOT FIXED
Face and path stay unchanged. What happens when delivered loft rises to 46°?

Starts farther right
Stays +1.0°
Moves toward path
```

Correct prediction: `Moves toward path`.

After prediction, activate `HIGH 46°`; Face share moves from 75% to 67% and
Launch Direction from +1.0° to +0.7° (displayed rounding).

**Influence roles:**

```text
Face Angle       DRIVES · larger share here
Club Path        DRIVES · smaller share here
Delivered Loft   MODIFIES · changes the split
```

Tapping Face or Path runs a current-state +0.5° A/B comparison and prints the
actual Launch Direction delta. Tapping Delivered Loft toggles the Mid/High
matched-state comparison. It never receives a fake direct percentage bar.

**Restore challenge:**

```text
RESTORE +1.0°
High delivered loft is held. Use Face or Path to rebuild the same start line.
```

Accept any final state with Dynamic Loft 46° and Launch Direction 0.95°–1.05°,
provided at least one Face/Path input changed after the High case was revealed.

After success, offer a compact invariance proof: Face +3°, Path +3°, then toggle
Low/High loft. The result stays +3.0° and the sentence says `No Face–Path gap to
reweight.` This proof is optional for progression but becomes mastery evidence
if completed.

**Forward gate:** Prediction made and restore challenge passed.

### S3 — Myths and model boundary

**Purpose:** Separate the useful face-dominant shortcut from false absolutes.

Show one prediction card at a time.

#### Experiment 1 — Path alone

```text
Face +2°, Path −2°, Mid 30°. Where does the ball start?

On the face at +2°
On the path at −2°
Between them, closer to face
```

Correct: `Between them, closer to face`.

Reveal the +1.0° engine result and the two contribution terms.

#### Experiment 2 — Fixed split

```text
Is Launch Direction always a 75/25 face–path split?

Yes, for every full shot
No. The model split changes with delivered loft
Only ball speed changes it
```

Correct: `No. The model split changes with delivered loft`.

Reveal the 13°/30°/46° model weights without attaching club names.

#### Experiment 3 — Boundary

```text
Do Face, Path and this loft taper explain every real start line?

Yes, if the strike is centered
No. Dynamic lie, impact location and full 3-D collision can also matter
Only wind is missing
```

Correct: `No...`.

Reveal `NOT MODELED` chips. Do not inject an estimate into the Launch Direction
readout.

**Forward gate:** All three experiments resolved. Correctness affects mastery
evidence but an incorrect prediction never traps the learner.

### S4 — Mastery Check

**Purpose:** Require direct control and modifier transfer without visible
worked-example targets.

The learner must score at least 4/5 and pass Task 5.

#### Task 1 — Definition

Prompt: `What does Launch Direction measure?`

Choices:

1. Where the ball finishes after curve
2. The vertical angle the ball climbs
3. The initial horizontal direction from the target line
4. The direction the clubhead travels

Correct index: 2.

Explanation: `Launch Direction is measured immediately after separation. Curve
and wind belong later in the flight.`

#### Task 2 — Direct blend

Prompt: `Face is +2.0°, Path is −2.0° and delivered loft is 30°. What does this
model return?`

Choices:

1. About +1.0°
2. Exactly +2.0°
3. Exactly −2.0°
4. 0.0°

Correct index: 0.

Explanation: `At 30° the model uses 75% Face and 25% Path: +1.5° plus −0.5° =
+1.0°.`

#### Task 3 — Modifier

Prompt: `Face and Path stay +2.0° and −2.0°. Delivered loft rises from 30° to
46°. What happens in this model?`

Choices:

1. It moves closer to Face
2. It moves toward Path because Path receives a larger share
3. It stays fixed because loft is only vertical
4. It becomes Curve

Correct index: 1.

Explanation: `The face share falls from 75% to 67%, moving Launch Direction from
+1.0° to about +0.7°.`

#### Task 4 — Boundary

Prompt: `Which factor is materially real but absent from this live Launch
Direction model?`

Choices:

1. Face Angle
2. Club Path
3. Dynamic Loft taper
4. Dynamic Lie and impact location

Correct index: 3.

Explanation: `The live model uses Face, Path and a Dynamic Loft taper. Dynamic
Lie, strike location and full collision behavior remain outside it.`

#### Task 5 — Live transfer, mandatory

Phase A generates a deterministic unseen state from a fixture pool. The learner
must create the requested Launch Direction within ±0.10° using Face and Path at
a held Mid Dynamic Loft. No target detent or contribution hints appear.

Phase B changes only held Dynamic Loft to Low or High. Before touching a
control, the learner predicts whether Launch Direction moves toward Face, stays
fixed or moves toward Path. The learner must then restore the original target
within ±0.10° by changing Face or Path.

Pass requires:

- correct direction-of-change prediction;
- a real Face/Path input change after the held-loft switch;
- final engine value inside tolerance;
- no non-finite or clamped input state.

The fixture pool must include at least one matched Face/Path case. For that
case, the correct prediction is `Stays fixed — no gap to reweight`, and the
restore phase passes without requiring a meaningless input change.

### S5 — Result

**Practiced copy:**

```text
START LINE PRACTICED
You can separate Face, Path and Launch Direction. Re-run the loft-change target
to prove transfer.
```

**Mastered copy:**

```text
START LINE MASTERED
You controlled Launch Direction and preserved it when the modeled face–path
split changed.
```

Evidence rows:

- `Direct blend` — demonstrated / review;
- `Loft modifier` — demonstrated / review;
- `Model boundary` — demonstrated / review;
- `Live transfer` — passed / retry.

The primary next recommendation is **Shape** only when Start Line is Mastered
and the active goal is Start line & shape. Otherwise the action is `Repair
Start Line`, `Continue selected goal` or `Back to Academy`. The renderer does
not hard-code a universal destination.

## 7. Information sheets

Sheets are one level deep, focus-trapped and nonessential to progression.

### 7.1 Launch Direction

```text
Launch Direction is the ball's initial horizontal direction relative to the
target line, measured immediately after it leaves the face. Positive is right
and negative is left under Flightglass's current right-handed convention. It
does not include curve, wind drift or where the ball finally lands.
```

Register: `DEFINITION`.

### 7.2 Face Angle

```text
Face Angle is where the face points horizontally at the impact location. It is
not Club Path and it is not the face's address position. In this Flightglass
model it receives the larger share of Launch Direction across the available
delivered-loft range. That does not make it a universal diagnosis or an
automatic swing prescription.
```

Register: definition plus model statement.

### 7.3 Club Path

```text
Club Path is the horizontal direction the clubhead's geometric center is moving
through impact. Positive is in-to-out and negative is out-to-in under the
current right-handed convention. Path contributes directly to Launch Direction
and later becomes equally important with Face in the Face-to-Path gap taught in
Shape.
```

Register: definition; the last sentence is a curriculum bridge.

### 7.4 Delivered Loft and the split

```text
Flightglass reduces the face share linearly as Dynamic Loft rises: about 84% at
13°, 75% at 30° and 67% at 46°. These are model weights, not universal club
rules. Real impact is three-dimensional: the full angle between face direction
and clubhead movement matters, so Attack Angle contributes to total
obliqueness even though this horizontal taper currently uses Dynamic Loft
alone.
```

Register: `MODEL` plus sourced real-world boundary.

### 7.5 Model limits

```text
The live instrument assumes centered contact, a fixed target line and the
current right-handed sign convention. It does not simulate Dynamic Lie, impact
location, driver bulge/roll, gear effect or collision-induced face movement.
The Low/Mid/High loft cases are delivered-loft comparisons inside the existing
7-iron engine, not three different club simulations.
```

Register: `HELD` and `NOT MODELED`.

### 7.6 Sources

Links:

- TrackMan Launch Direction:
  <https://support.trackmangolf.com/hc/en-us/articles/39726292309915-Parameters-Launch-Direction-Tee-to-Green>
- PING face/path launch-ratio study:
  <https://www.mdpi.com/2504-3900/2/6/249>
- TrackMan club-data measurement definitions:
  <https://www.trackman.com/blog/golf/club-data-definitions>
- TrackMan three-dimensional Spin Loft definition:
  <https://support.trackmangolf.com/hc/en-us/articles/39724683297051-Parameters-Spin-Loft-Tee-to-Green>

## 8. Voice and synchronized UI table

| Surface | Authored voice line | Synchronized screen target |
|---|---|---|
| Mission | `Start line is a blend. Face leads, path contributes, and delivered loft changes the split.` | Face and Path vectors illuminate, then the Launch ray appears between them. |
| Lab | `Move the face to plus two. Watch the launch ray settle between face and path.` | Static Face-control outline; the Launch ruler target remains emphasized. |
| Influence | `Same face, same path. More delivered loft gives path a larger share in this model.` | Mid and High share markers exchange width; no full-screen motion. |
| Myths | `Predict first. The model will separate a useful shortcut from a fixed rule.` | Prediction choices receive a static outline; no answer is pre-emphasized. |
| Mastery | `The labels are gone. Rebuild the target when the held loft changes.` | Contribution hints fade out; target gate remains. |
| Result | `You can control start line and explain when the face-path split changes.` | Mastery evidence rows resolve once; Gold is limited to earned mastery. |

Narration signatures are versioned per surface. Automatic lines play once per
signature, are suppressed under screen reader use, and always have captions and
a Replay action.

## 9. State, compatibility and rewards

Experience record:

```js
{
  experienceId: 'start-line',
  conceptIds: ['face-angle', 'club-path', 'start-direction'],
  surface: 0,
  mission: { built: false, loftRestored: false },
  myths: [false, false, false],
  optionalProofs: { matchedInvariant: false },
  masteryBest: 0,
  transferPassed: false,
  masteryAttemptId: null,
  lastSubmission: null
}
```

Compatibility mapping:

- canonical legacy owner: `start-direction`;
- concept aliases: `face-angle`, `club-path`;
- idempotent reward key: `academy.experience.start-line`;
- existing records for all three legacy IDs remain untouched;
- any prior completion among the three may seed `Practiced`, never Mastered;
- new Mastery does not silently award three legacy lesson rewards;
- Academy, not the renderer, owns reward amount, badges, progression and the
  compatibility projection required by the shared migration spec.

Persist mission stages, resolved myths, optional proof, mastery-attempt creation
and final submission. Do not persist live slider values on every input.

## 10. Accessibility, motion and haptics

- Canvas/SVG geometry is `aria-hidden`; the equation terms, held assumptions
  and Launch Direction are mirrored in DOM.
- The model receives an updated accessible sentence after settle, not on every
  input frame.
- Face/Path tabs use roving tabindex; ranges use native input semantics and
  signed `aria-valuetext`.
- The loft selector is a radio group with `Low delivered loft, 13 degrees`,
  etc.; it never announces club names.
- Prediction choices are keyboard-operable radio groups.
- Sheets trap focus, close on Escape/swipe/Close and restore focus.
- Reduced motion removes ray interpolation, share-width tweening and ghost
  decay; final values and static before/current rays remain.
- Haptics: whole-degree detent tick, target acquisition light, prediction
  verdict light, mastery success notification. Navigation has none.
- At 200% text scale the hero value, active control and primary action remain
  available; supporting contributions may collapse into a sheet.

## 11. Failure and edge states

- **Non-finite model result:** retain last valid ray/value, announce `Model
  could not update`, and award no mission/mastery evidence.
- **Canvas unavailable:** render the same vectors and angular ruler as inline
  SVG plus DOM values.
- **Local storage failure:** keep session progress in memory and allow the
  lesson to finish; show a nonblocking `Progress will not persist` status.
- **FaceW clamp:** the current S1/S2 loft cases remain inside the unclamped
  linear range. A future wider slider must show `MODEL LIMIT` when 0.60 or 0.88
  is reached.
- **Rounded-zero delta:** accessible/cause text increases precision rather than
  saying `no change` when raw output changed.
- **Matched Face and Path:** modifier delta correctly resolves to zero and is
  explained as invariance, not a broken control.
- **Restored legacy route:** old `#/lesson/face-angle`, `club-path` and
  `start-direction` routes redirect to Start Line with a concept-focus hint;
  they do not render three duplicate native experiences.
- **Existing Backspin next CTA:** it must not route to Start Line directly; all
  next recommendations come from Academy journey logic after the shared
  migration.

## 12. Verification contract

### 12.1 Pure model-adapter tests

- The seven fixtures in Section 4.1 match `solveFlight()` within `1e-9` before
  display rounding.
- Face contribution plus Path contribution equals Launch Direction.
- `faceW` is 0.835 at 13°, 0.75 at 30° and 0.67 at 46°.
- Face +3° / Path +3° remains +3° across the available Dynamic Loft range.
- Dynamic Loft changes no Launch Direction when Face equals Path.
- Mission target and restore tolerance use raw values, not rounded text.
- Protected `impact-flight.js` hash is unchanged.

### 12.2 Browser behavior tests

- All six surfaces fit at 430×932 and 375×812 in normal and reduced motion.
- Lab always shows hero, departure instrument, active control and `HELD 30°`.
- No curved/landing trajectory appears on Lab or Influence.
- S1 cannot credit before the learner changes Face and reaches the target.
- S2 does not reveal the loft result before a prediction.
- Restore cannot be solved by changing Dynamic Loft back to Mid.
- Matched-state proof reports zero modifier effect without error.
- Mastery 4/5 without Task 5 is Practiced; Task 5 plus at least 4/5 is Mastered.
- Correct answer positions are not uniform.
- No target is below 44 px; no horizontal overflow or console/page error.
- Keyboard-only completion and sheet focus restoration pass.
- Reload restores credited stages without duplicate XP/reward.
- Screen-reader mode suppresses automatic narration but preserves captions.

### 12.3 Content-truth tests

Reject the build if visible copy contains:

- `Start Direction` as the learner-facing output name;
- an unlabeled universal `75/25` or `85/15` claim;
- `fix the face first`, `blame the face` or technique prescription;
- club labels attached to the 13°/30°/46° model cases;
- a claim that Attack Angle is irrelevant to real 3-D collision physics;
- curve, offline or landing presented as part of Launch Direction;
- Dynamic Lie or impact-location estimates blended into the engine value.

### 12.4 Acceptance evidence

- zero critical defects;
- all Academy/instrument critical checks pass;
- every category floor clears independently;
- pairwise-blind win against the three legacy article lessons;
- normal/reduced screenshots inspected at both portrait targets;
- compatibility fixture proves no loss of existing XP, completion or badges;
- derived score recorded only as a byproduct.

## 13. Implementation boundary

The implementation plan may add a pure Start Line adapter/controller and reuse
the native shell, shared formatting, journey and trace-state assets. It must not
copy Backspin's trajectory visualization, change the protected flight solver,
or implement the old three lessons separately.

Shared Academy curriculum/store migration must land first. Start Line is the
first new experience after that migration because it validates:

- multi-concept ownership;
- outcome-led navigation;
- a non-trajectory instrument;
- driver/material/modifier roles;
- a mandatory modifier transfer task;
- goal-derived Result routing.

