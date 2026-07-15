# Flightglass autonomous execution status

Updated: 2026-07-15

Release authorization: granted for GitHub, Vercel and configured Apple/Google
publication after all Phase 8 gates pass. See `RELEASE-AUTHORIZATION.md`.

| Phase | State | Evidence |
|---|---|---|
| 0 - QA baseline and control package | Complete | 40-state baseline, 11 contract tests, brand and handoff verifiers |
| 1 · Home / Floodlights | Ready | Decisions and references locked in master plan |
| 2 · Range / Visualise | Ready | Decisions and references locked in master plan |
| 3 · Outcome / Compare | Ready | Decisions and references locked in master plan |
| 4 · Geometry 3D / Strike Window 2D | Ready | Consensus documents named |
| 5 · Academy overview | Planned / ready for implementation | Native Home/store/registry/router/voice migration has an accepted design, task plan and Batch 0 handoff |
| 6 · Academy lesson system | Backspin STUDIO-GRADE; full curriculum implementation-ready | 13 core experiences plus one optional MODEL LAB have complete spec/plan pairs, cross-audit and sequential rollout index; no new production implementation started |
| 7 · Paywall | Ready | Pricing and compatibility rules locked |
| 8 · Convergence and release QA | Ready | Global gates locked |

## Current checkpoint

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
