# Flightglass Mechanics MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing Impact Studio into a sellable, non-coaching cause→effect instrument with direct Impact Inputs and derived Arc Inputs, backed only by unchanged repository engines.

**Architecture:** A new pure `impact-mechanics-model.js` composes the protected flight and geometry APIs behind two explicit modes. `impact-studio.html` remains the shipping route and owns DOM/canvas interaction; `impact-studio.css` owns the surface-specific design-system layer while consuming incumbent tokens. A focused unit suite locks numeric truth, and a Playwright contract locks live feedback, mode authority, responsive behavior, keyboard access, and reduced-motion parity.

**Tech Stack:** Static HTML/CSS, browser-native ES modules and Canvas, Node test runner, Playwright Core, existing Flightglass engines and QA harness.

---

## File structure

- Create `impact-mechanics-model.js`: pure two-mode adapter; no DOM and no new physics.
- Create `impact-studio.css`: Mechanics Lab tokens, layout, components, states, and responsive rules.
- Modify `impact-studio.html`: accessible shell, two mode panels, live canvases/readouts, controller, and direction contract.
- Modify `design/mocks/impact-studio.html`: normative screen contract matching the shipping hierarchy and copy.
- Create `scripts/impact-mechanics-model.test.mjs`: deterministic delivery and geometry fixtures.
- Create `scripts/impact-studio-browser.test.mjs`: Chromium interaction/a11y/responsive contract.
- Modify `config/flightglass-surfaces.json`: register the shipping Mechanics Lab in the audit manifest.
- Create `DESIGN.md`: post-build durable design-system contract derived from the shipped result.
- Update `docs/flightglass-autopilot/COORDINATION.md`: claim/release the exact files.

### Task 1: Lock the mechanics adapter with failing tests

**Files:**
- Create: `scripts/impact-mechanics-model.test.mjs`
- Create: `impact-mechanics-model.js`

- [ ] **Step 1: Write the failing delivery and arc fixtures**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  solveDelivery,
  solveArc,
  handoffArcToDelivery,
} from '../impact-mechanics-model.js';

const close = (actual, expected, tolerance = 1e-6) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);

test('delivery mode delegates the neutral 7-iron state to selectOutcome', () => {
  const result = solveDelivery({ face: 0, path: 0, attack: -3, dynLoft: 30, speed: 90 });
  close(result.outcome.deg.launchDir, 0);
  close(result.outcome.deg.launchAng, 15.382746047638626);
  close(result.outcome.misc.backspin, 6623.095880188069);
  close(result.outcome.raw.carry, 173.99911891890417);
});

test('face and path retain different causal roles', () => {
  const face = solveDelivery({ face: 4, path: 0, attack: -3, dynLoft: 30, speed: 90 });
  const path = solveDelivery({ face: 0, path: 4, attack: -3, dynLoft: 30, speed: 90 });
  close(face.outcome.deg.launchDir, 3);
  close(path.outcome.deg.launchDir, 1);
  assert.ok(face.outcome.m.curve > 0);
  assert.ok(path.outcome.m.curve < 0);
});

test('arc mode maps UI height to lowPoint.z and derives delivery', () => {
  const result = solveArc({ lowPointCm: 10.5, lowPointHeightMm: -2, swingDirection: 0, swingPlane: 55 });
  close(result.effectiveLowPointCm, 10.5);
  close(result.attackAngle, -4.110245535124602);
  close(result.clubPath, 2.884190020209084);
  close(result.contactHeightMm, 1.7702099868106393);
  assert.equal(result.contactBand, 'Pure');
});

test('swing direction and plane change effective low point and path', () => {
  const flat = solveArc({ lowPointCm: 10.5, lowPointHeightMm: -2, swingDirection: 4, swingPlane: 45 });
  const steep = solveArc({ lowPointCm: 10.5, lowPointHeightMm: -2, swingDirection: 4, swingPlane: 70 });
  assert.notEqual(flat.clubPath, steep.clubPath);
  assert.notEqual(flat.rawLowPointCm, steep.rawLowPointCm);
});

test('arc handoff changes only derived attack and path', () => {
  const arc = solveArc({ lowPointCm: 10.5, lowPointHeightMm: -2, swingDirection: 0, swingPlane: 55 });
  const handed = handoffArcToDelivery(arc, { face: 1, path: 0, attack: 0, dynLoft: 30, speed: 90 });
  close(handed.path, arc.clubPath);
  close(handed.attack, arc.attackAngle);
  assert.equal(handed.face, 1);
  assert.equal(handed.dynLoft, 30);
});
```

- [ ] **Step 2: Run the test and verify the missing-module failure**

Run: `node --test scripts/impact-mechanics-model.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `impact-mechanics-model.js`.

- [ ] **Step 3: Implement the pure adapter**

```js
import { selectOutcome } from './impact-outcome.js';
import {
  RADIUS,
  effectiveLpx,
  deriveImpact,
  clubBallContact,
  strikeQuality,
} from './swing-parameters-and-impact.js';
import { lowXForUiLow } from './geometry-controller.js';

export const DEFAULT_DELIVERY = Object.freeze({ face: 0, path: 0, attack: -3, dynLoft: 30, speed: 90 });
export const DEFAULT_ARC = Object.freeze({ lowPointCm: 10.5, lowPointHeightMm: -2, swingDirection: 0, swingPlane: 55 });

export function solveDelivery(input = DEFAULT_DELIVERY) {
  const state = { ...DEFAULT_DELIVERY, ...input };
  return Object.freeze({ state: Object.freeze(state), outcome: selectOutcome(state) });
}

export function solveArc(input = DEFAULT_ARC) {
  const values = { ...DEFAULT_ARC, ...input };
  const state = {
    radius: RADIUS,
    planeAngle: values.swingPlane,
    swingDirection: values.swingDirection,
    lowPoint: { x: 0, y: 0, z: values.lowPointHeightMm / 1000 },
  };
  state.lowPoint.x = lowXForUiLow(values.lowPointCm, state);
  const delivery = deriveImpact(state);
  const contact = clubBallContact(state);
  const strike = strikeQuality(state);
  return Object.freeze({
    state: Object.freeze({ ...state, lowPoint: Object.freeze({ ...state.lowPoint }) }),
    effectiveLowPointCm: effectiveLpx(state) * 100,
    rawLowPointCm: state.lowPoint.x * 100,
    contactHeightMm: contact.clubZ * 1000,
    contactBand: strike.band,
    attackAngle: delivery.attackAngle,
    clubPath: delivery.clubPath,
  });
}

export function handoffArcToDelivery(arcResult, deliveryInput = DEFAULT_DELIVERY) {
  return Object.freeze({
    ...DEFAULT_DELIVERY,
    ...deliveryInput,
    attack: arcResult.attackAngle,
    path: arcResult.clubPath,
  });
}
```

- [ ] **Step 4: Run the focused model suite**

Run: `node --test scripts/impact-mechanics-model.test.mjs`

Expected: 5 tests, 5 pass, 0 fail.

- [ ] **Step 5: Commit the model slice**

```powershell
git add impact-mechanics-model.js scripts/impact-mechanics-model.test.mjs
git commit -m "feat(impact): add protected mechanics adapter" -m "Co-Authored-By: Codex <noreply@openai.com>"
```

### Task 2: Build the two-authority Mechanics Lab

**Files:**
- Create: `impact-studio.css`
- Modify: `impact-studio.html`
- Modify: `design/mocks/impact-studio.html`

- [ ] **Step 1: Write the browser contract before changing the surface**

Create `scripts/impact-studio-browser.test.mjs` with assertions for:

```js
test('Mechanics Lab opens directly with live Impact Inputs', async () => {
  assert.equal(await page.locator('[data-mechanics-mode="delivery"]').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('[data-outcome="carry"]').isVisible(), true);
  assert.match(await page.locator('[data-cause]').textContent(), /Face|Path|Attack|loft/i);
});

test('Face input changes start and curve without hiding the flight', async () => {
  const start = await page.locator('[data-outcome="start"]').textContent();
  await page.locator('#delivery-face').fill('4');
  assert.notEqual(await page.locator('[data-outcome="start"]').textContent(), start);
  assert.equal(await page.locator('#flight-canvas').isVisible(), true);
});

test('Arc Inputs derive attack and path and can hand them to delivery', async () => {
  await page.getByRole('button', { name: 'Arc Inputs' }).click();
  await page.locator('#arc-direction').fill('4');
  const derivedPath = await page.locator('[data-derived="path"]').textContent();
  await page.getByRole('button', { name: 'Use in Impact Inputs' }).click();
  assert.equal(await page.locator('[data-mechanics-mode="delivery"]').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('#delivery-path-value').textContent(), derivedPath);
});
```

The file must also run the same core checks at `932×430`, `430×932`, and with `reducedMotion: 'reduce'`; collect console/page errors and assert 44 px target height.

- [ ] **Step 2: Run the browser test and verify it fails against the old surface**

Run: `node --test scripts/impact-studio-browser.test.mjs`

Expected: FAIL because `[data-mechanics-mode]`, delivery controls, and persistent flight outputs do not exist.

- [ ] **Step 3: Add the persistent direction contract and semantic shell**

The first child of `<body>` must be:

```html
<!--
THESIS: One causal instrument connects impact inputs and arc inputs; it refuses the category-default dashboard of disconnected metrics.
OWN-WORLD: Ultraviolet-black arena, semantic quantity hues, etched hairlines, mono live truth, one restrained ember focal trace.
STORY: Change one cause, watch delivery/strike/flight update together, then inspect the factual causal sentence.
FIRST VIEWPORT: Compact header and mode switch above a control rail, dominant paired instrument, causal facts, and persistent six-value telemetry.
FORM: Existing Impact Studio extended as an Operate surface; supplied app-mock-3 paired-lens structure is the approved reference.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
-->
```

The live structure must use this semantic skeleton:

```html
<main class="mechanics" data-mechanics-mode="delivery">
  <header class="mechanics__header">…mode buttons and reset…</header>
  <nav class="causal-strip" aria-label="Causal chain">Arc → Delivery → Strike → Flight</nav>
  <section class="mechanics__workspace">
    <aside class="control-bank" aria-label="Live inputs">…four visible controls for the active mode…</aside>
    <section class="instrument" aria-label="Live mechanics instrument">
      <canvas id="direction-canvas" aria-hidden="true"></canvas>
      <canvas id="height-canvas" aria-hidden="true"></canvas>
      <canvas id="flight-canvas" aria-hidden="true"></canvas>
      <p class="sr-only" id="instrument-description" aria-live="polite"></p>
    </section>
    <aside class="facts" aria-label="What changed"><p data-cause></p>…</aside>
  </section>
  <section class="telemetry" aria-label="Live outcomes">…six outcome cells…</section>
</main>
```

- [ ] **Step 4: Implement the design-system layer and live controller**

`impact-studio.css` must consume `sa-p3.css` tokens and define focused aliases:

```css
:root {
  --mechanics-canvas: var(--bg);
  --mechanics-panel: var(--plate-solid);
  --mechanics-lens: color-mix(in srgb, var(--surface) 86%, var(--bg));
  --mechanics-border: var(--line);
  --mechanics-data: var(--font-mono);
  --mechanics-control-radius: var(--radius-control);
  --mechanics-card-radius: var(--radius-card);
  --mechanics-lens-radius: var(--radius-lens);
  --motion-press: 140ms cubic-bezier(.23,1,.32,1);
  --motion-state: 180ms cubic-bezier(.23,1,.32,1);
}

.parameter-control:active,
.mode-switch button:active { transform: scale(.97); }

@media (max-width: 699px) {
  .mechanics__workspace { grid-template-columns: 1fr; }
  .instrument__lens:not([data-active-lens="true"]) { display: none; }
  .telemetry { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; }
  .trace-ghost { display: none; }
}
```

The module controller must call only `solveDelivery()`, `solveArc()`, and `handoffArcToDelivery()`. Every `input` event renders synchronously, updates DOM text before the next animation frame, highlights exactly one causal-chain link, and never runs count-up animation. Copy must use neutral phrases such as `Low point 10.5 cm ahead · ball first` and never “fix”, “better”, “your swing”, percentage grades, or prescriptions.

- [ ] **Step 5: Mirror the locked hierarchy into the normative mock**

`design/mocks/impact-studio.html` must contain the same mode names, four controls per mode, causal strip, persistent flight/geometry instrument, telemetry ordering, neutral copy, and responsive contracts. It may use static synthetic values but must not contain any formula or claim to be the engine.

- [ ] **Step 6: Run browser and model tests**

Run: `node --test scripts/impact-mechanics-model.test.mjs scripts/impact-studio-browser.test.mjs`

Expected: all focused tests pass in normal and reduced-motion states.

- [ ] **Step 7: Commit the surface slice**

```powershell
git add impact-studio.html impact-studio.css design/mocks/impact-studio.html scripts/impact-studio-browser.test.mjs
git commit -m "feat(impact): remake studio as mechanics lab" -m "Co-Authored-By: Codex <noreply@openai.com>"
```

### Task 3: Register, package, and verify the shipping surface

**Files:**
- Modify: `config/flightglass-surfaces.json`

- [ ] **Step 1: Add the shipping surface manifest entry**

```json
{
  "id": "mechanics-mvp",
  "label": "Mechanics Lab",
  "phase": 2,
  "baselineScore": 0,
  "targetScore": 90,
  "route": "impact-studio.html",
  "sourceType": "shipping",
  "viewportIds": ["portrait-wide", "portrait-compact", "landscape-wide", "landscape-compact"],
  "requiredSelectors": ["[data-mechanics-mode]", ".control-bank", ".instrument", ".telemetry", "[data-cause]"],
  "references": ["app-mock-3.html", "design/mocks/impact-studio.html", "PRODUCT.md"],
  "primaryJob": "Change one mechanics input and see the derived strike or flight outcome immediately."
}
```

- [ ] **Step 2: Run the focused UX audit**

Run: `node scripts/flightglass-ux-audit.mjs --mode verify --surface mechanics-mvp --motion both`

Expected: four viewports × two motion states captured; 0 critical runtime, overflow, clipping, target-size, or selector findings.

- [ ] **Step 3: Rebuild the native web package and prove parity**

Run: `npm run copy-web`

Expected: `impact-studio.html`, `impact-studio.css`, and `impact-mechanics-model.js` exist in `www/` and their SHA-256 hashes match root.

- [ ] **Step 4: Run the protected regression gates**

```powershell
node --test scripts/impact-mechanics-model.test.mjs scripts/impact-studio-browser.test.mjs scripts/impact-outcome.test.mjs scripts/geometry-p1.test.mjs scripts/geometry-restpose.test.mjs
npm run test:engine
npm run brand:verify
npm run verify:change
```

Expected: all commands exit 0; protected physics and seven compatibility identifiers remain unchanged.

- [ ] **Step 5: Commit the manifest slice**

```powershell
git add config/flightglass-surfaces.json
git commit -m "test(impact): register mechanics lab evidence" -m "Co-Authored-By: Codex <noreply@openai.com>"
```

### Task 4: Inspect, document, and hand off

**Files:**
- Create: `DESIGN.md`
- Modify: `docs/flightglass-autopilot/COORDINATION.md`

- [ ] **Step 1: Capture one bounded screenshot round**

Capture `932×430` and `430×932`, each in Impact Inputs and Arc Inputs, plus both reduced-motion states. Inspect together for hierarchy, clipping, legibility, truthful color mapping, and cause→effect visibility.

- [ ] **Step 2: Run the Impeccable detector once**

Run:

```powershell
node C:\Users\siver\.agents\skills\impeccable\scripts\detect.mjs --json impact-studio.html impact-studio.css design/mocks/impact-studio.html
```

Expected: no mechanical high-severity findings; fix the reported mechanical issues in one batch and do not run the detector again.

- [ ] **Step 3: Request the fresh finish review**

Pass the original brief, `PRODUCT.md`, the direction contract, desktop/mobile screenshots, detector JSON, and `C:\Users\siver\.agents\skills\impeccable\reference\craft-floor.md` to a fresh no-history reviewer. Apply material fixes in one batch and recapture the same viewports for its verdict.

- [ ] **Step 4: Document the shipped design system**

`DESIGN.md` must record the final token aliases, quantity-color map, typography roles, spacing/radius system, Mechanics Lab components and states, motion rules, responsive behavior, accessibility requirements, banned patterns, and extension guidance. It must reference `docs/DESIGN-SYSTEM.md` as incumbent authority and describe only what the build actually ships.

- [ ] **Step 5: Release the mutex and run final proof**

Move the Codex row in `docs/flightglass-autopilot/COORDINATION.md` from Active to Done/handed off. Run:

```powershell
git diff --check
git status --short
npm run verify:change
git log --oneline --decorate -5
```

- [ ] **Step 6: Commit the final documentation**

```powershell
git add PRODUCT.md DESIGN.md docs/superpowers/plans/2026-08-08-flightglass-mechanics-mvp.md docs/flightglass-autopilot/COORDINATION.md
git commit -m "docs(impact): record mechanics mvp system" -m "Co-Authored-By: Codex <noreply@openai.com>"
```

## Self-review

- Spec coverage: both requested causal chains, live outcome feedback, non-coaching positioning, design system, desktop/mobile behavior, tests, screenshots, and commit proof are assigned.
- Placeholder scan: no TBD/TODO/“similar to” steps remain.
- Type consistency: UI and tests use `face`, `path`, `attack`, `dynLoft`, `speed`, `lowPointCm`, `lowPointHeightMm`, `swingDirection`, and `swingPlane` consistently with the adapter.
- Protected boundary: no task edits the four physics engines, compatibility identifiers, RevenueCat IDs, or Academy storage keys.

Execution mode is already selected by the owner: subagent-driven implementation with review between slices.
