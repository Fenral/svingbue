import test from 'node:test';
import assert from 'node:assert/strict';
import { SHAPE_CONTENT, SHAPE_CUES } from '../academy-shape-content.js';

test('Shape manifest owns exact identity, prerequisite and six surfaces',()=>{
  assert.equal(SHAPE_CONTENT.experienceId,'shape');assert.deepEqual(SHAPE_CONTENT.conceptIds,['spin-axis','curve']);assert.deepEqual(SHAPE_CONTENT.prerequisiteExperienceIds,['start-line']);assert.deepEqual(SHAPE_CONTENT.surfaces.map(item=>item.id),['mission','lab','influence','myths','mastery','result']);
});

test('five mastery tasks include four knowledge checks and mandatory live transfer',()=>{
  assert.equal(SHAPE_CONTENT.masteryTasks.length,5);assert.deepEqual(SHAPE_CONTENT.masteryTasks.slice(0,4).map(task=>task.answerIndex),[0,0,0,0]);assert.equal(SHAPE_CONTENT.masteryTasks[4].mandatory,true);
});

test('content separates mechanism, amplifier and held or unmodeled boundaries',()=>{
  assert.deepEqual(Object.keys(SHAPE_CONTENT.sheets),['face-to-path','spin-axis','curve','influence','limits']);
  const tags=Object.values(SHAPE_CONTENT.sheets).flatMap(sheet=>sheet.tags);for(const required of ['DEFINITION','≈ REAL WORLD','MODEL','HELD','NOT MODELED'])assert.ok(tags.includes(required),required);
});

test('eight stable Shape cues stay inside the shared word and target contract',()=>{
  assert.equal(SHAPE_CUES.cues.length,8);assert.equal(new Set(SHAPE_CUES.cues.map(cue=>cue.cueId)).size,8);
  for(const cue of SHAPE_CUES.cues){const words=cue.text.trim().split(/\s+/);assert.ok(words.length>=12&&words.length<=24,`${cue.cueId}: ${words.length}`);assert.ok(cue.beats.every(beat=>beat.targetId.startsWith('shape-')));}
});

test('learner copy rejects complete-cause, phone-measurement, Offline mission and dispersion claims',()=>{
  const visible=JSON.stringify(SHAPE_CONTENT);
  for(const pattern of [/caused entirely by Face-to-Path/i,/this phone measured centered contact/i,/wind changed the launch Spin Axis/i,/\bdispersion\b/i,/final Offline mission/i])assert.doesNotMatch(visible,pattern);
  assert.match(visible,/centered contact/i);assert.match(visible,/gear effect/i);assert.match(visible,/Launch Direction line/i);
});
