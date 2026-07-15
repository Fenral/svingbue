# Academy Shape Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the native Shape experience that isolates Face-to-Path, modeled Spin Axis and Curve while holding Start Line constant.

**Architecture:** Add a pure adapter over `solveFlight()` for gap/axis/curve decomposition, a dedicated top-down shape tunnel and a two-capture live gate. Reuse the accepted host/store/voice contracts; do not count Face, Path and Face-to-Path as three causes.

**Tech Stack:** ES modules, unchanged flight engine, DOM/SVG/CSS, Node/browser tests, native Academy host.

**Normative spec:** `docs/superpowers/specs/2026-07-15-academy-shape-design.md`

---

## Preconditions

- Shared Home/store and Start Line batches accepted.
- Implement only `shape`.
- Start Line mastery gates S4; S0–S3 remain previewable.
- Curve is measured from Launch Direction, not the target line.
- Gear effect/impact location remain `NOT MODELED`.

### Task 1: Implement model adapter and two-shape gate

**Files:**

- Create: `academy-shape-model.js`
- Create: `scripts/academy-shape-model.test.mjs`
- Modify: `package.json`

**Step 1:** Write failing tests for the five Section 4.2 fixtures: matched,
right-bend, left-bend, 70 mph and 110 mph. Compare every value directly to
`solveFlight()` and assert the central three share Launch +1.0° and Carry.

**Step 2:** Write failing `evaluateShapeTransfer` tests for:

```text
both Launch Direction values within +1.0° ±0.1°
first Curve ≤ −10.0 yd
second Curve ≥ +10.0 yd
opposite raw Face-to-Path signs
both states produced by learner input
no preset-state injection
```

Test each near miss separately and use raw, not rounded, output.

**Step 3:** Run to confirm failure, implement minimal solver adapter, run again.

Return Face-to-Path as `faceAngle - clubPath`, but source Spin Axis, Carry and
Curve from `solveFlight()`. Do not duplicate gain, clamp or curve constants.

**Step 4:** Run protected baseline and commit:

```powershell
git add academy-shape-model.js scripts/academy-shape-model.test.mjs package.json
git commit -m "feat: add Shape model adapter"
```

### Task 2: Encode content and causal boundaries

**Files:**

- Create: `academy-shape-content.js`
- Create: `scripts/academy-shape-content.test.mjs`

**Step 1:** Test exact S0–S5 roles, five tasks, sheets, eight voice signatures
within 12–24 words, stable cue IDs and visual targets.

**Step 2:** Add forbidden-copy checks:

- no claim that Face-to-Path is causally complete in real golf;
- no “this phone measured centered contact”;
- no wind changes Spin Axis;
- no Face + Path + Face-to-Path independent ranking;
- no final Offline/Carry Side mission;
- no dispersion terminology.

**Step 3:** Implement frozen manifest, run tests, commit.

### Task 3: Build S0–S3 shape tunnel

**Files:**

- Create: `academy-shape-experience.js`
- Create: `academy-shape.css`
- Create: `scripts/academy-shape-browser.test.mjs`
- Modify: `academy.html`

**Step 1:** Add failing browser tests for canonical route and `spin-axis`/`curve`
aliases, preview with missing Start Line, S1 gap brace/axis puck/curve bracket,
same-start three-state proof, speed amplifier without axis change, S3 boundary,
captions/replay and reduced motion.

**Step 2:** Implement `mountShapeExperience`. The top-down trace begins on the
Launch rail and bends from it. Target-relative endpoint is absent. Numeric DOM
alternative lists Launch, Face-to-Path, Spin Axis, Carry and Curve in order.

**Step 3:** Register renderer/CSS, run focused browser + Backspin/Start Line
regression, commit `feat: build Academy Shape instrument`.

### Task 4: Add live mastery and migration behavior

**Files:**

- Modify: `academy-shape-experience.js`
- Modify: `scripts/academy-shape-browser.test.mjs`
- Modify: `scripts/academy-store-migration.test.mjs`

**Step 1:** Add failing tests for all knowledge gates, two-capture order,
opposite gap signs, same-start tolerance, curve thresholds, near-miss messages,
retry values, reload restore and duplicate reward.

**Step 2:** Add migration fixtures: either legacy concept → Practiced; both
complete → Review eligible; neither auto-masters; old routes preserved.

**Step 3:** Implement S4/S5 through shared transaction and recommendation.
Store raw input/output for both captures and content version.

**Step 4:** Run focused suites + `npm run test:academy`, commit
`feat: gate Academy Shape mastery`.

### Task 5: Accept the batch

**Files:** ledgers plus generated `www/` mirror only.

**Step 1:** Run copy-web, model/content/browser tests, full UX/WebKit/perf and
protected hashes.

**Step 2:** Capture same-start straight/left/right, speed amplifier, S4 near
miss/pass and S5 at both target viewports/motion modes.

**Step 3:** Keyboard, 200% text, screen reader and missing-audio checks.

**Step 4:** Pairwise-blind compare against legacy Spin Axis + Curve lessons.

**Step 5:** Update STATUS/HANDOFF, scan/stage intended files, commit
`docs: accept Academy Shape`, push. Stop before Carry Side on any failed
critical gate or protected-file difference.
