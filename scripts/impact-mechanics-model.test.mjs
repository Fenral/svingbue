import test from 'node:test';
import assert from 'node:assert/strict';
import {
  solveDelivery,
  solveArc,
  handoffArcToDelivery,
} from '../impact-mechanics-model.js';

const close = (actual, expected, tolerance = 1e-6) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);

test('delivery mode delegates the neutral 7-iron state to selectOutcome', () => {
  const result = solveDelivery({ face: 0, path: 0, attack: -3, dynLoft: 30, speed: 90 });
  close(result.outcome.deg.launchDir, 0);
  close(result.outcome.deg.launchAng, 15.382746047638626);
  close(result.outcome.misc.backspin, 6623.095880188069);
  close(result.outcome.raw.carry, 173.99911891890417);
});

test('face and path retain different causal roles', () => {
  const face = solveDelivery({ face: 4, path: 0, attack: -3, dynLoft: 30, speed: 90 });
  const path = solveDelivery({ face: 0, path: 4, attack: -3, dynLoft: 30, speed: 90 });
  close(face.outcome.deg.launchDir, 3);
  close(path.outcome.deg.launchDir, 1);
  assert.ok(face.outcome.m.curve > 0);
  assert.ok(path.outcome.m.curve < 0);
});

test('arc mode maps UI height to lowPoint.z and derives delivery', () => {
  const result = solveArc({ lowPointCm: 10.5, lowPointHeightMm: -2, swingDirection: 0, swingPlane: 55 });
  close(result.effectiveLowPointCm, 10.5);
  close(result.attackAngle, -4.110245535124602);
  close(result.clubPath, 2.884190020209084);
  close(result.contactHeightMm, 1.7702099868106393);
  assert.equal(result.contactBand, 'Pure');
});

test('swing direction and plane change effective low point and path', () => {
  const flat = solveArc({ lowPointCm: 10.5, lowPointHeightMm: -2, swingDirection: 4, swingPlane: 45 });
  const steep = solveArc({ lowPointCm: 10.5, lowPointHeightMm: -2, swingDirection: 4, swingPlane: 70 });
  assert.notEqual(flat.clubPath, steep.clubPath);
  assert.notEqual(flat.rawLowPointCm, steep.rawLowPointCm);
});

test('arc handoff changes only derived attack and path', () => {
  const arc = solveArc({ lowPointCm: 10.5, lowPointHeightMm: -2, swingDirection: 0, swingPlane: 55 });
  const handed = handoffArcToDelivery(arc, { face: 1, path: 0, attack: 0, dynLoft: 30, speed: 90 });
  close(handed.path, arc.clubPath);
  close(handed.attack, arc.attackAngle);
  assert.equal(handed.face, 1);
  assert.equal(handed.dynLoft, 30);
});
