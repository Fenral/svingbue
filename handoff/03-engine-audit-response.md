# Flightglass handoff 03 - engine audit response

Date: 2026-07-21
Branch/worktree: `engine/physics-3d-spin-recal` / `.worktrees/physics-3d-spin`
Starting revision: `716682c20ef2a9c83147b692cc3634c6ec85490a`

## Verdict

The shipping `solveFlight` longitudinal path is recalibrated and its acceptance suite is now tied to the current official TrackMan full-bag publication. The initial acceptance test was landed RED before the engine changed: 6 tests ran, 3 passed and 3 failed, with 21 RED metric findings in the six-club fit set and 27 RED findings in the six-club holdout set. The same suite is now 8/8 green, with no RED chip in either set.

Three of the four diagnosed engine errors were fixed:

1. **Smash slope:** fixed with one smooth quadratic of true 3-D spin loft. The former `1.46` ceiling is gone; the tour-reference driver now reaches `1.495` while the same continuous curve steepens through the wedges.
2. **Launch model:** fixed with one continuous intercept + linear loft + quadratic loft + attack model. I did not add a club-category selector because the shipping public path has five inputs and `selectOutcome` does not supply a club. An optional `club` label remains a compatibility echo only and is proved physics-neutral across all 12 acceptance rows.
3. **Spin calibration:** fixed with one smooth sigmoid of absolute vertical spin loft. This is delivery-based rather than a hidden per-club preset, while total-spin orientation still comes from the protected full 3-D centered-impact solve.
4. **Lift saturation:** deliberately **not changed**. The order separately protects `flightglass-3d-spin-model.js`, including the 3-D/aero path. More importantly, an independent raw-RK4 audit with the newly verified current rows still over-carried the high-spin irons monotonically by roughly 9-22%. Moving that biased longitudinal result into shipping output would require changing protected aero and would also move the currently protected lateral projection. That larger migration remains deferred.

The old fitted carry/apex/landing relationships were nevertheless replaced with continuous five-input-path fits on the corrected ball speed, launch and vertical-spin-loft inputs. Carry is now strictly monotone in ball speed at fixed delivery, has a zero-speed zero, and fades continuously to zero for non-positive launch instead of awarding a full fitted carry.

No changes were made to `flightglass-3d-spin-model.js`, the D-plane geometry, start-direction formula, face-to-path formula, spin-vector construction, RK4 curve expression, curve projection, or offline expression.

## Exact file scope

- Modified: `impact-flight.js`, `package.json`, `scripts/impact-flight-3d-spin.test.mjs`, `scripts/impact-flight-calculated-spin.test.mjs`.
- Replaced/renamed for honest provenance: `scripts/engine-driver-acceptance.mjs` -> `scripts/driver-flight-reference.mjs` and `scripts/engine-driver-acceptance.test.mjs` -> `scripts/driver-flight-reference.test.mjs`.
- Added: `scripts/engine-trackman-acceptance.test.mjs` and this response.
- Academy/content/model/test files: no diff.
- Protected `flightglass-3d-spin-model.js`: no diff.

## Reference verification and anchor decision

I verified the anchors against TrackMan before locking the acceptance test:

- [TrackMan, "Trackman Tour Averages," published 2024-05-02](https://www.trackman.com/blog/golf/introducing-updated-tour-averages) is the current official full-bag publication. Its downloadable PGA asset is labelled 2023.
- [TrackMan's tour-average media page](https://www.trackman.media/tour-averages) is the official asset index.
- [TrackMan's Dynamic Loft parameter page](https://www.trackman.com/ja/blog/golf/dynamic-loft) and [Spin Loft parameter page](https://www.trackman.com/blog/golf/spin-loft) were checked separately as consistency probes.

The current full-bag asset publishes Club Speed, Attack Angle, Ball Speed, Smash, Launch Angle, Spin Rate, Max Height, Land Angle and Carry. It does **not** publish full-bag Dynamic Loft or Total. Therefore:

- The target outputs in the suite are current official TrackMan PGA rows.
- The 12 Dynamic Loft inputs are explicitly labelled **Flightglass reference-delivery assumptions**, not TrackMan facts.
- No Total target was invented. Total is protected by `Total >= Carry` and strict monotonicity at fixed delivery.

This also surfaced an important inconsistency/identifiability limit. TrackMan's separate current Dynamic Loft page gives PGA Driver `12.8 deg` and 6-iron `20.2 deg`, while its current full-bag average gives launch/spin/speed results that a deterministic five-input model cannot reproduce simultaneously with the assumed single-shot ladder:

- At the separately published 6-iron Dynamic Loft `20.2 deg`, the recalibrated model gives launch `10.95 deg`, smash `1.426`, ball speed `134.06 mph`, spin `4,174 rpm`, carry `196.60 yd`, apex `29.18 yd`, landing `48.17 deg`; the full-bag targets are `14.0 deg`, `1.39`, `130 mph`, `6,204 rpm`, `188 yd`, `32 yd`, `50 deg`.
- At the separately published Driver Dynamic Loft `12.8 deg`, it gives launch `9.97 deg`, smash `1.486`, ball speed `170.84 mph`, spin `2,959 rpm`, carry `276.13 yd`, apex `35.84 yd`, landing `40.99 deg`; the full-bag targets are `10.4 deg`, `1.49`, `171 mph`, `2,545 rpm`, `282 yd`, `35 yd`, `39 deg`.

That is not evidence that either TrackMan page is wrong. Tour averages are composites, club populations and sample filters can differ, and Dynamic Loft is not present in the same full-bag table. It does mean the seven-output acceptance cannot honestly be described as direct reproduction of measured Dynamic Loft rows. It is a current-reference sanity band around an explicit Flightglass input ladder.

## Acceptance construction

The new `scripts/engine-trackman-acceptance.test.mjs` calls shipping `solveFlight` directly. It uses 12 current PGA rows:

- Fit: Driver, 3-wood, 5-iron, 7-iron, 9-iron, PW.
- Untouched validation holdout: 5-wood, Hybrid, 3-iron, 4-iron, 6-iron, 8-iron.

The bands are literal test data and were not widened during recalibration:

| Metric | GREEN | AMBER | RED |
|---|---:|---:|---:|
| Carry | <= 3% | <= 6% | > 6% |
| Ball Speed | <= 2% | <= 4% | > 4% |
| Smash | <= 0.02 absolute | <= 0.04 | > 0.04 |
| Apex | <= 5% | <= 10% | > 10% |
| Spin | <= 5% | <= 10% | > 10% |
| Launch Angle | <= 1 deg | <= 2 deg | > 2 deg |
| Land Angle | <= 2 deg | <= 4 deg | > 4 deg |

The old orphaned `engine-driver-acceptance*` files were renamed to `driver-flight-reference*`. Their output now says **REFERENCE ONLY** and no longer implies that the orphan `driver-flight.mjs` covers shipping `solveFlight`. `test:engine` and `test:ux` use the honest name.

## Before -> after by club

Every entry below is signed model error against the anchor, not the modeled value. Carry, Ball, Apex and Spin are percent; Smash is absolute; Launch and Land are degrees. Negative means under the anchor. Values were generated in one process from the timestamped pre-calibration backup and current engine.

### Fit set

| Club | Carry % | Ball % | Smash | Apex % | Spin % | Launch deg | Land deg |
|---|---:|---:|---:|---:|---:|---:|---:|
| Driver | -20.28 -> -2.42 | -5.01 -> +0.52 | -0.08 -> +0.00 | -37.00 -> +2.21 | +33.09 -> +1.23 | -3.80 -> -0.64 | -7.00 -> -0.13 |
| 3-wood | -12.25 -> +2.07 | -5.56 -> -0.45 | -0.08 -> -0.00 | -23.67 -> +5.79 | +27.56 -> -2.94 | -0.57 -> +0.68 | -11.59 -> +0.31 |
| 5-iron | -5.28 -> -1.28 | -4.26 -> -0.75 | -0.06 -> -0.01 | -8.41 -> -5.55 | +23.52 -> -0.19 | +2.75 -> +0.92 | -2.69 -> -0.27 |
| 7-iron | +0.21 -> +1.15 | -0.94 -> +1.34 | -0.02 -> +0.01 | -2.78 -> -7.87 | +2.88 -> +0.21 | +1.52 -> -0.94 | +3.68 -> -0.05 |
| 9-iron | +5.50 -> +2.10 | +0.58 -> +0.49 | +0.00 -> +0.00 | +15.05 -> +0.64 | -6.72 -> -1.39 | +1.87 -> -0.49 | +8.00 -> -0.14 |
| PW | +5.31 -> -1.88 | +2.51 -> -0.25 | +0.03 -> -0.00 | +24.84 -> +4.84 | -4.74 -> -3.39 | +1.79 -> +0.47 | +8.00 -> +0.28 |

Fit-set final mean absolute / maximum absolute error:

| Metric | Mean | Maximum |
|---|---:|---:|
| Carry | 1.817% | 2.425% |
| Ball Speed | 0.632% | 1.337% |
| Smash | 0.008 | 0.015 |
| Apex | 4.482% | 7.870% |
| Spin | 1.558% | 3.392% |
| Launch Angle | 0.691 deg | 0.942 deg |
| Land Angle | 0.196 deg | 0.313 deg |

### Holdout set

| Club | Carry % | Ball % | Smash | Apex % | Spin % | Launch deg | Land deg |
|---|---:|---:|---:|---:|---:|---:|---:|
| 5-wood | -10.35 -> +0.47 | -6.37 -> -1.65 | -0.09 -> -0.02 | -20.08 -> -0.05 | +22.69 -> -6.52 | +0.84 -> +0.91 | -10.95 -> -1.53 |
| Hybrid | -11.76 -> -3.83 | -6.19 -> -1.71 | -0.10 -> -0.03 | -11.12 -> +3.82 | +21.04 -> -7.53 | +1.60 -> +1.01 | -9.07 -> -1.52 |
| 3-iron | -8.75 -> -2.15 | -6.07 -> -1.91 | -0.10 -> -0.04 | -3.96 -> +6.64 | +34.50 -> +3.49 | +2.71 -> +1.56 | -5.03 -> +0.42 |
| 4-iron | -7.25 -> -1.97 | -5.19 -> -1.33 | -0.09 -> -0.03 | -4.67 -> +1.89 | +30.16 -> +1.68 | +3.04 -> +1.53 | -3.84 -> +0.12 |
| 6-iron | -2.94 -> -0.49 | -3.45 -> -0.55 | -0.05 -> -0.01 | -1.09 -> -2.52 | +12.11 -> -0.92 | +2.13 -> -0.10 | +1.03 -> +0.43 |
| 8-iron | +1.95 -> +0.66 | -1.26 -> -0.12 | -0.02 -> -0.01 | +5.66 -> -4.51 | -3.76 -> +0.24 | +1.92 -> -0.64 | +8.65 -> +0.49 |

Holdout final mean absolute / maximum absolute error:

| Metric | Mean | Maximum |
|---|---:|---:|
| Carry | 1.595% | 3.829% |
| Ball Speed | 1.212% | 1.913% |
| Smash | 0.024 | 0.038 |
| Apex | 3.240% | 6.637% |
| Spin | 3.397% | 7.534% |
| Launch Angle | 0.958 deg | 1.561 deg |
| Land Angle | 0.750 deg | 1.528 deg |

There is no holdout leakage in the implementation interface: every formula is continuous in the five public delivery fields, no row/club lookup exists, and passing each row's optional club label produces bit-identical longitudinal and lateral results to omitting it and to `selectOutcome(...).raw`. The coefficient work used the six declared fit rows; holdouts are evaluated by the acceptance test only.

## Architecture decision

I deferred the longitudinal integrator migration.

The current architecture after this pass is:

```text
five delivery inputs
  -> protected centeredImpactGeometry       true 3-D spin loft and axis
  -> continuous launch/smash/spin fits      ball speed, launch, spin magnitude
  -> empirical monotone longitudinal fits   carry, apex, landing, roll
  -> protected RK4 3-D spin flight           lateral bend only
  -> protected carry projection              shipping curve/offline compatibility
```

Reasons:

1. The current independent RK4 longitudinal bridge still has the same monotone high-spin excess that motivated lift saturation; feeding it into output now would replace bounded TrackMan error with a known 9-22% iron excess.
2. Saturating lift requires editing the explicitly protected 3-D/aero module and needs a new independent aero validation set, not a single `clmax` guessed from the driver-only model.
3. Removing the carry projection changes protected curve behavior. The representative driver/hybrid audit shows the current curve ratio `1.66118 = raw-RK4 ratio 1.45827 * projection-scale ratio 1.13915`; this is compatibility glue with a measurable lateral effect.
4. Roll remains a separate empirical surface/turf approximation even after an airborne integrator migration.

The empirical replacement is intentionally modest:

- Carry: zero-intercept positive-derivative quadratic of Ball Speed, with a continuous sub-10-degree launch-domain factor.
- Apex: Ball Speed times a linear Launch Angle term, exactly zero at zero speed.
- Landing: smooth saturation in absolute vertical spin loft, exactly zero at zero speed.
- Total: current landing-derived rollout retained, with zero rollout when carry is zero.

The engine now exposes the live coefficients and terms used by Academy explainers. Removed diagnostics are `apexMax`, `apexTau` and `smashPresetCap`; the new fields expose launch intercept/linear/quadratic terms, smash quadratic terms, spin-calibration sigmoid terms, carry quadratic and launch-efficiency terms, apex terms, and landing saturation. `landingBase`/`landingSpinTerm` remain for compatibility but now describe the saturation decomposition; `landingLaunchTerm` and `landingApexTerm` are zero.

## Lateral and five-input proof

The protected lateral invariants did not move:

- Square face/path across all 12 bag rows: `CURVE = SIDE = SPIN AXIS = LAUNCH DIR = 0` exactly.
- Neutral geometry: `spinLoft = dynamicLoft - attackAngle` exactly in the documented positive-spin-loft domain.
- Driver/hybrid D-plane tilt ratio: `2.518538000504215` exactly.
- Representative +3-degree driver miss: `offline = 29.311 yd`, still below the existing `< 30 yd` guard.
- Existing high-loft-versus-driver curve guard: `18.922 yd > 18.391 yd` remains true.
- Representative driver/hybrid curve values: `17.281836 yd` / `10.403348 yd`; curve ratio `1.66118`.

The pre/post byte proof for the protected module is:

- `git diff --exit-code -- flightglass-3d-spin-model.js`: clean.
- SHA-256: `A602805F618C1C1489AD7C7CACC67771A92F29D6B0EC4C1CDC8A18107A8B5DF5`.
- A direct diff search found no changes to the start-direction, face-to-path, spin-axis, `carryProjectedCurveFlight`, spin-vector, curve, or offline expressions.

The five-field memo contract is safe because the optional `club` label selects no physics. The new acceptance iterates every TrackMan row and proves direct five-field solve, labelled solve, and `selectOutcome(...).raw` are bit-identical for Carry, Total, Ball Speed, Smash, Apex, Spin, Launch, Landing, Curve, Side, Spin Axis and Launch Direction.

## Academy recalibration

No Academy file, mission/proof input, expected fixture, mastery predicate or tolerance was changed. The owner-level downstream-fixture rule prohibited changing those artifacts merely to recover green. Partial copy edits from the interrupted audit workers were removed; `git diff --name-only -- 'academy-*' 'scripts/academy-*'` is empty.

That leaves real downstream REDs. They are not generic snapshot churn; each is a quantified incompatibility between an unchanged Academy contract and fresh `solveFlight` output:

### Flight Height & Descent

The adapter still reconstructs the deleted landing formula as `45 + 0.5*(spinLoft-25) + 0.6*(launch-14) + (apex-30)`. It now fails closed with `Landing decomposition diverged from protected flight output` before returning a lesson state.

The unchanged same-Apex fixtures moved as follows:

| Input `(DL, AA, speed)` | Old Apex / Landing | Current direct solve Apex / Landing |
|---|---:|---:|
| `(25, -3, 105)` | `31.48998 / 48.43998` | `34.27741 / 49.61998` |
| `(31, -7, 85)` | `31.48971 / 55.07171` | `28.04635 / 51.52944` |

Both unchanged `31.3-31.7 yd` Apex gates fail; the Landing gap is now `1.90946 deg` rather than `>= 6 deg`. The `>54 deg` high-Landing predicate is mathematically unreachable under the new landing surface because `52.8 - 41.5*exp(-verticalSpinLoft/10.9)` is strictly below `52.8 deg` before the display clamp.

### Speed Transfer

The adapter reconstructs one local linear Smash slope, but shipping Smash is now quadratic; away from its local 30/31-degree points the adapter detects divergence and fails closed.

The unchanged equal-output fixtures moved as follows:

| Input `(speed, spin loft)` | Old Smash / Ball Speed | Current direct solve Smash / Ball Speed |
|---|---:|---:|
| `(96, 25)` | `1.360 / 130.560` | `1.418960 / 136.220181` |
| `(102, 45)` | `1.280 / 130.560` | `1.260432 / 128.564037` |

The unchanged `130.46-130.66 mph` gates fail and the Ball Speed gap is `7.65614 mph` rather than `<= 0.1 mph`. Club-speed, spin-loft and Smash-gap distinctions still exist, but they cannot award the unchanged mission.

### Carry

The unchanged equal-Carry fixtures moved as follows:

| Input `(DL, AA, speed)` | Ball / Carry / Launch / Apex / Land / Total |
|---|---:|
| Old A `(25, -5, 90)` | `120.60 / 174.25 / 14.25 / 28.8356 / 46.4856 / 180.8317` |
| Old B `(35, +5, 90)` | `120.60 / 174.25 / 22.95 / 39.3137 / 60.0000 / 177.2994` |
| Current A | `124.578047 / 177.886584 / 12.422849 / 28.582068 / 50.153072 / 183.627054` |
| Current B | `124.578047 / 177.886584 / 20.443878 / 36.575414 / 50.153072 / 183.627054` |

The unchanged Carry and Ball Speed target bands both fail. Launch gap remains `8.02103 deg`, but Apex gap is `7.99335 yd` versus `>=9`, Landing gap is `0` versus `>=12`, Total gap is `0` versus `>=3`, and the high state no longer reaches the old 60-degree clamp. More strongly, the joint target is mathematically impossible: throughout the locked `120.50-120.70 mph` Ball Speed band, even full launch efficiency yields only `170.062-170.443 yd`, below the required `174.15-174.35 yd` Carry band.

### Delivered Loft & Launch

The adapter and visible lesson still decompose Launch as `0.62*DynamicLoft + 0.25*Attack`; shipping Launch is now intercept + linear loft + quadratic loft + `0.25*Attack`.

- At `(30, -4, 90)`, Launch moved `17.60 -> 15.132746 deg`.
- A `+1 deg` Dynamic Loft step from that state now changes Launch by `+0.564128 deg`, not `+0.62 deg`; the Attack sensitivity remains `+0.25 deg/deg`.
- The unchanged equal-launch pair `(28, +5, 90)` / `(32, -5, 90)` moved from `18.61 / 18.59 deg` to `16.326639 / 16.035051 deg`. Both unchanged `18.4-18.8 deg` gates fail, although the 14-degree Spin Loft gap remains.

### Backspin

`backspinEngineInput` still inverts the deleted linear Smash formula to turn its requested Ball Speed into Club Speed. Consequently, the lesson no longer holds the Ball Speed it claims:

- Initial `{DL:25, AA:-3, Ball:120}` now feeds a solve that actually produces `124.495 mph` and `4,782 rpm`, versus the locked `5,970 rpm` expectation.
- The nominal stopping-flight state `{DL:30, AA:-3, Ball:120}` actually produces `123.053 mph`, `6,650 rpm`, and `50.8 deg` Landing. Landing passes, but the unchanged `6,800-7,400 rpm` Backspin gate fails.
- The low-spin fixture moved `632 -> 480 rpm`; the old nominal `1,500 rpm` probe now produces `1,141 rpm`.

These adapters and displayed Academy numbers were intentionally not rewritten because doing so without migrating their protected scenarios would leave lessons internally contradictory, while migrating scenarios/predicates was expressly forbidden. This is incomplete downstream work, not a claimed green Academy recalibration.

The formula verifier's 0-hit result does **not** contradict these findings. Its nine signatures cover earlier deleted curve/axis/spin-product laws; they do not match this pass's deleted `0.62*loft + 0.25*attack`, linear Smash inverse, old Carry curve or landing decomposition. It is a passing legacy contamination gate, not proof that Academy is synchronized to this recalibration.

No mastery tolerance may be widened to absorb the recalibration. Mission input changes are accepted only when mechanically forced by a stale `solveFlight`-derived target/formula and when the existing predicate is preserved or made stricter.

## Verification

Final verification was run sequentially by a fresh, read-only command mechanic after the Academy partial edits were removed:

| Command | Result | Duration |
|---|---|---:|
| `node --test --test-concurrency=1 scripts/engine-trackman-acceptance.test.mjs` | **PASS, 8/8** | TAP `137.3203 ms`; wall `187.241 ms` |
| `npm run verify:academy-formulas` | **PASS, 0 hits** across 28 scanned files / 9 deleted signatures | wall `543.836 ms` |
| `npm run test:engine` | **PASS, 60/60** | TAP `4,959.1192 ms`; wall `5,983.514 ms` |
| Five affected Academy model suites | **FAIL, 8/38 passed, 30 failed**; fixtures/predicates intentionally preserved | TAP `551.4047 ms`; wall `621.818 ms` |
| `npm test` | **FAIL, exit 1** | wall `692,563.355 ms` (`692.563 s`) |
| `git diff --check` | **PASS** (line-ending notices only, no whitespace error) |
| `git diff --exit-code -- flightglass-3d-spin-model.js` | **PASS / no diff** |
| protected module SHA-256 | `A602805F618C1C1489AD7C7CACC67771A92F29D6B0EC4C1CDC8A18107A8B5DF5` |

`npm test` first completed its engine stage at 60/60, then failed in the first sequential `test:ux` node stage on the stale Academy contracts. The `&&` chain therefore did not run `test:academy-foundation` or WebKit. The command capture retained the exit, stage and wall time but truncated the final aggregate UX TAP footer; I do not invent a UX pass/fail total. The exact focused affected-suite total is the separately captured 8/38 above, and its failures correspond to the five quantified groups in the Academy section.

The visible UX failure stream also showed dependent fallout beyond those five focused model files: Air Density aliases and its 25-yard reward; Backspin browser/layout/accessibility/mission/mastery states; Carry aliases and trajectory reward; Carry Side mirrored-flight reward; Delivered Loft proof/mastery; Flight Height surfaces/reward/viewports; Shape S0-S3; Speed Transfer surfaces/reward/viewports; and Wind vector/reward states. These remain downstream work. Because the UX footer was truncated, this is a visible-group inventory rather than a fabricated aggregate count.

The focused Academy failures split exactly as follows: Backspin 9, Carry 4, Delivered Loft & Launch 6, Flight Height & Descent 7, Speed Transfer 4. Those 30 named failures cover the stale numeric truth, deleted-formula adapters, live evaluators, clamp metadata and unchanged mastery targets quantified above.

The requested runtime condition also did not pass. The full command took 692.563 seconds. The complete visible `>10 s` list from the captured UX output was:

| Visible test | Duration |
|---|---:|
| Backspin Spin Lab at 430 px | 31.639 s |
| Backspin Spin Lab at 375 px | 31.634 s |
| Backspin wrong mastery correction | 31.588 s |
| Backspin storage failure | 31.104 s |
| Backspin canvas unavailable | 31.161 s |
| Carry two learner-created trajectories | 31.200 s |
| Delivered Loft raw near-miss/equal-launch | 31.261 s |
| Flight Height S0-S3 | 30.765 s |
| Flight Height knowledge-only state | 31.262 s |
| Flight Height same-Apex reward | 31.231 s |
| Flight Height viewport/profile | 30.841 s |
| Speed Transfer S0-S3 | 30.767 s |
| Speed Transfer knowledge-only state | 31.208 s |
| Speed Transfer equal-output transfers | 31.247 s |

Because the tool truncated part of the UX stream, this is the full **visible** slow-test list, not a claim that hidden lines contained no others. `test:engine` itself had no test over 10 seconds; its slowest test was 4.301 s. The performance/gate condition is failed, not waived.

The high-signal engine subset was also run directly after the final carry guard: `engine-trackman-acceptance`, `impact-flight-3d-spin`, and `impact-flight-calculated-spin` passed **29/29** in 401.1601 ms. It covers fixed TrackMan bands, fit/holdout RED checks, five-field identity, exact square-flight zeros, protected tilt geometry, fixed-delivery monotonicity, zero-speed zeros, independent TrackMan-scaled spin checks and representative lateral guards.

The protocol change-gate dry run classified the touched engine/test/package scope as Level C and enumerated its required controls before edits. No generated web copy, browser screenshot, deployment or other mutation was run to mask the downstream RED.

The readiness baseline before any recalibration was also recorded. `npm run claude:ready` reached Academy Foundation and reported the two already-known, out-of-scope voice failures (`academy-voice-pack` and `academy-voice-production`): 244 tests, 242 passed, 2 failed. Brand checks passed; the `&&` chain correctly skipped later WebKit/autopilot work after the known failure. This was the same voice baseline as `origin/main`, not a physics regression.

## Known limits and incomplete work

- The model is calibrated to a sparse, composite elite-player table. Passing 12 reference rows is a sanity result, not proof throughout arbitrary slider space.
- The public full-bag source does not publish Dynamic Loft or Total. Dynamic Loft assumptions and the no-fabricated-Total policy are explicit in the test.
- The separately published Dynamic Loft values do not identify the same seven outputs in this five-input model; the driver/6-iron conflict is quantified above rather than hidden.
- True 3-D spin loft is unsigned outside the normal positive-spin-loft domain. Negative vertical spin loft/topspin inputs remain outside the calibrated longitudinal domain; `physical.inDomain` exposes that condition.
- The total-spin sanity ceiling remains `9,000 rpm`; TrackMan's PW reference is `9,316 rpm`, so that row passes at `-3.39%` but cannot exactly equal the anchor. Raising the physical ceiling was not necessary to eliminate RED and was not justified by this sparse data.
- Raw RK4 longitudinal flight, lift saturation, removal of the carry-projection transform and course/turf roll remain future work requiring an independent validation set and explicit lateral migration approval.
- The target-side endpoint still uses the existing compatibility approximation `start displacement + projected curve`; that protected expression was not rewritten in this longitudinal pass.
- Academy is not recalibrated: the five quantified lesson/model contracts above remain RED, and additional displayed downstream numbers sourced from the old fixtures remain stale. They require a separately authorized fixture/predicate migration performed lesson-by-lesson, followed by voice/text synchronization and browser evidence.
- Visual-regression screenshots and voice assets were not regenerated because Academy scenarios were not authorized to move.

No commit, push, merge, deployment, voice generation or audio-manifest mutation was performed.
