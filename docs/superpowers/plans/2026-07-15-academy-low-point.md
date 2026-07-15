# Academy Low Point Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the native Low Point experience that teaches the bottom as a place and proves ball-before-bottom versus bottom-before-ball sequences.

**Architecture:** Use a pure geometry adapter over unchanged `effectiveLpx()` and `deriveImpact()`, a side-on event ruler, and a two-capture raw gate. Plane is a material modifier; z is an explicit Attack invariant and bridge to Contact Height.

**Tech Stack:** ES modules, protected geometry engine, DOM/SVG/CSS, shared Academy services, Node/browser tests.

**Normative spec:** `docs/superpowers/specs/2026-07-15-academy-low-point-design.md`

---

## Laws

- Implement only `low-point`; S4 requires Up or Down at Impact or placement.
- Preview always open. No quality score or swing prescription.
- Raw Low Point and effective Low Point are distinct when direction coupling is
  active; core task holds direction zero.

### Task 1: Lock geometry fixtures and transfer evaluator

**Files:** `academy-low-point-model.js`,
`scripts/academy-low-point-model.test.mjs`, `package.json`.

**Step 1:** Write failing tests for seven Low Point/Attack/Club Path fixtures,
45/55/70° plane modifier and exact z invariance from Sections 4.3–4.5.

**Step 2:** Test `evaluateLowPointTransfer`: A effective x ahead + raw Attack
[−5,−3] + learner `ball-first`; B effective x behind + raw Attack [+1,+3] +
learner `bottom-first`; only Low Point Distance editable.

**Step 3:** Implement by importing geometry functions, never duplicating arc
equations. Run focused/protected tests and commit
`feat: add Low Point model adapter`.

### Task 2: Encode curriculum content

**Files:** `academy-low-point-content.js`,
`scripts/academy-low-point-content.test.mjs`.

Test exact S0–S5 copy/tasks/sheets/seven voice cues. Forbid Low Point in degrees,
“ahead always good,” z changes Attack, quality grade, divot truth or universal
fix. Implement frozen manifest and commit.

### Task 3: Build event-ruler instrument

**Files:** `academy-low-point-experience.js`, `academy-low-point.css`,
`scripts/academy-low-point-browser.test.mjs`, modify `academy.html`.

Write failing tests for route/alias, preview gate, ball/Low Point marker, signed cm
bracket, ordered event chips, tangent, plane comparison, z-invariant proof,
accessible adjustable alternative, reduced motion and voice sync. Implement
semantic DOM truth plus restrained SVG; register and commit after all current
regressions pass.

### Task 4: Add mastery, migration and S5

Add failing browser tests for four knowledge items, both event orders/ranges,
raw near misses, wrong learner label, reload/retry and duplicate reward. Add
migration test for legacy `low-point` → Practiced/placement only. Persist raw and
effective x plus raw Attack for both captures. Shared transaction owns reward;
journey router chooses Contact Height or another goal. Commit
`feat: gate Low Point mastery`.

### Task 5: Accept batch

Run copy-web, all focused/full suites and protected hashes. Capture ahead,
behind, plane modifier, z invariant, both live states, near misses and result at
both viewports/motion modes. Verify keyboard, text scaling, screen reader and
audio fallback. Pairwise compare legacy Low Point. Update ledgers, commit
`docs: accept Academy Low Point`, push; stop before Contact Height on failure.
