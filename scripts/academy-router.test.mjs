import test from 'node:test';
import assert from 'node:assert/strict';
import { CONCEPT_OWNER } from '../academy-curriculum.js';
import { resolveAcademyRoute } from '../academy-router.js';

test('canonical Academy routes resolve without reading the DOM', () => {
  assert.deepEqual(resolveAcademyRoute('#/academy'), { view:'home', route:'#/academy' });
  assert.deepEqual(resolveAcademyRoute('#/path'), { view:'home', route:'#/academy' });
  assert.deepEqual(resolveAcademyRoute('#/explore'), { view:'explore', route:'#/explore' });
  assert.deepEqual(resolveAcademyRoute('#/experience/backspin/surface/4'), { view:'experience', experienceId:'backspin', conceptId:null, surface:4, legacy:false });
  assert.equal(resolveAcademyRoute('#/experience/backspin/surface/9').view, 'home');
});

test('every legacy concept route resolves to its unique owner', () => {
  for (const [conceptId, experienceId] of Object.entries(CONCEPT_OWNER)) {
    const route = resolveAcademyRoute(`#/lesson/${conceptId}`, { lastSurfaceFor:() => 2 });
    assert.equal(route.view, 'experience');
    assert.equal(route.experienceId, experienceId);
    assert.equal(route.conceptId, conceptId);
    assert.equal(route.surface, 2);
  }
});

test('unknown hashes fall back with a non-blocking diagnostic', () => {
  const route = resolveAcademyRoute('#/lesson/future-unknown');
  assert.equal(route.view, 'home');
  assert.equal(route.invalidHash, '#/lesson/future-unknown');
  assert.match(route.announcement, /not available/i);
});
