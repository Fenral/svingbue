import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAcademyHomeViewModel } from '../academy-home.js';
import { createAcademySeed } from '../academy-store.js';

const recommendation = { kind:'start', experienceId:'start-line', label:'Start with Start Line', reason:'Ready to begin', route:'#/experience/start-line/surface/0' };

test('Home reports honest thirteen-core progress and one dominant action', () => {
  const store=createAcademySeed(); store.experiences.backspin.status='mastered'; store.experiences.shape.status='practiced'; store.experiences['plane-coupling-lab'].status='practiced';
  const vm=buildAcademyHomeViewModel({ store, recommendation });
  assert.deepEqual(vm.progress, { mastered:1, practiced:1, total:13, label:'1 of 13 core experiences mastered', practicedLabel:'1 practiced' });
  assert.equal(vm.recommendation.label, 'Start with Start Line');
  assert.equal('xp' in vm.recommendation, false);
  assert.equal(vm.optional.optional, true);
  assert.equal(vm.families.flatMap(family=>family.experiences).length,13);
});

test('goal selection changes chooser state without changing progress', () => {
  const store=createAcademySeed(); store.academyHome.goalId='distance';
  const vm=buildAcademyHomeViewModel({ store, recommendation });
  assert.equal(vm.goals.find(goal=>goal.id==='distance').selected,true);
  assert.equal(vm.progress.total,13);
  assert.ok(vm.families.every(family=>family.experiences.every(card=>card.statusText)));
});
