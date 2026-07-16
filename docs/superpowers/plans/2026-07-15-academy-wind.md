# Academy Wind Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the native Wind experience that separates along-line Carry adjustment, cross-line drift and the engine's existing Start-plus-Curve Carry Side.

**Architecture:** Add a pure first-order post-solve estimator around an immutable engine baseline, render a vector tunnel with a three-row lateral ledger, and gate mastery with head/left-cross and tail/right-cross states. Final endpoint is engine Carry Side plus Wind Drift, never drift alone.

**Tech Stack:** ES modules, protected flight engine, local wind estimator, DOM/SVG/CSS, shared Academy services, tests.

**Normative spec:** `docs/superpowers/specs/2026-07-15-academy-wind-design.md`

---

## Laws

- Implement only `wind`; mastery requires Carry + Carry Side or placement.
- Positive internal headwind means headwind; positive crosswind means from left
  and rightward drift under current sign convention.
- Wind does not change Spin Axis, Backspin or impact.
- Exposure is a heuristic, not measured Hang Time.
- Correct baseline at DL30 is Face weight 0.7500, Start +0.2500°, engine Carry
  Side +13.4326 yd.

### Task 1: Lock wind estimator and corrected endpoints

**Files:** `academy-wind-model.js`, `scripts/academy-wind-model.test.mjs`,
`package.json`.

Write failing tests for the complete normative baseline, head multiplier 0.8776,
tail 1.0816, exposure 1.153392857, estimated carries, drifts and corrected final
endpoints +19.6251/+5.8006 yd. Assert:

```js
engineCarrySide === flight.offline
firstOrderWindSide === engineCarrySide + windDrift
```

and deep-equal engine baseline across wind states. Test live ranges from Section
Task 5 plus component-rebuild/inference requirements. Implement post-solve
functions without touching engine, run protected test, commit
`feat: add Wind estimate adapter`.

### Task 2: Encode content and vector boundaries

**Files:** `academy-wind-content.js`, `scripts/academy-wind-content.test.mjs`.

Test S0–S5, five tasks/sheets, seven voice cues, sign explanations and ENGINE/
EST/FIRST-ORDER labels. Fail on full wind simulation, wind changes Spin Axis,
drift replaces engine Carry Side, exposure=Hang Time, gust/course prediction,
equal head/tail effect or hidden asymmetry. Implement manifest and commit.

### Task 3: Build vector tunnel S0–S3

**Files:** `academy-wind-experience.js`, `academy-wind.css`,
`scripts/academy-wind-browser.test.mjs`, modify `academy.html`.

Test route/alias, preview gate, immutable solid engine trace, separated head/
tail and cross arrows, engine Start/Curve/Carry Side rows, dashed drift and
first-order endpoint, asymmetry comparison, exposure proxy, sign verbalization,
missing-estimator state, voice/reduced motion and numeric DOM truth. Implement/
register and commit after all regressions.

### Task 4: Add two-state mastery, migration and S5

Test all range edges, immutable engine deltas, component rebuild, inference,
wrong cross sign, drift-only endpoint near miss, restore/retry and duplicate
reward. Migration legacy Wind → Practiced/Review only; remove old environment
chain without history loss. Store baseline and both estimate states/components.
Shared transaction/router finish conditions goal. Commit
`feat: gate Wind mastery`.

### Task 5: Accept batch

Run copy-web, focused/full UX/WebKit/perf and protected hashes. Capture baseline,
head/tail asymmetry, both cross directions, exposure, three-row endpoint ledger,
live near misses and result at both viewports/motion modes. Verify keyboard,
200% text, screen reader, sign+line styles and audio failure. Pairwise compare
legacy Wind. Update ledgers, commit `docs: accept Academy Wind`, push.
