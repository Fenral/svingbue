# Academy Contact Height Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the native Contact Height experience that moves modeled path height through z while proving the Attack tangent stays unchanged.

**Architecture:** Wrap unchanged `clubBallContact()`/`deriveImpact()` and the existing flat-ground helper in a pure adapter, render a close side-on contact window, and gate mastery with two raw height captures at one invariant Attack value. Preserve internal/legacy ID `strike-depth` while using Contact Height everywhere learner-facing.

**Tech Stack:** ES modules, protected geometry engine, existing ground-contact helper, DOM/SVG/CSS, shared Academy services, tests.

**Normative spec:** `docs/superpowers/specs/2026-07-15-academy-strike-depth-design.md`

---

## Laws

- Implement only `strike-depth`; mastery requires Low Point or placement.
- Never call z divot depth or clubZ face Impact Height.
- Quality bands and 0–100 percentage are secondary/debug only and never gate.
- z must not become a hidden Attack input.

### Task 1: Lock z, lift, ground and invariance adapters

**Files:** `academy-contact-height-model.js`,
`scripts/academy-contact-height-model.test.mjs`, `package.json`.

**Step 1:** Write failing tests for the full nine-state z sweep, four-state lift
budget, compensation pair, 1:1 z delta and exact Attack invariance.

**Step 2:** Test ground-entry helper order against verified fixtures without
freezing the intentionally unverified −10 mm entry distance.

**Step 3:** Test live gate: raw clubZ A [1,5] mm, B [22,26] mm; raw Attack equals
initial within `1e-12`; B labelled above center; A acknowledges bottom may remain
below ground; x/plane/direction/radius locked; no rounded/quality decision.

**Step 4:** Implement imports only, run focused/protected tests and commit
`feat: add Contact Height model adapter`.

### Task 2: Encode learner-safe content

**Files:** `academy-contact-height-content.js`,
`scripts/academy-contact-height-content.test.mjs`.

Test title/ID distinction, S0–S5, five tasks, sheets, seven voice cues and truth
registers. Fail on primary “Strike Depth,” literal divot, measured face impact,
deeper-z/steeper-Attack, ground-crossing inference, quality truth, x+Attack
double counting or prescription. Implement frozen manifest and commit.

### Task 3: Build Contact Window S0–S3

**Files:** `academy-contact-height-experience.js`,
`academy-contact-height.css`, `scripts/academy-contact-height-browser.test.mjs`,
modify `academy.html`.

Browser tests cover `strike-depth` alias and Contact Height title, preview gate,
ball/ground/arc/path point, x/z/Contact rulers, ball-center reference, ground
entry only when solved, persistent invariant Attack chip, z sweep, lift budget,
compensation pair, boundary sheets, voice and reduced motion. Implement numeric
DOM truth, register renderer/CSS and commit after regressions.

### Task 4: Add live invariance mastery and migration

Test knowledge/live combinations, exact 1e−12 invariant, both raw windows,
above-center/below-ground labels, locked controls, near misses, reload/retry and
duplicate reward. Add legacy `strike-depth` → Practiced/placement only and deep
link resolution. Store raw x/z/plane/direction/radius/clubZ/Attack. Submit shared
transaction and commit `feat: gate Contact Height mastery`.

### Task 5: Accept batch

Run copy-web, focused/full UX/WebKit/perf and protected hashes. Capture z sweep,
ground states, compensation, both live heights/near misses and result at both
viewports/motion modes. Verify keyboard alternative, 200% text, screen reader,
color-independent status and audio failure. Pairwise compare legacy Strike
Depth. Update ledgers, commit `docs: accept Academy Contact Height`, push.
