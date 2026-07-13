# Flightglass — autonomous Claude Code master plan

**Status:** Design and execution decisions are locked. This document is the
handoff source of truth for autonomous implementation. New image generation is
paused until the code and existing assets prove that a new image is necessary.

**Primary objective:** Raise every named product surface to a defensible 90+
UX/UI score without changing the golf physics, purchase continuity or existing
user progress.

**Execution model:** Claude Code works through the phases below in order,
implements and verifies one independently testable surface at a time, and does
not ask the owner to repeat decisions already recorded here or in the linked
normative documents.

---

## 1. Current state

The Flightglass identity pass is complete locally:

- name: **Flightglass**;
- promise: **See why it flew.**;
- symbol: **Trajectory Aperture**;
- palette evolution: Ink `#07060C`, Glass `#F5F2ED`, Trace `#FF8A4D`,
  Model Violet `#9D8BFF`;
- vector, app icon, splash, visible naming and native display name are built;
- the clean web bundle and brand verifier pass;
- rollback backup exists at
  `.sa-backups/flightglass-brand-20260713-081516`.

Production identity references:

- `outputs/flightglass-brand/identity-proof.png`
- `outputs/flightglass-brand/rebrand-inventory.md`
- `scripts/build-flightglass-assets.mjs`
- `scripts/verify-flightglass-brand.mjs`

The broader 90+ redesign has **not** been implemented. Existing mocks and
research are inputs, not proof that the shipping screens satisfy this plan.

---

## 2. Non-negotiable product laws

1. **One dominant job per viewport.** A screen may contain depth, but only one
   model, decision or next action can dominate at rest.
2. **Progressive disclosure over simultaneous chrome.** Secondary metrics live
   in sheets, detail cards, lens changes or the next step—not beside the primary
   model by default.
3. **The model never disappears while an input changes.** Sliders, chips and
   steppers must update the relevant model and authoritative values live.
4. **Numbers are truth; visuals are interpretations.** Any visual exaggeration
   is labelled. Printed engine values are authoritative.
5. **Ember means primary live truth or the single primary action.** It is not
   decoration. Model Violet means structure/state. Gold means earned mastery.
6. **No AI-slop.** No generic SaaS cards, arbitrary gradients, decorative
   glassmorphism, fake dashboards or unsourced golf imagery.
7. **Golf plausibility is mandatory.** Correct handedness, club orientation,
   ball position and impact sequence. When imagery and physics disagree,
   physics wins.
8. **Native interaction grammar.** Minimum 44 px targets, safe areas,
   keyboard/focus parity, reduced-motion parity, sheets that trap and return
   focus, and no essential hover or gesture-only interaction.
9. **No essential content below the fold inside an instrument state.** The core
   model, its active control and its live result must fit together at the target
   viewport.
10. **English product UI.** Norwegian may remain in internal planning only.

---

## 3. Compatibility and safety boundary

Preserve exactly:

- Capacitor bundle ID `no.strikearc.app`;
- App Store Connect ID `6768449250`;
- RevenueCat product IDs `strikearc_pro_monthly`,
  `strikearc_pro_annual`, `strikearc_pro_lifetime`;
- Academy storage keys `strikearc.academy.v1` and
  `strikearc.academy.nudge`;
- engine results from `impact-flight.js`,
  `swing-parameters-and-impact.js`, `diagnose-engine.js` and
  `diagnose-engine-v2.js` unless a separate physics task supplies failing
  regression tests and explicit authorization.

Do not run destructive Git commands. The source directory currently has no
`.git`; keep timestamped backups before each implementation phase. GitHub and
Vercel publishing are post-verification release operations, not implementation
shortcuts. Supabase and OpenAI are not required for this redesign and must not
be introduced without a concrete product need.

---

## 4. Source-of-truth hierarchy

When documents disagree, use this order:

1. this master plan;
2. current owner requirements recorded in the conversation;
3. `docs/mocks-normative/FABLE-ORDRE-strikearc-design.md`;
4. screen-specific consensus/spec documents listed below;
5. mocks created during the last week;
6. existing shipping code;
7. older historical plans and mocks.

Mocks are inspiration unless a document explicitly calls one normative. Never
copy a mock merely because it is visually complete.

---

## 5. Target scorecard

| Surface | Baseline | Required exit score |
|---|---:|---:|
| Home | 67 | 90+ |
| Impact / Range | 63 | 90+ |
| Visualise | 81 | 90+ |
| Outcome | 72 | 90+ |
| Compare / Ghosts | 78 | 90+ |
| Geometry 3D | 74 | 90+ |
| Strike Window 2D | 82 | 90+ |
| Academy overview | 70 | 90+ |
| Academy lesson | 73 | 90+ |
| Paywall | 76 | 90+ |

Each score is calculated from:

- hierarchy and density: 20;
- comprehension and causal learning: 15;
- interaction feedback and control quality: 15;
- distinctiveness and brand fit: 15;
- native/mobile feel: 10;
- accessibility and reduced-motion parity: 10;
- conversion/value communication: 10;
- performance and runtime integrity: 5.

A total above 90 cannot override a critical failure. Critical failures are:
clipped or hidden essential UI, a control that updates out of view, incorrect
golf geometry, a fake/unsourced number, broken keyboard access, console errors,
or a changed compatibility identifier.

---

## 6. Locked information architecture

Flightglass has three product territories:

- **Range:** experiment with impact inputs and see ball flight immediately;
- **Academy:** learn one physical relationship at a time through guided play;
- **Lab:** Geometry, Strike Window and Compare tools for deeper inspection.

Screen ownership:

- **Range / Impact** owns live ball flight and input experimentation.
- **Visualise** is a Range lens/perspective, not a second competing simulator.
- **Outcome** owns the read-only explanation after the shot.
- **Compare / Ghosts** owns deltas against one selected reference.
- **Geometry 3D** owns spatial delivery geometry.
- **Strike Window 2D** owns contact diagnosis and sequence.
- **Academy** owns paced teaching and mastery.

Outcome chips do not sit permanently over the active Range model. They appear
after a shot, on request, or in Academy where the relationship is being taught.

---

## 7. Autonomous implementation phases

**Owner-directed execution override (2026-07-13):** The owner explicitly
resumed the Academy work after reviewing its latest implementation state.
Phase 6's Backspin reference lesson is therefore active before Phase 1. This is
a sequencing exception only: Phase 1 remains ready, all compatibility and
release gates remain unchanged, and the remaining 23 lessons stay outside the
Backspin scope.

### Phase 0 — Build the repeatable QA baseline

**Purpose:** Make every later visual claim reproducible.

Deliverables:

- a route/surface manifest covering all named screens and important states;
- Playwright captures for `430×932`, `375×812`, `932×430` and `812×375`;
- automatic checks for console/page errors, horizontal overflow, elements
  smaller than 44 px, clipped primary labels and protected identifiers;
- reduced-motion and keyboard smoke states;
- a score sheet stored beside each screenshot set.

Exit gate: baseline screenshots and measurements can be regenerated with one
package command and do not depend on external services.

### Phase 1 — Home: Floodlights

**Primary reference:** `home-concept-1.html` and the K1 “Floodlights” section in
`docs/home-creative-concepts.md`.

Locked direction:

- replace the current split-screen home rather than polishing it;
- use the night driving range as the navigation world;
- the range wakes through one short, skippable floodlight sequence;
- destinations are real, stationary interactive places with 44 px hit areas;
- navigation order follows the product story: Range, Strike Window, Outcome,
  Academy; Lab/Compare is secondary;
- Flightglass identity is quiet; the lit range communicates the product;
- static, fully legible composition under reduced motion;
- no new generated image in the first implementation. Reuse and grade existing
  last-week range assets. Only request image generation after the coded layout
  proves an actual asset gap.

Exit evidence:

- the product and primary action are understood within five seconds;
- one dominant lit destination at first run;
- no more than two warm emphasis zones at rest;
- all destinations remain directly tappable without waiting for animation;
- 90+ rubric score at all landscape target sizes.

### Phase 2 — Range / Impact and Visualise

**References:** `impact-focus-mock.html`, `impact-viz-mock.html`,
`impact-presentation.html`, `range-08-final-mock.html`,
`range-round3-compare.html` and relevant current engine code.

Locked direction:

- Range opens to the ball flight, not to a dashboard;
- one active parameter model at a time;
- an input dock exposes the current parameter and value; other parameters are
  compact selectors;
- drag updates the flight, authoritative values and one short cause sentence
  live;
- horizontal/vertical perspective is a lens switch or swipe with visible
  button parity, never two simultaneous 70/30 panes;
- Visualise shares the exact Range state and engine; it must not duplicate
  sliders or create a parallel truth;
- post-shot outcomes remain collapsed until requested;
- the live Trace is visually dominant over brand chrome.

Exit evidence:

- model, active input and resulting flight fit in one viewport;
- perspective can be changed by button, keyboard and swipe;
- no user changes a value “blind”;
- no duplicated authority between Impact and Visualise;
- engine outputs remain byte-equal for the same inputs.

### Phase 3 — Outcome and Compare / Ghosts

**References:** `impact-outcome-mock.html`, `range-compare-mock.html`,
`range-3d-compare-mock.html`, `range-night-final-compare-mock.html`.

Outcome laws:

- begin with the plain-language result;
- show a causal chain: input → launch/flight → consequence;
- reveal supporting metrics progressively;
- recommend one next experiment or Academy lesson;
- remain read-only unless the user explicitly returns to Range.

Compare laws:

- compare the active shot against one selected reference at a time;
- the reference is always named and visually quieter;
- ghosts use consistent color/opacity and never obscure the current truth;
- deltas say what changed and why it matters, not only `+/-` numbers;
- clearing or replacing a ghost is immediate and reversible.

Exit evidence: a first-time golfer can state the primary difference and its
cause after five seconds without reading every metric.

### Phase 4 — Geometry 3D and Strike Window 2D

**Normative references:** `docs/strike-window-consensus.md`,
`docs/strike-window-polish-notes.md`, `docs/geometry-rethink.md`,
`geometry-window-mock.html` and `geometry.html`.

Shared laws:

- same control system and shared state;
- identical placement for “View in 2D/3D” in both directions;
- Attack above Path with consistent type, color and value flow;
- live feedback while every parameter changes.

Geometry 3D owns:

- swing direction, plane and low-point geometry in space;
- the live relationship to attack angle and club path;
- an effective-low-point explanation when direction/plane coupling moves it;
- correct ball position constrained to the swing arc;
- an integrated result showing low/middle/high contact, ball-first, turf-first,
  topping and full miss.

Strike Window 2D owns:

- pinned canvas;
- impact cluster: Attack + Path;
- sequence plate: ball/turf order;
- strike height, turf distance and low point relative to ball;
- one active control in the bottom sheet;
- default active parameter: Low Point;
- visible `×4 · diagnostic view` label for amplified strike-height graphics.

Exit evidence:

- changing any input updates the model and result without release delay;
- 2D and 3D round-trip state without numerical drift;
- a user can explain how the four inputs combine into effective low point;
- golf contact categories match engine regression fixtures.

### Phase 5 — Academy overview

**References:** `academy.html`, `docs/academy-path-verdict.md`,
`docs/academy-polish-spec.md` and the normative design consolidation.

Locked direction:

- the path is a constellation over the Flightglass night field;
- one unmistakable Start/Continue node;
- completed, available and locked states are distinct without relying on color
  alone;
- reduce visible chrome before reducing learning content;
- show progress, level and recommended next lesson, not every curriculum detail
  at once;
- the overview must be strong enough for product marketing screenshots.

Exit evidence: users can identify where they are, what is next and why it is
worth opening within five seconds.

### Phase 6 — Academy lesson system

**Normative references:** `docs/claude-design-brief/brief.md`,
`docs/academy-native-v2-spec.md`, `academy-lesson-v2-mock.html` and real lesson
content in `academy.html`.

The approved v3 amendment is
`docs/superpowers/specs/2026-07-13-backspin-96-97-design.md`; where it is more
specific than the v2 inputs, it governs Backspin.

**Backspin exit target:** 96-97. The target is earned only by model, mastery,
mobile and accessibility evidence; no heuristic score overrides a critical
defect.

Default six-surface anatomy:

1. Mission;
2. Lab;
3. Influence;
4. Myths;
5. Quiz;
6. Mastery.

Locked laws:

- paged/snap flow, not a long article;
- ≤50 visible words per surface;
- the interactive model is visible with its active controls and truth value;
- one primary engine truth, three supporting readouts maximum;
- definitions and deeper explanations live in one-level bottom sheets;
- wrong quiz answers teach the misconception;
- mastery requires 4/5;
- sourced real-world estimates are visually and verbally separate from the
  simulator and always carry `≈`, source and “not the simulator” language;
- imagery may later support the Mission/real-world layer only; it never replaces
  the engine model.

Implement Backspin as the reference lesson first. Only after it passes every
gate should the anatomy be generalized to the remaining lessons.

Exit evidence: a golfer manipulates the model within five seconds, never changes
an unseen model, and can complete the full lesson at both portrait target sizes
without essential content being clipped.

### Phase 7 — Paywall

**References:** `docs/paywall-verdict.md`, `docs/monetization-strategy.md`,
`paywall-mock.html`, `sa-paywall.js`, `sa-paywall.css`.

Locked direction:

- show the product outcome before prices;
- connect Pro to Range experimentation, Academy mastery and deeper Lab tools;
- annual is the recommended plan;
- monthly remains available;
- display `kr 99` monthly and `kr 590` annually with “2 months free”, never a
  percentage claim;
- lifetime is removed from the visible paywall but its existing RevenueCat ID
  remains preserved for compatibility;
- restore purchases, legal links and dismissal/eligibility behavior remain
  accessible and testable;
- no fake urgency, countdowns or fabricated testimonials.

Exit evidence: value proposition is understood before pricing, purchase IDs are
unchanged, and all reviewer/legal paths work through Playwright.

### Phase 8 — Convergence and release QA

Run all routes through the same gates:

- fresh brand build and verifier;
- clean `www/` build;
- zero console/page errors;
- protected identifiers 7/7;
- target viewport screenshots;
- keyboard and reduced-motion pass;
- no horizontal overflow or clipped essential content;
- physics fixtures unchanged;
- surface score 90+ with no critical failure;
- store screenshot automation and reviewer paths pass;
- create a final audit containing before/after images, score deltas and any
  consciously deferred non-critical work.

Only after this phase may GitHub/Vercel and configured app-store publishing
run. The owner granted this release authorization on 2026-07-13; the precise
scope and mandatory gates are recorded in
`docs/flightglass-autopilot/RELEASE-AUTHORIZATION.md`. External domain or
account-level changes outside that scope remain explicit release dependencies.

---

## 8. Claude Code autonomy protocol

Claude Code must not ask the owner about:

- colors, typography or logo direction already locked here;
- which recent mock to use when the primary reference is named above;
- whether to preserve compatibility identifiers;
- whether to add more cards or metrics—the density laws answer this;
- whether to generate imagery—image generation is paused;
- whether to continue after a passing local checkpoint.

Claude Code may stop only when:

1. two normative sources produce incompatible requirements that materially
   change user behavior;
2. a requested implementation would require changing physics outputs without a
   failing regression test;
3. required credentials are unavailable, or an external action exceeds the
   recorded release authorization;
4. the same verification failure survives three root-cause-driven attempts;
5. a required source asset is missing and cannot be replaced by an existing
   local asset or CSS/Canvas/SVG implementation.

For ordinary ambiguity, use this decision order:

1. preserve truth;
2. preserve the dominant user job;
3. remove simultaneous UI;
4. make feedback live;
5. prefer the simpler native interaction;
6. document the assumption and continue.

Every phase uses:

1. timestamped backup;
2. failing acceptance test or reproducible baseline;
3. minimal implementation;
4. automated verification;
5. visual screenshot review;
6. score update;
7. handoff note before the next phase.

---

## 9. Definition of “only coding remains”

The work is at the “only coding remains” milestone when all of the following are
true:

- product architecture and screen ownership are fixed;
- each screen has a named reference, hierarchy and acceptance criteria;
- palette, type, motion, truth and density laws are fixed;
- compatibility and physics boundaries are explicit;
- execution order and stop conditions are explicit;
- objective viewport, runtime and scoring gates are explicit;
- no new image is required to begin implementation.

This master plan satisfies those conditions. The next activity is implementation
and verification, not further owner discovery.

---

## 10. First command for Claude Code

Give Claude Code this instruction from the repository root:

```text
Read docs/FLIGHTGLASS-CLAUDE-CODE-MASTER-PLAN.md completely, then read every
normative reference named for Phase 0 and Phase 1. Work autonomously. Do not ask
questions already answered by the master plan. First create the repeatable QA
baseline, then implement Phase 1 Home: Floodlights. Preserve all compatibility
IDs and physics files. Do not generate new images. Stop only under the five
conditions in the autonomy protocol. Verify the phase fully before continuing.
```

After Phase 1 passes, repeat the same pattern for each subsequent phase in
order. Do not start multiple large-screen rewrites simultaneously.
