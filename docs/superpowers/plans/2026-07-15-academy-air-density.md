# Academy Air Density Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the native Air Density experience that combines Altitude and Temperature into one post-solve estimate while freezing the complete engine shot.

**Architecture:** Add a pure estimate adapter that receives an immutable `solveFlight()` baseline, computes one DensityProxy/AirMultiplier, and renders a sealed-launch atmospheric chamber. Never mutate engine outputs or apply altitude/temperature twice.

**Tech Stack:** ES modules, protected flight engine, local estimate adapter, DOM/SVG/CSS, shared Academy services, tests.

**Normative spec:** `docs/superpowers/specs/2026-07-15-academy-air-density-design.md`

---

## Laws

- Implement only `air-density`; mastery requires Carry or placement.
- Register is `EST PROXY`/`EST AIR`, not measured kg/m³ or full atmosphere.
- Humidity, pressure and ball temperature have no numeric control.
- Impact/launch/engine Carry/Apex/Landing never change under air controls.

### Task 1: Lock density estimator and frozen-shot gate

**Files:** `academy-air-density-model.js`,
`scripts/academy-air-density-model.test.mjs`, `package.json`.

Write failing tests for all six local examples and both mandatory contrast
states. Assert DensityProxy, multiplier, estimated Carry/Apex and a deep-equal
unchanged engine object. Test live pass: A 0 ft/4–6°C; B 4900–5100 ft/24–26°C;
Ball Speed/Launch/Backspin exactly unchanged, engine Carry delta <0.01 yd,
estimated Carry delta 25.0–26.8 yd, proxy gap ≥0.20, nuance opened and approved
inference selected. Implement one combined mediator; no separate completed
bonuses. Run protected test, commit `feat: add Air Density estimate adapter`.

### Task 2: Encode content and atmospheric limits

**Files:** `academy-air-density-content.js`,
`scripts/academy-air-density-content.test.mjs`.

Test S0–S5, five tasks/sheets, eight voice cues and ENGINE versus EST labels.
Fail on measured-density claim, universal percentage advice, humidity control,
temperature changes Ball Speed, altitude changes strike, double multiplier or
full drag/lift solve. Implement frozen manifest and commit.

### Task 3: Build sealed-launch chamber

**Files:** `academy-air-density-experience.js`, `academy-air-density.css`,
`scripts/academy-air-density-browser.test.mjs`, modify `academy.html`.

Test canonical plus `altitude`/`temperature` aliases, preview gate, locked engine
partition, dashed EST trace, density/multiplier ledger, six-state influence,
same-shot contrast, drag/lift nuance, missing-estimator state, voice/reduced
motion and DOM truth. Implement/register, run all regressions and commit.

### Task 4: Add mastery, migration and S5

Test all gate boundaries, any mutated engine field failure, nuance/inference
requirements, raw near misses, reload/retry/duplicate reward. Migration: either
old concept → Practiced; both → Review eligible, not Mastered; remove hardcoded
Temperature-after-Wind navigation while preserving history. Store baseline and
both estimate states. Shared transaction/router own next. Commit
`feat: gate Air Density mastery`.

### Task 5: Accept batch

Run copy-web, focused/full UX/WebKit/perf and protected hashes. Capture sealed
baseline, six examples, same-shot gate/near misses, nuance and result at both
viewports/motion modes. Verify keyboard, 200% text, screen reader, EST line
styles and audio failure. Pairwise compare Altitude + Temperature legacy
lessons. Update ledgers, commit `docs: accept Academy Air Density`, push.
