/**
 * Flightglass centered-strike 3-D D-plane and aerodynamic flight model.
 *
 * Axes form a right-handed world frame:
 *   x = golfer's right, y = target direction, z = up.
 *
 * Core impact geometry assumes contact at the geometric centre of the face.
 * It contains no strike-offset, bulge, CG-torque, or gear-effect term. The
 * optional gear helper at the end of this file is deliberately separate.
 *
 * This is a dependency-free ESM module with named exports for iOS WKWebView.
 */

export const MPH_TO_MPS = 0.44704;
export const YARD_TO_M = 0.9144;
export const RPM_TO_RAD_S = 2 * Math.PI / 60;
export const RAD_S_TO_RPM = 1 / RPM_TO_RAD_S;

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

export const DEFAULT_BALL = Object.freeze({
  massKg: 0.04593,
  radiusM: 0.04267 / 2,
  // I = k*m*r^2. This is the uniform-solid-sphere approximation used only
  // by the optional impact/gear helpers, not by the D-plane geometry.
  inertiaFactor: 0.4,
});

export const DEFAULT_ENVIRONMENT = Object.freeze({
  airDensityKgM3: 1.225,
  kinematicViscosityM2S: 1.46e-5,
  gravityMps2: 9.80665,
  windMps: Object.freeze([0, 0, 0]),
});

/** Published generic driver-ball correlation from Smits & Smith (1994). */
export const SMITS_SMITH_DRIVER_AERO = Object.freeze({
  id: 'smits-smith-1994-driver',
  reynoldsValidity: Object.freeze([70000, 210000]),
  spinParameterValidity: Object.freeze([0.08, 0.20]),
  exactNamedBall: false,
  source: 'Smits & Smith (1994), A new aerodynamic model of a golf ball in flight',
});

/**
 * Historical Pro-V1-class bridge, not current Pro V1/Pro V1x coefficients.
 *
 * Acushnet US6916255B2 publishes two named early-2000s Pro V1 Cd/Cl anchors.
 * The lift scale is their least-squares S^0.4 fit. The drag base and crisis
 * amplitude solve those two anchors exactly while retaining a declared
 * logistic crisis shape and saturating spin term. Those retained shapes are
 * Flightglass approximations. Modern Titleist coefficients are proprietary.
 */
export const PREMIUM_TOUR_CLASS_AERO = Object.freeze({
  id: 'tour-class-v1-era-bridge-v1',
  reynoldsValidity: Object.freeze([70000, 210000]),
  spinParameterValidity: Object.freeze([0.08, 0.20]),
  liftScale: 0.4072,
  spinDecayPerSecond: 0.04,
  exactNamedBall: false,
  reverseMagnusPolicy:
    'not modeled; positive-lift bridge is extrapolated below Reynolds 70000',
  disclosure:
    'Historical Pro-V1-class isotropic bridge; not exact current named-ball physics because proprietary modern coefficients are unavailable.',
  sources: Object.freeze([
    'Acushnet US6916255B2 (published early-2000s Pro V1 coefficient anchors)',
    'Smits & Smith (1994) (spin-parameter form and driver validity envelope)',
    'Lyu et al. (2018) (trajectory assumption of four percent spin loss per second)',
  ]),
});

/**
 * Compatibility constraint used only by impact-flight.js's lateral solve.
 * Multiplying bridge Cd by this fixed value makes one legacy neutral 7-iron
 * RK4 carry equal the retained Flightglass carry at dt=0.01 s. It is not a
 * golf-ball coefficient and is exposed so it cannot masquerade as one.
 */
export const FLIGHTGLASS_CURVE_CARRY_ANCHOR = Object.freeze({
  id: 'legacy-7iron-curve-flight-anchor-v1',
  referenceClub: '7iron',
  clubSpeedMph: 90,
  ballSpeedMph: 119.51999999999998,
  launchElevationDeg: 17.85,
  backSpinRpm: 7099.487999999999,
  legacyCarryYd: 172.40005029370806,
  integrationStepSeconds: 0.01,
  dragScale: 1.275116456035,
  disclosure:
    'Legacy-carry compatibility constraint for the curve flight only; not a ball property or named-ball calibration.',
});

const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const subtract = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scale = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const magnitude = a => Math.hypot(a[0], a[1], a[2]);
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function unit(a, fallback = [0, 0, 0]) {
  const length = magnitude(a);
  return length > 1e-12 ? scale(a, 1 / length) : [...fallback];
}

function requireFinite(name, value) {
  if (!Number.isFinite(value)) {
    throw new TypeError(`${name} must be a finite number`);
  }
}

function requireFiniteVector(name, value) {
  if (!Array.isArray(value) || value.length !== 3 || value.some(v => !Number.isFinite(v))) {
    throw new TypeError(`${name} must be a finite 3-vector`);
  }
}

function validateBall(ball) {
  if (!ball || typeof ball !== 'object') throw new TypeError('ball must be an object');
  for (const key of ['massKg', 'radiusM', 'inertiaFactor']) {
    requireFinite(`ball.${key}`, ball[key]);
    if (ball[key] <= 0) throw new RangeError(`ball.${key} must be positive`);
  }
}

function launchBasis(launchElevationDeg, launchAzimuthDeg) {
  requireFinite('launchElevationDeg', launchElevationDeg);
  requireFinite('launchAzimuthDeg', launchAzimuthDeg);
  const elevation = launchElevationDeg * DEG_TO_RAD;
  const azimuth = launchAzimuthDeg * DEG_TO_RAD;
  const launchDirectionUnit = [
    Math.cos(elevation) * Math.sin(azimuth),
    Math.cos(elevation) * Math.cos(azimuth),
    Math.sin(elevation),
  ];
  const backspinAxisUnit = unit(
    cross(launchDirectionUnit, [0, 0, 1]),
    [1, 0, 0]
  );
  const rightCurveSpinAxisUnit = unit(
    cross(launchDirectionUnit, backspinAxisUnit),
    [0, 0, -1]
  );
  return { launchDirectionUnit, backspinAxisUnit, rightCurveSpinAxisUnit };
}

/**
 * Exact centered-strike delivery geometry.
 *
 * club velocity = (cos A sin P, cos A cos P, sin A)
 * face normal   = (cos L sin F, cos L cos F, sin L)
 * true spin loft is atan2(|v x n|, v . n).
 */
export function centeredImpactGeometry({
  clubSpeed,
  attackAngle,
  clubPath,
  dynamicLoft,
  faceAngle,
  launchFaceWeight = 0.85,
}) {
  for (const [name, value] of Object.entries({
    clubSpeed, attackAngle, clubPath, dynamicLoft, faceAngle, launchFaceWeight,
  })) requireFinite(name, value);
  if (clubSpeed < 0) throw new RangeError('clubSpeed cannot be negative');
  if (launchFaceWeight < 0 || launchFaceWeight > 1) {
    throw new RangeError('launchFaceWeight must be between zero and one');
  }

  const attack = attackAngle * DEG_TO_RAD;
  const path = clubPath * DEG_TO_RAD;
  const loft = dynamicLoft * DEG_TO_RAD;
  const face = faceAngle * DEG_TO_RAD;
  const delta = face - path;
  const ca = Math.cos(attack), sa = Math.sin(attack);
  const cp = Math.cos(path), sp = Math.sin(path);
  const cl = Math.cos(loft), sl = Math.sin(loft);
  const cf = Math.cos(face), sf = Math.sin(face);

  const clubVelocityUnit = [ca * sp, ca * cp, sa];
  const faceNormalUnit = [cl * sf, cl * cf, sl];
  const clubVelocityMps = scale(clubVelocityUnit, clubSpeed * MPH_TO_MPS);
  const spinAxisRaw = cross(clubVelocityUnit, faceNormalUnit);
  const sinSpinLoft = magnitude(spinAxisRaw);
  const cosSpinLoft = clamp(dot(clubVelocityUnit, faceNormalUnit), -1, 1);
  const signedVerticalSpinLoftDeg = dynamicLoft - attackAngle;
  const neutralHorizontal = faceAngle === clubPath;
  const spinLoft3DDeg = neutralHorizontal && signedVerticalSpinLoftDeg >= 0 &&
      signedVerticalSpinLoftDeg <= 180
    ? signedVerticalSpinLoftDeg
    : Math.atan2(sinSpinLoft, cosSpinLoft) * RAD_TO_DEG;
  const spinAxisDefined = sinSpinLoft > 1e-12;
  const spinAxisUnit = unit(spinAxisRaw, [1, 0, 0]).map(value =>
    Object.is(value, -0) ? 0 : value
  );

  // Exact tangential mismatch scalars in the club-path-attached D-plane. For
  // small angles: vertical ~= dynamic loft - attack; horizontal ~= face - path.
  // They explain the familiar inverse-loft trend, but the reported spin-axis
  // tilt from WORLD horizontal must use every component of v x n below.
  const verticalTangential =
    ca * sl - sa * cl * Math.cos(delta);
  const horizontalTangential = cl * Math.sin(delta);
  const verticalSpinSense = Math.sign(verticalTangential);
  const dPlaneTiltRightDeg = !spinAxisDefined || Math.abs(spinAxisUnit[2]) < 1e-15
    ? 0
    : -Math.atan2(
      spinAxisUnit[2],
      Math.hypot(spinAxisUnit[0], spinAxisUnit[1])
    ) * RAD_TO_DEG;

  // This face/velocity vector blend is only a basis for standalone spin
  // projections. impact-flight.js supplies its retained launch fit explicitly.
  const launchDirectionUnit = unit(add(
    scale(faceNormalUnit, launchFaceWeight),
    scale(clubVelocityUnit, 1 - launchFaceWeight)
  ));
  const launchElevationDeg = Math.asin(clamp(launchDirectionUnit[2], -1, 1)) * RAD_TO_DEG;
  const launchAzimuthDeg = Math.atan2(launchDirectionUnit[0], launchDirectionUnit[1]) * RAD_TO_DEG;
  const basis = launchBasis(launchElevationDeg, launchAzimuthDeg);

  return {
    axes: 'x=right, y=target, z=up (right-handed)',
    centeredStrike: true,
    gearEffectApplied: false,
    clubVelocityUnit,
    clubVelocityMps,
    faceNormalUnit,
    spinLoft3DDeg,
    signedVerticalSpinLoftDeg,
    sinSpinLoft,
    cosSpinLoft,
    spinAxisUnit,
    spinAxisDefined,
    dPlaneTiltRightDeg,
    verticalSpinSense,
    axisElevationDeg: Math.atan2(
      spinAxisUnit[2],
      Math.hypot(spinAxisUnit[0], spinAxisUnit[1])
    ) * RAD_TO_DEG,
    horizontalTangential,
    verticalTangential,
    launchDirectionUnit: basis.launchDirectionUnit,
    launchElevationDeg,
    launchAzimuthDeg,
    backspinAxisUnit: basis.backspinAxisUnit,
    rightCurveSpinAxisUnit: basis.rightCurveSpinAxisUnit,
  };
}

/**
 * Compatibility spin vector for the retained Flightglass backspin output.
 * The vector is parallel to the exact centered D-plane axis and is scaled so
 * its projection on the flight-relative backspin axis equals backSpinRpm.
 * This normalization is an explicit empirical compatibility choice.
 */
export function spinVectorFromBackspin(geometry, backSpinRpm, {
  launchElevationDeg = geometry?.launchElevationDeg,
  launchAzimuthDeg = geometry?.launchAzimuthDeg,
} = {}) {
  if (!geometry || geometry.centeredStrike !== true || !Array.isArray(geometry.spinAxisUnit)) {
    throw new TypeError('geometry must come from centeredImpactGeometry');
  }
  requireFinite('backSpinRpm', backSpinRpm);
  const basis = launchBasis(launchElevationDeg, launchAzimuthDeg);
  const backspinProjection = dot(geometry.spinAxisUnit, basis.backspinAxisUnit);
  // A backspin projection is the wrong causal input for an almost vertical
  // axis: dividing by it would manufacture unbounded total spin. Production
  // uses spinVectorFromTotalSpin(); this compatibility helper fails explicitly.
  if (Math.abs(backspinProjection) < 0.05) {
    if (Math.abs(backSpinRpm) < 1e-10) {
      return {
        ...geometry,
        ...basis,
        centeredStrike: true,
        gearEffectApplied: false,
        backSpinRpm: 0,
        rightCurveSpinRpm: 0,
        totalSpinRpm: 0,
        spinVectorRadPerSec: [0, 0, 0],
      };
    }
    throw new RangeError(
      'Backspin projection is ill-conditioned on this D-plane axis; supply bounded total spin instead'
    );
  }
  const signedTotalSpinRpm = backSpinRpm / backspinProjection;
  const spinVectorRadPerSec = scale(
    geometry.spinAxisUnit,
    signedTotalSpinRpm * RPM_TO_RAD_S
  );
  const rightCurveSpinRpm =
    dot(spinVectorRadPerSec, basis.rightCurveSpinAxisUnit) * RAD_S_TO_RPM;

  return {
    ...geometry,
    ...basis,
    centeredStrike: true,
    gearEffectApplied: false,
    backSpinRpm,
    rightCurveSpinRpm,
    totalSpinRpm: magnitude(spinVectorRadPerSec) * RAD_S_TO_RPM,
    spinVectorRadPerSec,
    assumptions: Object.freeze({
      strike: 'declared geometric face centre; no strike-location or gear term',
      spinMagnitude:
        'retained empirical backspin output projected onto the exact centered D-plane spin axis',
    }),
  };
}

/**
 * Build the physical spin vector from a bounded TOTAL spin magnitude.
 * Geometry carries the backspin/topspin sense, so totalSpinRpm is nonnegative.
 * Backspin and right-curve spin are derived projections, never independent
 * causal inputs. At exactly zero spin loft the axis is undefined and the only
 * honest result is a zero vector, irrespective of an empirical minimum clamp.
 */
export function spinVectorFromTotalSpin(geometry, totalSpinRpm, {
  launchElevationDeg = geometry?.launchElevationDeg,
  launchAzimuthDeg = geometry?.launchAzimuthDeg,
} = {}) {
  if (!geometry || geometry.centeredStrike !== true || !Array.isArray(geometry.spinAxisUnit)) {
    throw new TypeError('geometry must come from centeredImpactGeometry');
  }
  requireFinite('totalSpinRpm', totalSpinRpm);
  if (totalSpinRpm < 0) throw new RangeError('totalSpinRpm cannot be negative');
  const basis = launchBasis(launchElevationDeg, launchAzimuthDeg);
  const effectiveTotalSpinRpm = geometry.spinAxisDefined ? totalSpinRpm : 0;
  const spinVectorRadPerSec = scale(
    geometry.spinAxisUnit,
    effectiveTotalSpinRpm * RPM_TO_RAD_S
  );
  const backspinProjection = dot(geometry.spinAxisUnit, basis.backspinAxisUnit);
  const rightCurveProjection = dot(
    geometry.spinAxisUnit,
    basis.rightCurveSpinAxisUnit
  );
  const backSpinRpm = Math.abs(Math.abs(backspinProjection) - 1) < 1e-14
    ? Math.sign(backspinProjection) * effectiveTotalSpinRpm
    : backspinProjection * effectiveTotalSpinRpm;
  return {
    ...geometry,
    ...basis,
    centeredStrike: true,
    gearEffectApplied: false,
    backSpinRpm,
    rightCurveSpinRpm: rightCurveProjection * effectiveTotalSpinRpm,
    totalSpinRpm: effectiveTotalSpinRpm,
    spinVectorRadPerSec,
    assumptions: Object.freeze({
      strike: 'declared geometric face centre; no strike-location or gear term',
      spinMagnitude:
        'bounded empirical total spin placed on the exact centered D-plane axis',
    }),
  };
}

/**
 * Idealized Penner-type centered impact spin magnitude. This is useful for
 * model study, but impact-flight.js retains its existing empirical spin fit.
 */
export function centeredImpactSpin(delivery, {
  ball = DEFAULT_BALL,
  clubHeadMassKg = 0.200,
  spinCalibration = 1,
  launchFaceWeight = 0.85,
} = {}) {
  validateBall(ball);
  requireFinite('clubHeadMassKg', clubHeadMassKg);
  requireFinite('spinCalibration', spinCalibration);
  if (clubHeadMassKg <= 0) throw new RangeError('clubHeadMassKg must be positive');
  if (spinCalibration < 0) throw new RangeError('spinCalibration cannot be negative');
  const geometry = centeredImpactGeometry({ ...delivery, launchFaceWeight });
  const tangentialClubSpeedMps =
    delivery.clubSpeed * MPH_TO_MPS * geometry.sinSpinLoft;
  const denominator = ball.radiusM * (
    1 + ball.inertiaFactor * (1 + ball.massKg / clubHeadMassKg)
  );
  const spinRadPerSec = spinCalibration * tangentialClubSpeedMps / denominator;
  const spinVectorRadPerSec = scale(geometry.spinAxisUnit, spinRadPerSec);
  const totalSpinRpm = spinRadPerSec * RAD_S_TO_RPM;
  return {
    ...geometry,
    centeredStrike: true,
    gearEffectApplied: false,
    spinCalibration,
    totalSpinRpm,
    backSpinRpm: totalSpinRpm * dot(geometry.spinAxisUnit, geometry.backspinAxisUnit),
    rightCurveSpinRpm:
      totalSpinRpm * dot(geometry.spinAxisUnit, geometry.rightCurveSpinAxisUnit),
    spinVectorRadPerSec,
    assumptions: Object.freeze({
      strike: 'declared geometric face centre; no strike-location or gear term',
      spinMagnitude:
        'rigid rolling-at-separation approximation times an exposed spinCalibration',
    }),
  };
}

/** OPTIONAL, separate horizontal driver gear-effect add-on. */
export function addHorizontalGearEffect(centeredResult, {
  strikeOffsetFromCgMm = 0,
  cgDepthMm = 35,
  clubHeadMassKg = 0.200,
  clubHeadYawMoiKgM2 = 0.00050,
  normalCor = 0.82,
  gearEfficiency = 1,
  ball = DEFAULT_BALL,
} = {}) {
  validateBall(ball);
  for (const [name, value] of Object.entries({
    strikeOffsetFromCgMm, cgDepthMm, clubHeadMassKg,
    clubHeadYawMoiKgM2, normalCor, gearEfficiency,
  })) requireFinite(name, value);
  if (!centeredResult || centeredResult.centeredStrike !== true) {
    throw new TypeError('centeredResult must come from a centered spin solve');
  }
  if (cgDepthMm < 0 || clubHeadMassKg <= 0 || clubHeadYawMoiKgM2 <= 0 ||
      normalCor < 0 || normalCor > 1 || gearEfficiency < 0) {
    throw new RangeError('gear parameters are outside their physical range');
  }

  const offsetM = strikeOffsetFromCgMm / 1000;
  const cgDepthM = cgDepthMm / 1000;
  const normalClubSpeedMps = Math.max(
    0,
    dot(centeredResult.clubVelocityMps, centeredResult.faceNormalUnit)
  );
  const inertiaTerm = clubHeadYawMoiKgM2 * (
    1 / ball.massKg + 1 / clubHeadMassKg
  );
  const gearOmegaRadPerSec = offsetM === 0 ? 0 : gearEfficiency * (
    -(1 + normalCor) * cgDepthM * offsetM * normalClubSpeedMps /
    ((1 + ball.inertiaFactor) * ball.radiusM * (offsetM ** 2 + inertiaTerm))
  );
  const toeDirectionUnit = unit([
    centeredResult.faceNormalUnit[1],
    -centeredResult.faceNormalUnit[0],
    0,
  ], [1, 0, 0]);
  const gearRightCurveAxisUnit = unit(
    cross(centeredResult.faceNormalUnit, toeDirectionUnit),
    centeredResult.rightCurveSpinAxisUnit
  );
  const gearSpinVectorRadPerSec = scale(gearRightCurveAxisUnit, gearOmegaRadPerSec);
  const combinedSpinVectorRadPerSec = add(
    centeredResult.spinVectorRadPerSec,
    gearSpinVectorRadPerSec
  );
  const combinedMagnitude = magnitude(combinedSpinVectorRadPerSec);
  return {
    ...centeredResult,
    centeredStrike: offsetM === 0,
    gearEffectApplied: offsetM !== 0,
    strikeOffsetFromCgMm,
    gearEffectRightCurveRpm: gearOmegaRadPerSec * RAD_S_TO_RPM,
    toeDirectionUnit,
    gearRightCurveAxisUnit,
    gearSpinVectorRadPerSec,
    combinedSpinVectorRadPerSec,
    combinedSpinAxisUnit: unit(combinedSpinVectorRadPerSec, centeredResult.spinAxisUnit),
    combinedTotalSpinRpm: combinedMagnitude * RAD_S_TO_RPM,
    combinedBackSpinRpm:
      dot(combinedSpinVectorRadPerSec, centeredResult.backspinAxisUnit) * RAD_S_TO_RPM,
    combinedRightCurveSpinRpm:
      dot(combinedSpinVectorRadPerSec, centeredResult.rightCurveSpinAxisUnit) * RAD_S_TO_RPM,
    assumptions: Object.freeze({
      ...centeredResult.assumptions,
      strike: offsetM === 0
        ? 'declared gear-reference centre; gear contribution exactly zero'
        : 'declared horizontal off-centre strike; optional gear add-on applied',
      gearEffect:
        'idealized rigid sticking-model horizontal gear term, times exposed gearEfficiency',
    }),
  };
}

/** Exact published Smits & Smith (1994) driver correlation. */
export function smitsSmithDragCoefficient(reynolds, spinParameter) {
  requireFinite('reynolds', reynolds);
  requireFinite('spinParameter', spinParameter);
  const s = Math.max(0, spinParameter);
  return 0.24 + 0.18 * s +
    0.06 * Math.sin(Math.PI * (reynolds - 90000) / 200000);
}

/** Exact published Smits & Smith (1994) driver correlation. */
export function smitsSmithLiftCoefficient(spinParameter, reynolds = 100000) {
  requireFinite('spinParameter', spinParameter);
  requireFinite('reynolds', reynolds);
  return 0.54 * Math.pow(Math.max(0, spinParameter), 0.4);
}

/** Historical Pro-V1-class lift bridge fitted to two published anchors. */
export function premiumTourLiftCoefficient(spinParameter, reynolds = 100000) {
  requireFinite('spinParameter', spinParameter);
  requireFinite('reynolds', reynolds);
  return PREMIUM_TOUR_CLASS_AERO.liftScale *
    Math.pow(Math.max(0, spinParameter), 0.4);
}

/** Historical Pro-V1-class drag bridge fitted to two published anchors. */
export function premiumTourDragCoefficient(reynolds, spinParameter) {
  requireFinite('reynolds', reynolds);
  requireFinite('spinParameter', spinParameter);
  const s = Math.max(0, spinParameter);
  return 0.2016141765 +
    0.0463816544 / (1 + Math.exp((reynolds - 85000) / 9000)) +
    0.06 * s / (0.15 + s);
}

function outside(value, range) {
  return value < range[0] || value > range[1];
}

function normalizeAerodynamicModel(metadata, usesDefaultCoefficients) {
  if (metadata === undefined) {
    if (usesDefaultCoefficients) {
      return {
        id: PREMIUM_TOUR_CLASS_AERO.id,
        reynoldsValidity: PREMIUM_TOUR_CLASS_AERO.reynoldsValidity,
        spinParameterValidity: PREMIUM_TOUR_CLASS_AERO.spinParameterValidity,
        reverseMagnusPolicy: PREMIUM_TOUR_CLASS_AERO.reverseMagnusPolicy,
      };
    }
    return {
      id: 'custom-unlabeled',
      reynoldsValidity: null,
      spinParameterValidity: null,
      reverseMagnusPolicy: 'caller did not declare a reverse-Magnus policy',
    };
  }
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    throw new TypeError('aerodynamicModel must be an object');
  }
  if (typeof metadata.id !== 'string' || metadata.id.trim() === '') {
    throw new TypeError('aerodynamicModel.id must be a non-empty string');
  }
  const validateRange = (name, range) => {
    if (range === undefined || range === null) return null;
    if (!Array.isArray(range) || range.length !== 2 ||
        range.some(value => !Number.isFinite(value)) || range[0] > range[1]) {
      throw new TypeError(`aerodynamicModel.${name} must be an ascending finite pair`);
    }
    return Object.freeze([...range]);
  };
  return {
    id: metadata.id,
    reynoldsValidity: validateRange('reynoldsValidity', metadata.reynoldsValidity),
    spinParameterValidity:
      validateRange('spinParameterValidity', metadata.spinParameterValidity),
    reverseMagnusPolicy: typeof metadata.reverseMagnusPolicy === 'string'
      ? metadata.reverseMagnusPolicy
      : 'caller did not declare a reverse-Magnus policy',
  };
}

function aerodynamicDerivativeInto(state, fixedSpinAxis, settings, out) {
  const vx = state[3], vy = state[4], vz = state[5];
  const airVx = vx - settings.windMps[0];
  const airVy = vy - settings.windMps[1];
  const airVz = vz - settings.windMps[2];
  const speed = Math.hypot(airVx, airVy, airVz);
  out[0] = vx;
  out[1] = vy;
  out[2] = vz;
  if (speed < 1e-9) {
    out[3] = 0;
    out[4] = 0;
    out[5] = -settings.gravityMps2;
    out[6] = 0;
    return;
  }
  const invSpeed = 1 / speed;
  const dirX = airVx * invSpeed;
  const dirY = airVy * invSpeed;
  const dirZ = airVz * invSpeed;
  const omegaX = fixedSpinAxis[0] * state[6];
  const omegaY = fixedSpinAxis[1] * state[6];
  const omegaZ = fixedSpinAxis[2] * state[6];
  const omegaAlongAir = omegaX * dirX + omegaY * dirY + omegaZ * dirZ;
  const perpendicularOmega = Math.hypot(
    omegaX - dirX * omegaAlongAir,
    omegaY - dirY * omegaAlongAir,
    omegaZ - dirZ * omegaAlongAir
  );
  const spinParameter = settings.ball.radiusM * perpendicularOmega / speed;
  const reynolds = speed * 2 * settings.ball.radiusM /
    settings.kinematicViscosityM2S;
  const diagnostics = settings.aerodynamicDiagnostics;
  diagnostics.minReynolds = Math.min(diagnostics.minReynolds, reynolds);
  diagnostics.maxReynolds = Math.max(diagnostics.maxReynolds, reynolds);
  diagnostics.minSpinParameter = Math.min(diagnostics.minSpinParameter, spinParameter);
  diagnostics.maxSpinParameter = Math.max(diagnostics.maxSpinParameter, spinParameter);
  const model = settings.aerodynamicModel;
  if ((model.reynoldsValidity && outside(reynolds, model.reynoldsValidity)) ||
      (model.spinParameterValidity && outside(spinParameter, model.spinParameterValidity))) {
    diagnostics.extrapolated = true;
  }

  const cd = settings.dragCoefficient(reynolds, spinParameter);
  const cl = settings.liftCoefficient(spinParameter, reynolds);
  if (!Number.isFinite(cd) || cd < 0) {
    throw new RangeError('dragCoefficient(Re, S) must return a finite nonnegative value');
  }
  if (!Number.isFinite(cl)) {
    throw new RangeError('liftCoefficient(S, Re) must return a finite value');
  }
  const dynamicPressureArea = 0.5 * settings.airDensityKgM3 *
    Math.PI * settings.ball.radiusM ** 2 * speed ** 2;
  const dragMagnitude = -dynamicPressureArea * cd;
  let forceX = dirX * dragMagnitude;
  let forceY = dirY * dragMagnitude;
  let forceZ = dirZ * dragMagnitude;
  const liftCrossX = omegaY * airVz - omegaZ * airVy;
  const liftCrossY = omegaZ * airVx - omegaX * airVz;
  const liftCrossZ = omegaX * airVy - omegaY * airVx;
  const liftCrossMagnitude = Math.hypot(liftCrossX, liftCrossY, liftCrossZ);
  if (liftCrossMagnitude > 1e-12) {
    const liftScale = dynamicPressureArea * cl / liftCrossMagnitude;
    forceX += liftCrossX * liftScale;
    forceY += liftCrossY * liftScale;
    forceZ += liftCrossZ * liftScale;
  }
  const inverseMass = 1 / settings.ball.massKg;
  out[3] = forceX * inverseMass;
  out[4] = forceY * inverseMass;
  out[5] = forceZ * inverseMass - settings.gravityMps2;
  out[6] = -settings.spinDecayPerSecond * state[6];
}

function rk4StepInto(state, dt, fixedSpinAxis, settings, next, buffers) {
  const { k1, k2, k3, k4, temp } = buffers;
  aerodynamicDerivativeInto(state, fixedSpinAxis, settings, k1);
  for (let i = 0; i < 7; i++) temp[i] = state[i] + dt * k1[i] / 2;
  aerodynamicDerivativeInto(temp, fixedSpinAxis, settings, k2);
  for (let i = 0; i < 7; i++) temp[i] = state[i] + dt * k2[i] / 2;
  aerodynamicDerivativeInto(temp, fixedSpinAxis, settings, k3);
  for (let i = 0; i < 7; i++) temp[i] = state[i] + dt * k3[i];
  aerodynamicDerivativeInto(temp, fixedSpinAxis, settings, k4);
  for (let i = 0; i < 7; i++) {
    next[i] = state[i] +
      dt * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]) / 6;
  }
}

/**
 * Deterministic fixed-step RK4 flight to first ground crossing.
 * Inputs are mph/degrees/rad-s; all returned distances are metres.
 */
export function simulateFlight({
  ballSpeedMph,
  launchElevationDeg,
  launchAzimuthDeg,
  spinVectorRadPerSec,
  dt = 0.005,
  maxTimeSeconds = 15,
  ball = DEFAULT_BALL,
  environment = {},
  spinDecayPerSecond = PREMIUM_TOUR_CLASS_AERO.spinDecayPerSecond,
  liftCoefficient = premiumTourLiftCoefficient,
  dragCoefficient = premiumTourDragCoefficient,
  aerodynamicModel,
}) {
  validateBall(ball);
  for (const [name, value] of Object.entries({
    ballSpeedMph, launchElevationDeg, launchAzimuthDeg,
    dt, maxTimeSeconds, spinDecayPerSecond,
  })) requireFinite(name, value);
  requireFiniteVector('spinVectorRadPerSec', spinVectorRadPerSec);
  if (ballSpeedMph < 0 || dt <= 0 || maxTimeSeconds <= 0) {
    throw new RangeError('speed/time inputs are outside their valid range');
  }
  if (spinDecayPerSecond < 0) throw new RangeError('spinDecayPerSecond cannot be negative');
  if (typeof liftCoefficient !== 'function' || typeof dragCoefficient !== 'function') {
    throw new TypeError('aerodynamic coefficients must be functions');
  }
  const normalizedAerodynamicModel = normalizeAerodynamicModel(
    aerodynamicModel,
    liftCoefficient === premiumTourLiftCoefficient &&
      dragCoefficient === premiumTourDragCoefficient
  );
  const validityKnown = Boolean(
    normalizedAerodynamicModel.reynoldsValidity &&
    normalizedAerodynamicModel.spinParameterValidity
  );

  const windMps = environment.windMps === undefined
    ? [...DEFAULT_ENVIRONMENT.windMps]
    : [...environment.windMps];
  requireFiniteVector('environment.windMps', windMps);
  const settings = {
    ...DEFAULT_ENVIRONMENT,
    ...environment,
    windMps,
    ball,
    spinDecayPerSecond,
    liftCoefficient,
    dragCoefficient,
    aerodynamicModel: normalizedAerodynamicModel,
    aerodynamicDiagnostics: {
      minReynolds: Infinity,
      maxReynolds: -Infinity,
      minSpinParameter: Infinity,
      maxSpinParameter: -Infinity,
      extrapolated: validityKnown ? false : null,
    },
  };
  for (const key of ['airDensityKgM3', 'kinematicViscosityM2S', 'gravityMps2']) {
    requireFinite(`environment.${key}`, settings[key]);
  }
  if (settings.airDensityKgM3 < 0 || settings.kinematicViscosityM2S <= 0 ||
      settings.gravityMps2 < 0) {
    throw new RangeError('environment values are outside their physical range');
  }

  const speedMps = ballSpeedMph * MPH_TO_MPS;
  const elevation = launchElevationDeg * DEG_TO_RAD;
  const azimuth = launchAzimuthDeg * DEG_TO_RAD;
  const horizontalSpeed = speedMps * Math.cos(elevation);
  const initialVelocity = [
    horizontalSpeed * Math.sin(azimuth),
    horizontalSpeed * Math.cos(azimuth),
    speedMps * Math.sin(elevation),
  ];
  const initialOmega = magnitude(spinVectorRadPerSec);
  const fixedSpinAxis = unit(spinVectorRadPerSec, [1, 0, 0]);
  let state = [0, 0, 1e-6, ...initialVelocity, initialOmega];
  let next = new Array(7).fill(0);
  const buffers = {
    k1: new Array(7).fill(0),
    k2: new Array(7).fill(0),
    k3: new Array(7).fill(0),
    k4: new Array(7).fill(0),
    temp: new Array(7).fill(0),
  };
  let time = 0;

  while (time < maxTimeSeconds) {
    const previous = state;
    rk4StepInto(previous, dt, fixedSpinAxis, settings, next, buffers);
    if (previous[2] >= 0 && next[2] < 0 && next[5] < 0) {
      const fraction = previous[2] / (previous[2] - next[2]);
      const touchdown = previous.map(
        (value, index) => value + fraction * (next[index] - value)
      );
      const position = touchdown.slice(0, 3);
      const launchForwardHorizontal = [Math.sin(azimuth), Math.cos(azimuth), 0];
      const launchRightHorizontal = [Math.cos(azimuth), -Math.sin(azimuth), 0];
      const d = settings.aerodynamicDiagnostics;
      const finiteOrNull = value => Number.isFinite(value) ? value : null;
      return {
        carryM: Math.hypot(position[0], position[1]),
        downLaunchLineM: dot(position, launchForwardHorizontal),
        sideFromTargetM: position[0],
        curveFromLaunchLineM: dot(position, launchRightHorizontal),
        flightTimeSeconds: time + fraction * dt,
        landingSpinRpm: touchdown[6] * RAD_S_TO_RPM,
        touchdownPositionM: position,
        aerodynamicDiagnostics: Object.freeze({
          coefficientSetId: normalizedAerodynamicModel.id,
          validityKnown,
          reynoldsValidity: normalizedAerodynamicModel.reynoldsValidity,
          spinParameterValidity: normalizedAerodynamicModel.spinParameterValidity,
          reynoldsRangeObserved: Object.freeze([
            finiteOrNull(d.minReynolds), finiteOrNull(d.maxReynolds),
          ]),
          spinParameterRangeObserved: Object.freeze([
            finiteOrNull(d.minSpinParameter), finiteOrNull(d.maxSpinParameter),
          ]),
          extrapolated: d.extrapolated,
          reverseMagnusPolicy: normalizedAerodynamicModel.reverseMagnusPolicy,
        }),
      };
    }
    state = next;
    next = previous;
    time += dt;
  }
  throw new Error('Flight did not reach the ground within maxTimeSeconds');
}
