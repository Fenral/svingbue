# Flightglass session handoff

Updated: 2026-08-08

## Current state (2026-08-08) - Mechanics v1 release execution

[PR #19](https://github.com/Fenral/svingbue/pull/19) is the draft release
execution PR on `agent/mechanics-v1-convergence`. It inherits the stable source
release from [PR #18](https://github.com/Fenral/svingbue/pull/18) at
`3abbd4fcc65c939cc2d0e35ea03866add3540aa5`; PR #18 is no longer the canonical
execution record. `origin/main` remains
`184140a2ff5834f23510662f8c442b8a8c03d36c`.

The reviewed code-and-asset checkpoint is
`c47113bb23a3fb274277fe869dea925a6fa0a928`. The documentation commit that
contains this handoff changes `HEAD`; therefore the final exact candidate SHA,
matching GitHub run and preview deployment must be recorded later in PR #19
and immutable attestations rather than guessed here.

Mechanics Lab is now the sole cause-to-strike-to-flight instrument. Impact
Inputs link Face Angle, Club Path, Attack Angle and Dynamic Loft to Start,
Curve, Launch, Backspin, Apex and Carry. Arc Inputs link Low Point X, Low Point
Height, Swing Direction and Swing Plane to Contact, Attack and Path, then to
the same six outcomes. Club speed remains a visible fixed 90 mph reference.
Range / Outcome supports replay and comparison; Flightglass Guide supports
bounded questions. No surface analyzes personal golf or prescribes technique.

Current automated evidence at the reviewed checkpoint:

- finish reviewer `PASS`: Product fit 98, causal legibility 96, hierarchy 94,
  responsive integrity 95, accessibility 96, brand 97, non-generic craft 96;
- protected engine 72/72 and protected diff empty;
- Mechanics contracts 10/10, Chromium 9/9 and WebKit 9/9;
- latest Range plus Phase 2 67/67; release evidence 204/204;
- image provenance 4/4, store release 8/8, three dependency audits at 0
  vulnerabilities, 32 captures and 0 critical UX findings.

The exact-head Level C run, GitHub run and Vercel preview are still `PENDING`
after this documentation commit. Preview verification now covers Home,
Mechanics, Range / Outcome, Guide, Privacy, Terms, Support and paywall semantics
plus ten private `404` sentinels, but local `VERCEL_TOKEN` and
`VERCEL_AUTOMATION_BYPASS_SECRET` are missing. The public GitHub Pages surface
still exposes stale Academy material.

Real RevenueCat/App Store configuration, signed TestFlight upload, sandbox and
real paid flows, physical-iPhone rows, moderated sessions, Pages containment,
production promotion and App Store submission remain `PENDING`, not `PASS`.
Immediately before `main` merge or any of those externally visible actions,
obtain one consolidated owner authorization.

## Current state (2026-08-07) — app opening, learning tour and Studio marker

The owner-directed Home/onboarding revision is implemented on
`agent/page-overview`. Home no longer asks the golfer to describe personal golf,
choose a goal or generate a first shot. First use now follows one learning path:

1. a real Outcome capture introduces the five delivery inputs;
2. a real Impact Studio capture shows Face + Path and Attack + Loft;
3. a fixed 7-iron example at 90 mph lets the learner change Delivered Loft from
   16–34 degrees while Launch Angle, Spin Loft and Backspin update through the
   unchanged shipping engine;
4. real Outcome, Studio and Guide previews form a three-destination product map.

The tour persists only progress, dismissal and example loft. It does not create
or replace `currentShot`; legacy saved setups still render through the existing
compatibility path. Every step supports Back and `Not now`, and completion opens
the normal live Outcome model.

Cold launch now has a short Flightglass instrument opening. It runs once per
session, can be skipped by pointer, Enter or Escape, falls back safely when
storage is unavailable and contracts to a 150 ms reduced-motion state. The
public marketing landing remains untouched.

Impact Studio's old outlined Low Point disk was replaced by an instrument
marker: exact core, tangent-aligned open aperture, subtle lens bloom and an
optional turf datum line/tick. It is drawn after competing geometry, remains
visible in its settled state and uses only a brief 280 ms update echo. Reduced
motion removes the echo without removing the information. Impact physics and
geometry were not changed.

Fresh evidence:

- onboarding journeys: 10/10 Chromium and 10/10 WebKit;
- Studio marker/geometry journeys: 9/9 Chromium and 9/9 WebKit;
- v1 shell/context/Guide contracts: 51/51;
- native release contracts: 7/7, including byte-identical registered
  onboarding captures;
- automated phone matrix: 4/4 Chromium and 4/4 WebKit;
- level-C change gate: PASS with zero critical Chromium/WebKit findings;
- representative onboarding and Low Point screenshots inspected manually.

Phase 2 is still deliberately open. The automated gate is green, but the
moderated protocol in `docs/phase2-onboarding-uat.md` still requires 10
first-time participants, at least 8 unassisted completions and a median of 90
seconds or less. Do not declare `PHASE 2 DONE` until those rows are observed.

## Current state (2026-08-07) — monetization source/test ready, store blocked

The native-only value gates are implemented at three named moments: the 11th
distinct Range comparison, the second guided Studio experiment and the sixth
unique Guide answer in the same local calendar day. Usage is consumed only
after a completed result; duplicate comparison/question identities do not spend
another allowance. Browser preview remains ungated.

The paywall renders only Monthly and Annual, uses live RevenueCat price strings
when available, calculates no unverified savings claim and keeps the protected
lifetime product mapped only for existing-entitlement restoration. Range now
truthfully calls its temporary three-ghost action `Pin comparison`; the paid
promise is unlimited comparisons, not persistent save history. Guided Studio
has a distinct instruction/completion layer. A successful purchase or restore
continues the exact Range, Guide or Studio action that opened the paywall;
dismissal returns a denied guided request to free direct Studio. Terms and
Privacy match these promises.

Fresh evidence: monetization/IAP contracts 23/23; Chromium 12/12; WebKit 12/12.
The browser matrix triggers all three gates through their shipping pages and
covers automatic post-unlock action resumption, no-cost re-pinning of a counted
setup, keyboard plan selection, successful purchase, cancel, pending, error,
paywall/Home restore, focus return, axe WCAG A/AA, reduced motion, 375x812 and
932x430. Supabase and account sync remain out of v1.

Fresh automated v1 prerequisite evidence on 2026-08-07: 315/315 tests pass in
207 seconds, including the 72/72 protected engine suite, Chromium and WebKit,
native/store contracts, the current four-route risk gate and the executable
human-evidence checker. Academy is excluded from the v1 native allowlist, so
its historical v2 voice debt is not part of this release gate. Human
observations, physical-iPhone behavior and real store transactions remain
separate gates.

This is not production purchase acceptance. `sa-iap.js` deliberately contains
placeholder public SDK keys, so native checkout remains unavailable until the
owner supplies the RevenueCat project configuration, current offering and store
setup. Native sandbox purchase and an existing lifetime-customer restore must
then be recorded before Phase 4 can close.

The shipping bundle exposes no global entitlement mutator; the legacy
`window.__saShots.setPro` console hook was removed and is contract-tested.
Codemagic also enforces iOS 16.4 in both the generated Xcode project and
Podfile, matching the WKWebView baseline required by the modal/design system.

## Current state (2026-08-07) — Flightglass Guide complete

The owner-directed v1 Guide phase is complete on `agent/page-overview`.
`jarvis.html` remains the compatibility route, but the visible product is now
**Flightglass Guide** and the shared navigation label is **Guide**. It contains
three guided intents, six topic branches and 28 concrete questions; no text
field, contenteditable surface or LLM path exists.

The Guide recomputes values through `guide-engine.js` from the existing
five-input Range model. Every catalog entry carries a truth tier, a visible
model boundary and a quick addability verdict: available now, bounded model,
external data/calibration, or reject false precision. Engine-backed questions
may open a one-variable lab; four inputs remain explicitly held, exact outcomes
and deltas update live, and one selected change can be handed to Range. Context
also survives shared navigation to Studio and corrupt storage fails to the
illustrative model.

Fresh verification: Guide contracts 30/30, Chromium 11/11, WebKit 11/11,
`verify:v1` 46/46 plus Home/brand checks, and the level-C change gate PASS. A
fresh Impeccable/Terra review returned `REVIEW-READY`. Mobile/desktop evidence
is under `outputs/guide/`; question research is in
`docs/guide-question-research.md`; durable visual rules are in `DESIGN.md` and
`.impeccable/design.json`.

No protected physics output or Academy runtime changed. Academy remains v2.
No deployment or store publication was performed; source publication is limited
to the working branch/draft-review path. Exact next action is owner visual/product
review of the three mobile Guide states; subsequent work
should add an unsupported topic only after its new inputs, calibration source
and deterministic regression fixtures are named.

## Current state (2026-07-28) — supersedes everything below

Everything under "Repository checkpoint" and "Execution state" describes the
pre-convergence world and is kept only as a record of how the Academy work was
built. What is true now:

- **`main` is the single source of truth.** `agent/academy-codex`,
  `agent/academy-s1`, `engine/physics-3d-spin`, `engine/physics-3d-spin-recal`
  and `claude/impactdelen-access` are all fully merged into it. `main` is 127
  commits ahead of `academy-codex`. Do not resume work on those branches.
- Stage B (the recalibrated 3-D spin engine + Academy migration) landed on
  `main` at `b80dfd6`. Its outcome report is `handoff/06-stage-b-response.md`.
- Active work since 2026-07-23 is **Impact Studio** (`impact-studio.html`,
  PR #11–#14), linked from the home page as the third place.
- **Fable 5 is no longer available. Opus 5 owns the roles Fable held** — final
  technical decisions, design director, judge. Forward-looking routing in this
  repo was updated 2026-07-28; historical signatures were deliberately left
  alone.
- Not merged: `agent/impact-portrait` (6 unique commits) — merge or discard.

Verified fresh on 2026-07-28, not taken from this document's older claims:

- `npm run test:engine` — **72/72 pass**, 11.2 s.
- `npm run test:academy-voice` — **red**, 2 suites: licensed-master
  verification and caption inventory (`1579 != 1546`). This is the known,
  pre-existing red documented in `handoff/06-stage-b-response.md` §6 — but the
  inventory count has drifted by one since 2026-07-21, so some cue text changed
  after that report was written.

Still open, in the order they block release: the voice-pack gate (needs
regeneration plus the owner's fatigue-listen, physical-device and iOS VoiceOver
passes), a re-audit of the prose numbers in `academy.html` against the
post-recalibration engine, the Geometry 3D UX gap, and the missing `ios/` and
`android/` platform projects.

## Repository checkpoint (historical — pre-convergence)

- Remote: `Fenral/svingbue`
- Working branch for this handoff: `agent/academy-codex`, rebased on
  `agent/travel-sync` commit `2978756`.
- Purpose: recoverable, source-complete Academy curriculum and truthful final
  verification evidence. This branch is not a release branch.
- Repository visibility: private, verified on 2026-07-13.

Durable chat
decisions are now recorded in `docs/CHAT-DECISIONS.md`, and the original
identity concept pages are preserved in `docs/concepts/flightglass/`.

## Execution state

Phase 0 is complete and the Backspin reference shell remains STUDIO-GRADE.
Academy Batches 0–13 and optional Batch 14 are source-complete on
`agent/academy-codex`: all 13 core curriculum experiences, Academy Home, shared
store/router/host, and the no-reward Plane Coupling lab are coded. Curriculum
source ends at `46ff9a0`; final legacy Carry test compatibility is `2b601b3`.
There is no remaining planned Academy module implementation for the next agent.

Fresh convergence evidence is green for `test:academy` (348/348), the full
`test:ux` Chromium/WebKit/global matrix, brand/autopilot verification, protected
physics hashes and both performance engines (p95 2.1 ms Chromium / 5.0 ms
WebKit, budget 16.7 ms). `copy-web` copied 84 top-level shipping assets. The
voice pack now contains 102 exact local captions and 102 licensed local R5-A
audio masters.

Academy Voice production completed on 2026-07-16. The owner blind-selected R5-A
against the anonymous R3-D control, and the mature British female systems-
engineer identity is fixed at TTS speed 0.8. All 102 files passed hash, caption,
runtime-binding, format, loudness, silence and automated transcription review.
Development verification and the 36-test Voice suite pass; root/`www` audio
hash parity is 102/102. Commercial-use evidence is recorded from the owner-
confirmed ElevenLabs Creator plan and current official terms. See
`docs/flightglass-autopilot/ACADEMY-VOICE-QA.md`.

A new ignored, non-shipping deliberate audition is ready at
`.voice-production/control-room-en-us-v1/deliberate-voice-round-7/blind/`.
It compares three British female laboratory voices (`B-A..B-C`) and three dark
male voices (`D-A..D-C`) at 161.7-162.5 words per minute with five explicit
sentence pauses. Six paid Voice Design calls produced 18 private previews and
no persistent provider voices. All six finalists pass `small.en` semantic
transcription, pause-count and technical audio gates. Initial provider-spoken
break markup was removed locally from word-timestamp boundaries and replaced
with 240 ms PCM pauses; this required no additional paid call. The committed
tool now sends only paragraph-separated copy and refuses stale-copy
reprocessing. R5-A, F-C, the canonical manifest and all 102 shipping assets are
unchanged. Exact next action: owner blind-listens to the six labels and records
one or two preferred labels before provenance is revealed or any shipping voice
is replaced.

The Academy acceptance continuation hardened three browser-test readiness
boundaries only; no product source changed. Flight Height waits for the profile
SVG, Start Line waits for the requested legacy concept title, and Plane Coupling
waits for its renderer/result/audit state. Fresh focused checks pass in both
engines, including 16/16 repeated Plane Coupling cases. The final
`npm run claude:ready` candidate passes 482/482 tests with brand and autopilot
verification green.

The separate Backspin visual gate is now closed. A balanced, side-by-side
provenance-blind comparison selected the current generation in 8/8 valid pairs;
two preliminary sequential-image runs were excluded before provenance was
opened because they showed an all-A position pattern and no generation winner.
After deliberate approval of all 48 baselines, two independent
`npm run test:visreg` processes passed 48/48 with zero runtime failures and a
maximum 0.099% difference. The small Apex annotation was made deterministic
without relaxing the 0.1% threshold. Backspin focused suites pass 41/41 in both
Chromium and WebKit, and root/`www` shipping assets have exact hash parity.

This branch is source- and Voice-asset-complete, **not release-accepted**. The
female voice is recorded, locally shipped and rights-evidenced, but the strict
verifier intentionally holds one continuous five-minute fatigue listen,
physical-device/offline/audio-route behavior and iOS VoiceOver. The Backspin
reference visual baseline is accepted, but the new
curriculum modules have not received their own provenance-blind pairwise
judgments and must not be labelled STUDIO-GRADE from automated tests alone.
Those visual and human/device checks remain open.

Native web copying is complete, but Capacitor sync reports that neither iOS nor
Android has been added to this repository. Creating those platform projects,
signing them and building store archives is owner-controlled release work, not
missing curriculum code. Temporary untracked audit directories — including
`outputs/flightglass-visreg/` — were deliberately left untouched and unpushed.
Read `docs/flightglass-autopilot/STATUS.md` for exact results and open gates.

Backspin Tasks 1-11 are complete and verified on 2026-07-14. Task 10 shipped
the lesson into `www/` and locked the 96 target (`4d01eef`); Task 11 recorded
the full verification evidence, the ten-row score audit (96, floor 95) and the
byte-identical `impact-flight.js` confirmation in
`docs/flightglass-autopilot/STATUS.md`. The previous machine's untracked
`outputs/flightglass-ux/verify*` files were never pushed; equivalent evidence
was regenerated fresh on this machine.

The instrument-gates work order
(`docs/superpowers/plans/2026-07-14-instrument-gates.md`) is complete through
Task 20. Backspin is STUDIO-GRADE under the gate-based acceptance model: zero
critical defects, 5/5 category floors, 17/17 EV checks PASS in 3/3 independent
judge runs (including all 10 critical checks), and the native generation won
4/4 blind comparisons. The three derived verdicts are STUDIO-GRADE/100; the
number is a byproduct, not the acceptance target. Fresh raw gates are under
`outputs/flightglass-eval/final-gates/`.

## Front-page concept checkpoint — 2026-07-15

Three non-shipping front-page studies were refreshed after a Mobbin entry-screen
reference pass. `home-concept-1.html`, `home-concept-2.html` and
`home-concept-3.html` now use the current Flightglass lockup while preserving
the protected `strikearc.academy.v1` storage key. The interaction directions
remain Floodlights (world-as-menu), Summon (orbital reveal) and The Arc
(trajectory-as-control). The scored design rationale and Mobbin citations are
in `docs/front-page-directions-2026-07-15.md`.

Focused evidence passed: current-brand source assertions, direct destination
and reduced-motion contracts, `npm run brand:verify`, zero browser errors,
zero horizontal overflow, and 44 px minimum visible target height at 932×430
and 812×375. Reduced-motion static composition was also exercised through the
mock review flag. Generated captures under `outputs/front-page-directions/`
remain local evidence and are not part of this checkpoint.

This concept checkpoint does not change the active Academy phase, mark Home
Phase 1 implemented or alter the production `index.html`. The next production
action remains the Backspin Task 10/11 sequence below.

## Portrait front-page checkpoint — 2026-07-15

A second, portrait-native concept round is complete at 430×932 and 375×812.
The three non-shipping studies are `home-portrait-1.html` (Night Ladder),
`home-portrait-2.html` (Shot Spine) and `home-portrait-3.html` (Aperture). Their
research, rationale, evidence and recommendation are recorded in
`docs/front-page-portrait-directions-2026-07-15.md`.

Independent acceptance produced a manifest-derived SHIPPBAR score of 96.3 with
zero critical failures. The new portrait work won all six anonymous
current-versus-baseline comparisons. The only remaining finding is non-critical
`EV-TYPO-04`, caused by the shared `sa-p3.css` three-family font token setup;
the shared production token file was intentionally not changed for this
non-shipping study.

Final evidence passed 36/36 layout and interaction cases across both target
sizes, Chromium and WebKit, normal and reduced motion, and 130% text. Twelve
axe-core scans had zero critical or serious findings; all visible targets met
44 px; the authoritative 240-event interaction run stayed below budget; and 24
approved-baseline visual-regression pairs stayed below the locked 0.1%
threshold. Direct reduced-motion captures were complete and nonblank.

This checkpoint does not implement Home Phase 1 or change the production
`index.html`, protected physics, compatibility IDs or Academy storage keys.

## Shipping Home — Night Ladder — 2026-07-15

After reviewing the portrait round, the owner selected Night Ladder for the
actual Flightglass Home. That later decision supersedes the non-shipping note
above: `index.html` is now the responsive Night Ladder world, and `www/index.html`
is rebuilt from it. The original concept remains in `home-portrait-1.html`.

The shipping version uses only real native-package destinations, reads existing
fresh Home/Academy state without migrating any storage key, and labels its
fallback values as a demo. It supports portrait 430×932 / 375×812 and landscape
932×430 / 812×375, including complete reduced-motion states and 130% text.

Acceptance is STUDIO-GRADE: 17/17 independent manifest requirements PASS, all
category floors PASS, zero critical failures and 2/2 blind wins against the
previous shipping Home. The manifest-derived score is 100; it is a byproduct,
not the acceptance target. Home-specific evidence includes 8/8 focused captures
with zero findings, 24/24 extended layout and axe states, 160/160 target-pair
checks with zero overlap, 0 px digit-width drift, 4/4 cross-page navigation,
and 16/16 deterministic visual-regression pairs at 0.000% maximum difference.

The visual-regression harness was hardened during acceptance: alpha-only pixel
changes now count, screenshots disable capture-time animations, and Academy Lab
captures wait for the exact phosphor ghost count. The post-fix global suite
passes 3/3 with 48/48 opaque, nonblank images; no baseline was re-approved.
Full Chromium/source tests pass 87/87, WebKit passes 41/41, and p95 performance
is 1.7 ms / 3.0 ms over 220 events per engine. Evidence is under
`outputs/flightglass-home-night-ladder-eval/`; rollback is
`.sa-backups/night-ladder-home-20260715-101854`.

Protected physics, bundle/store/product identifiers and Academy storage keys
are unchanged. Phase 8 publication remains blocked on the complete release
program. The next production action remains Academy Batch 0.


Backspin has a separate 96-97 reference-lesson design and implementation plan:

- `docs/superpowers/specs/2026-07-13-backspin-96-97-design.md`
- `docs/superpowers/plans/2026-07-13-backspin-reference-lesson.md`

## Academy continuation state

The Academy overview architecture is accepted through its dedicated design and
implementation plan:

- make Academy home a goal-led coach with one dominant Continue/Start action;
- move the full physics constellation to a secondary Explore surface;
- separate physical relations, learning prerequisites and recommended journeys;
- consolidate the 24 stored topic IDs into about 16 learner-visible experiences
  while preserving IDs and storage compatibility; and
- use no more than four to six assessed transfer bridges instead of a general
  network of related-module links.

The architecture is no longer waiting for module-by-module owner approval.
Production work must still follow the exact sequential plan/spec pair and gate
rules in the rollout index.

The autonomous sequence is defined in
`docs/flightglass-autopilot/academy-completion-loop.md`. Its completed inventory
gate points to 15 exact artifact pairs: shared Home/store, 13 core experiences
and one optional MODEL LAB. Existing path, polish, low-point and v2 documents
remain source material; they cannot override the accepted outcome curriculum.

On 2026-07-15 the owner then explicitly authorized a comprehensive,
outcome-led planning pass for the full Academy without approval pauses between
modules. The active work is design and implementation planning only; no
production code or protected physics may change.

Completed planning artifacts at this travel checkpoint:

- `docs/superpowers/specs/2026-07-15-academy-outcome-curriculum-blueprint.md`;
- `docs/superpowers/specs/2026-07-15-academy-start-line-design.md`;
- `docs/superpowers/specs/2026-07-15-academy-shape-design.md`;
- `docs/superpowers/specs/2026-07-15-academy-shot-pattern-design.md`;
- `docs/superpowers/specs/2026-07-15-academy-attack-at-impact-design.md`;
- `docs/superpowers/specs/2026-07-15-academy-low-point-design.md`;
- `docs/superpowers/specs/2026-07-15-academy-strike-depth-design.md`;
- `docs/superpowers/specs/2026-07-15-academy-plane-coupling-lab-design.md`;
- `docs/superpowers/specs/2026-07-15-academy-delivered-loft-launch-design.md`;
- `docs/superpowers/specs/2026-07-15-academy-backspin-curriculum-amendment.md`;
- `docs/superpowers/specs/2026-07-15-academy-flight-height-descent-design.md`;
- `docs/superpowers/specs/2026-07-15-academy-speed-transfer-design.md`;
- `docs/superpowers/specs/2026-07-15-academy-carry-design.md`;
- `docs/superpowers/specs/2026-07-15-academy-air-density-design.md`;
- `docs/superpowers/specs/2026-07-15-academy-wind-design.md`.

The blueprint reconciles all 24 stored IDs exactly once. Start Line, Shape and
Carry Side are now specified surface by surface with exact copy, interaction,
voice, model/truth boundaries, live mastery, accessibility, migration and
acceptance evidence. The learner-facing name **Carry Side** replaces “Shot
Pattern”; `shot-pattern` remains the internal ID. This prevents one
deterministic result from being misrepresented as dispersion.

No production file changed. Numeric direction-family fixtures were verified
against the current protected `solveFlight()` implementation, and
`impact-flight.js` remains untouched.

The strike/contact family is also complete at specification level. Contact
Height is the learner-visible title for canonical `strike-depth` and is bounded
as point-path geometry, not measured face Impact Height or literal divot depth.
Plane Coupling is an optional MODEL LAB stored outside core mastery. Its exact
fixtures and the Low Point/Contact Height invariants were verified against the
unchanged geometry engine.

The launch/spin/descent family is complete at specification level. Delivered
Loft & Launch teaches the current 0.62 Dynamic-Loft / 0.25 Attack transform
without turning coefficients into percentages or hiding Dynamic Loft's other
model paths. The Backspin amendment preserves the STUDIO-GRADE instrument,
grandfathers existing progress and states the crucial boundary that calculated
Backspin rpm does not feed current Carry, Apex or Landing. Flight Height &
Descent separates Apex from Landing Angle, direct from mediated Launch paths,
and descent from stopping distance. Ten frozen fixtures plus the same-Apex /
different-descent live pair pass against the unchanged flight equations.

Every remaining outcome family is now complete at experience-specification
level. Speed Transfer treats Smash as a speed ratio and current Spin-Loft model,
not a centeredness or percent-energy diagnosis. Carry exposes that the current
fit consumes Ball Speed only, keeps real Launch/Spin effects visible as omitted,
and labels Total as an illustrative roll extension. Air Density combines
Altitude and Temperature through one post-solve EST proxy while freezing every
launch value. Wind preserves engine Start + Curve = Carry Side, then adds Wind
Drift as a separate first-order EST layer. All frozen speed, carry, air and wind
fixtures pass.

The cross-curriculum acceptance audit is also complete at specification level:

- `docs/superpowers/specs/2026-07-15-academy-cross-curriculum-acceptance-audit.md`;
- ownership reconciliation: 24/24, no duplicate or orphan;
- voice reconciliation: 99/99 cues within 12–24 words and no experience above
  the eight-signature budget;
- structure reconciliation: all 14 experience documents pass;
- 297 fresh flight/geometry/conditions assertions pass against the unchanged
  engines.

The audit corrected one stale Wind fixture before acceptance. The current
Dynamic-Loft-30 baseline uses Face weight 0.7500, Start Direction +0.2500° and
engine Carry Side +13.4326 yd. The corrected first-order endpoints are
+19.6251 yd for the normative head/left-cross state and +5.8006 yd for the
tail/right-cross state. No protected physics code changed.

The final planning artifacts are:

- Home/store design:
  `docs/superpowers/specs/2026-07-15-academy-home-store-migration-design.md`;
- Home/store task plan:
  `docs/superpowers/plans/2026-07-15-academy-home-store-migration.md`;
- cross-curriculum audit:
  `docs/superpowers/specs/2026-07-15-academy-cross-curriculum-acceptance-audit.md`;
- exact 15-batch rollout and all per-experience pairings:
  `docs/superpowers/plans/2026-07-15-academy-outcome-curriculum-rollout.md`.
- normative shared Voice System design:
  `docs/superpowers/specs/2026-07-15-academy-voice-system-design.md`;
- TDD-first Voice System companion plan:
  `docs/superpowers/plans/2026-07-15-academy-voice-system.md`.

The Voice System decision is now explicit: the first pack is the local
`Control Room` character (calm adult American female laboratory voice), first
use asks once for `Voice + captions`, `Captions only` or `Off`, and nothing
auto-speaks while preference is unset. After Voice consent, at most one
12–24-word entry cue is eligible for a genuinely new surface signature.
Unchanged revisits/back navigation stay silent, consequence cues are rare,
recovery is learner-triggered through `Hear a hint`, and there is never a stale
audio queue. Captions, Replay, immediate Voice Off, one-to-three semantic screen
beats, offline assets, screen-reader suppression and future pack boundaries are
all implementation-gated. Voice never blocks mastery or replaces visible truth.

Planning acceptance is **PASS / READY FOR BATCH 0**. This is not production or
release acceptance. No production file or protected physics engine changed.
Fresh voice-planning verification confirms both dedicated artifacts are linked
through every Batch 0 handoff, all 99 experience cues remain within 12–24 words
with no experience above eight signatures, secret/diff checks are clean, and
`npm run test:academy` passes 59/59 with zero failures/skips. The intended diff
contains documentation only.

## Exact next actions

1. Build provenance-blind visual and pairwise evidence for the new curriculum
   modules if full release acceptance is pursued.
2. Obtain licensed final female Control Room recordings, rights evidence, a
   strict voice-release verifier pass and human listening approval.
3. Add and sign owner-controlled iOS/Android platform projects and store archives
   only inside the authorized release workflow.
4. Run physical-iPhone offline, audio-route and background-interruption checks,
   plus manual VoiceOver, fatigue and other human gates.
5. Keep publication fail-closed until every remaining Phase 8 gate is green and
   the owner authorizes release.
