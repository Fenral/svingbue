# Impact Portrait Implementation Plan

> **For Codex/Claude Code:** Execute task-by-task with TDD and fresh verification.

**Goal:** Ship the owner-approved portrait Impact range with one active slider,
the exact lens-to-parameter matrix, full-width parameter chips, and no helper
copy below the slider while preserving the existing engine and camera truth.

**Architecture:** Keep `impact-outcome.js`, `impact-camera.js`,
`impact-annotate.js`, and `impact-flight.js` as the authoritative rendering and
physics stack. Extract only the view/control policy into a small pure module,
then reshape `impact.html` around that contract. Add a bridge-safe orientation
adapter and widen native platform orientation declarations so Impact can request
portrait without changing protected identifiers.

**Tech stack:** Static HTML/CSS/ESM, Canvas 2D, Node test runner, Playwright,
Capacitor 7.

---

### Task 1: Lock the control policy with a failing unit test

**Files:**
- Create: `scripts/impact-controls.test.mjs`
- Create: `impact-controls.js`

1. Write failing assertions for the exact Flight/Top/Side parameter lists,
   fallback selection, shared Speed state, formatting, and slider ranges.
2. Run `node --test scripts/impact-controls.test.mjs` and observe the expected
   module-not-found failure.
3. Implement the smallest pure policy module.
4. Rerun the focused test and observe PASS.

### Task 2: Lock the portrait DOM contract with a failing browser test

**Files:**
- Create: `scripts/impact-portrait-browser.test.mjs`
- Modify: `impact.html`

1. Assert portrait hierarchy, one range input, exact visible chips per lens,
   minimum hit targets, even chip widths, no horizontal overflow, no helper
   element below the slider, and persistent Speed.
2. Run the test before production edits and observe the expected failures.
3. Record the old screen as the reproducible baseline.

### Task 3: Implement the portrait range shell

**Files:**
- Modify: `impact.html`
- Modify: `design/mocks/impact-kamera.html`

1. Replace the landscape chrome and multi-control panel with the approved app
   bar, range stage, lens switch, and compact bottom dock.
2. Keep the existing Canvas camera, ground projection, annotations, pin state,
   outcome selector, and render loop.
3. Add the existing local range asset behind the transparent scene canvas.
4. Render exactly one slider and an evenly divided chip grid.
5. Render the active trajectory entirely in Trace orange.
6. Run unit and browser tests until green.

### Task 4: Enable route-level portrait orientation

**Files:**
- Create: `sa-orientation.js`
- Create: `scripts/sa-orientation.test.mjs`
- Modify: `impact.html`
- Modify: `scripts/ios-landscape.mjs`
- Modify: `scripts/android-landscape.mjs`
- Modify: `NATIVE.md`

1. Write failing tests for native plugin registration, portrait lock, web
   fallback, and release-on-exit.
2. Implement a relative, dependency-free adapter over the injected Capacitor
   bridge.
3. Change generated native project policy from landscape-only to supporting
   both portrait and landscape; keep script names for CI compatibility.
4. Verify idempotent platform patch behavior against temporary fixtures.

### Task 5: Verify and publish reversibly

**Files:**
- Modify: `docs/flightglass-autopilot/STATUS.md`
- Modify: `docs/SESSION-HANDOFF.md`
- Modify: `docs/flightglass-autopilot/COORDINATION.md`

1. Inspect 375×812 and 430×932 screenshots in Flight, Top, and Side.
2. Run focused Impact tests, brand verification, browser spot, clean web copy,
   and `npm run verify:change` at the selected gate level.
3. Confirm protected physics files and identifiers are unchanged.
4. Stage only intended files; exclude the owner's `.gitignore` change.
5. Commit with the required Codex co-author trailer.
6. Push `agent/impact-portrait` and open a draft pull request. Do not merge.
