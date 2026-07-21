/**
 * IMPACT / BALL-FLIGHT — pure ESM math (centered-strike 3-D D-plane model).
 * No deps. Pure functions. Mirrors the export-style of
 * ./swing-parameters-and-impact.js (named exports, deg/rad helpers).
 *
 * Inputs (all degrees unless noted):
 *   clubPath     — horizontal club-head path at impact. + = in-to-out (right), - = out-to-in (left).
 *   faceAngle    — face orientation at impact, relative to target line. + = open (right), - = closed.
 *   attackAngle  — vertical approach of the club. + = up, - = down (descending).
 *   dynamicLoft  — effective loft delivered at impact (deg).
 *   clubSpeed    — club-head speed at impact, in MPH.
 *
 * Sign convention for a right-handed golfer, viewed DOWN THE LINE toward the target:
 *   +offline / +startDirection / +spinAxis  => ball goes/curves RIGHT.
 *
 * SOURCED relationships (well-established D-plane / launch-monitor model):
 *   - Start direction is dominated by face angle (~75% face / ~25% path).
 *   - True spin loft is the 3-D angle between club velocity and face normal.
 *   - Launch angle tracks dynamic loft strongly, attack angle weakly.
 *   - The centered D-plane spin axis follows v x n. Face/path set its lateral
 *     sign while loft/attack set how strongly the same gap tilts the axis.
 * CALCULATED lateral flight:
 *   - Curve is the RK4 drag/Magnus result from the complete 3-D spin vector.
 *   - Aerodynamics use a disclosed historical Pro-V1-class bridge, not exact
 *     current Pro V1/Pro V1x coefficients (those are proprietary).
 *   - Driver carry (./driver-flight.mjs, solveDriverCarry) is a real
 *     drag+Magnus 2D integrator, calibrated against TrackMan optimal
 *     launch/spin — not a fitted curve. Known gap: emergent spin locus sits
 *     +178 rpm high at 125 mph ball speed (flat where TrackMan tilts down);
 *     8/9 reference speeds inside tolerance. Closing the 125 mph case needs
 *     published Cd/Cl(Re, spin) golf-ball tables, not parameter fudging.
 * RETAINED ESTIMATE relationships (fitted/illustrative — NOT measured by us):
 *   - The exact blend weights and the smash factor are illustrative
 *     approximations chosen to feel realistic for a mid-iron, not lab-calibrated.
 *   - The 7-iron carry/apex/landing tour-reference table (this file's
 *     `solveFlight`) is likewise a fitted curve — NOT the driver path above.
 * Centered-strike scope guard: solveFlight never calls the optional gear-effect
 * helper. All core spin and curve come only from delivery geometry.
 */

import {
  FLIGHTGLASS_CURVE_CARRY_ANCHOR,
  PREMIUM_TOUR_CLASS_AERO,
  YARD_TO_M,
  centeredImpactGeometry,
  centeredImpactSpin,
  premiumTourDragCoefficient,
  premiumTourLiftCoefficient,
  simulateFlight,
  spinVectorFromTotalSpin,
} from './flightglass-3d-spin-model.js';

export const deg2rad = d => (d * Math.PI) / 180;
export const rad2deg = r => (r * 180) / Math.PI;
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ── Fitted / sourced constants ────────────────────────────────────────────

// SOURCED (direction split): start direction ≈ faceW*face + (1−faceW)*path,
// with faceW ≈ 0.75 at a mid-iron dynamic loft. Research-correct refinement:
// the face weight is LOFT-DEPENDENT — lower loft (driver) starts the ball more
// on the face (~0.85), higher loft (wedge) less (~0.62). We model this as a
// linear taper faceW = clamp(0.90 − dynLoft·0.005, 0.60, 0.88), which gives
// exactly 0.75 at dynLoft 30 (the default 7-iron). Computed per-shot in solve.
const START_FACE_W_BASE = 0.90;   // SOURCED (intercept of the loft taper)
const START_FACE_W_SLOPE = 0.005; // SOURCED (face weight drops 0.5%/° of loft)
const START_FACE_W_MIN = 0.60;    // SOURCED (wedge floor)
const START_FACE_W_MAX = 0.88;    // SOURCED (driver ceiling)

// SOURCED (launch split): launch angle ≈ 0.62*dynamicLoft + 0.25*attackAngle.
// The ball launches LOWER than the dynamic loft and is dynamic-loft-dominant;
// the attack angle contributes only a SMALL term (it must NOT dominate). For a
// descending 7-iron strike at dynLoft 30 / attack −3 this gives ~17.85°, the
// believable launch a launch monitor reports (not ~22°).
const LAUNCH_LOFT_W = 0.62; // SOURCED (loft-dominant, calibrated to ~17–18°)
const LAUNCH_ATTACK_W = 0.25; // SOURCED (small attack term)

// ── CLUB-SPECIFIC presets ──────────────────────────────────────────────────
// Genuinely club-specific calibration (smash factor + total-spin coefficient)
// lives here so a new club is just one more preset entry. The 7-iron values are
// the lab-feel calibration verified by the sweep harness. `state.club` selects
// the preset (defaults to '7iron'). Driver impact transfer/spin has its own
// preset; the retained longitudinal carry/apex fit below is still shared.
const CLUBS = {
  '7iron': {
    smash: 1.33,    // ESTIMATE (7-iron typical ball/club speed ratio)
    // CALIBRATION on the CALCULATED rolling-at-separation spin (centeredImpactSpin),
    // not a fitted rpm-per-degree slope. Anchored so a neutral 7-iron reproduces its
    // measured reference backspin (6793.9 rpm) within ±150. The driver shares the very
    // same value: its spin falls out of the physics, it is not separately tuned.
    spinCal: 1.065,
  },
  driver: {
    smash: 1.48,    // ref:TrackMan (typical driver)
    spinCal: 1.065, // identical physical calibration to the 7-iron — no driver-only fudge
  },
};
const DEFAULT_CLUB = '7iron';

// ESTIMATE: smash factor (ball speed / club speed) for a well-struck 7-iron ≈ 1.33.
// Kept as a back-compat alias of the 7-iron preset. Drivers run ~1.48; wedges lower.
const SMASH_7I = CLUBS['7iron'].smash; // ESTIMATE (7-iron typical)

// ESTIMATE — drag-saturated CARRY/APEX model for a 7-iron. Rather than scaling a
// tour reference linearly with ball speed (which runs away at high speed), carry
// and apex follow a concave saturating curve carry = MAX·(1 − e^(−ballSpeed/TAU))
// so they PLATEAU. A 7-iron can never exceed ~190 yd carry at any human speed.
// TAU tuned so ball 120 mph → ~172 yd carry; TAU2 so ball 120 → ~31 yd apex.
const APEX_MAX = 44;       // ESTIMATE (yd ceiling for apex height; raised 38→44 so 130 mph apexes ~35 m, remodel fix H)
const APEX_TAU = 85;       // ESTIMATE (ball-speed scale for apex, mph; 75→85, remodel fix H)

function finiteInput(input, key, fallback = 0) {
  const raw = input?.[key];
  if (raw === undefined || raw === null || raw === '') return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new TypeError(`${key} must be a finite number`);
  return value;
}

const MIN_PROJECTABLE_DOWNRANGE_M = 1;
// Only a sanity ceiling remains. The historical 1500-rpm floor is gone: it existed
// to prop up the fitted spinLoft·ballSpeed·k magnitude, and for a driver it BOUND —
// pinning total spin at an unphysical 1500 rpm and starving the curve. Calculated
// rolling-at-separation spin needs no floor.
const MAX_TOTAL_SPIN_RPM = 9000;

/**
 * Run one fixed-coefficient RK4 flight, then project its terminal lateral
 * ratio onto the retained Flightglass carry. This is compatibility glue
 * between the legacy longitudinal fit and the aerodynamic lateral solve:
 * it does not alter Cd per shot and it is not presented as a ball property.
 * The raw RK4 carry/curve and the exposed projection scale remain available.
 */
function carryProjectedCurveFlight(input, targetCarryM) {
  const raw = simulateFlight({
    ...input,
    dt: FLIGHTGLASS_CURVE_CARRY_ANCHOR.integrationStepSeconds,
    maxTimeSeconds: 30,
    liftCoefficient: premiumTourLiftCoefficient,
    dragCoefficient: (reynolds, spinParameter) =>
      premiumTourDragCoefficient(reynolds, spinParameter) *
        FLIGHTGLASS_CURVE_CARRY_ANCHOR.dragScale,
    aerodynamicModel: {
      id: `${PREMIUM_TOUR_CLASS_AERO.id}+${FLIGHTGLASS_CURVE_CARRY_ANCHOR.id}`,
      reynoldsValidity: PREMIUM_TOUR_CLASS_AERO.reynoldsValidity,
      spinParameterValidity: PREMIUM_TOUR_CLASS_AERO.spinParameterValidity,
      reverseMagnusPolicy: PREMIUM_TOUR_CLASS_AERO.reverseMagnusPolicy,
    },
  });
  const zeroTarget = targetCarryM <= 1e-12;
  const curveCarryProjectionDefined = zeroTarget ||
    raw.downLaunchLineM >= MIN_PROJECTABLE_DOWNRANGE_M;
  const curveCarryProjectionScale = zeroTarget
    ? 1
    : curveCarryProjectionDefined
      ? targetCarryM / raw.downLaunchLineM
      : null;
  const rawCurveFromLaunchLineM = raw.curveFromLaunchLineM;
  return {
    ...raw,
    rawCurveFromLaunchLineM,
    curveFromLaunchLineM: curveCarryProjectionDefined
      ? rawCurveFromLaunchLineM * curveCarryProjectionScale
      : rawCurveFromLaunchLineM,
    curveCarryProjectionDefined,
    curveCarryProjectionScale,
    curveCarryProjectionMinimumDownrangeM: MIN_PROJECTABLE_DOWNRANGE_M,
  };
}

/**
 * Full ball-flight solve from the 5 club inputs.
 * Returns an object of derived launch + flight numbers (all ESTIMATE-flagged
 * fields noted inline). Angles in degrees, distances in yards, speeds in mph.
 */
export function solveFlight(input) {
  const clubPath = finiteInput(input, 'clubPath');
  const faceAngle = finiteInput(input, 'faceAngle');
  const attackAngle = finiteInput(input, 'attackAngle');
  const dynamicLoft = finiteInput(input, 'dynamicLoft');
  const clubSpeed = finiteInput(input, 'clubSpeed');
  if (clubSpeed < 0) throw new RangeError('clubSpeed cannot be negative');

  // Club-specific preset (smash + spin coefficient). Defaults to 7-iron.
  const club = CLUBS[input.club] ? input.club : DEFAULT_CLUB;
  const preset = CLUBS[club];

  // SOURCED: start direction blend (face-dominant, loft-dependent weight).
  // faceW decreases as dynamic loft rises (driver more face, wedge less).
  const faceW = clamp(
    START_FACE_W_BASE - dynamicLoft * START_FACE_W_SLOPE,
    START_FACE_W_MIN, START_FACE_W_MAX
  );
  const startDirection = faceW * faceAngle + (1 - faceW) * clubPath;

  // SOURCED: spin loft is the angle between club path (3D) and face;
  // the standard simplification is dynamicLoft - attackAngle.
  const geometry = centeredImpactGeometry({
    clubSpeed, attackAngle, clubPath, dynamicLoft, faceAngle,
  });
  const spinLoft = geometry.spinLoft3DDeg;

  // SOURCED: launch angle blend (dynamic-loft-dominant, small attack term).
  // The ball launches lower than dynamic loft; attack only nudges it.
  const launchAngle = LAUNCH_LOFT_W * dynamicLoft + LAUNCH_ATTACK_W * attackAngle;

  // FIRST PRINCIPLES: + means a D-plane orientation that curves right for RH.
  const faceToPath = faceAngle - clubPath;
  // Exact world-horizontal D-plane tilt comes from the full v x n axis;
  // no fitted gain or axis clamp remains.
  const spinAxis = geometry.dPlaneTiltRightDeg;

  // ESTIMATE: ball speed via a spin-loft-responsive smash factor (audit fix D).
  // Higher spin loft = more glancing strike = less energy transfer = lower smash.
  // smashEff ≈ 1.46 − 0.004·spinLoft, clamped to [1.15, preset.smash + 0.09].
  const smashEff = clamp(1.46 - 0.004 * spinLoft, 1.15, preset.smash + 0.09); // ESTIMATE (spinLoft→smash coupling, audit fix D)
  const ballSpeed = clubSpeed * smashEff; // ESTIMATE

  // ESTIMATE: carry as a power curve with a soft high-end cap (remodel fix F).
  // The old single-exponential saturated far too hard: 53 mph ball carried
  // 119 yd and 173 mph only 186 yd. This fit is anchored to launch-monitor
  // data (LPGA 7i: 104 mph ball → ~145 yd; PGA: ~120 → ~175 yd) and stays
  // near-linear through the human range before drag bends the top over:
  // 53 mph → ~52 yd, 172.6 mph → ~216 yd.
  const carry = 0.232 * Math.pow(ballSpeed, 1.389) / (1 + Math.pow(ballSpeed / 210, 6)); // ESTIMATE (remodel fix F)

  // ESTIMATE: apex follows the same saturating shape (no linear runaway),
  // scaled by a launch-angle factor so a low launch flies a lower peak and a
  // high launch a taller one (launch→apex coupling, audit fix C).
  const apexLaunchFactor = clamp(0.35 + 0.65 * (launchAngle / 18), 0.45, 1.35); // ESTIMATE (audit fix C)
  const apex = APEX_MAX * (1 - Math.exp(-ballSpeed / APEX_TAU)) * apexLaunchFactor; // ESTIMATE

  // ESTIMATE: landing/descent angle from spin loft + launch + apex. The apex
  // term gives the missing speed coupling — a taller flight (faster ball)
  // descends steeper — and keeps apex↔landing consistent.
  // (speed→landing coupling via apex, audit fix B)
  const landingApexTerm = (apex - 30) * 1.0; // ESTIMATE (audit fix B decomposition)
  const landingAngle = clamp(
    45 + (spinLoft - 25) * 0.5 + (launchAngle - 14) * 0.6 + landingApexTerm,
    32, 60
  ); // ESTIMATE

  // ESTIMATE: total = carry + descent-tied roll.
  const rollFrac = clamp(0.04 - (landingAngle - 45) * 0.0015, 0.012, 0.055);
  const total = carry + carry * rollFrac;

  // CURVE: full spin vector plus aerodynamic integration; no carry² divisor,
  // axis gain, or arbitrary lateral cap remains.
  // RETAINED EMPIRICAL IMPACT SPIN: the calibrated relationship now supplies
  // bounded TOTAL spin from true 3-D spin loft. The exact velocity-cross-normal axis carries its
  // orientation; backspin and curve-spin are projections of that one vector.
  // This avoids a singular division when the D-plane axis is nearly vertical.
  // CALCULATED impact spin (rolling at separation, Penner) via centeredImpactSpin,
  // scaled by the club's single exposed calibration. This replaces the fitted
  // spinLoft·ballSpeed·k magnitude and its 1500-rpm floor. Axis and launch
  // orientation below are untouched — only the MAGNITUDE is now model-derived, so
  // the displayed backspin and the curve's spin vector can no longer disagree.
  const calculatedSpin = centeredImpactSpin(
    { clubSpeed, attackAngle, clubPath, dynamicLoft, faceAngle },
    { spinCalibration: preset.spinCal },
  );
  const spinRpmRaw = calculatedSpin.totalSpinRpm;
  const calculatedTotalSpinRpm = geometry.spinAxisDefined && ballSpeed > 0
    ? clamp(spinRpmRaw, 0, MAX_TOTAL_SPIN_RPM)
    : 0;
  const spin = spinVectorFromTotalSpin(geometry, calculatedTotalSpinRpm, {
    launchElevationDeg: launchAngle,
    launchAzimuthDeg: startDirection,
  });
  const signedBackspinRpm = spin.backSpinRpm;
  const backspin = Math.abs(signedBackspinRpm);

  // CALCULATED: deterministic RK4 drag/Magnus flight. The retained longitudinal
  // carry stays authoritative; only launch-line-relative curve comes from this
  // solve. Raw RK4 carry/curve and the carry-projection diagnostics are returned
  // for auditability.
  const curveFlight = carryProjectedCurveFlight({
    ballSpeedMph: ballSpeed,
    launchElevationDeg: launchAngle,
    launchAzimuthDeg: startDirection,
    spinVectorRadPerSec: spin.spinVectorRadPerSec,
  }, carry * YARD_TO_M);
  const curveFromLaunchLineM = faceToPath === 0
    ? 0
    : curveFlight.curveFromLaunchLineM;
  const curve = curveFromLaunchLineM / YARD_TO_M;
  const curveFlightCarryYd = curveFlight.downLaunchLineM / YARD_TO_M;

  // ESTIMATE: offline = total lateral displacement from the TARGET line =
  // start-line displacement (carry·sin(startDirection)) + the bend above.
  // A pure push/pull now shows a non-zero offline even with zero curve.
  // + = ball finishes right of the target line (for RH golfer).
  // (offline includes start direction, audit fix A)
  const offline = carry * Math.sin(deg2rad(startDirection)) + curve;

  // ── Added SkyTrak-style output fields ─────────────────────────────────────
  // CALCULATED: total spin is the rolling-at-separation magnitude from
  // centeredImpactSpin (Penner), omega = V·sin(theta)/[R·(1 + k·(1 + m_ball/
  // m_head))], scaled by the single exposed preset.spinCal and bounded only by
  // a 9000 rpm sanity ceiling. The old fitted spinLoft·ballSpeed·spinK product
  // and its 1500-rpm floor are GONE — do not reintroduce either.
  // Reported backspin is the flight-relative projection of that vector. At
  // neutral face/path the projection is exactly one, preserving the calibrated
  // default 7-iron near its anchor.
  // ESTIMATE: smash factor = ball speed / club speed. With the spin-loft-
  // responsive smash above (audit fix D) this now equals smashEff, so the
  // panel ratio tracks the delivered spin loft. Flagged ESTIMATE.
  const smash = clubSpeed > 0 ? ballSpeed / clubSpeed : 0; // ESTIMATE (== smashEff)

  return {
    // echoed inputs
    clubPath, faceAngle, attackAngle, dynamicLoft, clubSpeed, club,
    // derived
    startDirection,   // SOURCED blend
    spinLoft,         // CALCULATED true 3-D included angle
    spinLoft3DDeg: geometry.spinLoft3DDeg,
    signedVerticalSpinLoftDeg: geometry.signedVerticalSpinLoftDeg,
    launchAngle,      // SOURCED blend
    spinAxis,         // CALCULATED D-plane right tilt
    ballSpeed,        // ESTIMATE (fixed smash)
    carry,            // ESTIMATE (scaled tour ref)
    apex,             // ESTIMATE (scaled tour ref)
    landingAngle,     // ESTIMATE
    offline,          // ESTIMATE
    // added panel fields
    total,            // ESTIMATE (carry + descent-tied roll)
    curve,            // CALCULATED RK4 bend from launch line, yards
    curveFromLaunchLineM,
    rawCurveFromLaunchLineM: curveFlight.rawCurveFromLaunchLineM,
    curveFlightCarryYd,
    curveFlightTimeSeconds: curveFlight.flightTimeSeconds,
    curveCarryProjectionDefined: curveFlight.curveCarryProjectionDefined,
    curveCarryProjectionScale: curveFlight.curveCarryProjectionScale,
    curveCarryProjectionMinimumDownrangeM:
      curveFlight.curveCarryProjectionMinimumDownrangeM,
    backspin,         // CALCULATED (projection of the Penner total-spin vector, rpm)
    signedBackspinRpm,
    totalSpinRpm: spin.totalSpinRpm,
    rightCurveSpinRpm: spin.rightCurveSpinRpm,
    spinVectorRadPerSec: [...spin.spinVectorRadPerSec],
    spinAxisUnit: [...geometry.spinAxisUnit],
    clubVelocityUnit: [...geometry.clubVelocityUnit],
    faceNormalUnit: [...geometry.faceNormalUnit],
    horizontalSpinLoftComponent: geometry.horizontalTangential,
    verticalSpinLoftComponent: geometry.verticalTangential,
    centeredStrike: true,
    gearEffectApplied: false,
    aerodynamicDiagnostics: curveFlight.aerodynamicDiagnostics,
    aeroModel: {
      coefficientSetId: curveFlight.aerodynamicDiagnostics.coefficientSetId,
      baseCoefficientSetId: PREMIUM_TOUR_CLASS_AERO.id,
      class: 'historical Pro-V1-class isotropic bridge',
      exactNamedBall: PREMIUM_TOUR_CLASS_AERO.exactNamedBall,
      dragCompatibilityScale: FLIGHTGLASS_CURVE_CARRY_ANCHOR.dragScale,
      referenceAnchorDragScale: FLIGHTGLASS_CURVE_CARRY_ANCHOR.dragScale,
      carryProjectionScale: curveFlight.curveCarryProjectionScale,
      carryProjectionDefined: curveFlight.curveCarryProjectionDefined,
      integrationStepSeconds: FLIGHTGLASS_CURVE_CARRY_ANCHOR.integrationStepSeconds,
      spinDecayPerSecond: PREMIUM_TOUR_CLASS_AERO.spinDecayPerSecond,
      disclosure: `${PREMIUM_TOUR_CLASS_AERO.disclosure} ${FLIGHTGLASS_CURVE_CARRY_ANCHOR.disclosure} ` +
        'Terminal RK4 lateral displacement is projected by its downrange ratio onto the retained Flightglass carry; this is a disclosed compatibility transform, not a measured ball coefficient.',
    },
    smash,            // ESTIMATE (ballSpeed / clubSpeed == smashEff)
    smashEff,         // ESTIMATE (spinLoft-responsive smash, audit fix D)
    apexLaunchFactor, // ESTIMATE (launch→apex coupling factor, audit fix C)
    faceToPath,
    // ── LIVE breakdown weights (single source of truth for the UI explainers) ──
    // These let the popover format the start-direction / launch-angle math WITHOUT
    // duplicating the constants. The glass backup ignores these extra fields.
    startFaceW: faceW,            // SOURCED live face weight (loft-dependent)
    launchLoftW: LAUNCH_LOFT_W,   // SOURCED launch loft weight (≈0.62)
    launchAttackW: LAUNCH_ATTACK_W, // SOURCED launch attack weight (≈0.25)
    // ── LIVE breakdown constants + intermediates (single source of truth) ──
    // Every outcome-chip explainer in the UI sources its constants from HERE,
    // so the popover maths can never drift from the model.
    smashPresetCap: preset.smash, // ESTIMATE club-specific cap input
    // CALIBRATION on the calculated rolling-at-separation spin. The fitted
    // spinK slope, the 1500-rpm floor and its blend are gone — only a sanity
    // ceiling remains, so the driver is no longer pinned at an unphysical floor.
    spinCalibration: preset.spinCal,
    spinRpmRaw,                   // calculated total spin before the sanity clamp
    maxTotalSpinRpm: MAX_TOTAL_SPIN_RPM,
    apexMax: APEX_MAX,            // ESTIMATE apex yd ceiling
    apexTau: APEX_TAU,            // ESTIMATE apex ball-speed scale
    rollFrac,                     // ESTIMATE descent-tied roll fraction
    roll: carry * rollFrac,       // ESTIMATE roll distance (yd)
    // landing-angle decomposition (base + spinLoft + launch + apex terms, pre-clamp)
    landingBase: 45,
    landingSpinTerm: (spinLoft - 25) * 0.5,
    landingLaunchTerm: (launchAngle - 14) * 0.6,
    landingApexTerm,  // ESTIMATE ((apex−30)·1.0 speed coupling, audit fix B)
    landingRaw: 45 + (spinLoft - 25) * 0.5 + (launchAngle - 14) * 0.6 + landingApexTerm,
    // qualitative shape label (RH golfer)
    shape: shapeLabel(startDirection, faceToPath),
  };
}

/**
 * Qualitative ball-shape label (RH golfer) from start direction + face-to-path.
 * ESTIMATE thresholds, illustrative only.
 */
export function shapeLabel(startDirection, faceToPath) {
  // Use the delivered face-to-path gap directly; exact axis tilt is loft- and
  // attack-dependent and therefore cannot be inverted into a unique gap.
  const gap = Math.abs(faceToPath);
  const STRAIGHT_GAP = 0.75; // < this face-to-path gap reads as Straight
  const BIG_GAP = 6;         // > this gap is a Slice/Hook, not a Fade/Draw
  let curve;
  if (gap < STRAIGHT_GAP) curve = 'Straight';
  else if (faceToPath > 0) curve = gap > BIG_GAP ? 'Slice' : 'Fade';
  else curve = gap > BIG_GAP ? 'Hook' : 'Draw';
  let start;
  if (Math.abs(startDirection) < 1.5) start = '';
  else start = startDirection > 0 ? 'Push ' : 'Pull ';
  if (curve === 'Straight') return start ? start.trim() : 'Straight';
  return (start + curve).trim();
}

/**
 * Sample the down-the-line trajectory as normalized points for SVG drawing.
 * Returns an array of { d, h, x } where:
 *   d = downrange fraction 0..1 (toward target),
 *   h = height fraction 0..1 (0 ground, 1 at apex),
 *   x = lateral fraction -1..1 of max offline (+ = right).
 * Parabolic height profile skewed so apex sits before the end (descent steeper).
 * ESTIMATE: shape is illustrative, not a true drag/lift integration.
 */
export function trajectorySamples(flight, n = 48) {
  const pts = [];
  // apex fraction along carry: a descending iron peaks past the midpoint.
  const apexAt = 0.52; // ESTIMATE
  // start fraction of the lateral: the linear (launch-direction) share of offline.
  // Exact via the engine's own identity offline = start + curve → sf = 1 − curve/offline.
  // null → degenerate |offline|≈0 (start and curve cancel; see below).
  let sf = null;
  if (flight && isFinite(flight.offline) && Math.abs(flight.offline) > 1e-6 && isFinite(flight.curve)) {
    sf = 1 - flight.curve / flight.offline;
  }
  for (let i = 0; i <= n; i++) {
    const d = i / n;
    // piecewise parabola peaking at apexAt, normalized to 1 at the peak.
    let h;
    if (d <= apexAt) {
      const u = d / apexAt;
      h = 1 - (1 - u) * (1 - u); // ease up to 1
    } else {
      const u = (d - apexAt) / (1 - apexAt);
      h = 1 - u * u; // steeper fall-off
    }
    // lateral profile honors the TRUE start/curve split (physics hunt 2026-07-12):
    // the ball leaves the tee along startDirection (linear term) and the spin-axis
    // curve accelerates on top (quadratic term). Normalized so x(1) = 1 = full offline.
    // Degenerate |offline|≈0 (start and curve cancel): fall back to the old d² shape —
    // consumers scale x by offline≈0, so the straight render is the honest limit.
    const x = sf === null ? d * d : sf * d + (1 - sf) * d * d;
    pts.push({ d, h: clamp(h, 0, 1), x });
  }
  return pts;
}
