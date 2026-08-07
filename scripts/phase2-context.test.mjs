import test from 'node:test';
import assert from 'node:assert/strict';

import { solveFlight } from '../impact-flight.js';
import {
  CONTEXT_KEY,
  buildGuidedShot,
  createDefaultContext,
  deriveNextExperiment,
  readContext,
  rangeInputsFromContext,
  updateContext,
} from '../sa-v1-context.js';
import { applyRangeInputs, guidedModeFromSearch } from '../sa-range-context.js';

const FIXED_NOW = Date.parse('2026-08-06T12:00:00.000Z');
const GUIDED_FIXTURE = Object.freeze({
  club: '7iron',
  start: 'right',
  curve: 'right',
  flight: 'neutral',
});

class MemoryStorage {
  constructor(seed = {}) {
    this.values = new Map(Object.entries(seed));
    this.writes = [];
  }

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }

  setItem(key, value) {
    this.writes.push(key);
    this.values.set(key, String(value));
  }
}

test('the v1 context starts valid, isolated and resumable at step one', () => {
  const first = createDefaultContext();
  const second = createDefaultContext();

  assert.deepEqual(first, {
    version: 1,
    onboarding: {
      complete: false,
      step: 1,
      dismissed: false,
      labLoft: 24,
      goal: null,
      handedness: null,
      experience: null,
      draftShot: {
        club: null,
        start: null,
        curve: null,
        flight: null,
      },
    },
    currentShot: null,
    lastExperiment: null,
    jarvis: {
      selectedQuestionId: null,
      recommendedRoute: null,
    },
  });

  first.onboarding.goal = 'straighter';
  assert.equal(second.onboarding.goal, null, 'defaults must not share nested objects');
});

test('malformed, unavailable and wrong-version storage fail safely', () => {
  for (const storage of [
    new MemoryStorage({ [CONTEXT_KEY]: '{broken' }),
    new MemoryStorage({ [CONTEXT_KEY]: JSON.stringify({ version: 2 }) }),
    {
      getItem() { throw new Error('storage disabled'); },
      setItem() { throw new Error('storage disabled'); },
    },
  ]) {
    assert.deepEqual(readContext(storage), createDefaultContext());
  }
});

test('consecutive updates retain validated in-memory state when storage throws', () => {
  const disabled = {
    getItem() { throw new Error('storage disabled'); },
    setItem() { throw new Error('storage disabled'); },
  };
  const first = updateContext({ onboarding: { step: 2, goal: 'contact' } }, disabled);
  const second = updateContext({ onboarding: { dismissed: true } }, disabled);

  assert.equal(first.onboarding.goal, 'contact');
  assert.equal(second.onboarding.step, 2);
  assert.equal(second.onboarding.goal, 'contact');
  assert.equal(second.onboarding.dismissed, true);
  assert.deepEqual(readContext(disabled), second);
});

test('a stale readable value cannot roll back volatile state after writes fail', () => {
  const stale = createDefaultContext();
  stale.onboarding.goal = 'distance';
  const readableButUnwritable = {
    getItem(key) {
      return key === CONTEXT_KEY ? JSON.stringify(stale) : null;
    },
    setItem() {
      throw new Error('storage became read-only');
    },
  };

  const first = updateContext({ onboarding: { step: 2, goal: 'contact' } }, readableButUnwritable);
  const second = updateContext({ onboarding: { dismissed: true } }, readableButUnwritable);

  assert.equal(first.onboarding.goal, 'contact');
  assert.equal(second.onboarding.step, 2);
  assert.equal(second.onboarding.goal, 'contact');
  assert.equal(second.onboarding.dismissed, true);
  assert.deepEqual(readContext(readableButUnwritable), second);
});

test('updates merge known context fields and never touch Academy storage', () => {
  const academyValue = JSON.stringify({ xp: 420 });
  const storage = new MemoryStorage({ 'strikearc.academy.v1': academyValue });

  const updated = updateContext({
    onboarding: {
      step: 2,
      dismissed: true,
      labLoft: 30,
      goal: 'contact',
      draftShot: { club: '7iron' },
    },
  }, storage);

  assert.equal(updated.onboarding.step, 2);
  assert.equal(updated.onboarding.dismissed, true);
  assert.equal(updated.onboarding.labLoft, 30);
  assert.equal(updated.onboarding.goal, 'contact');
  assert.equal(updated.onboarding.draftShot.club, '7iron');
  assert.deepEqual(storage.writes, [CONTEXT_KEY]);
  assert.equal(storage.getItem('strikearc.academy.v1'), academyValue);
  assert.deepEqual(readContext(storage), updated);
});

test('the onboarding lab persists only values inside its shipping slider', () => {
  const storage = new MemoryStorage();
  assert.equal(updateContext({ onboarding: { labLoft: 30 } }, storage).onboarding.labLoft, 30);
  assert.equal(updateContext({ onboarding: { labLoft: 35 } }, storage).onboarding.labLoft, 24);
  assert.equal(updateContext({ onboarding: { labLoft: 20.5 } }, storage).onboarding.labLoft, 24);
});

test('the guided fixture is deterministic and its visible result comes from solveFlight', () => {
  const first = buildGuidedShot(GUIDED_FIXTURE, FIXED_NOW);
  const second = buildGuidedShot(GUIDED_FIXTURE, FIXED_NOW);
  const engine = solveFlight(first.inputs);

  assert.deepEqual(second, first);
  assert.equal(first.source, 'guided-onboarding');
  assert.equal(first.modelled, true);
  assert.equal(first.createdAt, '2026-08-06T12:00:00.000Z');
  assert.equal(first.result.carryM, Math.round(engine.carry * 0.9144 * 10) / 10);
  assert.equal(first.result.totalM, Math.round(engine.total * 0.9144 * 10) / 10);
  assert.equal(first.result.offlineM, Math.round(engine.offline * 0.9144 * 10) / 10);
  assert.equal(first.result.curveM, Math.round(engine.curve * 0.9144 * 10) / 10);
  assert.equal(first.result.startDirectionDeg, Math.round(engine.startDirection * 10) / 10);
  assert.equal(first.result.shape, engine.shape);
});

test('persisted shot results are rebuilt from bounded inputs before Home can read them', () => {
  const expected = buildGuidedShot(GUIDED_FIXTURE, FIXED_NOW);
  const forged = structuredClone(expected);
  forged.result = {
    shape: 'forged',
    carryM: 999999,
    totalM: -999999,
    offlineM: 123456,
    curveM: -123456,
    startDirectionDeg: 88,
    launchAngleDeg: -88,
    faceToPathDeg: 77,
    // The labels and relationship Home renders are deliberately absent.
  };

  const storage = new MemoryStorage({
    [CONTEXT_KEY]: JSON.stringify({
      ...createDefaultContext(),
      currentShot: forged,
    }),
  });

  const safe = readContext(storage);
  assert.deepEqual(safe.currentShot?.inputs, expected.inputs);
  assert.deepEqual(safe.currentShot?.result, expected.result);
  assert.equal(safe.currentShot?.result.startLabel, 'right');
  assert.equal(safe.currentShot?.result.curveLabel, 'right');
  assert.equal(safe.currentShot?.result.finishLabel, 'right');
  assert.match(safe.currentShot?.result.relationship || '', /^This model starts right/);
});

test('the first experiment changes exactly one Range input', () => {
  const shot = buildGuidedShot(GUIDED_FIXTURE, FIXED_NOW);
  const experiment = deriveNextExperiment(shot);
  const changed = Object.keys(shot.inputs)
    .filter((key) => experiment.inputs[key] !== shot.inputs[key]);

  assert.deepEqual(changed, ['faceAngle']);
  assert.equal(experiment.changeKey, 'faceAngle');
  assert.match(experiment.instruction, /face/i);
  assert.equal(experiment.sourceShotId, shot.id);
});

test('guided Range links accept only explicit shot or experiment modes', () => {
  assert.equal(guidedModeFromSearch('?guided=shot'), 'shot');
  assert.equal(guidedModeFromSearch('?guided=experiment'), 'experiment');
  assert.equal(guidedModeFromSearch('?guided=anything-else'), null);
  assert.equal(guidedModeFromSearch(''), null);
});

test('the stored experiment hydrates the five existing Range inputs', () => {
  const shot = buildGuidedShot(GUIDED_FIXTURE, FIXED_NOW);
  const experiment = deriveNextExperiment(shot);
  const context = {
    ...createDefaultContext(),
    currentShot: shot,
    lastExperiment: experiment,
  };
  const inputs = rangeInputsFromContext(context, true);
  const state = { face: 0, path: 0, attack: 0, dynLoft: 0, speed: 0, station: 2 };
  const speed = {
    textContent: '',
    values: {},
    setAttribute(name, value) { this.values[name] = value; },
  };
  const doc = { getElementById: id => id === 'spVal' ? speed : null };

  assert.equal(applyRangeInputs(state, inputs, doc), true);
  assert.deepEqual(state, {
    face: inputs.faceAngle,
    path: inputs.clubPath,
    attack: inputs.attackAngle,
    dynLoft: inputs.dynamicLoft,
    speed: inputs.clubSpeed,
    station: 2,
  });
  assert.equal(speed.textContent, `${inputs.clubSpeed} mph`);
  assert.deepEqual(speed.values, {}, 'plain visible text does not receive invalid range ARIA');
});

test('persisted Range inputs outside the shipping control domains are rejected', () => {
  const shot = buildGuidedShot(GUIDED_FIXTURE, FIXED_NOW);
  const invalidShot = structuredClone(shot);
  invalidShot.inputs.clubSpeed = 1e308;
  const storage = new MemoryStorage({
    [CONTEXT_KEY]: JSON.stringify({
      ...createDefaultContext(),
      currentShot: invalidShot,
      lastExperiment: deriveNextExperiment(shot),
    }),
  });

  const safe = readContext(storage);
  assert.equal(safe.currentShot, null);
  assert.equal(safe.lastExperiment, null);

  const state = { face: 2, path: 0, attack: 3, dynLoft: 24, speed: 90 };
  assert.equal(applyRangeInputs(state, { ...shot.inputs, clubSpeed: 151 }, null), false);
  assert.deepEqual(state, { face: 2, path: 0, attack: 3, dynLoft: 24, speed: 90 });
});

test('an experiment cannot survive a different current shot', () => {
  const storage = new MemoryStorage();
  const first = buildGuidedShot(GUIDED_FIXTURE, FIXED_NOW);
  const second = buildGuidedShot(
    { club: 'driver', start: 'left', curve: 'straight', flight: 'low' },
    FIXED_NOW + 1,
  );
  updateContext({ currentShot: first, lastExperiment: deriveNextExperiment(first) }, storage);
  const updated = updateContext({ currentShot: second }, storage);

  assert.equal(updated.currentShot.id, second.id);
  assert.equal(updated.lastExperiment, null);
});
