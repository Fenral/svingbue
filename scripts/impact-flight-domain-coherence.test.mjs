import test from 'node:test';
import assert from 'node:assert/strict';
import { solveFlight } from '../impact-flight.js';

test('exactly zero launch suppresses shipping flight without erasing impact physics', () => {
  const exactBoundary = solveFlight({
    clubSpeed: 100,
    dynamicLoft: 0,
    attackAngle: 0,
    faceAngle: 3,
    clubPath: 0,
  });

  assert.equal(exactBoundary.launchAngle, 0);
  for (const metric of [
    'carry',
    'total',
    'apex',
    'landingRaw',
    'landingAngle',
    'curve',
    'curveFromLaunchLineM',
    'offline',
    'rollFrac',
    'roll',
  ]) {
    assert.equal(exactBoundary[metric], 0, `${metric} must be zero at zero launch`);
  }

  assert.ok(exactBoundary.ballSpeed > 0);
  assert.ok(exactBoundary.totalSpinRpm > 0);
  assert.ok(exactBoundary.spinAxis > 0);
  assert.ok(
    exactBoundary.rawCurveFromLaunchLineM > 0,
    'the raw RK4 audit remains visible even though its launch-height artifact does not ship',
  );
});

test('airborne extent collapses continuously at the zero-launch boundary', () => {
  const grounded = solveFlight({
    clubSpeed: 100,
    dynamicLoft: 0,
    attackAngle: -15,
    faceAngle: 3,
    clubPath: 0,
  });

  assert.ok(grounded.ballSpeed > 0, 'this is a launch-domain guard, not a zero-speed case');
  assert.ok(grounded.launchAngle < 0, `expected negative launch, got ${grounded.launchAngle}`);
  assert.equal(grounded.carry, 0);
  assert.equal(grounded.total, 0);
  for (const metric of ['apex', 'landingAngle', 'landingRaw', 'curve', 'offline']) {
    assert.equal(grounded[metric], 0, `${metric} must be zero when the model has no flight`);
  }
  assert.equal(
    grounded.apexBallSpeedTerm + grounded.apexLaunchTerm,
    grounded.apex,
    'live Apex terms must still sum to the guarded output',
  );
  assert.equal(
    grounded.landingBase + grounded.landingSpinTerm + grounded.landingLaunchTerm +
      grounded.landingApexTerm + grounded.landingDomainTerm,
    grounded.landingRaw,
    'the explicit no-flight term must keep the live Landing ledger exact',
  );

  // Both values sit on the public sliders' 0.1-degree grid. This side of the
  // boundary has positive launch and positive spin loft, so it is a real
  // barely-airborne solve rather than an out-of-domain topspin construction.
  const barelyAirborne = solveFlight({
    clubSpeed: 100,
    dynamicLoft: 0.1,
    attackAngle: -0.3,
    faceAngle: 0,
    clubPath: 0,
  });

  assert.ok(barelyAirborne.launchAngle > 0);
  assert.ok(barelyAirborne.spinLoft > 0);
  assert.ok(barelyAirborne.carry > 0);
  assert.ok(barelyAirborne.apex > 0);
  assert.equal(
    barelyAirborne.apexBallSpeedTerm + barelyAirborne.apexLaunchTerm,
    barelyAirborne.apex,
  );
  assert.equal(barelyAirborne.landingDomainTerm, 0);
  assert.ok(
    barelyAirborne.apex < barelyAirborne.carry,
    `near-zero launch retained ${barelyAirborne.apex.toFixed(3)} yd Apex ` +
      `over only ${barelyAirborne.carry.toFixed(3)} yd Carry`,
  );
});
