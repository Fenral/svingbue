# Flightglass Academy Outcome Curriculum Blueprint

**Status:** Normative curriculum decision under owner-authorized autonomous
planning, 2026-07-15.

**Scope:** Academy information architecture, the disposition of all 24 legacy
concept IDs, common lesson behavior, truth boundaries, learning progression and
the specification inventory required before Claude Code implementation.

**Implementation status:** Design only. This document authorizes no production
code or golf-physics change.

## 1. Decision

Flightglass Academy becomes **outcome-led, not outcome-only**.

The current registry contains 24 technical topics. They are valuable as a
physics vocabulary and compatibility layer, but they must not automatically
become 24 learner-visible lessons. The final portfolio is 13 core learning
experiences plus one optional advanced model lab. Backspin is already the
production reference experience; the other 13 experiences require their own
approved plan/spec pairs before implementation.

The operating principle is:

> Simplify the order in which the learner meets the physics. Never simplify
> away a material cause, coupling, assumption or model limit.

Every legacy topic receives exactly one primary curriculum owner. A concept may
reappear as an input or prior knowledge in later experiences, but it is never
double-counted as a second independent cause or a second completion reward.

## 2. Why the registry cannot remain the curriculum

The legacy registry mixes four different things:

1. measured club-delivery inputs, such as Face Angle and Attack Angle;
2. derived relationships, such as Spin Loft and Spin Axis;
3. ball-flight outcomes, such as Launch Direction and Carry;
4. environmental estimate layers, such as Altitude and Wind.

Presenting all four categories as equal lesson cards creates predictable
failures:

- the golfer is asked to care about a parameter before seeing its consequence;
- related lessons reuse the same controls and diagram with a renamed hero;
- component variables are ranked beside their own composite and double-counted;
- app-model heuristics are easily described as universal golf laws;
- the path becomes a technical catalogue instead of a learning journey.

The new architecture preserves the physics graph but makes the learner enter
through a question about ball behavior, contact or a measured consequence.

## 3. Locked vocabulary

The following terms have distinct meanings throughout all plans and code:

- **Concept:** one technical legacy topic or supporting physical quantity.
- **Experience:** one learner-visible, six-surface Academy unit with one
  dominant question and one mastery decision.
- **Outcome:** the primary measured or modeled result the learner controls or
  explains. It may be a ball result, contact result or delivery result.
- **Goal journey:** a recommended sequence of experiences for a user intent.
- **Physics graph:** causal relations among concepts. It never defines locks.
- **Prerequisite graph:** what must be understood before a later mastery check.
- **Journey graph:** what Academy recommends next for a selected goal.

The learner-visible term is **Launch Direction**. The legacy phrase `Start
Direction` remains only in compatibility IDs and old stored data. The
experience title is **Start Line**.

The learner-visible goal family is **Launch, spin & descent**, not “stopping”.
Flightglass currently models landing angle but not turf response or actual
stopping distance.

## 4. Final portfolio and complete legacy mapping

Every current registry ID appears exactly once in the `Owned legacy IDs`
column. Reuse in later experiences is an instructional dependency, not new
ownership.

| Family | Experience ID and title | Owned legacy IDs | Dominant learner question | Disposition |
|---|---|---|---|---|
| Start line & shape | `start-line` — **Start Line** | `face-angle`, `club-path`, `start-direction` | Why did the ball begin on that line? | One core outcome experience. Face and path remain named inputs; Dynamic Loft/obliqueness is a visible coupling. |
| Start line & shape | `shape` — **Shape** | `spin-axis`, `curve` | Why did it bend, and which way? | One core experience. Face-to-Path is the mechanism; Spin Axis is the mediator; Curve is the outcome. |
| Start line & shape | `shot-pattern` — **Carry Side** | `offline` | How can a shot start one way and reach the carry plane somewhere else? | Core integration experience combining Launch Direction and Curve. “Shot Pattern” remains an internal curriculum label only because one deterministic shot is not a dispersion pattern. |
| Strike & contact | `attack-at-impact` — **Up or Down at Impact** | `attack-angle` | Was the club moving up or down at impact? | Separate core experience. It teaches the measured delivery result before Low Point geometry. |
| Strike & contact | `low-point` — **Low Point** | `low-point` | Where is the bottom of the modeled arc relative to the ball? | Separate core geometry experience. It owns ball-first/turf-first sequence in the rigid-circle model. |
| Strike & contact | `strike-depth` — **Contact Height** | `strike-depth` | How does vertical arc placement change modeled path height at the ball without changing Attack? | Core outcome experience. “Strike Depth” remains the internal label; Contact Height is explicitly a point-path model, not measured face impact or literal divot depth. |
| Strike & contact | `plane-coupling-lab` — **Plane Coupling** | `plane-coupling` | Why can plane and swing direction move the effective Low Point? | Optional advanced **MODEL LAB**, not a core journey gate, until independently validated. |
| Launch, spin & descent | `delivered-loft-launch` — **Delivered Loft & Launch** | `dynamic-loft`, `launch-angle` | Why did the ball leave at that vertical angle? | One core experience. Dynamic Loft dominates; Attack Angle is material but smaller in the app model. |
| Launch, spin & descent | `backspin` — **Backspin** | `spin-loft`, `backspin` | What creates launch spin, and how can the model change it? | Existing reference experience. Spin Loft is embedded here instead of receiving a duplicate lesson. |
| Launch, spin & descent | `flight-height-descent` — **Flight Height & Descent** | `apex`, `landing-angle` | What makes a shot climb and return steeply or shallowly? | One core trajectory experience. It labels both outputs as fitted model results and never promises stopping distance. |
| Speed & distance | `speed-transfer` — **Speed Transfer** | `club-speed`, `smash`, `ball-speed` | How does club speed become ball speed in this model? | One core energy experience. Smash is “modeled transfer efficiency”, never a pure strike-quality score. |
| Speed & distance | `carry` — **Carry** | `carry`, `total` | What moves carry in this engine, and what can it not predict? | One core, deliberately narrow experience. Total is an illustrative roll extension, not a course prediction. |
| Playing conditions | `air-density` — **Air Density** | `altitude`, `temperature` | How does thinner or denser air change the same engine shot? | One core dual-register estimate experience. Impact outputs remain immutable. |
| Playing conditions | `wind` — **Wind** | `wind` | How does wind move the same launch result through the air? | One core dual-register estimate experience separating wind drift from Spin Axis curve. |

This produces **13 core experiences**, including the completed Backspin
reference, and **one optional advanced model lab**. The count is a consequence
of coherent learning jobs, not a target.

## 5. Rejected portfolio alternatives

### 5.1 Keep Face Angle and Club Path as separate lessons

Rejected for the core journey. Both parameters gain meaning through Launch
Direction and Face-to-Path. Separate compulsory lessons would repeat the same
top-down instrument and create conflicting “fix this first” coaching claims.
They remain individually named, controllable and defined inside Start Line and
Shape, and may have concept sheets in Explore the physics.

### 5.2 Make one giant “ball direction” lesson

Rejected. Launch Direction, Spin Axis/Curve and final Offline are different
causal jobs. Combining all three would violate the one-dominant-job law and
hide the important fact that a shot may start nearly on line and still curve
far offline.

### 5.3 Give Spin Loft another full lesson

Rejected. Backspin already teaches, manipulates and assesses Spin Loft. A
second full lesson would duplicate Dynamic Loft and Attack Angle controls.
Spin Loft remains a first-class concept and exact model relationship inside
Backspin, with a bridge from Delivered Loft & Launch.

### 5.4 Call Flight Height & Descent “Stopping Power”

Rejected. Landing angle is relevant to stopping potential, but actual stopping
depends on spin at landing, turf, slope, moisture, ball and strike conditions
that Flightglass does not solve. The real-world sheet may explain the relation;
the instrument and mastery may not promise stopping distance.

### 5.5 Keep Total Distance as a standalone outcome

Rejected until a credible rollout model exists. The present total calculation
is Carry plus an illustrative landing-angle-derived roll fraction and has no
turf model. It belongs as a clearly labelled extension inside Carry.

## 6. The three graphs

No implementation may derive one graph implicitly from another.

### 6.1 Physics graph

The physics graph describes current app dependencies and must label each edge
as `DEFINITION`, `MODEL` or `EST`.

Core lateral chain:

`Face Angle + Club Path + loft-dependent weighting → Launch Direction`

`Face Angle − Club Path → Face-to-Path → Spin Axis (MODEL) → Curve (MODEL)`

`Launch Direction + Curve + Carry → Offline (MODEL)`

Core vertical/energy chain:

`Dynamic Loft + Attack Angle → Launch Angle (MODEL)`

`Dynamic Loft − Attack Angle → Spin Loft (2-D approximation)`

`Spin Loft → Smash (MODEL)`

`Club Speed × Smash → Ball Speed`

`Spin Loft × Ball Speed → Backspin (MODEL)`

`Ball Speed → Carry (MODEL)`

`Ball Speed + Launch Angle → Apex (MODEL)`

`Spin Loft + Launch Angle + Apex → Landing Angle (MODEL)`

`Carry + illustrative roll fraction → Total (MODEL)`

Geometry chain:

`Low Point X + plane/direction coupling → Attack Angle (rigid-circle MODEL)`

`Low Point Z/depth → contact height and turf interaction (MODEL)`

Environment chain:

`Altitude + Temperature → density ratio → Carry/Apex EST layer`

`Wind vector → Carry/Drift EST layer`

The physics graph must not claim dependencies the engine does not implement.
In particular: Backspin does not move current engine Carry; Temperature does
not move Ball Speed; wind does not change Spin Axis; vertical arc height does
not change derived Attack Angle or numerically drive Smash.

### 6.2 Pedagogical prerequisite graph

All experiences may be previewed. Prerequisites gate only the mastery check or
may be bypassed by an explicit placement challenge.

- Start Line: none.
- Shape: Start Line.
- Carry Side (`shot-pattern`): Start Line + Shape.
- Up or Down at Impact: none.
- Low Point: Up or Down at Impact.
- Contact Height (`strike-depth`): Low Point.
- Plane Coupling lab: Low Point + Contact Height; Shape is recommended context,
  not a hard prerequisite.
- Delivered Loft & Launch: Up or Down at Impact.
- Backspin: Delivered Loft & Launch + Up or Down at Impact for new guided
  journeys. The existing Backspin demo remains previewable and completed users
  are never relocked.
- Flight Height & Descent: Delivered Loft & Launch + Backspin.
- Speed Transfer: none.
- Carry: Speed Transfer.
- Air Density: Carry.
- Wind: Carry + Carry Side for mastery; either may be previewed first.

### 6.3 Goal-journey graph

Academy Home asks for one honest goal and gives one dominant Start/Continue/
Repair action with a human-readable reason.

- **Start line & shape:** Start Line → Shape → Carry Side.
- **Strike & contact:** Up or Down at Impact → Low Point → Contact Height.
- **Launch, spin & descent:** Up or Down at Impact → Delivered Loft & Launch →
  Backspin → Flight Height & Descent.
- **Speed & distance:** Speed Transfer → Carry.
- **Playing conditions:** Carry → Air Density, and Carry + Carry Side → Wind.

Plane Coupling appears only under **Explore the physics** after the learner has
the required geometry context. It is never necessary to complete a core goal.

Recommendation is deterministic from selected goal, mastery state and
prerequisites. Diagnose-driven personalization is excluded until it can name
the exact evidence and reason for its recommendation.

## 7. Causal-completeness contract

Every experience specification must inventory seven roles before writing UI
copy:

1. **Dominant driver:** normally moves the outcome most over a stated realistic
   range.
2. **Material driver:** clearly changes the outcome but is normally smaller.
3. **Modifier:** changes how another cause acts; it is not a competing direct
   cause.
4. **Gate:** can enable, suppress or cap an effect.
5. **Amplifier:** does not create the effect but grows its consequence.
6. **Held:** fixed assumption during the current experiment.
7. **Not modeled:** material real-world influence outside the live model.

Importance has two registers:

- **Generally in this model:** influence over a declared, plausible domain.
- **For this shot:** local output change from the current state.

No unlabeled universal percentage is allowed. Influence comparisons across
different units use documented meaningful sweeps, not a raw “one unit each”
ranking. The UI shows actual outcome deltas. Example:

`Face +1.0° → Launch Direction +0.75° · FOR THIS SHOT · MODEL`

Composite causes may be decomposed but never double-counted. Backspin may rank
Spin Loft and Ball Speed; it may not rank Spin Loft, Dynamic Loft and Attack
Angle as three independent drivers. Dynamic Loft and Attack Angle are shown as
the components of Spin Loft.

### 7.1 Launch Direction correction

Start Line must not teach a fixed 75/25 law. The current engine computes a
Dynamic-Loft-dependent face weight, producing approximately 84/16 at 13°,
75/25 at 30° and 67/33 at 46°. That is an app-model taper, not universal
collision physics.

The deeper relation follows total three-dimensional impact obliqueness. Attack
Angle contributes through the vertical face/path gap, while Dynamic Lie,
impact location and clubhead geometry can also matter in real golf. The current
horizontal weighting does not solve all of those effects. Start Line therefore
shows Dynamic Loft as a material modifier, labels the live split `MODEL`, and
lists the other factors as held/not modeled.

## 8. Truth-register contract

Every number, causal sentence, visual layer and voice line has exactly one
truth register:

| Label | Meaning | Allowed treatment |
|---|---|---|
| `DEFINITION` | A definition or exact identity within the displayed quantities. | May use `=` when actually exact. |
| `MODEL` | Output or relationship from a Flightglass solver, including fitted and clamped formulas. | Authoritative for the instrument; never universalized. |
| `≈ REAL WORLD` | Sourced external range, benchmark or rule of thumb. | Must show `≈`, source access and “not the simulator/model” language. |
| `HELD` | Input or condition intentionally fixed for the experiment. | Must remain visible whenever its value materially controls interpretation. |
| `NOT MODELED` | Material factor absent from the current solver. | May explain limits; may never silently alter an engine readout. |

The learner must be able to distinguish these registers without relying only
on color. Ember remains the primary live truth; Violet describes model
structure; estimate layers are dashed and explicitly tagged.

No copy may convert a fitted coefficient, clamp or heuristic into a law of golf.
No sourced real-world layer may feed a mastery target unless the task explicitly
assesses the distinction between model and estimate.

## 9. Content and learning sequence

The legacy articles are retained as an internal source corpus. They are not a
requirement to show every paragraph in the shipped app. Physics depth is
preserved through staged interaction, precise sheets and mastery; prose volume
is not preserved for its own sake.

Each experience follows the Backspin six-surface grammar, with visualization
and learning action adapted to the concept:

### S0 — Mission

- Name the golfer-facing question and why it matters.
- Show one unambiguous worked example or before/after state.
- One primary action enters the instrument.
- No more than one new technical term without an inline definition.

### S1 — Lab

- Begin with guided manipulation, not unsupported discovery.
- Keep primary outcome, active control and congruent model visible together.
- Show at most three supporting readouts.
- All material held variables appear as `HELD` chips.
- A settled change produces one exact cause sentence from the actual states.

### S2 — Influence

- Answer “what matters most, what matters less, and why?”
- Compare actual deltas for this shot and identify driver/modifier/gate roles.
- Use matched pairs, decomposition, invariance or layer comparison when bars
  would misrepresent the concept.
- Let the learner run one compact A/B proof.

### S3 — Myths and boundaries

- Require a prediction before revealing evidence.
- Correct one high-value misconception and one model-boundary misconception.
- Vary answer positions and response structures.
- Never turn the surface into a list of true/false statements.

### S4 — Mastery Check

Five scored tasks use worked-example fading:

1. identify or define the primary outcome;
2. predict a direct cause;
3. reason about a modifier, gate or held variable;
4. distinguish MODEL from REAL WORLD/NOT MODELED;
5. solve an unseen live target or comparison.

Mastery requires at least 4/5 **and** a passed live transfer task. A learner who
scores 4/5 but fails the transfer task is `Practiced`, not `Mastered`.

### S5 — Result

- Name the demonstrated ability, not merely the score.
- Show Practiced or Mastered and the evidence behind it.
- XP/rank is secondary.
- Recommend the next experience from the active goal journey and current
  prerequisites; never hard-code a universal next lesson in a renderer.

Visible prose remains at or below 50 words per surface, excluding control labels
and live values. One-level information sheets may contain the depth required
for accuracy, but no sheet reading is required to operate the instrument or
earn mastery. Essential instructions never require internal scrolling at the
two target viewports.

## 10. Voice and synchronized screen behavior

Narration is optional, local-first and supplementary. The target character is a
calm American female laboratory/control-room voice: concise, observant and
technically confident, never theatrical or conversationally needy.

Each experience specification provides at most one **automatic entry line** for
each surface, selected from four jobs. A surface may additionally own a
first-time Consequence or Recovery cue when the learner reveals a genuinely new
relationship inside the instrument. These event cues are not page narration:
they share the same once-per-signature suppression and never fire merely
because a control moved.

- **Orient:** name the new question.
- **Cue:** direct attention to one control or comparison.
- **Consequence:** state what the just-observed change proved.
- **Recovery:** help after inactivity or a repeated failed attempt.

Voice rules:

- 12–24 words and normally 3–8 seconds per line;
- no more than eight authored cue signatures per experience, including its six
  possible surface-entry cues;
- never start a second automatic line while another line is speaking, and do
  not queue stale cues after rapid manipulation;
- play only on first entry to content with a new narration signature;
- do not replay on backward navigation, restore or unchanged revisits;
- provide a visible Replay control and persistent captions;
- never speak an essential fact that is absent from the screen/accessible DOM;
- suppress automatic narration while VoiceOver or another screen reader is
  active; captions remain;
- reduce frequency as the learner demonstrates competence;
- no cloud generation or runtime token dependency is required for the first
  voice set; future voice packs are a separate product decision.

One synchronized visual event may accompany a line: a control outline, a
contribution connector or an outcome trace emphasis. It may not animate the
whole screen. Reduced motion replaces movement with a static emphasis state.

## 11. Visualization families

The six-surface shell is shared; the instrument is not.

| Instrument family | Experiences | Required visual job |
|---|---|---|
| Top-down D-plane | Start Line, Shape, Carry Side | Separate face, path, launch vector, axis/curve and carry-side outcome without displaying all as equal at once. |
| Side-on delivery wedge | Up or Down at Impact, Delivered Loft & Launch | Show vertical club travel, face orientation and ball launch as distinct vectors. |
| Arc/contact window | Low Point, Contact Height, Plane Coupling | Keep the ball, modeled arc, low point and point-path/ground-plane consequence spatially coherent without implying a face/sole collision. |
| Spin instrument | Backspin | Existing engine-driven spin-loft and trajectory instrument remains the reference. |
| Energy transfer ledger | Speed Transfer | Show Club Speed → modeled efficiency → Ball Speed without implying impact-location simulation. |
| Trajectory profile | Flight Height & Descent, Carry, Air Density | Keep the baseline/current trace and outcome rulers authoritative; estimate layers remain dashed. |
| Wind vector field | Wind | Preserve an immutable engine shot, then show head/tail and crosswind EST displacement as a separate layer. |

S2 Influence is deliberately not one universal bar component. Start Line needs
a contribution split under loft changes; Shape needs matched face/path pairs;
Carry Side needs start-versus-bend decomposition; Contact Height needs an
invariance proof; Air Density and Wind need baseline-versus-estimate layers.

## 12. Academy Home behavior

Academy Home becomes a goal-led coach, not the complete physics graph at rest.

At first use:

1. choose one of the five goal families;
2. show one recommended starting experience and the reason;
3. preview the current milestone and next two only;
4. keep **Explore the physics** as a secondary destination containing the full
   14-experience constellation and concept sheets.

At return:

- one dominant `Continue`, `Repair` or `Start` action;
- reason based only on stored evidence (`Mastered prerequisite`, `Transfer task
  not yet passed`, `Next step in Start line & shape`);
- `Not started`, `Practiced` and `Mastered` are explicit text/icon states;
- XP, level and badges remain visible but secondary to mastery;
- completed users are never relocked by a curriculum migration.

The constellation represents experiences. Legacy concepts appear inside an
experience detail sheet, not as 24 equal destinations.

## 13. Compatibility and progress migration

The storage keys `strikearc.academy.v1` and `strikearc.academy.nudge` remain
unchanged. All 24 legacy lesson records and their XP, quiz history, badge and
completion data are preserved.

Implementation may add an optional `experiences` object under the existing
Academy store. It must not recompute or reduce historical XP.

Migration rules:

- existing native Backspin mastery remains Mastered;
- a completed legacy article lesson grants `Practiced` evidence to its owner
  experience, never automatic transfer mastery;
- an owner experience becomes Mastered only after its new live transfer task
  passes, except Backspin whose existing native transfer result remains valid;
- legacy badges and unlocks are never revoked;
- merged experience rewards require an idempotent experience attempt ID and a
  separate reward ledger so old constituent completions cannot award twice;
- the implementation plan must prove that the maximum reachable rank remains
  reachable for both a fresh profile and a migrated high-XP profile before
  changing any reward amounts or rank thresholds.

Mastery count uses core experiences, not the legacy 24-topic denominator.
Plane Coupling is displayed separately as an advanced lab and never blocks core
completion.

## 14. Shared non-functional contract

- Native package only; no web-product compatibility work is required beyond
  the existing packaged HTML runtime.
- Portrait targets: 430×932 and 375×812, including safe areas.
- Minimum target: 44×44 CSS pixels.
- Input-to-model p95 below 16.7 ms on the supported native runtime.
- Mono tabular numerals for all truth values; U+2212 minus.
- At most two trace ghosts; reduced motion disables them.
- Full keyboard/switch parity and deterministic focus return from sheets.
- Canvas is interpretation only; all truth and state are mirrored in DOM.
- Text scaling to 200% retains the primary action and outcome; an undersized
  fallback may scroll, but target viewports may not hide essential content.
- No new image, remote dependency, Supabase, OpenAI or runtime network need.
- No production physics file changes inside Academy rollout tasks.

## 15. Specification acceptance gate

An individual experience is not ready for a Claude Code implementation plan
until its design spec contains all of the following:

1. unique learner promise and non-goals;
2. owned/reused concepts and prerequisite contract;
3. exact current-engine dependency map;
4. dominant/material/modifier/gate/amplifier/held/not-modeled inventory;
5. truth register for every displayed output;
6. exact S0–S5 visible copy roles and sheet inventory;
7. congruent Lab and S2 proof interaction;
8. five mastery tasks with mandatory live transfer;
9. one-line-per-surface voice table and synchronized visual target;
10. failure, empty, clamp and unavailable-model states;
11. accessibility, reduced-motion and target-viewport behavior;
12. deterministic model, browser, migration and content-truth tests;
13. evidence sources and claim limits;
14. explicit legacy ID and reward mapping;
15. no unresolved contradiction with another experience.

## 16. Implementation acceptance gate

Each implemented experience must independently pass:

1. zero critical runtime, content, physics or accessibility defects;
2. all critical evidence-manifest checks;
3. every category floor individually;
4. pairwise-blind preference against the legacy article lesson;
5. fresh model fixtures proving all printed values and rounding;
6. 430×932 and 375×812 normal/reduced-motion screenshot inspection;
7. keyboard-only and screen-reader-semantic completion;
8. partial-progress restore and duplicate-reward protection;
9. byte identity for protected physics engines;
10. a committed status-ledger entry with exact evidence paths.

A derived score is a byproduct and never overrides a critical failure.

## 17. Spec and rollout inventory

The autonomous planning program must produce the following durable artifacts:

1. this shared curriculum blueprint;
2. three direction-family experience specs: Start Line, Shape, Carry Side
   (canonical ID `shot-pattern`);
3. four strike/contact specs: Up or Down at Impact, Low Point, Contact Height
   (canonical ID `strike-depth`),
   optional Plane Coupling model lab;
4. two new launch/flight specs: Delivered Loft & Launch, Flight Height &
   Descent, plus a Backspin compatibility amendment rather than a redesign;
5. two speed/distance specs: Speed Transfer, Carry;
6. two conditions specs: Air Density, Wind;
7. one Academy Home and progress-migration spec;
8. one sequential Claude Code implementation plan/index referencing every
   experience plan/spec pair and its acceptance evidence.

No batch implementation prompt may contain more than one new experience. Shared
shell refactoring is its own preceding task with regression coverage for
Backspin.

Recommended implementation order after all planning is complete:

1. shared curriculum/store mapping and Academy Home migration;
2. Start Line;
3. Shape;
4. Carry Side;
5. Up or Down at Impact;
6. Low Point;
7. Contact Height;
8. Delivered Loft & Launch;
9. Backspin compatibility amendment;
10. Flight Height & Descent;
11. Speed Transfer;
12. Carry;
13. Air Density;
14. Wind;
15. optional Plane Coupling model lab.

The sequence validates one visualization family at a time where possible and
keeps known physics-boundary experiences (Carry, environment, Plane Coupling)
behind the experiences needed to explain their limits.

## 18. Evidence foundation

Primary and official references include:

- TrackMan Launch Direction definition and face-versus-path statement:
  <https://support.trackmangolf.com/hc/en-us/articles/39726292309915-Parameters-Launch-Direction-Tee-to-Green>
- TrackMan Spin Loft three-dimensional definition and two-dimensional
  approximation:
  <https://support.trackmangolf.com/hc/en-us/articles/39724683297051-Parameters-Spin-Loft-Tee-to-Green>
- TrackMan club-data measurement and impact-location definitions:
  <https://www.trackman.com/blog/golf/club-data-definitions>
- PING experimental study of face/path launch ratios and their loft/obliqueness
  trend:
  <https://www.mdpi.com/2504-3900/2/6/249>
- Worked-example sequencing for novice learning:
  <https://doi.org/10.1016/j.cedpsych.2010.10.004>
- Retrieval-practice transfer meta-analysis:
  <https://doi.org/10.1037/bul0000151>

Per-experience specs must narrow this list to sources that directly support
their claims. Existing article copy, tour anecdotes and internal Wolfram notes
are leads to verify, not automatically approved learner-facing evidence.

## 19. Definition of curriculum-planning complete

Academy planning is complete only when:

- every artifact in Section 17 exists;
- all 24 legacy IDs reconcile exactly once against Section 4;
- every experience passes the specification gate in Section 15;
- a cross-experience audit finds no contradiction, double-counted cause,
  missing model limit or orphaned prerequisite;
- the handoff names exact files, implementation order, tests and stop
  conditions;
- `docs/flightglass-autopilot/STATUS.md` and `docs/SESSION-HANDOFF.md` point to
  the final artifact set;
- no production code or protected physics output changed during planning.
