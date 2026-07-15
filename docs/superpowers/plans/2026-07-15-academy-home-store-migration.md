# Academy Home and Store Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace Academy's parameter-first default path with a native outcome-led Home while preserving every legacy record and accepted Backspin behavior.

**Architecture:** Extract immutable curriculum, pure migration, route resolution, recommendation, voice arbitration and Home rendering from `academy.html` into top-level ES modules copied by the existing native bundle script. Keep the `strikearc.academy.v1` key and legacy lesson corpus; add normalized outcome-experience state and route all mounts through a small host. Adapt Backspin to the host without redesigning its accepted renderer.

**Tech Stack:** Static ES modules, DOM/CSS, Node test runner, Playwright-based Academy browser harness, Capacitor `www/` packaging, localStorage, local audio assets only.

**Normative spec:** `docs/superpowers/specs/2026-07-15-academy-home-store-migration-design.md`

**Cross-audit:** `docs/superpowers/specs/2026-07-15-academy-cross-curriculum-acceptance-audit.md`

---

## Batch laws

- This batch implements shared infrastructure and Home only. It does not
  implement Start Line or any other new experience.
- Do not edit `impact-flight.js` or `swing-parameters-and-impact.js`.
- Do not redesign Backspin markup, copy, model, CSS or mastery target.
- Keep `strikearc.academy.v1` and `strikearc.academy.nudge`.
- Never stage unrelated untracked artifacts under `outputs/`, `scripts/workflows/`
  or the root chat brief.
- Run tests from the repository root.
- Commit after every task only when its focused and relevant regression tests
  pass.
- Stop the rollout if legacy data/XP cannot be preserved or Backspin regresses.

---

### Task 1: Freeze the current Backspin and storage baseline

**Files:**

- Create: `scripts/academy-protected-baseline.test.mjs`
- Modify: `package.json`
- Read only: `impact-flight.js`
- Read only: `swing-parameters-and-impact.js`
- Read only: `academy.html`
- Test: `scripts/academy-backspin-model.test.mjs`
- Test: `scripts/academy-lesson-journey.test.mjs`
- Test: `scripts/academy-backspin-browser.test.mjs`

**Step 1: Record protected-file hashes inside a failing test**

Add a test that reads the two protected files and compares SHA-256 hashes to
constants captured from the clean branch immediately before implementation.
The constants must come from:

```powershell
Get-FileHash impact-flight.js -Algorithm SHA256
Get-FileHash swing-parameters-and-impact.js -Algorithm SHA256
```

Do not guess or copy hashes from this plan.

**Step 2: Add a Backspin route/state smoke test before extraction**

Extend the existing browser harness only if it does not already prove:

```text
#/lesson/backspin opens the native six-surface lesson
saved surface restores
4/5 without live transfer is not Mastered
accepted live mastery persists after reload
duplicate submission does not add XP
```

**Step 3: Run the baseline**

Run:

```powershell
npm run test:academy
node --test scripts/academy-protected-baseline.test.mjs
```

Expected: PASS before any extraction. If it fails, stop and repair the baseline
test without changing product behavior.

**Step 4: Add the protected test to `test:academy`**

Keep explicit serial ordering. Do not remove current test files.

**Step 5: Commit**

```powershell
git add package.json scripts/academy-protected-baseline.test.mjs scripts/academy-backspin-browser.test.mjs
git commit -m "test: lock Academy migration baseline"
```

---

### Task 2: Build and validate the immutable curriculum registry

**Files:**

- Create: `academy-curriculum.js`
- Create: `scripts/academy-curriculum.test.mjs`
- Modify: `package.json`
- Reference: `docs/superpowers/specs/2026-07-15-academy-home-store-migration-design.md`

**Step 1: Write the failing exact-inventory tests**

The tests must import:

```js
import {
  ACADEMY_EXPERIENCES,
  ACADEMY_GOALS,
  CORE_EXPERIENCE_IDS,
  CONCEPT_OWNER,
  validateAcademyCurriculum
} from '../academy-curriculum.js';
```

Assert:

```js
assert.equal(ACADEMY_EXPERIENCES.length, 14);
assert.equal(CORE_EXPERIENCE_IDS.length, 13);
assert.equal(Object.keys(CONCEPT_OWNER).length, 24);
assert.equal(CONCEPT_OWNER['face-angle'], 'start-line');
assert.equal(CONCEPT_OWNER.offline, 'shot-pattern');
assert.equal(CONCEPT_OWNER.temperature, 'air-density');
assert.equal(CONCEPT_OWNER['plane-coupling'], 'plane-coupling-lab');
```

Also test duplicate ownership, unknown prerequisite, cycle, optional-to-core gate
and missing renderer key using deliberately invalid fixture registries.

**Step 2: Run to verify failure**

Run:

```powershell
node --test scripts/academy-curriculum.test.mjs
```

Expected: FAIL because `academy-curriculum.js` does not exist.

**Step 3: Implement only immutable registry helpers**

Implement the exact registry and goals from the normative spec. Export frozen
arrays/maps and:

```js
export function validateAcademyCurriculum(experiences, goals) {
  return { valid, errors };
}

export function experienceById(id) {}
export function ownerForConcept(conceptId) {}
export function prerequisitesFor(experienceId) {}
```

Validation must be pure and deterministic. Do not import DOM, storage or a
physics engine.

**Step 4: Run focused tests**

Expected: all registry tests PASS.

**Step 5: Run Backspin regression**

Run `npm run test:academy`.

Expected: PASS with no current renderer changes.

**Step 6: Commit**

```powershell
git add academy-curriculum.js scripts/academy-curriculum.test.mjs package.json
git commit -m "feat: add Academy outcome registry"
```

---

### Task 3: Implement non-destructive state seed and migration

**Files:**

- Create: `academy-store.js`
- Create: `scripts/academy-store-migration.test.mjs`
- Modify: `package.json`
- Reference: current store block in `academy.html` beginning at `STORE_KEY`

**Step 1: Write the 12 golden-profile fixtures**

Create explicit objects for every profile in spec Section 8.6. Do not reuse one
mutated fixture across tests. Freeze originals and deep-clone before migration.

Required imports:

```js
import {
  ACADEMY_STORE_KEY,
  createAcademySeed,
  normalizeAcademyStore,
  migrateOutcomeAcademy,
  deriveExperienceStatus
} from '../academy-store.js';
```

**Step 2: Write the critical preservation assertions**

For the high-XP/unknown-field fixture, assert after migration:

```js
assert.equal(next.xp, before.xp);
assert.deepEqual(next.badges, before.badges);
assert.deepEqual(next.unlocked, before.unlocked);
assert.deepEqual(next.lessons['future-concept'], before.lessons['future-concept']);
assert.deepEqual(next.futureTopLevel, before.futureTopLevel);
```

For partial merged evidence:

```js
assert.equal(next.experiences['speed-transfer'].status, 'practiced');
assert.equal(next.experiences['speed-transfer'].reviewEligible, false);
```

For all three Speed Transfer legacy concepts complete:

```js
assert.equal(next.experiences['speed-transfer'].reviewEligible, true);
assert.equal(next.experiences['speed-transfer'].status, 'practiced');
assert.equal(next.experiences['speed-transfer'].evidence.liveTransferPassed, false);
```

**Step 3: Verify tests fail**

Run the focused migration test. Expected: FAIL because exports do not exist.

**Step 4: Implement pure seed/normalization/migration**

Rules:

- preserve parsed unknown data;
- normalize known legacy records without dropping unknown lesson IDs;
- create all 14 experience records;
- derive Practiced from read/touch/attempt/completion evidence;
- set review eligibility only when every owned legacy concept is complete;
- grandfather only legitimate accepted native Backspin mastery;
- Plane Coupling never becomes core Mastered;
- preserve timestamps on repeated normalization;
- return diagnostics separately from state when parsing/shape is invalid.

Do not call localStorage in pure migration functions.

**Step 5: Prove idempotence**

For every valid golden profile:

```js
const once = migrateOutcomeAcademy(profile, { now: FIXED_NOW });
const twice = migrateOutcomeAcademy(once, { now: LATER_NOW });
assert.deepEqual(twice, once);
```

Expected: PASS. `appliedAt` must not change.

**Step 6: Add storage adapter tests**

Inject a fake storage object. Assert:

- corrupt JSON is returned as recoverable seed/diagnostic;
- corrupt raw value is not overwritten during load;
- successful explicit mutation writes the normalized state;
- write exception returns failure and keeps in-memory evidence available.

**Step 7: Run focused + Academy regression tests**

Expected: PASS.

**Step 8: Commit**

```powershell
git add academy-store.js scripts/academy-store-migration.test.mjs package.json
git commit -m "feat: migrate Academy progress non-destructively"
```

---

### Task 4: Centralize mastery and duplicate-reward protection

**Files:**

- Modify: `academy-store.js`
- Create: `scripts/academy-mastery-transaction.test.mjs`
- Modify: `package.json`

**Step 1: Write failing gate tests**

Cover:

```text
3/5 + live = knowledge-gate failure
4/5 + no live = live-gate failure
4/5 + live = accepted
5/5 + live = accepted
duplicate attempt = accepted false, duplicate true, XP 0
new attempt after mastery = no second XP
stale content version = stale-content failure
optional lab = invalid/no reward
```

Pass the current experience registry into the pure transaction; do not let the
test reach into DOM globals.

**Step 2: Verify failure**

Run `node --test scripts/academy-mastery-transaction.test.mjs`.

Expected: FAIL because `acceptExperienceAttempt` is absent.

**Step 3: Implement the transaction**

Export:

```js
export function acceptExperienceAttempt(store, submission, options) {
  return { store, accepted, duplicate, reason, xpAwarded, experience };
}
```

Validate finite integers, exact current content version, 80% threshold and live
boolean/evidence. Write an idempotent ledger record before raising status to
Mastered in the returned state.

**Step 4: Add save-before-result adapter test**

The adapter callback must report `accepted:false, reason:'save-failed'` when
storage throws. The Home/lesson UI may keep the attempt in memory but must not
render the earned result.

**Step 5: Run tests and commit**

```powershell
node --test scripts/academy-mastery-transaction.test.mjs scripts/academy-store-migration.test.mjs
npm run test:academy
git add academy-store.js scripts/academy-mastery-transaction.test.mjs package.json
git commit -m "feat: gate Academy mastery transactions"
```

---

### Task 5: Add canonical routing and deterministic recommendation

**Files:**

- Create: `academy-router.js`
- Create: `academy-journey-router.js`
- Create: `scripts/academy-router.test.mjs`
- Create: `scripts/academy-recommendation.test.mjs`
- Modify: `package.json`

**Step 1: Write all route-alias tests**

Generate one test per `CONCEPT_OWNER` entry. Expected examples:

```js
assert.deepEqual(resolveAcademyRoute('#/lesson/face-angle'), {
  view: 'experience', experienceId: 'start-line', conceptId: 'face-angle'
});
assert.deepEqual(resolveAcademyRoute('#/lesson/temperature'), {
  view: 'experience', experienceId: 'air-density', conceptId: 'temperature'
});
```

Also cover canonical Home, canonical experience/surface, Explore, Backspin old
route, out-of-range surface and unknown/malformed fallback.

**Step 2: Write recommendation priority tests**

Create independent fixtures for:

- partial Continue outranks fresh Start;
- knowledge-complete/live-missing Repair outranks review;
- Review after migrated evidence;
- selected goal order;
- missing prerequisite recommendation;
- fresh root choice;
- all-core-mastered Explore;
- deterministic tie;
- optional lab excluded from completion.

Assert the exact `kind`, `experienceId`, reason code and route. Learner-facing
reason strings come from an approved fragment map.

**Step 3: Verify both focused suites fail**

Expected: missing modules.

**Step 4: Implement pure route and recommendation modules**

Do not read location, DOM or localStorage inside pure exports. Do not use legacy
`LESSONS.next` or the old environment chain.

Export mastery-entry decision separately:

```js
export function canEnterMastery(experienceId, store) {
  return { allowed, missingPrerequisiteIds, placementAvailable };
}
```

Preview is always allowed.

**Step 5: Run tests and commit**

```powershell
node --test scripts/academy-router.test.mjs scripts/academy-recommendation.test.mjs
npm run test:academy
git add academy-router.js academy-journey-router.js scripts/academy-router.test.mjs scripts/academy-recommendation.test.mjs package.json
git commit -m "feat: route Academy outcome journeys"
```

---

### Task 6: Implement local voice cue arbitration

**Required companion plan:** Execute
`docs/superpowers/plans/2026-07-15-academy-voice-system.md` task-by-task here,
after the shared store exists and before Task 7 Home acceptance. The companion
plan is authoritative where it adds consent modes, cue validation, semantic
screen beats, captions, Replay, Voice Off, reference assets and lifecycle
gates. The abbreviated steps below remain a minimum compatibility summary.

Read its normative design first:
`docs/superpowers/specs/2026-07-15-academy-voice-system-design.md`.

**Files:**

- Create: `academy-voice.js`
- Create: `scripts/academy-voice.test.mjs`
- Modify: `package.json`
- Do not create paid/generated audio assets in this task

**Step 1: Write failing semantic-cue tests**

Use fake clock, fake audio factory and fake screen-reader state. Cover:

- unset preference never auto-plays and requests the one-time mode choice;
- first eligible automatic cue after explicit Voice choice plays once;
- Captions only publishes the caption without audio;
- Voice Off publishes neither automatic caption nor audio;
- identical signature is suppressed;
- content-version change plays once;
- Replay plays without changing automatic history;
- Voice Off stops current audio and persists through the supplied store;
- no overlap;
- stale automatic request is discarded after route epoch changes; no queue
  exists;
- screen-reader active suppresses audio but preserves caption;
- background stops audio and foreground does not resume;
- missing asset returns caption-only state;
- cue text and visual target are required;
- no experience manifest exceeds eight signatures.

**Step 2: Verify failure**

Expected: missing module.

**Step 3: Implement injected, local-only controller**

Suggested public API:

```js
export function createAcademyVoiceController({
  getPreferences,
  setMode,
  markSeen,
  createAudio,
  getScreenReaderState,
  getForegroundState,
  now,
  setTimer,
  clearTimer,
  onCaption,
  onPlayback,
  onDiagnostic
}) {
  return {
    enterRoute,
    deliverAutomatic,
    offerRecovery,
    replay,
    stop,
    setVoiceMode,
    getState,
    destroy
  };
}
```

The controller receives pre-authored text/asset URL. It must never call speech
synthesis, fetch a remote endpoint or generate language.

**Step 4: Add the three Home cue definitions**

Use the three approved static Home lines. The recommendation cue never splices
the current title/reason; those exact details remain visible on the coach card.
Validate each line remains 12–24 words.

**Step 5: Run tests and commit**

```powershell
node --test scripts/academy-voice.test.mjs
npm run test:academy
git add academy-voice.js scripts/academy-voice.test.mjs package.json
git commit -m "feat: add local Academy voice cues"
```

---

### Task 7: Build the Academy Home view model and renderer

**Files:**

- Create: `academy-home.js`
- Create: `academy-home.css`
- Create: `scripts/academy-home-view-model.test.mjs`
- Modify: `academy.html`
- Modify: `package.json`

**Step 1: Write view-model tests without DOM**

Export and test:

```js
export function buildAcademyHomeViewModel({ store, recommendation }) {}
```

Assert fresh, migrated, partial, all-mastered and optional-lab states:

- denominator exactly 13;
- Mastered count excludes Practiced and optional;
- Practiced count text is separate;
- one primary action only;
- every family/experience card has explicit status text;
- optional lab label says it does not affect Academy mastery;
- XP is absent from primary action data;
- selected goal changes recommendation, not progress.

**Step 2: Verify failure**

Run focused view-model tests. Expected: missing module.

**Step 3: Implement semantic Home markup**

`mountAcademyHome({ root, viewModel, callbacks, voice })` renders:

1. existing global Academy header actions;
2. title and intro;
3. one primary coach card;
4. radio-semantic goal chooser;
5. 13-core progress;
6. vertical family sections/cards;
7. optional model lab;
8. Explore physics secondary action.

Keep every action as a real button/link. Do not use horizontal-only carousels.

**Step 4: Implement the outcome-horizon visual**

CSS only or an accessible decorative SVG:

- one restrained horizon;
- one recommended Ember mark;
- no more than one pulse;
- reduced motion resolves immediately;
- visual is `aria-hidden` because action/title/reason are DOM truth.

**Step 5: Wire callbacks and focus**

- primary action route;
- goal change persistence;
- family-card preview/open;
- progress sheet;
- Explore route;
- Replay/mute;
- cleanup all listeners on destroy.

**Step 6: Run focused tests and commit**

```powershell
node --test scripts/academy-home-view-model.test.mjs
npm run test:academy
git add academy-home.js academy-home.css academy.html scripts/academy-home-view-model.test.mjs package.json
git commit -m "feat: build outcome-led Academy Home"
```

---

### Task 8: Introduce the experience host and adapt Backspin

**Files:**

- Create: `academy-experience-host.js`
- Create: `scripts/academy-experience-host.test.mjs`
- Modify: `academy.html`
- Modify: `academy-native-lesson.js`
- Test: all existing Academy tests

**Step 1: Write failing host lifecycle tests**

Use fake mount functions and assert:

- registered renderer mounts with normalized state/callbacks;
- previous cleanup runs exactly once before another route;
- missing renderer returns recoverable unavailable markup/state;
- host obtains Back/Next from supplied route callback;
- renderer cannot submit mastery without store transaction callback;
- concept intent is passed to renderer;
- renderer never receives mutable global store object.

**Step 2: Implement the smallest host**

Suggested API:

```js
export function createAcademyExperienceHost({ root, renderers, services }) {
  return { mount, destroy };
}
```

Do not create a universal instrument renderer.

**Step 3: Adapt Backspin without visual changes**

Wrap `mountNativeBackspinLesson` as renderer key `backspin-native`. Translate
the host callbacks to current Backspin options. Replace its hardcoded Launch
Angle next route with the shared recommendation callback.

Do not change accepted Backspin copy, physics, target, CSS or surface order in
this task.

**Step 4: Wire canonical and legacy routes in `academy.html`**

Replace the special `if (id === 'backspin')` route branch with host dispatch.
Keep legacy article rendering accessible from Explore/owned concept sheets
until later experience modules replace their owner route.

**Step 5: Run the full Academy regression**

Run:

```powershell
npm run test:academy
npm run test:webkit
```

Expected: all current Backspin tests PASS, including old route alias and
canonical outcome route.

**Step 6: Commit**

```powershell
git add academy-experience-host.js academy.html academy-native-lesson.js scripts/academy-experience-host.test.mjs
git commit -m "refactor: host Academy experiences safely"
```

---

### Task 9: Add browser, accessibility and migration-state coverage

**Files:**

- Create: `scripts/academy-home-browser.test.mjs`
- Modify: `scripts/academy-backspin-browser.test.mjs`
- Modify: `package.json`
- Evidence: new files only under the approved phase output directory named in
  `docs/flightglass-autopilot/STATUS.md`

**Step 1: Add deterministic storage seeding to browser harness**

Seed before page load:

- fresh;
- partial Shape;
- migrated legacy-only;
- accepted Backspin;
- all 13 core mastered;
- corrupt JSON.

Never mutate real user storage.

**Step 2: Assert Home semantics**

For every relevant fixture:

- one primary coach action;
- correct action label/reason;
- correct 13-core progress values;
- Practiced versus Mastered text;
- goal radio semantics;
- optional lab exclusion;
- family heading order;
- legacy alias resolution;
- invalid-store non-destructive warning.

**Step 3: Assert keyboard/focus behavior**

Complete primary action, goal change, card preview, sheet close and route back
with keyboard only. Assert focus return and one H1.

**Step 4: Assert reduced motion and voice fallback**

- no pulsing transition under reduced motion;
- final outcome mark present;
- missing audio leaves caption/content intact;
- mute persists after reload;
- screen-reader suppression hook prevents playback.

**Step 5: Run axe and target viewport captures**

At 430×932 and 375×812, normal and reduced motion, capture at least:

- fresh Home;
- migrated Home;
- partial/Repair Home;
- all-mastered Home;
- Explore entry;
- Backspin canonical route.

Expected: zero critical accessibility violation and no clipped primary action.

**Step 6: Run focused browser tests and commit**

```powershell
node --test --test-concurrency=1 scripts/academy-home-browser.test.mjs
npm run test:academy
git add scripts/academy-home-browser.test.mjs scripts/academy-backspin-browser.test.mjs package.json
git commit -m "test: verify Academy Home and migration states"
```

---

### Task 10: Package, verify and close the shared batch

**Files:**

- Modify: `docs/flightglass-autopilot/STATUS.md`
- Modify: `docs/SESSION-HANDOFF.md`
- Modify only if needed for test registration: `package.json`
- Generated mirror: `www/` via existing script; do not hand-edit

**Step 1: Run the full fresh verification**

```powershell
npm run copy-web
npm run brand:verify
npm run test:academy
npm run test:ux
npm run test:perf
node scripts/verify-claude-autopilot.mjs
```

Expected: every command exits 0. Record counts and evidence paths, not just
“passes.”

**Step 2: Verify packaged parity**

Compare root and `www/` bytes for every shipping Academy module/CSS/HTML created
or modified in this batch. Expected: identical.

**Step 3: Recheck protected hashes**

Run the hash command from Task 1 and the protected baseline test. Expected:
exact match.

**Step 4: Run native manual gates**

On physical iPhone:

- launch offline;
- open fresh/migrated Home;
- change goal;
- enter Backspin by old and canonical route;
- background/foreground during a voice cue;
- use VoiceOver through primary action, goal group, progress and one family;
- confirm safe areas and 200% text.

If physical-device evidence is owner-only, mark it `PENDING OWNER DEVICE GATE`;
do not claim production acceptance.

**Step 5: Run pairwise-blind Home comparison**

Compare new Home against the current parameter path at both target viewports.
Acceptance requires preference for clarity of next action, progress honesty and
outcome organization. Derived score is secondary.

**Step 6: Update ledgers**

Record:

- exact commits;
- test commands/counts;
- migration fixture evidence;
- screenshots;
- pairwise result;
- protected hashes;
- open owner-device gate;
- explicit authorization state for Start Line.

**Step 7: Secret scan, diff check and commit**

```powershell
git diff --check
git status --short
git diff --name-only
git add <only intended shared-batch files and approved evidence>
git diff --cached --check
git commit -m "docs: accept Academy Home infrastructure"
```

Do not stage unrelated output or `scripts/workflows/` files.

**Step 8: Push the recoverable checkpoint**

```powershell
git push origin agent/travel-sync
```

**Batch completion decision:**

- `accepted` only if all automated critical gates, Backspin regression,
  migration preservation and applicable human gates pass;
- `executing` if owner-device/pairwise evidence is still pending;
- `escalated` only with the smallest concrete blocking decision after the
  allowed verification rounds.
