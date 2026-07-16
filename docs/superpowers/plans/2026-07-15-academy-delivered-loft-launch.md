# Academy Delivered Loft and Launch Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the native Delivered Loft & Launch experience that separates face orientation, clubhead travel and ball launch, then proves equal launch can hide different delivery.

**Architecture:** Add a pure adapter over unchanged `solveFlight()`, a side-on three-arrow instrument, and a two-capture equal-launch gate. Dynamic Loft and Attack remain direct controls; Launch is an output and Spin Loft is the downstream bridge to Backspin.

**Tech Stack:** ES modules, protected flight engine, DOM/SVG/CSS, shared Academy services, Node/browser tests.

**Normative spec:** `docs/superpowers/specs/2026-07-15-academy-delivered-loft-launch-design.md`

---

## Laws

- Implement only `delivered-loft-launch`; mastery requires Up or Down at Impact
  or placement, preview always open.
- Never call Dynamic Loft static/stamped loft, Attack face orientation or Launch
  Apex.
- Coefficients 0.62/0.25 are model sensitivities, not percentages.
- Launch cannot be dragged; no technique prescription.

### Task 1: Lock model and equal-launch evaluator

**Files:** `academy-delivered-loft-launch-model.js`,
`scripts/academy-delivered-loft-launch-model.test.mjs`, `package.json`.

**Step 1:** Write failing exact tests for Base/Loft+4/Attack+4 and both Section
4.6 equal-launch states. Compare Launch, Spin Loft, Ball Speed, Backspin, Apex,
Landing and Carry directly with `solveFlight()`.

**Step 2:** Assert finite differences: +1 Dynamic Loft → +0.62 Launch/+1 Spin
Loft; +1 Attack → +0.25 Launch/−1 Spin Loft. Assert clamp metadata comes from
engine raw/clamped terms.

**Step 3:** Test live evaluator: both raw Launch in [18.4,18.8], Spin-Loft gap
≥10°, one Attack >0/one <0, distinct learner-created states, finite/in range.

**Step 4:** Implement adapter using engine breakdown values only, run focused/
protected tests, commit `feat: add Delivered Loft and Launch adapter`.

### Task 2: Encode content and truth limits

**Files:** `academy-delivered-loft-launch-content.js`,
`scripts/academy-delivered-loft-launch-content.test.mjs`.

Test exact S0–S5, five tasks/sheets, seven voice cues, arrow labels and MODEL/
HELD/NOT MODELED tags. Forbid percentage interpretation, exact coefficients as
universal, equal-launch=equal-flight, club-simulation labels, hidden Attack or
Spin-Loft path and phone-measured delivery. Implement frozen manifest, commit.

### Task 3: Build S0–S3 delivery wedge

**Files:** `academy-delivered-loft-launch-experience.js`,
`academy-delivered-loft-launch.css`,
`scripts/academy-delivered-loft-launch-browser.test.mjs`, modify `academy.html`.

Browser tests cover canonical route plus `dynamic-loft`/`launch-angle` aliases,
preview gate, non-overlapping FACE/TRAVEL/BALL arrows, exact equation ledger,
Base/Loft/Attack comparison, prediction before reveal, Spin-Loft opposition,
equal-launch contrast, clamp label, boundary sheets, voice and reduced motion.
Implement numeric DOM truth, register renderer/CSS, run regressions, commit.

### Task 4: Add mastery, migration and S5

Test knowledge/live combinations, both Launch edges, Spin-Loft gap edge,
opposite-sign requirement, distinct-state/input requirement, raw near misses,
reload/retry/duplicate reward. Add both legacy aliases → Practiced/Review only;
prior accepted Backspin state must remain untouched. Persist both raw states and
terms. Shared transaction/router own completion. Commit
`feat: gate Delivered Loft and Launch mastery` after full tests.

### Task 5: Accept batch

Run copy-web, focused/full UX/WebKit/perf and protected hashes. Capture all arrow
comparisons, equal-launch pair/gate/near misses, clamp and result at both target
viewports/motion modes. Verify keyboard, 200% text, screen reader and audio
failure. Pairwise compare two legacy lessons. Update ledgers, commit
`docs: accept Delivered Loft and Launch`, push. Stop before Backspin amendment
on any failed critical gate.
