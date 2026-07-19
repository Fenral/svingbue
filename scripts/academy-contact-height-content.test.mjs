import test from 'node:test';
import assert from 'node:assert/strict';
import { CONTACT_HEIGHT_CONTENT, CONTACT_HEIGHT_CUES } from '../academy-contact-height-content.js';
import { countCueWords, validateAcademyCueSet } from '../academy-voice-manifest.js';

test('Contact Height keeps strike-depth identity and Low Point prerequisite',()=>{
  assert.equal(CONTACT_HEIGHT_CONTENT.experienceId,'strike-depth');
  assert.equal(CONTACT_HEIGHT_CONTENT.title,'Contact Height');
  assert.equal(CONTACT_HEIGHT_CONTENT.internalLabel,'Strike Depth');
  assert.deepEqual(CONTACT_HEIGHT_CONTENT.conceptIds,['strike-depth']);
  assert.deepEqual(CONTACT_HEIGHT_CONTENT.prerequisiteExperienceIds,['low-point']);
  assert.equal(CONTACT_HEIGHT_CONTENT.surfaces.length,6);
});

test('five tasks retain four knowledge checks plus mandatory raw live invariance',()=>{
  assert.equal(CONTACT_HEIGHT_CONTENT.masteryTasks.length,5);
  assert.equal(CONTACT_HEIGHT_CONTENT.masteryTasks.filter(task=>task.kind==='choice').length,4);
  assert.equal(CONTACT_HEIGHT_CONTENT.masteryTasks.at(-1).mandatory,true);
  assert.match(CONTACT_HEIGHT_CONTENT.masteryTasks.at(-1).prompt,/1\.0–5\.0 mm/);
  assert.match(CONTACT_HEIGHT_CONTENT.masteryTasks.at(-1).prompt,/22\.0–26\.0 mm/);
});

test('persistent labels distinguish x z Contact Height and Attack',()=>{
  const text=JSON.stringify(CONTACT_HEIGHT_CONTENT);
  for(const phrase of CONTACT_HEIGHT_CONTENT.requiredLabels)assert.ok(text.includes(phrase),phrase);
  assert.match(text,/point on the modeled path/);
  assert.match(text,/Vertical translation changes the first and leaves the second invariant/);
});

test('nine sheets preserve sources and point-model boundaries',()=>{
  assert.equal(Object.keys(CONTACT_HEIGHT_CONTENT.sheets).length,9);
  assert.match(CONTACT_HEIGHT_CONTENT.sheets.ground.body,/cannot simulate/);
  assert.match(CONTACT_HEIGHT_CONTENT.sheets.bands.body,/not.*physical truth/i);
  assert.match(CONTACT_HEIGHT_CONTENT.sheets.face.body,/not that measurement/);
});

test('seven voice cues stay within shared word and target contracts',()=>{
  const report=validateAcademyCueSet(CONTACT_HEIGHT_CUES);
  assert.equal(report.valid,true);assert.equal(report.ownerId,'strike-depth');
  assert.equal(CONTACT_HEIGHT_CUES.cues.length,7);
  for(const cue of CONTACT_HEIGHT_CUES.cues){
    assert.ok(countCueWords(cue.text)>=12&&countCueWords(cue.text)<=24,`${cue.cueId}: ${countCueWords(cue.text)}`);
    assert.ok(cue.beats[0].targetId.startsWith('contact-height-'));
  }
});

test('learner copy never promotes the legacy label or prescribes a swing fix',()=>{
  for(const surface of CONTACT_HEIGHT_CONTENT.surfaces)assert.doesNotMatch(`${surface.title} ${surface.body}`,/Strike Depth/);
  const text=JSON.stringify(CONTACT_HEIGHT_CONTENT);
  for(const unsafe of['move the ball forward','hit down harder','measured face impact','real divot depth','percent energy'])assert.doesNotMatch(text,new RegExp(unsafe,'i'));
});
