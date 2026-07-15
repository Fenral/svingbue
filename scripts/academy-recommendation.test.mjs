import test from 'node:test';
import assert from 'node:assert/strict';
import { createAcademySeed } from '../academy-store.js';
import { canEnterMastery, selectAcademyAction } from '../academy-journey-router.js';

const master = (store, id) => {
  const state = store.experiences[id];
  state.status = 'mastered'; state.acceptedAttemptId = `test:${id}`; state.masteredAt = '2026-07-15T00:00:00Z';
  state.evidence.knowledgeBestCorrect = 5; state.evidence.liveTransferPassed = true;
};

test('fresh Home recommends the deterministic first root', () => {
  const action = selectAcademyAction(createAcademySeed());
  assert.deepEqual({ kind:action.kind, id:action.experienceId, route:action.route }, { kind:'start', id:'start-line', route:'#/experience/start-line/surface/0' });
  assert.equal(action.label, 'Start with Start Line');
});

test('latest partial Continue outranks fresh Start', () => {
  const store = createAcademySeed();
  store.academyHome.goalId = 'direction-control';
  store.experiences.shape.status = 'practiced'; store.experiences.shape.surface = 2; store.experiences.shape.lastVisitedAt = '2026-07-15T09:00:00Z';
  const action = selectAcademyAction(store);
  assert.equal(action.kind, 'continue');
  assert.equal(action.experienceId, 'shape');
  assert.match(action.route, /surface\/2$/);
});

test('knowledge-complete live-missing work becomes Repair', () => {
  const store = createAcademySeed();
  store.experiences['start-line'].status = 'practiced';
  store.experiences['start-line'].evidence.knowledgeBestCorrect = 4;
  const action = selectAcademyAction(store);
  assert.equal(action.kind, 'repair');
  assert.equal(action.experienceId, 'start-line');
  assert.equal(action.reasonCode, 'repair');
});

test('migrated full concept evidence becomes Review only when prerequisites permit', () => {
  const store = createAcademySeed();
  store.experiences['start-line'].reviewEligible = true;
  store.experiences['start-line'].status = 'practiced';
  assert.equal(selectAcademyAction(store).kind, 'continue');
  store.experiences['start-line'].status = 'not-started';
  const action = selectAcademyAction(store);
  assert.equal(action.kind, 'review');
});

test('selected goal recommends its earliest unmet prerequisite', () => {
  const store = createAcademySeed();
  store.academyHome.goalId = 'launch-flight';
  master(store, 'attack-at-impact');
  const action = selectAcademyAction(store);
  assert.equal(action.experienceId, 'delivered-loft-launch');
  assert.equal(action.kind, 'start');
});

test('preview is open while mastery reports exact missing prerequisites', () => {
  const gate = canEnterMastery('backspin', createAcademySeed());
  assert.equal(gate.allowed, false);
  assert.deepEqual(gate.missingPrerequisiteIds, ['delivered-loft-launch','attack-at-impact']);
  assert.equal(gate.placementAvailable, true);
});

test('all thirteen core mastered recommends Explore and ignores optional lab', () => {
  const store = createAcademySeed();
  for (const id of Object.keys(store.experiences).filter(id => id !== 'plane-coupling-lab')) master(store, id);
  const action = selectAcademyAction(store);
  assert.equal(action.kind, 'explore');
  assert.equal(action.route, '#/explore');
});
