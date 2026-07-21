# Engine change report: centered-strike 3-D spin

Branch: `engine/physics-3d-spin`

This change is intentionally limited to the protected ball-flight engine, one
new dependency-free ESM physics module, and engine tests. It does not update
Impact or Academy UI/experience files.

## Scope and classification

The core `solveFlight` path assumes contact at the geometric centre of the
clubface. It does not read strike location and never invokes the optional gear
helper. Therefore every core spin and curve value comes only from club speed,
attack angle, club path, dynamic loft, and face angle (plus the already-existing
club preset selection).

### SOURCED

- Spin loft is the angle between the 3-D club-centre velocity direction and
  the 3-D face-normal direction. TrackMan states both the 3-D definition and
  why `dynamic loft - attack angle` is normally a close approximation:
  [TrackMan: Spin Loft](https://www.trackman.com/blog/golf/spin-loft).
- For centred contact, face-to-path controls the curvature sign and spin-axis
  orientation: [TrackMan: Face to Path](https://www.trackman.com/blog/golf/face-to-path).
  TrackMan defines positive spin axis as right-curving and the angle relative
  to the horizon: [TrackMan: Spin Axis](https://www.trackman.com/blog/golf/spin-axis).
- Drag opposes air-relative velocity; Magnus lift follows the spin-vector cross
  velocity direction, with magnitudes `0.5 rho A V^2 Cd/Cl`. The force form,
  spin ratio and Reynolds-number definitions, and two historical Pro V1
  coefficient anchors come from
  [Acushnet US6916255B2](https://patents.google.com/patent/US6916255B2/en).
- The exposed Smits-Smith option implements the published driver correlation
  (`70,000 < Re < 210,000`, `0.08 < S < 0.20`) from A. J. Smits and D. R.
  Smith, *A New Aerodynamic Model of a Golf Ball in Flight*, Science and Golf
  II (1994), pp. 340-347. An author-hosted copy is indexed at
  [ResearchGate](https://www.researchgate.net/publication/284037213_A_new_aerodynamic_model_of_a_golf_ball_in_flight).
- Lyu et al. measured production-ball lift/drag dependence and used 4% spin
  loss per second in their trajectory comparison:
  [Aerodynamics of Golf Balls in Still Air](https://doi.org/10.3390/proceedings2060238).

### ENGINE-DERIVED

- Coordinate system: `x = golfer right`, `y = target`, `z = up`, right-handed.
- With attack `A`, path `P`, loft `L`, and face `F`, the unit vectors are

  ```text
  v = (cos A sin P, cos A cos P, sin A)
  n = (cos L sin F, cos L cos F, sin L)
  ```

- True 3-D spin loft is the principal included angle

  ```text
  lambda = atan2(|v x n|, v . n)
  ```

  At neutral horizontal delivery (`F = P = 0`) and in the normal golf domain
  `0 <= L - A <= 180 degrees`, this reduces exactly to `L - A`. The signed
  vertical quantity remains separately exposed as
  `signedVerticalSpinLoftDeg = L - A`.
- The centred D-plane spin axis is parallel to `v x n`. Let

  ```text
  qv = cos A sin L - sin A cos L cos(F - P)
  qh = cos L sin(F - P)
  ```

  In the path-attached basis,
  `v x n = qv*r + qh*(sin A*f - cos A*z)`. The exact reported rightward tilt
  from world horizontal is therefore

  ```text
  tiltRight = atan2(cos A * qh,
                    sqrt(qv^2 + sin(A)^2 * qh^2))
  ```

  or equivalently `-elevation(v x n)`. For small attack and delivery angles it
  becomes `atan2(face - path, |dynamic loft - attack|)`. This is the geometric
  loft-forgiveness term: increasing the vertical denominator reduces tilt for
  the same face-to-path gap.
- Total spin is placed on that one exact axis. Backspin and right-curve spin
  are projections of the same vector; neither is an independent fabricated
  spin input.
- Lateral flight is integrated with deterministic fixed-step RK4 using the full
  spin vector, drag, gravity, Magnus lift, wind-relative velocity, and
  exponential spin decay. The production solve is calm-air and centred-strike.

### ESTIMATE / compatibility choices

- ~~The retained impact-spin magnitude is `spinLoft3D(deg) * ballSpeed(mph) * K`,
  where `K = 1.8` / `K = 0.93`, with a blended 1500-rpm floor.~~
  **SUPERSEDED by `e7d3133`.** The fitted magnitude, both `spinK` constants and
  the 1500-rpm floor (and its blend) were all deleted. Total spin is now
  CALCULATED by `centeredImpactSpin` — Penner rolling-at-separation,
  `omega = V*sin(theta) / [R*(1 + k*(1 + m_ball/m_head))]` — scaled by one
  exposed per-club constant `spinCal = 1.065` (identical for 7-iron and driver;
  there is deliberately no driver-only value). The only remaining bound is a
  9000 rpm sanity ceiling; spin now goes continuously to zero with spin loft,
  so no floor blend is needed. `spinCal` was set by anchoring the neutral
  7-iron on 6793.9 rpm (result 6705.9, −88 rpm). See
  `scripts/impact-flight-calculated-spin.test.mjs`.
- The production aerodynamic bridge is not an exact current Pro V1 or Pro V1x
  model. `Cl = 0.4072*S^0.4`; its scale and the Cd bridge pass through the two
  historical patent anchors, while the curve shapes between/outside those
  points are Flightglass approximations.
- A fixed drag multiplier `1.275116456035` anchors one neutral 7-iron RK4 carry
  to the retained longitudinal engine. It is a disclosed compatibility scale,
  not a golf-ball coefficient.
- The existing fitted carry, apex, launch, landing and roll models remain
  authoritative. RK4 supplies lateral bend. Its terminal lateral/downrange
  ratio is projected onto retained carry; raw aerodynamic carry, raw curve and
  projection scale are returned for audit.
- `offline = carry*sin(startDirection) + curve` remains unchanged for consumer
  compatibility. Because `curve` is perpendicular to the launch line, the
  exact target-frame expression would multiply curve by
  `cos(startDirection)`. The retained identity is a small-angle approximation.
- Start/launch weights, smash relationship, spin clamps, carry projection and
  the optional gear parameters are estimates, not lab calibration.

## A. `solveFlight` input signature

No new required input was added. Names and units remain:

| Input | Unit | Status |
|---|---:|---|
| `clubPath` | deg | unchanged |
| `faceAngle` | deg | unchanged |
| `attackAngle` | deg | unchanged |
| `dynamicLoft` | deg | unchanged |
| `clubSpeed` | mph | unchanged |
| `club` | string | optional before and after; defaults to `7iron` |

`club` is not new. Consequently this branch does not newly invalidate
`selectOutcome`'s five-value memo key. The Impact selector still never passes a
club and therefore always receives the default preset. If a later UI exposes
club selection, `club` must be added to both the call and memo key in that same
change, or cached outcomes will be stale.

Input validation is stricter: numeric strings are still coerced and blank or
missing scalar fields still default to zero, but non-finite values now throw
`TypeError` and negative club speed throws `RangeError`. The old solve commonly
silently substituted zero for non-numeric values and accepted negative speed.

## B. Outputs and units

The 13 Outcome-facing values retain their names and units at the raw engine
boundary:

- `carry`, `total`, `apex`, `curve`, `offline`: yards.
- `startDirection`, `spinAxis`, `launchAngle`, `spinLoft`, `landingAngle`:
  degrees.
- `backspin`: rpm; `ballSpeed`: mph; `smash`: dimensionless.

`side` is not a raw `solveFlight` field; `selectOutcome` maps
`raw.offline * 0.9144` to `outcome.m.side`. That remains the one UI
yards-to-metres conversion. No Outcome-facing field was renamed.

Semantics changed under five retained names:

- `spinLoft`: signed 2-D subtraction -> non-negative principal 3-D included
  angle; signed vertical loft remains separately available.
- `spinAxis`: fitted/clamped gain -> exact centred `v x n` tilt from world
  horizontal.
- `backspin`: independently clamped scalar -> absolute flight-relative
  projection of the bounded total-spin vector.
- `curve`: fitted `carry^2 * axis` expression -> RK4 full-vector bend, retained
  in yards at this boundary.
- `spinRpmRaw`: pre-clamp backspin -> pre-floor/cap total-spin estimate.

Removed explainer fields:

`smashConst`, `spinAxisGain`, `axisMax`, `curveFactor`, `offlineCapFrac`,
`carryMax`, `carryTau`.

Added audit outputs:

- Geometry/strike: `club`, `spinLoft3DDeg`,
  `signedVerticalSpinLoftDeg`, `spinAxisUnit`, `clubVelocityUnit`,
  `faceNormalUnit`, `horizontalSpinLoftComponent`,
  `verticalSpinLoftComponent`, `centeredStrike`, `gearEffectApplied`.
- Spin: `signedBackspinRpm`, `totalSpinRpm`, `rightCurveSpinRpm`,
  `spinVectorRadPerSec`, `minTotalSpinRpm`, `maxTotalSpinRpm`,
  `spinFloorFullAtDeg`, `spinFloorBlend`, `spinFloorAppliedRpm`.
- Lateral flight: `curveFromLaunchLineM`, `rawCurveFromLaunchLineM`,
  `curveFlightCarryYd`, `curveFlightTimeSeconds`,
  `curveCarryProjectionDefined`, `curveCarryProjectionScale`,
  `curveCarryProjectionMinimumDownrangeM`, `aerodynamicDiagnostics`,
  `aeroModel`.
- Renamed calibration disclosure: `smashPresetCap` replaces `smashConst`.

Suffixes carry units where practical: `*M` is metres, `*Yd` is yards,
`*Rpm` is rpm, `*RadPerSec` is rad/s, and `*Deg` is degrees. Unit vectors,
projection scales, Reynolds number, spin parameter, floor blend and the two
tangential components are dimensionless. Flight time is seconds.

The exported helper `shapeLabel(startDirection, secondArg)` also changes its
second-argument meaning from fitted `spinAxis` to true `faceToPath`. There are
no other repository callers of this helper, but it is an exported API change.

## C/D. Before and after reference shots

All distances below are shown in the Outcome/UI contract (metres): the raw
engine yards were multiplied by exactly `0.9144`. `side` is raw `offline` after
that conversion. Other values retain the raw units shown. Values are rounded
for review and are estimates, not TrackMan measurements.

### Reference

Input: `{face: 2, path: 0, attack: 3, dynLoft: 24, speed: 130}`; default
`7iron` preset.

| Output | Unit | Before | After |
|---|---:|---:|---:|
| carry | m | 206.503 | 206.518 |
| total | m | 213.429 | 213.431 |
| apex | m | 32.305 | 32.303 |
| curve | m | 18.321 | 12.752 |
| side | m | 23.943 | 18.374 |
| launchDir | deg | 1.560 | 1.560 |
| spinAxis | deg | 4.714 | 5.077 |
| launchAng | deg | 15.630 | 15.630 |
| spinLoft | deg | 21.000 | 21.089 |
| landAng | deg | 49.307 | 49.349 |
| backspin | rpm | 6761.664 | 6758.400 |
| ballSpeed | mph | 178.880 | 178.834 |
| smash | ratio | 1.376000 | 1.375645 |

### Driver-like

Input: `{face: 3, path: 0, attack: 4, dynLoft: 12, speed: 110,
club: "driver"}`.

| Output | Unit | Before | After |
|---|---:|---:|---:|
| carry | m | 202.742 | 202.591 |
| total | m | 213.892 | 213.733 |
| apex | m | 22.194 | 22.182 |
| curve | m | 69.535 | 15.499 |
| side | m | 78.449 | 24.407 |
| launchDir | deg | 2.520 | 2.520 |
| spinAxis | deg | 18.563 | 20.131 |
| launchAng | deg | 8.440 | 8.440 |
| spinLoft | deg | 8.000 | 8.533 |
| landAng | deg | 32.000 | 32.000 |
| backspin | rpm | 1500.000 | 1404.947 |
| ballSpeed | mph | 157.080 | 156.846 |
| smash | ratio | 1.428000 | 1.425868 |

### Wedge-like

Input: `{face: 3, path: 0, attack: -5, dynLoft: 40, speed: 80}`. There is no
wedge preset, so this uses wedge delivery geometry with the default 7-iron
impact calibration.

| Output | Unit | Before | After |
|---|---:|---:|---:|
| carry | m | 129.757 | 129.712 |
| total | m | 132.028 | 131.982 |
| apex | m | 33.819 | 33.814 |
| curve | m | 5.064 | 3.750 |
| side | m | 9.818 | 8.503 |
| launchDir | deg | 2.100 | 2.100 |
| spinAxis | deg | 3.300 | 3.233 |
| launchAng | deg | 23.550 | 23.550 |
| spinLoft | deg | 45.000 | 45.085 |
| landAng | deg | 60.000 | 60.000 |
| backspin | rpm | 8294.400 | 8290.416 |
| ballSpeed | mph | 102.400 | 102.373 |
| smash | ratio | 1.280000 | 1.279661 |

### Qualitative validation probes (new engine only)

All probes use `face = +3`, `path = 0`, centred contact and calm air.

| Probe | Spin loft | Spin axis | Backspin | Curve | Side |
|---|---:|---:|---:|---:|---:|
| Driver 9 deg, attack 0, 105 mph | 9.483 deg | 18.285 deg | 1423 rpm | 10.858 m | 19.658 m |
| Driver 12 deg, attack 0, 105 mph | 12.364 deg | 13.832 deg | 1652 rpm | 10.029 m | 18.625 m |
| Hybrid-like, loft 19, attack -3, 95 mph | 22.197 deg | 7.516 deg | 5157 rpm | 9.166 m | 16.490 m |
| Wedge-like, loft 40, attack -5, 80 mph | 45.085 deg | 3.233 deg | 8290 rpm | 3.750 m | 8.503 m |

The 12-degree driver has 24% less axis tilt, 7.6% less curve and 5.3% less
carry-side miss than the 9-degree driver in this probe. The wedge-like delivery
tilts and curves much less than the hybrid-like delivery. Neutral face/path
regressions also verify that increasing spin loft raises backspin and lowers
smash while preserving the existing calibrated outputs.

## E. Known gaps and review risks

- **Positive-spin-loft domain:** true 3-D spin loft is a non-negative included
  angle. When `dynamicLoft < attackAngle`, `signedVerticalSpinLoftDeg` is
  negative and the vector correctly has topspin sense, but retained
  longitudinal fits consume the positive included angle and `backspin` exposes
  the absolute projection. The existing `selectOutcome` check
  `spinLoft > 0` can no longer identify this signed-domain case. A later engine
  contract must decide whether to reject topspin delivery or make all
  longitudinal outputs signed-aware.
- **Impact magnitude is empirical:** no deformable club-ball collision,
  friction, COR, groove, cover, moisture, dynamic lie, shaft or head rotation
  model is present. `K`, smash, the floor/cap and launch weights need measured
  calibration.
- **No current named-ball calibration:** modern Pro V1/Pro V1x coefficient
  surfaces are proprietary. The historical two-anchor bridge is illustrative,
  and reverse Magnus is not modeled. Diagnostics flag Reynolds/spin-parameter
  extrapolation.
- **Hybrid longitudinal/lateral solve:** carry, apex, launch, landing and roll
  remain fitted legacy outputs. Only curve comes from the aerodynamic solve and
  is projected onto retained carry. This cannot claim independent named-ball
  carry prediction.
- **Projection edge:** below 1 m raw downrange the carry projection is marked
  undefined and raw lateral curve is returned. Consumers must respect
  `curveCarryProjectionDefined` for such out-of-domain inputs.
- **Target-coordinate approximation:** the retained offline identity omits the
  exact `cos(startDirection)` factor on launch-line-relative curve. Error is
  tiny at normal launch directions but grows for extreme starts.
- **Flight simplifications:** spin-axis direction is fixed; spin magnitude uses
  one exponential decay constant. Ball orientation, dimple/seam asymmetry,
  turbulence, gusts, temperature, altitude and surface/roll physics are not
  calibrated here.
- **Club coverage:** driver has a separate smash/spin preset but still uses the
  shared 7-iron-oriented longitudinal fit. No wedge preset exists.
- **Loft forgiveness is not a universal monotonic guarantee:** total spin rises
  with spin loft while axis tilt falls. Their aerodynamic combination passes
  the stated +3-degree driver probe, but at sufficiently extreme face-to-path
  gaps the empirical total-spin increase can partly offset or reverse the curve
  difference. That region needs measured calibration, not another hidden gain.
- **Gear effect is separate and uncalibrated:** `addHorizontalGearEffect` is an
  optional first-order rigid sticking-model helper. Core `solveFlight` never
  calls it. Its CG depth, yaw MOI, COR and efficiency defaults are estimates and
  must not be presented as measured driver truth.
- **Downstream compatibility is intentionally unresolved on this branch:**
  Impact popovers and Academy fixtures/mastery gates may rely on removed
  explainer fields or old numeric values. They were not edited to make tests
  green. Those failures are review evidence for a separate consumer migration.
