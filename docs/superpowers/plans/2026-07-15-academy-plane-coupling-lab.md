# Academy Plane Coupling MODEL LAB Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the optional Plane Coupling MODEL LAB that explains Flightglass's raw-to-effective Low Point transform without awarding core mastery.

**Architecture:** Use a pure adapter over unchanged `effectiveLpx()`, `deriveImpact()` and `clubBallContact()`, render coordinated top-down/side-on ledgers, and store exploration evidence outside the core mastery namespace. The live check preserves effective Low Point by changing raw x only.

**Tech Stack:** ES modules, protected geometry engine, DOM/SVG/CSS, shared Academy host/voice/store exploration API, tests.

**Normative spec:** `docs/superpowers/specs/2026-07-15-academy-plane-coupling-lab-design.md`

---

## Laws

- Implement only optional `plane-coupling-lab`, after all core dependencies.
- Never write core Mastered, XP, prerequisite or goal-completion events.
- Voice and S5 never say Mastered.
- Every formula/result is `MODEL`; sources define parameters but do not validate
  Flightglass's exact coupling as a universal player law.

### Task 1: Lock coupling and compensation adapters

**Files:** `academy-plane-coupling-model.js`,
`scripts/academy-plane-coupling-model.test.mjs`, `package.json`.

Write failing tests for all 45°/70° direction-sweep rows and three compensation
fixtures. Assert direct equality with engine functions. Test live compensation:
plane45, direction+4, target effective x 10.5±0.2 cm, raw x learner-created
around 16.4238439 cm, MODEL label acknowledged. Implement imports only, run
protected test, commit `feat: add Plane Coupling lab adapter`.

### Task 2: Encode optional-lab content/state rules

**Files:** `academy-plane-coupling-content.js`,
`scripts/academy-plane-coupling-content.test.mjs`.

Test S0–S5, three knowledge items + live compensation, six voice cues, exact
MODEL LAB/EXPLORED/no-mastery copy and source boundary. Fail on diagnosis,
prescription, Swing Direction=Club Path, core reward/unlock or “validated law.”
Implement frozen manifest and commit.

### Task 3: Build coordinated lab renderer

**Files:** `academy-plane-coupling-experience.js`,
`academy-plane-coupling.css`, `scripts/academy-plane-coupling-browser.test.mjs`,
modify `academy.html`.

Test optional card/exclusion from 13 progress, legacy route, preview, prerequisite
explanation, top-down Swing Direction label, side-on raw/effective markers,
plane exchange-rate comparison, two distinct plane paths, boundary, reduced
motion, voice and numeric DOM ledger. Implement and register; commit after all
core regressions remain green.

### Task 4: Add model check and exploration storage

Add tests for three knowledge items, raw compensation pass/near misses, retry,
reload, legacy `plane-coupling` prefill and repeated completion. Implement
`academy.explore.plane-coupling-lab` evidence through a no-reward exploration
transaction. Assert core Mastered count, XP, reward ledger and recommendation
are byte-equivalent before/after. S5 only returns to Academy/replay/boundary.
Commit `feat: complete optional Plane Coupling lab`.

### Task 5: Accept optional lab

Run copy-web, focused/full tests and protected hashes. Capture direction sweeps,
compensation, boundary and EXPLORED result at target viewports/motion modes.
Verify keyboard, 200% text, screen reader and audio fallback. Pairwise compare
legacy Plane Coupling for model literacy, not coaching. Update ledgers, commit
`docs: accept optional Plane Coupling lab`, push. Its failure must not relock or
invalidate the 13-core Academy.
