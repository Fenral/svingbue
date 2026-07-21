import test from 'node:test';
import assert from 'node:assert/strict';
import {
  solveFlight,
  shapeLabel,
  trajectorySamples,
} from '../impact-flight.js';

const DEG = Math.PI / 180;
const YARD_TO_M = 0.9144;
const close = (actual, expected, tolerance = 1e-9, message = '') => {
  assert.ok(
    Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance,
    `${message || 'value'}: expected ${expected} +/- ${tolerance}, got ${actual}`
  );
};

const base = overrides => ({
  club: '7iron',
  clubSpeed: 90,
  attackAngle: -3,
  clubPath: 0,
  dynamicLoft: 30,
  faceAngle: 0,
  ...overrides,
});

function expectedDPlane({ attackAngle, clubPath, dynamicLoft, faceAngle }) {
  const attack = attackAngle * DEG;
  const path = clubPath * DEG;
  const loft = dynamicLoft * DEG;
  const face = faceAngle * DEG;
  const velocity = [
    Math.cos(attack) * Math.sin(path),
    Math.cos(attack) * Math.cos(path),
    Math.sin(attack),
  ];
  const normal = [
    Math.cos(loft) * Math.sin(face),
    Math.cos(loft) * Math.cos(face),
    Math.sin(loft),
  ];
  const cross = [
    velocity[1] * normal[2] - velocity[2] * normal[1],
    velocity[2] * normal[0] - velocity[0] * normal[2],
    velocity[0] * normal[1] - velocity[1] * normal[0],
  ];
  const spinLoft3DDeg = Math.atan2(
    Math.hypot(...cross),
    velocity.reduce((sum, value, index) => sum + value * normal[index], 0)
  ) / DEG;
  const dPlaneTiltRightDeg = Math.atan2(
    -cross[2],
    Math.hypot(cross[0], cross[1])
  ) / DEG;
  return { spinLoft3DDeg, dPlaneTiltRightDeg };
}

function pick(object, keys) {
  return Object.fromEntries(keys.map(key => [key, object[key]]));
}

const protectedNeutralKeys = [
  'startDirection', 'spinLoft', 'launchAngle', 'ballSpeed', 'smash',
  'smashEff', 'carry', 'apex', 'landingAngle', 'backspin', 'curve',
  'offline', 'rollFrac', 'roll', 'total',
];

test('neutral five-field reference pins the recalibrated longitudinal outputs', () => {
  const flight = solveFlight(base({}));
  assert.deepEqual(pick(flight, protectedNeutralKeys), {
    startDirection: 0,
    spinLoft: 33,
    launchAngle: 15.382746047638626,
    ballSpeed: 122.56069767495934,
    smash: 1.3617855297217705,
    smashEff: 1.3617855297217705,
    carry: 173.99911891890417,
    apex: 31.02114110454145,
    landingAngle: 50.789928102248574,
    backspin: 6623.095880188069,
    curve: 0,
    offline: 0,
    rollFrac: 0.03131510784662714,
    roll: 5.4488011741635844,
    total: 179.44792009306775,
  });
  assert.equal(flight.spinLoft3DDeg, 33);
  assert.equal(flight.signedVerticalSpinLoftDeg, 33);
  assert.equal(flight.spinAxis, 0);
});

test('neutral low-loft delivery pins the recalibrated five-field fit exactly', () => {
  const flight = solveFlight(base({
    club: 'driver',
    clubSpeed: 105,
    attackAngle: 2,
    dynamicLoft: 9,
  }));
  assert.deepEqual(pick(flight, protectedNeutralKeys), {
    startDirection: 0,
    spinLoft: 7,
    launchAngle: 9.302289642461583,
    ballSpeed: 159.30592724943727,
    smash: 1.5171993071374978,
    smashEff: 1.5171993071374978,
    carry: 241.12516867203772,
    apex: 31.4161628586604,
    landingAngle: 32,
    backspin: 1390.1680432083479,
    curve: 0,
    offline: 0,
    rollFrac: 0.055,
    roll: 13.261884276962075,
    total: 254.38705294899978,
  });
  assert.equal(flight.spinLoft3DDeg, 7);
  assert.equal(flight.signedVerticalSpinLoftDeg, 7);
  assert.equal(flight.spinAxis, 0);
});

test('3-D spin loft drives smash while vertical spin loft alone selects bag calibration', () => {
  const input = base({ attackAngle: -3, clubPath: -2, dynamicLoft: 30, faceAngle: 2 });
  const expected = expectedDPlane(input);
  const flight = solveFlight(input);

  close(flight.spinLoft, expected.spinLoft3DDeg, 1e-12);
  close(flight.spinLoft3DDeg, expected.spinLoft3DDeg, 1e-12);
  assert.equal(flight.signedVerticalSpinLoftDeg, 33);
  close(flight.spinAxis, expected.dPlaneTiltRightDeg, 1e-12);
  assert.ok(flight.spinLoft > flight.signedVerticalSpinLoftDeg);

  const smashRaw = flight.smashModelIntercept +
    flight.smashSpinLoftLinear * flight.spinLoft +
    flight.smashSpinLoftQuadratic * flight.spinLoft ** 2;
  close(flight.smashEff, Math.max(flight.smashMinimum, Math.min(flight.smashMaximum, smashRaw)), 1e-12);
  const neutral = solveFlight(base({ attackAngle: -3, dynamicLoft: 30 }));
  close(flight.spinCalibration, neutral.spinCalibration, 1e-12,
    'face/path must not apply across-bag spin calibration twice');
  // spinRpmRaw er nå den BEREGNEDE spinnen (rulling ved separasjon), ikke den
  // fittede spinLoft·ballSpeed·k. Under sanity-klemma er rå og total identiske.
  assert.ok(flight.spinRpmRaw > 0);
  close(flight.spinRpmRaw, flight.totalSpinRpm, 1e-9);
  assert.equal(flight.spinK, undefined, 'den fittede slope-konstanten er borte');
});

test('same face-to-path is more forgiving with loft, including the ~2.4 driver/hybrid axis ratio', () => {
  const driver9 = solveFlight(base({
    club: 'driver', clubSpeed: 105, attackAngle: 0, dynamicLoft: 9, faceAngle: 3,
  }));
  const driver12 = solveFlight(base({
    club: 'driver', clubSpeed: 105, attackAngle: 0, dynamicLoft: 12, faceAngle: 3,
  }));
  const hybrid = solveFlight(base({
    clubSpeed: 95, attackAngle: -3, dynamicLoft: 19, faceAngle: 3,
  }));
  const wedge = solveFlight(base({
    clubSpeed: 80, attackAngle: -5, dynamicLoft: 40, faceAngle: 3,
  }));

  close(driver9.spinAxis, 18.285426231676247, 1e-9);
  close(driver12.spinAxis, 13.832295778275782, 1e-9);
  close(hybrid.spinAxis, 7.5160372077067095, 1e-9);
  close(wedge.spinAxis, 3.2331479233688514, 1e-9);
  assert.ok(driver9.spinAxis / hybrid.spinAxis > 2.35 && driver9.spinAxis / hybrid.spinAxis < 2.5);
  assert.ok(Math.abs(driver12.curve) < Math.abs(driver9.curve), '12 degree driver must bend less than 9 degree driver');
  assert.ok(Math.abs(driver12.offline) < Math.abs(driver9.offline), '12 degree driver must finish less offline');
  assert.ok(Math.abs(wedge.curve) < Math.abs(hybrid.curve), 'wedge must bend less than hybrid/long iron');
});

test('representative +3 degree driver miss remains below 30 yards offline', () => {
  const flight = solveFlight(base({
    club: 'driver', clubSpeed: 105, attackAngle: 0, dynamicLoft: 9, faceAngle: 3,
  }));
  assert.ok(flight.offline > 0);
  assert.ok(flight.offline < 30, `expected a plausible miss below 30 yd, got ${flight.offline}`);
});

test('flagship driver diagnosis remains monotonic when the face-to-path gap is halved', () => {
  const full = solveFlight({
    club: 'driver', clubSpeed: 95.9, attackAngle: 4, dynamicLoft: 11.5,
    clubPath: -6.5, faceAngle: 6.5,
  });
  const half = solveFlight({
    club: 'driver', clubSpeed: 95.9, attackAngle: 4, dynamicLoft: 11.5,
    clubPath: -3.25, faceAngle: 3.25,
  });
  assert.ok(Math.abs(half.curve) < Math.abs(full.curve));
  assert.ok(Math.abs(half.offline) < Math.abs(full.offline));
});

test('higher spin loft still raises backspin and lowers smash factor at neutral face/path', () => {
  const low = solveFlight(base({ attackAngle: 0, dynamicLoft: 20 }));
  const high = solveFlight(base({ attackAngle: 0, dynamicLoft: 40 }));
  assert.ok(high.spinLoft > low.spinLoft);
  assert.ok(high.backspin > low.backspin);
  assert.ok(high.smash < low.smash);
  assert.ok(high.ballSpeed < low.ballSpeed);
});

test('curve comes from the metre-based simulator with a disclosed retained-carry projection', () => {
  const flight = solveFlight(base({
    club: 'driver', clubSpeed: 105, attackAngle: 0, dynamicLoft: 9, faceAngle: 3,
  }));
  assert.equal(flight.centeredStrike, true);
  assert.equal(flight.gearEffectApplied, false);
  assert.ok(Array.isArray(flight.spinVectorRadPerSec) && flight.spinVectorRadPerSec.length === 3);
  assert.ok(flight.spinVectorRadPerSec.every(Number.isFinite));
  assert.ok(flight.totalSpinRpm >= flight.backspin);
  assert.ok(Number.isFinite(flight.curveFromLaunchLineM));
  assert.equal(flight.curve, flight.curveFromLaunchLineM / YARD_TO_M);
  assert.equal(
    flight.offline,
    flight.carry * Math.sin(flight.startDirection * DEG) + flight.curve
  );
  assert.ok(Number.isFinite(flight.curveFlightCarryYd));
  assert.ok(Number.isFinite(flight.rawCurveFromLaunchLineM));
  assert.equal(flight.curveCarryProjectionDefined, true);
  assert.ok(Number.isFinite(flight.curveCarryProjectionScale));
  close(
    flight.curveFromLaunchLineM,
    flight.rawCurveFromLaunchLineM * flight.curveCarryProjectionScale,
    1e-9
  );
  assert.equal('curveCarryConstraintSatisfied' in flight, false);
  assert.equal('curveCarryResidualYd' in flight, false);
  const aeroDisclosure = flight.aeroModel ?? flight.aerodynamicModel ?? flight.aero;
  assert.ok(aeroDisclosure, 'flight must disclose the aerodynamic model used for curve');
  assert.match(JSON.stringify(aeroDisclosure), /premium|tour|Smits|Smith/i);
});

test('reported backspin is exactly the flight-relative projection of the full spin vector', () => {
  const flight = solveFlight(base({ clubPath: 0, faceAngle: 3 }));
  const elevation = flight.launchAngle * DEG;
  const azimuth = flight.startDirection * DEG;
  const launchDirection = [
    Math.cos(elevation) * Math.sin(azimuth),
    Math.cos(elevation) * Math.cos(azimuth),
    Math.sin(elevation),
  ];
  const backspinAxis = [
    launchDirection[1] / Math.hypot(launchDirection[0], launchDirection[1]),
    -launchDirection[0] / Math.hypot(launchDirection[0], launchDirection[1]),
    0,
  ];
  const projectedRpm = flight.spinVectorRadPerSec.reduce(
    (sum, value, index) => sum + value * backspinAxis[index],
    0
  ) * 60 / (2 * Math.PI);
  close(projectedRpm, flight.backspin, 1e-7);
});

test('near-zero vertical spin loft cannot create a projection singularity or reverse curve sign', () => {
  const shots = [14.98, 15, 15.02].map(dynamicLoft => solveFlight({
    club: '7iron',
    clubSpeed: 90,
    attackAngle: 15,
    clubPath: 0,
    dynamicLoft,
    faceAngle: 3,
  }));
  for (const shot of shots) {
    assert.ok(shot.totalSpinRpm <= 9000, `bounded total spin: ${shot.totalSpinRpm}`);
    assert.ok(Math.abs(shot.rightCurveSpinRpm) <= shot.totalSpinRpm + 1e-9);
    assert.ok(shot.curve > 0, `positive face-to-path must curve right: ${shot.curve}`);
  }
  assert.ok(
    Math.max(...shots.map(shot => shot.curve)) - Math.min(...shots.map(shot => shot.curve)) < 5,
    'curve remains continuous through the near-vertical-axis region'
  );

  const zero = solveFlight({
    club: '7iron', clubSpeed: 90, attackAngle: 15, clubPath: 0,
    dynamicLoft: 15, faceAngle: 0,
  });
  assert.equal(zero.totalSpinRpm, 0);
  assert.equal(zero.backspin, 0);
  assert.equal(zero.curve, 0);
});

test('mirror delivery produces mirrored spin axis and curve without a hidden gear term', () => {
  const right = solveFlight(base({ clubPath: 0, faceAngle: 3 }));
  const left = solveFlight(base({ clubPath: 0, faceAngle: -3 }));
  close(right.spinLoft, left.spinLoft, 1e-12);
  close(right.spinAxis, -left.spinAxis, 1e-12);
  close(right.curve, -left.curve, 1e-7);
  close(right.offline, -left.offline, 1e-7);
  assert.equal(right.gearEffectApplied, false);
  assert.equal(left.gearEffectApplied, false);
});

test('shape labels use true face-to-path, not a recovered fitted spin-axis gain', () => {
  assert.equal(shapeLabel(0, 0.5), 'Straight');
  assert.equal(shapeLabel(0, 3), 'Fade');
  assert.equal(shapeLabel(0, -3), 'Draw');
  assert.equal(shapeLabel(0, 7), 'Slice');
  assert.equal(shapeLabel(0, -7), 'Hook');

  const lowLoft = solveFlight(base({ attackAngle: 0, dynamicLoft: 10, faceAngle: 7 }));
  const highLoft = solveFlight(base({ attackAngle: 0, dynamicLoft: 50, faceAngle: 7 }));
  assert.match(lowLoft.shape, /Slice$/);
  assert.match(highLoft.shape, /Slice$/);
});

test('trajectory samples retain yards and the offline = start + curve endpoint identity', () => {
  const flight = solveFlight(base({ clubPath: -1, faceAngle: 2 }));
  const startSide = flight.carry * Math.sin(flight.startDirection * DEG);
  close(flight.offline, startSide + flight.curve, 1e-12);
  const points = trajectorySamples(flight);
  assert.equal(points[0].x, 0);
  assert.equal(points.at(-1).x, 1);
  assert.ok(points.every(point => Number.isFinite(point.d) && Number.isFinite(point.h) && Number.isFinite(point.x)));
});

test('solveFlight rejects non-finite and physically invalid speed instead of silently substituting zero', () => {
  assert.throws(() => solveFlight(base({ clubSpeed: -1 })), RangeError);
  assert.throws(() => solveFlight(base({ faceAngle: NaN })), TypeError);
  assert.throws(() => solveFlight(base({ dynamicLoft: Infinity })), TypeError);
});

test('zero club speed cannot produce spin from the empirical minimum clamp', () => {
  const stopped = solveFlight(base({ clubSpeed: 0 }));
  assert.equal(stopped.ballSpeed, 0);
  assert.equal(stopped.carry, 0);
  assert.equal(stopped.totalSpinRpm, 0);
  assert.equal(stopped.backspin, 0);
  assert.deepEqual(stopped.spinVectorRadPerSec, [0, 0, 0]);
});

test('spin goes continuously to zero with true spin loft — there is no floor left', () => {
  const zero = solveFlight(base({
    clubSpeed: 100, attackAngle: 10, dynamicLoft: 10, faceAngle: 0,
  }));
  const epsilon = solveFlight(base({
    clubSpeed: 100, attackAngle: 10, dynamicLoft: 10, faceAngle: 1e-9,
  }));
  assert.equal(zero.totalSpinRpm, 0);
  assert.ok(epsilon.totalSpinRpm < 1e-6, `tiny gap must not trigger 1500 rpm: ${epsilon.totalSpinRpm}`);
  assert.ok(Math.abs(epsilon.curveFromLaunchLineM) < 0.01);
  // Gulvet er fjernet helt, ikke bare blendet ned: feltene finnes ikke lenger.
  assert.equal(epsilon.spinFloorBlend, undefined);
  assert.equal(epsilon.minTotalSpinRpm, undefined);
});
