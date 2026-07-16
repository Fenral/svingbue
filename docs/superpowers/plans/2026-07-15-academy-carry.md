# Academy Carry Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the native Carry experience that exposes Ball Speed as the current fit's sole Carry input and labels Total as an illustrative roll extension.

**Architecture:** Add a pure adapter over unchanged flight outputs, render a severe equal-elevation carry plane with solid engine traces and dashed roll tails, and gate mastery with equal Carry/different flight states. Do not restore the legacy launch/spin-window bonus.

**Tech Stack:** ES modules, protected flight engine/trajectory sampler, DOM/SVG/CSS, shared Academy services, tests.

**Normative spec:** `docs/superpowers/specs/2026-07-15-academy-carry-design.md`

---

## Laws

- Implement only `carry`; mastery requires Speed Transfer or placement.
- Current Carry consumes Ball Speed only. Real Launch/Spin effects are material
  but omitted, never fabricated.
- Always say Illustrative Total; no turf/slope/course prediction.

### Task 1: Lock Carry/Total adapter and equal-Carry gate

**Files:** `academy-carry-model.js`, `scripts/academy-carry-model.test.mjs`,
`package.json`.

Write failing tests for three speed states and both equal-Carry states, including
Launch/Apex/Landing/Roll/Total. Assert same Ball Speed gives exact same raw Carry
across contrasting Launch and no hidden bonus exists. Test live pass: Carry
[174.15,174.35], Ball Speed [120.50,120.70], Launch gap ≥8°, Apex gap ≥9 yd,
Landing gap ≥12°, Total gap ≥3 yd, one Landing <48°, other at visible 60° clamp,
approved inference, learner-created distinct states. Implement using engine
fields only; run protected test; commit `feat: add Carry model adapter`.

### Task 2: Encode content and rollout limits

**Files:** `academy-carry-content.js`,
`scripts/academy-carry-content.test.mjs`.

Test S0–S5, five tasks/sheets, seven voice cues, equal-elevation definition and
MODEL/REAL-WORLD boundary. Fail on launch/spin bonus, optimal window, Backspin
drives current Carry, Total as measured/predicted course distance, turf/slope
claims or universal target. Implement manifest and commit.

### Task 3: Build carry-plane instrument

**Files:** `academy-carry-experience.js`, `academy-carry.css`,
`scripts/academy-carry-browser.test.mjs`, modify `academy.html`.

Test canonical plus `carry`/`total` legacy routes, preview gate, solid trace/
carry plane, dashed roll tail, engine/illustrative styling, speed sweep, equal-
Carry contrast, Landing clamp/model limits, trace-schematic fallback, voice and
reduced motion. Numeric DOM truth is authoritative. Implement/register and
commit after regressions.

### Task 4: Add mastery, migration and S5

Test all knowledge/live threshold edges, inference acknowledgment, raw near
misses, restore/retry/duplicate reward. Migration: either old concept →
Practiced; both → Review eligible, not Mastered; `total` deep link opens owned
sheet. Store both raw states/terms. Shared router chooses goal completion, Air
Density or Wind; no old chain. Commit `feat: gate Carry mastery`.

### Task 5: Accept batch

Run copy-web, focused/full UX/WebKit/perf and protected hashes. Capture speed
sweep, equal Carry, clamp, illustrative roll and boundary/near misses at target
viewports/motion modes. Verify keyboard, 200% text, screen reader, line-style
distinction and audio fallback. Pairwise compare Carry + Total legacy lessons.
Update ledgers, commit `docs: accept Academy Carry`, push.
