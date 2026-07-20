# Flightglass session handoff

Updated: 2026-07-20

## Current Night Optics first-contact handoff

- Working branch: `agent/first-contact-night-optics`; isolated worktree:
  `.worktrees/first-contact-night-optics`.
- Owner-approved spec:
  `docs/superpowers/specs/2026-07-20-flightglass-first-contact-design.md`.
- Freshly reviewed implementation plan:
  `docs/superpowers/plans/2026-07-20-flightglass-first-contact-implementation.md`.
- Pre-change source is
  `02aad61382e6c31c103867ea993ce8f650758881`. No shipping source has changed at
  this checkpoint.
- Fresh start gate: `npm run claude:ready` PASS, exit 0 in 540.9 seconds.
  Focused Home baseline: eight viewport/motion captures, zero critical findings.
- Scope owns new `first-contact*` state/orchestration/scene/audio/flight source,
  the production Home replacement, focused tests, and later native/package
  contracts. `impact-flight.js` is read-only. Do not make broad Impact edits.
- The landing skip opens useful Fundamentals Home. Only First Flight's skip may
  hand its exact simulated shot to Range. The Range consumer must wait for and
  record the exact reviewed PR #2 / `agent/impact-portrait` commit; if it cannot
  integrate narrowly, leave that interface gate open rather than overwrite it.
- Five focus choices now continue to truthful existing Academy instruments:
  Start Line, Speed Transfer, Flight Height & Descent, Delivered Loft & Launch,
  and Shape. Tests must follow each through a real model change and persistence
  before any account, permission, or paywall.
- Device/native performance, behavioral cohorts and human comprehension remain
  unobserved release evidence. Optional generated atmosphere is kept only after
  a reproducible blind win; the coded UI, physics and procedural sonic mark are
  complete without it.

Execution router: Sol/high decides and reviews, Terra/medium builds, and
Luna/low runs mechanical evidence. The current collaborator does not expose a
Luna override, so Terra/low is the explicit Luna-class fallback rather than
spending Sol on command-only work.

Wave 1 explicitly uses the parallel-agents + isolated-worktrees workflow, not
the serial SDD dispatcher. TDD, atomic lane commits, diff packages and fresh
reviews remain mandatory. Plan arithmetic estimates 15–25% wall-clock savings;
record real wave timings. Task 8 is split: native tooling may overlap Task 7,
but the final manifest/package convergence runs only after Task 7 integrates.

Exact next action: create the phase rollback backup and a recorded integration
base, then create the isolated `first-contact-state`,
`first-contact-orchestrator`, and `first-contact-flight` worktrees. Dispatch
Tasks 1–3 to separate Terra workers with disjoint ownership, RED/GREEN evidence,
and no merge/push authority. Sol reviews and integrates state → orchestration →
flight before the shared UI lane starts.

## Current Impact handoff

- Working branch: `agent/impact-portrait` from current `origin/main`.
- Owner-approved UI is implemented in `impact.html`; the normative source mock
  is `design/mocks/impact-kamera.html`.
- One live slider is shown at a time. The full-width chip matrix is Flight
  5 / Top 3 / Side 3, with Speed shared across perspectives and no helper text
  below the slider.
- Impact requests portrait at route level while the native shells advertise
  both orientations; unsupported web orientation locking fails open.
- Fresh focused evidence: 59/59 Impact, annotation, orientation and browser
  contracts pass. Six production captures live in
  `outputs/impact-portrait-review/` at 375x812 and 430x932.
- The licensed Contact Height cue copy was restored to the words spoken by the
  existing 102-file voice pack; the full start gate subsequently passed
  503/503.
- Final Level C change gate: 8/8 PASS with zero critical Chromium/WebKit
  findings; evidence is
  `outputs/flightglass-gates/2026-07-19T16-52-12-208Z--level-C.json`.
- Branch `agent/impact-portrait` is pushed and draft PR #2 is open:
  `https://github.com/Fenral/svingbue/pull/2`. Exact next action is owner review.
  Do not merge or deploy without a new owner instruction.

## Repository checkpoint

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
