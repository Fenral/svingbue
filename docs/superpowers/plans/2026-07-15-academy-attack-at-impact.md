# Academy Up or Down at Impact Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the native Up or Down at Impact experience that derives Attack Angle from a rigid-circle tangent and separates it from loft, launch and strike quality.

**Architecture:** Wrap unchanged geometry and flight engines in a pure adapter, render a side-on tangent instrument, and gate mastery with two hidden-number geometry captures. The renderer never exposes a direct Attack slider and never grades contact.

**Tech Stack:** ES modules, `swing-parameters-and-impact.js`, `impact-flight.js`, DOM/SVG/CSS, shared Academy services, Node/browser tests.

**Normative spec:** `docs/superpowers/specs/2026-07-15-academy-attack-at-impact-design.md`

---

## Laws

- Implement only `attack-at-impact`; no prerequisite for mastery.
- Never change protected geometry/flight files.
- Attack is instantaneous clubhead direction, not face orientation, launch,
  turf order, compression or a target.
- Low Point owns full bottom geometry; Contact Height owns z invariance.

### Task 1: Lock geometry/flight adapters and live evaluator

**Files:**

- Create: `academy-attack-at-impact-model.js`
- Create: `scripts/academy-attack-at-impact-model.test.mjs`
- Modify: `package.json`

**Step 1:** Write failing tests for five Section 4.2 flight states and all six
Section 4.3 geometry states. Assert direct equality with `solveFlight()` and
`deriveImpact()` before presentation rounding.

**Step 2:** Write `evaluateAttackTransfer` near-miss tests. Pass requires first
raw Attack in [−5,−3], second in [+1,+3], correct descending/ascending labels,
learner-created geometry, fixed radius/plane/direction/z and no direct angle
control.

**Step 3:** Implement pure functions using `deriveImpact`, `effectiveLpx` and
`solveFlight`; do not duplicate tangent math. Run focused/protected tests.

**Step 4:** Commit `feat: add Attack at Impact model adapter`.

### Task 2: Encode content and voice boundaries

**Files:**

- Create: `academy-attack-at-impact-content.js`
- Create: `scripts/academy-attack-at-impact-content.test.mjs`

**Step 1:** Test exact S0–S5 content, five tasks, information sheets and seven
voice cues within budget.

**Step 2:** Fail content containing “Attack equals launch,” “negative means bad,”
“turf first,” “compression score,” direct swing prescription or four-times-
more-important universal claim.

**Step 3:** Implement frozen manifest and commit.

### Task 3: Build S0–S3 tangent window

**Files:**

- Create: `academy-attack-at-impact-experience.js`
- Create: `academy-attack-at-impact.css`
- Create: `scripts/academy-attack-at-impact-browser.test.mjs`
- Modify: `academy.html`

**Step 1:** Browser tests cover canonical/legacy routes, S0 action, side-on arc,
horizon/tangent/wedge, signed words, adjustable non-drag control, loft/travel/
launch arrow distinction, downstream Spin-Loft/Launch preview, inference limits,
voice target and reduced motion.

**Step 2:** Implement renderer with numeric DOM truth and static before/impact/
after alternative. Do not animate a full swing or draw a clubface in S1.

**Step 3:** Register renderer/CSS, run all accepted Academy regressions, commit
`feat: build Attack at Impact instrument`.

### Task 4: Add S4/S5, migration and reward proof

**Files:**

- Modify: renderer/browser test
- Modify: `scripts/academy-store-migration.test.mjs`

**Step 1:** Add knowledge/live combinations, hidden-number leakage check, both
range boundaries, label errors, reload restore, retry and duplicate reward.

**Step 2:** Add `attack-angle` complete → Practiced/placement, never automatic
Mastered. Persist both raw geometry states/outputs.

**Step 3:** Submit shared mastery transaction and request next action from router
because completion can feed two different journeys. Commit
`feat: gate Attack at Impact mastery` after focused/full tests.

### Task 5: Accept and checkpoint

Run copy-web, model/content/browser, full UX/WebKit/perf and protected hashes.
Capture all surfaces, both hidden-number gates and near misses at both target
viewports/motion modes. Verify keyboard, 200% text, screen reader and audio
failure. Pairwise compare legacy Attack Angle. Update ledgers, scan/stage only
intended files, commit `docs: accept Attack at Impact`, push. Stop before Low
Point if a critical gate fails.
