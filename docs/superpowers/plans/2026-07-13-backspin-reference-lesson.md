# Backspin 96-97 Reference Lesson Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the shipping Backspin article with a native, engine-honest, model-based Academy lesson that satisfies the 96-97 design contract and becomes the reusable shell for the other 23 modules.

**Architecture:** Keep `academy.html` as router, curriculum, reward and storage owner. Add one pure Backspin engine adapter, one pure native-journey schema, one native lesson renderer and one scoped stylesheet. The specialized renderer is selected only for `backspin`; all other lessons continue through the current generic renderer until later rollout.

**Tech Stack:** Static HTML/CSS, ES modules, `impact-flight.js`, Canvas 2D, `sa-haptics.js`, Node 24 `node:test`, Playwright Core through `tools/node_modules/playwright-core`, existing Flightglass UX audit.

---

## Execution rules

- Read `docs/superpowers/specs/2026-07-13-backspin-96-97-design.md` before editing.
- Run `npm run claude:ready` before Task 1. Repair control-package failures before feature work.
- Do not modify `impact-flight.js`.
- Do not rename `strikearc.academy.v1` or protected store/revenue identifiers.
- Do not generate imagery.
- Use `.sa-backups/` before every shipping-file task because this workspace snapshot has no `.git` metadata.
- If implementation runs from a real Git clone, use a dedicated worktree and make the commits named below. Do not initialize a new Git repository inside this snapshot.
- Never hand-edit `www/`; regenerate it with `npm run copy-web`.

## File map

### Create

- `academy-backspin-model.js`: pure engine adapter, mission, sensitivity, cause and mastery rules.
- `academy-lesson-journey.js`: pure reusable progress defaults and legacy migration.
- `academy-native-lesson.js`: Backspin six-surface renderer and interaction controller.
- `academy-native-lesson.css`: scoped native lesson layout and visual states.
- `scripts/academy-backspin-model.test.mjs`: pure deterministic model tests.
- `scripts/academy-lesson-journey.test.mjs`: migration and idempotency-record tests.
- `scripts/academy-backspin-browser.test.mjs`: route, interaction, persistence, accessibility and viewport tests.

### Modify

- `academy.html`: stylesheet/module import, specialized route branch, journey persistence and unified attempt commit.
- `package.json`: focused Academy test script and inclusion in the standard UX suite.
- `scripts/copy-web.mjs`: ship `academy.html`; top-level JS/CSS assets are already swept automatically.
- `config/flightglass-surfaces.json`: Academy lesson selectors, 96 target and normative spec reference.
- `scripts/flightglass-ux.test.mjs`: lock the 96 target and shipping references.
- `docs/FLIGHTGLASS-CLAUDE-CODE-MASTER-PLAN.md`: add the v3 spec as Phase 6 normative input and 96-97 exit target.
- `docs/flightglass-autopilot/STATUS.md`: record implementation evidence after all gates pass.

### Reference only

- `academy-lesson-v2-mock.html`: visual and interaction source; do not turn it into shipping code.
- `docs/academy-native-v2-spec.md`: existing laws retained unless the v3 spec explicitly amends them.
- `docs/claude-design-brief/lesson-backspin.json`: content source.

---

### Task 1: Establish a focused baseline and rollback point

**Files:**

- Backup: `.sa-backups/<timestamp>-backspin-96-97/`
- Evidence: `outputs/flightglass-ux/baseline--academy-lesson-report.*`

- [ ] **Step 1: Run the control gate**

Run:

```powershell
npm run claude:ready
```

Expected: brand verification, UX tests and autopilot verifier all exit `0`.

- [ ] **Step 2: Record the focused shipping baseline**

Run:

```powershell
node scripts/flightglass-ux-audit.mjs --mode baseline --surface academy-lesson --motion both
```

Expected: eight Academy lesson snapshots, two portrait viewports times two motion preferences plus report artifacts. Baseline score remains 73 until final verification.

- [ ] **Step 3: Back up every file that later tasks modify**

Run:

```powershell
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$dest = ".sa-backups/$stamp-backspin-96-97"
New-Item -ItemType Directory -Force $dest | Out-Null
Copy-Item academy.html,package.json,package-lock.json -Destination $dest
Copy-Item scripts/copy-web.mjs,scripts/flightglass-ux.test.mjs -Destination $dest
Copy-Item config/flightglass-surfaces.json -Destination $dest
Copy-Item docs/FLIGHTGLASS-CLAUDE-CODE-MASTER-PLAN.md,docs/flightglass-autopilot/STATUS.md -Destination $dest
Write-Output $dest
```

Expected: one timestamped rollback directory with the original files.

- [ ] **Step 4: Inspect the four new baseline screenshots**

Open the normal and reduced-motion Academy lesson screenshots at 430x932 and 375x812. Record the long-scroll article, controls below the visualization and undersized targets as the before evidence.

- [ ] **Step 5: Commit when Git is available**

```bash
git add outputs/flightglass-ux/baseline--academy-lesson-report.*
git commit -m "test(academy): record Backspin lesson baseline"
```

If `.git` is absent, retain the generated evidence and continue without creating a repository.

---

### Task 2: Build the pure Backspin model contract with tests

**Files:**

- Create: `academy-backspin-model.js`
- Create: `scripts/academy-backspin-model.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: Add the focused test commands**

Modify `package.json` scripts to contain:

```json
{
  "test": "npm run test:ux",
  "test:academy": "node --test --test-concurrency=1 scripts/academy-backspin-model.test.mjs scripts/academy-backspin-browser.test.mjs",
  "test:ux": "node --test --test-concurrency=1 scripts/flightglass-ux.test.mjs scripts/academy-backspin-model.test.mjs scripts/academy-backspin-browser.test.mjs"
}
```

Create `scripts/academy-backspin-browser.test.mjs` temporarily with one valid skipped test so `test:ux` can run before the browser task:

```js
import test from 'node:test';

test.skip('Backspin browser contract is implemented in Task 4', () => {});
```

- [ ] **Step 2: Write failing pure-model tests**

Create `scripts/academy-backspin-model.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_BACKSPIN_STATE,
  BACKSPIN_PARAMS,
  solveBackspinState,
  advanceMission,
  backspinSensitivity,
  buildCauseChain,
  realWorldRange,
  passesStoppingFlightTarget
} from '../academy-backspin-model.js';

test('initial state requires the learner to perform both mission stages', () => {
  const solved = solveBackspinState(INITIAL_BACKSPIN_STATE);
  assert.equal(solved.rpm, 6048);
  assert.equal(solved.spinLoft, 28);
  assert.deepEqual(advanceMission({ built:false, cut:false }, solved.rpm), {
    built:false, cut:false, complete:false, event:null
  });
});

test('cut is credited only after build', () => {
  const lowFirst = advanceMission({ built:false, cut:false }, 2808);
  assert.equal(lowFirst.cut, false);
  const built = advanceMission(lowFirst, 7128);
  assert.equal(built.built, true);
  assert.equal(built.event, 'built');
  const cut = advanceMission(built, 2808);
  assert.deepEqual(cut, { built:true, cut:true, complete:true, event:'cut' });
});

test('display clamp never erases underlying sensitivity', () => {
  const state = { dynamicLoft:48, attackAngle:-8, ballSpeed:160 };
  const solved = solveBackspinState(state);
  const sensitivity = backspinSensitivity(state);
  assert.equal(solved.rpm, 9000);
  assert.equal(solved.displayCapped, true);
  assert.equal(solved.displayLimit, 'ceiling');
  assert.ok(solved.rawRpm > 9000);
  assert.ok(sensitivity.dynamicLoft.rawDelta > 0);
  assert.ok(sensitivity.attackAngle.rawDelta < 0);
  assert.ok(sensitivity.ballSpeed.rawDelta > 0);
});

test('the lower model floor is distinct from the upper display cap', () => {
  const state = { dynamicLoft:10, attackAngle:6, ballSpeed:90 };
  const solved = solveBackspinState(state);
  const sensitivity = backspinSensitivity(state);
  assert.equal(solved.rpm, 1500);
  assert.equal(solved.rawRpm, 648);
  assert.equal(solved.displayCapped, false);
  assert.equal(solved.displayFloored, true);
  assert.equal(solved.displayLimit, 'floor');
  assert.notEqual(sensitivity.dynamicLoft.rawDelta, 0);
});

test('cause chain reports actual engine deltas', () => {
  const before = { dynamicLoft:30, attackAngle:-3, ballSpeed:120 };
  const after = { ...before, dynamicLoft:31 };
  const chain = buildCauseChain(before, after, 'dynamicLoft');
  assert.equal(chain.inputDelta, 1);
  assert.equal(chain.spinLoftDelta, 1);
  assert.equal(chain.rpmDelta, 216);
  assert.match(chain.speech, /backspin plus 216 rpm/i);
});

test('the current engine holds carry steady at fixed ball speed', () => {
  const low = solveBackspinState({ dynamicLoft:10, attackAngle:-3, ballSpeed:120 });
  const high = solveBackspinState({ dynamicLoft:48, attackAngle:-3, ballSpeed:120 });
  assert.equal(low.carryM, high.carryM);
});

test('real-world range remains separate from simulator truth', () => {
  assert.deepEqual(realWorldRange(7128, [0.80, 0.85]), { low:5702, high:6059 });
});

test('mastery target is evaluated from the live engine state', () => {
  assert.equal(passesStoppingFlightTarget({ dynamicLoft:30, attackAngle:-3, ballSpeed:120 }), true);
  assert.equal(passesStoppingFlightTarget({ dynamicLoft:10, attackAngle:-3, ballSpeed:120 }), false);
  assert.equal(passesStoppingFlightTarget({ dynamicLoft:NaN, attackAngle:-3, ballSpeed:120 }), false);
});
```

- [ ] **Step 3: Run the tests and confirm the missing-module failure**

Run:

```powershell
node --test scripts/academy-backspin-model.test.mjs
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `academy-backspin-model.js`.

- [ ] **Step 4: Implement the pure model**

Create `academy-backspin-model.js` with this public contract:

```js
import { solveFlight } from './impact-flight.js';

const YD_TO_M = 0.9144;

export const INITIAL_BACKSPIN_STATE = Object.freeze({
  dynamicLoft: 25,
  attackAngle: -3,
  ballSpeed: 120
});

export const BACKSPIN_LIMITS = Object.freeze({ min:1500, max:9000 });
export const BACKSPIN_PARAMS = Object.freeze({
  dynamicLoft: Object.freeze({ label:'Dynamic loft', min:10, max:48, step:1, unit:'°' }),
  attackAngle: Object.freeze({ label:'Attack angle', min:-8, max:6, step:1, unit:'°' }),
  ballSpeed: Object.freeze({ label:'Ball speed', min:90, max:175, step:1, unit:' mph' })
});

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeBackspinState(state) {
  const normalized = {};
  for (const [key, contract] of Object.entries(BACKSPIN_PARAMS)) {
    const value = Number(state?.[key]);
    if (!Number.isFinite(value)) throw new RangeError(`${key} must be finite`);
    normalized[key] = clamp(value, contract.min, contract.max);
  }
  return normalized;
}

export function backspinEngineInput(state) {
  const { dynamicLoft, attackAngle, ballSpeed } = normalizeBackspinState(state);
  const spinLoft = dynamicLoft - attackAngle;
  const smashEff = clamp(1.46 - 0.004 * spinLoft, 1.15, 1.42);
  return {
    club: '7iron',
    clubPath: 0,
    faceAngle: 0,
    dynamicLoft,
    attackAngle,
    clubSpeed: ballSpeed / smashEff
  };
}

export function solveBackspinState(state) {
  const flight = solveFlight(backspinEngineInput(state));
  const rpm = Math.round(flight.backspin);
  const rawRpm = Math.round(flight.spinRpmRaw);
  const required = [rpm, rawRpm, flight.spinLoft, flight.ballSpeed, flight.carry, flight.apex, flight.landingAngle];
  if (!required.every(Number.isFinite)) throw new RangeError('Backspin model returned a non-finite value');
  const displayLimit = rawRpm > BACKSPIN_LIMITS.max
    ? 'ceiling'
    : rawRpm < BACKSPIN_LIMITS.min ? 'floor' : null;
  return {
    flight,
    rpm,
    rawRpm,
    displayLimit,
    displayCapped: displayLimit === 'ceiling',
    displayFloored: displayLimit === 'floor',
    spinLoft: Math.round(flight.spinLoft),
    ballSpeed: Math.round(flight.ballSpeed),
    carryM: Math.round(flight.carry * YD_TO_M),
    apexM: Math.round(flight.apex * YD_TO_M),
    landingAngle: Number(flight.landingAngle.toFixed(1))
  };
}

export function advanceMission(current, rpm) {
  const next = { built:!!current.built, cut:!!current.cut };
  let event = null;
  if (!Number.isFinite(rpm)) return { ...next, complete:next.built && next.cut, event };
  if (!next.built && rpm >= 7000) {
    next.built = true;
    event = 'built';
  } else if (next.built && !next.cut && rpm <= 3500) {
    next.cut = true;
    event = 'cut';
  }
  return { ...next, complete:next.built && next.cut, event };
}

function finiteDifference(state, key) {
  const normalized = normalizeBackspinState(state);
  const contract = BACKSPIN_PARAMS[key];
  const direction = normalized[key] >= contract.max ? -1 : 1;
  const base = solveBackspinState(normalized);
  const changed = solveBackspinState({
    ...normalized,
    [key]: normalized[key] + direction * contract.step
  });
  return {
    displayDelta: (changed.rpm - base.rpm) / direction,
    rawDelta: (changed.rawRpm - base.rawRpm) / direction
  };
}

export function backspinSensitivity(state) {
  return {
    dynamicLoft: finiteDifference(state, 'dynamicLoft'),
    attackAngle: finiteDifference(state, 'attackAngle'),
    ballSpeed: finiteDifference(state, 'ballSpeed')
  };
}

const INPUT_LABELS = {
  dynamicLoft: 'Dynamic loft',
  attackAngle: 'Attack angle',
  ballSpeed: 'Ball speed'
};

function signedSpeech(value, unit) {
  const direction = value >= 0 ? 'plus' : 'minus';
  return `${direction} ${Math.abs(value)} ${unit}`;
}

export function buildCauseChain(beforeState, afterState, activeKey) {
  const before = solveBackspinState(beforeState);
  const after = solveBackspinState(afterState);
  const inputDelta = Number(afterState[activeKey]) - Number(beforeState[activeKey]);
  const spinLoftDelta = after.spinLoft - before.spinLoft;
  const rpmDelta = after.rawRpm - before.rawRpm;
  const apexDelta = after.apexM - before.apexM;
  const inputUnit = activeKey === 'ballSpeed' ? 'mph' : 'degrees';
  return {
    activeKey,
    inputDelta,
    spinLoftDelta,
    rpmDelta,
    apexDelta,
    visual: [
      `${INPUT_LABELS[activeKey]} ${inputDelta >= 0 ? '+' : '−'}${Math.abs(inputDelta)}${activeKey === 'ballSpeed' ? ' mph' : '°'}`,
      `Spin loft ${spinLoftDelta >= 0 ? '+' : '−'}${Math.abs(spinLoftDelta)}°`,
      `Backspin ${rpmDelta >= 0 ? '+' : '−'}${Math.abs(rpmDelta)} rpm`,
      `Apex ${apexDelta >= 0 ? '+' : '−'}${Math.abs(apexDelta)} m`
    ],
    speech: `${INPUT_LABELS[activeKey]} ${signedSpeech(inputDelta, inputUnit)}, ` +
      `spin loft ${signedSpeech(spinLoftDelta, 'degrees')}, ` +
      `backspin ${signedSpeech(rpmDelta, 'rpm')}, ` +
      `apex ${signedSpeech(apexDelta, 'metres')}.`
  };
}

export function realWorldRange(rpm, keepRange) {
  return {
    low: Math.round(rpm * keepRange[0]),
    high: Math.round(rpm * keepRange[1])
  };
}

export function passesStoppingFlightTarget(state) {
  try {
    const solved = solveBackspinState(state);
    return solved.rpm >= 6800 && solved.rpm <= 7400 && solved.landingAngle >= 50;
  } catch {
    return false;
  }
}
```

- [ ] **Step 5: Run model and standard tests**

Run:

```powershell
node --test scripts/academy-backspin-model.test.mjs
npm run test:ux
```

Expected: all pure tests PASS; the browser placeholder is SKIP; existing UX tests remain PASS.

- [ ] **Step 6: Commit when Git is available**

```bash
git add academy-backspin-model.js scripts/academy-backspin-model.test.mjs scripts/academy-backspin-browser.test.mjs package.json package-lock.json
git commit -m "feat(academy): add Backspin lesson model contract"
```

---

### Task 3: Add journey migration and an idempotent attempt commit

**Files:**

- Create: `academy-lesson-journey.js`
- Create: `scripts/academy-lesson-journey.test.mjs`
- Modify: `academy.html:1294-1325`
- Modify: `academy.html:3169-3238`
- Modify: `package.json`

- [ ] **Step 1: Add the journey test to the focused commands**

Update the two commands introduced in Task 2:

```json
{
  "test:academy": "node --test --test-concurrency=1 scripts/academy-backspin-model.test.mjs scripts/academy-lesson-journey.test.mjs scripts/academy-backspin-browser.test.mjs",
  "test:ux": "node --test --test-concurrency=1 scripts/flightglass-ux.test.mjs scripts/academy-backspin-model.test.mjs scripts/academy-lesson-journey.test.mjs scripts/academy-backspin-browser.test.mjs"
}
```

- [ ] **Step 2: Write failing journey migration tests**

Create `scripts/academy-lesson-journey.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { freshLessonJourney, mergeLessonJourney } from '../academy-lesson-journey.js';

test('a legacy lesson receives the complete native journey shape', () => {
  assert.deepEqual(mergeLessonJourney(undefined), {
    surface:0,
    mission:{ built:false, cut:false },
    myths:[false, false, false],
    masteryBest:0,
    masteryAttempts:0,
    masteryAttemptId:null,
    lastSubmission:null
  });
});

test('partial progress deep-merges without shared nested state', () => {
  const first = mergeLessonJourney({ surface:2, mission:{ built:true }, myths:[true] });
  const second = freshLessonJourney();
  assert.deepEqual(first.mission, { built:true, cut:false });
  assert.deepEqual(first.myths, [true, false, false]);
  first.mission.cut = true;
  assert.equal(second.mission.cut, false);
});

test('a committed submission survives migration as an idempotency record', () => {
  const summary = { correct:4, total:5, mastered:true, delta:80, storeXp:480 };
  const merged = mergeLessonJourney({
    masteryAttemptId:'attempt-7',
    lastSubmission:{ attemptId:'attempt-7', summary }
  });
  assert.deepEqual(merged.lastSubmission, { attemptId:'attempt-7', summary });
});
```

Run `node --test scripts/academy-lesson-journey.test.mjs` and confirm `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implement the pure journey schema**

Create `academy-lesson-journey.js`:

```js
const DEFAULT = Object.freeze({
  surface:0,
  mission:Object.freeze({ built:false, cut:false }),
  myths:Object.freeze([false, false, false]),
  masteryBest:0,
  masteryAttempts:0,
  masteryAttemptId:null,
  lastSubmission:null
});

const count = value => Number.isFinite(Number(value)) ? Math.max(0, Math.floor(Number(value))) : 0;

export function freshLessonJourney() {
  return {
    surface:0,
    mission:{ ...DEFAULT.mission },
    myths:[...DEFAULT.myths],
    masteryBest:0,
    masteryAttempts:0,
    masteryAttemptId:null,
    lastSubmission:null
  };
}

export function mergeLessonJourney(saved) {
  const base = freshLessonJourney();
  if (!saved || typeof saved !== 'object') return base;
  const attemptId = typeof saved.masteryAttemptId === 'string' ? saved.masteryAttemptId : null;
  const submission = saved.lastSubmission;
  const lastSubmission = submission && typeof submission === 'object' &&
    typeof submission.attemptId === 'string' && submission.summary &&
    typeof submission.summary === 'object'
      ? { attemptId:submission.attemptId, summary:{ ...submission.summary } }
      : null;
  return {
    surface:Math.max(0, Math.min(5, count(saved.surface))),
    mission:{
      built:Boolean(saved.mission?.built),
      cut:Boolean(saved.mission?.cut)
    },
    myths:base.myths.map((value, index) => Boolean(saved.myths?.[index] ?? value)),
    masteryBest:Math.min(5, count(saved.masteryBest)),
    masteryAttempts:count(saved.masteryAttempts),
    masteryAttemptId:attemptId,
    lastSubmission
  };
}
```

Run the focused journey test and require PASS.

- [ ] **Step 4: Deep-merge the schema into Academy storage**

Import `freshLessonJourney` and `mergeLessonJourney` into the existing module script. Change the lesson factory to include `journey:freshLessonJourney()`. In `load()`, merge each lesson as:

```js
const savedLesson = p.lessons[id] || {};
lessons[id] = {
  ...base.lessons[id],
  ...savedLesson,
  journey:mergeLessonJourney(savedLesson.journey)
};
```

Existing users keep XP, completion, quiz history, badges and unlocks. Do not rename the v1 storage key.

- [ ] **Step 5: Add debounced and immediate persistence paths**

Keep the current debounced `save()` for low-risk progress. Ensure its timer sets `saveTimer = null` after writing. Add:

```js
function saveNow() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = null;
  try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch {}
}

function getJourney(id) {
  return mergeLessonJourney(store.lessons[id]?.journey);
}

function updateJourney(id, patch, { immediate=false } = {}) {
  const lesson = store.lessons[id];
  if (!lesson) return freshLessonJourney();
  const current = getJourney(id);
  lesson.journey = mergeLessonJourney({
    ...current,
    ...patch,
    mission:patch.mission ? { ...current.mission, ...patch.mission } : current.mission
  });
  if (immediate) saveNow(); else save();
  return lesson.journey;
}
```

- [ ] **Step 6: Extract the existing reward mutation without changing it**

Create `commitLessonAttempt(lessonId, results)` immediately before `finishLesson()`. Move only the store, XP, badge, unlock and haptic mutation from `finishLesson()` into it. Preserve the current XP formula, 80% threshold, one-time best-score delta, badge predicates and unlock recomputation byte-for-byte where possible.

Its result is a serializable object:

```js
{
  correct, total, perfect, threshold, mastered, delta, storeXp,
  leveledUp, levelInfo, earnedBadges, didUnlock
}
```

`finishLesson()` calls this helper and retains its existing long-lesson completion markup and navigation.

- [ ] **Step 7: Add an exactly-once native commit wrapper**

```js
function commitNativeLessonAttempt(lessonId, { attemptId, results }) {
  if (typeof attemptId !== 'string' || !attemptId) throw new TypeError('attemptId is required');
  const journey = getJourney(lessonId);
  if (journey.lastSubmission?.attemptId === attemptId) {
    return journey.lastSubmission.summary;
  }
  const summary = commitLessonAttempt(lessonId, results);
  updateJourney(lessonId, {
    surface:5,
    masteryBest:Math.max(journey.masteryBest, summary.correct),
    masteryAttempts:journey.masteryAttempts + 1,
    masteryAttemptId:attemptId,
    lastSubmission:{ attemptId, summary }
  }, { immediate:true });
  return summary;
}
```

Calling this wrapper twice with the same attempt ID must not change XP, `quizAttempts`, badge state or unlock state on the second call. Task 8 proves this through the production UI.

- [ ] **Step 8: Run migration and legacy behavior tests**

```powershell
node --test scripts/academy-lesson-journey.test.mjs
npm run test:ux
```

Expected: journey tests PASS; existing Academy storage, 4/5 mastery, badge and XP tests remain PASS; browser placeholder remains the only skipped test.

- [ ] **Step 9: Commit when Git is available**

```bash
git add academy-lesson-journey.js scripts/academy-lesson-journey.test.mjs academy.html package.json package-lock.json
git commit -m "refactor(academy): support idempotent native lesson progress"
```

---

### Task 4: Add the native lesson shell and production route

**Files:**

- Create: `academy-native-lesson.js`
- Create: `academy-native-lesson.css`
- Modify: `academy.html:1-15`
- Modify: `academy.html:725-730`
- Modify: `academy.html:1550-1575`
- Modify: `academy.html:2030`

- [ ] **Step 1: Replace the placeholder with a route-level browser harness and smoke test**

Use the static-server and browser-launch pattern from `scripts/flightglass-ux-audit.mjs:70-98`: start an ephemeral `node:http` server rooted at the repository, import Playwright Core from `tools/node_modules/playwright-core`, launch Edge with Chrome fallback, and close browser/server in `test.after()`. Serve HTML, JS and CSS with correct MIME types. Remove the skipped placeholder; no skipped test remains after this step.

Add assertions that `academy.html#/lesson/backspin` renders:

```js
await page.goto(`${baseUrl}/academy.html#/lesson/backspin`, { waitUntil:'networkidle' });
await page.locator('#nativeLesson').waitFor();
assert.equal(await page.locator('#nativeLesson').getAttribute('data-lesson'), 'backspin');
assert.equal(await page.locator('#nativeLesson').getAttribute('data-surface'), '0');
assert.equal(await page.locator('#nativeLesson [data-step="mission"]').getAttribute('aria-current'), 'step');
```

Expected before implementation: FAIL because `#nativeLesson` does not exist.

- [ ] **Step 2: Add the stylesheet and module imports**

In `academy.html` head:

```html
<link rel="stylesheet" href="./academy-native-lesson.css">
```

In the existing module script:

```js
import { mountNativeBackspinLesson } from './academy-native-lesson.js';
```

- [ ] **Step 3: Create the renderer interface**

Create `academy-native-lesson.js` with this public shape:

```js
import sa from './sa-haptics.js';
import {
  INITIAL_BACKSPIN_STATE,
  solveBackspinState,
  advanceMission,
  backspinSensitivity,
  buildCauseChain,
  realWorldRange,
  passesStoppingFlightTarget
} from './academy-backspin-model.js';

export function mountNativeBackspinLesson(options) {
  const {
    root,
    xp,
    level,
    journey,
    onJourney,
    onSubmit,
    onBack,
    onNextLesson,
    onAnnounce
  } = options;

  if (!(root instanceof HTMLElement)) throw new TypeError('root must be an HTMLElement');

  const cleanups = [];
  const timers = new Set();
  const state = {
    surface: Math.max(0, Math.min(5, Number(journey?.surface) || 0)),
    input: { ...INITIAL_BACKSPIN_STATE },
    previousSettled: null,
    mission: { built:!!journey?.mission?.built, cut:!!journey?.mission?.cut },
    myths: [false, false, false].map((v, i) => Boolean(journey?.myths?.[i] ?? v)),
    mastery: [],
    masteryAttemptId: journey?.masteryAttemptId || null,
    lastSubmission: journey?.lastSubmission || null,
    activeParam: 'dynamicLoft',
    lie: 'clean'
  };

  root.innerHTML = lessonTemplate({ xp, level, state });
  root.dataset.surface = String(state.surface);

  function listen(target, event, handler, options) {
    target.addEventListener(event, handler, options);
    cleanups.push(() => target.removeEventListener(event, handler, options));
  }

  function later(handler, delay) {
    const id = setTimeout(() => { timers.delete(id); handler(); }, delay);
    timers.add(id);
    return id;
  }

  wireLesson();
  renderAll();

  return () => {
    cleanups.splice(0).forEach(fn => fn());
    timers.forEach(clearTimeout);
    timers.clear();
    root.replaceChildren();
  };
}
```

The module must define these internal units, each with one purpose:

- `lessonTemplate`: static six-surface DOM with the stable selectors in this plan.
- `setSurface`: inert, focus, gate and stepper state.
- `renderLab`: truth, trajectory, consequences, selected input and mission.
- `renderInfluence`: ranking and real-world register.
- `renderMyth`: current prediction and evidence.
- `renderMastery`: current task and score.
- `openSheet` / `closeSheet`: one focus-trapped sheet.
- `wireLesson`: all event bindings through the cleanup helper.

- [ ] **Step 4: Use stable production selectors**

The generated root must be:

```html
<main id="nativeLesson" class="native-lesson" data-lesson="backspin" data-surface="0">
```

Required selectors:

```text
#nativeLesson
#backspinTruth
#flightCanvas
#labRange
#missionStageBuild
#missionStageCut
#causeChain
#influenceBars
#realWorldRegister
#mythExperiment
#masteryTask
#nativeLessonResult
#lessonSheet
[data-step="mission|lab|influence|myths|mastery|result"]
```

- [ ] **Step 5: Add a specialized route branch and cleanup**

In `academy.html`, add module-scope cleanup state:

```js
let activeLessonCleanup = null;

function destroyActiveLesson() {
  if (activeLessonCleanup) activeLessonCleanup();
  activeLessonCleanup = null;
}
```

Call `destroyActiveLesson()` as the first line of `route()`.

At the top of `renderLesson(id)` add:

```js
if (id === 'backspin') {
  const li = levelInfo(store.xp);
  document.title = 'Backspin — Flightglass Academy';
  app.innerHTML = '';
  activeLessonCleanup = mountNativeBackspinLesson({
    root: app,
    xp: store.xp,
    level: { number:li.lvl, title:li.title },
    journey: getJourney(id),
    onJourney: patch => updateJourney(id, patch),
    onSubmit: submission => commitNativeLessonAttempt(id, submission),
    onBack: () => go('#/path'),
    onNextLesson: () => go('#/lesson/launch-angle'),
    onAnnounce: announce
  });
  return;
}
```

- [ ] **Step 6: Create the scoped CSS foundation**

Create `academy-native-lesson.css`. Every selector starts with `.native-lesson` or `.native-sheet`. Use existing variables from `sa-p3.css` or `academy.html`; do not define a second color system.

Required layout contract:

```css
.native-lesson {
  position: fixed;
  inset: 0;
  min-height: 100svh;
  overflow: hidden;
  color: var(--ink);
  background: var(--bg);
}

.native-lesson__pager {
  display: flex;
  width: 600%;
  height: 100%;
  transform: translate3d(var(--surface-x, 0%), 0, 0);
  transition: transform 360ms cubic-bezier(.22,.72,.2,1);
}

.native-lesson__surface {
  width: 16.6666667%;
  min-width: 16.6666667%;
  height: 100%;
  padding: calc(52px + env(safe-area-inset-top)) 16px calc(116px + env(safe-area-inset-bottom));
  overflow: hidden;
}

@media (prefers-reduced-motion: reduce) {
  .native-lesson__pager { transition: none; }
  .native-lesson *, .native-sheet * { animation: none !important; scroll-behavior: auto !important; }
}
```

`setSurface(index)` sets `--surface-x` on the pager to `${index * -16.6666667}%`; do not rely on unsupported CSS multiplication inside `calc()`.

Use a 44px minimum for buttons, chips, dots and range thumbs.

- [ ] **Step 7: Run the smoke test**

Run:

```powershell
npm run test:academy
```

Expected at this checkpoint: model tests PASS; route smoke PASS; later behavior tests may still be absent, not skipped.

- [ ] **Step 8: Commit when Git is available**

```bash
git add academy.html academy-native-lesson.js academy-native-lesson.css scripts/academy-backspin-browser.test.mjs
git commit -m "feat(academy): add native Backspin lesson shell"
```

---

### Task 5: Implement Mission and the live Spin Lab

**Files:**

- Modify: `academy-native-lesson.js`
- Modify: `academy-native-lesson.css`
- Test: `scripts/academy-backspin-browser.test.mjs`

- [ ] **Step 1: Write Mission and Lab browser tests**

Add tests for both target viewports:

```js
for (const viewport of [{width:430,height:932}, {width:375,height:812}]) {
  await page.setViewportSize(viewport);
  await openBackspin(page);
  assert.equal(await page.locator('#missionStageBuild').getAttribute('data-complete'), 'false');
  assert.equal(await page.locator('#missionStageCut').getAttribute('data-complete'), 'false');
  await page.getByRole('button', { name:'Enter the Spin Lab' }).click();
  await expectSurface(page, 1);
  await assertBoxInsideViewport(page, '#backspinTruth');
  await assertBoxInsideViewport(page, '#flightCanvas');
  await assertBoxInsideViewport(page, '#labRange');
}
```

Add an ordered mission test:

```js
await setRange(page, '#labRange', 10);
assert.equal(await page.locator('#missionStageCut').getAttribute('data-complete'), 'false');
await setRange(page, '#labRange', 30);
assert.equal(await page.locator('#missionStageBuild').getAttribute('data-complete'), 'true');
await setRange(page, '#labRange', 10);
assert.equal(await page.locator('#missionStageCut').getAttribute('data-complete'), 'true');
```

- [ ] **Step 2: Port the Mission composition, not the old article hero**

Use the S0 composition from `academy-lesson-v2-mock.html` as the reference. Exact production copy:

```text
ACADEMY · FLIGHT
Backspin
Backspin is the ball's backward rotation that creates lift and helps a shot hold its flight.
YOUR MISSION
Build 7,000+ rpm, then cut it below 3,500.
Build the spin
Cut it in half
Enter the Spin Lab
```

Both mission indicators begin incomplete unless restored from persisted progress.

- [ ] **Step 3: Implement the Canvas render with one ghost**

Reuse the projection, trace, apex and landing code from `academy-lesson-v2-mock.html:864-972`, but consume the `solveBackspinState()` result. Store one `previousSettled` result. During input, draw the live result against that ghost. After settle, set the just-finished result as the next ghost.

Canvas fallback:

```js
const ctx = canvas.getContext('2d');
if (!ctx) {
  canvas.hidden = true;
  root.querySelector('#flightFallback').hidden = false;
}
```

The fallback contains a simple SVG parabola plus the same DOM values. It does not block the lesson.

- [ ] **Step 4: Implement parameter selection and range semantics**

Use the imported `BACKSPIN_PARAMS` as the single source of truth; do not redeclare its ranges in the renderer:

```js
const parameter = BACKSPIN_PARAMS[state.activeParam];
range.min = String(parameter.min);
range.max = String(parameter.max);
range.step = String(parameter.step);
range.value = String(state.input[state.activeParam]);
```

One active range is rendered at a time. Tapping an inactive chip selects it. Tapping the active chip opens its definition sheet. Range events call `sa.selectionStart()`, `sa.tick(key)` and `sa.selectionEnd()` through the existing module.

Wrap every `solveBackspinState()` call at the renderer boundary. If it throws for a non-finite input or output, retain the last valid state, announce `Model could not update`, and skip mission, ghost and mastery mutation.

- [ ] **Step 5: Implement numeric causal feedback**

On input:

1. Keep `beforeSettled` unchanged.
2. Update the live state and render immediately.
3. Restart a 300ms settle timer.

On settle:

```js
const chain = buildCauseChain(beforeSettled, state.input, state.activeParam);
renderCauseChain(chain.visual);
onAnnounce(chain.speech);
state.previousSettled = solveBackspinState(state.input);
beforeSettled = { ...state.input };
```

The visible chain may wrap to two lines but must fit the Lab surface.

- [ ] **Step 6: Implement honest bands and limits**

Use these labels:

```js
function spinBand(rpm) {
  if (rpm >= 8000) return { key:'high', label:'High-spin delivery' };
  if (rpm >= 5500) return { key:'iron', label:'Iron spin window' };
  return { key:'low', label:'Low-spin delivery' };
}
```

When `displayLimit === 'ceiling'`, show a tappable `Display limit` chip. Its sheet states that 9,000 rpm is the interface ceiling and the Influence page uses the engine's raw intermediate beyond the cap. When `displayLimit === 'floor'`, show `Model floor`; its sheet identifies the 1,500-rpm floor and never mentions the upper cap. Both states keep the displayed engine value while explaining why raw sensitivity can continue.

- [ ] **Step 7: Implement ordered mission persistence and one-time reward**

After every solve:

```js
const nextMission = advanceMission(state.mission, solved.rpm);
if (nextMission.event) {
  state.mission = nextMission;
  onJourney({ mission:{ built:nextMission.built, cut:nextMission.cut } });
  sa.notify('success');
}
```

Do not add XP in the renderer. XP is committed from Academy persistence only when the existing completion contract says so. Do not hard-code a rank promotion.

- [ ] **Step 8: Run tests and inspect two Lab screenshots**

Run:

```powershell
npm run test:academy
```

Capture Lab at 430x932 and 375x812 after Stage 1. Confirm truth, trace, readouts, chips, slider, cause chain and sticky controls are all visible.

- [ ] **Step 9: Commit when Git is available**

```bash
git add academy-native-lesson.js academy-native-lesson.css scripts/academy-backspin-browser.test.mjs
git commit -m "feat(academy): make Backspin mission engine-driven"
```

---

### Task 6: Implement Influence and the Real-world layer

**Files:**

- Modify: `academy-native-lesson.js`
- Modify: `academy-native-lesson.css`
- Test: `scripts/academy-backspin-browser.test.mjs`

- [ ] **Step 1: Write clamp and estimate separation tests**

Test that `{ dynamicLoft:48, attackAngle:-8, ballSpeed:160 }` renders `9,000`, `Display limit` and non-zero influence values. Also test that `{ dynamicLoft:10, attackAngle:6, ballSpeed:90 }` renders `1,500`, `Model floor`, never the 9,000-rpm copy, and still has non-zero raw sensitivity. Test that Wet/Flyer never changes `#backspinTruth`:

```js
const before = await page.locator('#backspinTruth').textContent();
await page.getByRole('button', { name:'Wet' }).click();
assert.equal(await page.locator('#backspinTruth').textContent(), before);
assert.match(await page.locator('#realWorldRegister').textContent(), /≈/);
assert.match(await page.locator('#realWorldRegister').textContent(), /not the simulator/i);
assert.match(await page.locator('#realWorldRegister').textContent(), /Andrew Rice, 2013/);
```

- [ ] **Step 2: Render live sensitivity bars**

Call `backspinSensitivity(state.input)`. Rank by `Math.abs(solved.displayLimit ? rawDelta : displayDelta)`. Each row shows direction, magnitude and unit. At the upper display cap, render:

```text
Underlying model sensitivity · display capped at 9,000 rpm
```

Tapping a row shows a two-state A/B readout using the base and +1-unit solved states. Do not add a second free slider on this surface.

At a slider maximum, the second A/B state is the in-range `-1` sample and the displayed delta is normalized to the equivalent `+1` direction. At the lower floor, use the same raw-delta rule with the copy `Underlying model sensitivity · display floored at 1,500 rpm`.

- [ ] **Step 3: Preserve sourced estimate data**

Move the current `LIE.wet` and `LIE.flyer` objects from `academy-lesson-v2-mock.html:1247-1263` into `academy-native-lesson.js` unchanged except for normalized UTF-8 punctuation. Compute only the range with `realWorldRange()`.

The visible register must always include:

```text
≈ [low]-[high] rpm
[Wet face / ball | Flyer lie]
Real-world estimate · [source] · not the simulator
```

- [ ] **Step 4: Add the visual estimate overlay**

When Wet or Flyer is selected:

- Keep the solid orange trace and truth value unchanged.
- Add a violet dashed RPM range band, not a second orange truth.
- Use the existing local `assets/rw-backspin-green-bite.jpg` only inside the expanded Real-world sheet.
- Hide image and caption together on load failure.

- [ ] **Step 5: Verify keyboard and source sheet behavior**

Use arrow-key roving focus for Clean/Wet/Flyer. Enter or Space selects. Opening the source sheet traps focus; Escape returns focus to the segment that opened it.

- [ ] **Step 6: Run focused tests**

```powershell
npm run test:academy
```

Expected: cap, ranking, source, approximation, non-mutation and focus tests PASS.

- [ ] **Step 7: Commit when Git is available**

```bash
git add academy-native-lesson.js academy-native-lesson.css scripts/academy-backspin-browser.test.mjs
git commit -m "feat(academy): separate Backspin model and real-world layers"
```

---

### Task 7: Replace True/False myths with prediction experiments

**Files:**

- Modify: `academy-native-lesson.js`
- Modify: `academy-native-lesson.css`
- Test: `scripts/academy-backspin-browser.test.mjs`

- [ ] **Step 1: Write three prediction tests**

The tests must assert:

- First experiment's correct response is `Face friction and spin loft`.
- Second experiment reveals identical spin loft and backspin for 30/-3 and 34/+1.
- Third experiment reveals increased apex and unchanged carry at fixed ball speed.
- The correct response position is not identical across all experiments.
- Forward navigation remains locked until the current experiment is answered.

- [ ] **Step 2: Define the prediction data**

Add three objects with explicit engines and responses:

```js
const MYTH_EXPERIMENTS = [
  {
    id:'ground',
    prompt:'Where is backspin actually created?',
    choices:['Ground interaction', 'Face friction and spin loft'],
    answerIndex:1,
    before:{ dynamicLoft:30, attackAngle:-3, ballSpeed:120 },
    after:{ dynamicLoft:30, attackAngle:-6, ballSpeed:120 },
    explanation:'The ground adds no spin. A downward strike can widen spin loft and improve ball-first contact, but spin is created while the ball is on the face.'
  },
  {
    id:'loft-alone',
    prompt:'Dynamic loft rises 4°, but attack angle also rises 4°. What happens to backspin?',
    choices:['More', 'Same', 'Less'],
    answerIndex:1,
    before:{ dynamicLoft:30, attackAngle:-3, ballSpeed:120 },
    after:{ dynamicLoft:34, attackAngle:1, ballSpeed:120 },
    explanation:'Spin loft remains 33°, so this engine returns the same backspin.'
  },
  {
    id:'more-is-better',
    prompt:'At fixed ball speed, what does this model show when spin rises past the iron window?',
    choices:['Carry grows', 'Carry falls', 'Carry stays while apex and landing change'],
    answerIndex:2,
    before:{ dynamicLoft:30, attackAngle:-3, ballSpeed:120 },
    after:{ dynamicLoft:44, attackAngle:-4, ballSpeed:120 },
    explanation:'This Flightglass model holds carry steady at fixed ball speed while height and landing change. Real excess-spin shots can balloon; that effect is not modeled here.'
  }
];
```

- [ ] **Step 3: Render two real engine runs after prediction**

Each result shows three numbered rows from the before and after solved states. Use the existing chain-beat motion only when reduced motion is off. The final explanation is plain text and never claims an engine result that is absent.

- [ ] **Step 4: Persist completed experiments**

After answering, update the corresponding `journey.myths[index]` and save. On reload, completed experiments remain inspectable; forward navigation opens to the first unfinished experiment or Mastery if all three are complete.

- [ ] **Step 5: Run focused tests and inspect wrong-answer feedback**

```powershell
npm run test:academy
```

Manually choose a wrong response in every experiment. Confirm the evidence still teaches the relationship and the user can proceed after reading it.

- [ ] **Step 6: Commit when Git is available**

```bash
git add academy-native-lesson.js academy-native-lesson.css scripts/academy-backspin-browser.test.mjs
git commit -m "feat(academy): teach Backspin myths through prediction"
```

---

### Task 8: Implement five-task model-based mastery and Result

**Files:**

- Modify: `academy-native-lesson.js`
- Modify: `academy-native-lesson.css`
- Modify: `academy.html`
- Test: `scripts/academy-backspin-browser.test.mjs`

- [ ] **Step 1: Write mastery gate tests**

Test these cases from a fresh localStorage state:

1. 3/5 creates `complete`, never `mastered`.
2. 4/5 creates `mastered`.
3. Task 5 fails outside 6,800-7,400 rpm or below 50° landing.
4. Task 5 passes at the default 30/-3/120 stopping-flight state.
5. Reloading Result submits nothing again: XP, `quizAttempts`, badges and unlocks remain byte-for-byte unchanged.
6. Retry creates a new attempt ID and can lift best score without re-awarding prior best-score XP.
7. Rank changes only when total persisted XP crosses `LEVELS` threshold.

- [ ] **Step 2: Define five concrete tasks**

Use one task per paged substep inside S4:

```js
const MASTERY_TASKS = [
  { id:'definition', kind:'choice', prompt:'Spin loft equals:', choices:['Dynamic loft − attack angle','Dynamic loft + attack angle','Club speed × face angle'], answerIndex:0 },
  { id:'compare', kind:'engine-compare', prompt:'Which delivery produces more backspin?', left:{dynamicLoft:26,attackAngle:-2,ballSpeed:120}, right:{dynamicLoft:34,attackAngle:-4,ballSpeed:120}, answerIndex:1 },
  { id:'reduce', kind:'engine-compare', prompt:'From 30° loft and −1° attack, which attack-angle change reduces spin loft?', left:{dynamicLoft:30,attackAngle:3,ballSpeed:120}, right:{dynamicLoft:30,attackAngle:-5,ballSpeed:120}, answerIndex:0 },
  { id:'honesty', kind:'choice', prompt:'The Wet range is:', choices:['A solveFlight output','A measured value from this phone','A sourced real-world estimate'], answerIndex:2 },
  { id:'target', kind:'lab-target', prompt:'Create 6,800–7,400 rpm with landing angle at or above 50°.' }
];
```

For engine comparisons, do not reveal numeric outputs before the answer. Reveal both runs after selection.

- [ ] **Step 3: Start and persist a stable mastery attempt**

When S4 opens for the first time, create an ID with `crypto.randomUUID()` and a timestamp/counter fallback. Persist `{ surface:4, masteryAttemptId, lastSubmission:null }` immediately. Backward navigation retains this ID. `Retry the check` creates a new ID, clears local task state and `lastSubmission`, and persists the reset before rendering task 1.

- [ ] **Step 4: Build the target mini-lab**

Task 5 reuses the same model functions, three parameter chips and one active range. It starts at:

```js
{ dynamicLoft:25, attackAngle:-3, ballSpeed:120 }
```

The submission button is always available. On submission, call `passesStoppingFlightTarget(state)`. Wrong submissions show current rpm and landing angle plus the nearest unmet condition. They do not reveal an exact slider recipe.

- [ ] **Step 5: Submit one normalized attempt to Academy**

Normalize all five tasks to the existing Academy result contract:

```js
{
  resolved:Boolean(task.correct),
  firstTry:Boolean(task.correct && task.answerCount === 1)
}
```

An incorrect scored prediction remains `resolved:false` even though its evidence is revealed and the learner can continue. This makes 3/5 and 4/5 real outcomes instead of turning every completed task into 5/5.

Call `onSubmit({ attemptId:state.masteryAttemptId, results })` once when the learner opens Result. Store the returned summary in renderer state. If the loaded journey already contains `lastSubmission` for the active attempt, render that summary and do not call `onSubmit`. A duplicate click or event may still reach Academy, but the wrapper from Task 3 must return the stored summary without mutation.

- [ ] **Step 6: Render honest Result states**

If `summary.mastered`:

```text
BACKSPIN MASTERED
You can separate spin loft from “hitting down” and control a shot's stopping flight in the Flightglass model.
[score] · [+XP this attempt]
Next: Launch Angle
Back to path
```

If not mastered:

```text
BACKSPIN COMPLETE
[score] of 5 on the mastery check. Retry for mastery (4/5).
Retry the check
Back to path
```

Do not hard-code `Apprentice` or `Technician`. Use the summary returned by Academy.

- [ ] **Step 7: Wire the existing badge and unlock contract**

Verify `spin-doctor`, `first-light`, unlock recomputation and path counts use the existing Academy commit helper. Do not recreate badges inside `academy-native-lesson.js`.

- [ ] **Step 8: Run mastery tests**

```powershell
npm run test:academy
npm run test:ux
```

Expected: all seven mastery cases PASS and legacy lesson completion still PASS.

- [ ] **Step 9: Commit when Git is available**

```bash
git add academy-native-lesson.js academy-native-lesson.css academy.html scripts/academy-backspin-browser.test.mjs
git commit -m "feat(academy): require model-based Backspin mastery"
```

---

### Task 9: Complete browser, accessibility and responsive verification

**Files:**

- Modify: `scripts/academy-backspin-browser.test.mjs`
- Modify: `academy-native-lesson.js`
- Modify: `academy-native-lesson.css`

- [ ] **Step 1: Harden the reusable browser harness**

The test file must:

- Start an ephemeral static server rooted at the repository using `node:http`.
- Resolve MIME types for HTML, JS, CSS, SVG, PNG, JPG and fonts.
- Launch Edge first, then Chrome fallback through `tools/node_modules/playwright-core`.
- Close every context, page, browser and server in `test.after()`.
- Collect console errors, page errors and failed requests.

Retain the server and launch pattern introduced in Task 4. Assert that the test file contains no `test.skip`, `.skip(` or placeholder test names before adding the remaining cases.

- [ ] **Step 2: Add complete viewport assertions**

For every surface and both viewports, assert:

```js
const box = await locator.boundingBox();
assert.ok(box.x >= 0 && box.y >= 0);
assert.ok(box.x + box.width <= viewport.width + 1);
assert.ok(box.y + box.height <= viewport.height + 1);
```

Also assert:

```js
assert.equal(await page.evaluate(() => document.documentElement.scrollLeft), 0);
assert.equal(await page.evaluate(() => document.documentElement.scrollTop), 0);
```

The wide pager may have an internal transformed width; user-scrollable overflow must remain zero.

- [ ] **Step 3: Audit target sizes**

Run this browser assertion after each surface renders:

```js
const small = await page.locator('#nativeLesson a, #nativeLesson button, #nativeLesson input, #nativeLesson [role="button"]').evaluateAll(elements =>
  elements.filter(element => {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44);
  }).map(element => ({
    text:(element.textContent || element.getAttribute('aria-label') || '').trim(),
    width:element.getBoundingClientRect().width,
    height:element.getBoundingClientRect().height
  }))
);
assert.deepEqual(small, []);
```

- [ ] **Step 4: Add keyboard completion**

Use only Tab, Shift+Tab, Arrow keys, Space, Enter and Escape to:

- enter Lab;
- select a parameter;
- change a range;
- open and close a sheet;
- complete one myth;
- answer one mastery choice.

Assert visible focus after every step and focus return after sheet dismissal.

- [ ] **Step 5: Add reduced-motion equivalence**

Create a page with:

```js
await page.emulateMedia({ reducedMotion:'reduce' });
```

Assert surface changes are immediate, chain values are present without staged delays and no essential information is missing.

- [ ] **Step 6: Add failure-path tests**

Cover:

- localStorage getter/setter throwing;
- `HTMLCanvasElement.prototype.getContext` returning null;
- missing real-world JPG;
- route change while a settle timer or sheet is active;
- non-finite model state rejected without mission credit.

Expected behavior is the fallback contract in the design spec, with no uncaught page error.

- [ ] **Step 7: Run the complete focused suite**

```powershell
npm run test:academy
```

Expected: no skipped or placeholder test names; all tests PASS.

- [ ] **Step 8: Commit when Git is available**

```bash
git add scripts/academy-backspin-browser.test.mjs academy-native-lesson.js academy-native-lesson.css
git commit -m "test(academy): verify Backspin native lesson contract"
```

---

### Task 10: Ship Academy assets through the native package and lock the 96 target

**Files:**

- Modify: `scripts/copy-web.mjs:33`
- Modify: `config/flightglass-surfaces.json`
- Modify: `scripts/flightglass-ux.test.mjs`
- Modify: `docs/FLIGHTGLASS-CLAUDE-CODE-MASTER-PLAN.md`

- [ ] **Step 1: Write failing packaging assertions**

Add a Node test to `scripts/flightglass-ux.test.mjs` that runs `scripts/copy-web.mjs` and asserts:

```js
for (const file of [
  'academy.html',
  'academy-backspin-model.js',
  'academy-lesson-journey.js',
  'academy-native-lesson.js',
  'academy-native-lesson.css'
]) {
  assert.equal(existsSync(join(ROOT, 'www', file)), true, `${file} must ship`);
}
assert.equal(existsSync(join(ROOT, 'www', 'academy-lesson-v2-mock.html')), false);
```

Expected before the allowlist change: FAIL because `www/academy.html` is absent.

- [ ] **Step 2: Ship Academy HTML**

Change `ALLOWED_HTML_FILES` in `scripts/copy-web.mjs` to:

```js
const ALLOWED_HTML_FILES = [
  'index.html',
  'geometry.html',
  'impact.html',
  'academy.html',
  'terms.html',
  'privacy.html'
];
```

Top-level JS/CSS sweeping already copies the four new assets.

- [ ] **Step 3: Raise the Academy lesson audit contract**

In `config/flightglass-surfaces.json`, set the Academy lesson entry to:

```json
{
  "id": "academy-lesson",
  "label": "Academy lesson",
  "phase": 6,
  "baselineScore": 73,
  "targetScore": 96,
  "route": "academy.html#/lesson/backspin",
  "sourceType": "shipping-web-state",
  "viewportIds": ["portrait-wide", "portrait-compact"],
  "requiredSelectors": ["#nativeLesson", "#backspinTruth", "#labRange"],
  "references": [
    "academy-lesson-v2-mock.html",
    "docs/academy-native-v2-spec.md",
    "docs/superpowers/specs/2026-07-13-backspin-96-97-design.md"
  ],
  "primaryJob": "Predict, manipulate and demonstrate control of backspin in an honest live model."
}
```

- [ ] **Step 4: Lock the target in the manifest test**

Add:

```js
test('Backspin reference lesson targets 96 before Academy rollout', () => {
  const manifest = loadManifest(manifestPath);
  const lesson = manifest.surfaces.find(surface => surface.id === 'academy-lesson');
  assert.equal(lesson.targetScore, 96);
  assert.deepEqual(lesson.requiredSelectors, ['#nativeLesson', '#backspinTruth', '#labRange']);
});
```

- [ ] **Step 5: Update Phase 6 documentation**

Add the v3 spec to the Phase 6 normative references and state:

```text
Backspin exit target: 96-97. The target is earned only by model, mastery, mobile and accessibility evidence; no heuristic score overrides a critical defect.
```

- [ ] **Step 6: Regenerate and verify the native web bundle**

Run:

```powershell
npm run copy-web
npm run test:ux
Get-Item www/academy.html,www/academy-backspin-model.js,www/academy-lesson-journey.js,www/academy-native-lesson.js,www/academy-native-lesson.css
```

Expected: files exist, mocks do not ship, all tests PASS.

- [ ] **Step 7: Commit when Git is available**

```bash
git add scripts/copy-web.mjs config/flightglass-surfaces.json scripts/flightglass-ux.test.mjs docs/FLIGHTGLASS-CLAUDE-CODE-MASTER-PLAN.md
git commit -m "build(academy): ship the Backspin reference lesson"
```

---

### Task 11: Final visual verification, score and autonomous handoff

**Files:**

- Modify: `docs/flightglass-autopilot/STATUS.md`
- Evidence: `outputs/flightglass-ux/verify--academy-lesson-report.*`

- [ ] **Step 1: Run every focused gate from a clean process**

```powershell
npm run test:academy
npm run test:ux
npm run brand:verify
npm run copy-web
node scripts/flightglass-ux-audit.mjs --mode verify --surface academy-lesson --motion both
```

Expected: all exit `0`; no critical runtime, overflow, missing-selector or failed-resource issue.

- [ ] **Step 2: Inspect all final screenshots**

Inspect normal and reduced-motion captures for 430x932 and 375x812. For each of the six surfaces verify:

- one clear job and anchor;
- no clipped essential content;
- no control changes an unseen model;
- orange is reserved for current engine truth/action;
- estimate register remains violet and explicitly sourced;
- bottom navigation does not cover content;
- visual result is at least as polished as the v2 mock.

- [ ] **Step 3: Perform the score audit**

Use the ten rows in the v3 design spec. Record 96 or 97 only if every evidence statement is true. If any row is below 94, keep Phase 6 incomplete and fix the named defect before repeating verification.

- [ ] **Step 4: Update autonomous status with evidence**

Update Phase 6 in `docs/flightglass-autopilot/STATUS.md` with:

- exact focused test totals;
- exact verify report path;
- final score and category floor;
- screenshot paths;
- confirmation that `impact-flight.js` remained byte-identical;
- confirmation that the existing storage key migrated without loss;
- any deferred item that does not affect the exit contract.

- [ ] **Step 5: Run the global readiness gate**

```powershell
npm run claude:ready
```

Expected: PASS. This proves Backspin did not weaken the broader control package.

- [ ] **Step 6: Commit when Git is available**

```bash
git add docs/flightglass-autopilot/STATUS.md outputs/flightglass-ux/verify--academy-lesson-report.*
git commit -m "docs(academy): record Backspin 96-97 verification"
```

- [ ] **Step 7: Stop at the rollout boundary**

Do not convert the remaining 23 lessons in this plan. Report that the reusable shell is production-ready and point the next planner to the verified Backspin implementation and design spec.

---

## Completion definition

This plan is complete only when:

- Backspin opens through the production Academy route.
- Initial mission state is not pre-completed.
- Mission ordering, upper and lower display limits, carry limitation and estimate separation are honest.
- The learner manipulates a visible model and receives an actual numeric cause chain.
- Myths are prediction experiments rather than an all-False pattern.
- Mastery includes a live model target and requires 4/5.
- Partial progress resumes without duplicated XP.
- Both target viewports, reduced motion, keyboard and failure paths pass.
- Academy ships into `www/` without shipping the mock.
- Focused score is 96-97 with no critical defect.
- The remaining modules have not been converted prematurely.
