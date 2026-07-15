# Academy Speed Transfer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the native Speed Transfer experience that separates Club Speed, modeled Smash ratio and Ball Speed, then proves equal Ball Speed can come from different transfers.

**Architecture:** Add a pure adapter over unchanged `solveFlight()`, render an aerospace-style CLUB → RATIO → BALL ledger, and gate mastery with two raw equal-output captures. Smash remains a speed ratio/model output, never energy percentage or centeredness diagnosis.

**Tech Stack:** ES modules, protected flight engine, DOM/SVG/CSS, shared Academy services, Node/browser tests.

**Normative spec:** `docs/superpowers/specs/2026-07-15-academy-speed-transfer-design.md`

---

## Laws

- Implement only `speed-transfer`; no mastery prerequisite.
- Club Speed is speed, not “energy.” Smash is Ball Speed ÷ Club Speed, not
  percent energy or a strike-quality score.
- Current Smash responds only to simplified Spin Loft; impact location, mass,
  face flexibility, shaft and friction remain not modeled.

### Task 1: Lock adapter, clamps and equal-output gate

**Files:** `academy-speed-transfer-model.js`,
`scripts/academy-speed-transfer-model.test.mjs`, `package.json`.

Write failing tests for all five Section 4.5 states, both 130.56 mph states and
upper/lower clamp thresholds. Compare raw engine Smash/Ball Speed/Carry/Backspin.
Test live pass: each Ball Speed [130.46,130.66], Club Speed gap ≥5 mph, Spin-Loft
gap ≥15°, Smash gap ≥0.06, neither clamp active, compare sheet opened, approved
inference selected, learner-created distinct states. Implement without copying
Smash constants; run protected test; commit `feat: add Speed Transfer adapter`.

### Task 2: Encode content and ratio boundaries

**Files:** `academy-speed-transfer-content.js`,
`scripts/academy-speed-transfer-content.test.mjs`.

Test S0–S5, five tasks/sheets, seven voice cues and truth tags. Fail on percent-
energy, centered/toe/heel diagnosis, “Club Speed is energy,” Ball Speed reveals
delivery, clamp extrapolation or universal club calibration. Implement frozen
manifest and commit.

### Task 3: Build energy ledger S0–S3

**Files:** `academy-speed-transfer-experience.js`,
`academy-speed-transfer.css`, `scripts/academy-speed-transfer-browser.test.mjs`,
modify `academy.html`.

Tests cover canonical plus three legacy aliases, CLUB/RATIO/BALL stations,
multiplication ledger, speed sweep, Spin-Loft/Smash change, clamp labels,
equal-output ghost, compare inference, model limits, voice/reduced motion and
accessible DOM values. Implement/register, keep pulse decorative and one at a
time, run all regressions and commit.

### Task 4: Add mastery, migration and S5

Test knowledge/live combinations, every threshold, clamp-active failure,
compare/inference requirements, raw near misses, restore/retry and duplicate
reward. Migration: any old concept → Practiced; all three → Review eligible,
never auto-Mastered; all history preserved. Store both states/raw outputs.
Shared transaction/router own reward/next. Commit
`feat: gate Speed Transfer mastery`.

### Task 5: Accept batch

Run copy-web, focused/full UX/WebKit/perf and protected hashes. Capture speed/
Spin-Loft sweeps, clamps, equal-output gate/near misses and result at both
viewports/motion modes. Verify keyboard, 200% text, screen reader and audio
fallback. Pairwise compare three legacy lessons. Update ledgers, commit
`docs: accept Speed Transfer`, push; stop before Carry on failure.
