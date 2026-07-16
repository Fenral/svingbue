import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACADEMY_EXPERIENCES, ACADEMY_GOALS, CONCEPT_OWNER, CORE_EXPERIENCE_IDS,
  experienceById, ownerForConcept, validateAcademyCurriculum
} from '../academy-curriculum.js';

test('outcome registry owns fourteen experiences, thirteen core and twenty-four concepts', () => {
  assert.equal(ACADEMY_EXPERIENCES.length, 14);
  assert.equal(CORE_EXPERIENCE_IDS.length, 13);
  assert.equal(Object.keys(CONCEPT_OWNER).length, 24);
  assert.equal(ACADEMY_EXPERIENCES.filter(item => item.optional).length, 1);
  assert.deepEqual(validateAcademyCurriculum(), { valid:true, errors:[] });
});

test('all legacy concepts have exactly one stable outcome owner', () => {
  assert.equal(ownerForConcept('face-angle'), 'start-line');
  assert.equal(ownerForConcept('backspin'), 'backspin');
  assert.equal(ownerForConcept('temperature'), 'air-density');
  assert.equal(ownerForConcept('plane-coupling'), 'plane-coupling-lab');
  assert.equal(experienceById('backspin').contentVersion, 2);
});

test('goals recommend known core experiences without becoming prerequisites', () => {
  const known = new Set(ACADEMY_EXPERIENCES.map(item => item.id));
  for (const goal of ACADEMY_GOALS) for (const id of goal.experienceIds) assert.ok(known.has(id));
  assert.deepEqual(ACADEMY_GOALS.find(goal => goal.id === 'direction-control').experienceIds, ['start-line','shape','shot-pattern','wind']);
});

test('validator rejects cycles, duplicate concepts and optional core gates', () => {
  const fixtures = ACADEMY_EXPERIENCES.map(item => ({ ...item, conceptIds:[...item.conceptIds], prerequisiteExperienceIds:[...item.prerequisiteExperienceIds] }));
  fixtures[0].prerequisiteExperienceIds = ['shape'];
  fixtures[1].conceptIds = ['face-angle'];
  fixtures[2].prerequisiteExperienceIds = ['plane-coupling-lab'];
  const result = validateAcademyCurriculum(fixtures, ACADEMY_GOALS);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(error => error.startsWith('cycle:')));
  assert.ok(result.errors.some(error => error.startsWith('duplicate-or-missing-concept:')));
  assert.ok(result.errors.some(error => error.startsWith('optional-gates-core:')));
});
