# Academy Carry Side Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the native Carry Side integration experience that composes Start Side and Curve into the modeled carry-plane endpoint without calling one shot a pattern.

**Architecture:** Add a pure composition adapter over unchanged `solveFlight()`, an outcome-level teaching composer for S1–S3 and an actual Face/Path engine gate for S4. Preserve internal ID `shot-pattern` and engine property `offline`; expose learner title Carry Side.

**Tech Stack:** ES modules, unchanged flight engine, DOM/SVG/CSS, shared Academy host/store/voice, Node/browser tests.

**Normative spec:** `docs/superpowers/specs/2026-07-15-academy-shot-pattern-design.md`

---

## Preconditions

- Shared infrastructure, Start Line and Shape accepted.
- Implement only internal experience `shot-pattern`.
- S4 requires Start Line + Shape or placement; preview remains open.
- `CarrySide = Carry × sin(LaunchDirection) + Curve` uses engine `offline` as
  authority; never rename the protected field.
- One modeled endpoint is not dispersion, resting position or target proximity.

### Task 1: Lock signed composition and engine fixtures

**Files:**

- Create: `academy-carry-side-model.js`
- Create: `scripts/academy-carry-side-model.test.mjs`
- Modify: `package.json`

**Step 1:** Write failing tests for all seven Section 5.2 fixtures, including raw
target-return values and the +1° straight/right/left set.

**Step 2:** Assert:

```js
startSide === carry * Math.sin(deg2rad(startDirection))
carrySide === startSide + curve
carrySide === flight.offline
```

within `1e-9`. The adapter imports `deg2rad` or uses engine-provided inputs; no
rounded display value enters math.

**Step 3:** Write failing gate tests for two captures:

- state A Launch ≥ +1.5°, Curve ≤ −4 yd, |Carry Side| ≤ 0.5 yd;
- state B Launch ≤ −1.5°, Curve ≥ +4 yd, |Carry Side| ≤ 0.5 yd;
- learner input in both; distinct states; finite/in-range controls.

**Step 4:** Implement adapter/evaluator, run focused + protected tests, commit
`feat: add Carry Side model adapter`.

### Task 2: Encode content, composer boundary and voice

**Files:**

- Create: `academy-carry-side-content.js`
- Create: `scripts/academy-carry-side-content.test.mjs`

**Step 1:** Test exact title/internal ID/concept ownership, S0–S5 copy, five
tasks, information sheets and eight 12–24-word cue signatures.

**Step 2:** Require persistent strings:

```text
COMPOSITION LAB · OUTCOME-LEVEL
ONE MODELED SHOT · NOT DISPERSION
Now build the same relationship through the engine's real inputs.
```

**Step 3:** Forbid learner-facing “Shot Pattern” title, dispersion claims,
wind/bounce/roll inclusion, reverse-solving composer state into engine inputs,
and treating Carry Side as a third cause beside its two terms.

**Step 4:** Implement frozen manifest, run tests, commit.

### Task 3: Build S0–S3 signed-distance instrument

**Files:**

- Create: `academy-carry-side-experience.js`
- Create: `academy-carry-side.css`
- Create: `scripts/academy-carry-side-browser.test.mjs`
- Modify: `academy.html`

**Step 1:** Add failing tests for canonical route plus `offline` alias, missing-
prerequisite preview, three reference lines/brackets, signed verbal labels,
reinforce/cancel/cross states, same endpoint/different flight proof, boundary
sheet, caption/replay and reduced motion.

**Step 2:** Implement an SVG/DOM trace with target line, Launch rail, no-curve
marker, final marker and three dimension brackets. DOM ledger is authoritative.

**Step 3:** S1 composer edits only outcome components and never writes mastery.
S4 explicitly switches to actual Face/Path controls and direct engine solve.

**Step 4:** Register renderer/CSS, run current Academy regressions, commit
`feat: build Academy Carry Side instrument`.

### Task 4: Implement two-flight mastery, migration and S5

**Files:**

- Modify: `academy-carry-side-experience.js`
- Modify: `scripts/academy-carry-side-browser.test.mjs`
- Modify: `scripts/academy-store-migration.test.mjs`

**Step 1:** Test 3/5 + live, 4/5 without live, both state orderings, each
threshold boundary, raw near miss, reload restore and duplicate reward.

**Step 2:** Assert migration `offline` complete → Practiced/Review eligible, not
Mastered; route/history preserved; one reward only.

**Step 3:** Store raw inputs/outputs for both states. Submit only through shared
transaction. Ask journey router for next action; never hardcode Wind.

**Step 4:** Run focused/full tests and commit `feat: gate Carry Side mastery`.

### Task 5: Native acceptance

**Files:** ledgers and generated `www/` only.

**Step 1:** Run copy-web, all direction-family tests, full UX/WebKit/perf and
protected hashes.

**Step 2:** Capture reinforce, near-cancel, crossing, equal-endpoint contrast,
two S4 states/near misses and S5 at both target viewports and motion modes.

**Step 3:** Verify keyboard, 200% text, screen reader, color-independent signs,
focus return and audio failure.

**Step 4:** Pairwise-blind compare against legacy Offline article.

**Step 5:** Update ledgers, scan/stage intended files, commit
`docs: accept Academy Carry Side`, push. Stop before strike family if any
critical content/physics/accessibility gate or protected identity fails.
