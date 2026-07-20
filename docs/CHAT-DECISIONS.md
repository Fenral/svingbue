# Flightglass durable chat decisions

Updated: 2026-07-20

This document preserves the decisions and material recommendations from the
long-running product, brand and Academy conversation. It is a handoff, not a
verbatim chat transcript. Where a direction has not received explicit owner
approval, it is marked `PENDING` and must not be treated as locked.

## Product ambition

- `LOCKED` Product name: **Flightglass**.
- `LOCKED` Brand character: precision, professional instrument, golf relevance
  without generic golf decoration.
- `LOCKED` Quality target: every named surface should reach at least 90; design
  and planning should aim for 96-97 where the product truth supports it.
- `LOCKED` The dominant UX problem is simultaneous information. The most
  important model, consequence and action must receive substantially more
  screen area.
- `LOCKED` Avoid AI-slop aesthetics. The product should feel native, authored,
  useful and technically credible.
- `LOCKED` Facts, controls and model output should create learning through
  experimentation. Academy must not read like a book or require blind slider
  changes.

## Brand and identity

- `SUPERSEDED 2026-07-20` Owner reconfirmed the identity earlier on 2026-07-20:
  retain the existing full-colour Trajectory Aperture and its deterministic SVG
  geometry; the explored split-ball/glass-plane/backspin direction was not
  adopted. Later the same day, in a subsequent session, the owner was shown a
  rendered Higgsfield/Recraft board matching that same explored direction,
  was told it conflicted with this entry, and explicitly overrode it twice
  (once to adopt the image, once more after being shown the specific
  split-ball/glass-plane match) choosing to adopt it. Trajectory Aperture is
  retired; **Glass Plane** is now production. This entry is kept, not deleted,
  as an honest record of the reversal.
- `LOCKED` Identity direction: **Glass Plane** (as of 2026-07-20).
- `LOCKED` Brand promise: **See why it flew.**
- `LOCKED` Architecture: Flightglass Range, Academy and Lab.
- `LOCKED` Symbol grammar: one split disc, one glass seam dividing it corner to
  corner, one measured intersection point near the seam. Implemented as a
  parametric generator (`glassPlaneMark()` in
  `scripts/build-flightglass-assets.mjs`: one circle, one chord fill, one
  seam stroke, one dot — no filters or gradients), not a traced image, per the
  deterministic-vector rule below. The Higgsfield/Recraft reference board
  (`App Icon` / `Symbol` / `Wordmark` composition) was used as the concept
  reference for this redraw, not as source geometry.
- `LOCKED` Wordmark: lowercase, optically customized, per-letter color accents
  on the two letters that carry the palette (revised 2026-07-20 from a strict
  one-color rule). "flightglass" is Glass except the second **g** (Ember) and
  the final **s** (Violet), matching the Higgsfield/Recraft reference board.
  Implemented via a `colorOverrides` map passed to `outlinedWord()` in
  `scripts/build-flightglass-assets.mjs`, keyed by glyph-run index (note: the
  font ligates "fl" into one glyph, so glyph index is character position minus
  one from that point on — verified by dumping `font.layout()` output, not by
  eye).
- `LOCKED` Master artwork must be deterministic vector. Image generation may
  explore the world around the identity but must not define the logo geometry.
- `LOCKED` Palette evolution, not an unexplained replacement: Ink `#07060C`,
  Glass `#F5F2ED`, Ember `#FF8A4D`. Violet `#9D8BFF` is promoted from secondary
  to a primary mark color as of 2026-07-20 (it is now one of the two split
  halves in Glass Plane) — this revises the earlier "must not compete with
  Ember" constraint, which was written for the retired Trajectory Aperture
  mark.
- `LOCKED` Existing design-system decisions may change only when the benefit is
  explicit and evidence-backed. Do not discard the old system merely to make
  the work look new.
- `PENDING RELEASE` Trademark/confusing-similarity clearance, domain checks and
  store-name confirmation remain required before public identity release. This
  now applies to the Glass Plane mark, which has not been separately cleared.

The original concept pages are preserved under
`docs/concepts/flightglass/`. Production SVG assets under `assets/` remain the
source of truth.

## Screen goals and owner direction

| Surface | Starting score | Product direction |
|---|---:|---|
| Home | 67 | Do not preserve the current layout. Use the Floodlights/driving-range idea as the primary reference: novel, calm, professional and recognizably about golf/product value. |
| Impact / Range | 63 | Treat as the range experience where the user watches ball flight. The previous 70/30 layout still felt cluttered. Evaluate horizontal/vertical perspective switching or swipe. Do not keep outcome chips here merely because they already exist. |
| Visualise | 81 | High design freedom. Keep its role distinct from Range and align it with the final Impact/Range product architecture. |
| Outcome | 72 | Increase consequence clarity and reduce competing UI. |
| Compare / Ghosts | 78 | Preserve the strong comparison idea; make differences and learning consequence immediate. |
| Geometry 3D | 74 | Teach how swing direction, plane, low-point X/Y and constrained ball position affect attack angle, path and contact. Feedback must be live. Show fat/ball-first/thin/high/low/miss outcomes without pretending the simplified geometry is universal golf truth. |
| Strike Window 2D | 82 | Replace the cheap visual treatment while preserving the useful strike-window concept. |
| Academy overview | 70 | This is a marketing-critical product surface. It must create desire to continue, not present a dense technical catalogue. |
| Academy lesson | 73 | Native, interactive, immediate model/table response. No blind controls, article-like scroll or passive mastery. |
| Paywall | 76 | Trusted design freedom, grounded in the paywall research and existing product identifiers. |

The master execution phases and exact gates live in
`docs/FLIGHTGLASS-CLAUDE-CODE-MASTER-PLAN.md`.

## Academy reference lesson

- `LOCKED` Backspin is the reference lesson for the 96-97 lesson contract.
- `LOCKED` Every lesson should lead with an experiment, make the causal chain
  visible, include an unseen live transfer task and distinguish engine output
  from sourced real-world information.
- `LOCKED` A shared native shell may be reused, but the visualization must be
  congruent with the concept. Do not create 24 cosmetic variants of Backspin.
- `LOCKED` Relevant source files:
  - `docs/superpowers/specs/2026-07-13-backspin-96-97-design.md`
  - `docs/superpowers/plans/2026-07-13-backspin-reference-lesson.md`

## Academy home and curriculum architecture

Status: `PENDING OWNER APPROVAL`.

The current recommendation is stronger than merely polishing the constellation:

1. Make Academy home a goal-led coach with one dominant Start/Continue/Repair
   action and a human-readable reason for the recommendation.
2. Show only the current milestone and the next two. Move the complete physics
   constellation to a secondary **Explore the physics** surface.
3. Make mastery the primary progress measure. Keep XP/rank/badges secondary.
4. Separate three data structures that are currently mixed:
   - physical/causal relations;
   - pedagogical prerequisites;
   - recommended user journeys.
5. Use `Not started`, `Practiced` and `Mastered`. A 3/5 result is Practiced;
   mastery requires 4/5 plus the module's live transfer task.
6. Let users preview any concept, but gate dependent mastery checks by actual
   prerequisites or a passed placement challenge.
7. Start with honest goal selection. Add Diagnose-driven personalization only
   when the recommendation can be deterministic, explained and trusted.

Recommended goal families:

- Start line and shape
- Strike and contact
- Launch, spin and stopping
- Speed and distance
- Playing conditions

## Recommended Academy portfolio compression

Status: `PENDING OWNER APPROVAL`.

All existing concepts and storage IDs should remain compatible, but the current
24 registry entries should not automatically become 24 learner-visible lessons.
The recommended target is about 16 coherent experiences:

- Club Speed + Smash + Ball Speed -> **Speed Transfer**
- Dynamic Loft + Launch Angle -> **Delivered Loft & Launch**
- Face Angle + Start Direction -> **Start Line**
- Spin Axis + Curve -> **Shape**
- Apex + Landing Angle -> **Flight Height & Descent**
- Altitude + Temperature -> **Air Density**
- Total Distance becomes part of Carry/Descent until a credible rollout model exists
- Plane Coupling becomes optional advanced model content until independently validated

Attack Angle and Low Point should remain separate: one teaches the measured
delivery output; the other teaches its constrained geometry model.

## Module bridges

Status: `RECOMMENDED, NOT YET LOCKED`.

Do not add a generic network of related-module links or make every output chip
an exit. Bridges are valuable only as assessed transfer moments:

1. Complete the source experiment.
2. Predict the target consequence.
3. Reveal the relationship.
4. Optionally open the target with only an exact compatible value carried over;
   name every held input.

Rules:

- separate bridge metadata from prerequisites, XP, completion and causal graph;
- no more than four to six bridges in the first version and at most one primary
  bridge per source lesson;
- label the relation as `OUTPUT -> INPUT`, `SHARED INPUTS`, `COMPARE` or
  `REAL-WORLD ONLY`;
- never infer missing inputs or transfer a value between disconnected engines;
- one prior-state ghost only; no automatic mid-lesson navigation.

Strong candidates:

- Low Point -> Spin Loft, carrying geometry-derived attack angle
- Spin Loft <-> Delivered Loft & Launch, as a shared-input contrast
- Wind <-> Shape, separating crosswind drift from spin-axis bend
- Strike Depth -> Speed Transfer, explicitly real-world-only and non-numeric
- Plane Coupling -> Shape only after independent domain validation

Do not ship these as learner-facing causal bridges yet:

- Backspin -> Carry: the current carry estimate ignores backspin
- Temperature -> Ball Speed: graph, copy and engine currently disagree
- Numeric Strike Depth -> Smash: the engines are disconnected
- Wind -> Spin Axis: these are different mechanisms

## Truth and physics boundaries

`LOCKED PRINCIPLE`: internal engine consistency is not the same as external
physical validation. Every output must declare one truth register:

- exact identity/definition;
- app-model estimate;
- sourced real-world layer.

Known decisions required before related implementation:

- Carry must either be honestly narrowed to the current ball-speed-based
  7-iron estimate or receive a validated trajectory solver. It cannot promise
  launch/backspin optimization while ignoring both.
- Apex, landing angle and total use fitted/clamped estimates and must not imply
  false precision, stopping behavior or turf physics.
- Plane Coupling and Strike Depth are internally consistent simplified geometry,
  not established universal coaching laws.
- Wind, altitude and temperature are post-solve estimate layers and must remain
  visibly separate from impact-engine truth.

The inspiration files `Mobbin-UX-laering.md` and `UXPeak-UX-laering.md` are useful
references, not product truth or mandatory templates.

## Autonomous execution and release

- `LOCKED` The owner approved long-horizon unattended work and use of subagents.
- `LOCKED` Continue without asking about ordinary implementation choices already
  answered by the master plan. Stop only at the documented product/safety gates.
- `LOCKED` Do not claim completion from a score alone. Fresh tests and visual
  inspection are required.
- `LOCKED` Existing local assets, CSS, Canvas and SVG are the first path. Avoid
  expensive image generation unless it materially improves an approved need.
- `LOCKED` GitHub, Vercel and configured store release authority applies only
  after every Phase 8 gate passes. Travel checkpoints are not releases.
- `LOCKED` When only coding remains, explicitly tell the owner that planning and
  decision work is complete.

## Travel continuity

- Remote repository: `Fenral/svingbue`
- Working branch: `agent/travel-sync`
- Draft PR: `https://github.com/Fenral/svingbue/pull/1`
- Repository visibility verified as private on 2026-07-13.
- Checkpoint policy: after each completed spec/phase, before pauses/handoffs and
  after roughly 45 minutes of meaningful unpushed work.

## Outstanding owner decisions

1. Approve or revise the goal-led Academy home, secondary constellation and
   three-graph architecture.
2. Approve or revise the compression from 24 registry topics to about 16
   learner-visible experiences.
3. Choose whether Carry receives a real flight solver or a narrower honest
   learning promise.
4. Decide whether Plane Coupling is validated for core curriculum or retained
   as an optional model lab.
5. Complete trademark, domain and store-name clearance before public Flightglass
   identity release.
