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
 *   - ./driver-flight.mjs remains a clearly labelled orphan reference study;
 *     it is not shipping solveFlight acceptance.
 * ESTIMATE relationships (fitted/illustrative — NOT measured by us):
 *   - Launch, smash, spin calibration, carry, apex and landing use compact
 *     fits derived from six official TrackMan 2023 PGA bag rows. Six interleaved
 *     clubs are validation-only. Dynamic Loft inputs are Flightglass delivery
 *     assumptions because TrackMan's current bag asset does not publish them.
 *   - Longitudinal carry/apex/landing remain empirical. RK4 still supplies only
 *     lateral bend, projected onto empirical carry for compatibility.
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

// ESTIMATE (TrackMan 2023 PGA fit-set recalibration, checked 2026-07-21):
// one continuous delivery curve covers the public five-input path without an
// invented club selector. Fit clubs: Driver, 3-wood, 5-/7-/9-iron and PW; the
// six interleaved clubs remain validation-only. TrackMan's current full-bag
// asset does not publish Dynamic Loft, so those delivery inputs are assumptions.
const LAUNCH_INTERCEPT = 10.391891433573875;
const LAUNCH_LOFT_LINEAR = -0.1693792957175766;
const LAUNCH_LOFT_QUADRATIC = 0.012024703872880052;
const LAUNCH_ATTACK_WEIGHT = 0.25;
const LAUNCH_INTERCEPT_FULL_AT_LOFT = 10;

// Compatibility echo only; no recalibrated output depends on this label.
const DEFAULT_CLUB = '7iron';

// ESTIMATE (TrackMan 2023 six-club fit set): compact longitudinal response
// curves. Carry is a zero-intercept monotone quadratic: its derivative is
// positive for every non-negative ball speed, removing the old high-speed
// rollover. Apex uses ball speed, launch angle and the same low-launch domain
// guard as carry. Landing angle saturates smoothly with spin loft instead of
// pinning wedges to the old 60-degree cap.
const CARRY_BALL_SPEED_LINEAR = 0.9205937574433162;
const CARRY_BALL_SPEED_QUADRATIC = 0.004072298666112809;
const CARRY_FULL_LAUNCH_AT_DEG = 10;
const APEX_BASE_PER_BALL_SPEED = 0.1300557732;
const APEX_LAUNCH_PER_BALL_SPEED_DEG = 0.0079993922;
const LANDING_CEILING_DEG = 52.8;
const LANDING_EXPONENTIAL_SCALE_DEG = 41.5;
const LANDING_SPIN_LOFT_TAU_DEG = 10.9;

// ESTIMATE (TrackMan 2023 six-club fit set): a quadratic captures the observed
// faster loss of strike efficiency through the iron/wedge ladder without the
// former hard 1.46 driver ceiling. The bounds are domain guards, not fit knobs.
const SMASH_INTERCEPT = 1.544034400161688;
const SMASH_SPIN_LOFT_LINEAR = -0.0033788247838473073;
const SMASH_SPIN_LOFT_QUADRATIC = -0.00006496570484201677;
const SMASH_MIN = 1.15;
const SMASH_MAX = 1.52;

// ESTIMATE/CALIBRATION (TrackMan 2023 six-club fit set): a smooth four-
// coefficient sigmoid absorbs the across-bag club-property difference while
// centeredImpactSpin retains the full 3-D mismatch. Calibration reads only the
// signed vertical delivery gap, so face/path does not apply the fit twice or
// distort the verified lateral geometry. Holdouts did not set these constants.
const SPIN_CAL_LOW = 0.81;
const SPIN_CAL_RANGE = 0.32;
const SPIN_CAL_MIDPOINT_DEG = 31.98;
const SPIN_CAL_WIDTH_DEG = 2.14;

function spinCalibrationForVerticalSpinLoft(verticalSpinLoft) {
  return SPIN_CAL_LOW + SPIN_CAL_RANGE /
    (1 + Math.exp(-(verticalSpinLoft - SPIN_CAL_MIDPOINT_DEG) / SPIN_CAL_WIDTH_DEG));
}

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

  // Compatibility echo only. Shipping Impact intentionally has five inputs;
  // this optional label cannot select a different longitudinal model.
  const club = input.club === 'driver' ? 'driver' : DEFAULT_CLUB;

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

  // ESTIMATE: continuous fit shared by direct calls and selectOutcome. Fade the
  // intercept to zero below 10° so the public 0° loft endpoint remains sane.
  const launchInterceptBlend = clamp(
    dynamicLoft / LAUNCH_INTERCEPT_FULL_AT_LOFT,
    0,
    1,
  );
  const launchAngle = LAUNCH_INTERCEPT * launchInterceptBlend +
    LAUNCH_LOFT_LINEAR * dynamicLoft +
    LAUNCH_LOFT_QUADRATIC * dynamicLoft ** 2 +
    LAUNCH_ATTACK_WEIGHT * attackAngle;

  // FIRST PRINCIPLES: + means a D-plane orientation that curves right for RH.
  const faceToPath = faceAngle - clubPath;
  // Exact world-horizontal D-plane tilt comes from the full v x n axis;
  // no fitted gain or axis clamp remains.
  const spinAxis = geometry.dPlaneTiltRightDeg;

  // ESTIMATE: ball speed via the six-club fit-set quadratic above. Higher spin
  // loft remains a less efficient, more glancing strike; unlike the old line,
  // this permits a tour driver near 1.49 while steepening through the wedges.
  const smashEff = clamp(
    SMASH_INTERCEPT + SMASH_SPIN_LOFT_LINEAR * spinLoft +
      SMASH_SPIN_LOFT_QUADRATIC * spinLoft ** 2,
    SMASH_MIN,
    SMASH_MAX,
  );
  const ballSpeed = clubSpeed * smashEff; // ESTIMATE

  // ESTIMATE: fit-set quadratic constrained through the origin. For v >= 0,
  // d(carry)/dv = linear + 2*quadratic*v > 0 by construction.
  const carryBallSpeedFit = CARRY_BALL_SPEED_LINEAR * ballSpeed +
    CARRY_BALL_SPEED_QUADRATIC * ballSpeed ** 2;
  // ESTIMATE/domain guard: the fit rows launch around 10° or higher. Below
  // that domain, scale continuously to zero rather than granting full carry to
  // a zero-launch shot. This also makes corrected launch feed corrected carry.
  const carryLaunchEfficiency = Math.sqrt(clamp(
    Math.max(0, launchAngle) / CARRY_FULL_LAUNCH_AT_DEG,
    0,
    1,
  ));
  const carry = carryBallSpeedFit * carryLaunchEfficiency;
  const hasFlight = carry > 0;

  // ESTIMATE: compact fit retaining both physical levers. Reuse carry's
  // low-launch guard so Apex tends continuously to zero with airborne extent.
  const apexBallSpeedTerm = APEX_BASE_PER_BALL_SPEED * ballSpeed *
    carryLaunchEfficiency;
  const apexLaunchTerm = APEX_LAUNCH_PER_BALL_SPEED_DEG * ballSpeed *
    Math.max(0, launchAngle) * carryLaunchEfficiency;
  const apex = apexBallSpeedTerm + apexLaunchTerm;
  const apexLaunchFactor = apexBallSpeedTerm > 0 ? apex / apexBallSpeedTerm : 1;

  // ESTIMATE: saturating spin-loft descent curve from the fit set.
  const verticalSpinLoft = Math.abs(geometry.signedVerticalSpinLoftDeg);
  const landingSpinTerm = -LANDING_EXPONENTIAL_SCALE_DEG *
    Math.exp(-verticalSpinLoft / LANDING_SPIN_LOFT_TAU_DEG);
  const landingModelRaw = LANDING_CEILING_DEG + landingSpinTerm;
  const landingDomainTerm = hasFlight ? 0 : -landingModelRaw;
  const landingRaw = landingModelRaw + landingDomainTerm;
  const landingAngle = hasFlight ? clamp(landingRaw, 32, 60) : 0;

  // ESTIMATE: total = carry + descent-tied roll.
  const rollFrac = carry > 0
    ? clamp(0.04 - (landingAngle - 45) * 0.0015, 0.012, 0.055)
    : 0;
  const total = carry + carry * rollFrac;

  // CURVE: full spin vector plus aerodynamic integration; no carry² divisor,
  // axis gain, or arbitrary lateral cap remains.
  // RETAINED EMPIRICAL IMPACT SPIN: the calibrated relationship now supplies
  // bounded TOTAL spin from true 3-D spin loft. The exact velocity-cross-normal axis carries its
  // orientation; backspin and curve-spin are projections of that one vector.
  // This avoids a singular division when the D-plane axis is nearly vertical.
  // CALCULATED impact spin (rolling at separation, Penner) via centeredImpactSpin,
  // scaled by the delivery's exposed calibration. This replaces the fitted
  // spinLoft·ballSpeed·k magnitude and its 1500-rpm floor. Axis and launch
  // orientation below are untouched — only the MAGNITUDE is now model-derived, so
  // the displayed backspin and the curve's spin vector can no longer disagree.
  const spinCalibration = spinCalibrationForVerticalSpinLoft(verticalSpinLoft);
  const calculatedSpin = centeredImpactSpin(
    { clubSpeed, attackAngle, clubPath, dynamicLoft, faceAngle },
    { spinCalibration },
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
  const curveFromLaunchLineM = !hasFlight || faceToPath === 0
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
  // m_head))], scaled by the exposed spinCalibration and bounded only by
  // a 9000 rpm sanity ceiling. The old fitted spinLoft·ballSpeed·spinK product
  // and its 1500-rpm floor are GONE — do not reintroduce either.
  // Reported backspin is the flight-relative projection of that vector. At
  // neutral face/path the projection is exactly one.
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
    launchAngle,      // ESTIMATE continuous five-input-path fit
    spinAxis,         // CALCULATED D-plane right tilt
    ballSpeed,        // ESTIMATE (spin-loft-responsive smash)
    carry,            // ESTIMATE (monotone TrackMan fit)
    apex,             // ESTIMATE (ball-speed/launch fit)
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
    apexLaunchFactor, // ESTIMATE diagnostic ratio: full apex / speed-only term
    faceToPath,
    // ── LIVE breakdown weights (single source of truth for the UI explainers) ──
    // These let the popover format the start-direction / launch-angle math WITHOUT
    // duplicating the constants. The glass backup ignores these extra fields.
    startFaceW: faceW,            // SOURCED live face weight (loft-dependent)
    launchLoftW: LAUNCH_LOFT_LINEAR,
    launchLoftQuadratic: LAUNCH_LOFT_QUADRATIC,
    launchAttackW: LAUNCH_ATTACK_WEIGHT,
    launchIntercept: LAUNCH_INTERCEPT,
    launchInterceptBlend,
    // ── LIVE breakdown constants + intermediates (single source of truth) ──
    // Every outcome-chip explainer in the UI sources its constants from HERE,
    // so the popover maths can never drift from the model.
    smashModelIntercept: SMASH_INTERCEPT,
    smashSpinLoftLinear: SMASH_SPIN_LOFT_LINEAR,
    smashSpinLoftQuadratic: SMASH_SPIN_LOFT_QUADRATIC,
    smashMinimum: SMASH_MIN,
    smashMaximum: SMASH_MAX,
    // CALIBRATION on the calculated rolling-at-separation spin. The fitted
    // spinK slope, the 1500-rpm floor and its blend are gone — only a sanity
    // ceiling remains, so the driver is no longer pinned at an unphysical floor.
    spinCalibration,
    spinCalibrationLow: SPIN_CAL_LOW,
    spinCalibrationRange: SPIN_CAL_RANGE,
    spinCalibrationMidpointDeg: SPIN_CAL_MIDPOINT_DEG,
    spinCalibrationWidthDeg: SPIN_CAL_WIDTH_DEG,
    spinRpmRaw,                   // calculated total spin before the sanity clamp
    maxTotalSpinRpm: MAX_TOTAL_SPIN_RPM,
    carryBallSpeedLinear: CARRY_BALL_SPEED_LINEAR,
    carryBallSpeedQuadratic: CARRY_BALL_SPEED_QUADRATIC,
    carryBallSpeedFit,
    carryFullLaunchAtDeg: CARRY_FULL_LAUNCH_AT_DEG,
    carryLaunchEfficiency,
    apexBasePerBallSpeed: APEX_BASE_PER_BALL_SPEED,
    apexLaunchPerBallSpeedDeg: APEX_LAUNCH_PER_BALL_SPEED_DEG,
    apexBallSpeedTerm,
    apexLaunchTerm,
    rollFrac,                     // ESTIMATE descent-tied roll fraction
    roll: carry * rollFrac,       // ESTIMATE roll distance (yd)
    // landing-angle decomposition (saturating fit plus explicit no-flight guard)
    landingBase: LANDING_CEILING_DEG,
    landingSpinTerm,
    landingLaunchTerm: 0,
    landingApexTerm: 0,
    landingDomainTerm,
    landingSpinLoftTau: LANDING_SPIN_LOFT_TAU_DEG,
    landingRaw,
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
