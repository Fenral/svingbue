import test from 'node:test';
import assert from 'node:assert/strict';

// The implementation deliberately does not exist at the start of the TDD
// cycle. Keep the import failure inside the tests so RED reports the missing
// physics contract clearly instead of aborting this test file in the loader.
let model = null;
let modelImportError = null;
try {
  model = await import('../flightglass-3d-spin-model.js');
} catch (error) {
  modelImportError = error;
}

function requireModel() {
  assert.ok(
    model,
    `flightglass-3d-spin-model.js must be a loadable ESM module: ${modelImportError?.message ?? 'unknown import failure'}`
  );
  return model;
}

const DEG = Math.PI / 180;
const close = (actual, expected, tolerance = 1e-9, message = '') => {
  assert.ok(
    Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance,
    `${message || 'value'}: expected ${expected} +/- ${tolerance}, got ${actual}`
  );
};
const magnitude = vector => Math.hypot(...vector);
const dot = (a, b) => a.reduce((sum, value, index) => sum + value * b[index], 0);
const rpmProjection = (spinVectorRadPerSec, axisUnit) =>
  dot(spinVectorRadPerSec, axisUnit) * 60 / (2 * Math.PI);

function delivery(overrides = {}) {
  return {
    clubSpeed: 105,
    attackAngle: 0,
    clubPath: 0,
    dynamicLoft: 9,
    faceAngle: 0,
    ...overrides,
  };
}

test('ESM exposes the centered-strike geometry, spin-vector, aero and optional gear contracts', () => {
  const m = requireModel();
  for (const name of [
    'MPH_TO_MPS',
    'YARD_TO_M',
    'RPM_TO_RAD_S',
    'DEFAULT_BALL',
    'DEFAULT_ENVIRONMENT',
    'SMITS_SMITH_DRIVER_AERO',
    'PREMIUM_TOUR_CLASS_AERO',
    'FLIGHTGLASS_CURVE_CARRY_ANCHOR',
    'centeredImpactGeometry',
    'centeredImpactSpin',
    'spinVectorFromBackspin',
    'spinVectorFromTotalSpin',
    'addHorizontalGearEffect',
    'smitsSmithLiftCoefficient',
    'smitsSmithDragCoefficient',
    'premiumTourLiftCoefficient',
    'premiumTourDragCoefficient',
    'simulateFlight',
  ]) {
    assert.ok(name in m, `missing named export ${name}`);
  }
  assert.equal('default' in m, false, 'the native/WebKit module contract uses named exports only');
});

test('declared units are exact: mph -> m/s, yards -> metres and rpm -> rad/s', () => {
  const m = requireModel();
  assert.equal(m.MPH_TO_MPS, 0.44704);
  assert.equal(m.YARD_TO_M, 0.9144);
  assert.equal(m.RPM_TO_RAD_S, 2 * Math.PI / 60);
});

test('centered geometry builds explicit unit club-velocity and face-normal vectors in x-right/y-target/z-up axes', () => {
  const { centeredImpactGeometry } = requireModel();
  const input = delivery({
    clubSpeed: 100,
    attackAngle: -4,
    clubPath: 6,
    dynamicLoft: 28,
    faceAngle: 2,
  });
  const result = centeredImpactGeometry(input);
  const attack = input.attackAngle * DEG;
  const path = input.clubPath * DEG;
  const loft = input.dynamicLoft * DEG;
  const face = input.faceAngle * DEG;
  const expectedVelocity = [
    Math.cos(attack) * Math.sin(path),
    Math.cos(attack) * Math.cos(path),
    Math.sin(attack),
  ];
  const expectedNormal = [
    Math.cos(loft) * Math.sin(face),
    Math.cos(loft) * Math.cos(face),
    Math.sin(loft),
  ];

  assert.equal(result.axes, 'x=right, y=target, z=up (right-handed)');
  assert.equal(result.centeredStrike, true);
  result.clubVelocityUnit.forEach((value, index) => close(value, expectedVelocity[index], 1e-12));
  result.faceNormalUnit.forEach((value, index) => close(value, expectedNormal[index], 1e-12));
  close(magnitude(result.clubVelocityUnit), 1, 1e-12);
  close(magnitude(result.faceNormalUnit), 1, 1e-12);
  result.clubVelocityMps.forEach((value, index) =>
    close(value, expectedVelocity[index] * 100 * 0.44704, 1e-12)
  );
});

test('neutral horizontal delivery reduces exactly to dynamicLoft - attackAngle and a horizontal +x backspin axis', () => {
  const { centeredImpactGeometry } = requireModel();
  const result = centeredImpactGeometry(delivery({
    attackAngle: -3,
    clubPath: 0,
    dynamicLoft: 30,
    faceAngle: 0,
  }));

  assert.equal(result.spinLoft3DDeg, 33, 'neutral compatibility must be exact, not merely rounded');
  assert.equal(result.signedVerticalSpinLoftDeg, 33);
  assert.equal(result.dPlaneTiltRightDeg, 0);
  assert.deepEqual(result.spinAxisUnit, [1, 0, 0]);
  assert.equal(result.verticalSpinSense, 1);
});

test('neutral exact-subtraction compatibility never escapes the principal 0-to-180 included-angle domain', () => {
  const { centeredImpactGeometry } = requireModel();
  close(centeredImpactGeometry(delivery({
    attackAngle: 0, clubPath: 0, dynamicLoft: 200, faceAngle: 0,
  })).spinLoft3DDeg, 160, 1e-12);
  close(centeredImpactGeometry(delivery({
    attackAngle: 0, clubPath: 0, dynamicLoft: 360, faceAngle: 0,
  })).spinLoft3DDeg, 0, 1e-12);
});

test('true 3-D spin loft is the angle between delivery vectors and grows when a horizontal face/path gap is added', () => {
  const { centeredImpactGeometry } = requireModel();
  const neutral = centeredImpactGeometry(delivery({ attackAngle: 0, dynamicLoft: 12 }));
  const open = centeredImpactGeometry(delivery({ attackAngle: 0, dynamicLoft: 12, faceAngle: 3 }));
  const angleFromVectors = Math.atan2(
    magnitude([
      open.clubVelocityUnit[1] * open.faceNormalUnit[2] - open.clubVelocityUnit[2] * open.faceNormalUnit[1],
      open.clubVelocityUnit[2] * open.faceNormalUnit[0] - open.clubVelocityUnit[0] * open.faceNormalUnit[2],
      open.clubVelocityUnit[0] * open.faceNormalUnit[1] - open.clubVelocityUnit[1] * open.faceNormalUnit[0],
    ]),
    dot(open.clubVelocityUnit, open.faceNormalUnit)
  ) / DEG;

  assert.equal(neutral.spinLoft3DDeg, 12);
  close(open.spinLoft3DDeg, angleFromVectors, 1e-12);
  assert.ok(open.spinLoft3DDeg > open.signedVerticalSpinLoftDeg);
});

test('D-plane tilt mirrors with face-to-path sign and its spin vector has the right-handed curve sign', () => {
  const { centeredImpactGeometry } = requireModel();
  const right = centeredImpactGeometry(delivery({ dynamicLoft: 12, faceAngle: 3 }));
  const left = centeredImpactGeometry(delivery({ dynamicLoft: 12, faceAngle: -3 }));

  close(right.spinLoft3DDeg, left.spinLoft3DDeg, 1e-12);
  close(right.dPlaneTiltRightDeg, -left.dPlaneTiltRightDeg, 1e-12);
  assert.ok(right.dPlaneTiltRightDeg > 0, 'positive face-to-path must be right-curving for a RH golfer');
  assert.ok(right.spinAxisUnit[2] < 0, 'right-curve spin is -z in the declared frame');
  right.spinAxisUnit.forEach((value, index) => {
    const mirrored = index === 2 ? -left.spinAxisUnit[index] : left.spinAxisUnit[index];
    close(value, mirrored, 1e-12);
  });
});

test('reported D-plane tilt is the exact spin-axis angle from world horizontal', () => {
  const { centeredImpactGeometry } = requireModel();
  const result = centeredImpactGeometry(delivery({
    attackAngle: 15,
    dynamicLoft: 15,
    faceAngle: 3,
  }));
  const exactRightTilt = -Math.atan2(
    result.spinAxisUnit[2],
    Math.hypot(result.spinAxisUnit[0], result.spinAxisUnit[1])
  ) / DEG;
  close(result.dPlaneTiltRightDeg, exactRightTilt, 1e-12);
  close(result.dPlaneTiltRightDeg, 74.99508997201585, 1e-9);
  assert.ok(result.dPlaneTiltRightDeg < 80, 'full v x n geometry must not collapse to the scalar 90-degree approximation');
});

test('loft forgiveness is geometric: the same +3 degree face-to-path tilts low loft much more', () => {
  const { centeredImpactGeometry } = requireModel();
  const driver9 = centeredImpactGeometry(delivery({ attackAngle: 0, dynamicLoft: 9, faceAngle: 3 }));
  const driver12 = centeredImpactGeometry(delivery({ attackAngle: 0, dynamicLoft: 12, faceAngle: 3 }));
  const hybrid = centeredImpactGeometry(delivery({ attackAngle: -3, dynamicLoft: 19, faceAngle: 3 }));
  const wedge = centeredImpactGeometry(delivery({ attackAngle: -5, dynamicLoft: 40, faceAngle: 3 }));

  close(driver9.dPlaneTiltRightDeg, 18.285426231676247, 1e-9, '9 degree driver tilt');
  close(driver12.dPlaneTiltRightDeg, 13.832295778275782, 1e-9, '12 degree driver tilt');
  close(hybrid.dPlaneTiltRightDeg, 7.5160372077067095, 1e-9, 'hybrid tilt');
  close(wedge.dPlaneTiltRightDeg, 3.2331479233688514, 1e-9, 'wedge tilt');
  close(driver9.dPlaneTiltRightDeg / hybrid.dPlaneTiltRightDeg, 2.432854671465296, 1e-12);
  assert.ok(driver12.dPlaneTiltRightDeg < driver9.dPlaneTiltRightDeg);
  assert.ok(wedge.dPlaneTiltRightDeg < hybrid.dPlaneTiltRightDeg);
});

test('compatibility spin vector preserves reported backspin as an exact flight-relative projection', () => {
  const { centeredImpactGeometry, spinVectorFromBackspin } = requireModel();
  const geometry = centeredImpactGeometry(delivery({ dynamicLoft: 12, faceAngle: 3 }));
  const spin = spinVectorFromBackspin(geometry, 2500);

  assert.equal(spin.centeredStrike, true);
  assert.equal(spin.gearEffectApplied, false);
  assert.equal(spin.backSpinRpm, 2500);
  close(rpmProjection(spin.spinVectorRadPerSec, geometry.backspinAxisUnit), 2500, 1e-8);
  close(magnitude(spin.spinVectorRadPerSec) / (2 * Math.PI / 60), spin.totalSpinRpm, 1e-8);
  assert.ok(spin.totalSpinRpm > spin.backSpinRpm, 'tilted-axis total spin exceeds its backspin projection');
  assert.ok(spin.rightCurveSpinRpm > 0);
  close(
    rpmProjection(spin.spinVectorRadPerSec, geometry.rightCurveSpinAxisUnit),
    spin.rightCurveSpinRpm,
    1e-8
  );
});

test('total-spin vector is bounded at a near-vertical D-plane axis and zero spin loft stays zero', () => {
  const {
    centeredImpactGeometry,
    spinVectorFromBackspin,
    spinVectorFromTotalSpin,
  } = requireModel();
  const nearVertical = centeredImpactGeometry({
    clubSpeed: 90,
    attackAngle: 15,
    clubPath: 0,
    dynamicLoft: 15,
    faceAngle: 3,
  });
  const spin = spinVectorFromTotalSpin(nearVertical, 1500, {
    launchElevationDeg: 13,
    launchAzimuthDeg: 2.5,
  });
  close(spin.totalSpinRpm, 1500, 1e-9);
  assert.ok(Math.abs(spin.backSpinRpm) <= spin.totalSpinRpm + 1e-9);
  assert.ok(Math.abs(spin.rightCurveSpinRpm) <= spin.totalSpinRpm + 1e-9);
  assert.ok(spin.rightCurveSpinRpm > 0);
  assert.throws(
    () => spinVectorFromBackspin(nearVertical, 1500, {
      launchElevationDeg: 13,
      launchAzimuthDeg: 2.5,
    }),
    /ill-conditioned|total spin/i
  );

  const zeroGeometry = centeredImpactGeometry({
    clubSpeed: 90,
    attackAngle: 15,
    clubPath: 0,
    dynamicLoft: 15,
    faceAngle: 0,
  });
  const zero = spinVectorFromTotalSpin(zeroGeometry, 1500);
  assert.equal(zero.totalSpinRpm, 0);
  assert.deepEqual(zero.spinVectorRadPerSec, [0, 0, 0]);
});

test('ideal centered impact spin remains centered and never smuggles in strike-location gear effect', () => {
  const { centeredImpactSpin } = requireModel();
  const spin = centeredImpactSpin(delivery({ dynamicLoft: 12, faceAngle: 3 }));
  assert.equal(spin.centeredStrike, true);
  assert.equal(spin.gearEffectApplied ?? false, false);
  assert.equal('strikeOffsetFromCgMm' in spin, false);
  assert.ok(spin.totalSpinRpm > 0);
  assert.match(spin.assumptions.strike, /centre|center/i);
});

test('horizontal gear effect is a separate optional add-on: zero is exact, toe draws and heel fades', () => {
  const { centeredImpactSpin, addHorizontalGearEffect } = requireModel();
  const centered = centeredImpactSpin(delivery({ dynamicLoft: 12, faceAngle: 0 }));
  const zero = addHorizontalGearEffect(centered, { strikeOffsetFromCgMm: 0 });
  const toe = addHorizontalGearEffect(centered, { strikeOffsetFromCgMm: 10 });
  const heel = addHorizontalGearEffect(centered, { strikeOffsetFromCgMm: -10 });

  assert.equal(zero.centeredStrike, true);
  assert.equal(zero.gearEffectApplied, false);
  assert.equal(zero.gearEffectRightCurveRpm, 0);
  assert.deepEqual(zero.combinedSpinVectorRadPerSec, centered.spinVectorRadPerSec);
  assert.equal(toe.centeredStrike, false);
  assert.equal(toe.gearEffectApplied, true);
  assert.ok(toe.gearEffectRightCurveRpm < 0, 'toe-side gear spin curves left/draw for RH');
  assert.ok(heel.gearEffectRightCurveRpm > 0, 'heel-side gear spin curves right/fade for RH');
  close(toe.gearEffectRightCurveRpm, -heel.gearEffectRightCurveRpm, 1e-9);
});

test('published Smits-Smith equations remain available while the default is an explicitly disclosed historical Pro-V1-class bridge', () => {
  const {
    SMITS_SMITH_DRIVER_AERO,
    PREMIUM_TOUR_CLASS_AERO,
    FLIGHTGLASS_CURVE_CARRY_ANCHOR,
    smitsSmithDragCoefficient,
    smitsSmithLiftCoefficient,
    premiumTourDragCoefficient,
    premiumTourLiftCoefficient,
  } = requireModel();
  const reynolds = 150000;
  const spinParameter = 0.12;
  const expectedCd = 0.24 + 0.18 * spinParameter +
    0.06 * Math.sin(Math.PI * (reynolds - 90000) / 200000);
  const expectedCl = 0.54 * Math.pow(spinParameter, 0.4);

  close(smitsSmithDragCoefficient(reynolds, spinParameter), expectedCd, 1e-12);
  close(smitsSmithLiftCoefficient(spinParameter, reynolds), expectedCl, 1e-12);
  close(
    premiumTourLiftCoefficient(spinParameter, reynolds),
    0.4072 * Math.pow(spinParameter, 0.4),
    1e-12
  );
  assert.deepEqual(SMITS_SMITH_DRIVER_AERO.reynoldsValidity, [70000, 210000]);
  assert.deepEqual(SMITS_SMITH_DRIVER_AERO.spinParameterValidity, [0.08, 0.20]);
  const expectedTourCd = 0.2016141765 +
    0.0463816544 / (1 + Math.exp((reynolds - 85000) / 9000)) +
    0.06 * spinParameter / (0.15 + spinParameter);
  close(premiumTourDragCoefficient(reynolds, spinParameter), expectedTourCd, 1e-12);
  assert.equal(PREMIUM_TOUR_CLASS_AERO.liftScale, 0.4072);
  assert.equal(PREMIUM_TOUR_CLASS_AERO.spinDecayPerSecond, 0.04);
  assert.equal(PREMIUM_TOUR_CLASS_AERO.exactNamedBall, false);
  assert.match(PREMIUM_TOUR_CLASS_AERO.reverseMagnusPolicy, /not modeled/i);
  assert.equal('reverseMagnusBelowReynolds' in PREMIUM_TOUR_CLASS_AERO, false);
  assert.match(PREMIUM_TOUR_CLASS_AERO.disclosure, /historical|class|proprietary|named ball/i);
  assert.equal(FLIGHTGLASS_CURVE_CARRY_ANCHOR.dragScale, 1.275116456035);
  assert.equal(FLIGHTGLASS_CURVE_CARRY_ANCHOR.referenceClub, '7iron');
  assert.match(FLIGHTGLASS_CURVE_CARRY_ANCHOR.disclosure, /compatibility|legacy|not.*ball/i);
});

test('tour-class bridge reproduces the two published historical Pro V1 coefficient anchors', () => {
  const { premiumTourDragCoefficient, premiumTourLiftCoefficient } = requireModel();
  close(premiumTourLiftCoefficient(0.110, 180000), 0.168, 0.001);
  close(premiumTourDragCoefficient(180000, 0.110), 0.227, 1e-9);
  close(premiumTourLiftCoefficient(0.188, 70000), 0.209, 0.001);
  close(premiumTourDragCoefficient(70000, 0.188), 0.274, 1e-9);
});

test('vacuum trajectory demonstrates mph input and metre output without an aerodynamic lookup table', () => {
  const { simulateFlight } = requireModel();
  const result = simulateFlight({
    ballSpeedMph: 100,
    launchElevationDeg: 30,
    launchAzimuthDeg: 0,
    spinVectorRadPerSec: [0, 0, 0],
    dt: 0.002,
    environment: { airDensityKgM3: 0 },
  });
  const speedMps = 100 * 0.44704;
  const ballisticRangeM = speedMps ** 2 * Math.sin(60 * DEG) / 9.80665;
  close(result.downLaunchLineM, ballisticRangeM, 0.02);
  close(result.carryM, ballisticRangeM, 0.02);
  close(result.curveFromLaunchLineM, 0, 1e-9);
});

test('RK4 flight uses the full spin vector: neutral is straight and mirrored tilt gives mirrored curve', () => {
  const { simulateFlight, RPM_TO_RAD_S } = requireModel();
  const backspin = 2800 * RPM_TO_RAD_S;
  const sideSpin = 700 * RPM_TO_RAD_S;
  const common = {
    ballSpeedMph: 155,
    launchElevationDeg: 12,
    launchAzimuthDeg: 0,
    dt: 0.01,
  };
  const neutral = simulateFlight({ ...common, spinVectorRadPerSec: [backspin, 0, 0] });
  const right = simulateFlight({ ...common, spinVectorRadPerSec: [backspin, 0, -sideSpin] });
  const left = simulateFlight({ ...common, spinVectorRadPerSec: [backspin, 0, sideSpin] });

  close(neutral.curveFromLaunchLineM, 0, 1e-8);
  assert.ok(right.curveFromLaunchLineM > 0);
  assert.ok(left.curveFromLaunchLineM < 0);
  close(right.curveFromLaunchLineM, -left.curveFromLaunchLineM, 1e-7);
  close(right.downLaunchLineM, left.downLaunchLineM, 1e-7);
});

test('target-side and launch-line curve are distinct and obey their coordinate transform', () => {
  const { simulateFlight, RPM_TO_RAD_S } = requireModel();
  const azimuthDeg = 4;
  const result = simulateFlight({
    ballSpeedMph: 145,
    launchElevationDeg: 15,
    launchAzimuthDeg: azimuthDeg,
    spinVectorRadPerSec: [3200 * RPM_TO_RAD_S, 0, -500 * RPM_TO_RAD_S],
    dt: 0.01,
  });
  const azimuth = azimuthDeg * DEG;
  close(
    result.sideFromTargetM,
    result.downLaunchLineM * Math.sin(azimuth) + result.curveFromLaunchLineM * Math.cos(azimuth),
    1e-7
  );
  assert.notEqual(result.sideFromTargetM, result.curveFromLaunchLineM);
});

test('fixed-step RK4 converges from 0.01 s to 0.005 s without changing the modeled shot materially', () => {
  const { simulateFlight, RPM_TO_RAD_S } = requireModel();
  const input = {
    ballSpeedMph: 145,
    launchElevationDeg: 15,
    launchAzimuthDeg: 2,
    spinVectorRadPerSec: [3500 * RPM_TO_RAD_S, 0, -600 * RPM_TO_RAD_S],
  };
  const coarse = simulateFlight({ ...input, dt: 0.01 });
  const fine = simulateFlight({ ...input, dt: 0.005 });
  close(coarse.downLaunchLineM, fine.downLaunchLineM, 0.03);
  close(coarse.curveFromLaunchLineM, fine.curveFromLaunchLineM, 0.02);
  close(coarse.flightTimeSeconds, fine.flightTimeSeconds, 0.005);
});

test('custom aerodynamic callbacks never inherit the default coefficient-set label or validity silently', () => {
  const { simulateFlight, RPM_TO_RAD_S } = requireModel();
  const common = {
    ballSpeedMph: 130,
    launchElevationDeg: 14,
    launchAzimuthDeg: 0,
    spinVectorRadPerSec: [3000 * RPM_TO_RAD_S, 0, 0],
    dt: 0.01,
    dragCoefficient: () => 0.25,
    liftCoefficient: () => 0.12,
  };
  const tagged = simulateFlight({
    ...common,
    aerodynamicModel: {
      id: 'research-coefficients-v1',
      reynoldsValidity: [1, 1e9],
      spinParameterValidity: [0, 10],
      reverseMagnusPolicy: 'caller-defined',
    },
  });
  assert.equal(tagged.aerodynamicDiagnostics.coefficientSetId, 'research-coefficients-v1');
  assert.equal(tagged.aerodynamicDiagnostics.validityKnown, true);
  assert.equal(tagged.aerodynamicDiagnostics.extrapolated, false);
  assert.equal(tagged.aerodynamicDiagnostics.reverseMagnusPolicy, 'caller-defined');

  const unlabeled = simulateFlight(common);
  assert.equal(unlabeled.aerodynamicDiagnostics.coefficientSetId, 'custom-unlabeled');
  assert.equal(unlabeled.aerodynamicDiagnostics.validityKnown, false);
  assert.equal(unlabeled.aerodynamicDiagnostics.extrapolated, null);
});

test('invalid geometry, units, environment and aerodynamic functions fail explicitly instead of producing NaN', () => {
  const { centeredImpactGeometry, simulateFlight, RPM_TO_RAD_S } = requireModel();
  assert.throws(() => centeredImpactGeometry(delivery({ clubSpeed: -1 })), RangeError);
  assert.throws(() => centeredImpactGeometry(delivery({ faceAngle: NaN })), TypeError);
  assert.throws(() => simulateFlight({
    ballSpeedMph: 100,
    launchElevationDeg: 15,
    launchAzimuthDeg: 0,
    spinVectorRadPerSec: [2500 * RPM_TO_RAD_S, 0, 0],
    dt: 0,
  }), RangeError);
  assert.throws(() => simulateFlight({
    ballSpeedMph: 100,
    launchElevationDeg: 15,
    launchAzimuthDeg: 0,
    spinVectorRadPerSec: [2500 * RPM_TO_RAD_S, 0, 0],
    environment: { kinematicViscosityM2S: 0 },
  }), RangeError);
  assert.throws(() => simulateFlight({
    ballSpeedMph: 100,
    launchElevationDeg: 15,
    launchAzimuthDeg: 0,
    spinVectorRadPerSec: [2500 * RPM_TO_RAD_S, 0, 0],
    dragCoefficient: () => -0.01,
  }), /dragCoefficient/);
  assert.throws(() => simulateFlight({
    ballSpeedMph: 100,
    launchElevationDeg: 15,
    launchAzimuthDeg: 0,
    spinVectorRadPerSec: [2500 * RPM_TO_RAD_S, 0, 0],
    liftCoefficient: () => NaN,
  }), /liftCoefficient/);
});
