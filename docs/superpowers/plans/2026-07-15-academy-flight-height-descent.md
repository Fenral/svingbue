# Academy Flight Height and Descent Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the native Flight Height & Descent experience that separates Apex from Landing Angle and proves the same peak can return differently.

**Architecture:** Add a pure adapter over unchanged flight outputs/decomposition, render an honest side-on profile with numeric rulers, and gate mastery with two same-Apex/different-descent captures. Keep Backspin rpm visibly outside the current flight fit and never promise stopping distance.

**Tech Stack:** ES modules, protected flight engine/trajectory sampler, DOM/SVG/CSS, shared Academy services, tests.

**Normative spec:** `docs/superpowers/specs/2026-07-15-academy-flight-height-descent-design.md`

---

## Laws

- Implement only `flight-height-descent`; mastery requires Delivered Loft &
  Launch + Backspin or placement/grandfather.
- Landing Angle is at equal elevation and not stopping power.
- Apex mediator and direct Launch path may not be double-counted.
- Backspin rpm is not an input to current Apex/Landing.
- If trace geometry cannot honor numeric outputs, label it schematic rather than
  drawing a false tangent.

### Task 1: Lock output/decomposition and transfer evaluator

**Files:** `academy-flight-height-descent-model.js`,
`scripts/academy-flight-height-descent-model.test.mjs`, `package.json`.

**Step 1:** Write failing tests for low/base/high Launch, low/base/high speed,
base Landing ledger and both same-Apex states. Assert raw/clamped Landing terms
directly from `solveFlight()`.

**Step 2:** Test live evaluator: both raw Apex [31.3,31.7], one Landing <50,
other >54, displayed difference ≥6, Spin-Loft gap ≥8, different Club Speed,
learner-created distinct states and finite controls. Test 60° clamp honestly.

**Step 3:** Implement adapter without formula duplication; run focused/protected
tests, commit `feat: add Flight Height and Descent adapter`.

### Task 2: Encode content and stopping boundary

**Files:** `academy-flight-height-descent-content.js`,
`scripts/academy-flight-height-descent-content.test.mjs`.

Test S0–S5, five tasks, sheets, six voice cues, equal-elevation wording and
MODEL/NOT MODELED registers. Forbid stopping distance/power, Apex alone decides
Landing, rpm drives current fit, Landing speed/turf inference, universal shot
recommendation and percentage decomposition. Implement frozen manifest, commit.

### Task 3: Build profile instrument S0–S3

**Files:** `academy-flight-height-descent-experience.js`,
`academy-flight-height-descent.css`,
`scripts/academy-flight-height-descent-browser.test.mjs`, modify `academy.html`.

Test canonical plus `apex`/`landing-angle` aliases, preview gate/grandfather,
Launch/Apex/Landing rulers, baseline/current trace, input chips, raw/clamped
ledger, speed-mediated path, same-Apex contrast, persistent rpm boundary,
schematic fallback, voice/reduced motion. Numeric DOM is authoritative. Register,
run all regressions and commit.

### Task 4: Add mastery, migration and result

Test knowledge/live combinations, every threshold/near miss, different-speed
requirement, clamp behavior, raw evidence, reload/retry/duplicate reward. Add
legacy Apex/Landing → Practiced/Review only and accepted Backspin eligibility.
Store both raw inputs/outputs/terms and prerequisite versions. Shared transaction
and router own result; no hardcoded Carry/Total/Wind. Commit
`feat: gate Flight Height and Descent mastery`.

### Task 5: Accept batch

Run copy-web, focused/full UX/WebKit/perf and protected hashes. Capture launch/
speed sweeps, ledger, same-Apex pair/live near misses, clamp, schematic fallback
and S5 at both viewports/motion modes. Verify keyboard, 200% text, screen reader,
trace styles and audio fallback. Pairwise compare two legacy lessons. Update
ledgers, commit `docs: accept Flight Height and Descent`, push.
