# Flightglass Impact: calmer information architecture

## Assignment

Redesign the information architecture around `impact.html` so a golfer never
has to edit an input, decode a camera, scan a full report, and compare shots in
the same glance. Preserve the deterministic live model; change the presentation
and hierarchy, not the physics.

The intended result is a native-feeling instrument: calm at rest, immediate
while changing an input, and deep only when a golfer asks for detail.

## Evidence from the current implementation

`impact.html` currently places all of these in one viewport:

- a live flight canvas with annotations;
- permanent Carry and Pin comparison controls;
- three camera/data stations (`TOP`, `SIDE`, `OUTCOME`);
- five editable inputs (speed, face, path, attack, dynamic loft);
- one expanded slider; and
- thirteen outcome metrics across Direction, Launch, and Distance.

That makes four different jobs compete: **change**, **see**, **read**, and
**compare**. It also contradicts the product IA in
`docs/FLIGHTGLASS-CLAUDE-CODE-MASTER-PLAN.md`: Range owns experimentation,
Outcome is read-only, and Compare is a separate task.

Keep these product truths intact:

- Range inputs: club speed, club face, club path, attack angle, dynamic loft.
- Outcome metrics: Direction (launch direction, spin axis, curve, side),
  Launch (launch angle, spin loft, backspin, landing angle), and Distance
  (smash, ball speed, carry, total, apex).
- Studio uses a separate geometry model (swing plane, swing direction, ball
  position, arc height). It cannot numerically hand a shot to Range: that
  mapping is not validated.

## Selected direction: one shot, four local states

Use the shared **bottom navigation** — Home / Range / Studio / Guide — as the
only global navigation. It must remain visible and reserve its safe-area space,
including in landscape Studio. Range should align with that shared shell; do
**not** add a global destination for data, comparison, or camera views. The
following are local Range states that preserve the exact same model state.
Studio remains a separate global destination; its right rail is only for local
Perspective, Iron / Driver, and Strike controls.

| Surface | One question it answers | What is visible at rest | What moves elsewhere |
| --- | --- | --- | --- |
| **Range — Shot** | “What did this shot do?” | Carry hero at upper left, one plain-language shot conclusion, the trace, and no editing dock. | Input controls, full metrics, and comparison. |
| **Range — Change** | “What happens if I change this?” | The same live state, a compact five-input selector, and exactly one expanded slider. | Full metric report and permanent comparison chrome. |
| **Range — Details** | “Which measurements support that answer?” | One opened group at a time: Direction, Launch & spin, or Distance. Read-only. | Sliders and a second canvas dashboard. |
| **Range — Compare** | “What changed against my reference?” | Current shot, one named pinned reference, and the three largest meaningful deltas. | A persistent ghost and Pin FAB over every live shot. |
| **Studio — Geometry** | “Where does the club interact with the ground and ball?” | Geometry canvas, selected geometry control, Attack/Path/low-point truth; a dedicated Strike contact view is one rail action away. | Carry, ball flight, spin, and a false numerical handoff to Range. |

### The primary Range flow

`Home → Range — Shot → Change → Range — Change → Details → Range — Details`

Comparison is optional: `Pin current shot → Range — Compare`. It should never
be an always-present task competing with the live model.

`Flight`, `Direction`, and `Launch` are **camera lenses of the same Range
state**, not routes with separate models. They live inside Range — Change and
can be switched with a compact three-choice control or a horizontal swipe with
visible button parity.

## Screen contracts

### 1. Range — Shot (the default)

This is the read-first screen: the landing place after Home and after an edit
has settled.

- **Hero:** Carry remains the permanent large value on the left, as an explicit
  owner requirement. Pair it with one short, plain-language flight statement,
  for example: `Starts 7 m right → curves 12 m left.`
- **Canvas:** the trace is dominant. Show only the annotations needed by the
  current flight. Do not lay a metric board or an editing dock over it.
- **Supporting proof:** show at most two small measurements that substantiate
  the conclusion. Carry must not be duplicated inside another metric card.
- **Primary action:** `Change input` opens Range — Change; `Details` opens
  Range — Details. Both are intentional navigation, never simultaneous panels.

### 2. Range — Change (the only edit-first screen)

- **Input deck:** keep all five inputs reachable and legible, but expand only
  one at a time. Use five compact, labelled selectors with 44 px targets; the
  selected input owns the one large slider below.
- **Live proof:** while a slider is being moved, surface no more than two
  contextual result deltas below the control. Examples: Face → launch direction
  and curve; Path → launch direction and curve; Attack/Loft → launch angle and
  spin loft; Speed → ball speed and Carry.
- **Return action:** `Done` returns to Range — Shot with the updated live
  conclusion. It is not a fourth panel layered on the canvas.

### 3. Range camera lenses (inside Change, not another dashboard)

- **Flight:** 3D trace and Carry. It answers the whole-shot question.
- **Direction:** top-down view. Face and Path are the relevant local pair;
  show target line, launch direction, and curvature geometry.
- **Launch:** side view. Attack and Dynamic Loft are the relevant local pair;
  show launch, apex, and landing geometry.
- The five-value input selector remains the sole shared control system. Do not
  clone sliders for each lens.
- The selected input gets one hero visual element at full strength. Everything
  else becomes quiet supporting geometry, not another label.

### 4. Range — Details (read-only, progressive depth)

Start with a conclusion, not a directory of numbers.

1. **Shot statement:** one sentence naming the result and its dominant cause.
2. **Three headline readouts:** Carry, start line/side, and curve or launch,
   chosen by the current shot rather than a fixed 13-card grid.
3. **Three disclosure groups:** `Direction`, `Launch & spin`, `Distance`.
   Open one group at a time. Every current metric remains available in one tap,
   but none is permanently forced into the first glance.
4. **One next action:** `Change Face`, `Change Attack`, or another
   bounded experiment. It returns to Range with that existing control selected;
   Details itself never contains a slider.

Use the model's factual boundaries. Do not invent fitting advice, personal
diagnosis, or an “optimal” target not backed by the engine.

### 5. Range — Compare (only after intent)

- Name the baseline clearly: `Compared with your pinned shot`.
- Render the current trace strong and the reference quiet. Avoid multiple
  permanent ghosts.
- Promote at most three deltas that matter, with a sentence explaining the
  relationship rather than a bare `+/-` value.
- The pin action should not be a permanent floating button. If it remains
  reachable in Range — Shot, it must avoid Carry and the trace; after pinning,
  comparison becomes its own surface.

### 6. Studio — Geometry (a separate depth tool)

Studio needs a density pass too, but must stay independent from Range outcomes.

- Face On and Down The Line are the two camera modes. The existing right rail
  also has a third action beneath the club selector: **Strike**. Keep it as a
  first-class local Studio view, not a hidden mini-screen or a fifth global
  route.
- **Strike / Contact Zone** takes over the central canvas when selected. It
  answers one precise question: where does the club enter the turf, reach low
  point, exit, and meet the ball? Show the ball, ghost clubhead, entry / low /
  exit sequence, and strike-height reference at useful scale. The rest of the
  swing geometry steps back rather than competing with the contact lesson.
- The rail sequence is therefore `Perspective` → `Iron / Driver` → `Strike`.
  Switching into Strike must preserve the current four Studio inputs and club;
  switching back restores the previous Face On or Down The Line view.
- Ball, swing arc, low point, and the physical low-point marker remain visible.
  Numeric labels appear only for the selected geometry input.
- One selected input creates one hero visual: plane ribbon, direction ray,
  low-point/entry/exit sequence, or arc-height bracket.
- Do not keep a permanently open contact inset on the main Geometry view:
  Strike is the deliberate drill-in, and can use the full screen well.
- A Studio CTA may say `Open flight in Range`, but it must not derive Range
  values from Studio geometry.

## Information budget

At rest, each screen receives only one dominant question, one dominant visual,
and one dominant action.

| Keep at rest | Reveal on intent | Remove or demote |
| --- | --- | --- |
| **Shot:** Carry hero, current trace, one shot sentence. **Change:** one active input and slider. | Full metric groups, pinned-shot comparison, annotation values, causal detail. | Repeated values, metric grids over the canvas, permanent Pin control, legends that restate a vector, duplicate sliders. |

Rules:

- A number may be prominent **once** per surface.
- An input may be expanded **once** per surface.
- A canvas annotation earns its place only if it changes the current decision.
- A user should never have to read a control and a complete data table at the
  same time.

## Design-system guardrails

- **Ember:** one live changed value or one primary action. Never a generic
  highlight across every outcome card.
- **Violet:** navigation, input structure, selected state.
- **Cyan / magenta:** named physical quantities already associated with Path /
  Attack. Pair colour with a written label.
- **Measurement amber:** only a physical dimension or marker such as low point;
  never a reward-like blanket for data cards.
- **Gold:** earned mastery only, never live shot data.
- Prefer solid dark lenses, tonal depth, hairlines, and breathing room over
  translucent glass and card-dashboard stacks.
- No essential text below 10 px; all controls need 44 px touch targets.
- In the canvas, solid stroke = physical trajectory/geometry and dashed stroke
  = reference only. Outcome cards may retain their dashed system grammar inside
  Details, but never thirteen at once on the live screen.

## Colour-direction challenge

The existing Ultraviolet Ember system is evidence, not a prison. Challenge it
deliberately before treating it as fixed. Produce three small applied colour
directions on the actual Range Shot screen, not abstract moodboards:

1. **Refined Ultraviolet:** retain the brand world, but use more neutral night
   field, less purple wash, and reserve Ember for one live focal value.
2. **Quiet Field Instrument:** charcoal/ink base, cool white geometry, cyan as
   deterministic model signal, and one warm live accent. It should feel useful
   outdoors rather than decorative in a dark room.
3. **Confident departure:** a bolder but still native-quality alternative that
   earns its own point of view without turning physical quantities into a
   rainbow.

For every direction, specify tokens for background, surfaces, ink, muted text,
input state, active live value, Path, Attack, measurement/low point, and
mastery/reward. Show one Range screen and one Studio screen in the selected
direction. Explain:

- whether gold/amber must be removed from ordinary telemetry because it reads
  as progression/reward;
- how semantic Path, Attack, and low-point colours remain distinct without
  competing with Carry or the primary action;
- contrast in outdoor use (minimum 4.5:1 for essential text and a visible
  non-glow contrast strategy for critical lines); and
- why the chosen system is calmer than the current layered violet/amber card
  treatment.

## Motion and feedback

- A live edit may animate only the relevant canvas geometry and the two
  contextual deltas: 150–220 ms, transform/opacity/color only.
- No full-canvas pulse, looping glow, count-up theatre, or multiple cards
  bouncing at once.
- Use a brief, interruptible transition when changing lenses; the destination
  must be immediately readable under reduced motion.
- The selected control gets the visual energy. The rest of the UI deliberately
  steps back.

## Deliverables requested from Claude Design

1. A compact IA map for the four local Range states and the transition paths.
2. High-fidelity mobile designs for Range — Shot, Range — Change,
   Range — Details, and Range — Compare; add Studio — Geometry only where
   it needs a shared-component decision.
3. A component inventory: input selector, one-active slider, contextual delta,
   lens switcher, outcome group, compare delta, and Studio geometry marker.
4. A state sheet for default, active slider, changed/settled, no-pin, pinned,
   empty/error, and reduced-motion states.
5. Explicit content hierarchy and annotation rules at 390 px portrait for
   Range and at both 844×390 and 568×320 landscape for Studio.

## Source material to inspect

- `impact.html`, `impact-flight.js`, `impact-outcome.js`, `impact-annotate.js`
- `impact-studio.html`, `swing-parameters-and-impact.js`
- `sa-p3.css`, `DESIGN.md`, `docs/DESIGN-SYSTEM.md`
- `docs/FLIGHTGLASS-CLAUDE-CODE-MASTER-PLAN.md` sections 6–7
- `assets/onboarding/outcome.webp`, `assets/onboarding/studio.webp`
- `design/evidence/impact-kamera-okt-f/` and `preview-impact-studio-cand02-*.png`

## How to inspect the real app

- The canonical GitHub repository is https://github.com/Fenral/svingbue.
- In a local Claude Code workspace: open the repository root, run
  npm ci, then python -m http.server 8099; inspect
  http://localhost:8099/impact.html and
  http://localhost:8099/impact-studio.html.
- Capture or inspect the existing reference states before proposing changes:
  npm run test:range, npm run test:studio, the onboarding assets, and the
  evidence folders listed above.
- If working from a cloud-only GitHub checkout, this handoff must be committed
  or pasted into the task first; do not assume it can see uncommitted local
  files.

## Explicit anti-goals

- Do not make a generic analytics dashboard.
- Do not add another global navigation item for every concept.
- Do not put all thirteen metrics on Range — Shot or Range — Change.
- Do not create a faux-AI assistant, free-text diagnosis, or unsupported golf
  claim.
- Do not map Studio geometry values to ball-flight values without a validated
  engine adapter.
