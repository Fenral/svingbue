# Flightglass session handoff

Updated: 2026-07-15

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
voice pack contains 102 exact local captions and zero licensed audio assets.

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

This branch is source-complete, **not release-accepted**. The next agent must not
describe the female voice as recorded or shipped: voice direction and cue timing
exist, while licensed recordings, rights evidence and human listening approval
do not. The Backspin reference visual baseline is accepted, but the new
curriculum modules have not received their own provenance-blind pairwise
judgments and must not be labelled STUDIO-GRADE from automated tests alone.
Physical-device, offline, audio-route, VoiceOver and fatigue checks remain open.

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
