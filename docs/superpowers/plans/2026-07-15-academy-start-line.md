# Academy Start Line Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the native Start Line experience that teaches Launch Direction as a loft-modified Face/Path blend and proves transfer across a held-loft change.

**Architecture:** Add a pure adapter over unchanged `solveFlight()`, a frozen content/cue manifest, and a dedicated top-down departure renderer mounted through the accepted Academy host. Store raw gate evidence through the shared mastery transaction; never duplicate the Face-weight formula in the renderer.

**Tech Stack:** ES modules, `impact-flight.js`, DOM/SVG/CSS, shared Academy host/store/voice modules, Node tests, Academy browser harness.

**Normative spec:** `docs/superpowers/specs/2026-07-15-academy-start-line-design.md`

---

## Preconditions and stop laws

- Academy Home/store batch is accepted and its Backspin regression is green.
- Implement only `start-line` in this batch.
- Never edit either protected physics file.
- Learner-visible term is Launch Direction inside the Start Line experience.
- No curve, final landing point or dispersion graphic on S1/S2.
- Face-to-Path may be previewed but Shape owns its assessment.

### Task 1: Lock the Start Line model adapter

**Files:**

- Create: `academy-start-line-model.js`
- Create: `scripts/academy-start-line-model.test.mjs`
- Modify: `package.json`

**Step 1: Write failing exact-fixture tests**

Import `solveStartLineState` and assert all seven Section 4.1 fixtures, including:

```js
assert.equal(solveStartLineState({ faceAngle: 2, clubPath: -2,
  dynamicLoft: 30 }).launchDirection, 1);
assert.equal(solveStartLineState({ faceAngle: 2, clubPath: -2,
  dynamicLoft: 13 }).faceShare, 0.835);
assert.equal(solveStartLineState({ faceAngle: 3, clubPath: 3,
  dynamicLoft: 46 }).launchDirection, 3);
```

Compare adapter values to a direct `solveFlight()` result within `1e-9`.

**Step 2: Write failing live-gate tests**

Export `evaluateStartLineTransfer`. Test:

- Phase A target tolerance exactly ±0.10° using raw value;
- Phase B prediction `toward-face`, `fixed` or `toward-path`;
- real Face/Path change required after loft change;
- matched Face/Path exception does not require meaningless input change;
- non-finite/out-of-range input fails;
- rounded display inside tolerance cannot pass when raw value is outside.

**Step 3: Run focused test**

Expected: FAIL because module is absent.

**Step 4: Implement minimal adapter**

Call `solveFlight()` with held Attack −3° and Club Speed 90 mph. Return engine
outputs plus `faceContribution`, `pathContribution`, `faceShare` from the
engine's own `startFaceW`. Do not recompute `0.90 − 0.005 × loft` locally.

**Step 5: Run focused + protected baseline tests**

```powershell
node --test scripts/academy-start-line-model.test.mjs
node --test scripts/academy-protected-baseline.test.mjs
```

Expected: PASS.

**Step 6: Commit**

```powershell
git add academy-start-line-model.js scripts/academy-start-line-model.test.mjs package.json
git commit -m "feat: add Start Line model adapter"
```

### Task 2: Encode exact content, sheets, tasks and voice cues

**Files:**

- Create: `academy-start-line-content.js`
- Create: `scripts/academy-start-line-content.test.mjs`

**Step 1: Write failing manifest tests**

Require:

- experience ID/title/concept IDs and prerequisite list;
- S0–S5 visible copy from the spec;
- all five mastery tasks and correct indices;
- six authored voice signatures, each 12–24 words;
- Launch Direction, Face Angle, Club Path, Delivered Loft and Model Limits sheets;
- truth tags `DEFINITION`, `MODEL`, `HELD`, `NOT MODELED`;
- no learner-visible `shot pattern`, `dispersion`, fixed `75/25 rule` or
  universal “face controls start” diagnosis.

**Step 2: Verify failure, then implement frozen data only**

Content functions may format approved numeric fragments; they cannot call the
solver or generate prose. Give every voice cue a stable cue ID and visual target.

**Step 3: Run tests and commit**

```powershell
node --test scripts/academy-start-line-content.test.mjs
git add academy-start-line-content.js scripts/academy-start-line-content.test.mjs
git commit -m "feat: author Start Line curriculum content"
```

### Task 3: Build S0–S3 departure instrument

**Files:**

- Create: `academy-start-line-experience.js`
- Create: `academy-start-line.css`
- Create: `scripts/academy-start-line-browser.test.mjs`
- Modify: `academy.html`

**Step 1: Add failing browser tests for S0–S3**

Assert:

- canonical and all three legacy routes open the same experience;
- a legacy concept route opens the matching owned sheet;
- S0 has one primary action;
- S1 shows target, Face, Path and Launch rays with no curve/landing trace;
- changing Face/Path updates raw equation and accessible readouts;
- S2 Low/Mid/High cases return 83.5/75.0/67.0% Face share;
- matched inputs prove no loft effect on Launch Direction;
- S3 predictions do not trap forward navigation;
- voice cue and visual target share one content signature.

**Step 2: Verify failure**

Run the focused browser test. Expected: renderer unavailable.

**Step 3: Implement the dedicated renderer**

Export `mountStartLineExperience(options)`. Use semantic DOM for all values and
SVG only for interpretation. One prior-state ghost is allowed. Mark visual
exaggeration `ANGLE ×2` if used.

**Step 4: Register renderer and CSS**

Add renderer key `start-line` to host registration and a stylesheet link in
`academy.html`. Do not add a lesson-specific global next pointer.

**Step 5: Run browser, Academy and WebKit tests**

Expected: S0–S3 tests and all Backspin regressions PASS.

**Step 6: Commit**

```powershell
git add academy-start-line-experience.js academy-start-line.css academy.html scripts/academy-start-line-browser.test.mjs
git commit -m "feat: build Start Line instrument"
```

### Task 4: Implement S4 transfer and S5 evidence

**Files:**

- Modify: `academy-start-line-experience.js`
- Modify: `scripts/academy-start-line-browser.test.mjs`
- Test: `scripts/academy-start-line-model.test.mjs`

**Step 1: Add failing mastery browser cases**

Cover 3/5 + live, 4/5 without live, valid 4/5 + live, retry with new deterministic
fixture, matched-pair exception, raw near miss, restore after reload and duplicate
reward. Assert two-phase raw evidence is stored.

**Step 2: Implement fixture selection and gate UI**

Use deterministic seeded fixture IDs. Phase A hides contribution hints. Phase B
requires prediction before control input and uses raw engine values.

**Step 3: Submit through shared store transaction**

Never set Mastered or XP in the renderer. S5 displays Practiced or Mastered from
the returned normalized state and asks the shared journey router for next action.

**Step 4: Run focused/full tests and commit**

```powershell
node --test scripts/academy-start-line-model.test.mjs
node --test --test-concurrency=1 scripts/academy-start-line-browser.test.mjs
npm run test:academy
git add academy-start-line-experience.js scripts/academy-start-line-browser.test.mjs
git commit -m "feat: gate Start Line mastery"
```

### Task 5: Verify native acceptance and close

**Files:**

- Modify: `docs/flightglass-autopilot/STATUS.md`
- Modify: `docs/SESSION-HANDOFF.md`
- Generated: `www/` via `npm run copy-web`

**Step 1:** Run copy, focused tests, full UX/WebKit/perf and protected hash test.

**Step 2:** Capture S0–S5, two transfer phases, near miss and mastered result at
430×932/375×812 normal/reduced motion.

**Step 3:** Complete keyboard, 200% text, screen-reader semantic and audio-failure
passes. Numeric truth must exist outside SVG.

**Step 4:** Pairwise-blind compare against the three legacy article lessons.

**Step 5:** Record exact evidence, secret scan, `git diff --check`, stage only
intended files, commit `docs: accept Academy Start Line`, and push.

Stop before Shape unless zero critical defects, all category floors, all
critical checks, pairwise preference and protected-file identity pass.
