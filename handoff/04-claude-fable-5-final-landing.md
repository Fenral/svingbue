# Flightglass handoff 04 - Claude/Fable 5 final review and landing

Date: 2026-07-21
Branch: `engine/physics-3d-spin-recal`
Worktree: `.worktrees/physics-3d-spin`
Protected engine commit: `5dae98f942b488e7cfab19b0a96b63631750db38`
Upstream: `origin/engine/physics-3d-spin-recal`
Current state: the protected engine/test/handoff scope is committed and pushed to the named upstream branch. No PR, merge, deployment or generated-asset mutation has been performed.
The branch tip may include this later documentation-only publication-state correction; the immutable protected physics boundary is the engine commit named above.

## Owner authorization and Claude's assignment

The owner's instruction on 2026-07-21 is the explicit authorization for Claude/Fable 5 to finish this work: verify the published engine-only branch, synchronize the mechanically stale Academy contracts on a separate integration branch if that is required for merge, and land the fully verified result through the normal PR/CI route. No second owner approval is required inside the gates below. This authorization does **not** permit a direct or forced push to `main`, a deployment, a physics redesign, relaxed acceptance, or a change to the protected 3-D/aerodynamic module.

First review the published recalibration at the protected engine commit and resolve only issues that fit the locked engine-only scope below. Keep `engine/physics-3d-spin-recal` engine-only. If full-green integration requires Academy synchronization, do that on a new integration branch as specified in the landing protocol; never rewrite or mix it into the protected physics commit.

Write the complete result, including commit hashes, remote refs, test evidence, remaining REDs and the verified merge state, to `handoff/04-claude-fable-5-final-landing-response.md`. This response is the one permitted new path after the published scope is validated; include it explicitly in later staged-scope review. Do not leave the answer only in terminal output; the owner reads the repository handoff channel.

## Fable 5 owns the final technical decision

Fable 5 is the final technical decision-maker for this landing inside the authorized boundaries in this handoff. Do not return ordinary implementation choices to the owner merely because more tuning is theoretically possible. Inspect the evidence, make the remaining bounded choices, finish the work, and decide whether the integrated result is sufficiently accurate, coherent and stable to land.

The target is **honest product adequacy**, not an impossible claim of perfect professional-launch-monitor accuracy. A model is good enough to land when:

1. every required engine, integration and repository gate passes without weakened tests, widened tolerances or hidden exceptions;
2. the verified 3-D geometry, centered-strike convention and existing accepted behavior have not regressed;
3. the remaining error is bounded by the available validation evidence and is unlikely to present a normal user with an obviously contradictory ball flight;
4. every empirical bridge is still labelled `ESTIMATE`, and no sparse fit is promoted to first-principles truth;
5. the remaining limitations are understood, recorded and accepted as non-blocking for this product version rather than silently ignored.

At the end, write exactly one of these verdicts near the top of the response file:

- `FINAL VERDICT: GOOD ENOUGH TO LAND`
- `FINAL VERDICT: NOT GOOD ENOUGH TO LAND`

For `GOOD ENOUGH TO LAND`, explain why the remaining limitations do not create a misleading normal-use result, then complete the authorized commit/push/integration/PR/merge protocol. Do not stop at "merge-ready." For `NOT GOOD ENOUGH TO LAND`, identify a concrete failing gate or user-visible contradiction, make every safe in-scope attempt to resolve it first, and leave exact reproduction evidence. Vague discomfort, the possibility of future refinement, or lack of pro-grade exactness is not sufficient reason to defer the decision.

The final response must include a section titled `Known limits accepted at landing` that explicitly evaluates, rather than merely repeats, at least these current limits:

- sparse composite TrackMan calibration and assumed Dynamic Loft inputs;
- empirical longitudinal Carry/Apex/Landing rather than validated full RK4 longitudinal flight;
- no useful-spin response in Carry at matched Ball Speed and Launch;
- deferred lift saturation and the protected high-spin RK4 over-carry tail;
- the `0 -> 32 deg` displayed-Landing transition immediately above the no-flight boundary;
- `physical.inDomain` remaining true for some negative-launch states;
- tiny raw RK4 launch-height artifacts while shipping no-flight fields are zero;
- retained Carry projection, target-side approximation and pre-existing extreme-domain lateral gaps;
- centered strike only in shipping `solveFlight`; gear effect remains a separate, unapplied mechanism.

For each limit, classify it as `ACCEPTED FOR THIS VERSION` or `BLOCKS LANDING`, state the evidence, and name the user-visible consequence. Fable owns this final classification. A limit may be accepted only when it is disclosed, does not invalidate the validated normal-use envelope, and has no failing mandatory gate.

The recommended technical verdict is **KEEP**. The last change closes a real domain contradiction without adding a fit coefficient: a shot with zero Carry and Total can no longer report a nonzero shipping Apex, Landing, Curve or Side. It reuses Carry's existing low-launch efficiency for Apex and uses an explicit no-flight guard for Landing, rollout and shipping lateral output. Independent review found no safer spin-response or integrator migration that is identified by the current data.

Read `handoff/03-engine-audit-response.md` first. It contains the full TrackMan source audit, fit/holdout construction, before/after bag table, Academy incompatibility analysis and prior full-suite capture. This file is the final delta and landing protocol; where its Apex figures differ, this file supersedes handoff 03.

## Locked scope and owner decisions

These are hard constraints, not suggestions:

1. On `engine/physics-3d-spin-recal`, do not edit `flightglass-3d-spin-model.js`, any UI file, any Academy model/content/test/fixture/gate, generated media, or fixed TrackMan bands.
2. Do not widen a tolerance, turn an exact assertion into an approximate one, or move a mastery target to manufacture green.
3. Do not fit implementation constants to the six holdout clubs. Holdouts are validation-only.
4. Do not promote the current raw RK4 longitudinal result or remove the retained Carry projection in this pass. Either change would need independent aero validation and explicit lateral-migration authority.
5. Any further production correction must begin with a focused failing real-code regression, demonstrate the expected reason for RED, then make the minimum GREEN change.
6. Preserve all intended work already in this shared worktree. Do not reset, stash, overwrite, amend or revert another agent's changes.
7. Do not make any further engine commit or push until the review gates pass. The owner has authorized normal non-force updates to this named engine branch when a RED-first review correction requires one. Merge is authorized only through the separate, full-green integration protocol below; never push directly to `main`.

## Exact protected engine commit scope

Commit `5dae98f942b488e7cfab19b0a96b63631750db38` contains exactly this scope relative to its parent:

| Status | Path | Purpose |
|---|---|---|
| M | `impact-flight.js` | Full five-input TrackMan recalibration from handoff 03 plus the final no-flight coherence guard |
| M | `package.json` | Honest driver-reference rename, TrackMan acceptance, and domain-coherence test wired into engine gates |
| D | `scripts/engine-driver-acceptance.mjs` | Replaced by honestly named orphan reference harness |
| D | `scripts/engine-driver-acceptance.test.mjs` | Replaced by honestly named orphan reference test |
| M | `scripts/impact-flight-3d-spin.test.mjs` | Recalibrated exact pins; final pass changes one low-loft Apex value exactly |
| M | `scripts/impact-flight-calculated-spin.test.mjs` | Handoff-03 calculated-spin expectation/provenance updates |
| A | `scripts/driver-flight-reference.mjs` | Renamed orphan reference harness |
| A | `scripts/driver-flight-reference.test.mjs` | Renamed reference-only acceptance test |
| A | `scripts/engine-trackman-acceptance.test.mjs` | Fixed-band six-fit/six-holdout shipping acceptance |
| A | `scripts/impact-flight-domain-coherence.test.mjs` | Exact zero, negative and barely-positive launch regressions |
| A | `handoff/03-engine-audit-response.md` | Complete recalibration/audit evidence |
| A | `handoff/04-claude-fable-5-final-landing.md` | This final review and landing contract |

There must be no Academy, UI, `flightglass-3d-spin-model.js`, source-data or generated-asset diff. The two deletes plus two adds are an intentional provenance rename; do not restore the misleading `engine-driver-acceptance` name.

The final-pass delta within that larger committed scope is narrower:

- `impact-flight.js`: define `hasFlight` from positive Carry; apply the already-existing `carryLaunchEfficiency` to both live Apex terms; make those terms sum exactly to shipping Apex; expose `landingDomainTerm` so the Landing ledger remains exact; suppress displayed Landing, rollout fraction and shipping projected Curve when there is no flight. Raw RK4 audit fields remain available.
- `scripts/impact-flight-domain-coherence.test.mjs`: new real-engine regressions for negative, exact-zero and barely-positive launch.
- `scripts/impact-flight-3d-spin.test.mjs`: mechanically update only the low-loft exact Apex pin from `32.57303385522668` to `31.4161628586604`; no tolerance changed.
- `package.json`: include `scripts/impact-flight-domain-coherence.test.mjs` in `test:engine`.
- This handoff.

## Why this final change is defensible

The public Impact controls permit Dynamic Loft `0..50 deg` and Attack Angle `-15..15 deg`. Before this fix, a valid slider state could have zero Carry and zero Total but still claim roughly 19 yards of Apex, a 42-degree Landing angle, and a tiny nonzero shipping bend. A barely-positive launch could claim almost 20 yards of Apex over only 8 yards of Carry.

The fix adds no coefficient and does not use a holdout result. Carry already owns a continuous low-launch efficiency:

`sqrt(clamp(max(0, Launch) / 10, 0, 1))`

Apex now uses that same domain factor. Landing and shipping lateral extent use the already-derived `hasFlight` predicate. The returned diagnostic decomposition remains single-source-of-truth:

- `apexBallSpeedTerm + apexLaunchTerm === apex`
- `landingBase + landingSpinTerm + landingLaunchTerm + landingApexTerm + landingDomainTerm === landingRaw`

This is not merely a one-point edge correction. A consumer grid audit found the Apex guard active for about **28.1%** of the sampled Impact loft/attack grid because those states have modeled Launch below 10 degrees. That broader effect is intentional and disclosed. The normal default has Launch above 10 degrees and is unchanged. The Driver and 3-wood TrackMan anchors are below 10 degrees and improve slightly; all six holdouts are above the guard's modeled threshold and remain bit-identical.

## Strict RED/GREEN evidence

Production was changed only after two focused, expected failures against the real `solveFlight` path.

### Cycle 1 - shipping domain contradiction

Command:

```powershell
node --test --test-concurrency=1 scripts/impact-flight-domain-coherence.test.mjs
```

Initial file contained the negative and barely-positive boundary scenario.

- RED: **0/1 passed**, TAP `98.5497 ms`.
- Expected failure: grounded Apex had to be exactly `0`; actual was `19.21161237125543` yards.
- Minimum production change: reuse Carry's launch efficiency for Apex and guard no-flight Landing/Curve.
- GREEN: **1/1 passed**, TAP `77.2354 ms`.

A broader focused run then passed every invariant except one exact low-loft snapshot: **59/60 passed**. Expected old Apex `32.57303385522668`, actual new coherent Apex `31.4161628586604`. The exact expected number was refreshed; its assertion and tolerance were not loosened.

### Cycle 2 - live diagnostic reconciliation

The test was extended before production to require both exposed decompositions to sum exactly.

- RED: **0/1 passed**, TAP `111.6991 ms`.
- Expected failure: the old live Apex terms still summed to `19.21161237125543` while guarded Apex was `0`.
- Minimum production change: scale the two returned Apex terms themselves and add an explicit `landingDomainTerm` rather than hiding a nonzero base/spin sum behind a zero display.
- GREEN: **1/1 passed**, TAP `88.2422 ms`.

An independent final review then requested an exact `Launch === 0` pin. It passed on its first run against the already-green production guard and required no production edit. It is deliberately reported as a postcondition regression, not misrepresented as another RED cycle. The current domain file has **2/2** passing tests.

## Exact boundary evidence

### Negative launch, valid public-slider state

Input: `{ clubSpeed:100, dynamicLoft:0, attackAngle:-15, faceAngle:3, clubPath:0 }`

| Metric | Before final guard | After final guard |
|---|---:|---:|
| Launch | `-3.75 deg` | `-3.75 deg` |
| Ball Speed | `147.7182588559 mph` | unchanged |
| Carry / Total | `0 / 0 yd` | `0 / 0 yd` |
| Apex | `19.2116123713 yd` | `0 yd` |
| Landing / raw Landing | `42.3191829541 / 42.3191829541 deg` | `0 / 0 deg` |
| shipping Curve / Side | `3.2390898186e-9 / 3.2390898186e-9 yd` | `0 / 0 yd` |
| Apex live terms | nonzero terms hidden behind no guard | `0 + 0 = 0 yd` |
| Landing domain term | absent | `-42.3191829541 deg` |

The impact solve remains live: spin loft is `15.2903041323 deg`, total spin is `2865.2979601064 rpm`, and spin axis is `11.0518956664 deg`.

### Exact zero launch with nonzero impact physics

Input: `{ clubSpeed:100, dynamicLoft:0, attackAngle:0, faceAngle:3, clubPath:0 }`

- Launch is exactly `0`.
- Carry, Total, Apex, raw/display Landing, shipping Curve, `curveFromLaunchLineM`, Side, rollout fraction and Roll are all exactly `0`.
- Ball Speed is `152 mph`, total spin is `568.5678355789 rpm`, and spin axis is `90 deg`; the guard does not erase impact physics.
- `rawCurveFromLaunchLineM` remains `7.4281036134e-7 m`. This tiny raw RK4 launch-height artifact is intentionally retained for audit and must not be described as zero.

### Barely positive launch

Input: `{ clubSpeed:100, dynamicLoft:0.1, attackAngle:-0.3, faceAngle:0, clubPath:0 }`

| Metric | Before final guard | After final guard |
|---|---:|---:|
| Launch | `0.0121012318 deg` | unchanged |
| Spin Loft | `0.4 deg` | unchanged |
| Carry / Total | `8.1406958411 / 8.5884341123 yd` | unchanged |
| Apex | `19.7831915063 yd` | `0.6881944171 yd` |
| Apex terms | unreconciled | `0.6876825644 + 0.0005118526 = 0.6881944171 yd` |
| raw/display Landing | `12.7953307108 / 32 deg` | unchanged |
| Landing domain term | absent | `0` |

The remaining `0 -> 32 deg` displayed-Landing jump immediately above the boundary is a known clamp-policy gap, documented below. Do not broaden this pass to change it.

## TrackMan and holdout effect

The candidate was chosen from domain coherence, not fitted against a reference or holdout. Validation after implementation shows:

- Driver modeled Launch is `9.758708 deg`. Apex moves `35.772009 yd` (`+2.206%`) to `35.337800 yd` (`+0.965%`) against the `35 yd` anchor.
- 3-wood modeled Launch is `9.981760 deg`. Apex moves `33.852252 yd` (`+5.788%`) to `33.821365 yd` (`+5.692%`) against the `32 yd` anchor.
- The other four fit rows have modeled Launch at or above 10 degrees and are unchanged.
- Fit Apex mean absolute error improves from `4.481944%` to `4.259091%`; maximum remains `7.869823%`.
- All six holdout rows are unchanged for every output. Holdout Apex mean/maximum remain exactly `3.240158% / 6.637358%`.
- Carry, Ball Speed, Smash, Spin, Launch, Landing, Total and all lateral metrics are unchanged across all 12 rows.
- Fit and holdout still have no RED TrackMan chip. The literal bands in `engine-trackman-acceptance.test.mjs` are unchanged.

Do not update handoff 03's historical before/after table throughout. This section is the exact final Apex delta and supersedes only those final Apex figures.

## Rejected alternatives

### Shipping spin-responsive Carry

A matched-speed/matched-launch real-engine probe exposes a genuine limitation:

- Both shots: `171 mph` Ball Speed and `10.4 deg` Launch.
- Low spin: `1709.49 rpm`; useful spin: `2648.90 rpm`.
- Shipping Carry is exactly `276.49961781861174 yd` for both.

Independent solvers agree the useful-spin shot should carry farther, but they do not identify a safe magnitude. Promoting the current unscaled RK4 result would make 5/6 fit rows and 5/6 holdouts RED. Fit Carry errors would become `-1.66, +6.40, +11.58, +18.95, +22.90, +17.67%`; holdouts `+7.40, +4.47, +7.89, +9.39, +14.90, +20.31%`. A hybrid needs a new arbitrary coefficient and also changes lateral projection. Keep the limitation documented; do not ship such a change here.

### Changing the protected aero/lift bridge

The high-spin tail needs independently validated `Cd/Cl(Re, spin)` behavior and lift saturation. That belongs in a separately authorized 3-D/aero migration. It is forbidden in this landing pass.

## Final verification evidence

The following evidence is current **after** the exact-zero regression was added:

| Command | Result | Timing |
|---|---|---:|
| `node --test --test-concurrency=1 scripts/engine-trackman-acceptance.test.mjs scripts/impact-flight-domain-coherence.test.mjs scripts/impact-flight-3d-spin.test.mjs scripts/flightglass-3d-spin-model.test.mjs` | **PASS 47/47** | TAP `446.611 ms`; wall `0.7 s` |
| `npm run test:engine` | **PASS 62/62** | TAP `4911.7824 ms`; wall `6.2 s` |
| formula verifier within `test:engine` | **PASS, 0 hits** | 28 Academy files, 9 deleted signatures |
| five affected Academy model suites | **expected FAIL: 8/38 pass, 30 fail** | TAP `606.2031 ms` |
| `git diff --check` | **PASS** | line-ending notices only; no whitespace error |
| `git diff -- flightglass-3d-spin-model.js` | **empty** | protected file unchanged |
| protected SHA-256 | `A602805F618C1C1489AD7C7CACC67771A92F29D6B0EC4C1CDC8A18107A8B5DF5` | byte-identical |

The compact 47-test gate includes the fixed TrackMan fit/holdout checks, five-field identity, square-flight zeros, exact geometry, protected 3-D module suite, exact recalibrated pins, negative/zero/barely-positive launch, and live ledger reconciliation.

The focused Academy split remains exactly:

| Suite | Failures |
|---|---:|
| Backspin | 9 |
| Carry | 4 |
| Delivered Loft & Launch | 6 |
| Flight Height & Descent | 7 |
| Speed Transfer | 4 |
| **Total** | **30** |

No Academy file changed on the engine branch. Handoff 03 explains every incompatibility and why fixture/predicate migration was prohibited during physics recalibration. The owner's final-landing instruction now permits a mechanically justified Academy synchronization only on the separate integration branch described below.

### Full-suite baseline is not fresh

Do not claim a current full `npm test` pass. The last full command was captured before this final domain guard: engine passed `60/60`, then the sequential UX stage failed on the known Academy contracts; Foundation and WebKit were skipped by `&&`. It exited 1 after `692.563 s`, with 14 visible browser tests around 30.76-31.64 seconds. The full command was not repeated after this coefficient-free guard because it takes roughly 11.5 minutes and cannot become green while the engine branch deliberately preserves those stale Academy contracts. Treat that capture as a prior baseline, not fresh evidence.

The engine branch is committed and pushed with this explicitly documented downstream RED, but it must not be merged directly to `main`. The authorized integration stage must synchronize the stale Academy contracts on a separate branch and produce a fresh full-suite result. Do not invent a waiver or weaken Academy tolerances to satisfy it.

## Known, non-blocking model limits

These are disclosed limits, not permission to widen this pass:

- The shipping longitudinal path is an **ESTIMATE** calibrated against a sparse composite TrackMan table. It is not a first-principles flight claim.
- About 28.1% of the sampled Impact loft/attack grid uses the sub-10-degree Apex guard. This is meaningful consumer surface area, not a rare numerical corner.
- `impact-outcome.js` still defines `physical.inDomain` from positive spin loft. A negative-launch solve can therefore remain `inDomain: true`; domain semantics were not changed.
- Displayed Landing jumps from `0` at no flight to the existing `32 deg` minimum immediately above the boundary.
- Raw RK4 audit diagnostics can retain tiny nonzero launch-height artifacts when shipping Carry/Curve/Side are zero. Shipping fields and raw audit fields have intentionally different roles.
- Carry still has no useful-spin response at matched Ball Speed and Launch. Correct direction is known; a validated magnitude is not.
- The protected raw RK4 high-spin longitudinal tail over-carries, the retained Carry projection affects lateral magnitude, and extreme-domain Curve/projection behavior still has pre-existing gaps.
- The target-side endpoint remains the existing start-displacement plus projected-Curve compatibility approximation.
- Academy remains unsynchronized and RED under its unchanged contracts.

None of these should be silently described as solved.

## Claude review checklist

Run from the named worktree and stop on the first unexpected result:

```powershell
git rev-parse HEAD
git status --short --branch
git diff --name-status
git ls-files --others --exclude-standard
git diff --check
git diff -- flightglass-3d-spin-model.js
(Get-FileHash -Algorithm SHA256 -LiteralPath 'flightglass-3d-spin-model.js').Hash
node --test --test-concurrency=1 scripts/engine-trackman-acceptance.test.mjs scripts/impact-flight-domain-coherence.test.mjs scripts/impact-flight-3d-spin.test.mjs scripts/flightglass-3d-spin-model.test.mjs
npm run test:engine
node --test --test-concurrency=1 scripts/academy-flight-height-descent-model.test.mjs scripts/academy-speed-transfer-model.test.mjs scripts/academy-carry-model.test.mjs scripts/academy-delivered-loft-launch-model.test.mjs scripts/academy-backspin-model.test.mjs
```

Review the diff itself, not only the tests:

1. Confirm `carryLaunchEfficiency` is reused rather than introducing a coefficient.
2. Confirm Apex and Landing diagnostic ledgers sum exactly in both flight/no-flight states.
3. Confirm raw RK4 audit fields remain returned while shipping no-flight lateral fields are zero.
4. Confirm the only final-pass exact snapshot movement is the low-loft Apex number above.
5. Confirm all TrackMan bands and six holdout rows are unchanged.
6. Confirm the published commit scope matches the table, the worktree begins clean, and no concurrent/unrelated file appeared.

The focused Academy command must still exit 1 with exactly 8 passed / 30 failed. A different count is an unexpected change and a stop condition, not a reason to rewrite fixtures.

## Resolution protocol

If review finds a defect inside the allowed engine/test scope:

1. Add or strengthen one focused real-engine test and capture the expected RED.
2. Make the minimum correction in `impact-flight.js` only if it does not touch protected formulas, fit a holdout, add an arbitrary coefficient, or change fixed acceptance.
3. Keep all exact/tolerance contracts at least as strict.
4. Rerun the compact gate, `npm run test:engine`, focused Academy baseline, protected hash/diff and `git diff --check`.
5. Update this handoff with exact new evidence.

If an engine defect requires Academy, UI, protected 3-D/aero, a TrackMan band/tolerance, source reinterpretation, or a broader migration, do not resolve it on the engine branch. A stale downstream Academy contract is handled only in the authorized integration stage; any protected-physics, UI-design, source or tolerance change remains a stop condition.

## Commit, push and merge protocol

The owner has authorized this complete protocol. No additional approval prompt is required when every gate below is satisfied.

### A. Verify the published protected engine commit

1. Fetch `origin`, check out `engine/physics-3d-spin-recal`, and confirm the worktree begins clean. Do not reset/stash/rebase shared work to manufacture that state.
2. Confirm `5dae98f942b488e7cfab19b0a96b63631750db38` is an ancestor of both local HEAD and `origin/engine/physics-3d-spin-recal`, and that local HEAD equals the upstream tip.
3. Inspect `git show --name-status --stat 5dae98f942b488e7cfab19b0a96b63631750db38`; compare its paths exactly with the protected scope table above.
4. Run the compact gate and `npm run test:engine` against the checked-out content. Confirm the protected SHA again and reproduce the focused Academy `8/38` baseline.
5. Confirm the published commit message distinguishes `SOURCED`, `ENGINE-DERIVED` and `ESTIMATE/domain guard` and that no protected/UI/Academy file is part of it.
6. Do not amend, squash, rebase or rewrite the protected engine commit. If review proves a real in-scope engine defect, follow the RED-first resolution protocol in a separate normal commit, rerun every gate, and push only this feature branch without force.
7. Do **not** merge this engine-only branch directly while the documented Academy contracts are RED.

### B. Build the full-green integration branch

1. Create `integration/physics-3d-spin-final` from the verified engine commit and push it normally. Do not rebase or rewrite the engine commit.
2. Migrate only Academy formulas, scenarios, fixtures, content and tests that handoff 03 proves stale because of the new shipping `solveFlight`. Keep Impact UI/layout, protected physics, TrackMan bands and unrelated Academy behavior unchanged.
3. Work lesson by lesson with focused failing evidence. Preserve each teaching objective and exactness. A mission input may move only when the old target is mathematically unreachable; a mastery predicate must remain equivalent or become stricter. Never widen a tolerance just to recover green.
4. Keep downstream synchronization in separate, reviewable commit(s), distinct from the protected engine commit. Update `handoff/04-claude-fable-5-final-landing-response.md` with every changed contract and before/after evidence.
5. Run the focused Academy suites after each lesson, then run fresh `npm test` and every repository-required merge gate. Do not claim full green if an `&&` stage was skipped.
6. If all required gates are green, push the integration branch, open the normal PR to `main`, wait for required CI/review, and merge through the repository's normal non-force route. The owner's instruction here supplies the merge authorization once those gates are green; it does not authorize bypassing them.
7. Verify `origin/main` contains the merge commit and report the exact remote refs, commits, gate results and final worktree state in the response file. Do not deploy or publish the app as part of this task.

## Mandatory stop conditions

Stop and report rather than improvising if any of the following is true:

- The named branch does not contain protected engine commit `5dae98f942b488e7cfab19b0a96b63631750db38`, local HEAD differs from its upstream tip, or the initial worktree is unexpectedly dirty.
- An Academy, UI, generated asset, `flightglass-3d-spin-model.js`, source-data, fixed-band or tolerance diff appears.
- Protected SHA differs from `A602805F618C1C1489AD7C7CACC67771A92F29D6B0EC4C1CDC8A18107A8B5DF5`.
- The 47-test compact gate or 62-test engine gate fails.
- TrackMan fit or holdout produces a RED chip, or a holdout row influenced a coefficient.
- Focused Academy differs from the known 8/38 baseline before the integration branch is intentionally created.
- An Academy synchronization requires weakening a mastery gate, widening a tolerance, inventing a target, changing the teaching objective, or modifying protected/Impact UI code.
- A correction requires changing spin response, lift saturation, Carry projection, protected lateral behavior, `physical.inDomain`, the Landing clamp policy, or extreme-domain behavior.
- Concurrent/unrelated changes appear, exact staging cannot be proven, required CI/review cannot run, or the verified integration target is not `main`.

If an integration stop condition is reached, leave the already-reviewed engine commit safely pushed on `engine/physics-3d-spin-recal`, do not merge it, and write the exact blocker and evidence to the response file. Do not convert a failing gate into an implicit waiver or merge.
