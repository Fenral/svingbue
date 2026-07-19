# Flightglass autonomous execution status

Updated: 2026-07-20

## Night Optics first-contact planning checkpoint

The owner approved the complete Flightglass First Contact direction on
2026-07-20. The normative specification is
`docs/superpowers/specs/2026-07-20-flightglass-first-contact-design.md`; the
reviewed TDD implementation plan is
`docs/superpowers/plans/2026-07-20-flightglass-first-contact-implementation.md`.
Work is isolated on `agent/first-contact-night-optics` from immutable pre-change
source `02aad61382e6c31c103867ea993ce8f650758881` and is claimed in
`COORDINATION.md`.

The plan passed three critical reviews after correcting the landing skip route,
side-crossing result language, real downstream focus consumption, the mandatory
free experiment, route-wide package reachability, native pre-paint background,
conditional media, canonical two-gated sound, and behavioral/native evidence
boundaries. A truth-alignment amendment maps the five focus choices to existing
Academy instruments instead of claiming unbuilt `Find the launch window` or
`Read one shot in 20 seconds` consumers.

Fresh pre-implementation gates:

- `npm run claude:ready`: PASS, exit 0, 540.9 seconds; no failures. Existing
  `MODULE_TYPELESS_PACKAGE_JSON` warnings remain non-blocking.
- focused Home baseline audit, all four manifest viewports in normal and
  reduced motion: 8/8 captures, zero critical findings, exit 0 in 17.2 seconds.
- protected Impact physics remains read-only; no production or shipping source
  has changed in this checkpoint.

Native safe zones, physical-device p50/p90, audio routes, human comprehension,
clean-install cohorts and their confidence intervals remain explicitly
`UNOBSERVED`. Optional Higgsfield media is post-implementation atmosphere only
and cannot block the procedural experience. The exact next action is Task 1:
create the guarded `fg.*` state model with a failing focused test before source.

## Impact portrait implementation checkpoint

The owner-approved portrait Range/Impact direction is implemented on
`agent/impact-portrait` as a reversible review branch. The shipping surface now
opens in Flight, keeps the established dark-violet palette, uses the approved
sharp orange only for the active trajectory, and presents exactly one live
slider above a full-width parameter strip. The parameter policy is exact:
Flight exposes Face, Path, Dynamic Loft, Attack and Speed; Top exposes Face,
Path and Speed; Side exposes Dynamic Loft, Attack and Speed. Helper copy below
the slider has been removed.

Both 375x812 and 430x932 production captures have zero horizontal overflow.
The chips split their entire available width evenly at a 44 px touch height,
the active Speed value survives lens changes, every annotation remains inside
the stage, and the projected landing point remains inside the range surface.
The protected flight solver and physics mapping are unchanged. Focused Impact,
orientation and browser contracts pass 59/59. The final Level C change gate
passes 8/8, including 14/14 risk-gate contracts, 4/4 Home contracts, eight
Chromium and eight WebKit runtime cases with zero critical findings, and the
native web package. Evidence:
`outputs/flightglass-gates/2026-07-19T16-52-12-208Z--level-C.json`.
Independent visual re-judgment is PASS / ready for owner review after the
Flight grid was grounded as a perspective plane on the range and Side labels
were clamped inside the stage. Draft PR #2 is open for owner review; it is not
merged or deployed.

Release authorization: granted for GitHub, Vercel and configured Apple/Google
publication after all Phase 8 gates pass. See `RELEASE-AUTHORIZATION.md`.

## GitHub and Vercel web publication checkpoint

On 2026-07-16 the owner explicitly directed GitHub publication and web deploy
after being informed that the human, physical-device and native-platform gates
below remain held. This publication is scoped to the static Vercel web app. It
does not approve native/store publication or relabel the new Academy modules as
STUDIO-GRADE.

Published runtime source: `f7f3ee21e4ef533df76b2880285eb69ffda2a036`.

- GitHub `main` was fast-forwarded from `58819f7091d487b60dcfb9586a387a49df61d67f`
  to the published runtime source. The release-evidence entry containing this
  checkpoint is a documentation-only descendant.
- Fresh pre-publication `npm run verify:change -- --level C --base origin/main`
  PASS: 14/14 gate-contract tests, 4/4 Home tests, 8 Chromium and 8 WebKit
  runtime cases with zero critical findings, and a clean regenerated `www/`
  package. Timing report:
  `outputs/flightglass-gates/2026-07-16T13-32-58-040Z--level-C.json`.
- Fresh Academy Voice PASS: 36/36 tests and development verification of 102/102
  local assets with zero missing, orphaned, hash-mismatched or duration-outlier
  records.
- Vercel production deployment `dpl_BKJgyzjJWn1QtSFrtgFGKS7b69dv` reached
  `Ready` and was assigned to `https://svingbue.vercel.app`. Deployment URL:
  `https://svingbue-n0oa6oywm-sivert-s-projects.vercel.app`.
- Post-deploy verification returned HTTP 200 and exact local SHA-256 matches
  for `index.html`, `academy.html`, `academy-home.js`,
  `academy-voice-manifest.js` and the first R5-A Voice master. Chromium smoke
  checks rendered Home and Academy Home with zero page or console errors.

Rollback is the previous ready production deployment
`dpl_227CCV7Aj3NpGTkB7gafxA52JWGb` at
`https://svingbue-cvo6vst8x-sivert-s-projects.vercel.app`; the previous GitHub
`main` source was `58819f7091d487b60dcfb9586a387a49df61d67f`.

The strict Voice release verifier remains held on the five-minute fatigue
listen, physical-device/audio-route behavior and iOS VoiceOver. The repository
still lacks `ios/` and `android/` platform projects, and new Academy modules
still lack their own provenance-blind pairwise/human acceptance.

## Academy Voice production completion checkpoint

R5-A is the owner-selected blind winner and the complete British female
systems-engineer Voice pack is implemented on `agent/academy-codex`. All 102
licensed local masters are generated, hashed, bound to the runtime and copied
into the shipping web payload. The app has no runtime ElevenLabs dependency.

Fresh 2026-07-16 evidence:

- `npm run test:academy-voice`: 36/36 PASS.
- Academy foundation: 241/241 PASS; the complete Chromium and WebKit Academy
  browser/model file sets also PASS. Long-running Backspin WebKit was split
  into fresh workers after the monolithic worker accumulated runner resources;
  all 41 unchanged cases passed.
- `npm run voice:verify`: PASS with 102/102 assets, zero missing/orphaned/hash/
  caption/binding/duration errors.
- Faster-Whisper decoded all 102 files; six screening flags received a second
  `small.en` review, with no confirmed wrong number, brand pronunciation,
  technical term or changed claim.
- All masters are AAC-LC mono 48 kHz/80 kbps. Duration is 3.453-8.1 seconds,
  loudness -19.75 to -17.56 LUFS, true peak no higher than -1.36 dBTP and
  leading/trailing silence no higher than 70/142 ms. Two 8.1-second technical
  cues have explicit reviewed exceptions.
- Commercial-use evidence is recorded from the owner-confirmed ElevenLabs
  Creator plan and official terms retrieved 2026-07-16.
- `npm run copy-web` PASS; root and `www/` each contain 102 masters with zero
  SHA-256 mismatch, and the runtime manifest is byte-identical.

The voice source/asset work is complete, but strict release verification still
fails closed on exactly three human/physical-device gates: one continuous
five-minute fatigue listen, physical-device/offline/audio-route behavior, and
iOS VoiceOver behavior. The absent `ios/` and `android/` projects also prevent
native archive/device verification. Full evidence and provider-rights sources
are in `ACADEMY-VOICE-QA.md`.

A faster mixed-gender challenge is ready for owner listening but is not a
shipping change. It contains three female and three male blind candidates on
identical copy, all transcription-approved and pace-normalized to 176.3-177.3
words per minute. R5-A and the canonical 102-file manifest remain unchanged
until an owner verdict is recorded.

A second deliberate Voice challenge is now ready for owner listening and is
also not a shipping change. It contains three British female laboratory voices
(`B-A..B-C`) and three dark male voices (`D-A..D-C`) on identical copy. Six paid
Voice Design calls produced 18 ignored raw previews and no persistent provider
voices. All six final blind files pass local `small.en` semantic transcription,
at least five measured sentence-pause gates, 161.7-162.5 words-per-minute pace,
60 ms leading silence, 117-120 ms trailing silence, -18.70 to -17.89 LUFS and a
true peak no higher than -1.65 dBTP. The provider-spoken break markup discovered
during QA was removed locally from word-timestamp boundaries and replaced with
five 240 ms PCM pauses without additional paid calls. The committed tool now
uses plain paragraph boundaries and refuses stale-copy reprocessing. R5-A, F-C,
the canonical manifest and all 102 shipping assets remain byte-unchanged until
an owner verdict is recorded.

| Phase | State | Evidence |
|---|---|---|
| 0 - QA baseline and control package | Complete | 40-state baseline, 11 contract tests, brand and handoff verifiers |
| 1 · Home / Night Ladder | STUDIO-GRADE | Owner-selected night-range Home; 17/17 manifest PASS, 2/2 blind wins, portrait and landscape evidence |
| 2 · Range / Visualise | Ready | Decisions and references locked in master plan |
| 3 · Outcome / Compare | Ready | Decisions and references locked in master plan |
| 4 · Geometry 3D / Strike Window 2D | Ready | Consensus documents named |
| 5 · Academy overview | Source and Voice assets complete; release acceptance held | Native Home/store/registry/router/host plus 102 licensed local R5-A Voice masters are coded and copied into the web package; the Backspin visual baseline is accepted, while new-module pairwise and human/device Voice gates remain open |
| 6 · Academy lesson system | Curriculum source-complete | All 13 core experiences plus the optional Plane Coupling lab own native renderers, model/content contracts, mastery or exploration rules and caption-ready cues |
| 7 · Paywall | Ready | Pricing and compatibility rules locked |
| 8 · Convergence and release QA | Ready | Global gates locked |

## Academy final convergence checkpoint

The Academy curriculum is source-complete on `agent/academy-codex`. All 13 core
experiences and the optional no-reward Plane Coupling lab are implemented; the
last curriculum source commit is `46ff9a0`, with final legacy Carry coverage at
`2b601b3`. This includes Academy Home, the complete learner-facing module
designs, persistent progress/mastery, canonical and legacy routing, and a local
voice/caption system with 102 exact semantic cues.

Fresh convergence evidence on 2026-07-15:

- `npm run test:academy`: 348/348 PASS — 223 foundation and 125 Chromium
  integration/browser cases, with zero skipped tests.
- `npm run test:ux`: PASS, including the complete Chromium and WebKit Academy
  matrices and the shared global UX evidence.
- `npm run test:perf`: 2/2 PASS over 220 events per engine. Chromium p95 is
  2.1 ms and WebKit p95 is 5.0 ms against the 16.7 ms budget.
- `npm run brand:verify` and `node scripts/verify-claude-autopilot.mjs` PASS.
  All four protected physics hashes remain exact.
- `npm run copy-web` PASS and copied 84 top-level JS/CSS assets into `www/`.
- Development voice-pack verification PASS with 102/102 exact local captions
  and licensed local audio masters, no remote dependency, no missing files and
  zero hash or runtime-binding mismatches.

Acceptance-control hardening on 2026-07-15 removed three asynchronous browser
harness races without changing shipping code or acceptance assertions. Flight
Height now waits for its rendered profile before the viewport audit, Start Line
waits for the requested legacy sheet title after hash navigation, and Plane
Coupling waits for its renderer/result state and audit SVG before reading them.
Focused Chromium/WebKit checks pass, including 16/16 repeated Plane Coupling
cases. The final `npm run claude:ready` candidate is green: 153/153 primary,
223/223 foundation and 106/106 WebKit tests (482/482 total), plus brand and
autopilot verification.

The separate Backspin visual-acceptance gate closed on 2026-07-15. A balanced,
side-by-side provenance-blind comparison selected the current curriculum
composition in 8/8 valid pairs. Two preliminary sequential-image runs were
excluded before provenance was opened because their all-A position pattern made
the generation result a 4-4 tie. After the valid win, all 48 baselines were
deliberately approved. The Apex trace label was integer-aligned and its
fractional letter spacing removed to eliminate cross-process Chromium raster
jitter without changing the 0.1% threshold. Two independent
`npm run test:visreg` processes then passed 48/48 comparisons with zero runtime
failures; the maximum remaining difference was 0.099% (396 pixels). `copy-web`
again copied 84 top-level assets, with exact root/`www` JS and CSS hash parity.
Fresh brand, autopilot and performance checks also pass (p95 1.2 ms Chromium /
2.0 ms WebKit against 16.7 ms).

The curriculum is **coded and testable, but not release-accepted**. These gates
remain deliberately open and were not weakened or reported as complete:

- The Backspin reference baseline is accepted through the valid 8/8 blind win
  and deterministic double visual-regression pass above. This does not accept
  the new curriculum modules, which still need their own provenance-blind
  evidence before any STUDIO-GRADE claim.
- The owner-selected R5-A female voice, all 102 local masters, rights evidence,
  runtime binding and automated transcription/audio QA now exist. The strict
  release verifier remains fail-closed only on fatigue, physical-device/audio-
  route and iOS VoiceOver evidence.
- `npm run sync` and `npm run sync:android` cannot package native targets because
  this repository has neither an `ios/` nor an `android/` platform project.
  Platform creation, signing and store archives remain owner-controlled release
  work; the completed web payload was not presented as a native archive.
- Physical iPhone/offline/audio-route/background-interruption, manual VoiceOver
  and fatigue checks remain `PENDING OWNER DEVICE/HUMAN GATE`.
- Provenance-blind pairwise judging was not performed for the new curriculum
  modules, so no new module is being labelled STUDIO-GRADE solely from its
  automated score or passing tests.

The previously interrupted isolated Mastery run and the previously outstanding
full `test:academy` / `test:ux` runs are superseded by the passing full results
above. Temporary untracked audit directories under `outputs/flightglass-*` were
left untouched and are not part of the GitHub handoff.

## Current checkpoint

Phase 1 Home is now implemented as the owner-selected **Night Ladder** direction.
The former diagonal split in `index.html` has been replaced by one responsive
night-range navigation world that preserves the portrait concept at 430×932 and
375×812 and resolves into a horizontal shot journey at 932×430 and 812×375.
All Home destinations resolve to native-package pages: Range and Outcome states
use `impact.html`, Lab uses `geometry.html`, and Academy uses `academy.html`.
Fresh `sa.stat.*` and Academy state is shown only when it is inside the existing
30-day contract; otherwise the values are explicitly labelled `Demo shot`.

Phase 1 acceptance evidence (fresh 2026-07-15):

- focused Night Ladder contract: 4/4 PASS; manifest now audits Home at all four
  target viewports;
- focused Home verify: 8 captures, zero critical or improvement findings;
- Chromium/source suite 87/87 PASS; WebKit 41/41 PASS; brand and clean native
  packaging PASS;
- 24/24 extended layout states and 24/24 local axe-core scans PASS with zero
  critical/serious findings; 8/8 text-130 states remain intact;
- 160 target-pair checks across both engines, all viewports and both motion
  modes: zero overlap, minimum separation 8 px;
- digit-cycle width delta 0 px; Home→Impact navigation 4/4 PASS in normal and
  reduced motion; p95 input-to-paint 1.7 ms Chromium / 3.0 ms WebKit over 220
  events per engine;
- Home deterministic visual regression: 16/16 pairs, maximum 0.000%; global
  visual regression 3/3 PASS after the harness was hardened to compare alpha,
  disable capture-time animations and wait for the exact ghost count. No
  visual baseline was approved or changed;
- independent blind comparison selected the new shipping Home in 2/2 pairs;
  independent manifest judgment: 17/17 PASS, every category floor PASS, zero
  critical failures;
- `derive-score.mjs --pairwise-won`: STUDIO-GRADE / 100. This is a derived
  byproduct; the four evidence gates determined acceptance.

Evidence is under `outputs/flightglass-home-night-ladder-eval/`. The rollback
unit is `.sa-backups/night-ladder-home-20260715-101854`. Protected physics and
compatibility identifiers are unchanged. This Phase 1 completion does not
authorize Phase 8 publication; the next owner-directed production action
remains Academy Batch 0 from the accepted rollout.

## Academy Batch 0 implementation checkpoint

Batch 0 production implementation is handed off on `agent/academy-codex`.
Source commit range: `2978756..449fc1c`. It adds the 14-experience/13-core
registry, additive Academy v1 migration, canonical and legacy routing, shared
experience host, deterministic recommendations, goal-led Academy Home, honest
progress sheet and the local Control Room voice/caption foundation. Backspin
retains its accepted six-surface renderer while registering the approved
semantic targets and emitting surface, model-input, mission, model-boundary and
mastery events through the shared host.

Fresh final implementation evidence on 2026-07-15:

- `npm run test:academy`: 108/108 PASS (43 foundation plus 65 model, migration,
  Home, shared-host and Backspin browser cases). The added browser case proves
  shared Backspin consent/captions, S0/S1 entries and actual build/cut milestone
  cues in Chromium.
- `npm run test:webkit`: 47/47 PASS (6 Home/host and 41 accepted Backspin
  cases). The same shared voice/milestone case passes in WebKit.
- Non-duplicative final shared matrix: 28/28 evidence, UX and shipping-Home
  checks PASS; brand and autopilot verifiers PASS. The exact `claude:ready`
  command was green before the final Backspin adapter; its final affected
  components were then rerun above instead of duplicating the full matrix.
- `npm run test:academy-voice`: 18/18 PASS. Development voice-pack verification
  passes with 11/11 exact captions (3 Home, 8 Backspin), zero remote assets and
  zero audio files. Strict release verification correctly FAILS CLOSED:
  `rights-not-approved`, 11 missing licensed assets.
- `npm run test:perf`: 2/2 PASS; p95 input-to-paint 1.5 ms Chromium / 2.0 ms
  WebKit over 220 events per engine, budget 16.7 ms.
- `npm run copy-web` and brand verification PASS. Sixteen modified/created
  Academy shipping files are byte-identical to their `www/` copies.
- Four protected physics files remain byte-identical to the pre-Batch-0
  baseline: `impact-flight.js` `7e5323c3...`,
  `swing-parameters-and-impact.js` `ae08553b...`, `diagnose-engine.js`
  `9d1b5e83...`, `diagnose-engine-v2.js` `a7515049...`.
- Academy Home captures are committed under `outputs/academy-batch0/`.
  Regeneratable global visreg current captures remain uncommitted.

Batch 0 is **implemented but not accepted**. The owner explicitly authorized
sequential source implementation to continue while these release/acceptance
gates remain fail-closed:

- fresh global visual regression is now 3/3 PASS without changing an approved
  baseline; the earlier transient 0.135% Chromium Lab delta did not reproduce;
- provenance-blind pairwise judgment for Academy Home/voice UI has not run;
- final licensed local audio, voice identity, rights evidence and listening
  gate do not exist yet, so the product remains caption-ready rather than
  Voice-ready;
- physical iPhone/offline/audio-route/background-interruption and manual
  VoiceOver/fatigue checks remain `PENDING OWNER DEVICE/HUMAN GATE`.

Reusable autonomous execution text for later batches is committed at
`docs/flightglass-autopilot/academy-batch-loop-prompt.md`. It requires the loop
to fail external gates closed rather than weaken them.

## Academy Batch 1 implementation checkpoint

Start Line source implementation is complete on `agent/academy-codex` at
`3ba5a83`. The canonical experience and all three legacy concept routes now use
one native six-surface renderer. It includes the engine-backed departure
instrument, Face/Path direct controls, delivered-loft modifier experiment,
three prediction myths, deterministic mastery fixtures and the mandatory
two-phase raw-value transfer. A shared store transaction owns Mastered and the
single 120 XP award; the renderer cannot award either directly.

Fresh implementation evidence on 2026-07-15:

- Start Line model/content tests: 10/10 PASS; seven protected-engine fixtures,
  contribution sums, raw ±0.10° tolerance, near miss and matched-state exception
  are locked.
- Start Line browser contract: 6/6 Chromium and 6/6 WebKit PASS. It proves
  S0–S5 progression, legacy routing/sheets, 4/5 without transfer = Practiced,
  valid transfer = Mastered, deterministic retry, reload and one-time XP.
- `npm run test:academy`: 53/53 foundation plus 71/71 integration/browser PASS.
- Development voice verification: 17 exact captions total, including six Start
  Line cues; zero remote/runtime audio. Strict release remains fail-closed on
  17 missing licensed files and unapproved distribution rights.
- `npm run test:perf`: 2/2 PASS at 1.5 ms Chromium / 3.0 ms WebKit p95, below
  the 16.7 ms budget. `npm run test:visreg`: 3/3 PASS without baseline changes.
- Brand verification and fresh `npm run copy-web` PASS; Start Line shipping
  source and `www/` copies are byte-identical.
- Protected hashes remain unchanged: `impact-flight.js` `7e5323c3...`,
  `swing-parameters-and-impact.js` `ae08553b...`, `diagnose-engine.js`
  `9d1b5e83...`, `diagnose-engine-v2.js` `a7515049...`.

Batch 1 is **source-complete but not release-accepted**. Provenance-blind
pairwise judgment, licensed female voice assets/rights/listening evidence and
physical-device/VoiceOver/fatigue gates remain open. Owner authorization allows
the source loop to continue to Batch 2 without reporting those gates as passed.

## Academy Batch 2 implementation checkpoint

Shape source implementation is complete on `agent/academy-codex` at `7ea653b`.
The canonical Shape route and legacy `spin-axis`/`curve` routes share one native
S0–S5 renderer. Its top-down tunnel measures Curve from the held Launch rail,
not the target line; the guided proof creates straight, left and right flights
with the same +1.0° Launch, while the amplifier proof changes Carry without
changing modeled Spin Axis. The two-capture live gate requires learner-built
left then right Curve with both raw Launch values inside ±0.10°.

Fresh implementation evidence on 2026-07-15:

- Shape model/content: 11/11 PASS, including five protected-engine fixtures,
  every raw transfer near miss, negative-zero normalization, eight cues and
  model/real-world boundary copy.
- Shape browser contract: 4/4 Chromium and 4/4 WebKit PASS. Canonical/legacy
  routes, prerequisite preview, same-start proof, Carry amplifier, boundaries,
  Practiced without live transfer, Mastered with live transfer, reload and
  one-time XP are covered.
- Shape legacy migration preserves either prior concept as Practiced, makes both
  completed concepts review-eligible and never auto-masters.
- Full `npm run test:academy`: 65/65 foundation plus 75/75 integration/browser
  PASS. Development voice verification reports 25 exact captions and no remote
  or runtime audio.
- Brand verification and fresh `npm run copy-web` PASS; all five Shape shipping
  files match `www/`. Protected physics hashes remain unchanged.

Batch 2 is **source-complete but not release-accepted**. Pairwise, licensed
audio/rights/listening and device/human gates remain open and fail-closed. Owner
authorization allows the source loop to continue to Batch 3 Carry Side.

## Academy Batch 3 implementation checkpoint

Carry Side source implementation is complete on `agent/academy-codex` at
`a4d075d`. The canonical `shot-pattern` route and legacy `offline` route share
one native S0–S5 renderer while the learner-visible title remains Carry Side.
Its three-bracket carry-plane instrument keeps Start Side, Curve and Carry Side
distinct; the guided outcome composer is explicitly not an engine solve or a
mastery path. The live gate requires learner-built mirrored engine flights that
start and curve in opposite directions and finish within raw ±0.5 yd.

Fresh implementation evidence on 2026-07-15:

- Carry Side model/content: 12/12 PASS, including seven protected-engine
  fixtures, exact signed decomposition, composer isolation, every raw transfer
  near miss, negative-zero normalization, eight cues and honest one-shot copy.
- Carry Side browser contract: 4/4 Chromium and 4/4 WebKit PASS. Canonical and
  legacy routes, S0–S5 progression, three reference brackets, Practiced without
  live transfer, rounded-display/raw-value rejection, mirrored mastery, reload
  and one-time XP are covered.
- Legacy Offline migration is additive and reviewable but never auto-masters or
  awards XP.
- Full `npm run test:academy`: 78/78 foundation plus 79/79
  integration/browser PASS. Development voice verification reports 33 exact
  captions and zero remote or runtime audio.
- Brand verification and fresh `npm run copy-web` PASS. Visual review at
  430×932 confirms the mission and mastery hierarchy. Protected physics hashes
  remain unchanged.

Batch 3 is **source-complete but not release-accepted**. Pairwise, licensed
audio/rights/listening and device/human gates remain open and fail-closed. Owner
authorization allows the source loop to continue to Batch 4 Up or Down at
Impact.

## Academy Batch 4 implementation checkpoint

Up or Down at Impact source implementation is complete on
`agent/academy-codex` at `4902562`. The canonical `attack-at-impact` route and
legacy `attack-angle` route share a native S0–S5 side-on tangent instrument.
The outcome lab separates clubhead travel, face orientation and ball launch;
the mandatory live gate removes direct Attack control and derives one
descending then one ascending state from the unchanged rigid-circle engine.

Fresh implementation evidence on 2026-07-15:

- Model/content: 13/13 PASS across five protected flight fixtures, six
  protected geometry fixtures, exact per-degree sensitivities, vertical-depth
  invariance, every live provenance/near-miss gate, seven cues and inference
  boundaries.
- Browser contract: 4/4 Chromium and 4/4 WebKit PASS. It covers canonical and
  legacy routes, S0–S5 progression, reduced motion, tangent/loft/launch
  separation, hidden-number mastery, raw near misses, Practiced without live,
  two-sign mastery, reload and one-time XP.
- Legacy Attack Angle completion becomes reviewable Practiced evidence without
  automatic mastery or reward.
- Full `npm run test:academy`: 92/92 foundation plus 83/83
  integration/browser PASS. Development voice verification reports 40 exact
  captions and zero remote or runtime audio.
- Brand verification and fresh `npm run copy-web` PASS. Mission and live gate
  were visually inspected at 430×932. All four protected hashes exactly match
  the pre-batch baseline.

Batch 4 is **source-complete but not release-accepted**. Pairwise, licensed
audio/rights/listening and device/human gates remain open and fail-closed. Owner
authorization allows the source loop to continue to Batch 5 Low Point.

## Academy Batch 5 implementation checkpoint

Low Point source implementation is complete on `agent/academy-codex` at
`3a7d9e2`. The canonical and legacy `low-point` route uses a native S0–S5
event-ruler experience. It distinguishes raw Low Point input from the effective
Low Point derived by the unchanged geometry engine, shows Attack as a secondary
tangent and requires one ball-first and one bottom-first learner-built state.

Fresh implementation evidence on 2026-07-15:

- Model/content: 13/13 PASS across raw/effective compensation, held geometry,
  plane sensitivity, vertical-depth invariance, every live near miss, five
  myths, seven voice cues and the exact mastery contract.
- Browser contract: 4/4 Chromium and 4/4 WebKit PASS. It covers preview and
  legacy routing, S0–S5 progression, reduced motion, raw/effective evidence,
  Practiced without both event orders, Mastered with both, reload and one-time
  XP.
- Full `npm run test:academy`: 106/106 foundation plus 87/87
  integration/browser PASS. Development voice verification reports 47 exact
  captions and zero licensed audio assets.
- The shared voice mount now survives every native renderer update; 22/22
  affected Chromium browser cases pass across Start Line through Low Point,
  including an explicit post-interaction visibility assertion.
- Brand verification and fresh `npm run copy-web` PASS. The mission and live
  event-ruler states were visually inspected at 430×932. All four protected
  physics hashes exactly match the pre-batch baseline.

Batch 5 is **source-complete but not release-accepted**. Pairwise, licensed
female audio/rights/listening and physical-device/VoiceOver/fatigue gates remain
open and fail-closed. Owner authorization allows the source loop to continue to
Batch 6 Contact Height.

## Academy Batch 6 implementation checkpoint

Contact Height source implementation is complete on `agent/academy-codex` at
`3d82aa2`. The canonical and legacy `strike-depth` route now uses a native
close side-on Contact Window while the learner-visible title is Contact Height.
It consumes unchanged `clubBallContact()`, `deriveImpact()` and ground-crossing
authority, distinguishes point-path height from face impact and requires two
raw height windows at one invariant Attack.

Fresh implementation evidence on 2026-07-15:

- Model/content: 14/14 PASS across the nine-state z sweep, exact 1:1
  translation, four-state lift budget, ground-entry order, compensation pair,
  all raw/held/provenance near misses, five myths and seven voice cues.
- Browser contract: 4/4 Chromium and 4/4 WebKit PASS. It covers preview and
  legacy routing, S0–S5 progression, reduced motion, ground/ball-center truth,
  Practiced without live invariance, both raw mastery windows, reload and
  one-time XP.
- Full Academy evidence: 121/121 foundation and 91/91 integration/browser
  PASS. Development voice verification reports 54 exact captions and zero
  licensed audio assets.
- Fresh `npm run copy-web`, byte-parity for all four Contact Height shipping
  assets and brand verification PASS. Mission and live states were inspected
  at 430×932. All four protected physics hashes remain exact.

Batch 6 is **source-complete but not release-accepted**. Pairwise, licensed
female audio/rights/listening and physical-device/VoiceOver/fatigue gates remain
open and fail-closed. Owner authorization allows the source loop to continue to
Batch 7 Delivered Loft & Launch.

## Academy Batch 7 implementation checkpoint

Delivered Loft & Launch source implementation is complete on
`agent/academy-codex` at `76eae59`. The canonical experience and legacy
`dynamic-loft`/`launch-angle` routes share a native three-arrow delivery wedge.
It consumes unchanged `solveFlight()`, keeps FACE/TRAVEL/BALL distinct and
requires two raw equal-Launch states with opposite Attack signs and a wide
Spin Loft gap.

Fresh implementation evidence on 2026-07-15:

- Model/content: 14/14 PASS across base/Loft+4/Attack+4, per-degree
  sensitivities, equal-launch downstream divergence, raw edges, clamp metadata,
  every live provenance condition, five myths and seven voice cues.
- Browser contract: 4/4 Chromium and 4/4 WebKit PASS. Both legacy routes,
  S0–S5, reduced motion, predictions, equal-launch proof, Practiced without
  live, raw near misses, Backspin preservation, reload and one-time XP pass.
- Academy foundation is 136/136 PASS; voice verification reports 61 exact
  captions and zero licensed audio assets. The last full unchanged cross-module
  integration run was 91/91 at Batch 6; Batch 7's affected surfaces were rerun.
- Fresh native packaging, four-file byte parity and brand verification PASS.
  Mission was visually inspected at 430×932. Protected hashes remain exact.

Batch 7 is **source-complete but not release-accepted**. Pairwise, licensed
female audio/rights/listening and physical-device/VoiceOver/fatigue gates remain
open and fail-closed. The full integration matrix is due again at final
convergence. Owner authorization allows Batch 8 Backspin amendment next.

The Backspin 96-97 reference lesson (Phase 6, Tasks 1-11) completed final
verification on 2026-07-14. Task 10 shipped the lesson through the native
package (commit `4d01eef`); Task 11 recorded the evidence below.

Task 11 verification evidence (all runs fresh on 2026-07-14):

- Isolated interrupted case `a non-finite Mastery target input cannot alter
  readouts or receive target credit`: PASS (1/1).
- `npm run test:academy`: 47/47 PASS. `npm run test:ux`: 60/60 PASS
  (includes the new Task 10 packaging and 96-target manifest locks).
- `npm run brand:verify`: PASS. `npm run copy-web`: clean; the five Academy
  assets ship in `www/` and `academy-lesson-v2-mock.html` does not.
- Focused audit `--mode verify --surface academy-lesson --motion both`:
  4 captures, 0 critical findings. Reports:
  `outputs/flightglass-ux/verify--academy-lesson-report.json` / `.md`.
- Full six-surface walk captured and visually inspected at 430x932 and
  375x812 in normal and reduced motion (24 screenshots, 0 runtime errors):
  `outputs/flightglass-ux/verify/task11-surfaces/` (regeneratable local
  evidence; not committed).
- Score audit against the ten v3 rows: all evidence statements true.
  Recorded score 96 with category floor 95 (Content quality, Motivation);
  no critical runtime, content or accessibility defect.
- `impact-flight.js` byte-identical: no working-tree change, untouched since
  pre-Phase-0 history, root and `www/` copies share SHA-256 `7e5323c3…`.
- Storage key `strikearc.academy.v1` migrates without loss: covered by the
  journey migration suite (legacy deep-merge, idempotent attempt commit) and
  the legacy Carry reward regression test.
- Deferred, outside the exit contract: generalization of the remaining 23
  lessons (explicit rollout boundary) and the instrument-law hardening now
  ordered in `docs/superpowers/plans/2026-07-14-instrument-gates.md`.

## Instrument gates (Tasks 12-20) verification

The instrument-law hardening (work order
`docs/superpowers/plans/2026-07-14-instrument-gates.md`) completed its evaluation
gate on 2026-07-15. Protocol delivery format below.

**Evidence checklist — 17/17 EV requirements PASS across three independent blind
judges.** Decorrelated runs against the locked manifest
`config/evidence/instrument-laws.json`, each blind (manifest + artifact paths
only, no target or history): judge-run-1 17/17 PASS; judge-run-2 17/17 PASS;
judge-run-3 17/17 PASS -> 3/3 consistency, every requirement confirmed.
Records: `outputs/flightglass-eval/judge-run-{1,2,3}.json`.

**Gate totals (fresh from one clean process, 2026-07-15):**
- `npm run claude:ready`: primary suite 83/83 PASS plus WebKit 41/41 PASS
  (124/124 total), brand and autopilot verification PASS, 11 control files and
  7 protected identifiers verified, EXIT 0.
- `npm run test:perf`: 2/2 PASS; p95 input-to-paint 3.2 ms Chromium / 5 ms
  WebKit over 220 events per engine (budget 16.7 ms), EXIT 0.
- `npm run test:visreg`: 2/2 PASS; 48/48 fresh captures within 0.1% of 48
  approved baselines across both engines, both viewports and both motion modes,
  EXIT 0. EV-REG-01's capture-timing race was hardened in the test method,
  never the locked manifest.
- `npm run copy-web`: 19 top-level JS/CSS assets plus declared HTML/directories
  rebuilt, EXIT 0. Focused Academy verify: 4 captures, 0 critical findings,
  EXIT 0. Raw evidence: `outputs/flightglass-eval/final-gates/`.

**Critical defects:** none. All 10 critical manifest requirements PASS in each
of the three judge runs. axe-core reports 0 critical/serious on all six
surfaces (EV-NAT-02); the focused audit reports no runtime, content, target-size,
overflow or clipping failure.

**Category floors:** 5/5 PASS independently: accessibility, motion, truth,
information architecture and mobile. No category-specific critical defect.
Record: `outputs/flightglass-eval/category-floor-verdict.json`.

**Pairwise blind vs the previous generation:** new native won 4/4 comparisons.
The provenance-blind choices were pair 1 B (new Mission), pair 2 A (new Lab),
pair 3 B (new Mastery) and pair 4 A (new Result). Hash comparison against the
human-pack and `pairwise-src/old/` establishes that every chosen image is the new
native generation. Record: `outputs/flightglass-eval/pairwise/pairwise-result.json`.

**Acceptance tier: STUDIO-GRADE.** All four acceptance gates are green: zero
critical defects, 5/5 category floors, all 10 critical checks PASS (17/17 total)
and pairwise blind won 4/4. `derive-score.mjs --pairwise-won` independently
produces `{tier:STUDIO-GRADE, score:100, criticalFailures:[], findings:[]}` for
judge runs 1, 2 and 3. The score is a derived byproduct and tripwire; it did not
decide acceptance. Records: `outputs/flightglass-eval/derived-run-{1,2,3}.json`.

**Non-blocking finding:** Result repeats the Launch Angle destination in its
content card and sticky action. The independent blind judge still selected the
new Result because the two controls share one destination and the learning
hierarchy remains stronger. Carry this as a future refinement; it is not a
critical defect or a competing task.

**Compatibility:** `impact-flight.js` byte-identical, root and `www/` share
SHA-256 `7e5323c3b5c553a4d6cc12177687256d61e16f5429c9a17df1fb49911261cb26`;
no physics engine has a working-tree diff; protected IDs unchanged.

**Human checkpoints remaining (§6, outside autonomy):** physical-iPhone drag
perf session, manual VoiceOver walkthrough, 5-second blind test with >=5 people,
release authorization. The handoff package is committed under
`outputs/flightglass-eval/human-pack/`; these checks do not block later Academy
loop iterations that already have approved plans/specs.

## Academy completion loop

`docs/flightglass-autopilot/academy-completion-loop.md` now governs the Academy
sequence. The required plan/spec inventory was completed and checked on
2026-07-15:

- Batch 0 has the dedicated native Academy Home/store migration design and
  implementation plan.
- Batches 1-13 cover the 13 core outcome experiences, including the accepted
  Backspin base plus its compatibility amendment.
- Batch 14 is the optional Plane Coupling MODEL LAB and cannot affect core
  completion, XP or recommendations.
- All 24 legacy topic IDs have one owner and retain migration/deep-link
  compatibility.
- Every batch has an exact specification/implementation-plan pair in
  `docs/superpowers/plans/2026-07-15-academy-outcome-curriculum-rollout.md`.

The loop may now execute the accepted batches sequentially without
module-by-module owner approval. It must still stop for the rollout index's
explicit escalation conditions and preserve all release/device/human gates.

## Academy outcome-curriculum planning checkpoint

The owner explicitly authorized an uninterrupted end-to-end planning pass on
2026-07-15. This pass may make and document curriculum/design decisions without
module-by-module approval, but it does not authorize production-code or
physics-engine changes.

Completed at this checkpoint:

- normative curriculum blueprint with 24/24 stored topic IDs assigned exactly
  once to 13 core experiences plus one optional advanced model lab:
  `docs/superpowers/specs/2026-07-15-academy-outcome-curriculum-blueprint.md`;
- Start Line specification, owning `face-angle`, `club-path` and
  `start-direction`:
  `docs/superpowers/specs/2026-07-15-academy-start-line-design.md`;
- Shape specification, owning `spin-axis` and `curve`:
  `docs/superpowers/specs/2026-07-15-academy-shape-design.md`;
- Carry Side integration specification, owning `offline`:
  `docs/superpowers/specs/2026-07-15-academy-shot-pattern-design.md`.

Critical naming correction: `shot-pattern` remains the canonical internal
experience ID, but the learner-visible outcome is **Carry Side**. One
deterministic simulated shot is not a statistical shot pattern or dispersion.

The three direction experiences include exact S0-S5 copy, interactions,
voice/caption behavior, engine-verified fixtures, causal roles, truth labels,
accessibility, migration semantics, mastery gates and acceptance evidence.
Start Line, Shape and Carry Side fixtures were generated from the unchanged
`solveFlight()` implementation. `impact-flight.js` has not been edited.

Strike/contact completed at the next checkpoint:

- Up or Down at Impact, owning `attack-angle`:
  `docs/superpowers/specs/2026-07-15-academy-attack-at-impact-design.md`;
- Low Point:
  `docs/superpowers/specs/2026-07-15-academy-low-point-design.md`;
- Contact Height, retaining canonical ID/legacy concept `strike-depth`:
  `docs/superpowers/specs/2026-07-15-academy-strike-depth-design.md`;
- optional Plane Coupling MODEL LAB:
  `docs/superpowers/specs/2026-07-15-academy-plane-coupling-lab-design.md`.

Contact Height replaces “Strike Depth” as the learner-visible outcome because
the engine input is vertical arc height while the learner outcome is modeled
point-path height at the ball. It is explicitly not face Impact Height or
literal divot depth. Plane Coupling stores exploration outside core mastery and
never blocks a journey or awards a core reward.

The frozen strike/contact fixtures pass against the unchanged
`swing-parameters-and-impact.js` implementation, including Low Point/plane
sensitivities, exact z-to-contact-height translation, Attack invariance and
raw-to-effective Low Point compensation.

Launch/spin/descent completed at this checkpoint:

- Delivered Loft & Launch, owning `dynamic-loft` and `launch-angle`:
  `docs/superpowers/specs/2026-07-15-academy-delivered-loft-launch-design.md`;
- Backspin curriculum/voice amendment, preserving the accepted Backspin
  instrument while assigning it `spin-loft` and `backspin`:
  `docs/superpowers/specs/2026-07-15-academy-backspin-curriculum-amendment.md`;
- Flight Height & Descent, owning `apex` and `landing-angle`:
  `docs/superpowers/specs/2026-07-15-academy-flight-height-descent-design.md`.

This family explicitly distinguishes definitions, current-model causality and
real-world ball flight. Dynamic Loft is the dominant direct per-degree Launch
input in the current linear transform; Attack is smaller but material. Spin
Loft is taught in Backspin. Current-engine Backspin rpm does not feed Carry,
Apex or Landing, so Backspin mastery must not claim it caused those outputs.
Flight Height & Descent keeps Launch's direct and Apex-mediated paths separate,
defines both measurements at equal elevation and does not equate Landing Angle
with stopping distance.

Ten normative flight fixtures and the same-Apex/different-descent transfer pair
pass against the unchanged `solveFlight()` equations. Official TrackMan
definitions for Dynamic Loft, Launch Angle, Spin Loft and Landing Angle were
rechecked on 2026-07-15. `impact-flight.js` remains unedited.

Speed/distance and playing conditions completed at this checkpoint:

- Speed Transfer, owning `club-speed`, `smash` and `ball-speed`:
  `docs/superpowers/specs/2026-07-15-academy-speed-transfer-design.md`;
- Carry, owning `carry` and `total`:
  `docs/superpowers/specs/2026-07-15-academy-carry-design.md`;
- Air Density, owning `altitude` and `temperature`:
  `docs/superpowers/specs/2026-07-15-academy-air-density-design.md`;
- Wind:
  `docs/superpowers/specs/2026-07-15-academy-wind-design.md`.

These specifications correct four legacy truth failures: Smash is a speed
ratio/model output rather than a percent-energy or centeredness diagnosis;
current Carry consumes Ball Speed only and exposes its real-world launch/spin
omission; Altitude and Temperature combine through one EST density proxy rather
than earning duplicate causal credit; and Wind Drift is added after the
engine's existing Carry Side instead of replacing Start Line plus Curve.

The four families include exact S0-S5 copy, native interaction and visual
direction, DFII review, voice synchronization, migration, accessibility,
mandatory live gates and frozen numeric fixtures. Speed, Carry, air and wind
fixtures all pass against the unchanged flight equations and documented
post-solve estimates. Official TrackMan definitions/normalization guidance and
NOAA atmosphere context were rechecked on 2026-07-15. `impact-flight.js`
remains unedited.

All 24 stored topic IDs now have one completed experience-level design owner.

Cross-curriculum specification acceptance completed at the next checkpoint:

- `docs/superpowers/specs/2026-07-15-academy-cross-curriculum-acceptance-audit.md`;
- 24/24 concept IDs have exactly one owner with no duplicate or orphan;
- all 14 experience documents retain the required structure;
- 99 authored voice cues are within the 12–24-word budget and each experience
  remains at or below eight cue signatures;
- 297 fresh numeric assertions pass against the unchanged flight and geometry
  engines across direction, strike, launch, descent, speed, carry, air and wind.

The audit found and corrected a stale Wind specification fixture: Dynamic Loft
30° uses the current 0.7500 face weight, producing Start Direction +0.2500° and
engine Carry Side +13.4326 yd before wind. It also clarified the voice contract:
one automatic entry line per surface, with only rare first-time consequence or
recovery cues under an eight-signature experience budget.

The audit decision is specification PASS for implementation planning, not
production acceptance.

The complete planning program is now **ACCEPTED / READY FOR BATCH 0**:

- shared Academy Home/store/registry/router/voice/store migration design and
  task plan are complete;
- the shared Voice System now has its own normative design and TDD-first
  implementation plan covering Control Room character, first-use consent,
  12–24-word cues, captions, Replay, Voice Off, semantic screen beats,
  repetition suppression, local assets and future pack boundaries;
- every one of the 14 experience rows has a dedicated sequential
  implementation plan;
- the final rollout index pairs all 15 batches with exact authoritative
  artifacts, execution order, TDD loop, stop conditions, acceptance gates,
  regressions and Claude Code handoff;
- `docs/flightglass-autopilot/academy-completion-loop.md` now starts Batch 0 and
  proceeds automatically between accepted batches.

No production source or protected physics engine changed during planning. The
next action is Batch 0 only: implement the shared native Home/store host from
its exact spec/plan pair and execute the mandatory Voice System companion plan
inside that batch, collect fresh gate evidence, commit/push acceptance, then
continue to Batch 1.

Voice planning verification completed fresh on 2026-07-15:

- Home spec/plan, rollout index, completion loop, STATUS and handoff all point
  to both dedicated Voice System artifacts;
- implementation plan contains the required executable-plan header, exact
  Goal/Architecture/Tech Stack, Tasks 1–10 and explicit staging commands;
- independent parsing of all 14 experience voice tables confirms 99 cues,
  zero outside 12–24 words and a maximum of eight per experience;
- `git diff --check` and the intended-document secret scan PASS;
- intended diff is documentation-only with no protected physics file diff;
- `npm run test:academy`: 59/59 PASS, 0 failed, 0 skipped in 168.9 seconds.

## Parked refinements (non-blocking, reference-shell polish)

Optional polish on the Backspin reference shell. None affects the STUDIO-GRADE
tier or blocks the rollout; carry them into a future refinement round because the
23 downstream lessons inherit this shell. Owner-authorized 2026-07-15 to park.

- **Mastery Check surface density and affordance.** A second blind judge (this
  session's pairwise) preferred the previous-generation quiz on pair-3, citing a
  large empty lower half of the card when the question is short and answer
  options that read as centered text rather than radio controls. The
  consolidated 4/4 pairwise still net the surface as a win, so it is a polish
  item, not a defect: fill the card's lower region and give answers a clear radio
  affordance, then re-judge pair-3. Evidence:
  `outputs/flightglass-eval/pairwise/pair-3/B.png`.
- **Result surface destination repetition** (already noted above): the content
  card and sticky action name the same Launch Angle destination. Consolidate to a
  single destination in a future pass.

## Phase 0 evidence

- Baseline: 40 captures across 10 surfaces, normal and reduced motion.
- Automated findings: 4 critical state occurrences and 48 improvement flags.
- The only critical surface is Geometry 3D. Its four viewport/motion states
  share one root cause: missing `/vendor/three/build/three.module.js`.
- Compare's browser-generated `/favicon.ico` probe is correctly excluded from
  product findings.
- Machine report: `outputs/flightglass-ux/baseline-report.json`.
- Human-readable report: `outputs/flightglass-ux/baseline-report.md`.
- Control package tests: 11 passing.
- Focused phase reports use separate filenames and cannot overwrite the full
  baseline report.

## Derived indicator ledger

Scores are derived byproducts and tripwires, never targets. Acceptance per
surface is the four evidence gates: zero critical defects, every category floor
cleared, all critical checks pass, and pairwise-blind won against the previous
generation. The "expected derived score" column is what typically falls out once
the gates pass — a lower figure with all gates green still ships.

| Surface | Current derived indicator | Expected derived indicator |
|---|---:|---:|
| Home | 67 | 90+ |
| Impact / Range | 63 | 90+ |
| Visualise | 81 | 90+ |
| Outcome | 72 | 90+ |
| Compare / Ghosts | 78 | 90+ |
| Geometry 3D | 74 | 90+ |
| Strike Window 2D | 82 | 90+ |
| Academy overview | 70 | 90+ |
| Academy lesson | 96 | 96-97 |
| Paywall | 76 | 90+ |
