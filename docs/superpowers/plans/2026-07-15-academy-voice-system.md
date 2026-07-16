# Academy Voice System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the native, local-first Academy Voice System that delivers prerecorded semantic cues once, synchronizes them with the correct screen evidence and gives the learner complete control through consent, captions, Replay and Voice Off.

**Architecture:** Add frozen semantic cue validation, additive voice preferences/history inside the existing Academy v1 store, one injected playback arbiter, one semantic beat coordinator and one accessible shared cue strip/settings sheet. Execute this plan inside Academy Batch 0 after the shared store exists and before Home/Backspin are accepted; later experience batches only add validated cues/assets and registered target IDs.

**Tech Stack:** Static ES modules/CSS in the Capacitor package, local AAC-LC `.m4a` assets, existing `strikearc.academy.v1` store, `HTMLAudioElement` through an injected factory, Node test runner, Playwright/WebKit Academy harness, existing package-copy and evidence gates.

**Normative design:** `docs/superpowers/specs/2026-07-15-academy-voice-system-design.md`

**Parent batch:** Task 6 of `docs/superpowers/plans/2026-07-15-academy-home-store-migration.md`

---

## 1. Execution boundary

Run this plan only after the Home/store plan has created and tested:

- `academy-curriculum.js`;
- `academy-store.js`;
- additive/idempotent `strikearc.academy.v1` migration;
- the shared route epoch/host contract or an equivalent injected route token.

Finish Tasks 1–6 before Home rendering is accepted. Finish Tasks 7–10 before
Batch 0 can be accepted as Voice-ready.

This plan may modify shared Academy UI and the accepted Backspin host hooks. It
may not:

- change a physics engine;
- change mastery, XP or rewards;
- add speech synthesis, remote fetch or a runtime provider SDK;
- create a second Academy store key;
- make audio necessary for navigation or completion;
- implement Start Line or another new experience early;
- hand-edit `www/`.

Record a protected-file hash baseline before Task 1 and compare it again in
Task 10.

---

### Task 1: Lock semantic cue schema and content budgets

**Files:**

- Create: `academy-voice-manifest.js`
- Create: `scripts/academy-voice-manifest.test.mjs`
- Modify: `package.json`
- Read: `docs/superpowers/specs/2026-07-15-academy-voice-system-design.md`
- Read: all 14 experience voice tables named by the cross-curriculum audit

**Step 1: Write failing schema tests**

Cover:

- stable non-empty `cueId`;
- integer `contentVersion >= 1`;
- pack `control-room-en-us-v1` and `en-US` locale;
- job is exactly `orient`, `cue`, `consequence` or `recovery`;
- trigger belongs to the allowed union;
- text contains 12–24 words under the shared Unicode word counter;
- asset is absent for caption-only development or a local relative `.m4a`
  path under `assets/audio/academy/`;
- remote/protocol-relative/data URLs fail;
- one to three beats, each with semantic `targetId`, finite non-negative
  `atMs` and allowed emphasis;
- arbitrary CSS selectors such as `#id`, `.class`, `[` fail as target IDs;
- allowed interruption names only;
- duplicate cue IDs fail;
- duplicate signatures fail;
- more than eight cues per experience fail;
- more than one automatic surface-entry cue for a surface fails;
- a recovery cue with `autoplay:true` fails;
- a cue containing runtime prompt/generation/provider fields fails.

Use fixtures that demonstrate one valid entry cue, one valid consequence cue
and separate failures for every rule.

**Step 2: Run the focused test and confirm red**

```powershell
node --test scripts/academy-voice-manifest.test.mjs
```

Expected: FAIL because `academy-voice-manifest.js` does not exist.

**Step 3: Implement the minimal immutable API**

Export:

```js
export const ACADEMY_VOICE_PACK_ID = 'control-room-en-us-v1';
export const ACADEMY_VOICE_LOCALE = 'en-US';

export function countCueWords(text) {}
export function cueSignature(cue) {}
export function validateAcademyCue(cue) {}
export function validateAcademyCueSet({ ownerId, cues, maxSignatures = 8 }) {}
export function defineAcademyCue(cue) {}
export function defineAcademyCueSet(config) {}
```

Minimum signature implementation:

```js
export function cueSignature(cue) {
  return [cue.packId, cue.locale, cue.cueId, cue.contentVersion].join(':');
}
```

`defineAcademyCue` validates first, then deep-freezes a plain-data copy. It
must reject functions. It must not import DOM/audio/store code.

**Step 4: Encode the allowed unions explicitly**

```js
const JOBS = new Set(['orient', 'cue', 'consequence', 'recovery']);
const TRIGGERS = new Set([
  'surface-entry',
  'proof-first',
  'mastery-first',
  'recommendation-first',
  'recovery-offer'
]);
const EMPHASIS = new Set(['outline', 'connector', 'trace', 'static-label']);
const INTERRUPTS = new Set(['route', 'foreground-loss', 'model-input']);
```

Do not silently normalize an invalid manifest. Throw a named validation error
that includes owner/cue ID and rule.

**Step 5: Add a package script and run green**

Add:

```json
"test:academy-voice-manifest": "node --test scripts/academy-voice-manifest.test.mjs"
```

Run:

```powershell
npm run test:academy-voice-manifest
```

Expected: all focused tests PASS.

**Step 6: Re-run the authored cue inventory**

Parse the 14 experience specs and assert:

- 99 experience cues;
- zero word-count outliers;
- maximum eight signatures per experience.

This audit verifies planning content. It does not pretend unimplemented cue
manifests already exist.

**Step 7: Commit**

```powershell
git add academy-voice-manifest.js scripts/academy-voice-manifest.test.mjs package.json
git commit -m "feat: lock Academy voice cue contract"
```

---

### Task 2: Add voice preference and repetition migration

**Files:**

- Modify: `academy-store.js`
- Modify: `scripts/academy-store.test.mjs`
- Create: `scripts/academy-voice-preferences.test.mjs`

**Step 1: Write failing migration fixtures**

Cover these exact inputs:

1. no voice fields → `mode:'unset'`;
2. `voiceEnabled:false` → `mode:'off'`;
3. `voiceEnabled:true, captionsEnabled:true` → `mode:'voice'`;
4. explicit `mode:'captions'` remains captions;
5. invalid mode becomes unset without deleting the raw unknown field;
6. existing pack/locale/volume/seen survive;
7. unknown nested voice fields survive;
8. repeated migration is semantically byte-equivalent;
9. voice migration changes no XP, badge, lesson, experience, attempt or reward;
10. selected mode persists after reload;
11. a signature can be marked seen once and updated without a duplicate entry;
12. Replay delivery cannot mark a new automatic signature;
13. storage write failure leaves the in-memory preference usable and returns
    the existing non-blocking save failure.

**Step 2: Run and confirm the intended failure**

```powershell
node --test scripts/academy-voice-preferences.test.mjs
```

Expected: FAIL because voice normalization/store operations are absent.

**Step 3: Implement the normalized shape**

Add pure helpers to the store module or an internal exported test seam:

```js
export function normalizeVoicePreferences(raw = {}) {
  const legacyMode = raw.voiceEnabled === false
    ? 'off'
    : raw.voiceEnabled === true && raw.captionsEnabled !== false
      ? 'voice'
      : 'unset';
  const mode = ['unset', 'voice', 'captions', 'off'].includes(raw.mode)
    ? raw.mode
    : legacyMode;
  return {
    ...raw,
    mode,
    packId: raw.packId || 'control-room-en-us-v1',
    locale: raw.locale || 'en-US',
    volume: Number.isFinite(raw.volume) ? Math.min(1, Math.max(0, raw.volume)) : 1,
    seen: raw.seen && typeof raw.seen === 'object' ? { ...raw.seen } : {}
  };
}
```

Provide store operations:

```js
getVoicePreferences()
setVoiceMode(mode)
markVoiceCueSeen(signature, delivery)
```

All write through the existing store transaction/save path. Do not create a
standalone `localStorage` call in voice code.

**Step 4: Run focused and migration suites**

```powershell
node --test scripts/academy-voice-preferences.test.mjs
node --test scripts/academy-store.test.mjs
```

Expected: PASS with no legacy progress delta.

**Step 5: Commit**

```powershell
git add academy-store.js scripts/academy-store.test.mjs scripts/academy-voice-preferences.test.mjs
git commit -m "feat: preserve Academy voice preference"
```

---

### Task 3: Implement the no-queue playback arbiter

**Files:**

- Create: `academy-voice.js`
- Create: `scripts/academy-voice.test.mjs`
- Modify: `package.json`

**Step 1: Build deterministic fakes**

In the test file create:

- fake clock/timers;
- fake audio object recording `play`, `pause`, `currentTime`, events and
  destruction;
- fake store callbacks;
- tri-state screen-reader callback;
- foreground/audio-focus callback;
- caption event collector;
- route epoch counter.

No test may wait for real time or play real audio.

**Step 2: Write failing controller laws**

Cover:

- unset mode suppresses and requests the preference choice;
- voice mode delivers first eligible cue once;
- captions mode emits caption and no audio;
- off mode emits neither automatic caption nor audio;
- identical signature suppressed after reload-compatible seen state;
- changed content version eligible once;
- route epoch change invalidates starting/playing request;
- second automatic cue during playback discarded, never queued;
- consequence within five seconds of prior cue is caption-only;
- recovery never auto-plays;
- model input stops within the injected 150 ms budget and keeps caption;
- foreground loss stops and foreground return does not resume;
- screen-reader `true` suppresses automatic audio;
- screen-reader `unknown` remains governed by explicit mode/consent and is
  surfaced in diagnostics, never labelled detected-safe;
- missing/rejected audio marks delivery caption-only/asset-unavailable once;
- manual Replay stops, rewinds and starts one instance;
- rapid Replay never overlaps;
- Replay does not mutate automatic history;
- setMode(`off`) stops immediately and persists;
- destroy removes listeners/stops audio;
- controller never changes progress/mastery data;
- createAudio receives only a local validated asset.

**Step 3: Confirm red**

```powershell
node --test scripts/academy-voice.test.mjs
```

Expected: FAIL because controller is missing.

**Step 4: Implement the injected controller**

Public API:

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

Keep one `active` record and one monotonically increasing `routeEpoch`. Do not
implement an array queue.

Required start order:

```text
validate current epoch
→ validate preference/eligibility
→ publish caption
→ mark signature seen
→ create one local audio instance
→ start beats/audio or return caption-only reason
```

The controller owns arbitration only. It does not query DOM targets or render
UI.

**Step 5: Run focused tests and package script**

Add:

```json
"test:academy-voice": "node --test scripts/academy-voice-manifest.test.mjs scripts/academy-voice-preferences.test.mjs scripts/academy-voice.test.mjs"
```

Run:

```powershell
npm run test:academy-voice
```

Expected: PASS.

**Step 6: Commit**

```powershell
git add academy-voice.js scripts/academy-voice.test.mjs package.json
git commit -m "feat: arbitrate Academy voice locally"
```

---

### Task 4: Implement semantic beat synchronization

**Files:**

- Create: `academy-voice-sync.js`
- Create: `scripts/academy-voice-sync.test.mjs`
- Modify: `academy-experience-host.js`

**Step 1: Write failing pure synchronization tests**

Cover:

- renderer registers semantic target IDs with `setEmphasis` and `clear`;
- duplicate target registration fails in development/test;
- one target emphasized at a time;
- beats execute in ascending authored time;
- late timer cannot run after cue/route cancellation;
- missing target records `target-unavailable` and never guesses a selector;
- reduced motion sends static emphasis instead of animated emphasis;
- Replay restarts beat zero;
- stop clears all emphasis;
- beat cannot focus a control, change an input or mutate a truth value;
- three beats accepted, four rejected by manifest validation.

**Step 2: Run red**

```powershell
node --test scripts/academy-voice-sync.test.mjs
```

Expected: missing sync module.

**Step 3: Implement the registry/coordinator**

Export:

```js
export function createVoiceTargetRegistry() {
  return { register, unregister, resolve, clearAll };
}

export function createAcademyVoiceSync({
  registry,
  reducedMotion,
  setTimer,
  clearTimer,
  onDiagnostic
}) {
  return { start, stop, restart, destroy };
}
```

The host supplies one registry to the active renderer. Route teardown clears
the registry before a new renderer mounts.

**Step 4: Add the emphasis DOM contract**

Renderers register target objects rather than selectors:

```js
voiceTargets.register('launch-ray', {
  setEmphasis({ kind, reducedMotion }) {
    root.dataset.voiceEmphasis = kind;
    root.dataset.voiceStatic = String(reducedMotion);
  },
  clear() {
    delete root.dataset.voiceEmphasis;
    delete root.dataset.voiceStatic;
  }
});
```

CSS may respond to these data attributes, but numeric DOM values may never
animate.

**Step 5: Run green and commit**

```powershell
node --test scripts/academy-voice-sync.test.mjs
git add academy-voice-sync.js academy-experience-host.js scripts/academy-voice-sync.test.mjs
git commit -m "feat: synchronize Academy voice targets"
```

---

### Task 5: Build captions, Replay and Voice settings UI

**Files:**

- Create: `academy-voice-ui.js`
- Create: `academy-voice.css`
- Create: `scripts/academy-voice-ui.test.mjs`
- Create: `scripts/academy-voice-browser.test.mjs`
- Modify: `academy-experience-host.js`
- Modify: `academy.html`
- Modify: `package.json`

**Step 1: Write failing view-model/markup tests**

Cover all controller states:

- no cue/no strip;
- voice playing;
- voice interrupted with caption retained;
- captions-only;
- off;
- missing asset;
- preference unset;
- replay available;
- replay disabled with explicit reason;
- recovery offer;
- screen-reader suppression.

Assert visible labels, not only icon/state classes.

**Step 2: Write failing browser laws**

At 430×932 and 375×812, normal/reduced motion and 100%/200% text:

- header control is at least 44×44 and names the current mode;
- first-use choice has `Voice + captions`, `Captions only`, `Off` and no
  preselected choice;
- preference sheet uses radio semantics and returns focus to opener;
- caption strip follows surface heading in DOM order;
- caption never covers primary truth, active control or sticky nav;
- Replay and Close meet 44×44;
- Replay works by keyboard;
- no horizontal overflow or clipped label;
- caption is not `aria-live="assertive"`;
- automatic screen-reader-suppressed state produces no competing live speech;
- mode change to Off visibly and audibly stops one fake cue;
- model controls remain operable while fake audio is playing.

**Step 3: Confirm red**

```powershell
node --test scripts/academy-voice-ui.test.mjs scripts/academy-voice-browser.test.mjs
```

Expected: missing UI modules/markup.

**Step 4: Implement semantic UI**

Export:

```js
export function buildVoiceUiViewModel(controllerState) {}
export function mountAcademyVoiceUi({
  root,
  controller,
  openSheet,
  closeSheet,
  returnFocus
}) {}
```

Stable regions:

```html
<button type="button" data-academy-voice-settings>Voice on</button>
<section data-academy-voice-caption aria-live="off" hidden>
  <p data-academy-voice-text></p>
  <button type="button" data-academy-voice-replay>Replay</button>
  <button type="button" data-academy-voice-close>Close caption</button>
</section>
```

Use the existing one-level native sheet primitive for preferences. Do not add
a nested modal or new navigation route.

**Step 5: Implement restrained styling**

- no gradient, glow or shadow;
- violet/structural outline only;
- Ember remains reserved for current live truth/primary action;
- cue strip height is content-driven but cannot cover the instrument;
- at 200% text the strip may grow and the host may allocate scroll, while the
  primary truth/control/action remain reachable;
- reduced motion uses static target outline.

**Step 6: Run focused tests and commit**

```powershell
node --test scripts/academy-voice-ui.test.mjs scripts/academy-voice-browser.test.mjs
git add academy-voice-ui.js academy-voice.css academy-experience-host.js academy.html scripts/academy-voice-ui.test.mjs scripts/academy-voice-browser.test.mjs package.json
git commit -m "feat: add Academy captions and voice controls"
```

---

### Task 6: Integrate Home consent and recommendation cues

**Files:**

- Create: `academy-voice-reference-cues.js`
- Create: `scripts/academy-voice-reference-cues.test.mjs`
- Modify: `academy-home.js`
- Modify: `academy.html`
- Modify: `scripts/academy-home-view-model.test.mjs`

**Step 1: Write failing Home cue tests**

Encode exactly three Home signatures from the Home/store design:

1. first-use orientation;
2. finite recommendation cue;
3. first return after newly saved mastery.

Test:

- orientation uses explicit preference choice before delivery;
- every approved cue is 12–24 words;
- recommendation uses the invariant approved cue and never speaks a dynamic
  title/reason;
- exact recommendation title/reason remain visible on the coach card;
- recommendation reason derives from stored evidence only;
- identical Home recommendation remains silent on revisit;
- newly changed evidence reason has its own cue ID/signature;
- mastery return fires after successful save only;
- goal browsing alone does not narrate every card;
- Home cues cannot change selected goal/recommendation/progress.

**Step 2: Confirm red**

```powershell
node --test scripts/academy-voice-reference-cues.test.mjs
```

Expected: cue module absent.

**Step 3: Define and validate the Home set**

Use `defineAcademyCueSet` from Task 1. Store only approved complete sentences.
Do not record a template containing `<title>` or an evidence-reason slot for
runtime audio.

The first-use visible choice must appear before calling
`deliverAutomatic`. Choosing `voice` calls it once for the already-mounted Home
surface; choosing `captions` publishes caption-only; choosing `off` closes the
choice and remains silent.

**Step 4: Register Home semantic targets**

At minimum:

- `home-goal-chooser`;
- `home-primary-action`;
- `home-mastery-evidence`.

Target emphasis cannot change recommendation selection or focus.

**Step 5: Run Home/voice suites and commit**

```powershell
node --test scripts/academy-voice-reference-cues.test.mjs scripts/academy-home-view-model.test.mjs scripts/academy-voice-browser.test.mjs
git add academy-voice-reference-cues.js academy-home.js academy.html scripts/academy-voice-reference-cues.test.mjs scripts/academy-home-view-model.test.mjs
git commit -m "feat: guide new Academy Home evidence"
```

---

### Task 7: Adapt accepted Backspin to the shared voice host

**Files:**

- Modify: `academy-voice-reference-cues.js`
- Modify: `academy-native-lesson.js`
- Modify: `academy-native-lesson.css`
- Modify: `scripts/academy-backspin-browser.test.mjs`
- Modify: `scripts/academy-voice-reference-cues.test.mjs`

**Step 1: Write failing Backspin integration tests**

Use the eight Backspin amendment cues exactly. Assert:

- all eight pass manifest validation;
- no accepted cue text/truth changes during host integration;
- stable cue IDs and semantic targets exist;
- first unseen S0/S1 entry delivers once after Voice consent;
- backward navigation/reload does not redeliver unchanged cue;
- active slider input stops narration but updates engine immediately;
- S1 build/cut consequences fire once at actual mission milestone, not on
  threshold scrubbing;
- S3 boundary target highlights only the model boundary link;
- S4 cue does not claim Backspin caused Landing Angle;
- mastered legacy user is not relocked and review is silent by default;
- Replay cannot change mission/mastery/reward state;
- missing asset leaves full Backspin journey usable;
- accepted normal/reduced motion and keyboard behavior remain equivalent.

**Step 2: Confirm red**

```powershell
node --test scripts/academy-voice-reference-cues.test.mjs
node --test --test-name-pattern="Backspin.*voice|voice.*Backspin" scripts/academy-backspin-browser.test.mjs
```

Expected: missing target/host integration.

**Step 3: Register targets without redesign**

Register only the targets named in the amendment:

- spin-loft chain;
- Ball Speed input/result;
- raw rpm/clamp evidence;
- cause hierarchy;
- model boundary link;
- dual mastery gate;
- Result evidence/next preview.

Do not add a new visualization, move accepted controls or change physics.

**Step 4: Mount through shared controller**

The host owns controller/UI. Backspin supplies:

- active semantic cue set;
- route/surface event;
- registered targets;
- first mission milestone events;
- cleanup.

Backspin may not instantiate its own `Audio` or store preference.

**Step 5: Run the complete accepted regression**

```powershell
npm run test:academy-voice
npm run test:academy
```

Expected: all previous Backspin tests plus new voice laws PASS.

**Step 6: Commit**

```powershell
git add academy-voice-reference-cues.js academy-native-lesson.js academy-native-lesson.css scripts/academy-backspin-browser.test.mjs scripts/academy-voice-reference-cues.test.mjs
git commit -m "feat: connect Backspin to Academy voice"
```

---

### Task 8: Validate and package the local reference voice pack

**Files:**

- Create: `scripts/verify-academy-voice-pack.mjs`
- Create: `scripts/academy-voice-pack.test.mjs`
- Create: `config/academy-voice-pack.json`
- Add reviewed assets under: `assets/audio/academy/control-room-en-us-v1/`
- Modify: `package.json`
- Generated mirror: `www/assets/audio/academy/control-room-en-us-v1/` through
  existing copy command only

**Step 1: Write failing asset-verifier tests**

Use temporary fixture directories and assert:

- every Voice-ready reference cue has one local `.m4a` record;
- normalized path cannot escape pack root;
- every file exists and is non-empty;
- declared duration is 3–8 seconds unless an explicit reviewed exception
  exists;
- leading/trailing silence/loudness review fields exist;
- SHA-256 matches bytes;
- cue text hash matches the manifest caption;
- unknown/duplicate/orphan asset records fail;
- remote URL/provider/runtime-generation field fails;
- pack/locale/rights metadata exists;
- copied root/`www/` asset bytes match.

**Step 2: Confirm red**

```powershell
node --test scripts/academy-voice-pack.test.mjs
```

Expected: verifier/config absent.

**Step 3: Implement verifier and report**

CLI:

```powershell
node scripts/verify-academy-voice-pack.mjs --mode development
node scripts/verify-academy-voice-pack.mjs --mode release
```

`development` permits a cue to be caption-only and reports it. `release`
requires every Home/Backspin Voice-ready cue file and verified metadata.

Output JSON contains:

```js
{
  packId,
  locale,
  cueCount,
  assetCount,
  captionOnly,
  missing,
  orphaned,
  hashMismatches,
  durationOutliers,
  rightsStatus,
  pass
}
```

Do not calculate a UX score from this report.

**Step 4: Produce the one-time voice identity sample gate**

Record/licence at least one `orient`, one `cue` and one `consequence` sample.
Normalize them to the design contract. Run the provenance-blind clarity/trust/
fatigue comparison and record:

- anonymous inputs;
- listener instructions;
- result;
- selected pack direction;
- actor/provider rights and reuse scope;
- pronunciation notes.

This is one identity gate for the pack, not approval per module.

**Step 5: Add final Home/Backspin assets**

Use final approved takes only. Do not commit provider project files, raw takes,
credentials or contracts containing secrets. Commit final distributable assets
and a rights-status record permitted for the repository.

**Step 6: Add package command and verify copy parity**

```json
"voice:verify": "node scripts/verify-academy-voice-pack.mjs --mode release"
```

Run:

```powershell
npm run voice:verify
npm run copy-web
npm run voice:verify
```

Expected: strict PASS and root/`www/` parity.

**Step 7: Commit**

```powershell
git add scripts/verify-academy-voice-pack.mjs scripts/academy-voice-pack.test.mjs config/academy-voice-pack.json assets/audio/academy/control-room-en-us-v1 package.json
git commit -m "feat: package Academy Control Room voice"
```

If final licensed assets are unavailable, stop only the Voice-ready asset gate.
The caption/controller implementation may remain a truthful WIP checkpoint and
must not be called production Voice-ready.

---

### Task 9: Harden native lifecycle and accessibility behavior

**Files:**

- Modify: `academy-voice.js`
- Modify: `academy-voice-ui.js`
- Modify: `academy-experience-host.js`
- Modify: `scripts/academy-voice-browser.test.mjs`
- Modify: `scripts/academy-backspin-browser.test.mjs`
- Modify if the existing host exposes a native bridge: its current
  accessibility adapter; do not invent an unavailable platform path

**Step 1: Add failing lifecycle tests**

Cover:

- `visibilitychange`, `pagehide` and host teardown stop audio/beat timers;
- visibility return never resumes;
- audio interruption/error clears playing state and retains caption;
- known screen-reader `true` stops automatic audio;
- screen-reader `unknown` remains explicit in diagnostics;
- user-triggered Replay is available after deliberate Voice selection;
- changing OS/browser reduced-motion during a cue resolves static emphasis;
- Bluetooth/audio route interruption cannot create a second instance;
- Voice mode survives reload;
- corrupt audio cannot block navigation;
- no microphone/media-capture permission requested;
- no `speechSynthesis`, `fetch`, XHR, WebSocket or remote media URL used by
  Academy voice.

**Step 2: Add accessibility completion trace**

Keyboard/switch path:

```text
Academy Home
→ open Voice settings
→ choose Captions only
→ close/return focus
→ enter Backspin
→ show cue
→ Replay/Show cue
→ change to Off
→ continue lesson to next surface
```

Screen-reader semantic trace confirms:

- current mode announced once;
- caption text available without assertive duplicate;
- primary model/control/truth follows heading;
- cue emphasis never steals focus;
- no essential instruction exists only in caption.

**Step 3: Implement the minimum host adapters**

Use injected listeners/signals. If native screen-reader detection is not
available in this source tree, preserve tri-state `unknown` and the explicit
consent rule. Do not fake detection with focus or reduced-motion heuristics.

**Step 4: Run focused Chrome and WebKit suites**

```powershell
npm run test:academy-voice
node --test scripts/academy-voice-browser.test.mjs
$env:FG_ENGINE='webkit'; node --test scripts/academy-voice-browser.test.mjs
Remove-Item Env:FG_ENGINE
```

Expected: PASS on both engines.

**Step 5: Commit**

```powershell
git add academy-voice.js academy-voice-ui.js academy-experience-host.js scripts/academy-voice-browser.test.mjs scripts/academy-backspin-browser.test.mjs
git commit -m "test: harden Academy voice lifecycle"
```

---

### Task 10: Close the Voice System companion gate

**Files:**

- Modify: `docs/flightglass-autopilot/STATUS.md`
- Modify: `docs/SESSION-HANDOFF.md`
- Modify only for registered commands/assets: `package.json`
- Generated mirror: `www/` via existing copy command

**Step 1: Run all focused voice gates from a clean process**

```powershell
npm run test:academy-voice
npm run voice:verify
node --test scripts/academy-voice-browser.test.mjs
```

Record exact totals, not only PASS.

**Step 2: Run Academy and shared regressions**

```powershell
npm run copy-web
npm run brand:verify
npm run test:academy
npm run test:ux
npm run test:webkit
npm run test:perf
npm run test:visreg
node scripts/verify-claude-autopilot.mjs
```

Expected: every applicable automated command exits 0.

**Step 3: Verify protected files and package parity**

Compare current hashes with the pre-Task-1 baseline for:

- `impact-flight.js`;
- `swing-parameters-and-impact.js`;
- `diagnose-engine.js`;
- `diagnose-engine-v2.js`.

Expected: byte-identical.

Compare every created/modified shipping module/CSS/audio asset with its `www/`
copy. Expected: byte-identical.

**Step 4: Capture and inspect native visual states**

At 430×932 and 375×812, normal/reduced motion and 100%/200% text:

- first-use choice;
- Voice-playing caption strip;
- Captions only;
- Voice Off;
- missing audio;
- recovery offer;
- Backspin S1 synchronized Face/Spin-Loft/Ball-Speed target;
- settings sheet/focus return.

Inspect screenshots, not only DOM metrics.

**Step 5: Run device/human gates**

Physical native checks:

- offline launch and first consent;
- speaker, wired/Bluetooth audio routing where supported;
- background/foreground;
- system interruption;
- VoiceOver/TalkBack double-speech check;
- Voice Off persistence after force-close;
- low-volume intelligibility;
- five-minute fatigue listen across at least six cues.

If these require owner devices, record `PENDING OWNER DEVICE/HUMAN GATE` and do
not call release acceptance complete.

**Step 6: Run the one-time identity and UI evidence gates**

- voice identity sample wins the clarity/trust/low-fatigue comparison;
- cue strip/settings/visual synchronization win pairwise-blind against a
  caption-only generic implementation;
- zero critical defects;
- every voice category floor passes independently: truth, interruption,
  repetition, accessibility, native lifecycle, mobile fit and offline assets.

Derived score, if recorded, remains a byproduct.

**Step 7: Update ledgers**

STATUS/HANDOFF must contain:

- commit range;
- exact test totals and evidence paths;
- cue/asset counts;
- voice identity/rights status;
- repetition/interrupt evidence;
- viewport/screenshots;
- screen-reader/device gate state;
- protected hashes;
- explicit statement that Voice is shared infrastructure, not a completed new
  experience.

**Step 8: Secret scan, intended staging and commit**

```powershell
git diff --check
git status --short
git diff --name-only
git add -- docs/flightglass-autopilot/STATUS.md docs/SESSION-HANDOFF.md package.json www/academy.html www/academy-store.js www/academy-home.js www/academy-experience-host.js www/academy-native-lesson.js www/academy-native-lesson.css www/academy-voice-manifest.js www/academy-voice.js www/academy-voice-sync.js www/academy-voice-ui.js www/academy-voice.css www/academy-voice-reference-cues.js www/assets/audio/academy/control-room-en-us-v1
git diff --cached --check
git commit -m "docs: accept Academy voice system"
```

Never stage raw voice-provider projects, credentials, unrelated `outputs/`,
root chat briefs or `scripts/workflows/`.

**Step 9: Push the recoverable checkpoint**

```powershell
git push origin agent/travel-sync
```

**Companion-gate decision:**

- `accepted` only when controller/UI/content/audio critical gates and applicable
  device/human gates pass;
- `caption-ready / audio-gate-pending` when system behavior passes but final
  licensed Home/Backspin assets or identity evidence are missing;
- `executing` for ordinary test/asset repair;
- `escalated` only under the rollout index's explicit stop conditions.

After Voice System acceptance, resume the parent Home/store plan and finish
Batch 0. Start Line remains Batch 1 and may not begin before Batch 0 acceptance.

---

## 2. Later experience contract

Every later experience plan keeps its existing cue table and must add only:

1. a validated frozen cue set;
2. stable semantic target registrations;
3. local pack records/assets for those cue IDs;
4. focused delivery/sync/repetition tests;
5. strict pack verification and root/`www/` parity;
6. normal/reduced viewport evidence;
7. proof that missing audio does not alter mastery.

No experience creates a controller, preference sheet, caption component,
repetition ledger or new voice mode. If an experience needs that, the shared
Voice System plan must be amended first.
