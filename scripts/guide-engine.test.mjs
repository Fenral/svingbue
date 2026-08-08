import test from 'node:test';
import assert from 'node:assert/strict';

import { selectOutcome } from '../impact-outcome.js';
import {
  buildGuidedShot,
  createDefaultContext,
} from '../sa-v1-context.js';
import {
  createOneVariableSweep,
  getGuideMetric,
  normalizeGuideInput,
  resolveGuideContext,
} from '../guide-engine.js';

const NOW = Date.parse('2026-08-07T03:00:00.000Z');
const INPUT = Object.freeze({ face: 2, path: -1, attack: -3, dynLoft: 25, speed: 85 });

function shotFromInput(input, club = '7iron') {
  const base = buildGuidedShot({ club, start: 'straight', curve: 'straight', flight: 'neutral' }, NOW);
  return {
    ...base,
    inputs: {
      ...base.inputs,
      clubPath: input.path,
      faceAngle: input.face,
      attackAngle: input.attack,
      dynamicLoft: input.dynLoft,
      clubSpeed: input.speed,
      club,
    },
  };
}

function contextFor(input, club = '7iron') {
  return { ...createDefaultContext(), currentShot: shotFromInput(input, club) };
}

test('normalizes exactly the five public engine inputs without changing their values', () => {
  assert.deepEqual(normalizeGuideInput(INPUT), INPUT);
  assert.notEqual(normalizeGuideInput(INPUT), INPUT, 'callers cannot mutate their frozen fixture through the adapter');
});

test('accepts every shipping control endpoint including zero degrees', () => {
  assert.deepEqual(
    normalizeGuideInput({ face: -15, path: 15, attack: 0, dynLoft: 0, speed: 30 }),
    { face: -15, path: 15, attack: 0, dynLoft: 0, speed: 30 },
  );
  assert.deepEqual(
    normalizeGuideInput({ face: 15, path: -15, attack: 15, dynLoft: 50, speed: 150 }),
    { face: 15, path: -15, attack: 15, dynLoft: 50, speed: 150 },
  );
});

test('rejects missing inputs instead of inventing a default', () => {
  assert.throws(() => normalizeGuideInput({ ...INPUT, speed: undefined }), TypeError);
});

test('rejects strings, NaN and infinity instead of coercing them', () => {
  for (const input of [
    { ...INPUT, face: '2' },
    { ...INPUT, path: Number.NaN },
    { ...INPUT, attack: Infinity },
  ]) assert.throws(() => normalizeGuideInput(input), TypeError);
});

test('rejects values beyond the actual shipping slider domains', () => {
  for (const input of [
    { ...INPUT, face: -15.1 },
    { ...INPUT, path: 15.1 },
    { ...INPUT, attack: -15.1 },
    { ...INPUT, dynLoft: 50.1 },
    { ...INPUT, speed: 29.9 },
  ]) assert.throws(() => normalizeGuideInput(input), RangeError);
});

test('resolves a current guided shot into a freshly calculated ready model', () => {
  const resolved = resolveGuideContext(contextFor(INPUT));
  assert.equal(resolved.status, 'ready');
  assert.deepEqual(resolved.input, INPUT);
  assert.equal(resolved.outcome, selectOutcome(INPUT));
});

test('resolver does not trust stale persisted result values', () => {
  const context = contextFor(INPUT);
  context.currentShot.result.carryM = 9999;
  const resolved = resolveGuideContext(context);
  assert.equal(resolved.status, 'ready');
  assert.equal(resolved.outcome.m.carry, selectOutcome(INPUT).m.carry);
  assert.notEqual(resolved.outcome.m.carry, context.currentShot.result.carryM);
});

test('resolver selects the existing experiment only when explicitly requested', () => {
  const current = shotFromInput(INPUT);
  const experimentInput = { ...INPUT, face: 4 };
  const context = {
    ...createDefaultContext(),
    currentShot: current,
    lastExperiment: {
      id: 'guide-test-experiment',
      sourceShotId: current.id,
      source: 'guided-onboarding',
      changeKey: 'faceAngle',
      instruction: 'Test fixture.',
      inputs: {
        ...current.inputs,
        faceAngle: experimentInput.face,
      },
    },
  };

  assert.deepEqual(resolveGuideContext(context).input, INPUT);
  assert.deepEqual(resolveGuideContext(context, { useExperiment: true }).input, experimentInput);
});

test('Guide experiments may hand any one of the five bounded Range inputs back', () => {
  const current = shotFromInput(INPUT);
  const cases = [
    ['clubPath', 'path', 2],
    ['attackAngle', 'attack', -1],
    ['dynamicLoft', 'dynLoft', 28],
    ['clubSpeed', 'speed', 90],
  ];
  for (const [changeKey, guideKey, value] of cases) {
    const context = {
      ...createDefaultContext(),
      currentShot: current,
      lastExperiment: {
        id: `guide-${changeKey}`,
        sourceShotId: current.id,
        changeKey,
        instruction: 'Guide one-variable handoff fixture.',
        inputs: { ...current.inputs, [changeKey]: value },
      },
    };
    const resolved = resolveGuideContext(context, { useExperiment: true });
    assert.equal(resolved.input[guideKey], value, changeKey);
  }
});

test('resolver has an explicit no-flight status when no valid context is available', () => {
  const resolved = resolveGuideContext(createDefaultContext());
  assert.equal(resolved.status, 'no-flight');
  assert.equal(resolved.input, null);
  assert.equal(resolved.outcome, null);
});

test('resolver exposes an in-domain boundary instead of calling invalid spin meaningful', () => {
  const input = { face: 0, path: 0, attack: 15, dynLoft: 0, speed: 85 };
  const resolved = resolveGuideContext(contextFor(input));
  assert.equal(resolved.status, 'out-of-domain-spin-loft');
  assert.equal(resolved.outcome.physical.reason, 'spin-loft');
});

test('resolver exposes the engine spin-output ceiling without inventing a finer value', () => {
  const input = { face: 0, path: 0, attack: -15, dynLoft: 50, speed: 150 };
  const resolved = resolveGuideContext(contextFor(input));
  assert.equal(resolved.status, 'spin-output-ceiling');
  assert.equal(resolved.outcome.raw.totalSpinRpm, resolved.outcome.raw.maxTotalSpinRpm);
});

test('resolver exposes no-flight when a valid stored delivery cannot launch', () => {
  const input = { face: 0, path: 0, attack: -15, dynLoft: 0, speed: 85 };
  const resolved = resolveGuideContext(contextFor(input));
  assert.equal(resolved.status, 'no-flight');
  assert.equal(resolved.outcome.raw.carry, 0);
});

test('metric adapter mirrors authoritative outcome paths', () => {
  const outcome = selectOutcome(INPUT);
  const expected = {
    carry_m: outcome.m.carry,
    total_m: outcome.m.total,
    apex_m: outcome.m.apex,
    curve_m: outcome.m.curve,
    side_m: outcome.m.side,
    launch_direction_deg: outcome.deg.launchDir,
    spin_axis_deg: outcome.deg.spinAxis,
    launch_angle_deg: outcome.deg.launchAng,
    spin_loft_deg: outcome.deg.spinLoft,
    landing_angle_deg: outcome.deg.landAng,
    backspin_rpm: outcome.misc.backspin,
    ball_speed_mph: outcome.misc.ballSpeed,
    smash: outcome.misc.smash,
  };
  for (const [metricId, value] of Object.entries(expected)) {
    assert.equal(getGuideMetric(outcome, metricId), value, metricId);
  }
});

test('start side is the only derived Guide metric: launch side minus curve', () => {
  const outcome = selectOutcome(INPUT);
  assert.equal(
    getGuideMetric(outcome, 'start_side_m'),
    outcome.m.side - outcome.m.curve,
  );
});

test('unknown metrics are rejected rather than guessed', () => {
  assert.throws(() => getGuideMetric(selectOutcome(INPUT), 'optimal_spin_rpm'), RangeError);
});

test('one-variable sweep changes exactly the requested valid input', () => {
  const sweep = createOneVariableSweep(INPUT, 'face', [-2, 0, 4]);
  assert.equal(sweep.length, 3);
  for (const point of sweep) {
    const changed = Object.keys(INPUT).filter(key => point.input[key] !== INPUT[key]);
    assert.deepEqual(changed, ['face']);
    assert.equal(point.value, point.input.face);
    assert.equal(point.status, 'ready');
  }
});

test('sweep never accepts unknown keys or out-of-domain values', () => {
  assert.throws(() => createOneVariableSweep(INPUT, 'club', [1]), RangeError);
  assert.throws(() => createOneVariableSweep(INPUT, 'speed', [151]), RangeError);
});

test('sweep rejects candidates that do not have an honest airborne, in-domain output', () => {
  assert.throws(
    () => createOneVariableSweep(INPUT, 'dynLoft', [0]),
    /out-of-domain-spin-loft|no-flight/,
  );
  assert.throws(
    () => createOneVariableSweep({ ...INPUT, dynLoft: 0 }, 'attack', [-15]),
    /no-flight/,
  );
});

test('club labels do not change Guide physics when the five delivery inputs match', () => {
  const driver = resolveGuideContext(contextFor(INPUT, 'driver'));
  const wedge = resolveGuideContext(contextFor(INPUT, 'wedge'));
  assert.equal(driver.status, wedge.status);
  assert.equal(driver.outcome, wedge.outcome);
});
