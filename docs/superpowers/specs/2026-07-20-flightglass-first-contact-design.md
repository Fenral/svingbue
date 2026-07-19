# Flightglass First Contact — Night Optics

**Date:** 2026-07-20

**Status:** Owner-approved 2026-07-20; implementation authorized

**Scope:** Native launch handoff, first-run onboarding, and production Home

**Visual system:** Existing Ultraviolet Ember design system, unchanged

## 1. Decision

Flightglass will open as a **night-range optical instrument**, not as a marketing splash, a module grid, or a sports dashboard.

The signature is **Night Optics**:

- the real night range supplies golf scale and atmosphere;
- etched violet optical planes represent causes such as Face and Path;
- the ball and its trajectory are the living ember;
- aligning causes resolves a projected flight;
- the same visual grammar continues through landing, onboarding, Home, Academy, Compare, and marketing.

This is a new interaction concept inside the existing design system. It does not introduce a second palette, new color semantics, generic glass cards, or a competing typography system.

The product promise is:

> Make the invisible causes of ball flight feel graspable.

The operating rule for the whole first experience is:

> One ball. One trajectory. One question. One next experiment.

## 2. Why this direction

Current golf apps commonly lead with score, handicap, GPS maps, rounded KPI grids, dispersion plots, feeds, or permanent tab bars. Flightglass is not primarily a round tracker. Its defensible territory is a trajectory-native learning instrument that connects evidence, cause, and one next action.

Night Optics is preferred over the alternatives because:

1. It is specific to both the **Flightglass** name and the physics product.
2. Its signature interaction has meaning: Face and Path align to focus the flight.
3. It preserves the approved Ultraviolet Ember identity while giving it a more ownable spatial grammar.
4. It can scale from a two-second brand moment to a full Academy model without becoming decorative theatre.
5. Competitors can copy a dark range or a metric card. Copying the optical cause-to-flight interaction would visibly copy Flightglass.

## 3. Non-goals

This work will not:

- replace the ball-flight engine or change protected physics;
- make a second design system;
- add a feature carousel or questionnaire onboarding;
- ask for an account, OS permission, or payment before product value;
- claim that manipulating a simulation improved the user's real swing;
- autoplay audible launch sound;
- make Higgsfield-generated pixels responsible for exact UI, typography, trajectory, ball position, or measurements;
- turn Home into a greeting plus KPI cards;
- use a permanent four- or five-item bottom tab bar;
- hide core navigation behind a gesture-only interaction.

## 4. Design-system contract

`sa-p3.css` remains the code-level source of truth. If this document and the CSS disagree, implementation follows the CSS unless the owner explicitly approves a design-system amendment.

### 4.1 Color

| Role | Token | Night Optics use |
|---|---|---|
| App background | `--bg #07060C` | range night, native/WebView handoff |
| Raised surface | `--surface #110D1C` | instrument trays and non-scene sections |
| On-scene plate | `--plate rgba(8,5,14,.86)` | controls kept outside the live trajectory; the scene is masked beneath unavoidable overlap |
| Solid plate | `--plate-solid #0D0A18` | modal instrument index and accessibility fallbacks |
| Primary text | `--ink #F5F2FF` | instructions and primary labels |
| Muted text | `--muted #A79FC7` | supporting explanation |
| Ember | `--accent #FF8A4D` | live ball, live trajectory, and at most one primary live numeric result |
| Violet | `--secondary #9D8BFF` | optical construction, chrome, and provisional manipulation previews |
| Reference | `--ghost` | expected, baseline, previous, and reference trace strokes only |
| Face | `--q-face` | labelled Face-angle quantity only |
| Path | `--q-path` | labelled club-path-direction quantity only |

The primary action uses the existing cold ink/violet action treatment; it does not spend ember. At rest, the base law permits the live ball/tracer system and at most one live-data hero. The wordmark ball dot is a codified identity exception. The Home promotion prefix is permitted only on a Home state carrying no other resting heat.

Resting optical construction lines remain violet. When a line or plane becomes an explicitly labelled measurement of Face or Path, its active trace switches to `--q-face` or `--q-path`; feature CSS and renderers never consume the raw hue tokens. Provisional manipulation previews use `--secondary`; committed baselines and comparisons use `--ghost`; the committed live ball and flight use `--accent`.

### 4.2 Type

- **Inter 400/500/600:** instructions, controls, labels, buttons.
- **Space Grotesk 500/600/700:** the wordmark and hero numerals at least 28 px only.
- **IBM Plex Mono 400/500/600:** measurements only, with tabular numerals and U+2212 minus.

Headlines, instructions, labels, buttons, and tray navigation remain Inter. No new display family or type role is introduced for this scope.

### 4.3 Surfaces and interaction

- Optical planes are hard-edged, etched violet geometry. They are not blurred glass cards.
- Existing `.sa-plate`, `.sa-pinned-canvas`, `.sa-chip`, `.sa-controlsheet`, `.sa-scrim`, `.sa-detailcard`, and `.sa-focus` primitives are reused or explicitly extended before any new component styling is added.
- Existing 12 px control, 16 px card, 20 px lens, 999 px pill, line-alpha, and spacing laws apply.
- Approved `body.sa-depth` top light, grain, and tightly scoped value bloom supply material depth; this scope does not invent a second glow, shadow, or glass recipe.
- Controls do not cross the ember trajectory. If overlap is unavoidable at a compact size, the renderer masks the scene beneath the existing plate; a stronger local plate color is prohibited and would require an explicit `sa-p3.css` amendment.
- Minimum CSS hit target is 44 × 44 px, with safe-area padding preserved.
- Focus uses the existing double ink ring, never ember.
- Haptics use the existing `sa-haptics.js` event table and mark a physical event or detent, not decoration.
- Motion uses `--ease cubic-bezier(.2,.8,.2,1)` by default. `--ease-spring` is permitted only through its existing detail-card/promoted-chip primitives. Finger-driven motion tracks the pointer directly. No new easing curve is introduced.
- New local color hexes, standalone gradients, and parameter aliases are prohibited. Components consume `sa-p3.css` semantic tokens directly.
- All new UI also obeys the existing system laws for 4/8 spacing, 10 px type floor, `scale(.97)` pressed state, 40% disabled state, canonical labels and units, tabular numerals, U+2212 minus, `.sa-glyph` or inline SVG only, opaque scrolling chrome, copy voice, reward-color restrictions, and reference-trace semantics. Emoji, font dingbats, and platform-dependent glyphs are prohibited.

## 5. The complete journey

```text
Native launch frame
      ↓ visual match
Night Optics first contact
      ↓ touch ball / skip to Home
First Flight simulation
      ↓ quantified simulated result
Specimen-based Home: Today's Experiment
      ↓
Optional counterfactual, Change focus, two-minute experiment, Instrument Index, or sign-in
```

Returning users bypass First Flight and land directly on their current Home experiment.

## 6. Landing: Night Optics first contact

### 6.1 Native handoff

The OS owns the first launch frame. The app does not install or use a splash-screen plugin to hold that frame, and JavaScript never gates its release.

Platform contract:

- both platforms use the approved brand asset recipe on `#07060C`;
- iOS may use the approved centered Flightglass lockup;
- Android 12+ uses the Flightglass mark only, inside the system splash safe zone;
- neither platform includes a detailed range image, measurements, or non-brand copy;
- frame zero matches background and brand identity, not exact cross-platform scale or placement.

The WebView background must also be `#07060C` so a slow device cannot flash white between native and web content.

Because generated native projects may be refreshed in CI, release verification inspects the generated Android launch theme/assets and iOS storyboard/assets after every native generation step.

### 6.2 First-install state

The first web frame contains real HTML controls and the settled range background. A full-screen decorative canvas/SVG layer is `aria-hidden`; it never owns the action semantics.

Visible state:

- Flightglass lockup at the top;
- a dim real night range;
- one ball on an optical rail;
- two etched planes labelled `FACE` and `PATH`;
- copy: **Bring flight into focus.**
- primary interaction: **Touch the ball to begin**;
- visible **Explore on my own** route;
- visible sound toggle. A persisted preference may render it enabled, but it does not authorize playback until a qualifying gesture in the current foreground session.

The ball is a real button with the accessible name `Begin First Flight`.

`Explore on my own` records the skip and opens a fully playable Fundamentals Home. It preserves the simulated reference, labels it `SIMULATED REFERENCE`, and makes **Start direction versus curve** the first useful action. It never routes to a marketing, account, or empty state.

### 6.3 Triggered overture

Touching the ball starts one deterministic, procedural sequence:

| Time | Event |
|---:|---|
| 0–100 ms | aperture closes and releases; no decorative haptic |
| 80–420 ms | violet beam travels through the Face and Path planes |
| 320–900 ms | the focused segment becomes the ember ball and trajectory |
| 500–1100 ms | range depth and light resolve around the trajectory |
| 1000–1300 ms | the same scene morphs into First Flight with controls ready |

Hard requirements:

- hard removal/settle by 1.5 seconds after the touch;
- any second input settles the sequence in under 100 ms;
- no navigation is blocked after the scene settles;
- `prefers-reduced-motion` resolves directly to the final static state;
- `visibilitychange`, `pagehide`, or Capacitor `App.appStateChange(false)` settles rather than restarts;
- corrupt or missing optional media does not change the procedural result.

### 6.4 Returning launch

- Returning cold start: 250–400 ms mark-to-live-trajectory settle.
- Warm resume: no replay.
- Return to Home during the same session: no replay.
- New overture versions may replay once using a versioned state key.

The Home must be interactive at first meaningful paint; returning users never wait for the overture.

## 7. Media, sound, and Higgsfield

### 7.1 Canonical motion

Exact motion is procedural SVG/CSS/Canvas driven by the app. The canonical implementation must remain complete without video.

Higgsfield may provide an **optional ambient range-light plate**:

- use Seedance 2.0 with the existing range image as a reference;
- generate atmosphere only: light haze, subtle range-light activation, and tiny camera parallax;
- do not generate the logo, typography, ball, trajectory, optical planes, target grid, or numbers;
- composite exact UI and physics in code;
- keep video completely off the critical path: mount it only after semantic UI is interactive, first-run/reduced-motion checks pass, and an idle opportunity exists;
- swap it in only after a frame has decoded; catch `play()` rejection and otherwise retain the poster indefinitely;
- pause it on hide/background and do not auto-restart it on foreground resume.

Delivery budget:

- H.264 AVC MP4, SDR, `yuv420p`, 720p, 24/30 fps, fast-start;
- muted and `playsinline`;
- no embedded audio track;
- maximum 750 KB per orientation and 1.5 MB total;
- poster frame matches the procedural/native bridge;
- fully offline after packaging.

If the generated plate does not materially improve a blind visual comparison, it is removed.

### 7.2 Sonic identity

Cold launch remains silent.

Sound requires two independent gates:

1. the persisted sound preference is enabled;
2. a qualifying user gesture has occurred in the current foreground session.

The sound-toggle or ball-touch handler creates/resumes the `AudioContext` synchronously inside that gesture, catches any rejection, and remains silent on failure. Foreground resume never auto-resumes audio. Once both gates pass, the first eligible ball interaction may play a 250–500 ms sonic mark built from:

- a dry quartz/etched-glass transient;
- one grounded golf-impact body;
- a short mechanical aperture release;
- no cinematic boom, riser, voice, or musical logo.

Seed Audio 1.0 may generate source candidates. Final assets are edited, normalized, and independently controlled; sound is never baked into video.

Haptic and sound timing align, but either channel can be absent without losing meaning.

## 8. Onboarding: First Flight

### 8.1 Product principle

First Flight is not a series of onboarding screens. It is one continuous simulator scene.

Targets:

- first product interaction under 10 seconds;
- first accepted causal change under 20 seconds;
- first quantified result in 45–60 seconds;
- specimen-based Home in 70–90 seconds;
- mandatory hard cap of two minutes;
- an optional next experiment may extend the session by two to four minutes.

### 8.2 Beat 1 — Show the miss

The opening ball touch resolves directly into a labelled **Simulated 7-iron** with a visible miss to the right and the Face control ready. There is no intermediate **Fix this shot** gate.

The scenario is produced by the shipping `solveFlight()` engine in `impact-flight.js`, not by hard-coded trajectory art. A reference input may use:

```js
{
  club: '7iron',
  clubPath: -2.0,
  faceAngle: 3.2,
  attackAngle: -3.0,
  dynamicLoft: 30.0,
  clubSpeed: 100
}
```

The UI formats the actual engine result and unit conversion. Example copy must never become an assertion independent of the engine. A compact `REFERENCE MODEL` disclosure states that this is a centered-strike, no-wind model and lists the values held fixed for this experiment: Path, Attack, Dynamic Loft, and Speed.

Copy:

> This simulated 7-iron finished right of target.
>
> Make one change.

The Face control is already interactive. **Explore on my own** remains visible; it opens the full Impact/Range instrument preloaded with the shown simulated shot and preserves the baseline state. It does not mark the guided experience complete, block later return, or route through sign-in. Sign-in is not shown before the quantified result and Home reveal.

### 8.3 Beat 2 — Touch the physics

The camera remains stable. The Face control is the only active input.

Instruction:

> Move the face. Try to finish less right.
>
> The dotted flight updates while you move.

Visible values:

- Path, fixed for this experiment;
- Face, directly adjustable;
- Face to Path, derived live.

Behavior:

- the `--secondary` dotted provisional trajectory updates during manipulation;
- the solid ember flight appears only after **Hit it**;
- the button is never disabled because the user has not found a prescribed answer;
- partial improvement is quantified;
- after two attempts, **Show me** may demonstrate one useful movement and then return control;
- a light haptic marks entry into the experiment's useful Face-to-Path band.
- **Hit it** fires the system's medium play/HIT haptic; no decorative motion invents a new haptic mapping.

Drag is not mandatory. The same control supports tap steppers, keyboard arrows, and screen-reader adjustable actions.

### 8.4 Beat 3 — Honest first win

The new flight plays over the original `--ghost` reference trace.

The result uses actual before/after engine output, for example:

> **24 m less right**
>
> 28 m right → 5 m right

This number is the change in lateral offline at ground contact. If the product instead says **closer to target**, it must compute true two-dimensional distance to a visible target using the actual carry and lateral coordinates.

Then the causal explanation:

> For this centered-strike reference model, the face mostly set the start. Its gap from the path created the curve.

The product must say **Simulated 7-iron** and refer to `this model` or `this flight`. It must never say that the user fixed their slice or improved their swing. Anywhere this specimen travels—including Home—it retains a visible `SIMULATED REFERENCE` label, `--ghost` baseline treatment, and an accessible description that distinguishes it from personal shot data.

Reward treatment:

- medium landing haptic; success notification only for the first result in the system-defined pure-straight band;
- before/after traces;
- number transition;
- no confetti, badge storm, or fabricated XP.

### 8.5 Beat 4 — Reveal Home, then test the idea

First Flight does not put a five-choice taxonomy between the first win and Home. The result offers one primary action, **See my Home**, and reveals a Fundamentals Home built from the user's before/after simulated specimen.

The first Home experiment contains an optional, ten-second counterfactual:

> Which input mostly moved the start line?

Tapping **Face** or **Path** immediately runs a visual counterfactual using the same model. It does not use a red error state, award XP, or block navigation; it lets the user see the consequence and try the other input. Skipping it has no penalty. This interaction provides in-flow evidence of causal understanding without turning onboarding into a quiz.

An explicit **Change focus** action on Home offers:

| Choice | Home track | Next experiment |
|---|---|---|
| Straighten ball flight | Curve Control | Start direction versus curve |
| Add carry | Energy Transfer | Build the same ball speed two ways |
| Control height | Flight Windows | Dynamic loft and apex |
| Read launch numbers | Data Decoder | Delivered loft into launch |
| Keep exploring | Fundamentals | Why shots start and curve |

These labels resolve to existing, truthful Academy instruments: Start Line, Speed Transfer, Flight Height & Descent, Delivered Loft & Launch, and Shape respectively. The earlier phrases **Find the launch window** and **Read one shot in 20 seconds** are not shipped as if those consumers already exist; they require separate future instruments. Each continuation begins at the destination's honest Mission state, then lets the learner enter its existing interactive model. Focus may also set a narrow Range view/parameter emphasis only after the current Impact consumer implements and verifies that handoff contract.

Fundamentals is the default, so no choice is mandatory. A chosen focus must change all three of:

1. Home hero;
2. next recommended experiment;
3. First Flight/Range default emphasis.

If implementation cannot prove those changes, the question is removed rather than presented as personalization theatre.

### 8.6 What First Flight does not ask

Do not ask for handicap, age, experience level, handedness, clubs, practice frequency, notification preference, launch-monitor brand, or profile photo.

Those questions appear only inside the future action they materially affect.

## 9. Home: Today's Experiment

### 9.1 Home job

Home answers:

> What is the one useful thing I can understand or try now?

It is a briefing and an instrument at idle, not a catalog.

### 9.2 Information hierarchy

1. Flightglass lockup and quiet session timestamp.
2. Track label, for example `STRAIGHTER FLIGHTS · 1 OF 4`.
3. One question/headline: `Start direction versus curve.`
4. One large live trajectory artifact: `--ghost` for expected/reference traces and ember for the current committed live trace.
5. One quantified result or last-session delta.
6. One causal observation.
7. One action: **Continue the experiment**.
8. One quiet, explicit **Instrument Index** control.

No greeting, handicap hero, generic trend chart, feed, streak pressure, or equal-weight module cards appear above the fold.

### 9.3 Instrument Index

Home does not use a permanent tab bar. `Instrument Index` is a labelled 44 × 44 CSS-pixel control that opens a solid optical tray. The tray extends the existing sheet/dialog contract using system surface, radius, line, focus, `.sa-chrome`, and motion primitives; it is not a new local component system.

The tray presents stable destinations in causal order:

1. **Model** — Geometry and Strike Window;
2. **Flight** — Impact/Range and Visualise;
3. **Compare** — Ghosts and Outcome;
4. **Academy** — guided experiments and principles.

Each destination is a real link with one restrained persisted state line. The list never recency-sorts. The current/recommended destination may receive a violet optical reticle, not an ember-filled card.

The tray supports:

- tap/click;
- keyboard and screen-reader navigation;
- swipe-to-dismiss plus a visible close button;
- Android back and Escape dismissal;
- reduced-motion instant reveal;
- one-level depth only: while open, background content is `inert`, focus enters the heading or close control, remains within the tray, and returns to the trigger on close;
- a single idempotent close path shared by visible Close, swipe, Escape, Android Back, route transition, and app backgrounding.

### 9.4 First-run, returning, and empty states

- First Flight completer: the Home hero uses their simulated before/after specimen with persistent `SIMULATED REFERENCE` provenance.
- First Flight skipper: a quiet `Try First Flight · about 45 sec` row remains in the Instrument Index; Home defaults to Fundamentals.
- User choosing **Change focus**: Home hero, next experiment, and First Flight/Range emphasis update together; clearing the choice returns to Fundamentals.
- Returning user with valid data: their actual latest experiment replaces the simulated specimen.
- Data older than 30 days: Home asks a useful new question instead of displaying stale numbers.
- No storage: the experience works for the session and never blocks navigation.
- Signed-in return: account state never forces First Flight to replay.

## 10. Account, permissions, and paywall

No account, OS permission, or paywall appears before:

1. the first simulated flight;
2. the user's adjustment;
3. the quantified before/after result;
4. the specimen-based Home reveal;
5. one free two-minute experiment.

Permissions are requested only in context:

| User action | Primer | Denial fallback |
|---|---|---|
| Record a swing | Explain local video analysis and sharing boundary | manual parameter entry |
| Connect a launch monitor | Explain nearby-device discovery and selected-shot import | manual entry |
| Import/export media | Explain the exact file action | file picker or manual entry |
| Schedule practice | Ask for a specific chosen reminder | save without reminder |

Paywalls preserve the experiment behind the sheet, show localized trial/renewal terms, expose **Continue with Free**, and never erase the result the user just earned.

## 11. State and recovery

Suggested versioned state model:

```text
fg.entry.overtureVersion
fg.entry.soundEnabled
fg.firstFlight.version
fg.firstFlight.stage
fg.firstFlight.baselineInput
fg.firstFlight.activeInput
fg.firstFlight.attempts
fg.firstFlight.resultSeen
fg.learning.focus
fg.home.currentExperiment
```

`fg.entry.soundEnabled` is preference only. Current-foreground audio unlock is session memory and is never restored from storage. Camera position is deterministically derived from `stage` and the active model input; no fragile camera snapshot is persisted.

All persistence access is guarded. State is saved after:

- initial simulated shot;
- each accepted control adjustment;
- each hit attempt;
- result reveal;
- focus choice;
- Home experiment change.

Resume rules:

- return within 24 hours mid-experiment: resume the exact control state and deterministically reconstruct its settled camera state;
- result reached, no focus chosen: open Fundamentals Home; optional **Change focus** remains available without an inline modal;
- skipped onboarding: do not force it again;
- future onboarding versions use a separate version key;
- clearing local state never breaks core route access.

One idempotent `settle(reason)` path handles `visibilitychange`, `pagehide`, Capacitor `App.appStateChange(false)`, route exit, reduced-motion activation, and process recovery. It cancels timers and animation frames, releases pointer capture, pauses optional media and audio, closes transient focus traps, and persists semantic stage/input. Foreground resume renders that settled state without replay, media autoplay, or audio auto-resume. Process death mid-overture resolves to First Flight ready; process death mid-adjustment restores the last accepted input.

## 12. Accessibility and comfort

- The decorative optical/range renderer is `aria-hidden`; all values and actions exist in DOM.
- The ball-start action, slider, Hit, Continue, sound toggle, and Instrument Index have at least 44 × 44 CSS-pixel hit areas.
- One throttled polite live region announces meaningful settled outcomes, not every drag frame.
- Canvas/trajectory has a concise text alternative describing start, curve, carry, and offline result.
- Color never carries Face/Path meaning alone; labels and geometry remain visible.
- Dynamic Type may grow the control sheet without covering the target/result.
- Reduced Motion removes camera tracking, path draw-on, plane rotation, number count-up, and ambient video while preserving all information and interaction. The orchestration module reads and subscribes to `matchMedia('(prefers-reduced-motion: reduce)')`, calls the shared settle path if the preference changes mid-sequence, and rechecks it on foreground resume; CSS alone is not treated as sufficient for SVG/Canvas/media state.
- Any gesture has a tap/keyboard/screen-reader equivalent.
- No focus trap remains after a route transition or app background event.

## 13. Technical boundaries

The app remains static HTML/CSS/vanilla JS packaged by Capacitor.

Recommended separation:

- `index.html`: semantic Home and First Contact containers;
- a scoped first-contact stylesheet using `sa-p3.css` tokens only;
- a small entry/orchestration module responsible for versioned state, motion, and recovery, with injected clock, storage, media, audio, reduced-motion, and native-lifecycle adapters for deterministic tests;
- a First Flight controller that imports `solveFlight()` and `trajectorySamples()` from `impact-flight.js`;
- existing `sa-haptics.js` for enhancement-only haptics;
- optional local media under `assets/`, never a network dependency.

Physics output is never duplicated into a second onboarding formula. Presentation adapters convert units and copy; they do not alter the solve.

The existing `sa-firstrun.js` storage/focus helpers may be reused, but its stale carousel presentation is not the new onboarding architecture.

## 14. Performance and offline contract

- Home and First Flight work completely offline.
- Procedural frame zero renders without waiting for Higgsfield media.
- Release builds expose named milestones for WebView frame zero, semantic controls ready, first accepted causal change, and overture settled; native test logs also timestamp OS launch and WebView presentation.
- The normative hardware/OS set lives in the version-controlled `docs/qa/first-contact-device-matrix.json`. Before any physical performance baseline or release-candidate claim, it must contain exact observed values—manufacturer, model, hardware identifier, OS version/build, Android System WebView package/version where applicable, and capture date—for `slowest_ios`, `current_ios`, `slowest_android`, and `current_android`. Wildcards such as `latest`, model families, and missing WebView versions invalidate the run. Local feature implementation may proceed without connected devices, but it cannot claim native/performance completion.
- On the matrix's named slowest-supported iPhone and Android reference devices, ten clean cold starts record p50/p90. WebView frame zero to semantic controls ready is p90 ≤400 ms; accepted input to visible response is p90 ≤100 ms; ball touch to First Flight ready is ≤1.5 seconds.
- The same evidence stores a pre-change baseline. No launch milestone may regress by more than 100 ms or 10%, whichever is smaller, without an explicit owner-reviewed tradeoff. Browser Long Tasks data is diagnostic only and is not used as proof for WKWebView.
- Optional video is lazy-mounted and disposable.
- Device-pixel ratio is capped for decorative canvas work.
- Ambient loops pause when hidden.
- A shipping-asset manifest replaces blind startup loading and identifies every first-contact asset. Native generation verifies that only shipping-reachable assets and explicit offline media are packaged; the current broad `assets/` copy is audited before release rather than silently accepting package growth.
- All generated assets are local, compressed, covered by package-copy tests, and add no more than the 1.5 MB media budget plus 500 KB for poster/audio combined.

## 15. Verification and release evidence

### 15.1 Automated states

Required browser fixtures:

1. clean first install;
2. first-run mid-adjustment;
3. partial improvement;
4. successful result;
5. specimen-based Home reveal, counterfactual, and optional **Change focus**;
6. skipped First Flight;
7. returning Home with fresh state;
8. returning Home with stale state;
9. storage unavailable;
10. reduced motion;
11. sound disabled/enabled;
12. missing, corrupt, rejected, and delayed optional video;
13. offline mode;
14. compact/wide portrait and landscape where supported;
15. previously enabled sound on cold start with locked, suspended, and rejected audio contexts;
16. native background/process death mid-overture and mid-adjustment;
17. Reduced Motion enabled during an active sequence;
18. both **Explore on my own** routes and their retained specimen state.

Assertions include:

- `sa-p3.css` loads before scoped entry/Home styles and remains the only source of root palette, type, radius, focus, and motion tokens;
- no scoped stylesheet redefines a P3 semantic token, font face, parameter hue, focus ring, or plate recipe;
- computed Face and Path treatments resolve through `--q-face` and `--q-path`, non-measurement optical construction and provisional previews resolve through `--secondary`, and baseline/reference traces resolve through `--ghost`;
- the resting ember budget and the existing two documented ember exceptions are respected at every fixture size;
- no console/page errors;
- exact route accessibility;
- no horizontal overflow;
- no focus trap;
- engine-derived text matches engine output;
- `SIMULATED REFERENCE`, model assumptions, and accessible provenance remain present when the specimen reaches Home;
- lateral-offline copy is derived from the engine's ground-contact coordinates and never relabelled as target distance without a two-dimensional target calculation;
- landing, Hit, band-entry, and success haptics use only existing event-table mappings;
- any-input settle under 100 ms;
- overture removal by 1.5 seconds;
- no audio create/resume/play call unless both persisted preference and current-foreground gesture gates pass;
- all lifecycle exits and mid-session Reduced Motion changes reach the same settled semantic state without replay or autoplay;
- no First Flight replay for returning users;
- Instrument Index is fully keyboard operable;
- reduced-motion information parity.

Build/native assertions include:

- unit tests drive the orchestrator through injected clock, storage, audio, media, reduced-motion, and lifecycle adapters;
- native projects are regenerated in CI and inspected for the iOS lockup, Android 12+ safe-zone mark, and `#07060C` launch background, with no plugin/manual splash hold;
- media inspection proves H.264 AVC, SDR, `yuv420p`, zero audio streams, orientation variants, fast-start, and byte budgets;
- the shipping-asset manifest and final native package-size report are stored as release evidence.

### 15.2 Physical-device evidence

Record cold start, warm resume, route return, and clean install on the four exact devices/builds committed in `docs/qa/first-contact-device-matrix.json`:

- the slowest supported iPhone and a current iPhone;
- an older supported Android and current Pixel/Samsung devices;
- Android 12+ launcher-owned splash behavior;
- iOS after delete/reinstall because launch artwork can be cached.

Test silent switch/DND, media volume zero, background music, Bluetooth route, interruption, airplane mode, Reduce Motion/Remove Animations, and orientation handoff.

### 15.3 Experience targets

| Target | Release threshold |
|---|---:|
| Median first accepted causal change | ≤20 seconds after clean-install launch |
| Median quantified result | ≤60 seconds |
| p90 quantified result | ≤120 seconds |
| Median specimen-based Home reveal | ≤90 seconds |
| First Flight completion among causal-change starters | ≥85% |
| Users answering both unaided causal prompts correctly | ≥80% |
| Voluntary start of next Home experiment within 24 hours | ≥45% |
| Resume success | ≥99% |
| Permission-denial dead ends | 0 |

Measurement contract:

- the clean-install funnel is `first_frame → causal_change → result_seen → home_reveal → next_experiment_started`;
- `causal_change` is the first accepted Face-value change that visibly recomputes the preview—not the opening ball touch;
- `result_seen` requires a solver-derived before/after result to be visible; `home_reveal` requires the Home controls to be usable; `next_experiment_started` requires an input inside a different experiment, not a navigation tap;
- clean-install cohorts exclude automated/dev traffic and corrupted installs only; skippers and audio/media failures remain in the denominator for first-contact analysis;
- comprehension is tested on at least 20 representative golfers after an unaided run using two fixed prompts: what mostly moved the start line, and what relationship mostly produced curve. At least 80% must answer both correctly without reopening the lesson;
- behavioral funnel thresholds use at least 100 eligible clean-install sessions when traffic permits, publish sample size and confidence intervals, and compare against the instrumented pre-change first-run baseline;
- instrumentation records stage/timing outcomes, not raw shot data, and follows the product's consent and retention policy.

Hard score caps:

- account, permission, or paywall before the quantified win: maximum 79/100;
- mandatory onboarding above three minutes: maximum 85/100;
- no skip/resume or drag-only input: maximum 90/100;
- simulated result described as real player improvement: trust failure, cannot ship.

## 16. Risk register

| Risk | Prevention |
|---|---|
| Optical concept becomes generic glassmorphism | hard edges, etched lines, no floating blur-card field |
| Dark scene hides hierarchy | solid value contrast, controlled scrims, one active action, device screenshots |
| Cinematic landing becomes a toll | first-install only, returning settle ≤400 ms, instant skip |
| iOS/Android launch artwork drifts | platform-specific approved asset rules plus post-generation native inspection |
| Higgsfield introduces visual drift | atmosphere only; exact brand and physics remain code-rendered |
| Onboarding teaches a scripted answer | use shipping solver and derived copy, allow any hit, quantify partial improvement, then test a counterfactual |
| Simulation is mistaken for coaching proof | persistent `Simulated 7-iron` language and model-specific claims |
| Home hides modules | explicit labelled Instrument Index with real links and stable order |
| Instrument Index becomes a disguised tab bar | collapsed single control; no four equal resting destinations above the fold |
| Sound violates user expectations | persisted preference plus current-foreground gesture, rejection-safe independent audio, silent experience remains complete |
| Concurrent Impact work is overwritten | implementation touches scoped Home/entry files and imports the solver read-only |

## 17. Acceptance summary

The design is accepted only when the implemented app proves all of the following:

- opening Flightglass produces a coherent native-to-web premium moment;
- the opening ball touch enters the shipping solver scene rather than a tutorial replica, and the first causal control is ready when the overture settles;
- the first result is quantified, causal, and honestly labelled simulated;
- onboarding reaches a specimen-based Home in roughly 90 seconds without account, permission, or paywall gates;
- Home presents one experiment and one next action rather than a dashboard;
- all visuals follow Ultraviolet Ember and existing system laws;
- exact physics and UI remain deterministic without Higgsfield media;
- sound, motion, storage, media, and permissions all fail safely;
- returning users enter immediately and retain useful continuity;
- no golf competitor's conventional home structure describes the finished screen.
