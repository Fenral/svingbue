import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ACADEMY_BACKSPIN_CUES } from '../academy-voice-reference-cues.js';
import { experienceById, ownerForConcept } from '../academy-curriculum.js';

const source=readFileSync(new URL('../academy-native-lesson.js',import.meta.url),'utf8');
const host=readFileSync(new URL('../academy.html',import.meta.url),'utf8');

test('Backspin owns Spin Loft and keeps the guided prerequisite contract',()=>{
  const experience=experienceById('backspin');
  assert.deepEqual(experience.conceptIds,['spin-loft','backspin']);
  assert.deepEqual(experience.prerequisiteExperienceIds,['delivered-loft-launch','attack-at-impact']);
  assert.equal(ownerForConcept('spin-loft'),'backspin');
  assert.equal(ownerForConcept('backspin'),'backspin');
});

test('Backspin visible copy states the current-engine causal boundary',()=>{
  for(const required of [
    'Flightglass calculates Backspin as an outcome',
    'does not feed that rpm value back into Carry, Apex or Landing Angle',
    'SPIN LOFT · DIRECT GEOMETRIC DRIVER',
    'BALL SPEED · MULTIPLICATIVE SCALER',
    'FRICTION / STRIKE CONDITIONS · HELD OR NOT MODELED',
    'Both rows are independent gates from this live solveFlight state.'
  ]) assert.match(source,new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i'));
});

test('Backspin removes stopping-flight promises and lesson-hardcoded destinations',()=>{
  assert.doesNotMatch(source,/stopping flight|stopping power|Next:\s*Launch Angle|Back to path/i);
  assert.doesNotMatch(host,/const nextId\s*=\s*['"]launch-angle['"]/i);
  assert.match(source,/Return to current goal/i);
});

test('Backspin result exposes the exact verified evidence and mastery statement',()=>{
  for(const required of [
    'You can build Spin Loft from delivered face and travel, then use Ball Speed to create a requested Backspin state in the Flightglass model.',
    'Spin Loft components separated',
    'Backspin target created live',
    'Landing Angle gate met independently'
  ]) assert.ok(source.includes(required),`Missing: ${required}`);
});

test('Backspin retains all eight approved synchronized voice cues',()=>{
  assert.equal(ACADEMY_BACKSPIN_CUES.cues.length,8);
  assert.deepEqual(ACADEMY_BACKSPIN_CUES.cues.map(cue=>cue.cueId),[
    'academy.backspin.s0.entry','academy.backspin.s1.entry','academy.backspin.s1.build','academy.backspin.s1.cut',
    'academy.backspin.s2.entry','academy.backspin.s3.boundary','academy.backspin.s4.entry','academy.backspin.s5.pass'
  ]);
});
