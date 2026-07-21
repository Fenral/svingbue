# Flightglass handoff 03 — full engine audit and longitudinal recalibration

**Route: `flightglass-sol` (gpt-5.6-sol, effort high).** This is protected-physics work with
cross-cutting ambiguity — the Critical route is required by `CLAUDE.md` §"Model and effort
routing". Do not run this on Terra.

Branch: `engine/physics-3d-spin-recal`, HEAD `f5938df`. Builds on handoffs 01 and 02.

---

## 0. Read this before planning

The 3-D spin work is **finished and verified**. This handoff is about the *longitudinal*
model — carry, apex, launch angle, landing angle, ball speed, smash — which is a 7-iron fit
applied to the whole bag. The lateral/spin half is good and must not regress.

Everything numeric below was measured against the working tree at `f5938df` on 2026-07-21
by calling the shipping engine directly. Reproduce before trusting: I made a sign error in
my own harness during this investigation (inverted the backspin vector, which made the
integrator look completely broken) and caught it only because a 1.17 s driver flight time
is physically impossible. **Re-derive every number in this document.**

---

## 1. The finding

All 13 Impact chips come from `solveFlight` via `selectOutcome`. Measured against published
TrackMan tour averages:

**The 7-iron passes across the board. The driver fails on 6 of 8.**

| Impact chip | 7-iron | driver |
|---|---|---|
| CARRY | −0.2 % | **−18.8 %** |
| TOTAL | −2.2 % | **−21.2 %** |
| APEX | +1.8 % | **−31.9 %** |
| LAUNCH ANG | +7.5 % | **−40.4 %** |
| BACKSPIN | +2.1 % | **+28.0 %** |
| LAND ANG | +8.7 % | **−15.8 %** |
| BALL SPEED | −0.8 % | −4.5 % |
| SMASH | −0.5 % | −4.7 % |

CURVE, SIDE, SPIN AXIS and LAUNCH DIR are all correctly 0.00 at a square face on both clubs.
**The 3-D spin geometry is healthy. Every failure is longitudinal.**

## 2. Root cause — four independent errors, each with a clean signature

Measured across the bag at TrackMan tour deliveries:

| | driver | 3-wood | 5-iron | 7-iron | 9-iron | PW |
|---|---|---|---|---|---|---|
| **Smash** | −5 % | −6 % | −4 % | −1 % | +1 % | +3 % |
| **Launch angle** | **−40 %** | −32 % | −1 % | +8 % | +7 % | +5 % |
| **Spin** | **+28 %** | +29 % | +14 % | +2 % | −7 % | −5 % |
| **Aero (carry, fed correct launch)** | −1 % | +9 % | +13 % | +16 % | +18 % | **+20 %** |

**Every row passes through zero near the 7-iron.** That is not coincidence — the entire
longitudinal model was calibrated there. The 7-iron looks perfect because it is the anchor,
not because the model is right.

Each error is monotone and physically interpretable:

1. **Smash slope.** `smashEff = clamp(1.46 − 0.004·spinLoft, 1.15, cap)` tilts linearly across
   the bag. Real smash falls faster with loft than −0.004/°. Also: the formula tops out at
   1.46, so a driver can never reach its real ~1.48–1.50 however the cap is set.
   (`impact-flight.js`, search `smashEff`.)
2. **Launch blend.** `≈0.62·dynamicLoft + 0.25·attackAngle` is calibrated near the 5-iron and
   collapses at low loft: the driver launches 6.5° where TrackMan says 10.9°. This is the
   single largest error in the engine and it cascades — low launch gives low apex, short
   carry and a shallow landing angle.
3. **Spin calibration.** One shared `spinCal = 1.065` anchored on the neutral 7-iron. It
   over-predicts low-loft deliveries by ~28 %. Handoff 01 deliberately refused a driver-only
   value because the order forbade a driver fudge — that reasoning was right at the time, but
   the evidence now shows the *anchor itself* is wrong away from the 7-iron.
4. **Missing lift saturation.** `premiumTourLiftCoefficient = liftScale · S^0.4` has no
   saturation term, so lift keeps growing with spin parameter. High-spin shots float too far.
   Real golf-ball lift saturates — the `SMITS_SMITH_DRIVER_AERO` model in the same file has a
   `clmax` and the orphaned `driver-flight.mjs` uses `clmax: 0.49`.
   (`flightglass-3d-spin-model.js:503`.)

## 3. The good news — do not rebuild what works

**The RK4 integrator is sound.** Fed TrackMan's own launch conditions it reproduces TrackMan's
own carry:

| | TM carry | engine RK4 | delta |
|---|---|---|---|
| PGA driver (167 mph / 10.9° / 2686 rpm) | 275 yd | 272.2 | **−1.0 %** |
| LPGA driver (140 / 13.2° / 2611) | 218 yd | 221.3 | **+1.5 %** |
| 3-wood (158 / 12.7° / 3655) | 243 yd | 264.3 | +8.8 % |
| 5-iron (132 / 14.3° / 5361) | 195 yd | 220.0 | +12.8 % |
| 7-iron (120 / 16.3° / 7097) | 172 yd | 200.0 | +16.3 % |
| 9-iron (109 / 20.4° / 8647) | 152 yd | 179.2 | +17.9 % |
| PW (102 / 24.2° / 9304) | 136 yd | 163.7 | +20.4 % |

Two conclusions. First, **we do not need a new flight model** — we have one, and at driver
spin it is within 1 %. Second, the residual is a clean monotone function of spin, which is
the lift-saturation signature from §2.4, not seven independent problems.

This also **validates the reference**: a physically correct integrator fed TrackMan's driver
launch numbers really does produce TrackMan's driver carry. The targets are self-consistent
and reachable.

## 4. Architecture — where the numbers actually come from today

```
solveFlight (impact-flight.js)
  ├─ centeredImpactGeometry ─── spin loft (3-D), spin axis      VERIFIED GOOD
  ├─ centeredImpactSpin ─────── total spin (Penner)             calibration wrong off-anchor
  ├─ smashEff / launch blend ── ball speed, launch angle        7-IRON FIT, WRONG
  ├─ fitted curves ──────────── carry, apex, landing, roll      7-IRON FIT, WRONG
  └─ simulateFlight (RK4) ───── LATERAL CURVE ONLY              integrator good, aero biased
                                then projected onto fitted carry
```

The RK4 already runs on every solve — but only its sideways component is used, and that is
projected back onto the fitted carry via `curveCarryProjectionScale`. The longitudinal answer
is thrown away.

**The obvious target architecture is to let the integrator produce carry, apex, flight time
and landing angle too**, driven by physically correct launch conditions. That deletes the
fitted curves, the `dragScale = 1.275116456035` legacy anchor (which exists only to make RK4
agree with the old fit) and the carry-projection transform in one move.

**Evaluate this, do not assume it.** It is a large change with real risks:
- `curveCarryProjectionScale` currently accounts for roughly three-quarters of the
  driver-vs-hybrid curve ratio (handoff 01 §2.3). Removing it *will* move curve, and curve is
  currently correct at square face. Do not regress the lateral half to fix the longitudinal one.
- Roll/total is a separate empirical model, not part of the flight solve.
- If the full switch is too large for one pass, an acceptable intermediate is to keep the
  fitted curves but fix the launch conditions feeding them, then migrate.

## 5. Tolerance policy — TrackMan as a sanity band, not a target

Owner's ruling: exact agreement is not required, but **25 % is far too loose on everything**.
These are the bands. They are deliberately tight.

**Angles are specified in degrees, not percent, and this matters.** A percentage band on an
angle means different physical errors at different lofts — 5 % of the driver's 10.9° launch
is 0.55°, 5 % of the PW's 24.2° is 1.2°. Worse, percent hides real error: the 7-iron's
landing angle currently reads "+8.7 %", which sounds tolerable and is actually **4.4° too
steep**. Smash is a ratio and is specified absolutely for the same reason.

| Chip | Unit | Green | Amber (investigate) | Red (fail) |
|---|---|---|---|---|
| CARRY, TOTAL | % | ≤ 3 % | 3–6 % | > 6 % |
| BALL SPEED | % | ≤ 2 % | 2–4 % | > 4 % |
| SMASH | absolute | ≤ 0.02 | 0.02–0.04 | > 0.04 |
| APEX | % | ≤ 5 % | 5–10 % | > 10 % |
| BACKSPIN | % | ≤ 5 % | 5–10 % | > 10 % |
| LAUNCH ANG | **degrees** | ≤ 1.0° | 1.0–2.0° | > 2.0° |
| LAND ANG | **degrees** | ≤ 2.0° | 2.0–4.0° | > 4.0° |
| CURVE, SIDE, SPIN AXIS, LAUNCH DIR | — | exactly 0 at square face | — | any non-zero |

These are grounded in what the engine already achieves on its best-calibrated club, so they
are demanding but not fantasy. The 7-iron today: carry −0.2 %, total −2.2 %, apex +1.8 %,
ball speed −0.8 %, smash 0.01 — all green.

**Expect the gate to start red in more places than the driver.** On these bands the 7-iron —
the anchor club, the one that looks perfect in percentage terms — lands **amber on launch
angle (1.2°) and red on landing angle (4.4°)**. That is the correct reading: those errors are
real and were previously hidden by the choice of unit. Do not widen a band to turn a chip
green. If you believe a band is genuinely unreachable, say so in the response with the
measured evidence and let the owner move it.

### 5.1 Scored baseline at `f5938df` — where you are starting

Measured, not estimated. This is the scoreboard the acceptance suite must reproduce on day one.

| Chip | driver | | 7-iron | |
|---|---|---|---|---|
| CARRY | −18.8 % | RED | −0.2 % | GREEN |
| TOTAL | −21.2 % | RED | −2.2 % | GREEN |
| BALL SPEED | −4.5 % | RED | −0.8 % | GREEN |
| SMASH | −0.069 | RED | −0.007 | GREEN |
| APEX | −31.9 % | RED | +1.8 % | GREEN |
| BACKSPIN | +28.0 % | RED | +2.1 % | GREEN |
| LAUNCH ANG | −4.4° | RED | +1.2° | AMBER |
| LAND ANG | −6.0° | RED | +4.4° | RED |

**Driver 8/8 red. 7-iron 6 green, 1 amber, 1 red.** The bands are demanding but provably
reachable — the engine already meets six of them on its anchor club. The 7-iron's landing
angle is the one genuinely new finding here: it was invisible in percentage terms and is a
real 4.4° error that this pass should fix alongside the driver.

## 6. The work, in order

Each step gets its own acceptance test against the TrackMan anchors **before** any engine
change. Land the tests red first.

1. **Lift saturation** in `premiumTourLiftCoefficient`. Highest yield, lowest risk to the
   lateral half. Target: collapse the +20 % high-spin tail while holding the driver at ≈ −1 %.
2. **Launch model** per club category rather than one shared blend. Largest single error.
3. **Smash slope** refitted across the bag, and remove the 1.46 ceiling that caps the driver.
4. **Per-club `spinCal`** — now justified by evidence, unlike in handoff 01.
5. **Then** re-evaluate §4: move carry/apex/landing onto the integrator, or keep the fitted
   curves on corrected inputs.

## 7. Verification requirements

- **New suite `scripts/engine-trackman-acceptance.test.mjs`**, run inside `test:engine`. It
  must call **`solveFlight`**, not `driver-flight.mjs`.
  ⚠️ The existing `engine-driver-acceptance.test.mjs` reports "8/9 club speeds inside TrackMan
  tolerance" and is **green today while the shipping driver is 19 % short**. It imports
  `carryYd` from the orphaned `driver-flight.mjs` and feeds it optimal launch/spin. It never
  touches the shipping path. Do not treat it as coverage. Either re-point it or clearly
  rename it so nobody else is misled.
- **Hold out at least two clubs from the fit and use them as validation only.** Four parameter
  groups against seven anchors is an over-fitting risk. Report fit-set and holdout-set error
  separately.
- **Protect the lateral half.** These must not move:
  - square face ⇒ CURVE, SIDE, SPIN AXIS, LAUNCH DIR all exactly 0
  - neutral: `spinLoft = dynamicLoft − attackAngle`
  - driver-vs-hybrid tilt ratio ≈ 2.52× (pure geometry)
- `npm test` completes, no test over 10 s. Current baseline: `test:engine` 52/52,
  `test:ux` 154/154, `test:academy-foundation` 242/244, wall clock ~218 s.
- `scripts/verify-academy-formulas.mjs` must stay at **0 hits**. If the recalibration changes
  a number that an Academy lesson quotes, the lesson must be updated in the same pass —
  handoff 02 rebuilt 120 strings against measured output and they will go stale.

## 8. Out of scope

- The 3-D spin geometry: `centeredImpactGeometry`, `spinVectorFromTotalSpin`, the D-plane tilt.
  Verified correct. Do not touch.
- The two pre-existing voice failures (`academy-voice-pack`, `academy-voice-production`),
  verified identical on `origin/main`. Not physics.
- `test:webkit` gating.
- Academy lesson *prose* — unless a number you change invalidates it (§7).

## 9. Known limits of this audit — be sceptical of these

- **I verified TrackMan self-consistency for the driver only.** The iron rows are assumed
  coherent, not proven. The only independent integrator available (`driver-flight.mjs`) is
  driver-tuned (`clmax 0.49`) and under-predicts irons by 17–33 %, so it cannot validate them.
  Establishing whether the iron anchors are self-consistent is part of the job.
- **Tour averages are composites**, not single shots, and they come from elite deliveries.
  Calibrating to seven anchors fixes seven points, not the space between or beyond them. The
  app lets users set arbitrary slider values well outside tour ranges.
- **"Matching TrackMan" means matching a model.** TrackMan measures launch and *models* the
  flight; it is a reference, not ground truth. The owner's position — that consumer trust
  follows the reference the consumer knows — is a deliberate product decision and I think the
  right one, but it should be recorded as such rather than mistaken for physical validation.
- **Carry is currently non-monotonic in club speed**: it peaks near 227 yd at 120 mph and
  falls to 190 yd at 150 mph. Whatever replaces the fitted curve must be monotone in ball
  speed at fixed launch and spin. Add that as an explicit test.
- The TrackMan figures used here are published tour averages from my own knowledge, not
  scraped from a source in this session. **Verify them against a current TrackMan publication
  before locking them into an acceptance suite.**

## 10. Report back

Write to `handoff/03-engine-audit-response.md`:

1. Which of the four errors you fixed, with before → after per club against the anchors.
2. Fit-set vs holdout-set error, stated separately.
3. Whether you moved carry/apex/landing onto the integrator, or deferred it, and why.
4. Proof the lateral invariants (§7) did not move.
5. `npm test` totals and wall clock; verifier still 0 hits.
6. Any TrackMan anchor you found to be internally inconsistent.
7. Anything you could not complete, stated plainly.
