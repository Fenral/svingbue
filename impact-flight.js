/**
 * IMPACT / BALL-FLIGHT — pure ESM math (TrackMan / D-plane model).
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
 * SOURCED relationships (well-established in golf launch-monitor literature,
 *   e.g. TrackMan "D-Plane" and "New Ball Flight Laws"):
 *   - Start direction is dominated by face angle (~75% face / ~25% path).
 *   - Spin loft = dynamic loft - attack angle.
 *   - Launch angle tracks dynamic loft strongly, attack angle weakly.
 *   - Curvature (side spin / spin axis) is driven by face-to-path difference.
 * ENGINE-DERIVED (grounded in the D-plane relationship, not fitted; WO-E-MOTOR
 *   §E2, 2026-07-18):
 *   - The spin-axis gain scales ~1/spinLoft (axis ≈ atan(sidespin/backspin)),
 *     anchored so the tuned 7-iron reference axis is unchanged. Low-loft
 *     clubs (driver) tilt more per degree of face-to-path than a 7-iron.
 *   - Driver carry (./driver-flight.mjs, solveDriverCarry) is a real
 *     drag+Magnus 2D integrator, calibrated against TrackMan optimal
 *     launch/spin — not a fitted curve. Known gap: emergent spin locus sits
 *     +178 rpm high at 125 mph ball speed (flat where TrackMan tilts down);
 *     8/9 reference speeds inside tolerance. Closing the 125 mph case needs
 *     published Cd/Cl(Re, spin) golf-ball tables, not parameter fudging.
 * ESTIMATE relationships (fitted/illustrative constants — NOT measured by us):
 *   - The exact blend weights and the smash factor are illustrative
 *     approximations chosen to feel realistic for a mid-iron, not lab-calibrated.
 *   - The 7-iron carry/apex/landing tour-reference table (this file's
 *     `solveFlight`) is likewise a fitted curve — NOT the driver path above.
 */

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

// ESTIMATE: spin-axis gain. Spin axis tilt is proportional to (face - path);
// ~1.5° of axis tilt per 1° of face-to-path gap is a rough illustrative gain.
// Real spin axis depends on spin loft, gear effect and club; flag as ESTIMATE.
// The axis is also CLAMPED to ±AXIS_MAX: a physical spin-axis tilt never reaches
// the steep angles the ±20° sliders would otherwise produce (face−path can be
// ±40° → an unclamped 1.5× gain is ±60°, which is non-physical for a struck ball).
const SPIN_AXIS_GAIN = 1.5; // ESTIMATE (calibrated)
const AXIS_MAX = 38;        // ESTIMATE (deg ceiling for a realistic spin-axis tilt)

// ── CLUB-SPECIFIC presets ──────────────────────────────────────────────────
// Genuinely club-specific calibration (smash factor + backspin spin coefficient)
// lives here so a new club is just one more preset entry. The 7-iron values are
// the lab-feel calibration verified by the sweep harness. `state.club` selects
// the preset (defaults to '7iron'). Adding a DRIVER later = add one entry +
// (when the 3D model is ready) make carry/roll respond to its spin/launch.
const CLUBS = {
  '7iron': {
    smash: 1.33,  // ESTIMATE (7-iron typical ball/club speed ratio)
    spinK: 1.8,   // ESTIMATE (effective backspin rpm per °·mph)
  },
  driver: {
    smash: 1.48,  // ref:TrackMan (typical driver)
    spinK: 0.93,  // engine-derived — IKKE TODO-ens 0.6
  },
};
const DEFAULT_CLUB = '7iron';

// ESTIMATE: smash factor (ball speed / club speed) for a well-struck 7-iron ≈ 1.33.
// Kept as a back-compat alias of the 7-iron preset. Drivers run ~1.48; wedges lower.
const SMASH_7I = CLUBS['7iron'].smash; // ESTIMATE (7-iron typical)

// ESTIMATE: side-curve scaling applied to carry*sin(spinAxis) to get offline yards.
// Real curve depends on total spin and flight time; this is a tuned fudge factor.
// We use sin() (bounded by 1) rather than tan() (which explodes toward 90°), so the
// sideways deviation can never run away. With sin the curve term maxes at
// carry*CURVE_FACTOR, and a hard cap below keeps |offline| < carry always.
const CURVE_FACTOR = 0.50; // ESTIMATE (calibrated for sin-based curve)
const OFFLINE_CAP_FRAC = 0.55; // ESTIMATE (|offline| can never exceed 55% of carry)

// ESTIMATE — drag-saturated CARRY/APEX model for a 7-iron. Rather than scaling a
// tour reference linearly with ball speed (which runs away at high speed), carry
// and apex follow a concave saturating curve carry = MAX·(1 − e^(−ballSpeed/TAU))
// so they PLATEAU. A 7-iron can never exceed ~190 yd carry at any human speed.
// TAU tuned so ball 120 mph → ~172 yd carry; TAU2 so ball 120 → ~31 yd apex.
const CARRY_MAX = 195;     // legacy export only — carry now uses the power-curve fit (remodel fix F)
const CARRY_TAU = 56;      // legacy export only — see fix F
const APEX_MAX = 44;       // ESTIMATE (yd ceiling for apex height; raised 38→44 so 130 mph apexes ~35 m, remodel fix H)
const APEX_TAU = 85;       // ESTIMATE (ball-speed scale for apex, mph; 75→85, remodel fix H)

/**
 * Full ball-flight solve from the 5 club inputs.
 * Returns an object of derived launch + flight numbers (all ESTIMATE-flagged
 * fields noted inline). Angles in degrees, distances in yards, speeds in mph.
 */
export function solveFlight(input) {
  const clubPath = +input.clubPath || 0;
  const faceAngle = +input.faceAngle || 0;
  const attackAngle = +input.attackAngle || 0;
  const dynamicLoft = +input.dynamicLoft || 0;
  const clubSpeed = +input.clubSpeed || 0;

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
  const spinLoft = dynamicLoft - attackAngle;

  // SOURCED: launch angle blend (dynamic-loft-dominant, small attack term).
  // The ball launches lower than dynamic loft; attack only nudges it.
  const launchAngle = LAUNCH_LOFT_W * dynamicLoft + LAUNCH_ATTACK_W * attackAngle;

  // ESTIMATE: spin axis ≈ gain * (face - path), clamped to ±AXIS_MAX so the steep
  // ±40° face-to-path corner can't drive a non-physical tilt. + = tilt right
  // (slice/fade for RH).
  const faceToPath = faceAngle - clubPath;
  // engine-derived · ref:D-plane: axis ≈ atan(sidespin/backspin) ⇒ tilt per degree
  // of face-to-path scales ~1/spinLoft. Anchored at spinLoft 33 so the tuned
  // 7-iron reference axis is preserved exactly; low-loft clubs (driver) tilt more.
  const AXIS_REF_SPINLOFT = 33; // engine-derived (anchor)
  const axisGain = SPIN_AXIS_GAIN * (AXIS_REF_SPINLOFT / Math.max(8, spinLoft)); // engine-derived · ref:D-plane
  const spinAxis = clamp(axisGain * faceToPath, -AXIS_MAX, AXIS_MAX);

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

  // ESTIMATE: curve = the spin-axis-derived sideways BEND only (remodel fix G).
  // Quadratic in carry — the industry approximation (lateral deflection grows
  // with flight time², so long shots bend disproportionately more): a 216 yd
  // bomb at the same axis tilt curves ~2× a 175 yd shot. Capped at ±60% of
  // carry so extreme tilts stay on screen. + = bends right (for RH golfer).
  const curve = clamp(
    (carry * carry * spinAxis) / 12000,
    -0.6 * carry, 0.6 * carry
  ); // ESTIMATE (bend only, remodel fix G)

  // ESTIMATE: offline = total lateral displacement from the TARGET line =
  // start-line displacement (carry·sin(startDirection)) + the bend above.
  // A pure push/pull now shows a non-zero offline even with zero curve.
  // + = ball finishes right of the target line (for RH golfer).
  // (offline includes start direction, audit fix A)
  const offline = carry * Math.sin(deg2rad(startDirection)) + curve; // ESTIMATE

  // ── Added SkyTrak-style output fields (all ESTIMATE) ───────────────────────
  // ESTIMATE: total = carry + roll. Roll is small and tied to descent: a steeper
  // landing angle rolls out less. Computed AFTER landingAngle. The roll fraction
  // is clamped to a small window (1.2%–5.5% of carry). Flagged ESTIMATE.
  const rollFrac = clamp(0.04 - (landingAngle - 45) * 0.0015, 0.012, 0.055);
  const total = carry + carry * rollFrac; // ESTIMATE (carry + small descent-tied roll)

  // ESTIMATE: backspin in rpm. Real backspin depends on spin loft, ball speed,
  // friction and the ball. We approximate it as a base spin scaled by spin loft
  // and ball speed: rpm ≈ spinLoft(°) · ballSpeed(mph) · k. The effective constant
  // (≈1.8) puts a default 7-iron (spinLoft≈33°, ballSpeed≈120mph) near ~7100 rpm.
  // Clamped to a sane window. Flagged ESTIMATE.
  const SPIN_RPM_K = preset.spinK; // ESTIMATE (effective rpm per °·mph)
  const backspin = clamp(Math.abs(spinLoft) * ballSpeed * SPIN_RPM_K, 1500, 9000); // ESTIMATE

  // ESTIMATE: smash factor = ball speed / club speed. With the spin-loft-
  // responsive smash above (audit fix D) this now equals smashEff, so the
  // panel ratio tracks the delivered spin loft. Flagged ESTIMATE.
  const smash = clubSpeed > 0 ? ballSpeed / clubSpeed : 0; // ESTIMATE (== smashEff)

  return {
    // echoed inputs
    clubPath, faceAngle, attackAngle, dynamicLoft, clubSpeed,
    // derived
    startDirection,   // SOURCED blend
    spinLoft,         // SOURCED
    launchAngle,      // SOURCED blend
    spinAxis,         // ESTIMATE
    ballSpeed,        // ESTIMATE (fixed smash)
    carry,            // ESTIMATE (scaled tour ref)
    apex,             // ESTIMATE (scaled tour ref)
    landingAngle,     // ESTIMATE
    offline,          // ESTIMATE
    // added panel fields
    total,            // ESTIMATE (carry + ~10% roll)
    curve,            // ESTIMATE (spin-axis-derived bend only, audit fix A)
    backspin,         // ESTIMATE (spinLoft·ballSpeed model, rpm)
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
    smashConst: preset.smash,     // ESTIMATE fixed smash (1.33 for the 7-iron)
    spinK: SPIN_RPM_K,            // ESTIMATE backspin rpm per °·mph
    spinRpmRaw: Math.abs(spinLoft) * ballSpeed * SPIN_RPM_K, // pre-clamp backspin
    spinAxisGain: SPIN_AXIS_GAIN, // ESTIMATE ×1.5 spin-axis gain (clamped to ±AXIS_MAX)
    axisMax: AXIS_MAX,            // ESTIMATE ±38° spin-axis clamp
    curveFactor: CURVE_FACTOR,    // ESTIMATE 0.50 sin-based side-curve scale
    offlineCapFrac: OFFLINE_CAP_FRAC, // ESTIMATE |offline| ≤ 55% of carry
    carryMax: CARRY_MAX,          // ESTIMATE yd ceiling
    carryTau: CARRY_TAU,          // ESTIMATE ball-speed scale
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
    shape: shapeLabel(startDirection, spinAxis),
  };
}

/**
 * Qualitative ball-shape label (RH golfer) from start direction + spin axis.
 * ESTIMATE thresholds, illustrative only.
 */
export function shapeLabel(startDirection, spinAxis) {
  // Key the Straight / Draw-Fade / Hook-Slice thresholds off the underlying
  // face-to-path gap (in degrees) rather than the spin-axis tilt, so the labels
  // are GAIN-INDEPENDENT and stay sensible if SPIN_AXIS_GAIN ever changes. We
  // recover the face-to-path gap from the (possibly clamped) spin axis by dividing
  // out the gain. A near-zero gap is Straight; a small gap is a mild Fade/Draw;
  // a large gap (> 6° face-to-path, e.g. a clear miss) is a Slice/Hook.
  const faceToPath = spinAxis / SPIN_AXIS_GAIN; // gain-independent gap, deg
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
