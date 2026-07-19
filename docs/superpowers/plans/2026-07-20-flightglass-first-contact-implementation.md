# Flightglass First Contact — Night Optics Implementation Plan

**Date:** 2026-07-20

**Status:** Owner-approved 2026-07-20; execution in progress

**Normative design:** `docs/superpowers/specs/2026-07-20-flightglass-first-contact-design.md`

**Branch:** `agent/first-contact-night-optics`

## Goal

Ship a distinctive, premium first-use journey that moves from a native-safe Night Optics launch frame into one solver-backed First Flight and then into a specimen-based `Today's Experiment` Home. The feature must remain complete offline and without generated media, preserve the approved Ultraviolet Ember design system, and leave protected Impact physics untouched.

## Non-negotiable boundaries

- `sa-p3.css` remains the only design-token source. Feature CSS may consume tokens but must not redefine palette, typography, focus, radius, plate, or easing primitives.
- `impact-flight.js` is read-only. First Flight imports `solveFlight()` and `trajectorySamples()`; it never duplicates physics.
- Do not change `capacitor.config.ts` identifiers, RevenueCat identifiers, or any `strikearc.academy.*`, `sa.stat.*`, or `sa.home.last` schema.
- Do not commit generated `www/`, `ios/`, or `android/` directories.
- First Contact, First Flight, and Home must work with storage unavailable, media missing, audio rejected, Reduce Motion enabled, and no network.
- No account, permission, or paywall before the solver-derived result, Home reveal, and one free experiment.
- Generated Higgsfield media is optional atmosphere only. It ships only if it wins an explicit visual/audio keep-or-remove review and stays inside the byte/codec budgets.
- The older master-plan pause on image generation is honored for the canonical implementation: existing local assets and procedural SVG/CSS/Canvas are built first. The owner's later approval of this design authorizes only Task 9's optional, post-implementation Higgsfield comparison; it cannot block or define the product UI.
- The current Impact renderer/camera work is concurrent. A preload integration may be added only as a narrow, reviewed contract after reconciling with the latest Impact branch; no broad Impact edits are allowed.
- Exact native-device/performance completion cannot be claimed until `docs/qa/first-contact-device-matrix.json` contains observed device/build values and the physical-device rows are executed. Local implementation is not blocked by that release-evidence dependency.

## Execution protocol

Every task follows the same sequence:

1. Add the smallest focused test and run it to observe the intended failure (RED).
2. Implement the minimum complete behavior and rerun the focused test (GREEN).
3. Run the named adjacent regression tests.
4. Commit the task atomically.
5. Produce a diff package from the recorded task base to task head.
6. Have a fresh reviewer check design-spec compliance, accessibility, failure behavior, and code quality. Fix all Critical and Important findings before continuing.
7. Append the result, commands, commit, and review verdict to `.superpowers/sdd/progress.md`.

The full `npm test` suite is reserved for final integration because its clean baseline is approximately nine minutes. Focused suites run after each task.

## Architecture

```text
index.html (semantic entry / First Flight / Home)
  ├─ first-contact.css (scoped Ultraviolet Ember composition)
  ├─ first-contact-entry.js (browser bootstrap + DOM rendering)
  ├─ first-contact-state.js (guarded/versioned persistence + Home selection)
  ├─ first-contact-orchestrator.js (clock/lifecycle/motion/media/audio gates)
  ├─ first-flight-controller.js (read-only imports from impact-flight.js)
  ├─ first-contact-scene.js (procedural SVG/canvas presentation only)
  └─ first-contact-handoff.js (narrow simulated-shot route contract)
```

Decorative scene output is always `aria-hidden`. All instructions, measurements, state, and actions remain semantic HTML.

## Task 1 — Guarded state and deterministic Home selection

**Files**

- Create: `first-contact-state.js`
- Create: `scripts/first-contact-entry-state.test.mjs`

**RED**

Add tests proving:

- clean install enters First Contact;
- completed or skipped versions do not replay;
- mid-adjustment and result states resume from accepted semantic input;
- corrupt JSON, denied storage, and throwing storage remain session-functional;
- `fg.entry.*`, `fg.firstFlight.*`, `fg.learning.focus`, and `fg.home.currentExperiment` are versioned and guarded;
- legacy Academy and `sa.*` state is read only as fallback and never rewritten;
- data older than 30 days yields a new Fundamentals question rather than stale numbers;
- mid-experiment resume is exact only inside 24 hours; an older interrupted session resolves safely to the appropriate settled entry/Home state;
- process death mid-overture resolves to First Flight ready, while result reached with no focus opens Fundamentals Home;
- signed-in return never replays First Flight and clearing all local state never blocks a core route;
- a fresh personal experiment replaces the simulated Home specimen without losing its original provenance record;
- a focus selection changes Home track, hero question, next experiment, and Range-emphasis contract together; clearing it returns all three to Fundamentals. Task 7 must prove that every downstream destination consumes this contract, otherwise `Change focus` is removed before acceptance.

Run and observe failure:

```powershell
node --test scripts/first-contact-entry-state.test.mjs
```

**GREEN**

Implement a pure state layer with injected `{ storage, now }`, an in-memory fallback, schema/version guards, state migrations limited to `fg.*`, and deterministic selectors for entry and Home. Persist after the semantic boundaries named in the design spec.

Verify:

```powershell
node --test scripts/first-contact-entry-state.test.mjs
node --test scripts/academy-store.test.mjs scripts/academy-home-view-model.test.mjs
```

**Commit:** `feat: add resilient first-contact state model`

## Task 2 — One lifecycle, motion, audio, and optional-media orchestrator

**Files**

- Create: `first-contact-orchestrator.js`
- Create: `scripts/first-contact-orchestrator.test.mjs`

**RED**

With injected clock, RAF, renderer, pointer capture, storage, media, audio, motion preference, and lifecycle adapters, prove:

- overture stages occur at the specified deterministic boundaries, controls are ready by 1.3 seconds, and the scene hard-settles by 1.5 seconds;
- any second input invokes the same idempotent settle path in under 100 ms;
- `visibilitychange`, `pagehide`, route exit, Capacitor `App.appStateChange(false)`, process recovery, and live Reduce Motion changes all reach the same settled semantic state;
- settle cancels timers/RAF, releases pointer capture, persists accepted stage/input, pauses media/audio, and never replays on foreground resume;
- Reduce Motion starts at the final information-equivalent state;
- optional media mounts only after semantic UI is interactive and an idle opportunity exists, swaps only after decode, and fails safely for missing, corrupt, delayed, rejected, or offline assets;
- no audio create/resume/play call can occur unless both persisted preference and a qualifying gesture in the current foreground session are true;
- foreground resume never auto-unlocks audio or restarts media.

Run and observe failure:

```powershell
node --test scripts/first-contact-orchestrator.test.mjs
```

**GREEN**

Implement one state machine and one `settle(reason)` path. Keep current-session gesture authorization in memory only. Expose browser and Capacitor adapters through dependency injection; do not import native APIs in the pure controller.

Verify:

```powershell
node --test scripts/first-contact-orchestrator.test.mjs scripts/sa-orientation.test.mjs
```

**Commit:** `feat: orchestrate first-contact lifecycle safely`

## Task 3 — Solver-backed First Flight domain

**Files**

- Create: `first-flight-controller.js`
- Create: `scripts/first-flight-controller.test.mjs`
- Read only: `impact-flight.js`
- Read only: `impact-controls.js`
- Read only: `sa-haptics.js`

**RED**

Prove:

- the opening reference input is solved by the shipping `solveFlight()` and is visibly right of target;
- Face is the only active experiment input while Path, Attack, Dynamic Loft, and Speed remain fixed and disclosed;
- provisional and committed trajectory samples come from `trajectorySamples()`;
- every allowed Face value produces a hittable result, and `Hit it` is never answer-gated;
- result copy is side-aware at ground contact: right→right and left→left may use truthful `less/more right/left`; a target-line crossing uses neutral `shifted N m left/right`; unchanged values say so; `closer to target` is forbidden without the specified true two-dimensional target calculation;
- fixtures cover right→right, right→left, left→left, unchanged, improved, and worsened outcomes rather than assuming every Face adjustment stays on one side;
- partial improvement is quantified and two attempts expose, but do not force, `Show me`;
- before/after values use metric units, U+2212 minus, and stable formatting;
- the specimen always includes `Simulated 7-iron`, `SIMULATED REFERENCE`, centered-strike/no-wind assumptions, and fixed values;
- only existing haptic mappings are requested: band entry, Hit medium, landing medium, and optional first pure-straight success.

Run and observe failure:

```powershell
node --test scripts/first-flight-controller.test.mjs
```

**GREEN**

Build a pure First Flight controller around read-only physics imports. Keep conversion and copy in a presentation adapter inside the module; do not alter solver outputs or create a second trajectory formula.

Verify:

```powershell
node --test scripts/first-flight-controller.test.mjs
npm run test:engine
```

**Commit:** `feat: add solver-backed first flight`

## Task 4 — Semantic frame zero and Night Optics visual shell

**Files**

- Replace: `index.html`
- Create: `first-contact.css`
- Create: `first-contact-entry.js`
- Create: `first-contact-scene.js`
- Create: `scripts/first-contact-browser.test.mjs`
- Update: `scripts/home-night-ladder.test.mjs`
- Update: `config/flightglass-surfaces.json`

**RED**

Add the first browser fixture for clean install and a structural test replacing the obsolete Night Ladder assertions. Prove:

- `sa-p3.css` loads before feature CSS;
- the first meaningful frame is `#07060C` with real lockup, settled range, Face/Path optics, copy, sound preference control, visible skip, and a real button named `Begin First Flight`;
- decorative SVG/canvas is `aria-hidden` and semantic controls are outside it;
- no feature stylesheet redefines system tokens, fonts, focus rings, plate recipes, or raw parameter colors;
- the ball action and every interactive control are at least 44 × 44 CSS pixels;
- compact/wide portrait and supported landscape have no horizontal overflow or hidden primary action;
- enlarged-text and synthetic safe-area-inset fixtures keep the primary action, active control, and result visible without covering the trajectory;
- decorative canvas/SVG work caps device-pixel ratio and masks the scene beneath any unavoidable control plate;
- reduced-motion users receive the settled scene without information loss;
- no greeting, KPI grid, equal-weight destination cards, or permanent tab bar remains.

Run and observe failure:

```powershell
node --test scripts/home-night-ladder.test.mjs
node --test --test-concurrency=1 scripts/first-contact-browser.test.mjs
```

**GREEN**

Create the frame-zero HTML and scoped composition. Implement hard-edged etched optics and the procedural overture with system tokens only. Mount the orchestrator after semantic controls exist. Keep the range/poster decorative and noncritical.

Verify:

```powershell
node --test scripts/home-night-ladder.test.mjs
node --test --test-concurrency=1 scripts/first-contact-browser.test.mjs
```

**Commit:** `feat: build Night Optics first contact`

## Task 5 — Complete accessible First Flight interaction

**Files**

- Update: `index.html`
- Update: `first-contact.css`
- Update: `first-contact-entry.js`
- Update: `first-contact-scene.js`
- Update: `scripts/first-contact-browser.test.mjs`

**RED**

Extend browser fixtures for mid-adjustment, partial improvement, successful result, session recovery, and both Reduce Motion transitions. Prove:

- First Flight is ready when the overture settles, with no intermediate gate;
- Face supports drag/range input, visible tap steppers, keyboard arrows, and screen-reader adjustment;
- the violet dotted preview updates during manipulation and the solid ember result appears only on `Hit it` over a ghost baseline;
- an aria-live region announces only settled meaningful outcomes;
- the result copy matches the shipping solver result in the DOM and text alternative;
- `See my Home` is the sole primary action after the quantified win;
- `Explore on my own` remains accessible and preserves the shown simulated input without marking the guided experience complete;
- storage/process recovery restores the last accepted value and settled camera state;
- there is no account, permission, paywall, fabricated XP, or claim of real swing improvement.

Run RED, implement, then verify:

```powershell
node --test scripts/first-flight-controller.test.mjs
node --test --test-concurrency=1 scripts/first-contact-browser.test.mjs
```

**Commit:** `feat: complete accessible first flight journey`

## Task 6 — Specimen-based Home and Instrument Index

**Files**

- Update: `index.html`
- Update: `first-contact.css`
- Update: `first-contact-entry.js`
- Update: `first-contact-scene.js`
- Update: `scripts/first-contact-entry-state.test.mjs`
- Update: `scripts/first-contact-browser.test.mjs`
- Update: `scripts/home-night-ladder.test.mjs`
- Update: `config/flightglass-surfaces.json`

**RED**

Add fixtures for First Flight completion, skip, fresh return, stale return, unavailable storage, counterfactual, and each focus choice. Prove:

- Home renders one track, one question, one large trajectory specimen, one metric, one causal observation, one `Continue the experiment` action, and one labelled Instrument Index control;
- simulated provenance stays visible and accessible when the specimen reaches Home;
- the optional Face/Path counterfactual runs the same model without right/wrong punishment or navigation lock;
- `Change focus` updates hero, recommendation, and the persisted downstream emphasis contract atomically; it remains provisional until Task 7 proves each real consumer;
- the Instrument Index has stable causal order and real links for Model, Flight, Compare, and Academy;
- the tray is solid, one level deep, background-inert, focus-trapped while open, and closed through one idempotent path for visible Close, swipe, Escape, Android Back, route exit, or backgrounding;
- focus returns to the trigger, and reduced motion reveals instantly;
- skippers see `Try First Flight · about 45 sec` in the Index while retaining a fully useful Fundamentals Home;
- the landing-screen `Explore on my own` route records the skip and opens that useful Fundamentals Home with the simulated specimen; it does not open Impact/Range;
- stale data becomes a new useful question rather than old metrics.
- Home includes the quiet session timestamp, every Instrument Index destination carries one restrained persisted-state line, and stable causal order never recency-sorts.

Run RED, implement, then verify:

```powershell
node --test scripts/first-contact-entry-state.test.mjs scripts/home-night-ladder.test.mjs
node --test --test-concurrency=1 scripts/first-contact-browser.test.mjs
```

**Commit:** `feat: replace dashboard home with today's experiment`

## Task 7 — Downstream experiment handoff, focus consumption, and one free experiment

**Precondition:** Resolve and record the exact reviewed commit at the head of PR #2 / `origin/agent/impact-portrait` before touching an Impact consumer. Reconcile this branch to that named commit and inspect its actual initialization contract. Stop the consumer integration if the narrow hook would overwrite or duplicate renderer/control changes; the producer/contract may still be completed, but Task 7 remains explicitly open and cannot be reported complete until the consumer proof passes.

**Files**

- Create: `first-contact-handoff.js`
- Create: `first-contact-focus.js`
- Create: `scripts/first-contact-handoff.test.mjs`
- Create: `scripts/first-contact-focus.test.mjs`
- Create: `docs/qa/first-contact-handoff-contract.md`
- Narrow update if conflict-free: `impact.html` and/or the smallest current Impact bootstrap module
- Update: `scripts/first-contact-browser.test.mjs`
- Consume without changing their physics/content: `academy-router.js`, `academy-start-line-experience.js`, `academy-speed-transfer-experience.js`, `academy-flight-height-descent-experience.js`, `academy-delivered-loft-launch-experience.js`, `academy-shape-experience.js`

**RED**

Prove the **First Flight** `Explore on my own` route:

- open the full Impact/Range instrument;
- preload the exact solver input shown in First Flight;
- preserve a visible and accessible `SIMULATED REFERENCE` baseline;
- do not mark guided First Flight complete;
- allow returning to the exact accepted guided state;
- fall back safely to normal Impact defaults for missing, corrupt, expired, or unrelated handoff data.

Separately prove the Home continuation for Fundamentals and all five focus choices:

- the selected Home track resolves to the specified next experiment and actual continuation route;
- the destination consumes the persisted emphasis contract and exposes the intended active/default input, rather than merely changing Home copy;
- the user can make one real input change, see the model/result update, and persist the result;
- no account, OS permission, or paywall appears before that free experiment completes;
- default Fundamentals remains useful when no focus is selected;
- if any destination cannot consume its emphasis truthfully, remove that focus choice rather than ship personalization theatre.

The executable mapping is:

| Focus choice | Continue route and consumer | First truthful interactive defaults | Range emphasis after Impact consumer lands | Focused regression |
|---|---|---|---|---|
| Straighten ball flight | `./academy.html#/experience/start-line/surface/0` → `academy-start-line-experience.js` | Lab: Face `0°`, Path `−2°`, Dynamic Loft `30°`; Face/Path controls | Top · Face | `academy-start-line-model.test.mjs` + `academy-start-line-browser.test.mjs` |
| Add carry | `./academy.html#/experience/speed-transfer/surface/0` → `academy-speed-transfer-experience.js` | Transfer: Club Speed `90 mph`, Spin Loft `33°`; visible Ball Speed | Flight · Speed | `academy-speed-transfer-model.test.mjs` + `academy-speed-transfer-browser.test.mjs` |
| Control height | `./academy.html#/experience/flight-height-descent/surface/0` → `academy-flight-height-descent-experience.js` | Transfer: Dynamic Loft `30°`, Attack `−3°`, Speed `90 mph`; Apex/Landing outputs | Side · Dynamic Loft | `academy-flight-height-descent-model.test.mjs` + `academy-flight-height-descent-browser.test.mjs` |
| Read launch numbers | `./academy.html#/experience/delivered-loft-launch/surface/0` → `academy-delivered-loft-launch-experience.js` | Lab: Dynamic Loft `30°`, Attack `−4°`; Launch/Spin Loft/Backspin outputs | Side · Attack | `academy-delivered-loft-launch-model.test.mjs` + `academy-delivered-loft-launch-browser.test.mjs` |
| Keep exploring | `./academy.html#/experience/shape/surface/0` → `academy-shape-experience.js` | Lab: Face `1°`, Path `1°`, Speed `90 mph`; Face/Path controls and Curve | Flight · Face | `academy-shape-model.test.mjs` + `academy-shape-browser.test.mjs` |

All Academy routes begin at surface 0 because the existing router has no safe query/preload contract and a fresh learner must not deep-link into a locked surface. Browser tests click the existing Mission action, make one real model change on surface 1, assert the visible solver/model result changed, and assert Academy persistence without an account/paywall. The Range-emphasis column is tested only after the named Impact consumer commit is integrated; until then it remains an open interface gate, not a claimed result.

Run every mapped consumer in Chromium and WebKit:

```powershell
node --test --test-concurrency=1 scripts/academy-start-line-model.test.mjs scripts/academy-start-line-browser.test.mjs scripts/academy-speed-transfer-model.test.mjs scripts/academy-speed-transfer-browser.test.mjs scripts/academy-flight-height-descent-model.test.mjs scripts/academy-flight-height-descent-browser.test.mjs scripts/academy-delivered-loft-launch-model.test.mjs scripts/academy-delivered-loft-launch-browser.test.mjs scripts/academy-shape-model.test.mjs scripts/academy-shape-browser.test.mjs
node scripts/academy-start-line-browser.test.mjs --project=webkit
node scripts/academy-speed-transfer-browser.test.mjs --project=webkit
node scripts/academy-flight-height-descent-browser.test.mjs --project=webkit
node scripts/academy-delivered-loft-launch-browser.test.mjs --project=webkit
node scripts/academy-shape-browser.test.mjs --project=webkit
```

Run and observe failure:

```powershell
node --test scripts/first-contact-handoff.test.mjs scripts/first-contact-focus.test.mjs
node --test --test-concurrency=1 scripts/first-contact-browser.test.mjs
```

**GREEN**

Implement a versioned, one-purpose `fg.handoff.impact` payload and a minimal consumer at the recorded Impact initialization commit. Implement the focus-to-experiment mapping through the smallest existing route/input API. Do not change physics, camera, layout, colors, or controls. The landing-screen skip remains owned by Task 6 and routes to Fundamentals Home, not Impact.

Verify:

```powershell
node --test scripts/first-contact-handoff.test.mjs scripts/first-contact-focus.test.mjs scripts/academy-router.test.mjs scripts/academy-recommendation.test.mjs scripts/academy-home-view-model.test.mjs scripts/impact-controls.test.mjs scripts/impact-outcome.test.mjs scripts/impact-camera.test.mjs
npm run test:engine
```

**Commit:** `feat: preserve first-flight specimen in range`

## Task 8 — Shipping assets, native launch contract, and package audit

**Files**

- Create: `config/first-contact-assets.json`
- Create: `scripts/first-contact-package.test.mjs`
- Create: `scripts/first-contact-native-launch.test.mjs`
- Create: `scripts/verify-first-contact-native-launch.mjs`
- Create: `scripts/verify-first-contact-media.mjs`
- Create: `docs/qa/first-contact-device-matrix.json`
- Create/update approved source artwork under: `resources/ios/` and `resources/android/`
- Update: `scripts/copy-web.mjs`
- Update: `scripts/build-flightglass-assets.mjs`
- Update: `scripts/verify-flightglass-brand.mjs`
- Narrow update: `capacitor.config.ts` — add only root `backgroundColor: '#07060C'`; preserve `appId`, `appName`, `webDir`, schemes, and all other protected/native identifiers
- Update: `codemagic.yaml`
- Update: `.github/workflows/android-debug.yml`
- Update: `package.json`

**RED**

Prove:

- a route-wide shipping manifest/reachability inventory names every packaged asset, including every First Contact startup dependency, optional media group, poster, and audio dependency;
- package-copy output contains every referenced asset, no undeclared file under `www/assets`, and no missing route dependency;
- the manifest drives individual asset copies or an equivalent fail-closed reachability audit; the existing 55.9 MB wholesale `assets/` copy is not accepted as proof;
- final asset inventory, per-group bytes, total package bytes, and pre-change comparison are stored as reproducible evidence and fail on unexplained regression;
- optional media is local, lazy, and never startup-critical;
- iOS source/CI contract uses an explicit `resources/ios/` centered lockup, Android 12+ uses an explicit `resources/android/` mark-only safe-zone source, and both use `#07060C`;
- generated-native inspection fails a manual/plugin splash hold, wrong background, wrong platform art, missing asset, undeclared asset, or package budget overrun;
- `verify-first-contact-native-launch.mjs` is unit-tested against version-controlled synthetic iOS/Android fixtures locally and runs immediately after native asset generation in both CI workflows;
- the native verifier inspects the iOS WKWebView/window and Android activity/WebView window background that is visible before CSS/HTML paint, and rejects any non-`#07060C`/transparent-to-white bridge independently of the OS-owned splash artwork;
- the generated iOS and Android projects demonstrably consume `capacitor.config.ts` root `backgroundColor: '#07060C'`, while protected identifier tests prove `no.strikearc.app` and all existing store/product IDs are byte-unchanged;
- media validation treats zero optional video as valid. When a video group is declared, it rejects non-H.264/AVC, non-SDR/`yuv420p`, audio-bearing video, missing portrait/landscape variants, missing fast-start, per-orientation/total video budget excess, or poster/audio combined bytes above 500 KB;
- sonic media validation covers 250–500 ms duration, declared codec/channel/sample-rate/loudness bounds, and absence of orphan candidates;
- `docs/qa/first-contact-device-matrix.json` has explicit placeholders clearly marked unobserved and cannot be treated as physical-device evidence.

Run and observe failure:

```powershell
node --test scripts/first-contact-package.test.mjs scripts/first-contact-native-launch.test.mjs
npm run brand:verify
```

**GREEN**

Add separate launch-source recipes and post-generation checks. Replace recursive wholesale asset copying with manifest-driven/reachability-verified copying while preserving every asset required by existing routes. Add conditional optional-media groups, `test:first-contact`, and focused First Contact browser coverage in the Chromium/WebKit UX commands without duplicating expensive unit runs.

Verify:

```powershell
node --test scripts/first-contact-package.test.mjs scripts/first-contact-native-launch.test.mjs
npm run copy-web
node scripts/verify-first-contact-media.mjs --root www --manifest config/first-contact-assets.json
npm run brand:verify
```

Remove generated `www/`, `ios/`, and `android/` output from the working tree before commit.

**Commit:** `build: enforce first-contact launch and asset contracts`

## Task 9 — Canonical two-gated sonic mark and optional Higgsfield atmosphere

**Files**

- Create: `first-contact-audio.js`
- Create: `scripts/first-contact-audio.test.mjs`
- Update: `first-contact-orchestrator.js`
- Update: `first-contact-entry.js`
- Update: `scripts/first-contact-orchestrator.test.mjs`
- Update: `scripts/first-contact-browser.test.mjs`
- Candidate outputs outside the shipping manifest until accepted
- If accepted: optimized files under `assets/first-contact/`
- Update only if a generated candidate is accepted: `config/first-contact-assets.json` and the candidate-specific focused tests
- Create: `docs/qa/first-contact-media-decision.md`

**Canonical sound requirement**

The visible sound toggle always controls a compliant local sonic mark; it must never become a no-op. Implement a tiny procedural Web Audio mark first (dry etched-glass transient, grounded impact body, short aperture release) so the app is complete without a generated asset. Tests must prove `AudioContext` creation/resume happens synchronously inside the qualifying gesture, foreground backgrounding clears current-session gesture authorization, and locked/suspended/rejected contexts stay silent without breaking interaction. A Seed Audio candidate may replace the procedural timbre only if it wins the gate below.

Write `scripts/first-contact-audio.test.mjs` first and observe it fail for the absent two-gated controller, gesture-synchronous unlock, 250–500 ms envelope, background reset, and rejection paths. Implement the smallest procedural mark, then make the audio, orchestrator, and browser tests green before any paid/generated candidate is requested.

**Preflight**

1. Read the Higgsfield prompt-engineering reference.
2. Run `higgsfield account status`.
3. Run an unfiltered `higgsfield model list` and record the chosen available model IDs.
4. Use the current approved real range image as visual reference.

**Generate/evaluate**

- Generate portrait and landscape Seedance candidates for atmosphere only: subtle haze, range-light activation, and tiny parallax. Exclude logo, text, ball, trajectory, grids, targets, optics, people, clubs, and numbers.
- Generate Seed Audio candidates for a 250–500 ms dry quartz/etched-glass transient, grounded golf-impact body, and short mechanical aperture release. Exclude boom, riser, voice, and melody.
- Normalize/trim outside the app, transcode video to the exact delivery contract, and inspect with `ffprobe` plus the repository verifier.
- Compare the procedural-only experience against each candidate at compact portrait, wide portrait, landscape, Reduce Motion, muted, offline, and slow-decoding states.

**Keep/remove gate**

Randomize opaque candidate labels and use fresh reviewers who see only evaluated artifacts and the relevant evidence manifest. Record candidate checksums, exact prompts/model IDs, votes, and comparison artifacts. Keep a candidate only if it wins at least two-thirds of valid blinded votes, introduces no brand/physics drift, and meets all budgets. Otherwise document `REMOVE` and ship the procedural scene/sonic mark. Candidates remain outside the shipping manifest until the signed decision record exists. Playback remains optional and two-gated even when the asset is retained.

**RED/GREEN if a candidate is kept**

Extend orchestrator, browser, and package tests before wiring it into the manifest. Observe the missing-asset/codec/gate failure, then make it pass.

Verify:

```powershell
node --test scripts/first-contact-audio.test.mjs scripts/first-contact-orchestrator.test.mjs scripts/first-contact-package.test.mjs
node --test --test-concurrency=1 scripts/first-contact-browser.test.mjs
node scripts/verify-first-contact-media.mjs --root . --manifest config/first-contact-assets.json
```

**Commits:** Always commit the procedural mark and its gates as `feat: add two-gated first-contact sonic mark`. If generated media is kept, commit it separately as `feat: add reviewed first-contact atmosphere`; if rejected, record the reproducible decision as `docs: reject optional first-contact media`.

## Task 10 — Cross-browser, accessibility, visual, performance, and release evidence

**Files**

- Update: `scripts/first-contact-browser.test.mjs`
- Update: `scripts/flightglass-perf.test.mjs`
- Create: `first-contact-milestones.js`
- Create: `scripts/first-contact-milestones.test.mjs`
- Update: `config/flightglass-surfaces.json`
- Update: `scripts/lib/flightglass-visreg.mjs` or add a dedicated First Contact visual-regression helper
- Update: `scripts/flightglass-visreg.test.mjs`, `scripts/flightglass-visreg-approve.mjs`, and baseline inventory only after independent review
- Create/update: `docs/qa/first-contact-verification.md`
- Update only with real observations: `docs/qa/first-contact-device-matrix.json`

**Automated matrix**

Complete all 18 normative fixtures in the design spec, including unavailable storage, offline mode, live Reduce Motion transition, all audio-context failures, all media failures, native-style background/process recovery, both Explore routes, compact/wide portrait, and supported landscape.

Add a privacy-safe milestone adapter with deterministic unit tests and named `performance.mark`/event hooks for WebView frame zero, controls ready, first causal change, overture settled, result seen, Home reveal, and next-experiment input. The immutable pre-change source commit is `02aad61382e6c31c103867ea993ce8f650758881`; record its build evidence before measuring the candidate. Test returning cold-start 250–400 ms separately from the first-install overture and accepted input→visible response under 100 ms. Behavioral cohorts and physical-device p50/p90 remain `UNOBSERVED` until real evidence exists.

For every browser fixture assert:

- zero serious/critical axe violations, console errors, horizontal overflow, focus leaks, and sub-44px controls;
- design-token provenance and ember-budget compliance;
- solver-derived output/provenance accuracy;
- no early account/permission/paywall gate;
- deterministic timing and lifecycle settlement;
- complete keyboard/screen-reader alternatives and reduced-motion information parity.
- 130%/200% text zoom, compact safe-area insets, scene masking, and decorative-renderer DPR cap.

Run focused verification:

```powershell
npm run test:first-contact
node scripts/first-contact-browser.test.mjs --project=webkit
npm run test:home
npm run test:engine
npm run test:academy-foundation
npm run test:perf
npm run test:visreg
npm run brand:verify
```

Then run the full clean regression:

```powershell
npm test
```

Record command, exit code, duration, browser, and any environment-only limitations in `docs/qa/first-contact-verification.md`. Do not write `PASS` for native safe zones, launch p90, warm resume, silent switch/DND, Bluetooth, interruption, or physical accessibility/performance rows until the exact observed device matrix is populated and those tests are performed.

Capture final screenshots at 390×844, 430×932, and a supported landscape viewport for:

1. settled First Contact;
2. First Flight miss;
3. mid-adjustment preview;
4. partial result;
5. successful quantified result;
6. Today's Experiment Home;
7. counterfactual;
8. Instrument Index;
9. reduced-motion equivalents.

**Commit:** `test: record automated Night Optics verification`

## Final branch review and publish

1. Generate one whole-branch diff from the implementation-plan commit to `HEAD`.
2. Assign a fresh reviewer to audit the normative design, protected-code boundary, physics provenance, state compatibility, accessibility, optional-media decision, package size, and verification evidence.
3. Fix every Critical and Important finding and repeat the affected focused and full tests.
4. Confirm `git status --short` contains no generated output, secrets, candidate media, or unrelated user changes.
5. Push `agent/first-contact-night-optics` to `origin` after each reviewed milestone so the work remains available on the user's laptop.
6. Create or update the pull request with screenshots, test evidence, known device-only gates, and explicit keep/remove decisions for optional video and sound.

## Completion definition

Coding is complete when Tasks 1–10 are reviewed, the focused and full automated suites are green, the branch is pushed, and the pull request contains reproducible evidence. Release validation remains explicitly open—not silently treated as a code blocker—until the physical device matrix and observed native/performance rows are supplied **and** the clean-install/comprehension cohorts reach the specified sample sizes with published confidence intervals and an instrumented pre-change comparison. Unobserved behavioral thresholds are never inferred from automated tests.
